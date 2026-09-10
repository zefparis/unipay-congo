'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, Building2, ArrowDownToLine, RefreshCw, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface CurrencyBreakdown {
  currency: string;
  transaction_count: number;
  volume_collected: number;
  client_fees: number;
  avada_cost: number;
  net_margin: number;
  net_amount_owed: number;
}

interface MerchantRevenue {
  merchant_id: string;
  name: string;
  transaction_count: number;
  volume_collected: number;
  client_fees: number;
  avada_cost: number;
  net_margin: number;
  net_amount_owed: number;
  by_currency: CurrencyBreakdown[];
}

interface RevenueResponse {
  period: { from: string; to: string };
  totals: {
    transaction_count: number;
    volume_collected: number;
    client_fees: number;
    avada_cost: number;
    net_margin: number;
    net_amount_owed: number;
    merchant_count: number;
  };
  totals_by_currency: CurrencyBreakdown[];
  merchants: MerchantRevenue[];
}

type PeriodPreset = 'today' | '7d' | '30d' | '90d' | 'custom';
type SortBy = 'margin' | 'volume' | 'tx_count';

interface DailyPoint {
  date: string;
  volume_collected: number;
  net_margin: number;
  avada_cost: number;
  transaction_count: number;
}

interface DailyResponse {
  period: { from: string; to: string };
  daily: DailyPoint[];
}

/** Compute the from/to date strings for a given period preset. */
function periodToRange(period: PeriodPreset, customFrom: string, customTo: string): { from: string; to: string } | null {
  const now = new Date();
  if (period === 'custom') {
    if (!customFrom || !customTo) return null;
    return { from: customFrom, to: customTo };
  }
  if (period === 'today') {
    const today = fmtDate(now);
    return { from: today, to: today };
  }
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: fmtDate(fromDate), to: fmtDate(now) };
}

/** Group daily points into weekly buckets when the range is too long for daily display. */
function groupWeekly(daily: DailyPoint[]): DailyPoint[] {
  const buckets = new Map<string, DailyPoint>();
  for (const d of daily) {
    // ISO week: find the Monday of the week
    const date = new Date(d.date + 'T00:00:00.000Z');
    const day = date.getUTCDay(); // 0=Sun..6=Sat
    const diffToMonday = (day + 6) % 7; // days since Monday
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - diffToMonday);
    const weekKey = monday.toISOString().slice(0, 10);
    if (!buckets.has(weekKey)) {
      buckets.set(weekKey, {
        date: weekKey,
        volume_collected: 0,
        net_margin: 0,
        avada_cost: 0,
        transaction_count: 0,
      });
    }
    const b = buckets.get(weekKey)!;
    b.volume_collected += d.volume_collected;
    b.net_margin += d.net_margin;
    b.avada_cost += d.avada_cost;
    b.transaction_count += d.transaction_count;
  }
  return Array.from(buckets.values()).map((b) => ({
    ...b,
    volume_collected: Math.round(b.volume_collected * 100) / 100,
    net_margin: Math.round(b.net_margin * 100) / 100,
    avada_cost: Math.round(b.avada_cost * 100) / 100,
  }));
}

/** Compact number formatter for axis labels (e.g. 1.2M, 340K). */
function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

function fmtAxisDate(dateStr: string, isWeekly: boolean): string {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = d.toLocaleString('fr-CD', { month: 'short', timeZone: 'UTC' });
  if (isWeekly) {
    return `${day} ${month}`;
  }
  return `${day}/${d.getUTCMonth() + 1}`;
}

/**
 * Daily evolution chart — SVG-based line chart showing volume collected and
 * UniPay margin over the selected period, with transaction count as background
 * bars. For periods ≥ 60 days, daily points are grouped into weekly buckets to
 * keep the x-axis readable.
 */
