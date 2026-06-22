'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Copy, ExternalLink, RefreshCw, Loader2, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import clsx from 'clsx';

interface CdpUser {
  id: string;
  phone: string;
  created_at: string;
  cdp_wallet_address: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface StatsData {
  total_users: number;
  with_cdp: number;
  without_cdp: number;
  users: CdpUser[];
  pagination: Pagination;
}

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-1 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
      <p className={clsx('text-3xl font-bold', accent ?? 'text-gray-900 dark:text-white')}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-600">{sub}</p>}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric' });
}

function truncAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function CdpWalletsPage() {
  const [data, setData]         = useState<StatsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);

  const [backfilling, setBackfilling]   = useState(false);
  const [backfillMsg, setBackfillMsg]   = useState('');

  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/admin/wallet/cdp-wallets?page=${p}&limit=50`);
      const json = await res.json() as StatsData;
      if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(page); }, [page]);

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(addr);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  async function runBackfill() {
    setBackfilling(true);
    setBackfillMsg('');
    try {
      const res  = await fetch('/api/admin/wallet/cdp-wallets/backfill', { method: 'POST' });
      const json = await res.json() as { processed?: number; errors?: number; remaining?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setBackfillMsg(
        `✅ ${json.processed ?? 0} wallet(s) créé(s), ${json.errors ?? 0} erreur(s).` +
        (json.remaining === 'more' ? ' Des wallets restent à créer, relancez.' : ' Terminé.')
      );
      await load(1);
      setPage(1);
    } catch (e) {
      setBackfillMsg(`❌ Erreur : ${(e as Error).message}`);
    } finally {
      setBackfilling(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CDP Wallets</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Adresses de dépôt USDC/Base (Coinbase Developer Platform)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(page)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Rafraîchir
          </button>
          <button
            onClick={runBackfill}
            disabled={backfilling || loading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {backfilling ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Backfill (max 50)
          </button>
        </div>
      </div>

      {/* Backfill message */}
      {backfillMsg && (
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
          {backfillMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total utilisateurs"
          value={data?.total_users ?? '—'}
        />
        <StatCard
          label="Wallets CDP créés"
          value={data?.with_cdp ?? '—'}
          sub={data ? `${Math.round((data.with_cdp / Math.max(data.total_users, 1)) * 100)}% des utilisateurs` : undefined}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Sans wallet CDP"
          value={data?.without_cdp ?? '—'}
          sub="Éligibles au backfill"
          accent={data && data.without_cdp > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {data ? `${data.pagination.total} utilisateurs` : '…'}
          </p>
          {data && data.pagination.pages > 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                ←
              </button>
              <span>{page} / {data.pagination.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
                className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                →
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Téléphone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Inscription</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Adresse CDP</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody>
                {(data?.users ?? []).map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 dark:border-gray-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">
                      {user.phone}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      {fmtDate(user.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      {user.cdp_wallet_address ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                            {truncAddr(user.cdp_wallet_address)}
                          </span>
                          <button
                            onClick={() => copyAddress(user.cdp_wallet_address!)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                            title="Copier l'adresse"
                          >
                            {copied === user.cdp_wallet_address
                              ? <CheckCircle2 size={13} className="text-emerald-500" />
                              : <Copy size={13} />
                            }
                          </button>
                          <a
                            href={`https://basescan.org/address/${user.cdp_wallet_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-500 transition"
                            title="Voir sur BaseScan"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {user.cdp_wallet_address ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 size={11} /> Créé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                          <AlertTriangle size={11} /> Manquant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {(data?.users ?? []).length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400 dark:text-gray-600">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
