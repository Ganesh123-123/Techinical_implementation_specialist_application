from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, model_validator


# ==========================================
# Team Member Schemas
# ==========================================
class TeamMemberBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field("Interior Designer", max_length=100)
    email: str = Field(..., max_length=150)
    phone: str = Field(..., max_length=30)
    avatar_color: Optional[str] = "#4F46E5"
    is_active: bool = True


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_color: Optional[str] = None
    is_active: Optional[bool] = None


class TeamMemberResponse(TeamMemberBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Project Schemas
# ==========================================
class ProjectBase(BaseModel):
    project_name: str = Field(..., min_length=2, max_length=200)
    client_name: str = Field(..., min_length=2, max_length=150)
    client_email: str = Field(..., max_length=150)
    client_phone: str = Field(..., max_length=30)
    project_type: str = Field(..., description="Residential, Commercial, Office, Renovation")
    project_location: str = Field(..., max_length=200)
    project_budget: float = Field(..., ge=0, description="Project Budget in INR")
    start_date: str = Field(..., description="YYYY-MM-DD")
    expected_handover_date: str = Field(..., description="YYYY-MM-DD")
    assigned_designer_id: Optional[int] = None
    status: str = Field("New Lead", description="New Lead, Consultation, Design, Procurement, Execution, Review, Handover, Completed")
    health: str = Field("On Track", description="On Track, At Risk, Delayed")
    progress: int = Field(0, ge=0, le=100)
    description: Optional[str] = None

    @field_validator("project_budget")
    @classmethod
    def validate_budget(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Project budget cannot be negative")
        return v

    @model_validator(mode="after")
    def validate_dates(self):
        try:
            start = date.fromisoformat(self.start_date)
            handover = date.fromisoformat(self.expected_handover_date)
            if handover < start:
                raise ValueError("Expected handover date cannot be earlier than project start date")
        except ValueError as e:
            if "handover date cannot be earlier" in str(e):
                raise e
            # Ignore format parsing errors if already handled or non-iso format
        return self


class ProjectCreate(ProjectBase):
    project_code: Optional[str] = None


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    project_type: Optional[str] = None
    project_location: Optional[str] = None
    project_budget: Optional[float] = Field(None, ge=0)
    start_date: Optional[str] = None
    expected_handover_date: Optional[str] = None
    assigned_designer_id: Optional[int] = None
    status: Optional[str] = None
    health: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    description: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    project_code: str
    created_at: datetime
    updated_at: datetime
    designer: Optional[TeamMemberResponse] = None

    class Config:
        from_attributes = True


# ==========================================
# Lead Schemas
# ==========================================
class LeadBase(BaseModel):
    client_name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., max_length=150)
    phone: str = Field(..., max_length=30)
    project_type: str = Field(..., description="Residential, Commercial, Office, Renovation")
    project_location: str = Field(..., max_length=200)
    project_budget: float = Field(..., ge=0)
    project_requirements: Optional[str] = None
    lead_status: str = Field("New", description="New, Contacted, Qualified, Converted, Not Proceeding")
    submission_date: str = Field(..., description="YYYY-MM-DD")


class LeadCreate(LeadBase):
    lead_code: Optional[str] = None


class LeadUpdate(BaseModel):
    client_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    project_type: Optional[str] = None
    project_location: Optional[str] = None
    project_budget: Optional[float] = Field(None, ge=0)
    project_requirements: Optional[str] = None
    lead_status: Optional[str] = None
    submission_date: Optional[str] = None


class LeadConvertRequest(BaseModel):
    assigned_designer_id: Optional[int] = None
    start_date: str
    expected_handover_date: str
    description: Optional[str] = None


class LeadResponse(LeadBase):
    id: int
    lead_code: str
    converted_project_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Vendor Schemas
# ==========================================
class VendorBase(BaseModel):
    vendor_name: str = Field(..., min_length=2, max_length=150)
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None


class VendorCreate(VendorBase):
    vendor_code: Optional[str] = None


class VendorUpdate(BaseModel):
    vendor_name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None


class VendorResponse(VendorBase):
    id: int
    vendor_code: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Invoice Schemas
# ==========================================
class InvoiceBase(BaseModel):
    vendor_id: int
    related_project_id: int
    material_or_service: str = Field(..., min_length=2, max_length=200)
    invoice_number: str = Field(..., min_length=1, max_length=100)
    invoice_date: str = Field(..., description="YYYY-MM-DD")
    payment_due_date: str = Field(..., description="YYYY-MM-DD")
    invoice_amount: float = Field(..., ge=0)
    amount_paid: float = Field(0.0, ge=0)
    payment_reference: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_amounts(self):
        if self.invoice_amount < 0:
            raise ValueError("Invoice amount cannot be negative")
        if self.amount_paid < 0:
            raise ValueError("Amount paid cannot be negative")
        if self.amount_paid > self.invoice_amount:
            raise ValueError("Amount paid cannot exceed invoice amount")
        return self


class InvoiceCreate(InvoiceBase):
    invoice_code: Optional[str] = None


class InvoiceUpdate(BaseModel):
    material_or_service: Optional[str] = None
    invoice_date: Optional[str] = None
    payment_due_date: Optional[str] = None
    invoice_amount: Optional[float] = Field(None, ge=0)
    amount_paid: Optional[float] = Field(None, ge=0)
    payment_reference: Optional[str] = None
    notes: Optional[str] = None


class RecordPaymentRequest(BaseModel):
    additional_payment: float = Field(..., gt=0)
    payment_reference: Optional[str] = None
    notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_code: str
    vendor_id: int
    related_project_id: int
    material_or_service: str
    invoice_number: str
    invoice_date: str
    payment_due_date: str
    invoice_amount: float
    amount_paid: float
    outstanding_amount: float
    payment_status: str
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    vendor: Optional[VendorResponse] = None
    project: Optional[ProjectResponse] = None

    class Config:
        from_attributes = True


# ==========================================
# Task Schemas
# ==========================================
class TaskBase(BaseModel):
    task_name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    related_project_id: int
    assigned_team_member_id: Optional[int] = None
    priority: str = Field("Medium", description="Low, Medium, High, Urgent")
    status: str = Field("To Do", description="To Do, In Progress, Review, Completed")
    start_date: str = Field(..., description="YYYY-MM-DD")
    due_date: str = Field(..., description="YYYY-MM-DD")
    completion_date: Optional[str] = None


class TaskCreate(TaskBase):
    task_code: Optional[str] = None


class TaskUpdate(BaseModel):
    task_name: Optional[str] = None
    description: Optional[str] = None
    assigned_team_member_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    completion_date: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    task_code: str
    created_at: datetime
    project: Optional[ProjectResponse] = None
    assignee: Optional[TeamMemberResponse] = None

    class Config:
        from_attributes = True


# ==========================================
# Notification & Automation Schemas
# ==========================================
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    related_project_id: Optional[int] = None
    related_task_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AutomationRuleResponse(BaseModel):
    id: int
    name: str
    description: str
    trigger_event: str
    action_type: str
    is_active: bool
    last_triggered_at: Optional[datetime] = None
    execution_count: int

    class Config:
        from_attributes = True


# ==========================================
# Dashboard Summary Schema
# ==========================================
class DashboardSummaryResponse(BaseModel):
    total_active_projects: int
    new_leads: int
    projects_at_risk: int
    overdue_tasks: int
    pending_vendor_payments: float
    pending_vendor_invoices_count: int
    upcoming_deadlines_count: int
    status_distribution: dict
    health_distribution: dict
    recent_activities: List[dict]
    upcoming_deadlines: List[dict]
    vendor_payment_summary: dict
    high_budget_leads: List[dict]
    delayed_alerts: List[dict]
