from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.models import Lead, Project, TeamMember
from backend.app.schemas import LeadCreate, LeadUpdate, LeadResponse, LeadConvertRequest, ProjectResponse

router = APIRouter(prefix="/api/leads", tags=["Leads"])


def generate_lead_code(db: Session) -> str:
    count = db.query(Lead).count()
    return f"LED-{count + 1:03d}"


@router.get("", response_model=List[LeadResponse])
def get_leads(
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Lead)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Lead.client_name.ilike(s))
            | (Lead.email.ilike(s))
            | (Lead.phone.ilike(s))
            | (Lead.project_location.ilike(s))
            | (Lead.lead_code.ilike(s))
        )

    if status and status != "All":
        query = query.filter(Lead.lead_status == status)

    if project_type and project_type != "All":
        query = query.filter(Lead.project_type == project_type)

    return query.order_by(desc(Lead.created_at)).all()


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db)):
    # Duplicate submission prevention: check if a lead with same email or phone was created recently and is still active
    existing_dup = (
        db.query(Lead)
        .filter(
            (Lead.email == lead_in.email) | (Lead.phone == lead_in.phone),
            Lead.lead_status.in_(["New", "Contacted", "Qualified"]),
        )
        .first()
    )
    if existing_dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An active lead with this email or phone already exists ({existing_dup.lead_code} - {existing_dup.client_name}).",
        )

    lead_code = lead_in.lead_code or generate_lead_code(db)

    new_lead = Lead(
        lead_code=lead_code,
        client_name=lead_in.client_name,
        email=lead_in.email,
        phone=lead_in.phone,
        project_type=lead_in.project_type,
        project_location=lead_in.project_location,
        project_budget=lead_in.project_budget,
        project_requirements=lead_in.project_requirements,
        lead_status=lead_in.lead_status,
        submission_date=lead_in.submission_date,
    )

    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: int, lead_in: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = lead_in.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(lead, key, val)

    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/convert", response_model=ProjectResponse)
def convert_lead_to_project(
    lead_id: int,
    convert_data: LeadConvertRequest,
    db: Session = Depends(get_db),
):
    """
    Convert a lead into a project.
    Preserves original lead record with lead_status='Converted' and links converted_project_id.
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if lead.lead_status == "Converted" and lead.converted_project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This lead has already been converted to project ID {lead.converted_project_id}.",
        )

    # Generate project code
    proj_count = db.query(Project).count()
    proj_code = f"PRJ-{proj_count + 1:03d}"

    project_name = f"{lead.client_name} - {lead.project_type} Interior"

    new_project = Project(
        project_code=proj_code,
        project_name=project_name,
        client_name=lead.client_name,
        client_email=lead.email,
        client_phone=lead.phone,
        project_type=lead.project_type,
        project_location=lead.project_location,
        project_budget=lead.project_budget,
        start_date=convert_data.start_date,
        expected_handover_date=convert_data.expected_handover_date,
        assigned_designer_id=convert_data.assigned_designer_id,
        status="Consultation",
        health="On Track",
        progress=10,
        description=convert_data.description or lead.project_requirements or "",
    )

    db.add(new_project)
    db.flush()  # get new_project.id

    # Update lead status and preserve link
    lead.lead_status = "Converted"
    lead.converted_project_id = new_project.id

    db.commit()
    db.refresh(new_project)
    return new_project


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    db.delete(lead)
    db.commit()
    return None
