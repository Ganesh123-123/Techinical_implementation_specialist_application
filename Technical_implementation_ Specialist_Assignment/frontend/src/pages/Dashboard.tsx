import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  UserPlus,
  AlertTriangle,
  Clock,
  IndianRupee,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api, formatINR, formatDate } from '../services/api';
import { DashboardSummary, TeamMember } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [designerFilter, setDesignerFilter] = useState<string>('All');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, teamRes] = await Promise.all([
        api.getDashboardSummary({
          status: statusFilter,
          project_type: typeFilter,
          designer_id: designerFilter !== 'All' ? Number(designerFilter) : undefined,
        }),
        api.getTeamMembers(),
      ]);
      setSummary(summaryRes);
      setTeamMembers(teamRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, typeFilter, designerFilter]);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm font-medium">Aggregating live studio operations data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">Error Loading Dashboard</h4>
          <p className="text-xs mt-1">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-3 px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8">
      {/* Studio Header & Dynamic Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Executive Studio Overview
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Active Operations
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status of interior architecture projects, vendor payables, and design tasks.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center flex-wrap gap-2.5 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Office">Office</option>
            <option value="Renovation">Renovation</option>
          </select>

          <select
            value={designerFilter}
            onChange={(e) => setDesignerFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
          >
            <option value="All">All Designers</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {(statusFilter !== 'All' || typeFilter !== 'All' || designerFilter !== 'All') && (
            <button
              onClick={() => {
                setStatusFilter('All');
                setTypeFilter('All');
                setDesignerFilter('All');
              }}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards Grid (Requirement 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Active Projects */}
        <Link
          to="/projects"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Projects
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {summary.total_active_projects}
            </span>
            <span className="text-xs text-slate-400">in studio</span>
          </div>
        </Link>

        {/* Card 2: New Leads */}
        <Link
          to="/leads"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              New Leads
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {summary.new_leads}
            </span>
            <span className="text-xs text-purple-600 font-medium">pipeline</span>
          </div>
        </Link>

        {/* Card 3: Projects At Risk */}
        <Link
          to="/projects?health=At+Risk"
          className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all group ${
            summary.projects_at_risk > 0
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Projects At Risk
            </span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900 tracking-tight">
              {summary.projects_at_risk}
            </span>
            {summary.projects_at_risk > 0 && (
              <span className="text-xs text-amber-700 font-semibold animate-pulse">Needs action</span>
            )}
          </div>
        </Link>

        {/* Card 4: Overdue Tasks */}
        <Link
          to="/tasks?is_overdue=true"
          className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all group ${
            summary.overdue_tasks > 0
              ? 'bg-rose-50/70 border-rose-300'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Overdue Tasks
            </span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-900 tracking-tight">
              {summary.overdue_tasks}
            </span>
            <span className="text-xs text-rose-600 font-medium">delayed</span>
          </div>
        </Link>

        {/* Card 5: Pending Vendor Payments */}
        <Link
          to="/vendors"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Payments
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {formatINR(summary.pending_vendor_payments)}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              across {summary.pending_vendor_invoices_count} invoices
            </p>
          </div>
        </Link>

        {/* Card 6: Upcoming Deadlines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Upcoming Deadlines
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {summary.upcoming_deadlines_count}
            </span>
            <span className="text-xs text-slate-400">in next 30 days</span>
          </div>
        </div>
      </div>

      {/* Delayed Project Alerts Banner (if any) */}
      {summary.delayed_alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent p-5 rounded-2xl border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Immediate Attention Required: {summary.delayed_alerts.length} Project(s) Marked At Risk or Delayed
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.delayed_alerts.map((proj) => (
              <div
                key={proj.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{proj.project_name}</span>
                    <StatusBadge status={proj.health} type="health" size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Client: {proj.client_name} • Designer: {proj.designer} • Handover:{' '}
                    {formatDate(proj.expected_handover_date)}
                  </p>
                </div>
                <Link
                  to="/projects"
                  className="px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  Inspect <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Middle Section: Project Distribution & Progress + Vendor Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Lifecycle Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Project Stage Distribution</h3>
            <span className="text-xs text-slate-400 font-medium">8 Stages</span>
          </div>

          <div className="space-y-3">
            {Object.entries(summary.status_distribution).map(([status, count]) => {
              const total = summary.total_active_projects || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700">{status}</span>
                    <span className="text-slate-900 font-bold">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct * 2, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vendor Procurement Financial Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Vendor Payment Summary</h3>
            <Link to="/vendors" className="text-xs text-amber-600 font-semibold hover:underline">
              View Invoices
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium uppercase">Total Invoiced</span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {formatINR(summary.vendor_payment_summary.total_invoiced)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[11px] text-emerald-700 font-medium uppercase">Amount Paid</span>
              <p className="text-sm font-bold text-emerald-800 mt-1">
                {formatINR(summary.vendor_payment_summary.total_paid)}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-[11px] text-amber-700 font-medium uppercase">Outstanding</span>
              <p className="text-sm font-bold text-amber-800 mt-1">
                {formatINR(summary.vendor_payment_summary.total_outstanding)}
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-[11px] text-rose-700 font-medium uppercase">Past Due Overdue</span>
              <p className="text-sm font-bold text-rose-800 mt-1">
                {formatINR(summary.vendor_payment_summary.overdue_amount)}
              </p>
            </div>
          </div>

          {/* Payment Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Settlement Ratio</span>
              <span className="font-semibold text-slate-800">
                {summary.vendor_payment_summary.total_invoiced > 0
                  ? Math.round(
                      (summary.vendor_payment_summary.total_paid /
                        summary.vendor_payment_summary.total_invoiced) *
                        100
                    )
                  : 0}
                % Cleared
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-3"
                style={{
                  width: `${
                    summary.vendor_payment_summary.total_invoiced > 0
                      ? (summary.vendor_payment_summary.total_paid /
                          summary.vendor_payment_summary.total_invoiced) *
                        100
                      : 0
                  }%`,
                }}
              />
              <div
                className="bg-amber-400 h-3"
                style={{
                  width: `${
                    summary.vendor_payment_summary.total_invoiced > 0
                      ? (summary.vendor_payment_summary.total_outstanding /
                          summary.vendor_payment_summary.total_invoiced) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* High-Budget Leads (> ₹5,00,000) for Automation Pipeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">High-Budget Leads (&gt; ₹5L)</h3>
            </div>
            <Link to="/leads" className="text-xs text-amber-600 font-semibold hover:underline">
              All Leads
            </Link>
          </div>

          <div className="space-y-3">
            {summary.high_budget_leads.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No high-budget leads in queue.</p>
            ) : (
              summary.high_budget_leads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition-colors"
                >
                  <div>
                    <p className="font-semibold text-xs text-slate-900">{lead.client_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {lead.project_type} • {lead.project_location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-700">{formatINR(lead.project_budget)}</p>
                    <StatusBadge status={lead.lead_status} type="lead" size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Upcoming Deadlines & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines (Handovers & Tasks) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Upcoming Studio Deadlines</h3>
            <span className="text-xs text-slate-400 font-medium">Sorted by Date</span>
          </div>

          <div className="divide-y divide-slate-100">
            {summary.upcoming_deadlines.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming deadlines.</p>
            ) : (
              summary.upcoming_deadlines.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl text-xs font-bold shrink-0 ${
                        item.type === 'Project Handover'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {item.type === 'Project Handover' ? (
                        <Building2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {item.project_name || item.task_name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.type} {item.client_name ? `• ${item.client_name}` : ''}{' '}
                        {item.assignee ? `• Assigned: ${item.assignee}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-800">{formatDate(item.date)}</span>
                    {item.health && (
                      <div className="mt-1">
                        <StatusBadge status={item.health} type="health" size="sm" />
                      </div>
                    )}
                    {item.priority && (
                      <div className="mt-1">
                        <StatusBadge status={item.priority} type="priority" size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Studio Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900">Recent Studio Activity</h3>
            <span className="text-xs text-slate-400 font-medium">Live Audit Log</span>
          </div>

          <div className="space-y-4">
            {summary.recent_activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity logged.</p>
            ) : (
              summary.recent_activities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{act.title}</p>
                    <p className="text-slate-500 mt-0.5">{act.description}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {formatDate(act.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
