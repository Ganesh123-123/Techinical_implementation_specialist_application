import React from 'react';
import {
  BookOpen,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Layers,
  Settings,
  Share2,
  LayoutDashboard,
  Zap,
} from 'lucide-react';

export const ClickUpGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ClickUp Workspace Setup & Configuration Guide
          </h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Complete, practical instructions for establishing the Sunrise Interiors workspace structure, custom fields, automations, and guest sharing in ClickUp.
        </p>
      </div>

      {/* Mandatory Disclaimer (Requirement 12) */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong>Mandatory Requirement Notice:</strong> This web application serves as Sunrise
          Interiors' bespoke operational portal and does not pretend to be ClickUp. The actual ClickUp
          workspace, lists, custom fields, automations, and executive dashboard must be configured
          directly within your official ClickUp account (<a href="https://app.clickup.com" target="_blank" rel="noreferrer" className="underline font-bold text-amber-800">app.clickup.com</a>). No fake ClickUp URLs are generated.
        </div>
      </div>

      {/* Step 1: Workspace & Space Hierarchy */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
            1
          </div>
          <h3 className="font-bold text-base text-slate-900">
            Create Workspace & Core List Hierarchy
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          In your ClickUp account, create a workspace named <strong className="text-slate-900">Sunrise Interiors</strong>.
          Under a Space named <strong>Studio Operations</strong>, create the 4 required Lists:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h4 className="font-bold text-xs text-slate-900">List 1: Client Projects</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tracks the high-level turnkey project lifecycle through Consultation, Design, Procurement,
              Execution, Review, and Handover stages.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h4 className="font-bold text-xs text-slate-900">List 2: Vendor & Procurement</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tracks vendor bills, timber/marble procurement purchase orders, payment milestones, and outstanding balances.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h4 className="font-bold text-xs text-slate-900">List 3: Design Team Tasks</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Granular design deliverables assigned to Ananya, Vikram, and Priya (e.g. 3D renders, CAD joinery details, site inspections).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h4 className="font-bold text-xs text-slate-900">List 4: New Leads</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Receives incoming prospective client inquiries via Google Form / n8n webhook for qualification.
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Custom Field Schemas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
            2
          </div>
          <h3 className="font-bold text-base text-slate-900">Required Custom Field Specifications</h3>
        </div>

        <p className="text-xs text-slate-600">
          Configure ClickUp Custom Fields for each List according to the assignment requirements:
        </p>

        <div className="space-y-4 pt-1">
          {/* Client Projects Custom Fields */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="font-bold text-xs text-indigo-900 mb-2">
              Client Projects Custom Fields:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Client Name</span> (Text)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Project Budget</span> (Currency INR)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Project Type</span> (Dropdown: Residential, Commercial, Office, Renovation)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Project Location</span> (Text)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Expected Handover</span> (Date)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Project Health</span> (Dropdown: On Track, At Risk, Delayed)
              </div>
            </div>
          </div>

          {/* Vendor & Procurement Custom Fields */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="font-bold text-xs text-amber-900 mb-2">
              Vendor & Procurement Custom Fields:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Vendor Name</span> (Text)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Invoice Number</span> (Text)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Amount Due</span> (Currency INR)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Payment Status</span> (Dropdown: Pending, Partially Paid, Paid, Overdue)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Payment Due Date</span> (Date)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Payment Reference</span> (Text)
              </div>
            </div>
          </div>

          {/* Design Team Tasks Custom Fields */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="font-bold text-xs text-emerald-900 mb-2">
              Design Team Tasks Custom Fields:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Assigned Designer</span> (People / Dropdown)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Priority</span> (Dropdown: Urgent, High, Medium, Low)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Related Project</span> (Relationship / Text)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Due Date</span> (Date)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Task Status</span> (Status)
              </div>
            </div>
          </div>

          {/* New Leads Custom Fields */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="font-bold text-xs text-purple-900 mb-2">New Leads Custom Fields:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Client Name</span> (Text)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Email</span> (Email)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Phone</span> (Phone)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Project Budget</span> (Currency INR)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Project Type</span> (Dropdown)
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800">Project Location</span> (Text)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Automation Setup */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
            3
          </div>
          <h3 className="font-bold text-base text-slate-900">ClickUp Automation Configuration</h3>
        </div>

        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Zap className="w-4 h-4 text-amber-600" />
            Rule: "When Project Health Changes to At Risk, Notify Project Owner"
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
            <li>Navigate to List <strong>Client Projects</strong> &rarr; Click <strong>Automations</strong> (top right).</li>
            <li>Select <strong>Add Custom Automation</strong>.</li>
            <li><strong>Trigger:</strong> Custom Field changes &rarr; Select <code>Project Health</code> &rarr; Condition: <code>is equal to 'At Risk'</code>.</li>
            <li><strong>Action:</strong> <code>Send a Notification</code> or <code>Post a Comment</code> &rarr; Assignee: Project Owner (Ananya Sharma).</li>
            <li><strong>Message Template:</strong> <code>Project Health Alert: [Task Name] has been flagged as At Risk. Please review contractor deliverables and project schedule.</code></li>
          </ol>
        </div>
      </div>

      {/* Step 4: Executive Owner Dashboard */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
            4
          </div>
          <h3 className="font-bold text-base text-slate-900">Executive Owner Dashboard Setup</h3>
        </div>

        <p className="text-xs text-slate-600">
          Navigate to ClickUp Dashboards and add the 5 executive widgets:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-900">1. Active Projects:</strong> Calculation widget showing count of tasks in Client Projects where status is not 'Completed'.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-900">2. Projects At Risk:</strong> Task list widget filtered by <code>Project Health = At Risk</code>.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-900">3. Overdue Tasks:</strong> Workload / List widget filtered by <code>Due Date is Overdue</code> and <code>Status != Closed</code>.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-900">4. Pending Vendor Payments:</strong> Calculation widget summing <code>Amount Due</code> where <code>Payment Status != Paid</code>.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-1 sm:col-span-2">
            <strong className="text-slate-900">5. Upcoming Handover Dates:</strong> Calendar widget displaying tasks by custom field <code>Expected Handover</code> in the next 30 days.
          </div>
        </div>
      </div>

      {/* Step 5: Shareable Guest Link & Access Verification */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
            5
          </div>
          <h3 className="font-bold text-base text-slate-900">Generating Shareable Guest Link & Verifying Access</h3>
        </div>

        <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
          <p>To share the ClickUp workspace with the Agile Automate reviewers:</p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>Click <strong>Share</strong> in the top-right corner of the Dashboard or Space.</li>
            <li>Under <strong>Public Sharing</strong>, toggle <strong>Public link</strong> to <code>ON</code> (or invite as Guest with view-only permissions).</li>
            <li>Configure permissions to <strong>View Only</strong> to prevent accidental modifications to custom fields.</li>
            <li>Copy the official ClickUp URL generated (format: <code>https://sharing.clickup.com/...</code>).</li>
            <li>
              <strong>Verification Step:</strong> Open an Incognito / Private browser window and paste the copied link. Ensure all 5 dashboard widgets and custom fields render properly without requiring a password login.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
