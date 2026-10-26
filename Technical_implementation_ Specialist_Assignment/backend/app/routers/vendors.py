from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.models import Vendor, Invoice, Project
from backend.app.schemas import (
    VendorCreate,
    VendorUpdate,
    VendorResponse,
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    RecordPaymentRequest,
)

router = APIRouter(prefix="/api/vendors", tags=["Vendors & Procurement"])


def compute_payment_status(invoice_amount: float, amount_paid: float, due_date_str: str) -> str:
    """
    Compute payment status according to assignment requirements:
    - Paid: Outstanding == 0
    - Partially Paid: 0 < Amount Paid < Invoice Amount
    - Pending: Amount Paid == 0 and due_date >= today
    - Overdue: Outstanding > 0 and due_date < today
    """
    outstanding = invoice_amount - amount_paid
    if outstanding <= 0:
        return "Paid"

    today_str = date.today().isoformat()
    is_past_due = due_date_str < today_str

    if amount_paid > 0:
        if is_past_due:
            return "Overdue"
        return "Partially Paid"
    else:
        if is_past_due:
            return "Overdue"
        return "Pending"


def generate_vendor_code(db: Session) -> str:
    count = db.query(Vendor).count()
    return f"VND-{count + 1:03d}"


def generate_invoice_code(db: Session) -> str:
    count = db.query(Invoice).count()
    return f"INV-{count + 1:03d}"


# ==========================================
# Vendor Endpoints
# ==========================================
@router.get("", response_model=List[VendorResponse])
def get_vendors(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Vendor)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Vendor.vendor_name.ilike(s))
            | (Vendor.vendor_code.ilike(s))
            | (Vendor.contact_person.ilike(s))
            | (Vendor.category.ilike(s))
        )
    return query.order_by(Vendor.vendor_name).all()


