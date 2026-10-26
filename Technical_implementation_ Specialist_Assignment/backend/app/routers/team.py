from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import TeamMember
from backend.app.schemas import TeamMemberCreate, TeamMemberUpdate, TeamMemberResponse

router = APIRouter(prefix="/api/team", tags=["Team"])


@router.get("", response_model=List[TeamMemberResponse])
def get_team_members(db: Session = Depends(get_db)):
    return db.query(TeamMember).filter(TeamMember.is_active == True).order_by(TeamMember.id).all()


@router.get("/{member_id}", response_model=TeamMemberResponse)
def get_team_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member


@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def create_team_member(member_in: TeamMemberCreate, db: Session = Depends(get_db)):
    existing = db.query(TeamMember).filter(TeamMember.email == member_in.email.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team member with this email already exists")

    new_member = TeamMember(
        name=member_in.name.strip(),
        role=member_in.role.strip(),
        email=member_in.email.strip(),
        phone=member_in.phone.strip(),
        avatar_color=member_in.avatar_color or "#4F46E5",
        is_active=member_in.is_active,
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member


@router.put("/{member_id}", response_model=TeamMemberResponse)
def update_team_member(member_id: int, member_in: TeamMemberUpdate, db: Session = Depends(get_db)):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    update_data = member_in.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(member, key, val)

    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    member.is_active = False  # Soft delete to preserve project and task relations
    db.commit()
    return None
