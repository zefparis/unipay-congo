'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Users, Search, ChevronLeft, ChevronRight, Eye,
  ShieldCheck, ShieldOff, Loader2, RefreshCw, CheckCircle2, XCircle,
} from 'lucide-react';
import { getUsers, type WalletUser, type Pagination } from '@/lib/admin-api';
import clsx from 'clsx';

function KycBadge({ level }: { level: number }) {
  const cfg: Record<number, { label: string; cls: string }> = {
    0: { label: 'Non vérifié', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    1: { label: 'KYC 1', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    2: { label: 'KYC 2', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    3: { label: 'KYC 3', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  };
  const c = cfg[level] ?? cfg[0];
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', c.cls)}>
      {c.label}
    </span>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function WalletUsersPage() {
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterKyc, setFilterKyc] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number | boolean> = { page, limit: 20 };
      if (search) params.phone = search;
      if (filterKyc !== '') params.kyc_level = Number(filterKyc);
      if (filterActive !== '') params.is_active = filterActive === 'true';
      const res = await getUsers(params);
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterKyc, filterActive]);

  useEffect(() => { void load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="text-[#1D9E75]" size={22} />
          Wallet Users
        </h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche par téléphone…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75] transition-colors"
          />
        </div>
        <select
          value={filterKyc}
          onChange={(e) => { setFilterKyc(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
        >
          <option value="">Tous KYC</option>
          <option value="0">Non vérifié</option>
          <option value="1">KYC 1</option>
          <option value="2">KYC 2</option>
          <option value="3">KYC 3</option>
        </select>
        <select
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
        >
          <option value="">Tous statuts</option>
          <option value="true">Actif</option>
          <option value="false">Bloqué</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a65] text-white text-sm font-semibold transition-all"
        >
          Filtrer
        </button>
      </form>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#1D9E75]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-600">Aucun utilisateur trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Téléphone', 'Nom complet', 'Solde (CDF)', 'KYC', 'Statut', 'Inscription', 'Actions'].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">{u.phone}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{u.full_name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmt(u.balance_cdf)}</td>
                    <td className="px-4 py-3"><KycBadge level={u.kyc_level} /></td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 size={13} /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-semibold">
                          <XCircle size={13} /> Bloqué
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/wallet-users/${u.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Eye size={12} /> Voir
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{pagination.total} utilisateurs — page {pagination.page}/{pagination.pages}</span>
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

      {/* Stat line */}
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600">
        <ShieldCheck size={13} /> Données en temps réel — actualisez pour voir les dernières modifications.
        <ShieldOff size={13} className="ml-2" /> Les utilisateurs bloqués ne peuvent pas effectuer de transactions.
      </div>
    </div>
  );
}
