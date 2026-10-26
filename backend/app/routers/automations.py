from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import AutomationRule, Project
from backend.app.schemas import AutomationRuleResponse
from backend.app.services.automation_service import check_and_trigger_project_at_risk, check_and_trigger_overdue_tasks

router = APIRouter(prefix="/api/automations", tags=["Automations"])


@router.get("", response_model=List[AutomationRuleResponse])
def get_automation_rules(db: Session = Depends(get_db)):
    rules = db.query(AutomationRule).all()
    if not rules:
        # Initialize default rules if empty
        default_rules = [
            AutomationRule(
                name="Project At Risk Alert",
                description="Automatically generate an urgent dashboard notification when any client project health is updated to 'At Risk'. Prevents duplicate notifications for the same project.",
                trigger_event="PROJECT_HEALTH_AT_RISK",
                action_type="CREATE_DASHBOARD_NOTIFICATION",
                is_active=True,
            ),
            AutomationRule(
                name="Overdue Task Monitor",
                description="Scan all pending design and site tasks. When due date passes without completion, trigger an alert to the studio owner and assigned designer.",
                trigger_event="TASK_OVERDUE",
                action_type="CREATE_DASHBOARD_NOTIFICATION",
                is_active=True,
            ),
            AutomationRule(
                name="High-Budget Lead Router (n8n Simulation)",
                description="Route incoming leads with estimated budget > ₹5,00,000 to senior design partners with high-priority assignment and instant client confirmation.",
                trigger_event="HIGH_BUDGET_LEAD",
                action_type="NOTIFY_SENIOR_TEAM",
                is_active=True,
            ),
        ]
        db.add_all(default_rules)
        db.commit()
        rules = db.query(AutomationRule).all()
    return rules


@router.patch("/{rule_id}/toggle", response_model=AutomationRuleResponse)
def toggle_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")

    rule.is_active = not rule.is_active
    db.commit()
    db.refresh(rule)
    return rule


@router.post("/run-evaluation")
def run_evaluation(db: Session = Depends(get_db)):
    """Run full automation scan across all projects and tasks."""
    overdue_count = check_and_trigger_overdue_tasks(db)

    at_risk_projects = db.query(Project).filter(Project.health == "At Risk").all()
    at_risk_count = 0
    for proj in at_risk_projects:
        if check_and_trigger_project_at_risk(db, proj):
            at_risk_count += 1

    return {
        "status": "success",
        "message": f"Automation scan evaluated. Created {at_risk_count} project alerts and {overdue_count} overdue task alerts.",
        "at_risk_triggered": at_risk_count,
        "overdue_tasks_triggered": overdue_count,
    }