function DailyEvolutionChart({ daily, period }: { daily: DailyPoint[]; period: PeriodPreset }) {
  // Weekly grouping for long ranges (90d or custom > 60 days)
  const useWeekly = period === '90d' || (period === 'custom' && daily.length > 60);
  const points = useWeekly ? groupWeekly(daily) : daily;

  if (points.length === 0) return null;

  // Layout constants
  const W = 800;
  const H = 260;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxVolume = Math.max(1, ...points.map((p) => p.volume_collected));
  const maxMargin = Math.max(1, ...points.map((p) => p.net_margin));
  const maxTx = Math.max(1, ...points.map((p) => p.transaction_count));

  // Use the same y-scale for volume and margin (both monetary), so the
  // relationship between the two lines is visually meaningful.
  const yMax = Math.max(maxVolume, maxMargin);
  const yScale = (v: number) => padT + plotH - (v / yMax) * plotH;
  const xScale = (i: number) => padL + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);

  // Build SVG path strings
  const volumePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.volume_collected)}`).join(' ');
  const marginPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.net_margin)}`).join(' ');

  // X-axis label density: show ~8 labels max
  const labelStep = Math.max(1, Math.ceil(points.length / 8));

  // Y-axis grid lines (4 divisions)
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-text-secondary/15 bg-white dark:bg-navy-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary">
          Évolution quotidienne
          {useWeekly && <span className="ml-2 text-xs text-gray-400">(regroupement hebdomadaire)</span>}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-xs text-gray-500 dark:text-text-secondary">Volume collecté</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs text-gray-500 dark:text-text-secondary">Marge UniPay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-300 dark:bg-gray-600 inline-block" />
            <span className="text-xs text-gray-500 dark:text-text-secondary">Nb transactions</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Évolution quotidienne du volume et de la marge">
        {/* Grid lines + Y-axis labels */}
        {gridLines.map((g) => {
          const y = padT + plotH - g * plotH;
          const val = g * yMax;
          return (
            <g key={g}>
              <line
                x1={padL} y1={y} x2={W - padR} y2={y}
                stroke="currentColor"
                className="text-gray-200 dark:text-text-secondary/10"
                strokeWidth={1}
                strokeDasharray={g === 0 ? '0' : '3 3'}
              />
              <text
                x={padL - 8} y={y + 4}
                textAnchor="end"
                className="fill-gray-400 text-[10px]"
              >
                {fmtCompact(val)}
              </text>
            </g>
          );
        })}

        {/* Transaction count bars (background) */}
        {points.map((p, i) => {
          const barW = Math.max(2, (plotW / points.length) * 0.6);
          const barH = (p.transaction_count / maxTx) * plotH * 0.7;
          const x = xScale(i) - barW / 2;
          const y = padT + plotH - barH;
          return (
            <rect
              key={`tx-${p.date}`}
              x={x} y={y}
              width={barW} height={barH}
              rx={2}
              className="fill-gray-200 dark:fill-gray-600/40"
            >
              <title>{`${fmtAxisDate(p.date, useWeekly)}: ${p.transaction_count} transactions`}</title>
            </rect>
          );
        })}

        {/* Volume collected line */}
        <path
          d={volumePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={`vol-${p.date}`}
            cx={xScale(i)} cy={yScale(p.volume_collected)}
            r={3}
            fill="#3b82f6"
            className="hover:r-5"
          >
            <title>{`${fmtAxisDate(p.date, useWeekly)}\nVolume: ${fmt(p.volume_collected)}`}</title>
          </circle>
        ))}

        {/* UniPay margin line */}
        <path
          d={marginPath}
          fill="none"
          stroke="#10b981"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={`mar-${p.date}`}
            cx={xScale(i)} cy={yScale(p.net_margin)}
            r={3}
            fill="#10b981"
          >
            <title>{`${fmtAxisDate(p.date, useWeekly)}\nMarge UniPay: ${fmt(p.net_margin)}`}</title>
          </circle>
        ))}

        {/* X-axis labels */}
        {points.map((p, i) => {
          if (i % labelStep !== 0 && i !== points.length - 1) return null;
          return (
            <text
              key={`lbl-${p.date}`}
              x={xScale(i)} y={H - padB + 16}
              textAnchor="middle"
              className="fill-gray-400 text-[10px]"
            >
              {fmtAxisDate(p.date, useWeekly)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD', { maximumFractionDigits: 2 }).format(n);
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function MerchantRevenuePage() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<PeriodPreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('margin');
  const [exporting, setExporting] = useState(false);
  const [kpiCurrency, setKpiCurrency] = useState<string>('CDF');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const range = periodToRange(period, customFrom, customTo);
      if (!range) {
        setError('Veuillez sélectionner les dates de début et de fin.');
        setLoading(false);
        return;
      }
      const { from, to } = range;

      const qs = new URLSearchParams({ from, to, sort: sortBy });
      const dailyQs = new URLSearchParams({ from, to });

      // Fetch main revenue data and daily evolution in parallel
      const [mainRes, dailyRes] = await Promise.all([
        fetch(`/api/admin/wallet/merchants/revenue?${qs.toString()}`, { cache: 'no-store' }),
        fetch(`/api/admin/wallet/merchants/revenue/daily?${dailyQs.toString()}`, { cache: 'no-store' }),
      ]);

      if (!mainRes.ok) {
        const err = await mainRes.json().catch(() => ({ error: `HTTP ${mainRes.status}` }));
        throw new Error(err.error ?? `HTTP ${mainRes.status}`);
      }

      setData(await mainRes.json());

      // Daily data is best-effort — don't fail the whole page if it errors
      if (dailyRes.ok) {
        setDailyData(await dailyRes.json());
      } else {
        setDailyData(null);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo, sortBy]);

  useEffect(() => { void load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const range = periodToRange(period, customFrom, customTo);
      if (!range) throw new Error('Période invalide');
      const { from, to } = range;

      const qs = new URLSearchParams({ from, to, sort: sortBy });
      const res = await fetch(`/api/admin/wallet/merchants/revenue?${qs.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Export failed');
      const json = await res.json() as RevenueResponse;

      // Build CSV client-side from the JSON response
      const headers = ['merchant_id', 'name', 'transaction_count', 'volume_collected', 'client_fees', 'avada_cost', 'net_margin', 'net_amount_owed'];
      const lines = [headers.join(',')];
      for (const m of json.merchants) {
        lines.push([
          m.merchant_id,
          `"${m.name.replace(/"/g, '""')}"`,
          m.transaction_count,
          m.volume_collected,
          m.client_fees,
          m.avada_cost,
          m.net_margin,
          m.net_amount_owed,
        ].join(','));
      }

      const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merchant-revenue-${from}-to-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const totals = data?.totals;
  const totalsByCurrency = data?.totals_by_currency ?? [];

  // KPI cards for the selected currency only (switch between CDF/USD)
  const selectedCurrencyTotals = totalsByCurrency.find((tc) => tc.currency === kpiCurrency);
  const kpis = selectedCurrencyTotals
    ? [
        { label: `Volume collecté (${kpiCurrency})`, value: `${fmt(selectedCurrencyTotals.volume_collected)} ${kpiCurrency}`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: `Marge UniPay (${kpiCurrency})`, value: `${fmt(selectedCurrencyTotals.net_margin)} ${kpiCurrency}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: `Coût Avada (${kpiCurrency})`, value: `${fmt(selectedCurrencyTotals.avada_cost)} ${kpiCurrency}`, icon: Building2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: `Transactions (${kpiCurrency})`, value: fmt(selectedCurrencyTotals.transaction_count), icon: ArrowDownToLine, color: 'text-green-deep-dark', bg: 'bg-green-deep/10' },
      ]
    : totals ? [
        { label: 'Volume collecté', value: `${fmt(totals.volume_collected)} CDF`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Marge UniPay', value: `${fmt(totals.net_margin)} CDF`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Coût Avada', value: `${fmt(totals.avada_cost)} CDF`, icon: Building2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Transactions', value: fmt(totals.transaction_count), icon: ArrowDownToLine, color: 'text-green-deep-dark', bg: 'bg-green-deep/10' },
      ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-text-primary">Revenus Marchands</h1>
          <p className="text-sm text-gray-500 dark:text-text-secondary mt-1">
            Répartition des revenus par marchand — marge UniPay (2%), coût Avada (3%), fees client (5%)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-text-primary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={() => void handleExport()}
            disabled={exporting || !data}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            <ArrowDownToLine size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-3">
        {(['today', '7d', '30d', '90d', 'custom'] as PeriodPreset[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              period === p
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 dark:text-text-primary hover:bg-gray-100 dark:hover:bg-navy-panel',
            )}
          >
            {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : p === '90d' ? '90 jours' : 'Personnalisé'}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary"
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary"
            />
          </div>
        )}
        {/* Sort selector */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">Trier par:</span>
          {(['margin', 'volume', 'tx_count'] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                sortBy === s
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-text-primary'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-panel',
              )}
            >
              {s === 'margin' ? 'Marge' : s === 'volume' ? 'Volume' : 'Nb tx'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Currency switch for KPI cards */}
      {totalsByCurrency.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">KPI par devise :</span>
          {totalsByCurrency.map((tc) => (
            <button
              key={tc.currency}
              onClick={() => setKpiCurrency(tc.currency)}
              className={clsx(
                'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                kpiCurrency === tc.currency
                  ? tc.currency === 'CDF'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-panel',
              )}
            >
              {tc.currency}
            </button>
          ))}
        </div>
      )}

      {/* KPI cards */}
      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-gray-100 dark:bg-navy-panel animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="p-5 rounded-2xl bg-white dark:bg-navy-panel border border-gray-100 dark:border-text-secondary/15">
              <div className={clsx('inline-flex p-2 rounded-lg mb-3', kpi.bg)}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-text-primary">{kpi.value}</p>
              <p className="text-xs text-gray-500 dark:text-text-secondary mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Daily evolution chart */}
      {dailyData && dailyData.daily.length > 0 && (
        <DailyEvolutionChart
          daily={dailyData.daily}
          period={period}
        />
      )}

      {/* Merchant table */}
      {data && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-text-secondary/15 bg-white dark:bg-navy-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-text-secondary/15 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-semibold">Marchand</th>
                <th className="px-4 py-3 font-semibold">Devise</th>
                <th className="px-4 py-3 font-semibold text-right">Nb tx</th>
                <th className="px-4 py-3 font-semibold text-right">Volume collecté</th>
                <th className="px-4 py-3 font-semibold text-right">Fees client (5%)</th>
                <th className="px-4 py-3 font-semibold text-right">Coût Avada (3%)</th>
                <th className="px-4 py-3 font-semibold text-right">Marge UniPay (2%)</th>
                <th className="px-4 py-3 font-semibold text-right">Dû au marchand</th>
              </tr>
            </thead>
            <tbody>
              {data.merchants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Aucune transaction sur cette période.
                  </td>
                </tr>
              ) : (
                data.merchants.flatMap((m) => {
                  // If by_currency exists, show one row per currency; otherwise single row
                  const rows = m.by_currency?.length > 0
                    ? m.by_currency
                    : [{ currency: 'CDF', transaction_count: m.transaction_count, volume_collected: m.volume_collected, client_fees: m.client_fees, avada_cost: m.avada_cost, net_margin: m.net_margin, net_amount_owed: m.net_amount_owed }];

                  return rows.map((c, idx) => (
                    <tr key={`${m.merchant_id}-${c.currency}`} className="border-b border-gray-50 dark:border-text-secondary/15/50 hover:bg-gray-50 dark:hover:bg-navy-panel/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-text-primary">
                        {idx === 0 ? m.name : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
                          c.currency === 'CDF'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : c.currency === 'USD'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                        )}>
                          {c.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-text-primary">{fmt(c.transaction_count)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-text-primary">{fmt(c.volume_collected)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-text-primary">{fmt(c.client_fees)}</td>
                      <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{fmt(c.avada_cost)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{fmt(c.net_margin)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-text-primary">{fmt(c.net_amount_owed)}</td>
                    </tr>
                  ));
                })
              )}
            </tbody>
            {data.merchants.length > 0 && totalsByCurrency.length > 0 && (
              <tfoot>
                {totalsByCurrency.map((tc) => (
                  <tr key={tc.currency} className="border-t-2 border-gray-200 dark:border-text-secondary/20 font-semibold">
                    <td className="px-4 py-3 text-gray-900 dark:text-text-primary">Total {tc.currency}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
                        tc.currency === 'CDF'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : tc.currency === 'USD'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                      )}>
                        {tc.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-text-primary">{fmt(tc.transaction_count)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-text-primary">{fmt(tc.volume_collected)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-text-primary">{fmt(tc.client_fees)}</td>
                    <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{fmt(tc.avada_cost)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{fmt(tc.net_margin)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-text-primary">{fmt(tc.net_amount_owed)}</td>
                  </tr>
                ))}
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
