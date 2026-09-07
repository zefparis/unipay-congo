'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Building2, Search, ChevronLeft, ChevronRight, Eye,
  Loader2, RefreshCw, FlaskConical, Globe, ShieldCheck,
  Ban, CheckCircle2, AlertCircle, KeyRound, Bell,
} from 'lucide-react';
import {
  getMerchants, setMerchantMode, suspendMerchant, reactivateMerchant,
  type Merchant, type Pagination,
} from '@/lib/admin-api';
import clsx from 'clsx';

const KYC_LABELS: Record<string, string> = {
  pending: 'Non soumis',
  submitted: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};
const KYC_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500 dark:bg-navy-panel dark:text-text-secondary',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n));
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MerchantsListPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterKyc, setFilterKyc] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (filterMode) params.mode = filterMode;
      if (filterKyc) params.kyc_status = filterKyc;
      if (filterStatus) params.status = filterStatus;
      const res = await getMerchants(params);
      setMerchants(res.data);
      setPagination(res.pagination);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterMode, filterKyc, filterStatus]);

  useEffect(() => { void load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load();
  };

  const handleToggleMode = async (m: Merchant) => {
    const newMode = m.mode === 'live' ? 'sandbox' : 'live';
    setActing(m.id + ':mode');
    try {
      const res = await setMerchantMode(m.id, newMode);
      setMerchants((prev) => prev.map((x) => x.id === m.id ? { ...x, mode: res.merchant.mode } : x));
      setToast({ msg: `${m.email} → ${newMode}`, type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally { setActing(null); }
  };

  const handleSuspend = async (m: Merchant) => {
    setActing(m.id + ':suspend');
    try {
      await suspendMerchant(m.id);
      setMerchants((prev) => prev.map((x) => x.id === m.id ? { ...x, status: 'suspended' } : x));
      setToast({ msg: `${m.email} suspendu`, type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally { setActing(null); }
  };

  const handleReactivate = async (m: Merchant) => {
    setActing(m.id + ':reactivate');
    try {
      await reactivateMerchant(m.id);
      setMerchants((prev) => prev.map((x) => x.id === m.id ? { ...x, status: 'active' } : x));
      setToast({ msg: `${m.email} réactivé`, type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally { setActing(null); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className={clsx(
          'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm',
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300',
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
          <Building2 className="text-green-deep" size={22} />
          Marchands
        </h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche nom, email, entreprise…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-deep/30"
          />
        </div>
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary">
          <option value="">Tous modes</option>
          <option value="sandbox">Sandbox</option>
          <option value="live">Live</option>
        </select>
        <select value={filterKyc} onChange={(e) => setFilterKyc(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary">
          <option value="">Tous KYC</option>
          <option value="pending">Non soumis</option>
          <option value="submitted">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="rejected">Rejeté</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary">
          <option value="">Tous statuts</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
        </select>
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
        {loading && merchants.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-green-deep" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400 dark:text-text-secondary/50">Aucun marchand trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                  {['Email', 'Entreprise', 'KYC', 'Mode', 'Statut', 'Clé API', 'Volume', 'Dernière tx', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                {merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-navy-panel/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-text-primary whitespace-nowrap">{m.email}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-text-secondary whitespace-nowrap">{m.company_name ?? m.name ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', KYC_STYLES[m.kyc_status] ?? 'bg-gray-100 text-gray-600')}>
                          {KYC_LABELS[m.kyc_status] ?? m.kyc_status}
                        </span>
                        {m.last_kyc_reminder_count != null && m.last_kyc_reminder_count > 0 && (
                          <span
                            title={`Relancé ${m.last_kyc_reminder_count} fois${m.last_kyc_reminder_at ? `, dernière le ${fmtDate(m.last_kyc_reminder_at)}` : ''}`}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 cursor-help"
                          >
                            <Bell size={10} />
                            {m.last_kyc_reminder_count}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                        m.mode === 'live' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                      )}>
                        {m.mode === 'live' ? <Globe size={10} /> : <FlaskConical size={10} />}
                        {m.mode === 'live' ? 'Live' : 'Sandbox'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
                        m.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      )}>
                        {m.status === 'active' ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx('inline-flex items-center gap-1 text-xs',
                        m.api_key_status === 'active' ? 'text-green-600 dark:text-green-400' :
                        m.api_key_status === 'inactive' ? 'text-orange-500' : 'text-gray-400',
                      )}>
                        <KeyRound size={11} />
                        {m.api_key_status === 'active' ? 'Active' : m.api_key_status === 'inactive' ? 'Inactive' : 'Aucune'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-text-primary whitespace-nowrap">
                      {m.transaction_count != null && m.transaction_count > 0 ? fmt(m.total_volume ?? 0) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-text-secondary whitespace-nowrap text-xs">{fmtDate(m.last_transaction_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/admin/merchants/${m.id}`}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm font-medium text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
                        >
                          <Eye size={12} /> Voir
                        </Link>
                        {m.kyc_status === 'approved' && (
                          <button
                            onClick={() => void handleToggleMode(m)}
                            disabled={acting === m.id + ':mode'}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm font-medium text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors disabled:opacity-50"
                          >
                            {m.mode === 'live' ? '→ Sandbox' : '→ Live'}
                          </button>
                        )}
                        {m.status === 'active' ? (
                          <button
                            onClick={() => void handleSuspend(m)}
                            disabled={acting === m.id + ':suspend'}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800/50 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          >
                            <Ban size={12} /> Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => void handleReactivate(m)}
                            disabled={acting === m.id + ':reactivate'}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800/50 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 size={12} /> Réactiver
                          </button>
                        )}
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
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-text-secondary">
          <span>{pagination.total} marchands — page {pagination.page}/{pagination.pages}</span>
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
