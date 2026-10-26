export interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar_color?: string;
  is_active: boolean;
  created_at: string;
}

export type ProjectType = 'Residential' | 'Commercial' | 'Office' | 'Renovation';
export type ProjectStatus = 'New Lead' | 'Consultation' | 'Design' | 'Procurement' | 'Execution' | 'Review' | 'Handover' | 'Completed';
export type ProjectHealth = 'On Track' | 'At Risk' | 'Delayed';

export interface Project {
  id: number;
  project_code: string;
  project_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  project_type: ProjectType;
  project_location: string;
  project_budget: number;
  start_date: string;
  expected_handover_date: string;
  assigned_designer_id?: number | null;
  status: ProjectStatus;
  health: ProjectHealth;
  progress: number;
  description?: string;
  created_at: string;
  updated_at: string;
  designer?: TeamMember | null;
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Not Proceeding';

export interface Lead {
  id: number;
  lead_code: string;
  client_name: string;
  email: string;
  phone: string;
  project_type: ProjectType;
  project_location: string;
  project_budget: number;
  project_requirements?: string;
  lead_status: LeadStatus;
  submission_date: string;
  converted_project_id?: number | null;
  created_at: string;
}

export interface Vendor {
  id: number;
  vendor_code: string;
  vendor_name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  category?: string;
  address?: string;
  created_at: string;
}

export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface Invoice {
  id: number;
  invoice_code: string;
  vendor_id: number;
  related_project_id: number;
  material_or_service: string;
  invoice_number: string;
  invoice_date: string;
  payment_due_date: string;
  invoice_amount: number;
  amount_paid: number;
  outstanding_amount: number;
  payment_status: PaymentStatus;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  vendor?: Vendor;
  project?: Project;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Completed';

export interface Task {
  id: number;
  task_code: string;
  task_name: string;
  description?: string;
  related_project_id: number;
  assigned_team_member_id?: number | null;
  priority: TaskPriority;
  status: TaskStatus;
  start_date: string;
  due_date: string;
  completion_date?: string | null;
  created_at: string;
  project?: Project;
  assignee?: TeamMember;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'project_at_risk' | 'task_overdue' | 'invoice_overdue' | 'system';
  related_project_id?: number | null;
  related_task_id?: number | null;
  is_read: boolean;
  created_at: string;
}

export interface AutomationRule {
  id: number;
  name: string;
  description: string;
  trigger_event: string;
  action_type: string;
  is_active: boolean;
  last_triggered_at?: string | null;
  execution_count: number;
}

export interface DashboardSummary {
  total_active_projects: number;
  new_leads: number;
  projects_at_risk: number;
  overdue_tasks: number;
  pending_vendor_payments: number;
  pending_vendor_invoices_count: number;
  upcoming_deadlines_count: number;
  status_distribution: Record<string, number>;
  health_distribution: Record<string, number>;
  recent_activities: Array<{
    title: string;
    description: string;
    timestamp: string;
    category: string;
  }>;
  upcoming_deadlines: Array<{
    id: number;
    project_code?: string;
    task_code?: string;
    project_name?: string;
    task_name?: string;
    client_name?: string;
    date: string;
    type: string;
    progress?: number;
    health?: string;
    priority?: string;
    assignee?: string;
  }>;
  vendor_payment_summary: {
    total_invoiced: number;
    total_paid: number;
    total_outstanding: number;
    overdue_amount: number;
  };
  high_budget_leads: Array<{
    id: number;
    lead_code: string;
    client_name: string;
    project_type: string;
    project_location: string;
    project_budget: number;
    submission_date: string;
    lead_status: string;
  }>;
  delayed_alerts: Array<{
    id: number;
    project_code: string;
    project_name: string;
    client_name: string;
    expected_handover_date: string;
    health: string;
    status: string;
    progress: number;
    budget: number;
    designer: string;
  }>;
}
