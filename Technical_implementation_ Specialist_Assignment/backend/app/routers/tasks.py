from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from backend.app.database import get_db
from backend.app.models import Task, Project, TeamMember
from backend.app.schemas import TaskCreate, TaskUpdate, TaskResponse
from backend.app.services.automation_service import check_and_trigger_overdue_tasks

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def generate_task_code(db: Session) -> str:
    count = db.query(Task).count()
    return f"TSK-{count + 1:03d}"


@router.get("", response_model=List[TaskResponse])
def get_tasks(
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[int] = None,
    project_id: Optional[int] = None,
    is_overdue: Optional[bool] = None,
    sort_by: str = Query("due_date"),
    sort_order: str = Query("asc"),
    db: Session = Depends(get_db),
):
    # Run overdue check trigger
    check_and_trigger_overdue_tasks(db)

    query = db.query(Task)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Task.task_name.ilike(s))
            | (Task.task_code.ilike(s))
            | (Task.description.ilike(s))
        )

    if status and status != "All":
        query = query.filter(Task.status == status)

    if priority and priority != "All":
        query = query.filter(Task.priority == priority)

    if assignee_id:
        query = query.filter(Task.assigned_team_member_id == assignee_id)

    if project_id:
        query = query.filter(Task.related_project_id == project_id)

    if is_overdue is True:
        today_str = date.today().isoformat()
        query = query.filter(Task.status != "Completed", Task.due_date < today_str)

    order_col = getattr(Task, sort_by, Task.due_date)
    if sort_order == "desc":
        query = query.order_by(desc(order_col))
    else:
        query = query.order_by(asc(order_col))

    return query.all()


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    # Validate project exists
    project = db.query(Project).filter(Project.id == task_in.related_project_id).first()
    if not project:
        raise HTTPException(status_code=400, detail="Related project not found")

    # Validate assignee if provided
    if task_in.assigned_team_member_id:
        assignee = db.query(TeamMember).filter(TeamMember.id == task_in.assigned_team_member_id).first()
        if not assignee:
            raise HTTPException(status_code=400, detail="Assigned team member not found")

    task_code = task_in.task_code or generate_task_code(db)

    completion_date = task_in.completion_date
    if task_in.status == "Completed" and not completion_date:
        completion_date = date.today().isoformat()

    new_task = Task(
        task_code=task_code,
        task_name=task_in.task_name,
        description=task_in.description,
        related_project_id=task_in.related_project_id,
        assigned_team_member_id=task_in.assigned_team_member_id,
        priority=task_in.priority,
        status=task_in.status,
        start_date=task_in.start_date,
        due_date=task_in.due_date,
        completion_date=completion_date,
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Check for overdue
    check_and_trigger_overdue_tasks(db)

    return new_task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_in.assigned_team_member_id is not None:
        if task_in.assigned_team_member_id > 0:
            assignee = db.query(TeamMember).filter(TeamMember.id == task_in.assigned_team_member_id).first()
            if not assignee:
                raise HTTPException(status_code=400, detail="Assigned team member not found")
            task.assigned_team_member_id = task_in.assigned_team_member_id
        else:
            task.assigned_team_member_id = None

    update_data = task_in.model_dump(exclude_unset=True, exclude={"assigned_team_member_id"})
    for key, val in update_data.items():
        setattr(task, key, val)

    if task.status == "Completed" and not task.completion_date:
        task.completion_date = date.today().isoformat()
    elif task.status != "Completed" and task_in.status is not None:
        task.completion_date = None

    db.commit()
    db.refresh(task)

    check_and_trigger_overdue_tasks(db)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return None
