from datetime import datetime, date
from sqlalchemy.orm import Session
from backend.app.models import Notification, AutomationRule, Project, Task


def check_and_trigger_project_at_risk(db: Session, project: Project) -> bool:
    """
    Trigger: A project changes to or is marked as 'At Risk'.
    Action: Create a notification visible in the application dashboard.
    Protection: Avoid repeatedly generating identical alerts for the same event if unread.
    """
    if project.health != "At Risk":
        return False

    # Check if rule is active
    rule = db.query(AutomationRule).filter(AutomationRule.trigger_event == "PROJECT_HEALTH_AT_RISK").first()
    if rule and not rule.is_active:
        return False

    # Check if there is already an unread notification for this project
    existing = (
        db.query(Notification)
        .filter(
            Notification.related_project_id == project.id,
            Notification.notification_type == "project_at_risk",
            Notification.is_read == False,
        )
        .first()
    )

    if existing:
        return False

    notification = Notification(
        title=f"Project At Risk: {project.project_name}",
        message=f"Project '{project.project_name}' ({project.project_code}) is marked At Risk. Budget: ₹{project.project_budget:,.2f}. Please review timeline and contractor deliverables.",
        notification_type="project_at_risk",
        related_project_id=project.id,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notification)

    if rule:
        rule.execution_count += 1
        rule.last_triggered_at = datetime.utcnow()

    db.commit()
    db.refresh(notification)
    return True


def check_and_trigger_overdue_tasks(db: Session) -> int:
    """
    Trigger: A task becomes overdue (due_date < current_date and status != 'Completed').
    Action: Generate an overdue task alert.
    Protection: Avoid duplicate notifications for already alerted unread tasks.
    """
    today_str = date.today().isoformat()

    # Check if rule is active
    rule = db.query(AutomationRule).filter(AutomationRule.trigger_event == "TASK_OVERDUE").first()
    if rule and not rule.is_active:
        return 0

    overdue_tasks = (
        db.query(Task)
        .filter(
            Task.status != "Completed",
            Task.due_date < today_str,
        )
        .all()
    )

    created_count = 0
    for task in overdue_tasks:
        existing = (
            db.query(Notification)
            .filter(
                Notification.related_task_id == task.id,
                Notification.notification_type == "task_overdue",
                Notification.is_read == False,
            )
            .first()
        )
        if not existing:
            proj_name = task.project.project_name if task.project else "Unknown Project"
            notification = Notification(
                title=f"Task Overdue: {task.task_name}",
                message=f"Task '{task.task_name}' for project '{proj_name}' was due on {task.due_date} and is currently overdue. Status: {task.status}.",
                notification_type="task_overdue",
                related_project_id=task.related_project_id,
                related_task_id=task.id,
                is_read=False,
                created_at=datetime.utcnow(),
            )
            db.add(notification)
            created_count += 1

    if created_count > 0 and rule:
        rule.execution_count += created_count
        rule.last_triggered_at = datetime.utcnow()

    if created_count > 0:
        db.commit()

    return created_count
