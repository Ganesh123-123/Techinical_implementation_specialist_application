import {
  Project,
  Lead,
  Vendor,
  Invoice,
  Task,
  TeamMember,
  Notification,
  AutomationRule,
  DashboardSummary,
} from '../types';

const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE = getApiBase();

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch {
      // Ignore JSON parse error on non-json body
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

// Format currency in Indian numbering system (Lakhs & Crores)
export function formatINR(amount: number): string {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export const api = {
  // Dashboard
  getDashboardSummary: (params?: { status?: string; project_type?: string; designer_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.project_type) q.append('project_type', params.project_type);
    if (params?.designer_id) q.append('designer_id', String(params.designer_id));
    return request<DashboardSummary>(`/dashboard/summary?${q.toString()}`);
  },

  // Projects
  getProjects: (params?: {
    search?: string;
    status?: string;
    project_type?: string;
    health?: string;
    designer_id?: number;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.project_type) q.append('project_type', params.project_type);
    if (params?.health) q.append('health', params.health);
    if (params?.designer_id) q.append('designer_id', String(params.designer_id));
    if (params?.sort_by) q.append('sort_by', params.sort_by);
    if (params?.sort_order) q.append('sort_order', params.sort_order);
    return request<Project[]>(`/projects?${q.toString()}`);
  },

  getProject: (id: number) => request<Project>(`/projects/${id}`),
  createProject: (data: Partial<Project>) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: number) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Leads
  getLeads: (params?: { search?: string; status?: string; project_type?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.project_type) q.append('project_type', params.project_type);
    return request<Lead[]>(`/leads?${q.toString()}`);
  },

  createLead: (data: Partial<Lead>) =>
    request<Lead>('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id: number, data: Partial<Lead>) =>
    request<Lead>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  convertLead: (id: number, data: { start_date: string; expected_handover_date: string; assigned_designer_id?: number; description?: string }) =>
    request<Project>(`/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),
  deleteLead: (id: number) => request<void>(`/leads/${id}`, { method: 'DELETE' }),

  // Vendors & Invoices
  getVendors: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Vendor[]>(`/vendors${q}`);
  },
  createVendor: (data: Partial<Vendor>) =>
    request<Vendor>('/vendors', { method: 'POST', body: JSON.stringify(data) }),
  updateVendor: (id: number, data: Partial<Vendor>) =>
    request<Vendor>(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVendor: (id: number) => request<void>(`/vendors/${id}`, { method: 'DELETE' }),

  getInvoices: (params?: { search?: string; payment_status?: string; vendor_id?: number; project_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.payment_status) q.append('payment_status', params.payment_status);
    if (params?.vendor_id) q.append('vendor_id', String(params.vendor_id));
    if (params?.project_id) q.append('project_id', String(params.project_id));
    return request<Invoice[]>(`/vendors/invoices/all?${q.toString()}`);
  },
  createInvoice: (data: Partial<Invoice>) =>
    request<Invoice>('/vendors/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: number, data: Partial<Invoice>) =>
    request<Invoice>(`/vendors/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  recordPayment: (id: number, data: { additional_payment: number; payment_reference?: string; notes?: string }) =>
    request<Invoice>(`/vendors/invoices/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),
  deleteInvoice: (id: number) => request<void>(`/vendors/invoices/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params?: {
    search?: string;
    status?: string;
    priority?: string;
    assignee_id?: number;
    project_id?: number;
    is_overdue?: boolean;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.priority) q.append('priority', params.priority);
    if (params?.assignee_id) q.append('assignee_id', String(params.assignee_id));
    if (params?.project_id) q.append('project_id', String(params.project_id));
    if (params?.is_overdue !== undefined) q.append('is_overdue', String(params.is_overdue));
    if (params?.sort_by) q.append('sort_by', params.sort_by);
    if (params?.sort_order) q.append('sort_order', params.sort_order);
    return request<Task[]>(`/tasks?${q.toString()}`);
  },
  createTask: (data: Partial<Task>) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: number, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  // Team
  getTeamMembers: () => request<TeamMember[]>('/team'),
  createTeamMember: (data: Partial<TeamMember>) =>
    request<TeamMember>('/team', { method: 'POST', body: JSON.stringify(data) }),
  updateTeamMember: (id: number, data: Partial<TeamMember>) =>
    request<TeamMember>(`/team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeamMember: (id: number) => request<void>(`/team/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: (unreadOnly = false) =>
    request<Notification[]>(`/notifications?unread_only=${unreadOnly}`),
  getUnreadCount: () => request<{ unread_count: number }>('/notifications/unread-count'),
  markNotificationRead: (id: number) =>
    request<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/mark-all-read', { method: 'POST' }),

  // Automations
  getAutomationRules: () => request<AutomationRule[]>('/automations'),
  toggleAutomationRule: (id: number) =>
    request<AutomationRule>(`/automations/${id}/toggle`, { method: 'PATCH' }),
  runAutomationEvaluation: () =>
    request<{ status: string; message: string; at_risk_triggered: number; overdue_tasks_triggered: number }>('/automations/run-evaluation', { method: 'POST' }),

  // Lead Cleaning Workbench
  getCleaningStatus: () => request<any>('/clean-leads/status'),
  previewCleaningFiles: () => request<any>('/clean-leads/preview'),
  executeLeadCleaning: () => request<any>('/clean-leads/execute', { method: 'POST' }),
  customCleanLeads: (leads: Array<{ Name: string; Phone: string }>) =>
    request<any>('/clean-leads/custom', { method: 'POST', body: JSON.stringify({ leads }) }),
};
