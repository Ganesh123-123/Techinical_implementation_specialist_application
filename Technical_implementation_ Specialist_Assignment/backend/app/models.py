from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False, default="Interior Designer")
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=False)
    avatar_color = Column(String(30), default="#4F46E5")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assigned_projects = relationship("Project", back_populates="designer")
    assigned_tasks = relationship("Task", back_populates="assignee")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_code = Column(String(30), unique=True, index=True, nullable=False)
    project_name = Column(String(200), nullable=False)
    client_name = Column(String(150), nullable=False)
    client_email = Column(String(150), nullable=False)
    client_phone = Column(String(30), nullable=False)
    project_type = Column(String(50), nullable=False)  # Residential, Commercial, Office, Renovation
    project_location = Column(String(200), nullable=False)
    project_budget = Column(Float, nullable=False, default=0.0)
    start_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    expected_handover_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    assigned_designer_id = Column(Integer, ForeignKey("team_members.id", ondelete="SET NULL"), nullable=True)
    status = Column(
        String(50),
        nullable=False,
        default="New Lead",
    )  # New Lead, Consultation, Design, Procurement, Execution, Review, Handover, Completed
    health = Column(
        String(30),
        nullable=False,
        default="On Track",
    )  # On Track, At Risk, Delayed
    progress = Column(Integer, nullable=False, default=0)  # 0 to 100
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    designer = relationship("TeamMember", back_populates="assigned_projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="project", cascade="all, delete-orphan")
    converted_leads = relationship("Lead", back_populates="converted_project")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    lead_code = Column(String(30), unique=True, index=True, nullable=False)
    client_name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=False)
    project_type = Column(String(50), nullable=False)  # Residential, Commercial, Office, Renovation
    project_location = Column(String(200), nullable=False)
    project_budget = Column(Float, nullable=False, default=0.0)
    project_requirements = Column(Text, nullable=True)
    lead_status = Column(
        String(50),
        nullable=False,
        default="New",
    )  # New, Contacted, Qualified, Converted, Not Proceeding
    submission_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    converted_project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    converted_project = relationship("Project", back_populates="converted_leads")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    vendor_code = Column(String(30), unique=True, index=True, nullable=False)
    vendor_name = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=True)
    contact_email = Column(String(150), nullable=True)
    contact_phone = Column(String(30), nullable=True)
    category = Column(String(100), nullable=True)  # Civil, Carpentry, Electrical, etc.
    address = Column(String(250), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    invoices = relationship("Invoice", back_populates="vendor", cascade="all, delete-orphan")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_code = Column(String(30), unique=True, index=True, nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)
    related_project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    material_or_service = Column(String(200), nullable=False)
    invoice_number = Column(String(100), nullable=False)  # Vendor-issued invoice number
    invoice_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    payment_due_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    invoice_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, nullable=False, default=0.0)
    outstanding_amount = Column(Float, nullable=False)
    payment_status = Column(
        String(50),
        nullable=False,
        default="Pending",
    )  # Pending, Partially Paid, Paid, Overdue
    payment_reference = Column(String(150), nullable=True)  # UTR, NEFT, Cheque No.
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Unique constraint enforcing duplicate invoice protection at database level
    __table_args__ = (
        UniqueConstraint("vendor_id", "invoice_number", name="uq_vendor_invoice_number"),
    )

    # Relationships
    vendor = relationship("Vendor", back_populates="invoices")
    project = relationship("Project", back_populates="invoices")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(30), unique=True, index=True, nullable=False)
    task_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    related_project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    assigned_team_member_id = Column(Integer, ForeignKey("team_members.id", ondelete="SET NULL"), nullable=True)
    priority = Column(
        String(30),
        nullable=False,
        default="Medium",
    )  # Low, Medium, High, Urgent
    status = Column(
        String(30),
        nullable=False,
        default="To Do",
    )  # To Do, In Progress, Review, Completed
    start_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    due_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    completion_date = Column(String(20), nullable=True)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("TeamMember", back_populates="assigned_tasks")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # project_at_risk, task_overdue, invoice_overdue, system
    related_project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    related_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    trigger_event = Column(String(100), nullable=False)  # PROJECT_HEALTH_AT_RISK, TASK_OVERDUE
    action_type = Column(String(100), nullable=False)  # CREATE_DASHBOARD_NOTIFICATION, SEND_ALERT
    is_active = Column(Boolean, default=True)
    last_triggered_at = Column(DateTime, nullable=True)
    execution_count = Column(Integer, default=0)
