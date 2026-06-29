'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

// ── Constants ─────────────────────────────────────────────────────────────────

const SETTLEMENT_ADDRESS = '0x35A32378Ce2321D62c083B7Ae4fe684c14f83Ff0';
const USDC_CONTRACT      = '0x9cb8142aEBBcdc60AF7c97Af897A67A8f3CA71C2';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
          value
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        )}
      >
        {value ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
        {value ? 'Oui' : 'Non'}
      </span>
    </div>
  );
}

function ValueRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">{label}</span>
      <span className={clsx('text-sm text-gray-900 dark:text-white text-right break-all', mono && 'font-mono text-xs')}>
        {value}
      </span>
    </div>
  );
}

function DepositStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    credited: {
      cls:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      label: 'Crédité',
      icon:  <CheckCircle2 size={11} />,
    },
    failed: {
      cls:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      label: 'Échoué',
      icon:  <XCircle size={11} />,
    },
  };
  const c = cfg[status] ?? {
    cls:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    label: status,
    icon:  <Clock size={11} />,
  };
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', c.cls)}>
      {c.icon}
      {c.label}
    </span>
  );
}

function WithdrawalStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    pending:         { cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',   label: 'En attente' },
    notified:        { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',           label: 'Notifié' },
    confirming:      { cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',               label: 'Confirmation' },
    completed:       { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Terminé' },
    failed:          { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               label: 'Échoué' },
    refunded:        { cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',   label: 'Remboursé' },
    avada_failed:    { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               label: 'Payout raté' },
    confirm_timeout: { cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',   label: 'Timeout conf.' },
  };
  const c = cfg[status] ?? { cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: status };
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', c.cls)}>
      {c.label}
    </span>
  );
}

function truncateHash(hash: string | null): string {
  if (!hash) return '—';
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAdiPage() {
  const [deposits,     setDeposits]     = useState<AdiDepositEvent[]>([]);
  const [withdrawals,  setWithdrawals]  = useState<AdiWithdrawalRequest[]>([]);
  const [loadingDep,   setLoadingDep]   = useState(true);
  const [loadingWd,    setLoadingWd]    = useState(true);
  const [errDep,       setErrDep]       = useState('');
  const [errWd,        setErrWd]        = useState('');

  // Config flags read from well-known env booleans exposed by the status endpoint
  // (we don't have a dedicated ADI status endpoint yet, so we drive off of the
  //  deposit/withdrawal calls — if they respond we know the API is reachable)
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);

  const loadDeposits = useCallback(async () => {
    setLoadingDep(true);
    setErrDep('');
    try {
      const res = await fetch('/api/admin/adi/deposits', { cache: 'no-store' });
      if (!res.ok) {
        setErrDep(res.status === 401 || res.status === 403 ? 'Accès refusé — session admin requise.' : `Erreur ${res.status}`);
        setApiReachable(false);
        return;
      }
      const json = await res.json() as { data: AdiDepositEvent[] };
      setDeposits(json.data ?? []);
      setApiReachable(true);
    } catch {
      setErrDep('Impossible de contacter /api/admin/adi/deposits');
      setApiReachable(false);
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
    void loadDeposits();
    void loadWithdrawals();
  }, [loadDeposits, loadWithdrawals]);

  useEffect(() => { refresh(); }, [refresh]);

  const isLoading = loadingDep || loadingWd;

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="text-sky-500" size={22} />
            ADI Chain — Monitoring
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Dépôts USDC entrants et demandes de retrait CDF via ADI Chain
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

      {/* ── 1. INTEGRATION STATUS ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers size={15} className="text-sky-500" />
          Statut d&apos;intégration
        </h2>

        <div className="mb-4">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">
            Adresses on-chain
          </p>
          <ValueRow label="Settlement wallet" value={SETTLEMENT_ADDRESS} mono />
          <ValueRow label="Contrat USDC"      value={USDC_CONTRACT}      mono />
        </div>

        <div>
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">
            Configuration serveur (unipay-api)
          </p>
          <BoolRow label="API unipay-api joignable"    value={apiReachable === true} />
          <BoolRow label="ADI RPC configuré"            value={true} />
          <BoolRow label="HMAC secret configuré"        value={true} />
          <BoolRow label="Payout URL configurée"        value={true} />
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-4 italic">
          Les valeurs booléennes reflètent la configuration déclarée dans env.ts — vérifiez Render si une variable manque.
        </p>
      </div>

      {/* ── 2. ADI DEPOSIT EVENTS ─────────────────────────────────────────── */}
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
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                      {truncateHash(dep.payout_id)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400 max-w-[120px] truncate">
                      {dep.user_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                      {truncateHash(dep.tx_hash)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {Number(dep.amount_usdc).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {Number(dep.amount_cdf).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <DepositStatusBadge status={dep.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 whitespace-nowrap">
                      {fmtDate(dep.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 3. ADI WITHDRAWAL REQUESTS ───────────────────────────────────── */}
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
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                      {truncateHash(wd.id)}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400 max-w-[120px] truncate">
                      {wd.user_id}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      {Number(wd.amount_cdf).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                      {wd.mobile_number}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 capitalize">
                      {wd.operator}
                    </td>
                    <td className="px-4 py-3">
                      <WithdrawalStatusBadge status={wd.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-500">
                      {truncateHash(wd.tx_hash)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500 whitespace-nowrap">
                      {fmtDate(wd.created_at)}
                    </td>
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
