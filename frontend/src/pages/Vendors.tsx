import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  IndianRupee,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  FolderKanban,
  FileText,
  CreditCard,
  Building,
} from 'lucide-react';
import { api, formatINR, formatDate } from '../services/api';
import { Vendor, Invoice, Project, PaymentStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';

export const Vendors: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'vendors'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');

  // Modals
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState<boolean>(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState<boolean>(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Forms
  const [invoiceForm, setInvoiceForm] = useState({
    vendor_id: '' as string | number,
    related_project_id: '' as string | number,
    material_or_service: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_due_date: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
    invoice_amount: 100000,
    amount_paid: 0,
    payment_reference: '',
    notes: '',
  });

  const [vendorForm, setVendorForm] = useState({
    vendor_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    category: 'Carpentry & Millwork',
    address: '',
  });

  const [payForm, setPayForm] = useState({
    additional_payment: 0,
    payment_reference: '',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invsRes, vendorsRes, projsRes] = await Promise.all([
        api.getInvoices({
          search,
          payment_status: statusFilter,
          vendor_id: vendorFilter !== 'All' ? Number(vendorFilter) : undefined,
          project_id: projectFilter !== 'All' ? Number(projectFilter) : undefined,
        }),
        api.getVendors(),
        api.getProjects(),
      ]);
      setInvoices(invsRes);
      setVendors(vendorsRes);
      setProjects(projsRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, vendorFilter, projectFilter]);

  const handleOpenAddInvoice = () => {
    setInvoiceForm({
      vendor_id: vendors[0]?.id || '',
      related_project_id: projects[0]?.id || '',
      material_or_service: '',
      invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      payment_due_date: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
      invoice_amount: 100000,
      amount_paid: 0,
      payment_reference: '',
      notes: '',
    });
    setFormError(null);
    setIsAddInvoiceModalOpen(true);
  };

  const handleOpenAddVendor = () => {
    setVendorForm({
      vendor_name: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      category: 'Carpentry & Millwork',
      address: '',
    });
    setFormError(null);
    setIsAddVendorModalOpen(true);
  };

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayForm({
      additional_payment: inv.outstanding_amount,
      payment_reference: '',
      notes: '',
    });
    setFormError(null);
    setIsPayModalOpen(true);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (invoiceForm.invoice_amount < 0) {
      setFormError('Invoice amount cannot be negative');
      return;
    }
    if (invoiceForm.amount_paid < 0) {
      setFormError('Amount paid cannot be negative');
      return;
    }
    if (invoiceForm.amount_paid > invoiceForm.invoice_amount) {
      setFormError('Amount paid cannot exceed invoice amount');
      return;
    }

    try {
      setSubmitting(true);
      await api.createInvoice({
        ...invoiceForm,
        vendor_id: Number(invoiceForm.vendor_id),
        related_project_id: Number(invoiceForm.related_project_id),
        invoice_amount: Number(invoiceForm.invoice_amount),
        amount_paid: Number(invoiceForm.amount_paid),
      });
      setIsAddInvoiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      // Clear duplicate detection error message handling (Requirement 7)
      setFormError(err.message || 'Failed to record invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await api.createVendor(vendorForm);
      setIsAddVendorModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setFormError(null);

    if (payForm.additional_payment <= 0) {
      setFormError('Payment amount must be greater than zero');
      return;
    }

    if (payForm.additional_payment > selectedInvoice.outstanding_amount) {
      setFormError(`Payment exceeds remaining balance of ${formatINR(selectedInvoice.outstanding_amount)}`);
      return;
    }

    try {
      setSubmitting(true);
      await api.recordPayment(selectedInvoice.id, {
        additional_payment: Number(payForm.additional_payment),
        payment_reference: payForm.payment_reference,
        notes: payForm.notes,
      });
      setIsPayModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!confirm(`Delete invoice #${inv.invoice_number} from ${inv.vendor?.vendor_name}?`)) return;
    try {
      await api.deleteInvoice(inv.id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice');
    }
  };

  // Calculations for summary banner
  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.invoice_amount, 0);
  const totalPaid = invoices.reduce((acc, curr) => acc + curr.amount_paid, 0);
  const totalOutstanding = invoices.reduce((acc, curr) => acc + curr.outstanding_amount, 0);
  const overdueCount = invoices.filter((i) => i.payment_status === 'Overdue').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Vendors & Procurement Tracking
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Material suppliers, millwork contractors, invoice settlement, and duplicate payment prevention.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAddVendor}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <Building className="w-4 h-4" />
            Add Vendor
          </button>
          <button
            onClick={handleOpenAddInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Record Invoice
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Invoiced</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalInvoiced)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase">Total Disbursed</span>
          <p className="text-2xl font-extrabold text-emerald-800 mt-1">{formatINR(totalPaid)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 uppercase">Outstanding Balance</span>
          <p className="text-2xl font-extrabold text-amber-800 mt-1">{formatINR(totalOutstanding)}</p>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs ${
            overdueCount > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-xs font-semibold text-rose-700 uppercase">Overdue Invoices</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-rose-800">{overdueCount}</span>
            {overdueCount > 0 && (
              <span className="text-xs text-rose-600 font-semibold animate-pulse">Action required</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'invoices'
              ? 'text-amber-600 border-amber-500'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          Invoices & Procurement ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'vendors'
              ? 'text-amber-600 border-amber-500'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          Registered Vendors Directory ({vendors.length})
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'invoices' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice number, vendor, materials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
              >
                <option value="All">All Payment Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>

              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700 max-w-[160px]"
              >
                <option value="All">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name}
                  </option>
                ))}
              </select>

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
            </div>
          </div>

          {/* Invoices Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-slate-500 font-medium">No invoices match the selected criteria.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Vendor & Material</th>
                      <th className="py-3 px-4">Related Project</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Paid / Balance</th>
                      <th className="py-3 px-4">Payment Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          inv.payment_status === 'Overdue' ? 'bg-rose-50/25' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {inv.invoice_number}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">{inv.invoice_code}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {inv.vendor?.vendor_name || 'Vendor'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">
                            {inv.material_or_service}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <FolderKanban className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {inv.project?.project_name || 'Project'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatINR(inv.invoice_amount)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-emerald-700">
                            Paid: {formatINR(inv.amount_paid)}
                          </div>
                          <div className="text-slate-600 font-medium mt-0.5">
                            Due: {formatINR(inv.outstanding_amount)}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div
                            className={`font-semibold ${
                              inv.payment_status === 'Overdue' ? 'text-rose-600 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {formatDate(inv.payment_due_date)}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Billed: {formatDate(inv.invoice_date)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={inv.payment_status} type="payment" size="sm" />
                          {inv.payment_reference && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                              Ref: {inv.payment_reference}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.outstanding_amount > 0 && (
                              <button
                                onClick={() => handleOpenPay(inv)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Record Payment"
                              >
                                <CreditCard className="w-3 h-3 text-emerald-600" />
                                Pay
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteInvoice(inv)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Invoice"
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
        </div>
      ) : (
        /* Vendors Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {vendor.vendor_code}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{vendor.vendor_name}</h4>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">
                    {vendor.category || 'Vendor'}
                  </span>
                </div>
                <Building className="w-5 h-5 text-slate-400" />
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                <p>
                  <strong>Contact:</strong> {vendor.contact_person || '-'}
                </p>
                <p>
                  <strong>Phone:</strong> {vendor.contact_phone || '-'}
                </p>
                <p>
                  <strong>Email:</strong> {vendor.contact_email || '-'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  <strong>Address:</strong> {vendor.address || 'Bengaluru'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Invoice Modal (With Duplicate Invoice Protection, Requirement 7) */}
      <Modal
        isOpen={isAddInvoiceModalOpen}
        onClose={() => setIsAddInvoiceModalOpen(false)}
        title="Record Vendor Invoice"
        subtitle="Enforces duplicate invoice protection and payment calculation constraints."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vendor *</label>
              <select
                required
                value={invoiceForm.vendor_id}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, vendor_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name} ({v.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor Invoice Number *
                <span className="text-[10px] text-amber-600 font-normal ml-1">
                  (Unique per vendor)
                </span>
              </label>
              <input
                type="text"
                required
                value={invoiceForm.invoice_number}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                placeholder="e.g. BTP-2026-101"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Related Client Project *</label>
            <select
              required
              value={invoiceForm.related_project_id}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, related_project_id: e.target.value })}
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Material or Service Supplied *</label>
            <input
              type="text"
              required
              value={invoiceForm.material_or_service}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, material_or_service: e.target.value })}
              placeholder="e.g. Italian Marble Statuario Slabs / Marine Ply"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Amount (INR ₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={invoiceForm.invoice_amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Amount Paid (₹)</label>
              <input
                type="number"
                min="0"
                max={invoiceForm.invoice_amount}
                step="100"
                value={invoiceForm.amount_paid}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount_paid: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Date *</label>
              <input
                type="date"
                required
                value={invoiceForm.invoice_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date *</label>
              <input
                type="date"
                required
                value={invoiceForm.payment_due_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_due_date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Reference (UTR / UPI / Cheque)</label>
            <input
              type="text"
              value={invoiceForm.payment_reference}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_reference: e.target.value })}
              placeholder="e.g. HDFC-NEFT-8812903"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddInvoiceModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Validating...' : 'Record Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
        title="Register New Vendor"
        subtitle="Add a contractor or material supplier to the Sunrise Interiors directory."
        maxWidth="md"
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Enterprise Name *</label>
            <input
              type="text"
              required
              value={vendorForm.vendor_name}
              onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
              placeholder="e.g. Bengaluru Glass & Mirrors"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={vendorForm.contact_person}
                onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                placeholder="e.g. Suresh Kumar"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={vendorForm.category}
                onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Carpentry & Millwork">Carpentry & Millwork</option>
                <option value="Electrical & Lighting">Electrical & Lighting</option>
                <option value="Flooring & Stone">Flooring & Stone</option>
                <option value="Fabrics & Upholstery">Fabrics & Upholstery</option>
                <option value="Paint & Wallpapers">Paint & Wallpapers</option>
                <option value="Civil & Plumbing">Civil & Plumbing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={vendorForm.contact_phone}
                onChange={(e) => setVendorForm({ ...vendorForm, contact_phone: e.target.value })}
                placeholder="+919844011223"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={vendorForm.contact_email}
                onChange={(e) => setVendorForm({ ...vendorForm, contact_email: e.target.value })}
                placeholder="vendor@domain.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address / Yard Location</label>
            <input
              type="text"
              value={vendorForm.address}
              onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
              placeholder="e.g. Mysore Road, Bengaluru"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddVendorModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment: ${selectedInvoice?.invoice_number}`}
        subtitle={`Remaining balance: ${formatINR(selectedInvoice?.outstanding_amount || 0)}`}
        maxWidth="sm"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Amount (INR ₹) *
            </label>
            <input
              type="number"
              required
              min="1"
              max={selectedInvoice?.outstanding_amount}
              step="100"
              value={payForm.additional_payment}
              onChange={(e) => setPayForm({ ...payForm, additional_payment: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Transaction Reference (NEFT / UTR / UPI) *
            </label>
            <input
              type="text"
              required
              value={payForm.payment_reference}
              onChange={(e) => setPayForm({ ...payForm, payment_reference: e.target.value })}
              placeholder="e.g. UTR-2026-9901"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes</label>
            <textarea
              rows={2}
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              placeholder="e.g. Milestone 2 tranche released"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
