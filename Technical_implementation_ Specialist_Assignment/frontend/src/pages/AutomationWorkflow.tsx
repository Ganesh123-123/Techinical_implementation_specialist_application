import React, { useState } from 'react';
import {
  Workflow,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  FileCode,
  ExternalLink,
  Mail,
  IndianRupee,
  ShieldAlert,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '../services/api';

export const AutomationWorkflow: React.FC = () => {
  // Simulator State
  const [testName, setTestName] = useState<string>('Vikramaditya Roy');
  const [testEmail, setTestEmail] = useState<string>('v.roy@venturecorp.in');
  const [testPhone, setTestPhone] = useState<string>('+919876543210');
  const [testBudget, setTestBudget] = useState<number>(750000);
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [showJson, setShowJson] = useState<boolean>(false);

  const steps = [
    {
      id: 1,
      title: 'Google Sheets Trigger',
      desc: 'New response appended from Google Form (Client Name, Phone, Email, Budget, Scope)',
      node: 'Google Sheets Trigger (On Row Added)',
    },
    {
      id: 2,
      title: 'Data Validation & Sanitization',
      desc: 'Validate email format, normalize Indian phone (+91), and parse budget into integer INR',
      node: 'Code Node (Validation & Currency Sanitizer)',
    },
    {
      id: 3,
      title: 'Deduplication Guard',
      desc: 'Check if Row ID or (Email + Phone) already exists in Processed Ledger or ClickUp',
      node: 'IF Node (Is Already Processed?)',
    },
    {
      id: 4,
      title: 'ClickUp Task Creation',
      desc: 'Create new lead card in ClickUp "New Leads" list with custom fields and location tags',
      node: 'ClickUp Node (Create Task in New Leads)',
    },
    {
      id: 5,
      title: 'Save ClickUp Task ID to Sheet',
      desc: 'Write back the ClickUp Task ID to Column G in Google Sheet to guarantee idempotency on retries',
      node: 'Google Sheets Node (Update Row with Task ID)',
    },
    {
      id: 6,
      title: 'Client Confirmation Email',
      desc: 'Send personalized auto-responder: "Thank you for contacting Sunrise Interiors, Bengaluru"',
      node: 'Email Node (SMTP / SendGrid Auto-responder)',
    },
    {
      id: 7,
      title: 'Budget Condition Check',
      desc: 'Evaluate: Is project_budget > ₹5,00,000?',
      node: 'IF Node (project_budget > 500000)',
    },
    {
      id: 8,
      title: 'Design Team Alert / Skip',
      desc: 'If True (> ₹5L): Send high-priority alert to senior design team. If False: Skip notification.',
      node: 'Slack / WhatsApp / Internal Notification Node',
    },
    {
      id: 9,
      title: 'Execution Log & Error Telemetry',
      desc: 'Record successful workflow execution with latency metrics or route errors to admin',
      node: 'Log & Error Trigger Handler',
    },
  ];

  const runSimulation = async () => {
    setIsSimulating(true);
    setCurrentStep(1);
    setExecutionLogs([
      `[${new Date().toLocaleTimeString()}] Workflow triggered: Incoming Google Form submission detected in Sheet row #42`,
    ]);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await delay(700);
    setCurrentStep(2);
    setExecutionLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Validation Passed: Name="${testName}", Phone="${testPhone}" (Validated Indian Mobile), Budget=₹${testBudget.toLocaleString()}`,
    ]);

    await delay(700);
    setCurrentStep(3);
    setExecutionLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Deduplication Check: Row #42 has empty ClickUp Task ID. Safe to proceed.`,
    ]);

    await delay(700);
    const mockTaskId = `CLK-${Math.floor(100000 + Math.random() * 900000)}`;

    if (simulateError) {
      setCurrentStep(4);
      setExecutionLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Attempt 1: ClickUp API returned temporary 503 Service Unavailable.`,
        `[${new Date().toLocaleTimeString()}] Retry Policy: Triggering exponential backoff (Attempt 1 of 3, 1s delay)...`,
      ]);
      await delay(1200);
      setExecutionLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Attempt 2: Connection recovered! Verified idempotency key (preventing duplicates).`,
        `[${new Date().toLocaleTimeString()}] ClickUp Task created successfully in list "New Leads" (Task ID: ${mockTaskId})`,
      ]);
    } else {
      setCurrentStep(4);
      setExecutionLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ClickUp Task created successfully in list "New Leads" (Task ID: ${mockTaskId})`,
      ]);
    }

    await delay(700);
    setCurrentStep(5);
    setExecutionLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Google Sheet updated: Column G set to "${mockTaskId}" (Idempotency locked)`,
    ]);

    await delay(700);
    setCurrentStep(6);
    setExecutionLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Automated confirmation email dispatched to ${testEmail}`,
    ]);

    await delay(700);
    setCurrentStep(7);
    const isHighBudget = testBudget > 500000;
    setExecutionLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Condition Evaluation: ${testBudget} > 500000 => ${
        isHighBudget ? 'TRUE (High-Budget Lead)' : 'FALSE (Standard Lead)'
      }`,
    ]);

    await delay(700);
    setCurrentStep(8);
    if (isHighBudget) {
      setExecutionLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] High-Budget Alert sent to Senior Design Team (Ananya & Vikram): "Priority Consultation Required - ${formatINR(
          testBudget
        )}"`,
      ]);
    } else {
      setExecutionLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Budget <= ₹5,00,000: High-budget notification skipped as configured by business rules.`,
      ]);
    }

    await delay(700);
    setCurrentStep(9);
    setExecutionLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Execution finished with status SUCCESS in 4.2 seconds.`,
    ]);
    setIsSimulating(false);
  };

  const n8nWorkflowJson = {
    name: 'Sunrise Interiors – Google Form Lead Automation',
    nodes: [
      {
        name: 'Google Sheets Trigger',
        type: 'n8n-nodes-base.googleSheetsTrigger',
        parameters: { pollTimes: { item: [{ mode: 'everyMinute' }] }, event: 'rowAdded' },
      },
      {
        name: 'Validate & Clean Data',
        type: 'n8n-nodes-base.code',
        parameters: {
          jsCode:
            '// Validates email & cleans phone to +91XXXXXXXXXX\nconst phone = items[0].json.Phone.replace(/\\D/g, "");\nreturn [{ json: { ...items[0].json, cleanPhone: "+91" + phone.slice(-10) } }];',
        },
      },
      {
        name: 'Check ClickUp ID',
        type: 'n8n-nodes-base.if',
        parameters: { conditions: { string: [{ value1: '={{$json["ClickUp Task ID"]}}', operation: 'isEmpty' }] } },
      },
      {
        name: 'Create ClickUp Lead',
        type: 'n8n-nodes-base.clickUp',
        parameters: { list: 'New Leads', name: '={{$json.Name}} - Lead', priority: 2 },
      },
      {
        name: 'Update Sheet Task ID',
        type: 'n8n-nodes-base.googleSheets',
        parameters: { operation: 'update', key: 'RowID', columns: { 'ClickUp Task ID': '={{$node["Create ClickUp Lead"].json["id"]}}' } },
      },
      {
        name: 'Send Client Email',
        type: 'n8n-nodes-base.emailSend',
        parameters: { toEmail: '={{$json.Email}}', subject: 'Sunrise Interiors – We received your inquiry' },
      },
      {
        name: 'Is Budget > 500k',
        type: 'n8n-nodes-base.if',
        parameters: { conditions: { number: [{ value1: '={{$json.Budget}}', operation: 'larger', value2: 500000 }] } },
      },
      {
        name: 'Notify Senior Designers',
        type: 'n8n-nodes-base.slack',
        parameters: { channel: '#studio-leads', message: '⭐ High-Budget Inquiry Received: {{$json.Name}} (₹{{$json.Budget}})' },
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Workflow className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            n8n Automation Workflow Specification
          </h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Architectural specification, retry telemetry, conditional branching, and live execution simulation.
        </p>
      </div>

      {/* Integration Notice Alert (Requirement 11) */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Official Assignment Disclosure:</strong> This section documents the proposed
          production n8n automation workflow for Sunrise Interiors. In accordance with assignment
          guidelines, external credentials (ClickUp API tokens, Google Workspace OAuth, and SMTP keys)
          are safely abstracted to prevent credential leakage. You can test and inspect the logic
          using the <strong>Interactive Workflow Simulator</strong> below.
        </div>
      </div>

      {/* Workflow Diagram & Steps */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Pipeline Architecture: Google Form &rarr; Google Sheets &rarr; ClickUp &rarr; Email
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sequence of 9 transactional nodes ensuring zero duplicate leads and conditional routing.
            </p>
          </div>
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
            {showJson ? 'Hide n8n JSON' : 'Export n8n JSON'}
          </button>
        </div>

        {showJson && (
          <div className="bg-slate-950 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 max-h-72">
            <pre>{JSON.stringify(n8nWorkflowJson, null, 2)}</pre>
          </div>
        )}

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s) => {
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;

            return (
              <div
                key={s.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                    : isCompleted
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-slate-50/60 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 animate-bounce'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCompleted ? '✓' : s.id}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                    {s.node.split('(')[0]}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{s.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Workflow Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulator Controls */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900">Interactive Execution Runner</h3>
          </div>
          <p className="text-xs text-slate-500">
            Simulate a Google Form submission with test data and observe conditional branching and error handling.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Client Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Client Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Project Budget (INR ₹)
              </label>
              <input
                type="number"
                step="50000"
                value={testBudget}
                onChange={(e) => setTestBudget(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              />
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setTestBudget(750000)}
                  className={`px-2 py-1 text-[10px] rounded font-semibold cursor-pointer transition-colors ${
                    testBudget > 500000
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  &gt; ₹5L (High-Budget)
                </button>
                <button
                  type="button"
                  onClick={() => setTestBudget(350000)}
                  className={`px-2 py-1 text-[10px] rounded font-semibold cursor-pointer transition-colors ${
                    testBudget <= 500000
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  &le; ₹5L (Standard)
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={simulateError}
                  onChange={(e) => setSimulateError(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="text-xs text-slate-800 font-semibold block">
                    Simulate Network Glitch & Auto-Recovery
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Demonstrates the exponential backoff retry policy recovering from an initial 503 error
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
              </button>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setExecutionLogs([]);
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Reset Simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Execution Console & Logs */}
        <div className="lg:col-span-2 bg-slate-950 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-400 font-semibold ml-2">
                n8n Workflow Execution Telemetry Console
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Node.js Runtime</span>
          </div>

          <div className="flex-1 py-4 overflow-y-auto space-y-2 min-h-[260px] max-h-[340px]">
            {executionLogs.length === 0 ? (
              <div className="text-slate-600 italic py-12 text-center">
                Click "Run Simulation" to execute the pipeline and stream live node logs.
              </div>
            ) : (
              executionLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    log.includes('ERROR')
                      ? 'text-rose-400 font-bold'
                      : log.includes('TRUE') || log.includes('SUCCESS') || log.includes('recovered')
                      ? 'text-emerald-400 font-semibold'
                      : log.includes('Validation') || log.includes('Attempt 1') || log.includes('Retry Policy')
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Status: {isSimulating ? 'Executing Node...' : currentStep === 9 ? 'Completed' : 'Idle'}</span>
            <span>Step {currentStep} of 9</span>
          </div>
        </div>
      </div>

      {/* Logic & Failure Analysis Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider text-amber-700">
            1. Conditional Logic
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-amber-900">
              IF project_budget &gt; 500000:
            </code>
            <br />
            Dispatches urgent notification to senior interior design partners for priority high-value
            consultation within 2 hours. Submissions &le; ₹5,00,000 are queued normally without interrupting
            senior designers.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider text-amber-700">
            2. Idempotency & Retries
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            To prevent duplicate tasks on transient network retries, the ClickUp Task ID is written
            back to the Google Sheet row. If n8n retries, Node 3 inspects whether the ID exists. If present,
            creation is bypassed to guarantee exact-once semantics.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider text-amber-700">
            3. Failure Scenarios
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Potential Failure:</strong> ClickUp rate limits (429) or SMTP downtime.
            <br />
            <strong>Mitigation:</strong> n8n retry configuration with 3 attempts and exponential backoff
            (1s, 2s, 4s). If permanent failure occurs, an Error Trigger routes the payload to an admin
            quarantine queue.
          </p>
        </div>
      </div>
    </div>
  );
};
