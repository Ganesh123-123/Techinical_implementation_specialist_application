import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Clock,
  User,
  FolderKanban,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowUpDown,
} from 'lucide-react';
import { api, formatDate } from '../services/api';
import { Task, Project, TeamMember, TaskPriority, TaskStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    related_project_id: '' as string | number,
    assigned_team_member_id: '' as string | number,
    priority: 'Medium' as TaskPriority,
    status: 'To Do' as TaskStatus,
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    completion_date: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [tasksRes, projsRes, teamRes] = await Promise.all([
        api.getTasks({
          search,
          status: statusFilter,
          priority: priorityFilter,
          assignee_id: assigneeFilter !== 'All' ? Number(assigneeFilter) : undefined,
          project_id: projectFilter !== 'All' ? Number(projectFilter) : undefined,
          is_overdue: overdueOnly ? true : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        }),
        api.getProjects(),
        api.getTeamMembers(),
      ]);
      setTasks(tasksRes);
      setProjects(projsRes);
      setTeamMembers(teamRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, statusFilter, priorityFilter, assigneeFilter, projectFilter, overdueOnly, sortBy, sortOrder]);

  const handleOpenCreate = () => {
    setFormData({
      task_name: '',
      description: '',
      related_project_id: projects[0]?.id || '',
      assigned_team_member_id: teamMembers[0]?.id || '',
      priority: 'Medium',
      status: 'To Do',
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      completion_date: '',
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      task_name: task.task_name,
      description: task.description || '',
      related_project_id: task.related_project_id,
      assigned_team_member_id: task.assigned_team_member_id || '',
      priority: task.priority,
      status: task.status,
      start_date: task.start_date,
      due_date: task.due_date,
      completion_date: task.completion_date || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.related_project_id) {
      setFormError('Please select a related client project');
      return;
    }
    setFormError(null);
    try {
      setSubmitting(true);
      await api.createTask({
        ...formData,
        related_project_id: Number(formData.related_project_id),
        assigned_team_member_id: formData.assigned_team_member_id ? Number(formData.assigned_team_member_id) : undefined,
        completion_date: formData.status === 'Completed' ? formData.completion_date || new Date().toISOString().split('T')[0] : undefined,
      });
      setIsCreateModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setFormError(null);
    try {
      setSubmitting(true);
      await api.updateTask(selectedTask.id, {
        ...formData,
        related_project_id: Number(formData.related_project_id),
        assigned_team_member_id: formData.assigned_team_member_id ? Number(formData.assigned_team_member_id) : undefined,
        completion_date: formData.status === 'Completed' ? formData.completion_date || new Date().toISOString().split('T')[0] : undefined,
      });
      setIsEditModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete task "${task.task_name}"?`)) return;
    try {
      await api.deleteTask(task.id);
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const overdueCount = tasks.filter((t) => t.status !== 'Completed' && t.due_date < todayStr).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Design Team Tasks & Deliverables
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Task delegation across 3 interior designers, deadline tracking, and automated overdue monitoring.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Create Task
        </button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Tasks</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{tasks.length}</p>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase">Completed</span>
            <p className="text-2xl font-extrabold text-emerald-800 mt-1">{completedCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-colors ${
            overdueCount > 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-white border-slate-200/80'
          }`}
          onClick={() => setOverdueOnly(!overdueOnly)}
        >
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase">
              Overdue Tasks {overdueOnly && '(Filtered)'}
            </span>
            <p className="text-2xl font-extrabold text-rose-800 mt-1">{overdueCount}</p>
          </div>
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Designers</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700 max-w-[160px]"
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
              </option>
            ))}
          </select>

          {/* Sort By Due Date */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="due_date">Due Date</option>
            <option value="start_date">Start Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Toggle Sort"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Task List Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading design tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-slate-500 font-medium">No tasks found matching current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Task Name & Details</th>
                  <th className="py-3 px-4">Related Project</th>
                  <th className="py-3 px-4">Assigned Designer</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timeline & Due Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tasks.map((task) => {
                  const isOverdue = task.status !== 'Completed' && task.due_date < todayStr;

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {task.task_code}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{task.task_name}</span>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 mt-1 max-w-md line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <FolderKanban className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {task.project?.project_name || 'Project'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                              style={{ backgroundColor: task.assignee.avatar_color || '#6366F1' }}
                            >
                              {task.assignee.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={task.priority} type="priority" size="sm" />
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={task.status} type="status" size="sm" />
                      </td>

                      <td className="py-3 px-4">
                        <div
                          className={`flex items-center gap-1.5 font-semibold ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                          <span>Due: {formatDate(task.due_date)}</span>
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                            Overdue!
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(task)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isCreateModalOpen ? 'Create Design & Site Task' : `Edit Task: ${selectedTask?.task_code}`}
        subtitle="Assign tasks to team designers with priority and deadline."
        maxWidth="lg"
      >
        <form onSubmit={isCreateModalOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Name *</label>
            <input
              type="text"
              required
              value={formData.task_name}
              onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              placeholder="e.g. Italian Marble Slab Selection at Gottigere Yard"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Related Client Project *</label>
            <select
              required
              value={formData.related_project_id}
              onChange={(e) => setFormData({ ...formData, related_project_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_code} - {p.project_name} ({p.client_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Designer *</label>
            <select
              value={formData.assigned_team_member_id}
              onChange={(e) => setFormData({ ...formData, assigned_team_member_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">-- Unassigned --</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent 🔥</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Instructions & Checklist</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key specifications, CAD layers, vendor coordinate details..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isCreateModalOpen ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
