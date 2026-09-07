'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight, Download, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react';
import { getMerchantTransactions, type MerchantTransaction, type Pagination } from '@/lib/admin-api';
import clsx from 'clsx';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-navy-panel dark:text-text-secondary',
};

export default function MerchantTransactionsPage() {
  const [rows, setRows] = useState<MerchantTransaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [filterMerchant, setFilterMerchant] = useState('');
  const [filterDir, setFilterDir] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOp, setFilterOp] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const buildParams = useCallback(() => {
    const p: Record<string, string | number> = { page, limit: 20 };
    if (filterMerchant) p.merchant_id = filterMerchant;
    if (filterDir) p.direction = filterDir;
    if (filterStatus) p.status = filterStatus;
    if (filterOp) p.operator = filterOp;
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  }, [page, filterMerchant, filterDir, filterStatus, filterOp, dateFrom, dateTo]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMerchantTransactions(buildParams());
      setRows(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { void load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const p = buildParams();
      const qs = new URLSearchParams(Object.entries(p).map(([k, v]) => [k, String(v)]));
      const res = await fetch(`/api/admin/wallet/merchants/transactions/export?${qs}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merchant-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export échoué');
    } finally {
      setExporting(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
          <ArrowLeftRight className="text-green-deep" size={22} />
          Transactions Marchands
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Exporter CSV
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3">
        <input
          type="text"
          value={filterMerchant}
          onChange={(e) => setFilterMerchant(e.target.value)}
          placeholder="Merchant ID (UUID)"
          className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-deep/30 font-mono"
        />
        <select value={filterDir} onChange={(e) => setFilterDir(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary">
          <option value="">Tous types</option>
          <option value="collect">Collect</option>
          <option value="payout">Payout</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary">
          <option value="">Tous statuts</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={filterOp} onChange={(e) => setFilterOp(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary">
          <option value="">Tous opérateurs</option>
          <option value="orange">Orange</option>
          <option value="airtel">Airtel</option>
          <option value="afrimoney">Afrimoney</option>
          <option value="usdt">USDT</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary" />
        <button type="submit" className="px-4 py-2 rounded-lg bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-colors">
          Filtrer
        </button>
      </form>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl overflow-hidden shadow-sm">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-green-deep" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">Aucune transaction marchand.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                  {['Date', 'Marchand', 'Type', 'Opérateur', 'Téléphone', 'Montant', 'Frais', 'Net', 'Statut', 'Référence'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                {rows.map((tx) => {
                  const m = tx.merchants?.[0];
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-navy-panel/30 transition-colors">
                      <td className="px-4 py-3 text-gray-500 dark:text-text-secondary whitespace-nowrap text-xs">{fmtDate(tx.created_at)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-text-primary whitespace-nowrap">
                        {m ? (m.name ?? m.email) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          {tx.direction === 'collect' ? <ArrowDownLeft size={13} className="text-green-500" /> : <ArrowUpRight size={13} className="text-orange-500" />}
                          <span className="text-gray-700 dark:text-text-primary">{tx.direction}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-text-primary">{tx.operator}</td>
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-text-primary">{tx.phone}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-text-primary">{fmt(tx.amount)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-text-secondary">{fmt(tx.fee)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-text-primary">{fmt(tx.net_amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_STYLES[tx.status] ?? 'bg-gray-100 text-gray-600')}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-text-secondary font-mono text-xs">{tx.reference ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-text-secondary">
          <span>{pagination.total} transactions — page {pagination.page}/{pagination.pages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 hover:bg-gray-100 dark:hover:bg-navy-panel disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages || loading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 hover:bg-gray-100 dark:hover:bg-navy-panel disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
