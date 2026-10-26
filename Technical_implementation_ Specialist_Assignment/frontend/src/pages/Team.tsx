import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  FolderKanban,
  CheckSquare,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { api, formatDate } from '../services/api';
import { TeamMember, Project, Task } from '../types';
import { Modal } from '../components/Modal';

export const Team: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Interior Designer',
    email: '',
    phone: '',
    avatar_color: '#4F46E5',
    is_active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const [membersRes, projsRes, tasksRes] = await Promise.all([
        api.getTeamMembers(),
        api.getProjects(),
        api.getTasks(),
      ]);
      setTeamMembers(membersRes);
      setProjects(projsRes);
      setTasks(tasksRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      role: 'Senior Interior Designer',
      email: '',
      phone: '',
      avatar_color: '#F59E0B',
      is_active: true,
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      avatar_color: member.avatar_color || '#4F46E5',
      is_active: member.is_active,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await api.createTeamMember(formData);
      setIsAddModalOpen(false);
      fetchTeamData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setFormError(null);
    try {
      setSubmitting(true);
      await api.updateTeamMember(selectedMember.id, formData);
      setIsEditModalOpen(false);
      fetchTeamData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.name} from active design team?`)) return;
    try {
      await api.deleteTeamMember(member.id);
      fetchTeamData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete team member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Design Studio Team
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your design team roster, update designer names, roles, and project workloads.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          Add Team Member
        </button>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading team roster...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, idx) => {
            const memberProjects = projects.filter((p) => p.assigned_designer_id === member.id);
            const memberTasks = tasks.filter((t) => t.assigned_team_member_id === member.id);
            const pendingTasks = memberTasks.filter((t) => t.status !== 'Completed').length;

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-6 space-y-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: member.avatar_color || '#4F46E5' }}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Designer #{idx + 1}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-amber-700 mt-0.5">{member.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Designer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {teamMembers.length > 3 && (
                      <button
                        onClick={() => handleDelete(member)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Designer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                </div>

                {/* Workload Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Active Projects
                    </span>
                    <p className="text-xl font-black text-amber-950 mt-0.5">
                      {memberProjects.length}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-center">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                      Pending Tasks
                    </span>
                    <p className="text-xl font-black text-indigo-950 mt-0.5">{pendingTasks}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Designer Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Add Design Team Member' : `Edit Designer: ${selectedMember?.name}`}
        subtitle="You can replace default names with your actual interior design studio team."
        maxWidth="md"
      >
        <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Vikram Malhotra"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Role / Specialization *</label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. 3D Visualizer & CAD Specialist"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="designer@sunriseinteriors.in"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+919886012345"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Avatar Accent Color</label>
            <div className="flex items-center gap-3">
              {['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar_color: color })}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    formData.avatar_color === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
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
              {submitting ? 'Saving...' : isAddModalOpen ? 'Add Designer' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
