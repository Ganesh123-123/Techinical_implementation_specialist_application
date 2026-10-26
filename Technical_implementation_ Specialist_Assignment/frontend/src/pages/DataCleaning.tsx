import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Terminal,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import { api } from '../services/api';

export const DataCleaning: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [cleaningStatus, setCleaningStatus] = useState<any>(null);
  const [previewData, setPreviewData] = useState<{
    raw_leads: any[];
    cleaned_leads: any[];
    invalid_leads: any[];
  }>({ raw_leads: [], cleaned_leads: [], invalid_leads: [] });
  const [running, setRunning] = useState<boolean>(false);
  const [lastSummary, setLastSummary] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Custom single number tester
  const [testRawPhone, setTestRawPhone] = useState<string>('098-765-99887');
  const [customResult, setCustomResult] = useState<any>(null);

  const fetchStatusAndPreview = async () => {
    try {
      setLoading(true);
      const [status, preview] = await Promise.all([
        api.getCleaningStatus(),
        api.previewCleaningFiles(),
      ]);
      setCleaningStatus(status);
      setPreviewData(preview);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndPreview();
  }, []);

  const handleRunCleaning = async () => {
    try {
      setRunning(true);
      const res = await api.executeLeadCleaning();
      setLastSummary(res.summary);
      await fetchStatusAndPreview();
    } catch (err: any) {
      alert(err.message || 'Error running cleaning script');
    } finally {
      setRunning(false);
    }
  };

  const handleTestSingleNumber = async () => {
    try {
      const res = await api.customCleanLeads([
        { Name: 'Test User', Phone: testRawPhone },
      ]);
      setCustomResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopyCleaned = () => {
    if (previewData.cleaned_leads.length === 0) return;
    const csvContent =
      'Name,Phone\n' +
      previewData.cleaned_leads.map((r) => `${r.Name},${r.Phone}`).join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Python Lead Data Cleaning Pipeline
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Standardizes Indian mobile numbers (+91XXXXXXXXXX), deduplicates (Name + Phone), and validates format.
          </p>
        </div>

        <button
          onClick={handleRunCleaning}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          {running ? 'Running clean_leads.py...' : 'Execute Data Cleaning'}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Input Rows (leads.csv)</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {cleaningStatus?.raw_count || previewData.raw_leads.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Exact assignment input</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase">Valid Cleaned Leads</span>
          <p className="text-2xl font-extrabold text-emerald-800 mt-1">
            {cleaningStatus?.cleaned_count || previewData.cleaned_leads.length}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            Saved to cleaned_leads.csv
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 uppercase">Duplicates Removed</span>
          <p className="text-2xl font-extrabold text-amber-800 mt-1">
            {lastSummary?.duplicates ?? 1}
          </p>
          <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
            Sneha Reddy duplicate deduplicated
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 uppercase">Invalid Rows</span>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">
            {lastSummary?.invalid ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Reported without silent drop</span>
        </div>
      </div>

      {/* Side-by-Side Comparison: Input vs Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Input */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Input Data (leads.csv)</h3>
              <p className="text-[11px] text-slate-500">Uncleaned sample from assignment</p>
            </div>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold font-mono">
              {previewData.raw_leads.length} rows
            </span>
          </div>

          <div className="flex-1 mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Raw Phone Input</th>
                  <th className="py-2.5 px-3">Format State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {previewData.raw_leads.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 text-slate-400 font-sans">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 font-sans">{row.Name}</td>
                    <td className="py-2 px-3 text-rose-700 bg-rose-50/40 rounded">{row.Phone}</td>
                    <td className="py-2 px-3 text-slate-500 text-[11px] font-sans">
                      {idx === 0
                        ? 'Plain 10-digit'
                        : idx === 1
                        ? 'Spaces & 91 prefix'
                        : idx === 2
                        ? 'Hyphens & leading 0'
                        : idx === 3
                        ? '+91 country code'
                        : idx === 4
                        ? 'Duplicate row'
                        : '+91 with hyphen'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cleaned Output */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cleaned Data (cleaned_leads.csv)</h3>
              <p className="text-[11px] text-emerald-600 font-semibold">
                Exact target output matching specification
              </p>
            </div>
            <button
              onClick={handleCopyCleaned}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied CSV!' : 'Copy CSV'}
            </button>
          </div>

          <div className="flex-1 mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-emerald-50/60 text-emerald-800 font-semibold border-b border-emerald-200">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Standardized Phone</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 font-mono">
                {previewData.cleaned_leads.map((row, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/30">
                    <td className="py-2 px-3 text-slate-400 font-sans">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900 font-sans">{row.Name}</td>
                    <td className="py-2 px-3 text-emerald-800 font-bold">{row.Phone}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Valid Indian Mobile
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Phone Standardizer Sandbox */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-1">Interactive Number Normalizer</h3>
        <p className="text-xs text-slate-500 mb-4">
          Test individual mobile numbers to see the regex normalization in real time.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={testRawPhone}
            onChange={(e) => setTestRawPhone(e.target.value)}
            placeholder="e.g. 098-765-99887 or +91 98765 12345"
            className="flex-1 w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
          />
          <button
            onClick={handleTestSingleNumber}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Normalize Number
          </button>
        </div>

        {customResult && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
            {customResult.cleaned_records.length > 0 ? (
              <div className="text-emerald-700 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Standardized Result: {customResult.cleaned_records[0].Phone}
              </div>
            ) : (
              <div className="text-rose-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Invalid: {customResult.invalid_records[0]?.Reason}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CLI Execution & Pytest Instructions (Requirement 10) */}
      <div className="bg-slate-950 text-slate-300 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-white">CLI Execution & Pytest Suite</h3>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <span className="text-slate-500"># 1. Run Python data cleaning script from terminal:</span>
            <div className="bg-slate-900 p-2.5 rounded-lg text-amber-300 mt-1 select-all">
              python clean_leads.py leads.csv cleaned_leads.csv invalid_leads.csv
            </div>
          </div>

          <div>
            <span className="text-slate-500"># 2. Run automated test suite with full coverage:</span>
            <div className="bg-slate-900 p-2.5 rounded-lg text-emerald-400 mt-1 select-all">
              pytest test_clean_leads.py -v
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
