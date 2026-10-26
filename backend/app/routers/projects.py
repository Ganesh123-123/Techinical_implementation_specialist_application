from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from backend.app.database import get_db
from backend.app.models import Project, TeamMember
from backend.app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from backend.app.services.automation_service import check_and_trigger_project_at_risk

router = APIRouter(prefix="/api/projects", tags=["Projects"])


def generate_project_code(db: Session) -> str:
    count = db.query(Project).count()
    return f"PRJ-{count + 1:03d}"


@router.get("", response_model=List[ProjectResponse])
def get_projects(
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_type: Optional[str] = None,
    health: Optional[str] = None,
    designer_id: Optional[int] = None,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
):
    query = db.query(Project)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Project.project_name.ilike(s))
            | (Project.client_name.ilike(s))
            | (Project.project_code.ilike(s))
            | (Project.project_location.ilike(s))
        )

    if status and status != "All":
        query = query.filter(Project.status == status)

    if project_type and project_type != "All":
        query = query.filter(Project.project_type == project_type)

    if health and health != "All":
        query = query.filter(Project.health == health)

    if designer_id:
        query = query.filter(Project.assigned_designer_id == designer_id)

    order_col = getattr(Project, sort_by, Project.created_at)
    if sort_order == "desc":
        query = query.order_by(desc(order_col))
    else:
        query = query.order_by(asc(order_col))

    return query.all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    project_code = project_in.project_code or generate_project_code(db)

    # Check if designer exists if specified
    if project_in.assigned_designer_id:
        designer = db.query(TeamMember).filter(TeamMember.id == project_in.assigned_designer_id).first()
        if not designer:
            raise HTTPException(status_code=400, detail="Assigned designer not found")

    new_project = Project(
        project_code=project_code,
        project_name=project_in.project_name,
        client_name=project_in.client_name,
        client_email=project_in.client_email,
        client_phone=project_in.client_phone,
        project_type=project_in.project_type,
        project_location=project_in.project_location,
        project_budget=project_in.project_budget,
        start_date=project_in.start_date,
        expected_handover_date=project_in.expected_handover_date,
        assigned_designer_id=project_in.assigned_designer_id,
        status=project_in.status,
        health=project_in.health,
        progress=project_in.progress,
        description=project_in.description,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Internal automation check: If health is 'At Risk'
    check_and_trigger_project_at_risk(db, new_project)

    return new_project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project_in.assigned_designer_id is not None:
        if project_in.assigned_designer_id > 0:
            designer = db.query(TeamMember).filter(TeamMember.id == project_in.assigned_designer_id).first()
            if not designer:
                raise HTTPException(status_code=400, detail="Assigned designer not found")
            project.assigned_designer_id = project_in.assigned_designer_id
        else:
            project.assigned_designer_id = None

    old_health = project.health

    update_data = project_in.model_dump(exclude_unset=True, exclude={"assigned_designer_id"})
    for key, val in update_data.items():
        setattr(project, key, val)

    db.commit()
    db.refresh(project)

    # Internal automation check: If health transitioned to 'At Risk'
    if project.health == "At Risk" and old_health != "At Risk":
        check_and_trigger_project_at_risk(db, project)

    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return None
