import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';
import { api, formatINR, formatDate } from '../services/api';
import { Lead, TeamMember, ProjectType, LeadStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    phone: '',
    project_type: 'Residential' as ProjectType,
    project_location: '',
    project_budget: 1500000,
    project_requirements: '',
    lead_status: 'New' as LeadStatus,
    submission_date: new Date().toISOString().split('T')[0],
  });

  const [convertData, setConvertData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    expected_handover_date: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
    assigned_designer_id: '' as string | number,
    description: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const [leadsRes, membersRes] = await Promise.all([
        api.getLeads({ search, status: statusFilter, project_type: typeFilter }),
        api.getTeamMembers(),
      ]);
      setLeads(leadsRes);
      setTeamMembers(membersRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, typeFilter]);

  const handleOpenAdd = () => {
    setFormData({
      client_name: '',
      email: '',
      phone: '',
      project_type: 'Residential',
      project_location: '',
      project_budget: 1500000,
      project_requirements: '',
      lead_status: 'New',
      submission_date: new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      client_name: lead.client_name,
      email: lead.email,
      phone: lead.phone,
      project_type: lead.project_type,
      project_location: lead.project_location,
      project_budget: lead.project_budget,
      project_requirements: lead.project_requirements || '',
      lead_status: lead.lead_status,
      submission_date: lead.submission_date,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setConvertData({
      start_date: new Date().toISOString().split('T')[0],
      expected_handover_date: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
      assigned_designer_id: teamMembers[0]?.id || '',
      description: `Converted from lead inquiry (${lead.lead_code}). Requirements: ${lead.project_requirements || 'Standard fit-out'}`,
    });
    setFormError(null);
    setIsConvertModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await api.createLead({
        ...formData,
        project_budget: Number(formData.project_budget),
      });
      setIsAddModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setFormError(null);
    try {
      setSubmitting(true);
      await api.updateLead(selectedLead.id, {
        ...formData,
        project_budget: Number(formData.project_budget),
      });
      setIsEditModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setFormError(null);

    if (new Date(convertData.expected_handover_date) < new Date(convertData.start_date)) {
      setFormError('Handover date cannot be earlier than start date');
      return;
    }

    try {
      setSubmitting(true);
      await api.convertLead(selectedLead.id, {
        start_date: convertData.start_date,
        expected_handover_date: convertData.expected_handover_date,
        assigned_designer_id: convertData.assigned_designer_id ? Number(convertData.assigned_designer_id) : undefined,
        description: convertData.description,
      });
      setIsConvertModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || 'Failed to convert lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Delete lead record for ${lead.client_name}?`)) return;
    try {
      await api.deleteLead(lead.id);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lead');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Client Inquiries & Leads
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Capture prospective interior design clients, qualify project budgets, and convert into active projects.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          Add Lead Manually
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, email, phone, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Lead Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Not Proceeding">Not Proceeding</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Project Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Office">Office</option>
            <option value="Renovation">Renovation</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading leads database...</div>
      ) : leads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-slate-500 font-medium">No leads match the current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Type & Location</th>
                  <th className="py-3 px-4">Est. Budget</th>
                  <th className="py-3 px-4">Requirements</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-amber-700">
                      {lead.lead_code}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">{lead.client_name}</td>

                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{lead.phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{lead.project_type}</span>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{lead.project_location}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatINR(lead.project_budget)}
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {lead.project_requirements || '-'}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={lead.lead_status} type="lead" size="sm" />
                      {lead.converted_project_id && (
                        <div className="text-[10px] text-teal-700 font-medium mt-0.5">
                          Project #{lead.converted_project_id}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500">{formatDate(lead.submission_date)}</td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.lead_status !== 'Converted' ? (
                          <button
                            onClick={() => handleOpenConvert(lead)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Convert to Client Project"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Convert
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-teal-800 bg-teal-50 rounded border border-teal-200">
                            Converted
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenEdit(lead)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Lead"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Lead Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Record Inbound Lead' : `Edit Lead: ${selectedLead?.lead_code}`}
        subtitle="Inquiry captured via studio channels, WhatsApp, or referral."
        maxWidth="lg"
      >
        <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client Full Name *</label>
            <input
              type="text"
              required
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="e.g. Meera Krishnan"
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
                placeholder="client@gmail.com"
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
                placeholder="+919876543210"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Budget (INR ₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="25000"
                value={formData.project_budget}
                onChange={(e) => setFormData({ ...formData, project_budget: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Location in Bengaluru *</label>
            <input
              type="text"
              required
              value={formData.project_location}
              onChange={(e) => setFormData({ ...formData, project_location: e.target.value })}
              placeholder="e.g. Koramangala 4th Block, Bengaluru"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lead Status</label>
              <select
                value={formData.lead_status}
                onChange={(e) => setFormData({ ...formData, lead_status: e.target.value as LeadStatus })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
                <option value="Not Proceeding">Not Proceeding</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Submission Date *</label>
              <input
                type="date"
                required
                value={formData.submission_date}
                onChange={(e) => setFormData({ ...formData, submission_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client Requirements & Scope</label>
            <textarea
              rows={3}
              value={formData.project_requirements}
              onChange={(e) => setFormData({ ...formData, project_requirements: e.target.value })}
              placeholder="e.g. 4BHK apartment renovation, modern Italian kitchen, master bedroom walk-in closet..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
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
              {submitting ? 'Saving...' : isAddModalOpen ? 'Record Lead' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Lead to Project Modal (Requirement 6) */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title={`Convert Lead to Client Project`}
        subtitle={`Preserves ${selectedLead?.lead_code} inquiry record while creating a new active project.`}
        maxWidth="md"
      >
        <form onSubmit={handleConvertSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
            <p>
              <strong className="text-slate-800">Client:</strong> {selectedLead?.client_name}
            </p>
            <p>
              <strong className="text-slate-800">Scope:</strong> {selectedLead?.project_type} in{' '}
              {selectedLead?.project_location}
            </p>
            <p>
              <strong className="text-slate-800">Budget:</strong> {formatINR(selectedLead?.project_budget || 0)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Start Date *</label>
              <input
                type="date"
                required
                value={convertData.start_date}
                onChange={(e) => setConvertData({ ...convertData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Handover Date *</label>
              <input
                type="date"
                required
                value={convertData.expected_handover_date}
                onChange={(e) => setConvertData({ ...convertData, expected_handover_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Interior Designer</label>
            <select
              value={convertData.assigned_designer_id}
              onChange={(e) => setConvertData({ ...convertData, assigned_designer_id: e.target.value })}
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Kickoff Notes</label>
            <textarea
              rows={2}
              value={convertData.description}
              onChange={(e) => setConvertData({ ...convertData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsConvertModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Converting...' : 'Launch Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
