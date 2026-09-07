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

type PeriodPreset = '7d' | '30d' | '90d' | 'custom';
type SortBy = 'margin' | 'volume' | 'tx_count';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD', { maximumFractionDigits: 2 }).format(n);
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function MerchantRevenuePage() {
  const [data, setData] = useState<RevenueResponse | null>(null);
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
      const now = new Date();
      let from: string;
      let to: string;

      if (period === 'custom') {
        if (!customFrom || !customTo) {
          setError('Veuillez sélectionner les dates de début et de fin.');
          setLoading(false);
          return;
        }
        from = customFrom;
        to = customTo;
      } else {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        from = fmtDate(fromDate);
        to = fmtDate(now);
      }

      const qs = new URLSearchParams({ from, to, sort: sortBy });
      const res = await fetch(`/api/admin/wallet/merchants/revenue?${qs.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
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
      const now = new Date();
      let from: string;
      let to: string;

      if (period === 'custom') {
        from = customFrom;
        to = customTo;
      } else {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        from = fmtDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
        to = fmtDate(now);
      }

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
        { label: `Transactions (${kpiCurrency})`, value: fmt(selectedCurrencyTotals.transaction_count), icon: ArrowDownToLine, color: 'text-signal-dark', bg: 'bg-signal/10' },
      ]
    : totals ? [
        { label: 'Volume collecté', value: `${fmt(totals.volume_collected)} CDF`, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Marge UniPay', value: `${fmt(totals.net_margin)} CDF`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Coût Avada', value: `${fmt(totals.avada_cost)} CDF`, icon: Building2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Transactions', value: fmt(totals.transaction_count), icon: ArrowDownToLine, color: 'text-signal-dark', bg: 'bg-signal/10' },
      ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revenus Marchands</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Répartition des revenus par marchand — marge UniPay (2%), coût Avada (3%), fees client (5%)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
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
        {(['7d', '30d', '90d', 'custom'] as PeriodPreset[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              period === p
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : p === '90d' ? '90 jours' : 'Personnalisé'}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
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
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
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
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
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
            <div key={i} className="p-5 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <div className={clsx('inline-flex p-2 rounded-lg mb-3', kpi.bg)}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Merchant table */}
      {data && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs uppercase tracking-wider text-gray-400">
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
                    <tr key={`${m.merchant_id}-${c.currency}`} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
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
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{fmt(c.transaction_count)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{fmt(c.volume_collected)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{fmt(c.client_fees)}</td>
                      <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{fmt(c.avada_cost)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{fmt(c.net_margin)}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{fmt(c.net_amount_owed)}</td>
                    </tr>
                  ));
                })
              )}
            </tbody>
            {data.merchants.length > 0 && totalsByCurrency.length > 0 && (
              <tfoot>
                {totalsByCurrency.map((tc) => (
                  <tr key={tc.currency} className="border-t-2 border-gray-200 dark:border-gray-700 font-semibold">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">Total {tc.currency}</td>
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
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{fmt(tc.transaction_count)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{fmt(tc.volume_collected)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{fmt(tc.client_fees)}</td>
                    <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{fmt(tc.avada_cost)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{fmt(tc.net_margin)}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{fmt(tc.net_amount_owed)}</td>
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
