import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'health' | 'status' | 'payment' | 'priority' | 'lead';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'health') {
    switch (status) {
      case 'On Track':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
        break;
      case 'At Risk':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-500/30 font-bold animate-pulse';
        break;
      case 'Delayed':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-500/30 font-bold';
        break;
    }
  } else if (type === 'payment') {
    switch (status) {
      case 'Paid':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Partially Paid':
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'Pending':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Overdue':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
        break;
    }
  } else if (type === 'priority') {
    switch (status) {
      case 'Urgent':
        colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        break;
      case 'High':
        colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
        break;
      case 'Medium':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'Low':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
    }
  } else if (type === 'lead') {
    switch (status) {
      case 'New':
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'Contacted':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'Qualified':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Converted':
        colorClasses = 'bg-teal-50 text-teal-800 border-teal-300 font-semibold';
        break;
      case 'Not Proceeding':
        colorClasses = 'bg-slate-100 text-slate-500 border-slate-200 line-through';
        break;
    }
  } else {
    // Project or task generic status
    switch (status) {
      case 'Completed':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Execution':
      case 'In Progress':
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'Design':
        colorClasses = 'bg-violet-50 text-violet-700 border-violet-200';
        break;
      case 'Procurement':
        colorClasses = 'bg-cyan-50 text-cyan-700 border-cyan-200';
        break;
      case 'Review':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Handover':
        colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
        break;
      case 'Consultation':
      case 'To Do':
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
      case 'New Lead':
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses} tracking-tight`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};
