'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw, Activity, CheckCircle2, AlertTriangle, XCircle, Clock, type LucideIcon } from 'lucide-react';
import Footer from '@/components/Footer';

/* ── types ────────────────────────────────────────────────────── */
type OperatorStatus = 'operational' | 'degraded' | 'down' | 'coming_soon';

interface Operator {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  status: OperatorStatus;
  uptime: string;
  latency: string;
  description: string;
}

/* ── static data (hardcoded, replace with API fetch when ready) ─ */
const OPERATORS: Operator[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    color: '#FF7900',
    bgColor: 'rgba(255,121,0,0.12)',
    status: 'operational',
    uptime: '99.9%',
    latency: '1.2s',
    description: 'Orange Money RDC',
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    color: '#E40000',
    bgColor: 'rgba(228,0,0,0.10)',
    status: 'operational',
    uptime: '99.8%',
    latency: '1.4s',
    description: 'Airtel Money RDC',
  },
  {
    id: 'afrimoney',
    name: 'Afrimoney',
    color: '#0057A8',
    bgColor: 'rgba(0,87,168,0.10)',
    status: 'operational',
    uptime: '99.7%',
    latency: '1.6s',
    description: 'Afrimoney RDC',
  },
  {
    id: 'vodacash',
    name: 'Vodacash / M-Pesa',
    color: '#E31837',
    bgColor: 'rgba(227,24,55,0.08)',
    status: 'coming_soon',
    uptime: '—',
    latency: '—',
    description: 'Vodacom DRC · Intégration en cours',
  },
];

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
  coming_soon: {
    icon: Clock,
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    text: 'text-gray-500 dark:text-gray-400',
  },
};

const STATUS_EMOJI: Record<OperatorStatus, string> = {
  operational: '✅',
  degraded: '⚠️',
  down: '❌',
  coming_soon: '🔜',
};

/* ── helpers ──────────────────────────────────────────────────── */
function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/* ── UptimeBar ────────────────────────────────────────────────── */
function UptimeBar({ uptime }: { uptime: string }) {
  if (uptime === '—') return <span className="text-sm text-gray-400">—</span>;
  const pct = parseFloat(uptime);
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
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-12 flex-shrink-0">{uptime}</span>
    </div>
  );
}

/* ── OperatorCard ─────────────────────────────────────────────── */
function OperatorCard({ op, tLabel }: { op: Operator; tLabel: (k: OperatorStatus) => string }) {
  const cfg = STATUS_CONFIG[op.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-ink/60 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300">
      {/* Color top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: op.color }} />

      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-heading font-bold text-white shadow-md"
              style={{ backgroundColor: op.color, boxShadow: `0 4px 14px ${op.color}40` }}
            >
              {op.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{op.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{op.description}</p>
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${cfg.badge}`}>
            <StatusIcon size={11} />
            {STATUS_EMOJI[op.status]} {tLabel(op.status)}
          </span>
        </div>

        {/* Uptime bar */}
        {op.status !== 'coming_soon' && (
          <div className="mb-3">
            <UptimeBar uptime={op.uptime} />
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Uptime 30j</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-mono">{op.uptime}</p>
          </div>
          <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Latence</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-mono">{op.latency}</p>
          </div>
          {op.status !== 'coming_soon' && (
            <>
              <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${op.status === 'operational' ? 'animate-pulse' : ''}`} />
                <span className={`text-xs font-medium ${cfg.text}`}>Live</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function StatusPage() {
  const t = useTranslations('status');

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setCountdown(AUTO_REFRESH_SECONDS);
      setIsRefreshing(false);
    }, 600);
  }, []);

  /* Auto-refresh countdown */
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          refresh();
          return AUTO_REFRESH_SECONDS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const tLabel = (s: OperatorStatus) => t(s as Parameters<typeof t>[0]);

  const activeOps = OPERATORS.filter((o) => o.status !== 'coming_soon');
  const allOk = activeOps.every((o) => o.status === 'operational');

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-ink pt-16 overflow-x-hidden">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-16 lg:py-20 border-b border-gray-200 dark:border-gray-800">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-ink dark:via-ink/80 dark:to-ink" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-signal/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal/10 border border-signal/25 text-signal text-xs font-semibold mb-4">
                  <Activity size={13} />
                  {t('badge')}
                </div>
                <h1 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                  {t('title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-lg text-sm sm:text-base leading-relaxed">
                  {t('subtitle')}
                </p>
              </div>

              {/* Overall status pill */}
              <div className={`flex-shrink-0 self-start lg:self-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${
                allOk
                  ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800/40'
              }`}>
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${allOk ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                <span className={`text-sm font-semibold ${allOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {allOk ? t('all_operational') : t('some_issues')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Refresh bar ───────────────────────────────────────── */}
        <div className="sticky top-16 z-20 bg-white/90 dark:bg-ink/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-0">
              <span className="hidden sm:inline">{t('last_updated')}: </span>
              <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{formatTime(lastUpdated)}</span>
              <span className="ml-2 text-gray-400">· <span className="font-mono font-medium text-signal">{countdown}s</span></span>
            </span>
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-signal hover:bg-signal/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              {t('refresh')}
            </button>
          </div>

          {/* Countdown progress bar */}
          <div className="h-0.5 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-signal transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / AUTO_REFRESH_SECONDS) * 100}%` }}
            />
          </div>
        </div>

        {/* ── Operator cards ────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 ${isRefreshing ? 'opacity-50 transition-opacity' : 'opacity-100 transition-opacity duration-300'}`}>
            {OPERATORS.map((op) => (
              <OperatorCard key={op.id} op={op} tLabel={tLabel} />
            ))}
          </div>
        </section>

        {/* ── Status table (summary) ────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 dark:bg-ink/60 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('incident_title')}</h2>
            </div>
            <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('incident_none')}</p>
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {STATUS_EMOJI[key]} {t(key as Parameters<typeof t>[0])}
                  </span>
                </div>
              );
            })}
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">{t('page_info')}</span>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