@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.post("", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(vendor_in: VendorCreate, db: Session = Depends(get_db)):
    # Check if vendor with exact same name already exists
    existing = db.query(Vendor).filter(Vendor.vendor_name.ilike(vendor_in.vendor_name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Vendor with name '{vendor_in.vendor_name}' already exists ({existing.vendor_code}).",
        )

    vendor_code = vendor_in.vendor_code or generate_vendor_code(db)
    vendor = Vendor(
        vendor_code=vendor_code,
        vendor_name=vendor_in.vendor_name.strip(),
        contact_person=vendor_in.contact_person,
        contact_email=vendor_in.contact_email,
        contact_phone=vendor_in.contact_phone,
        category=vendor_in.category,
        address=vendor_in.address,
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: int, vendor_in: VendorUpdate, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    update_data = vendor_in.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(vendor, key, val)

    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    db.delete(vendor)
    db.commit()
    return None


# ==========================================
# Invoice & Procurement Endpoints
# ==========================================
@router.get("/invoices/all", response_model=List[InvoiceResponse])
def get_invoices(
    search: Optional[str] = None,
    payment_status: Optional[str] = None,
    vendor_id: Optional[int] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    # Auto-refresh overdue status for outstanding invoices
    today_str = date.today().isoformat()
    all_invoices = db.query(Invoice).all()
    status_updated = False
    for inv in all_invoices:
        calc_status = compute_payment_status(inv.invoice_amount, inv.amount_paid, inv.payment_due_date)
        if inv.payment_status != calc_status:
            inv.payment_status = calc_status
            status_updated = True
    if status_updated:
        db.commit()

    query = db.query(Invoice)

    if search:
        s = f"%{search.strip()}%"
        query = query.join(Vendor).filter(
            (Invoice.invoice_number.ilike(s))
            | (Invoice.invoice_code.ilike(s))
            | (Invoice.material_or_service.ilike(s))
            | (Vendor.vendor_name.ilike(s))
        )

    if payment_status and payment_status != "All":
        query = query.filter(Invoice.payment_status == payment_status)

    if vendor_id:
        query = query.filter(Invoice.vendor_id == vendor_id)

    if project_id:
        query = query.filter(Invoice.related_project_id == project_id)

    return query.order_by(desc(Invoice.invoice_date)).all()


@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(invoice_in: InvoiceCreate, db: Session = Depends(get_db)):
    # 1. Validate vendor exists
    vendor = db.query(Vendor).filter(Vendor.id == invoice_in.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=400, detail="Vendor does not exist")

    # 2. Validate related project exists
    project = db.query(Project).filter(Project.id == invoice_in.related_project_id).first()
    if not project:
        raise HTTPException(status_code=400, detail="Related project does not exist")

    # 3. Explicit duplicate invoice pre-check
    normalized_inv_num = invoice_in.invoice_number.strip()
    existing_dup = (
        db.query(Invoice)
        .filter(
            Invoice.vendor_id == invoice_in.vendor_id,
            Invoice.invoice_number.ilike(normalized_inv_num),
        )
        .first()
    )
    if existing_dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate invoice detected: Invoice number '{normalized_inv_num}' already exists for vendor '{vendor.vendor_name}' (Record: {existing_dup.invoice_code}).",
        )

    # 4. Compute outstanding and status
    outstanding = round(invoice_in.invoice_amount - invoice_in.amount_paid, 2)
    payment_status = compute_payment_status(
        invoice_in.invoice_amount, invoice_in.amount_paid, invoice_in.payment_due_date
    )

    invoice_code = invoice_in.invoice_code or generate_invoice_code(db)

    new_invoice = Invoice(
        invoice_code=invoice_code,
        vendor_id=invoice_in.vendor_id,
        related_project_id=invoice_in.related_project_id,
        material_or_service=invoice_in.material_or_service,
        invoice_number=normalized_inv_num,
        invoice_date=invoice_in.invoice_date,
        payment_due_date=invoice_in.payment_due_date,
        invoice_amount=invoice_in.invoice_amount,
        amount_paid=invoice_in.amount_paid,
        outstanding_amount=outstanding,
        payment_status=payment_status,
        payment_reference=invoice_in.payment_reference,
        notes=invoice_in.notes,
    )

    try:
        db.add(new_invoice)
        db.commit()
        db.refresh(new_invoice)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Database constraint violation: Invoice number '{normalized_inv_num}' already exists for vendor '{vendor.vendor_name}'.",
        )

    return new_invoice


@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(invoice_id: int, invoice_in: InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    amount = invoice_in.invoice_amount if invoice_in.invoice_amount is not None else invoice.invoice_amount
    paid = invoice_in.amount_paid if invoice_in.amount_paid is not None else invoice.amount_paid

    if paid > amount:
        raise HTTPException(status_code=400, detail="Amount paid cannot exceed invoice amount")

    due_date = invoice_in.payment_due_date or invoice.payment_due_date
    invoice.invoice_amount = amount
    invoice.amount_paid = paid
    invoice.outstanding_amount = round(amount - paid, 2)
    invoice.payment_status = compute_payment_status(amount, paid, due_date)

    if invoice_in.material_or_service is not None:
        invoice.material_or_service = invoice_in.material_or_service
    if invoice_in.invoice_date is not None:
        invoice.invoice_date = invoice_in.invoice_date
    if invoice_in.payment_due_date is not None:
        invoice.payment_due_date = invoice_in.payment_due_date
    if invoice_in.payment_reference is not None:
        invoice.payment_reference = invoice_in.payment_reference
    if invoice_in.notes is not None:
        invoice.notes = invoice_in.notes

    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/invoices/{invoice_id}/pay", response_model=InvoiceResponse)
def record_payment(
    invoice_id: int,
    payment_in: RecordPaymentRequest,
    db: Session = Depends(get_db),
):
    """Record an incremental payment against an invoice."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    new_amount_paid = invoice.amount_paid + payment_in.additional_payment
    if new_amount_paid > invoice.invoice_amount:
        max_allowed = invoice.invoice_amount - invoice.amount_paid
        raise HTTPException(
            status_code=400,
            detail=f"Payment exceeds invoice total. Maximum remaining payable is ₹{max_allowed:,.2f}.",
        )

    invoice.amount_paid = new_amount_paid
    invoice.outstanding_amount = round(invoice.invoice_amount - new_amount_paid, 2)
    invoice.payment_status = compute_payment_status(
        invoice.invoice_amount, invoice.amount_paid, invoice.payment_due_date
    )

    if payment_in.payment_reference:
        invoice.payment_reference = payment_in.payment_reference
    if payment_in.notes:
        invoice.notes = f"{invoice.notes or ''}\n[Payment on {date.today().isoformat()}]: {payment_in.notes}".strip()

    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    db.delete(invoice)
    db.commit()
    return None
