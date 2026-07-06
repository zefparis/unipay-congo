'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Receipt, RefreshCw, Loader2, Check, Upload, FileText,
  Copy, CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown,
} from 'lucide-react';
import clsx from 'clsx';

/* ── Types ─────────────────────────────────────────────────── */
interface DevExpense {
  id: string;
  service: string;
  billing_month: string;
  amount_usd: number;
  source: string;
  invoice_url: string | null;
  status: 'pending' | 'paid' | 'reconciled';
  notes: string | null;
}

interface MonthHistory {
  billing_month: string;
  services: { service: string; amount_usd: number; status: string }[];
  total_usd: number;
  global_status: 'incomplete' | 'pending' | 'ready';
  share_token: string | null;
  share_url: string | null;
  generated_at: string | null;
}

interface HistoryResponse {
  data: MonthHistory[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const SERVICES = ['render', 'vercel', 'supabase', 'cloudflare', 'anthropic'] as const;
const SERVICE_LABELS: Record<string, string> = {
  render: 'Render',
  vercel: 'Vercel',
  supabase: 'Supabase',
  cloudflare: 'Cloudflare',
  anthropic: 'Anthropic',
};

const STATUS_CFG: Record<string, { icon: typeof CheckCircle2; badge: string }> = {
  pending:     { icon: Clock,         badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' },
  paid:        { icon: CheckCircle2,  badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' },
  reconciled:  { icon: CheckCircle2,  badge: 'bg-signal/10 text-signal border-signal/20' },
};

function fmtMonth(s: string) {
  const d = new Date(s + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function fmtUsd(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function currentMonthStr() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

/* ── Page ──────────────────────────────────────────────────── */
export default function DevExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<MonthHistory[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const [expenses, setExpenses] = useState<DevExpense[]>([]);
  const [pullLoading, setPullLoading] = useState(false);
  const [pullResult, setPullResult] = useState<{ pulled: any[]; failed: any[]; manual_required: any[] } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportResult, setReportResult] = useState<{ share_url: string; total_usd: number } | null>(null);
  const [error, setError] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Manual entry form state
  const [manualService, setManualService] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualLoading, setManualLoading] = useState(false);

  // Mark paid state
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/dev-expenses/history?limit=12');
      const data = await res.json() as HistoryResponse;
      setHistory(data.data ?? []);
    } catch {
      setError('Failed to load history');
    }
    setLoading(false);
  }, []);

  const loadMonthExpenses = useCallback(async (month: string) => {
    setError('');
    try {
      const res = await fetch(`/api/admin/dev-expenses?billing_month=${encodeURIComponent(month)}`);
      const data = await res.json() as { data?: DevExpense[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to load month expenses');
        setExpenses([]);
      } else {
        setExpenses(data.data ?? []);
      }
    } catch {
      setError('Failed to load month expenses');
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadMonthExpenses(selectedMonth);
  }, [selectedMonth, loadMonthExpenses]);

  const handlePull = async () => {
    setPullLoading(true);
    setPullResult(null);
    setError('');
    try {
      const res = await fetch('/api/admin/dev-expenses/pull-automated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Pull failed');
      } else {
        setPullResult(data);
        loadMonthExpenses(selectedMonth);
        loadHistory();
      }
    } catch {
      setError('Network error during pull');
    }
    setPullLoading(false);
  };

  const handleManualSubmit = async () => {
    if (!manualService || !manualAmount) return;
    setManualLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('service', manualService);
      formData.append('billing_month', selectedMonth);
      formData.append('amount_usd', manualAmount);
      if (manualNotes) formData.append('notes', manualNotes);
      if (manualFile) formData.append('invoice_file', manualFile);

      const res = await fetch('/api/admin/dev-expenses', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Manual entry failed');
      } else {
        setManualService('');
        setManualAmount('');
        setManualNotes('');
        setManualFile(null);
        loadMonthExpenses(selectedMonth);
        loadHistory();
      }
    } catch {
      setError('Network error during manual entry');
    }
    setManualLoading(false);
  };

  const handleMarkPaid = async (id: string) => {
    // The ID from history is synthetic — we need the real UUID
    // For now, we use the synthetic ID pattern
    setPayingId(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/dev-expenses/${id}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_ref: paymentRef || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Mark paid failed');
      } else {
        setPayingId(null);
        setPaymentRef('');
        loadMonthExpenses(selectedMonth);
        loadHistory();
      }
    } catch {
      setError('Network error');
    }
    setPayingId(null);
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportResult(null);
    setError('');
    try {
      const res = await fetch('/api/admin/dev-expenses/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Report generation failed');
        if (data.incomplete) {
          setError(`Missing/pending services: ${data.incomplete.join(', ')}`);
        }
      } else {
        setReportResult({ share_url: data.share_url, total_usd: data.total_usd });
        loadHistory();
      }
    } catch {
      setError('Network error during report generation');
    }
    setReportLoading(false);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const currentMonthData = history.find((h) => h.billing_month === selectedMonth);
  const allServicesFilled = SERVICES.every((s) =>
    expenses.some((e) => e.service === s)
  );
  const anyPending = expenses.some((e) => e.status === 'pending');
  const canGenerate = allServicesFilled && !anyPending;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-signal/10">
            <Receipt size={20} className="text-signal" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-gray-900 dark:text-white">Dev Expenses Tracker</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Monthly infra cost tracking & reporting</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth.slice(0, 7)}
            onChange={(e) => setSelectedMonth(e.target.value + '-01')}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/40"
          />
          <button
            onClick={() => { loadMonthExpenses(selectedMonth); loadHistory(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-signal hover:bg-signal/10 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Pull automated ─────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Automated Pull</h2>
          <button
            onClick={handlePull}
            disabled={pullLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-signal hover:bg-signal/85 text-white text-xs font-semibold disabled:opacity-50 transition-all"
          >
            {pullLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Pull Anthropic + Vercel
          </button>
        </div>
        {pullResult && (
          <div className="space-y-2 text-xs">
            {pullResult.pulled?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pullResult.pulled.map((p: any) => (
                  <span key={p.service} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                    <Check size={12} />
                    {SERVICE_LABELS[p.service] ?? p.service}: {fmtUsd(p.amount_usd)}
                  </span>
                ))}
              </div>
            )}
            {pullResult.failed?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pullResult.failed.map((f: any) => (
                  <span key={f.service} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                    <AlertCircle size={12} />
                    {SERVICE_LABELS[f.service] ?? f.service}: {f.reason}
                  </span>
                ))}
              </div>
            )}
            {pullResult.manual_required?.length > 0 && (
              <p className="text-gray-500 dark:text-gray-400">
                Manual entry required for: {pullResult.manual_required.map((m: any) => SERVICE_LABELS[m.service] ?? m.service).join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Current month table ────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {fmtMonth(selectedMonth)} — Services
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {SERVICES.map((svc) => {
            const exp = expenses.find((e) => e.service === svc);
            const sc = exp ? STATUS_CFG[exp.status] : null;
            const Icon = sc?.icon ?? Clock;

            return (
              <div key={svc} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{SERVICE_LABELS[svc]}</p>
                  <p className="text-xs text-gray-400">
                    {exp ? `${exp.source === 'api_pull' ? 'Auto-pulled' : 'Manual'} · ${fmtUsd(exp.amount_usd)}` : 'Not entered'}
                  </p>
                </div>
                {exp && sc && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${sc.badge}`}>
                    <Icon size={10} />
                    {exp.status}
                  </span>
                )}
                {exp && exp.status === 'pending' && (
                  <button
                    onClick={() => { setPayingId(exp.id); setPaymentRef(''); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all"
                  >
                    <Check size={12} />
                    Mark Paid
                  </button>
                )}
                {!exp && (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            );
          })}
        </div>
        {payingId && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Payment reference (optional)"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkPaid(payingId)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all"
              >
                <Check size={12} />
                Confirm Paid
              </button>
              <button
                onClick={() => setPayingId(null)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Manual entry form ──────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Manual Entry (Render / Supabase / Cloudflare)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={manualService}
            onChange={(e) => setManualService(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-signal/40"
          >
            <option value="">Select service…</option>
            <option value="render">Render</option>
            <option value="supabase">Supabase</option>
            <option value="cloudflare">Cloudflare</option>
            <option value="vercel">Vercel</option>
            <option value="anthropic">Anthropic</option>
          </select>
          <input
            type="number"
            step="0.01"
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
            placeholder="Amount USD"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-signal/40"
          />
          <input
            type="text"
            value={manualNotes}
            onChange={(e) => setManualNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-signal/40"
          />
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                onChange={(e) => setManualFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 hover:border-signal hover:text-signal transition-colors">
                <Upload size={14} />
                {manualFile ? manualFile.name : 'Invoice'}
              </div>
            </label>
            <button
              onClick={handleManualSubmit}
              disabled={!manualService || !manualAmount || manualLoading}
              className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-signal hover:bg-signal/85 text-white text-xs font-semibold disabled:opacity-50 transition-all"
            >
              {manualLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Generate report ────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Generate Report</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {canGenerate
                ? 'All 5 services filled — ready to generate'
                : !allServicesFilled
                  ? `Missing: ${SERVICES.filter((s) => !expenses.some((e) => e.service === s)).join(', ')}`
                  : 'Some services still pending — mark as paid first'}
            </p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={!canGenerate || reportLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-signal hover:bg-signal/85 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {reportLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            Generate PDF + Share Link
          </button>
        </div>
        {reportResult && (
          <div className="mt-3 p-4 rounded-xl bg-signal/5 border border-signal/20">
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Report generated! Share this link with tekkbridge:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 text-xs font-mono text-signal break-all">
                {reportResult.share_url}
              </code>
              <button
                onClick={() => handleCopy(reportResult.share_url)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-signal text-white text-xs font-semibold transition-all"
              >
                {copiedUrl === reportResult.share_url ? <Check size={12} /> : <Copy size={12} />}
                {copiedUrl === reportResult.share_url ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Total: {fmtUsd(reportResult.total_usd)}</p>
          </div>
        )}
      </div>

      {/* ── History ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Monthly History</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-signal" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No expenses recorded yet</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {history.map((month) => (
              <div key={month.billing_month} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtMonth(month.billing_month)}</p>
                      <span className={clsx(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
                        month.global_status === 'ready' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
                        month.global_status === 'pending' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
                        month.global_status === 'incomplete' && 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700',
                      )}>
                        {month.global_status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Total: {fmtUsd(month.total_usd)} · {month.services.length}/5 services
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {month.share_url ? (
                      <button
                        onClick={() => handleCopy(month.share_url!)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-signal hover:bg-signal/10 transition-colors"
                      >
                        {copiedUrl === month.share_url ? <Check size={12} /> : <Copy size={12} />}
                        {copiedUrl === month.share_url ? 'Copied' : 'Copy link'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedMonth(month.billing_month)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-signal hover:bg-signal/10 transition-colors"
                      >
                        <Receipt size={12} />
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
