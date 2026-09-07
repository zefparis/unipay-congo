'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Building2, ShieldCheck, FlaskConical, Globe, TrendingUp,
  RefreshCw, ArrowLeftRight, CalendarDays, AlertCircle,
} from 'lucide-react';
import { getMerchantStats, type MerchantStats } from '@/lib/admin-api';
import clsx from 'clsx';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n));
}

export default function MerchantOverviewPage() {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const s = await getMerchantStats();
      setStats(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const kpis = stats ? [
    { label: 'Total marchands', value: fmt(stats.total_merchants), icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Mode Live', value: fmt(stats.mode_breakdown.live), icon: Globe, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Mode Sandbox', value: fmt(stats.mode_breakdown.sandbox), icon: FlaskConical, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: "Transactions aujourd'hui", value: fmt(stats.transactions_today), icon: CalendarDays, color: 'text-green-deep-dark', bg: 'bg-green-deep/10' },
  ] : [];

  const kycKpis = stats ? [
    { label: 'KYC Approuvé', value: fmt(stats.kyc_breakdown.approved), icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'KYC En attente', value: fmt(stats.kyc_breakdown.submitted), icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'KYC Non soumis', value: fmt(stats.kyc_breakdown.pending), icon: Building2, color: 'text-gray-500', bg: 'bg-gray-500/10' },
  ] : [];

  const volumeEntries = stats ? Object.entries(stats.volume_30d) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
            <TrendingUp className="text-green-deep" size={22} />
            Vue d&apos;ensemble — Paiements Marchands
          </h1>
          <p className="text-sm text-gray-500 dark:text-text-secondary mt-0.5">Métriques globales des marchands B2B UniPay Congo</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all disabled:opacity-50"
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

      {/* KPI cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className={clsx('inline-flex p-2 rounded-xl', bg)}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <div className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary">{value}</div>
                <div className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KYC breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary mb-3 flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-500" />
          KYC Marchands
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kycKpis.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className={clsx('inline-flex p-2 rounded-xl', bg)}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <div className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary">{value}</div>
                <div className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume 30 days */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary mb-4">Volume transactions (30 derniers jours)</h2>
        {volumeEntries.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-6">Aucune transaction sur la période.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {volumeEntries.map(([currency, volume]) => (
              <div key={currency} className="border border-gray-100 dark:border-text-secondary/15 rounded-xl p-4">
                <div className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary">
                  {fmt(volume)}
                  <span className="text-sm font-normal text-gray-500 dark:text-text-secondary ml-1.5">{currency}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">Volume net (success)</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { href: '/dashboard/admin/merchants/list', label: 'Marchands', icon: Building2 },
          { href: '/dashboard/admin/merchants/kyc', label: 'KYC Merchants', icon: ShieldCheck },
          { href: '/dashboard/admin/merchants/transactions', label: 'Transactions Marchands', icon: ArrowLeftRight },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-xl text-sm font-medium text-gray-700 dark:text-text-primary hover:border-green-deep/50 hover:text-green-deep transition-all shadow-sm"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
