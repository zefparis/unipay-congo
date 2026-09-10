'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw, Activity, CheckCircle2, AlertTriangle, XCircle, Clock, type LucideIcon } from 'lucide-react';
import Footer from '@/components/Footer';

/* ── types ────────────────────────────────────────────────────── */
type OperatorStatus = 'operational' | 'degraded' | 'down' | 'insufficient_data';

interface Operator {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  status: OperatorStatus;
  successRatePct: number | null;
  totalAttempts: number;
  successCount: number;
  failedCount: number;
  processingCount: number;
  providerOutageFailures: number;
  avgLatencyMs: number | null;
  lastIncidentAt: string | null;
  description: string;
}

interface ApiOperator {
  operator: string;
  name: string;
  status: OperatorStatus;
  success_rate_pct: number | null;
  total_attempts_24h: number;
  success_count: number;
  failed_count: number;
  processing_count: number;
  provider_outage_failures_24h: number;
  avg_latency_ms: number | null;
  last_incident_at: string | null;
}

/* ── operator visual config (static — colors don't change) ────── */
const OPERATOR_VISUAL: Record<string, { color: string; bgColor: string; description: string }> = {
  orange:    { color: '#FF7900', bgColor: 'rgba(255,121,0,0.12)', description: 'Orange Money RDC' },
  airtel:    { color: '#E40000', bgColor: 'rgba(228,0,0,0.10)',  description: 'Airtel Money RDC' },
  afrimoney: { color: '#0057A8', bgColor: 'rgba(0,87,168,0.10)', description: 'Afrimoney RDC' },
};

const OPERATOR_ORDER = ['orange', 'airtel', 'afrimoney'];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const AUTO_REFRESH_SECONDS = 60;

