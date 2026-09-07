'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Headset, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

type ConvStatus = 'open' | 'escalated' | 'resolved';

interface AdminConversation {
  id: string;
  status: ConvStatus;
  created_at: string;
  updated_at: string;
  type: 'merchant' | 'wallet';
  owner_name: string;
  owner_email: string | null;
  owner_phone: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUS_STYLES: Record<ConvStatus, string> = {
  open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  escalated: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS: Record<ConvStatus, string> = {
  open: 'Ouverte',
  escalated: 'Escaladée',
  resolved: 'Résolue',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function WalletSupportListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminConversation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [status, setStatus] = useState<ConvStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ page: '1', limit: '50', type: 'wallet' });
      if (status) qs.set('status', status);
      const res = await fetch(`/api/admin/support/conversations?${qs}`);
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setRows(data.data ?? []);
      setPagination(data.pagination ?? { page: 1, limit: 50, total: 0, pages: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-heading font-bold text-gray-900 dark:text-white">
            <Headset className="text-signal" size={22} />
            Support Wallet
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Conversations support des utilisateurs wallet (chat bot + escalades).
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as ConvStatus | ''); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-signal/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">Tous les statuts</option>
          <option value="open">Ouvertes</option>
          <option value="escalated">Escaladées</option>
          <option value="resolved">Résolues</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-signal" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-600">
            Aucune conversation wallet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Utilisateur', 'Téléphone', 'Statut', 'Dernière MAJ', ''].map((col) => (
                    <th key={col} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/dashboard/admin/wallet-support/${row.id}`)}
                    className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.owner_name}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{row.owner_phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_STYLES[row.status])}>
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">{fmtDate(row.updated_at)}</td>
                    <td className="px-4 py-3 text-gray-400">→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{pagination.total} conversations — page {pagination.page}/{pagination.pages}</span>
        </div>
      )}
    </div>
  );
}
