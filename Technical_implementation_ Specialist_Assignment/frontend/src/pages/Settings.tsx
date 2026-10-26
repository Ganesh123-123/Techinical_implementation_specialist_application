import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Building,
  ShieldCheck,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { api } from '../services/api';
import { AutomationRule } from '../types';

export const Settings: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.getAutomationRules();
      setRules(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (ruleId: number) => {
    try {
      await api.toggleAutomationRule(ruleId);
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle rule');
    }
  };

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true);
      setScanResult(null);
      const res = await api.runAutomationEvaluation();
      setScanResult(res.message);
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Failed to evaluate rules');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-amber-500" />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Studio Settings & Automation Rules
          </h2>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Internal event triggers, dashboard notifications, and company profile configurations.
        </p>
      </div>

      {/* Internal Automation Rules Section (Requirement 9) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900">Configured Automation Rules</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active rules monitor project health changes and overdue task dates to prevent operational slippage.
            </p>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {evaluating ? 'Scanning Operations...' : 'Run Automation Scan'}
          </button>
        </div>

        {scanResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{scanResult}</span>
          </div>
        )}

        {/* Rules List */}
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                rule.is_active ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-50/20 border-slate-100 opacity-60'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{rule.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rule.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {rule.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                  <span>Trigger: {rule.trigger_event}</span>
                  <span>•</span>
                  <span>Action: {rule.action_type}</span>
                  <span>•</span>
                  <span>Fired: {rule.execution_count} times</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleToggle(rule.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    rule.is_active
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {rule.is_active ? 'Disable Rule' : 'Enable Rule'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Studio Profile Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Building className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-base text-slate-900">Studio Entity Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Company Name</label>
            <input
              type="text"
              readOnly
              value="Sunrise Interiors Studio"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Operating Currency</label>
            <input
              type="text"
              readOnly
              value="INR (₹) - Indian Rupee"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Studio Headquarters</label>
            <input
              type="text"
              readOnly
              value="100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Studio Team Count</label>
            <input
              type="text"
              readOnly
              value="6 Full-time Members"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