/* ── status config ────────────────────────────────────────────── */
const STATUS_CONFIG: Record<OperatorStatus, {
  icon: LucideIcon;
  dot: string;
  badge: string;
  text: string;
}> = {
  operational: {
    icon: CheckCircle2,
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  degraded: {
    icon: AlertTriangle,
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    text: 'text-amber-600 dark:text-amber-400',
  },
  down: {
    icon: XCircle,
    dot: 'bg-red-500',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40',
    text: 'text-red-600 dark:text-red-400',
  },
  insufficient_data: {
    icon: Clock,
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 dark:bg-navy-panel text-gray-600 dark:text-text-secondary border-gray-200 dark:border-text-secondary/20',
    text: 'text-gray-500 dark:text-text-secondary',
  },
};

const STATUS_EMOJI: Record<OperatorStatus, string> = {
  operational: '✅',
  degraded: '⚠️',
  down: '❌',
  insufficient_data: '⏳',
};

/* ── helpers ──────────────────────────────────────────────────── */
function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatLatency(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatSuccessRate(pct: number | null): string {
  if (pct === null) return '—';
  return `${pct}%`;
}

function formatIncidentTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH}h`;
    return d.toLocaleDateString();
  } catch {
    return '—';
  }
}

/* ── UptimeBar ────────────────────────────────────────────────── */
function UptimeBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-sm text-gray-400">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-6 rounded-sm ${i < Math.floor(30 * pct / 100) ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-text-primary w-12 flex-shrink-0">{pct}%</span>
    </div>
  );
}

/* ── OperatorCard ─────────────────────────────────────────────── */
function OperatorCard({ op, tLabel }: { op: Operator; tLabel: (k: OperatorStatus) => string }) {
  const cfg = STATUS_CONFIG[op.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="group relative rounded-2xl border border-gray-200 dark:border-text-secondary/15 bg-white dark:bg-navy/60 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
      {/* Color top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: op.color }} />

      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-serif font-bold text-white shadow-md"
              style={{ backgroundColor: op.color, boxShadow: `0 4px 14px ${op.color}40` }}
            >
              {op.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-text-primary text-sm leading-tight">{op.name}</p>
              <p className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">{op.description}</p>
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.badge}`}>
            <StatusIcon size={11} />
            {STATUS_EMOJI[op.status]} {tLabel(op.status)}
          </span>
        </div>

        {/* Success rate bar (24h) */}
        <div className="mb-3">
          <UptimeBar pct={op.successRatePct} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-text-secondary/15">
          <div>
            <p className="text-xs text-gray-400 dark:text-text-secondary/70">Taux succès 24h</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-text-primary font-mono">{formatSuccessRate(op.successRatePct)}</p>
          </div>
          <div className="w-px h-8 bg-gray-100 dark:bg-navy-panel" />
          <div>
            <p className="text-xs text-gray-400 dark:text-text-secondary/70">Latence moy.</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-text-primary font-mono">{formatLatency(op.avgLatencyMs)}</p>
          </div>
          <div className="w-px h-8 bg-gray-100 dark:bg-navy-panel" />
          <div>
            <p className="text-xs text-gray-400 dark:text-text-secondary/70">Tentatives 24h</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-text-primary font-mono">{op.totalAttempts}</p>
          </div>
        </div>

        {/* Last incident */}
        {op.lastIncidentAt && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-text-secondary/15">
            <p className="text-xs text-gray-400 dark:text-text-secondary/70">
              Dernier incident : <span className="text-red-500 dark:text-red-400 font-medium">{formatIncidentTime(op.lastIncidentAt)}</span>
              {op.providerOutageFailures > 0 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">({op.providerOutageFailures} panne(s) provider 24h)</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function StatusPage() {
  const t = useTranslations('status');

  const [operators, setOperators] = useState<Operator[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/status/operators`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { operators: ApiOperator[] };

      const mapped: Operator[] = OPERATOR_ORDER.map((id) => {
        const apiOp = data.operators.find((o) => o.operator === id);
        const visual = OPERATOR_VISUAL[id];
        return {
          id,
          name: apiOp?.name ?? visual.description,
          color: visual.color,
          bgColor: visual.bgColor,
          description: visual.description,
          status: apiOp?.status ?? 'insufficient_data',
          successRatePct: apiOp?.success_rate_pct ?? null,
          totalAttempts: apiOp?.total_attempts_24h ?? 0,
          successCount: apiOp?.success_count ?? 0,
          failedCount: apiOp?.failed_count ?? 0,
          processingCount: apiOp?.processing_count ?? 0,
          providerOutageFailures: apiOp?.provider_outage_failures_24h ?? 0,
          avgLatencyMs: apiOp?.avg_latency_ms ?? null,
          lastIncidentAt: apiOp?.last_incident_at ?? null,
        };
      });

      setOperators(mapped);
      setLastUpdated(new Date());
      setCountdown(AUTO_REFRESH_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /* Initial fetch + auto-refresh countdown */
  useEffect(() => {
    void fetchStatus();

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          void fetchStatus();
          return AUTO_REFRESH_SECONDS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const tLabel = (s: OperatorStatus) => t(s as Parameters<typeof t>[0]);

  const activeOps = operators.filter((o) => o.status !== 'insufficient_data');
  const allOk = activeOps.length > 0 && activeOps.every((o) => o.status === 'operational');
  const hasIssues = activeOps.some((o) => o.status === 'down' || o.status === 'degraded');

  return (
    <>
      <main className="min-h-screen bg-[#E8EBF0] dark:bg-navy pt-16 overflow-x-hidden">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-16 lg:py-20 border-b border-gray-200 dark:border-text-secondary/15">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-navy dark:via-navy/80 dark:to-navy" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-deep/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-deep/10 border border-green-deep/25 text-green-deep text-xs font-semibold mb-4">
                  <Activity size={13} />
                  {t('badge')}
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-text-primary mb-3 tracking-tight">
                  {t('title')}
                </h1>
                <p className="text-gray-600 dark:text-text-secondary max-w-lg text-sm sm:text-base leading-relaxed">
                  {t('subtitle')}
                </p>
              </div>

              {/* Overall status pill */}
              <div className={`flex-shrink-0 self-start lg:self-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${
                error
                  ? 'bg-gray-50 dark:bg-gray-900/15 border-gray-200 dark:border-gray-700/40'
                  : hasIssues
                    ? 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/40'
                    : allOk
                      ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800/40'
              }`}>
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  error ? 'bg-gray-400' : hasIssues ? 'bg-red-500 animate-pulse' : allOk ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                }`} />
                <span className={`text-sm font-semibold ${
                  error ? 'text-gray-600 dark:text-gray-400'
                    : hasIssues ? 'text-red-700 dark:text-red-400'
                      : allOk ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                }`}>
                  {error
                    ? t('unavailable')
                    : hasIssues
                      ? t('some_issues')
                      : allOk
                        ? t('all_operational')
                        : t('some_issues')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Refresh bar ───────────────────────────────────────── */}
        <div className="sticky top-16 z-20 bg-white/90 dark:bg-navy/90 backdrop-blur-md border-b border-gray-200 dark:border-text-secondary/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-text-secondary min-w-0">
              {error ? (
                <span className="text-red-500 dark:text-red-400 font-medium">{t('unavailable')}</span>
              ) : lastUpdated ? (
                <>
                  <span className="hidden sm:inline">{t('last_updated')}: </span>
                  <span className="font-mono font-medium text-gray-700 dark:text-text-primary">{formatTime(lastUpdated)}</span>
                  <span className="ml-2 text-gray-400">· <span className="font-mono font-medium text-green-deep">{countdown}s</span></span>
                </>
              ) : (
                <span className="text-gray-400">Chargement…</span>
              )}
            </span>
            <button
              onClick={() => void fetchStatus()}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-text-secondary hover:text-green-deep hover:bg-green-deep/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              {t('refresh')}
            </button>
          </div>

          {/* Countdown progress bar */}
          <div className="h-0.5 bg-gray-100 dark:bg-navy-panel">
            <div
              className="h-full bg-green-deep transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / AUTO_REFRESH_SECONDS) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Operator cards ────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {error && operators.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <XCircle size={32} className="text-red-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-text-secondary">{t('unavailable')}</p>
              <button
                onClick={() => void fetchStatus()}
                className="mt-2 px-4 py-2 rounded-lg text-xs font-medium text-green-deep border border-green-deep/30 hover:bg-green-deep/10 transition-colors"
              >
                {t('refresh')}
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 ${isRefreshing ? 'opacity-50 transition-opacity' : 'opacity-100 transition-opacity duration-300'}`}>
              {operators.map((op) => (
                <OperatorCard key={op.id} op={op} tLabel={tLabel} />
              ))}
            </div>
          )}
        </section>

        {/* ── Status table (summary) ────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="rounded-2xl border border-gray-200 dark:border-text-secondary/15 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 dark:bg-navy/60 border-b border-gray-200 dark:border-text-secondary/15">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary">{t('incident_title')}</h2>
            </div>
            <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
              {hasIssues ? (
                <>
                  <AlertTriangle size={28} className="text-amber-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-text-primary">{t('incident_active')}</p>
                </>
              ) : (
                <>
                  <CheckCircle2 size={28} className="text-emerald-500" />
                  <p className="text-sm font-medium text-gray-700 dark:text-text-primary">{t('incident_none')}</p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Legend ───────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {(Object.entries(STATUS_CONFIG) as [OperatorStatus, typeof STATUS_CONFIG[OperatorStatus]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex items-center gap-2">
                  <Icon size={14} className={cfg.text} />
                  <span className="text-xs text-gray-500 dark:text-text-secondary">
                    {STATUS_EMOJI[key]} {t(key as Parameters<typeof t>[0])}
                  </span>
                </div>
              );
            })}
            <span className="text-xs text-gray-400 dark:text-text-secondary/70 italic">{t('page_info')}</span>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
