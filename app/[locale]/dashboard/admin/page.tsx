'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Users, ShieldCheck, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  CalendarDays, RefreshCw, TrendingUp, Wallet, AlertCircle,
} from 'lucide-react';
import { getStats, getAvadaBalance, type WalletStats } from '@/lib/admin-api';
import clsx from 'clsx';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n));
}

function ChartBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
      <span className="text-xs text-gray-500 dark:text-gray-400">{value}</span>
      <div className="w-full flex items-end" style={{ height: 80 }}>
        <div
          className={clsx('w-full rounded-t-sm transition-all duration-500', color)}
          style={{ height: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400 truncate max-w-full">{label}</span>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avadaBal, setAvadaBal] = useState<number | null>(null);
  const [avadaErr, setAvadaErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setAvadaErr('');
    try {
      const [s, ab] = await Promise.allSettled([getStats(), getAvadaBalance()]);
      if (s.status === 'fulfilled') setStats(s.value);
      else setError((s.reason as Error).message);
      if (ab.status === 'fulfilled') setAvadaBal(ab.value.balance);
      else setAvadaErr((ab.reason as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const kpis = stats ? [
    { label: 'Wallet users inscrits', value: fmt(stats.total_users), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Utilisateurs KYC vérifiés', value: fmt(stats.kyc_verified), icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Volume déposé (CDF)', value: fmt(stats.total_deposited_cdf), icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Volume retiré (CDF)', value: fmt(stats.total_withdrawn_cdf), icon: ArrowUpRight, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Volume P2P (CDF)', value: fmt(stats.total_p2p_cdf), icon: ArrowLeftRight, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: "Transactions aujourd'hui", value: fmt(stats.transactions_today), icon: CalendarDays, color: 'text-[#1D9E75]', bg: 'bg-[#1D9E75]/10' },
  ] : [];

  const chart = stats?.chart ?? [];
  const maxChart = Math.max(1, ...chart.flatMap((d) => [d.collect, d.payout, d.p2p]));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="text-[#1D9E75]" size={22} />
            Vue d&apos;ensemble — Admin Wallet
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Métriques globales du service wallet UniPay Congo</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Avada Pay caisse card */}
      <div className={clsx(
        'relative overflow-hidden rounded-2xl p-5 border shadow-sm flex items-center justify-between gap-4',
        'bg-gradient-to-r from-[#1D9E75]/10 to-emerald-500/5 border-[#1D9E75]/30 dark:border-[#1D9E75]/20',
      )}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#1D9E75]/15">
            <Wallet size={22} className="text-[#1D9E75]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1D9E75] uppercase tracking-wider mb-0.5">Caisse wallet disponible</p>
            {loading ? (
              <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : avadaErr ? (
              <div className="flex items-center gap-1.5 text-sm text-orange-500 max-w-xl">
                <AlertCircle size={14} />
                <span>{avadaErr}</span>
              </div>
            ) : (
              <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                {avadaBal === null ? '—' : fmt(avadaBal)}
                {avadaBal !== null && <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">CDF</span>}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Solde calculé depuis les dépôts, retraits et ajustements admin
            </p>
          </div>
        </div>
        <a
          href="/fr/dashboard/admin/adjustments"
          className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#1D9E75] text-white text-xs font-semibold hover:bg-[#17876A] transition-colors"
        >
          Créditer un wallet
        </a>
      </div>

      {/* KPI cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {kpis.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className={clsx('inline-flex p-2 rounded-xl', bg)}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <div className="text-xl font-heading font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bar chart — 7 days */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Transactions — 7 derniers jours</h2>
        <div className="flex items-center gap-4 mb-4">
          {[
            { color: 'bg-green-500', label: 'Collect' },
            { color: 'bg-orange-500', label: 'Payout' },
            { color: 'bg-purple-500', label: 'P2P' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={clsx('w-2.5 h-2.5 rounded-sm inline-block', color)} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
        {loading && !stats ? (
          <div className="h-24 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ) : (
          <div className="flex items-end gap-2">
            {chart.map((d) => (
              <div key={d.date} className="flex gap-0.5 flex-1">
                <ChartBar value={d.collect} max={maxChart} label={d.date.slice(5)} color="bg-green-400 dark:bg-green-500" />
                <ChartBar value={d.payout} max={maxChart} label="" color="bg-orange-400 dark:bg-orange-500" />
                <ChartBar value={d.p2p} max={maxChart} label="" color="bg-purple-400 dark:bg-purple-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/admin/wallet-users', label: 'Wallet Users', icon: Users },
          { href: '/dashboard/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
          { href: '/dashboard/admin/adjustments', label: 'Ajustements', icon: TrendingUp },
          { href: '/dashboard/admin/kyc-merchants', label: 'KYC Merchants', icon: ShieldCheck },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-[#1D9E75]/50 hover:text-[#1D9E75] transition-all shadow-sm"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
