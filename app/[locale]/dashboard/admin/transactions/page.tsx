'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight, Download, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react';
import { getTransactions, type WalletTransaction, type Pagination } from '@/lib/admin-api';
import clsx from 'clsx';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const DIR_ICON: Record<string, React.ReactNode> = {
  collect: <ArrowDownLeft size={13} className="text-green-500" />,
  payout:  <ArrowUpRight size={13} className="text-orange-500" />,
  p2p:     <ArrowLeftRight size={13} className="text-purple-500" />,
};

export default function AdminTransactionsPage() {
  const [rows, setRows] = useState<WalletTransaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [filterDir, setFilterDir] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOp, setFilterOp] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const buildParams = useCallback(() => {
    const p: Record<string, string | number> = { page, limit: 20 };
    if (filterDir) p.direction = filterDir;
    if (filterStatus) p.status = filterStatus;
    if (filterOp) p.operator = filterOp;
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  }, [page, filterDir, filterStatus, filterOp, dateFrom, dateTo]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getTransactions(buildParams());
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
      const res = await fetch(`/api/admin/wallet/transactions/export?${qs}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ArrowLeftRight className="text-[#1D9E75]" size={22} />
          Transactions Wallet
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Exporter CSV
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3">
        <select
          value={filterDir}
          onChange={(e) => { setFilterDir(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
        >
          <option value="">Tous types</option>
          <option value="collect">Collect</option>
          <option value="payout">Payout</option>
          <option value="p2p">P2P</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
        >
          <option value="">Tous statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="success">Succès</option>
          <option value="failed">Échoué</option>
          <option value="cancelled">Annulé</option>
        </select>
        <select
          value={filterOp}
          onChange={(e) => { setFilterOp(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
        >
          <option value="">Tous opérateurs</option>
          <option value="vodacash">Vodacash</option>
          <option value="orange">Orange</option>
          <option value="airtel">Airtel</option>
          <option value="afrimoney">Afrimoney</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
        />
      </form>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#1D9E75]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">Aucune transaction.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Date', 'User', 'Type', 'Opérateur', 'Montant', 'Frais', 'Net', 'Statut'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {rows.map((tx) => {
                  const wu = tx.wallet_users;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-mono text-gray-700 dark:text-gray-300">{wu?.phone ?? tx.phone}</div>
                        {wu?.full_name && <div className="text-xs text-gray-400">{wu.full_name}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {DIR_ICON[tx.direction]} {tx.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize text-gray-700 dark:text-gray-300">{tx.operator}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{fmt(tx.amount)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmt(tx.fee)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{fmt(tx.net_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_STYLES[tx.status] ?? STATUS_STYLES.cancelled)}>
                          {tx.status}
                        </span>
                      </td>
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
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{pagination.total} transactions — page {pagination.page}/{pagination.pages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages || loading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
