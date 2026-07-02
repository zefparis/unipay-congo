'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Smartphone, RefreshCw, CheckCircle2, XCircle,
  Shield, Link2, Activity, TrendingUp, Zap, BarChart3,
  Clock, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

// ── Types ────────────────────────────────────────────────────────────────────

interface EndpointInfo {
  path:   string;
  status: 'ok' | 'error';
  auth:   string;
}

interface PsTransaction {
  id:         string;
  reference:  string | null;
  amount:     number;
  net_amount: number;
  currency:   string;
  status:     string;
  created_at: string;
}

interface PsStats {
  total:         number;
  success_count: number;
  total_cdf:     number;
  success_rate:  number;
}

interface TxResponse {
  transactions: PsTransaction[];
  stats:        PsStats;
  last_webhook: PsTransaction | null;
}

interface AdiDepositEvent {
  id:          string;
  payout_id:   string;
  user_id:     string;
  tx_hash:     string;
  amount_usdc: number;
  amount_cdf:  number;
  status:      string;
  created_at:  string;
}

interface AdiWithdrawalRequest {
  id:                   string;
  user_id:              string;
  amount_cdf:           number;
  fee:                  number;
  mobile_number:        string;
  operator:             string;
  status:               string;
  tx_hash:              string | null;
  avada_transaction_id: string | null;
  failure_reason:       string | null;
  reference:            string;
  created_at:           string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `il y a ${diff}s`;
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

function fmtCdf(n: number): string {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n)) + ' CDF';
}

function truncateHash(hash: string | null): string {
  if (!hash) return '—';
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        ok
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      )}
    >
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {label ?? (ok ? 'OK' : 'Erreur')}
    </span>
  );
}
function TxStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    failed:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pending:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  const label: Record<string, string> = {
    success: 'Réussi', failed: 'Échoué', cancelled: 'Annulé',
    pending: 'En attente', processing: 'En cours',
  };
  return (
    <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', map[status] ?? 'bg-gray-100 text-gray-600')}>
      {label[status] ?? status}
    </span>
  );
}


function EndpointCard({ label, ep }: { label: string; ep: EndpointInfo }) {
  return (
    <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</span>
        <StatusBadge ok={ep.status === 'ok'} label={ep.status === 'ok' ? 'Opérationnel' : 'Erreur config'} />
      </div>
      <p className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all">{ep.path}</p>
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Shield size={11} />
        <span>{ep.auth}</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={clsx('p-2 rounded-xl', color)}>
          <Icon size={16} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function DepositStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    credited: { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Crédité', icon: <CheckCircle2 size={11} /> },
    failed:   { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 label: 'Échoué',  icon: <XCircle size={11} /> },
  };
  const c = cfg[status] ?? { cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: status, icon: <Clock size={11} /> };
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', c.cls)}>
      {c.icon}{c.label}
    </span>
  );
}

function WithdrawalStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    pending:         { cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',     label: 'En attente' },
    notified:        { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',             label: 'Notifié' },
    confirming:      { cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',                 label: 'Confirmation' },
    completed:       { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Terminé' },
    failed:          { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 label: 'Échoué' },
    refunded:        { cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',     label: 'Remboursé' },
    avada_failed:    { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 label: 'Payout raté' },
    confirm_timeout: { cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',     label: 'Timeout conf.' },
  };
  const c = cfg[status] ?? { cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: status };
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', c.cls)}>
      {c.label}
    </span>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
      <AlertCircle size={16} />
      {msg}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPredictStreetPage() {
  const [txData,      setTxData]      = useState<TxResponse | null>(null);
  const [loadingPs,   setLoadingPs]   = useState(true);
  const [errPs,       setErrPs]       = useState('');

  const [deposits,    setDeposits]    = useState<AdiDepositEvent[]>([]);
  const [loadingDep,  setLoadingDep]  = useState(true);
  const [errDep,      setErrDep]      = useState('');

  const [withdrawals, setWithdrawals] = useState<AdiWithdrawalRequest[]>([]);
  const [loadingWd,   setLoadingWd]   = useState(true);
  const [errWd,       setErrWd]       = useState('');

  const loadPs = useCallback(async () => {
    setLoadingPs(true);
    setErrPs('');
    try {
      const tRes = await fetch('/api/admin/predictstreet/transactions', { cache: 'no-store' });
      if (tRes.ok) setTxData(await tRes.json() as TxResponse);
      else setErrPs(`Erreur ${tRes.status}`);
    } catch {
      setErrPs('Impossible de contacter les APIs');
    } finally {
      setLoadingPs(false);
    }
  }, []);

  const loadDeposits = useCallback(async () => {
    setLoadingDep(true);
    setErrDep('');
    try {
      const res = await fetch('/api/admin/adi/deposits', { cache: 'no-store' });
      if (!res.ok) {
        setErrDep(res.status === 401 || res.status === 403 ? 'Accès refusé — session admin requise.' : `Erreur ${res.status}`);
        return;
      }
      const json = await res.json() as { data: AdiDepositEvent[] };
      setDeposits(json.data ?? []);
    } catch {
      setErrDep('Impossible de contacter /api/admin/adi/deposits');
    } finally {
      setLoadingDep(false);
    }
  }, []);

  const loadWithdrawals = useCallback(async () => {
    setLoadingWd(true);
    setErrWd('');
    try {
      const res = await fetch('/api/admin/adi/withdrawals', { cache: 'no-store' });
      if (!res.ok) {
        setErrWd(res.status === 401 || res.status === 403 ? 'Accès refusé — session admin requise.' : `Erreur ${res.status}`);
        return;
      }
      const json = await res.json() as { data: AdiWithdrawalRequest[] };
      setWithdrawals(json.data ?? []);
    } catch {
      setErrWd('Impossible de contacter /api/admin/adi/withdrawals');
    } finally {
      setLoadingWd(false);
    }
  }, []);

  const refresh = useCallback(() => {
    void loadPs();
    void loadDeposits();
    void loadWithdrawals();
  }, [loadPs, loadDeposits, loadWithdrawals]);

  useEffect(() => { refresh(); }, [refresh]);

  const isLoading = loadingPs || loadingDep || loadingWd;

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone className="text-purple-500" size={22} />
            PredictStreet — Monitoring complet
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Rail Mobile Money · Webhooks · ADI Chain on-chain
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* PS fetch error */}
      {errPs && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <XCircle size={16} />
          {errPs}
        </div>
      )}

      {/* Skeleton */}
      {loadingPs && !txData && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {!loadingPs && (
        <>
          {/* Stats */}
          {txData && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 size={15} className="text-purple-500" />
                Statistiques
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={Activity}
                  label="Total dépôts PS"
                  value={String(txData.stats.total)}
                  color="bg-purple-500"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Dépôts réussis"
                  value={String(txData.stats.success_count)}
                  color="bg-emerald-500"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Montant collecté"
                  value={fmtCdf(txData.stats.total_cdf)}
                  sub="transactions réussies"
                  color="bg-blue-500"
                />
                <StatCard
                  icon={Zap}
                  label="Taux de succès"
                  value={`${txData.stats.success_rate}%`}
                  sub={`${txData.stats.success_count} / ${txData.stats.total}`}
                  color={txData.stats.success_rate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}
                />
              </div>
            </div>
          )}

          {/* Last webhook */}
          {txData?.last_webhook && (
            <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap size={15} className="text-purple-500" />
                Dernier webhook envoyé
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Référence</p>
                  <p className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all">{txData.last_webhook.reference}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Montant</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{fmtCdf(txData.last_webhook.net_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Statut</p>
                  <TxStatusBadge status={txData.last_webhook.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Date</p>
                  <p className="text-gray-600 dark:text-gray-400">{relativeTime(txData.last_webhook.created_at)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent deposits table */}
          {txData && (
            <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Smartphone size={15} className="text-purple-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Derniers dépôts Mobile Money
                </h2>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">10 derniers</span>
              </div>
              {txData.transactions.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  Aucun dépôt PredictStreet trouvé
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Référence</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Montant CDF</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Statut</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {txData.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                            {tx.reference ? `${tx.reference.slice(0, 20)}…` : '—'}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {fmtCdf(tx.net_amount)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <TxStatusBadge status={tx.status} />
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-gray-500 dark:text-gray-400">
                            {relativeTime(tx.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Endpoint status cards */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Link2 size={15} className="text-purple-500" />
              Endpoints
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EndpointCard label="Initiation dépôt"     ep={{ path: 'POST /v1/payment/initiate',              status: 'ok', auth: 'X-API-Key' }} />
              <EndpointCard label="Callback Avada"        ep={{ path: 'POST /v1/wallet/unipesa/callback',       status: 'ok', auth: 'Signature Avada' }} />
              <EndpointCard label="Statut transaction"    ep={{ path: 'GET /v1/payment/:id/status',             status: 'ok', auth: 'X-API-Key' }} />
              <EndpointCard label="Refund PredictStreet"  ep={{ path: 'POST /v1/adi/credit-failed-refund',      status: 'ok', auth: 'HMAC' }} />
              <EndpointCard label="Limites utilisateur"   ep={{ path: 'GET /api/predictstreet/users/:id/limits', status: 'ok', auth: 'Bearer SERVER_SECRET' }} />
            </div>
          </div>

        </>
      )}

      {/* ── ADI DEPOSIT EVENTS ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            Dépôts ADI (adi_deposit_events)
            {deposits.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                {deposits.length}
              </span>
            )}
          </h2>
        </div>

        {errDep && <div className="p-4"><ErrorBanner msg={errDep} /></div>}
        {loadingDep && !errDep && <div className="p-4"><Skeleton /></div>}

        {!loadingDep && !errDep && deposits.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-600">
            Aucun dépôt ADI enregistré.
          </div>
        )}

        {!loadingDep && !errDep && deposits.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 text-left font-semibold">Payout ID</th>
                  <th className="px-4 py-3 text-left font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Tx Hash</th>
                  <th className="px-4 py-3 text-right font-semibold">USDC</th>
                  <th className="px-4 py-3 text-right font-semibold">CDF</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {deposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{truncateHash(dep.payout_id)}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400 max-w-[120px] truncate">{dep.user_id}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{truncateHash(dep.tx_hash)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{Number(dep.amount_usdc).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{Number(dep.amount_cdf).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3"><DepositStatusBadge status={dep.status} /></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 whitespace-nowrap">{fmtDate(dep.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADI WITHDRAWAL REQUESTS ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={15} className="text-orange-500" />
            Retraits ADI (adi_withdrawal_requests)
            {withdrawals.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold">
                {withdrawals.length}
              </span>
            )}
          </h2>
        </div>

        {errWd && <div className="p-4"><ErrorBanner msg={errWd} /></div>}
        {loadingWd && !errWd && <div className="p-4"><Skeleton /></div>}

        {!loadingWd && !errWd && withdrawals.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-600">
            Aucune demande de retrait ADI enregistrée.
          </div>
        )}

        {!loadingWd && !errWd && withdrawals.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">User ID</th>
                  <th className="px-4 py-3 text-right font-semibold">Montant CDF</th>
                  <th className="px-4 py-3 text-left font-semibold">Téléphone</th>
                  <th className="px-4 py-3 text-left font-semibold">Opérateur</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold">Tx Hash</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {withdrawals.map((wd) => (
                  <tr key={wd.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{truncateHash(wd.id)}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400 max-w-[120px] truncate">{wd.user_id}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{Number(wd.amount_cdf).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{wd.mobile_number}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 capitalize">{wd.operator}</td>
                    <td className="px-4 py-3"><WithdrawalStatusBadge status={wd.status} /></td>
                    <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-500">{truncateHash(wd.tx_hash)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 whitespace-nowrap">{fmtDate(wd.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
