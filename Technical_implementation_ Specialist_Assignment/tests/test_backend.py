import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import Base, engine, SessionLocal
from backend.app.models import TeamMember, Project, Vendor, Invoice, Task

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_get_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_active_projects" in data
    assert "new_leads" in data
    assert "pending_vendor_payments" in data
    assert "status_distribution" in data
    assert "health_distribution" in data
    assert isinstance(data["total_active_projects"], int)


def test_duplicate_invoice_protection():
    # 1. Fetch existing vendor and project
    vendors_resp = client.get("/api/vendors")
    assert vendors_resp.status_code == 200
    vendors = vendors_resp.json()
    assert len(vendors) > 0
    vendor_id = vendors[0]["id"]

    projects_resp = client.get("/api/projects")
    assert projects_resp.status_code == 200
    projects = projects_resp.json()
    assert len(projects) > 0
    project_id = projects[0]["id"]

    inv_num = "DUP-TEST-999"

    # Create first invoice
    payload = {
        "vendor_id": vendor_id,
        "related_project_id": project_id,
        "material_or_service": "Hardware & Architectural Handles",
        "invoice_number": inv_num,
        "invoice_date": "2026-10-01",
        "payment_due_date": "2026-10-20",
        "invoice_amount": 50000.0,
        "amount_paid": 20000.0,
        "payment_reference": "TXN-001",
        "notes": "First submission",
    }
    r1 = client.post("/api/vendors/invoices", json=payload)
    assert r1.status_code in [201, 409]  # If already exists or created

    # Attempt to create duplicate invoice with same vendor and same invoice number
    r2 = client.post("/api/vendors/invoices", json=payload)
    assert r2.status_code == 409
    assert "Duplicate invoice detected" in r2.json()["detail"] or "already exists" in r2.json()["detail"]


def test_invoice_amount_validations():
    vendors_resp = client.get("/api/vendors")
    vendor_id = vendors_resp.json()[0]["id"]
    project_id = client.get("/api/projects").json()[0]["id"]

    # Amount paid greater than invoice amount should fail
    invalid_payload = {
        "vendor_id": vendor_id,
        "related_project_id": project_id,
        "material_or_service": "Timber",
        "invoice_number": "INV-VAL-001",
        "invoice_date": "2026-10-01",
        "payment_due_date": "2026-10-20",
        "invoice_amount": 10000.0,
        "amount_paid": 15000.0,  # Invalid!
    }
    r = client.post("/api/vendors/invoices", json=invalid_payload)
    assert r.status_code == 422


def test_project_at_risk_automation_trigger():
    # Create a project with health 'At Risk'
    payload = {
        "project_name": "Test Penthouse Whitefield",
        "client_name": "Siddharth Rao",
        "client_email": "sid.rao@gmail.com",
        "client_phone": "+919845099881",
        "project_type": "Residential",
        "project_location": "Whitefield, Bengaluru",
        "project_budget": 4500000.0,
        "start_date": "2026-09-01",
        "expected_handover_date": "2026-12-01",
        "status": "Execution",
        "health": "At Risk",
        "progress": 35,
        "description": "Testing automation trigger on At Risk status.",
    }
    r = client.post("/api/projects", json=payload)
    assert r.status_code == 201
    proj_data = r.json()

    # Verify notification created
    notifs_resp = client.get("/api/notifications")
    assert notifs_resp.status_code == 200
    notifs = notifs_resp.json()
    at_risk_notif = any(
        n["related_project_id"] == proj_data["id"] and n["notification_type"] == "project_at_risk"
        for n in notifs
    )
    assert at_risk_notif is True


def test_lead_conversion():
    # 1. Create a lead
    lead_payload = {
        "client_name": "Meera Krishnan",
        "email": "meera.krishnan@outlook.com",
        "phone": "+919876543299",
        "project_type": "Residential",
        "project_location": "Indiranagar, Bengaluru",
        "project_budget": 2500000.0,
        "project_requirements": "Complete 3BHK home interior with pooja room and modular kitchen",
        "lead_status": "Qualified",
        "submission_date": "2026-10-15",
    }
    r_lead = client.post("/api/leads", json=lead_payload)
    assert r_lead.status_code in [201, 409]
    if r_lead.status_code == 201:
        lead_id = r_lead.json()["id"]

        # 2. Convert to project
        convert_payload = {
            "start_date": "2026-11-01",
            "expected_handover_date": "2027-02-15",
            "description": "Converted from website lead inquiry.",
        }
        r_conv = client.post(f"/api/leads/{lead_id}/convert", json=convert_payload)
        assert r_conv.status_code == 200
        proj_data = r_conv.json()
        assert proj_data["client_name"] == "Meera Krishnan"
        assert proj_data["project_budget"] == 2500000.0

        # Verify lead status updated to Converted and preserved link
        r_lead_check = client.get(f"/api/leads/{lead_id}")
        assert r_lead_check.status_code == 200
        assert r_lead_check.json()["lead_status"] == "Converted"
        assert r_lead_check.json()["converted_project_id"] == proj_data["id"]
