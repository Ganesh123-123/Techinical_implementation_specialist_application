from typing import Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.app.database import get_db
from backend.app.models import Project, Lead, Task, Invoice, Vendor, TeamMember
from backend.app.schemas import DashboardSummaryResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    status: Optional[str] = None,
    project_type: Optional[str] = None,
    designer_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    today = date.today()
    today_str = today.isoformat()
    next_30_days = (today + timedelta(days=30)).isoformat()
    next_7_days = (today + timedelta(days=7)).isoformat()

    # Base project query filtered if applicable
    proj_query = db.query(Project)
    if status and status != "All":
        proj_query = proj_query.filter(Project.status == status)
    if project_type and project_type != "All":
        proj_query = proj_query.filter(Project.project_type == project_type)
    if designer_id:
        proj_query = proj_query.filter(Project.assigned_designer_id == designer_id)

    projects = proj_query.all()
    project_ids = [p.id for p in projects]

    # Total active projects (status != 'Completed')
    total_active_projects = sum(1 for p in projects if p.status != "Completed")
    projects_at_risk = sum(1 for p in projects if p.health == "At Risk")

    # New leads count
    new_leads_count = db.query(Lead).filter(Lead.lead_status == "New").count()

    # Overdue tasks count
    task_query = db.query(Task).filter(Task.status != "Completed", Task.due_date < today_str)
    if project_ids:
        task_query = task_query.filter(Task.related_project_id.in_(project_ids))
    elif projects:
        task_query = task_query.filter(False)
    overdue_tasks_count = task_query.count()

    # Invoices calculations
    inv_query = db.query(Invoice)
    if project_ids:
        inv_query = inv_query.filter(Invoice.related_project_id.in_(project_ids))
    elif projects:
        inv_query = inv_query.filter(False)
    invoices = inv_query.all()

    total_invoiced = sum(inv.invoice_amount for inv in invoices)
    total_paid = sum(inv.amount_paid for inv in invoices)
    total_outstanding = sum(inv.outstanding_amount for inv in invoices)
    overdue_amount = sum(
        inv.outstanding_amount for inv in invoices if inv.payment_due_date < today_str and inv.outstanding_amount > 0
    )
    pending_vendor_invoices_count = sum(1 for inv in invoices if inv.payment_status in ["Pending", "Partially Paid", "Overdue"])

    # Status distribution
    all_statuses = [
        "New Lead",
        "Consultation",
        "Design",
        "Procurement",
        "Execution",
        "Review",
        "Handover",
        "Completed",
    ]
    status_distribution = {s: 0 for s in all_statuses}
    for p in projects:
        if p.status in status_distribution:
            status_distribution[p.status] += 1
        else:
            status_distribution[p.status] = 1

    # Health distribution
    health_distribution = {"On Track": 0, "At Risk": 0, "Delayed": 0}
    for p in projects:
        if p.health in health_distribution:
            health_distribution[p.health] += 1

    # Upcoming project handovers within 30 days
    upcoming_handovers = [
        {
            "id": p.id,
            "project_code": p.project_code,
            "project_name": p.project_name,
            "client_name": p.client_name,
            "date": p.expected_handover_date,
            "type": "Project Handover",
            "progress": p.progress,
            "health": p.health,
        }
        for p in projects
        if p.expected_handover_date and today_str <= p.expected_handover_date <= next_30_days and p.status != "Completed"
    ]

    # Upcoming task deadlines within 7 days
    upcoming_task_objs = (
        db.query(Task)
        .filter(
            Task.status != "Completed",
            Task.due_date >= today_str,
            Task.due_date <= next_7_days,
        )
        .order_by(Task.due_date)
        .limit(10)
        .all()
    )
    upcoming_tasks = [
        {
            "id": t.id,
            "task_code": t.task_code,
            "task_name": t.task_name,
            "project_name": t.project.project_name if t.project else "General",
            "date": t.due_date,
            "type": "Task Due",
            "priority": t.priority,
            "assignee": t.assignee.name if t.assignee else "Unassigned",
        }
        for t in upcoming_task_objs
    ]

    combined_deadlines = sorted(upcoming_handovers + upcoming_tasks, key=lambda x: x["date"])

    # Delayed projects alerts
    delayed_alerts = [
        {
            "id": p.id,
            "project_code": p.project_code,
            "project_name": p.project_name,
            "client_name": p.client_name,
            "expected_handover_date": p.expected_handover_date,
            "health": p.health,
            "status": p.status,
            "progress": p.progress,
            "budget": p.project_budget,
            "designer": p.designer.name if p.designer else "Unassigned",
        }
        for p in projects
        if p.health in ["At Risk", "Delayed"] or (p.expected_handover_date < today_str and p.status != "Completed")
    ]

    # High-budget leads (> ₹5,00,000)
    high_leads = (
        db.query(Lead)
        .filter(Lead.project_budget >= 500000, Lead.lead_status.in_(["New", "Contacted", "Qualified"]))
        .order_by(desc(Lead.project_budget))
        .limit(5)
        .all()
    )
    high_budget_leads = [
        {
            "id": l.id,
            "lead_code": l.lead_code,
            "client_name": l.client_name,
            "project_type": l.project_type,
            "project_location": l.project_location,
            "project_budget": l.project_budget,
            "submission_date": l.submission_date,
            "lead_status": l.lead_status,
        }
        for l in high_leads
    ]

    # Recent activities (constructed from recently updated projects, recent invoices, recent tasks)
    recent_activities = []
    recent_projs = db.query(Project).order_by(desc(Project.updated_at)).limit(4).all()
    for p in recent_projs:
        recent_activities.append({
            "title": f"Project {p.status}: {p.project_name}",
            "description": f"Client: {p.client_name} • Progress: {p.progress}% • Health: {p.health}",
            "timestamp": p.updated_at.isoformat() if p.updated_at else today_str,
            "category": "project",
        })

    recent_invs = db.query(Invoice).order_by(desc(Invoice.created_at)).limit(3).all()
    for inv in recent_invs:
        recent_activities.append({
            "title": f"Invoice {inv.invoice_number} ({inv.payment_status})",
            "description": f"Vendor: {inv.vendor.vendor_name if inv.vendor else 'Vendor'} • Amount: ₹{inv.invoice_amount:,.2f}",
            "timestamp": inv.created_at.isoformat() if inv.created_at else today_str,
            "category": "invoice",
        })

    return {
        "total_active_projects": total_active_projects,
        "new_leads": new_leads_count,
        "projects_at_risk": projects_at_risk,
        "overdue_tasks": overdue_tasks_count,
        "pending_vendor_payments": total_outstanding,
        "pending_vendor_invoices_count": pending_vendor_invoices_count,
        "upcoming_deadlines_count": len(combined_deadlines),
        "status_distribution": status_distribution,
        "health_distribution": health_distribution,
        "recent_activities": recent_activities[:6],
        "upcoming_deadlines": combined_deadlines[:8],
        "vendor_payment_summary": {
            "total_invoiced": total_invoiced,
            "total_paid": total_paid,
            "total_outstanding": total_outstanding,
            "overdue_amount": overdue_amount,
        },
        "high_budget_leads": high_budget_leads,
        "delayed_alerts": delayed_alerts,
    }
