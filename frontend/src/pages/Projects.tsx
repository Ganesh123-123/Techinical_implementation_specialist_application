import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  IndianRupee,
  User,
  MapPin,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { api, formatINR, formatDate } from '../services/api';
import { Project, TeamMember, ProjectType, ProjectStatus, ProjectHealth } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [healthFilter, setHealthFilter] = useState<string>('All');
  const [designerFilter, setDesignerFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    project_type: 'Residential' as ProjectType,
    project_location: '',
    project_budget: 1500000,
    start_date: new Date().toISOString().split('T')[0],
    expected_handover_date: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
    assigned_designer_id: '' as string | number,
    status: 'Design' as ProjectStatus,
    health: 'On Track' as ProjectHealth,
    progress: 20,
    description: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const [projs, members] = await Promise.all([
        api.getProjects({
          search,
          status: statusFilter,
          project_type: typeFilter,
          health: healthFilter,
          designer_id: designerFilter !== 'All' ? Number(designerFilter) : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        }),
        api.getTeamMembers(),
      ]);
      setProjects(projs);
      setTeamMembers(members);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, typeFilter, healthFilter, designerFilter, sortBy, sortOrder]);

  const handleOpenCreate = () => {
    setFormData({
      project_name: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      project_type: 'Residential',
      project_location: '',
      project_budget: 1500000,
      start_date: new Date().toISOString().split('T')[0],
      expected_handover_date: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
      assigned_designer_id: teamMembers[0]?.id || '',
      status: 'Design',
      health: 'On Track',
      progress: 10,
      description: '',
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setSelectedProject(proj);
    setFormData({
      project_name: proj.project_name,
      client_name: proj.client_name,
      client_email: proj.client_email,
      client_phone: proj.client_phone,
      project_type: proj.project_type,
      project_location: proj.project_location,
      project_budget: proj.project_budget,
      start_date: proj.start_date,
      expected_handover_date: proj.expected_handover_date,
      assigned_designer_id: proj.assigned_designer_id || '',
      status: proj.status,
      health: proj.health,
      progress: proj.progress,
      description: proj.description || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (proj: Project) => {
    setSelectedProject(proj);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Date validation
    if (new Date(formData.expected_handover_date) < new Date(formData.start_date)) {
      setFormError('Expected handover date cannot be earlier than project start date');
      return;
    }

    if (formData.project_budget < 0) {
      setFormError('Budget cannot be negative');
      return;
    }

    try {
      setSubmitting(true);
      await api.createProject({
        ...formData,
        assigned_designer_id: formData.assigned_designer_id ? Number(formData.assigned_designer_id) : undefined,
        project_budget: Number(formData.project_budget),
        progress: Number(formData.progress),
      });
      setIsCreateModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setFormError(null);

    if (new Date(formData.expected_handover_date) < new Date(formData.start_date)) {
      setFormError('Expected handover date cannot be earlier than project start date');
      return;
    }

    try {
      setSubmitting(true);
      await api.updateProject(selectedProject.id, {
        ...formData,
        assigned_designer_id: formData.assigned_designer_id ? Number(formData.assigned_designer_id) : undefined,
        project_budget: Number(formData.project_budget),
        progress: Number(formData.progress),
      });
      setIsEditModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    try {
      setSubmitting(true);
      await api.deleteProject(selectedProject.id);
      setIsDeleteModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const kanbanColumns: ProjectStatus[] = [
    'Consultation',
    'Design',
    'Procurement',
    'Execution',
    'Review',
    'Handover',
    'Completed',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Client Projects Portfolio
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end design lifecycle, handover tracking, and contractor coordination.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Project
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by project name, client, code, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="New Lead">New Lead</option>
            <option value="Consultation">Consultation</option>
            <option value="Design">Design</option>
            <option value="Procurement">Procurement</option>
            <option value="Execution">Execution</option>
            <option value="Review">Review</option>
            <option value="Handover">Handover</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Office">Office</option>
            <option value="Renovation">Renovation</option>
          </select>

          {/* Health Filter */}
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Health</option>
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
            <option value="Delayed">Delayed</option>
          </select>

          {/* Designer Filter */}
          <select
            value={designerFilter}
            onChange={(e) => setDesignerFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Designers</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="created_at">Sort: Date Created</option>
            <option value="start_date">Sort: Start Date</option>
            <option value="expected_handover_date">Sort: Handover Date</option>
            <option value="project_budget">Sort: Budget</option>
            <option value="progress">Sort: Progress %</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Toggle Sort Direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Projects Display */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading projects portfolio...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-slate-500 font-medium">No projects match the selected filters.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
          >
            Create Your First Project
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Code / Project</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Type & Location</th>
                  <th className="py-3 px-4">Budget (INR)</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Designer</th>
                  <th className="py-3 px-4">Status & Health</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {projects.map((proj) => {
                  const isHandoverOverdue =
                    proj.expected_handover_date < todayStr && proj.status !== 'Completed';

                  return (
                    <tr
                      key={proj.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        proj.health === 'At Risk' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                          {proj.project_code}
                        </span>
                        <div className="font-bold text-slate-900 mt-1 text-sm">{proj.project_name}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{proj.client_name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{proj.client_phone}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{proj.project_type}</span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{proj.project_location}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatINR(proj.project_budget)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-500">
                          Start: {formatDate(proj.start_date)}
                        </div>
                        <div
                          className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${
                            isHandoverOverdue ? 'text-rose-600 font-bold animate-pulse' : 'text-slate-800'
                          }`}
                        >
                          {isHandoverOverdue && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                          Handover: {formatDate(proj.expected_handover_date)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {proj.designer ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                              style={{ backgroundColor: proj.designer.avatar_color || '#6366F1' }}
                            >
                              {proj.designer.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[100px] font-medium text-slate-800">
                              {proj.designer.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <StatusBadge status={proj.status} type="status" size="sm" />
                          <div>
                            <StatusBadge status={proj.health} type="health" size="sm" />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 min-w-[100px]">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                          <span>{proj.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              proj.progress === 100
                                ? 'bg-emerald-500'
                                : proj.health === 'At Risk'
                                ? 'bg-amber-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(proj)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(proj)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Project"
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
      ) : (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((colStatus) => {
            const colProjects = projects.filter((p) => p.status === colStatus);

            return (
              <div
                key={colStatus}
                className="w-80 shrink-0 bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[75vh]"
              >
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    {colStatus}
                  </h4>
                  <span className="px-2 py-0.5 bg-white text-slate-700 rounded-full text-[11px] font-bold shadow-2xs">
                    {colProjects.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colProjects.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      No projects in this stage
                    </div>
                  ) : (
                    colProjects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => handleOpenEdit(proj)}
                        className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                            {proj.project_code}
                          </span>
                          <StatusBadge status={proj.health} type="health" size="sm" />
                        </div>

                        <h5 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                          {proj.project_name}
                        </h5>

                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          Client: {proj.client_name}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-800">
                          <span>{formatINR(proj.project_budget)}</span>
                          <span className="text-[11px] text-slate-500">
                            Due: {formatDate(proj.expected_handover_date)}
                          </span>
                        </div>

                        <div className="mt-2.5">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full"
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isCreateModalOpen ? 'Create New Client Project' : `Edit Project: ${selectedProject?.project_code}`}
        subtitle="Specify project scope, INR budget, dates, and assigned interior designer."
        maxWidth="2xl"
      >
        <form onSubmit={isCreateModalOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder="e.g. The Indiranagar Sky Villa"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Client Full Name *</label>
              <input
                type="text"
                required
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="e.g. Rajesh Mehra"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Client Email *</label>
              <input
                type="email"
                required
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                placeholder="rajesh.mehra@gmail.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Client Phone (India) *</label>
              <input
                type="tel"
                required
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                placeholder="+919845011223"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Type *</label>
              <select
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value as ProjectType })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Office">Office</option>
                <option value="Renovation">Renovation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Location (Bengaluru) *</label>
              <input
                type="text"
                required
                value={formData.project_location}
                onChange={(e) => setFormData({ ...formData, project_location: e.target.value })}
                placeholder="e.g. 100 Feet Rd, Indiranagar"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Budget (INR ₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="10000"
                value={formData.project_budget}
                onChange={(e) => setFormData({ ...formData, project_budget: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Interior Designer</label>
              <select
                value={formData.assigned_designer_id}
                onChange={(e) => setFormData({ ...formData, assigned_designer_id: e.target.value })}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Handover Date *</label>
              <input
                type="date"
                required
                value={formData.expected_handover_date}
                onChange={(e) => setFormData({ ...formData, expected_handover_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lifecycle Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="New Lead">New Lead</option>
                <option value="Consultation">Consultation</option>
                <option value="Design">Design</option>
                <option value="Procurement">Procurement</option>
                <option value="Execution">Execution</option>
                <option value="Review">Review</option>
                <option value="Handover">Handover</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Health *
                <span className="text-[10px] text-amber-600 font-normal ml-1">
                  ('At Risk' triggers dashboard alert)
                </span>
              </label>
              <select
                value={formData.health}
                onChange={(e) => setFormData({ ...formData, health: e.target.value as ProjectHealth })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk ⚠️</option>
                <option value="Delayed">Delayed 🛑</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Progress Percentage: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Scope & Notes</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key design details, finish requirements, flooring specs..."
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isCreateModalOpen ? 'Create Project' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Project Confirmation"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-900">{selectedProject?.project_name}</strong> (
            {selectedProject?.project_code})? This will also remove associated tasks and invoice links.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Keep Project
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
