'use client';

import { useState, useEffect, useCallback } from 'react';
import CryptoReceiptsSection from './CryptoReceiptsSection';
import CryptoAssetsSection    from './CryptoAssetsSection';
import {
  RefreshCw, Landmark, ArrowUpRight, CheckCircle2, XCircle,
  Clock, AlertCircle, Loader2, ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';

/* ── Types ───────────────────────────────────────────────────────────── */

interface AssetBalance {
  asset: string;
  free: string;
  locked: string;
}

interface BalancesResponse {
  main: AssetBalance[];
  subaccount: AssetBalance[];
  main_error?: string;
  subaccount_error?: string;
}

interface WithdrawRecord {
  id: string;
  amount: string;
  coin: string;
  network: string;
  address: string;
  txId: string | null;
  status: number;
  applyTime: string;
}

const WITHDRAW_STATUS: Record<number, { label: string; color: string; icon: React.ElementType }> = {
  0: { label: 'Email envoyé',       color: 'text-blue-400',   icon: Clock },
  1: { label: 'Annulé',             color: 'text-gray-400',   icon: XCircle },
  2: { label: 'En attente appro.',  color: 'text-yellow-400', icon: Clock },
  3: { label: 'Rejeté',             color: 'text-red-400',    icon: XCircle },
  4: { label: 'En cours',           color: 'text-blue-400',   icon: Loader2 },
  5: { label: 'Échec',              color: 'text-red-400',    icon: XCircle },
  6: { label: 'Complété',           color: 'text-green-400',  icon: CheckCircle2 },
};

const NETWORK_FEES: Record<string, number> = { BSC: 0.5, TRC20: 1, ERC20: 5 };

/* ── Helpers ─────────────────────────────────────────────────────────── */

function truncateAddr(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

/* ── Balance card ────────────────────────────────────────────────────── */

function BalanceCard({
  title,
  balances,
  error,
  loading,
}: {
  title: string;
  balances: AssetBalance[];
  error?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#0e1428] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        <Landmark size={15} className="text-purple-400" />
        {title}
      </h3>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 size={14} className="animate-spin" /> Chargement…
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-red-400 text-sm">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : balances.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun actif disponible</p>
      ) : (
        <div className="space-y-2">
          {balances.map((b) => (
            <div
              key={b.asset}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{b.asset}</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {parseFloat(b.free).toFixed(6)}{' '}
                  <span className="text-xs text-gray-400">libre</span>
                </p>
                {parseFloat(b.locked) > 0 && (
                  <p className="text-xs text-yellow-400">
                    {parseFloat(b.locked).toFixed(6)} bloqué
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */

export default function TreasuryPage() {
  /* balances */
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [balLoading, setBalLoading] = useState(true);

  /* withdrawals history */
  const [history, setHistory] = useState<WithdrawRecord[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState('');

  /* withdraw form */
  const [amount, setAmount]   = useState('');
  const [network, setNetwork] = useState<'BSC' | 'TRC20' | 'ERC20'>('BSC');
  const [address, setAddress] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const fee = NETWORK_FEES[network] ?? 0;
  const net = parseFloat(amount || '0') - fee;

  /* ── Fetchers ────────────────────────────────────────────────────── */

  const loadBalances = useCallback(async () => {
    setBalLoading(true);
    try {
      const res = await fetch('/api/admin/binance/balances', { cache: 'no-store' });
      const data = await res.json() as BalancesResponse;
      setBalances(data);
    } catch {
      setBalances({ main: [], subaccount: [], main_error: 'Erreur réseau', subaccount_error: 'Erreur réseau' });
    } finally {
      setBalLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    setHistError('');
    try {
      const res = await fetch('/api/admin/binance/withdrawals', { cache: 'no-store' });
      const data = await res.json() as { data?: WithdrawRecord[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setHistory(data.data ?? []);
    } catch (e) {
      setHistError((e as Error).message);
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBalances();
    void loadHistory();
  }, [loadBalances, loadHistory]);

  /* ── Submit withdrawal ──────────────────────────────────────────── */

  const handleWithdraw = async () => {
    if (!confirm) { setConfirm(true); return; }
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/admin/binance/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), network, address }),
      });
      const data = await res.json() as { withdraw_id?: string; error?: string; detail?: string };
      if (!res.ok) {
        setSendResult({ ok: false, msg: data.detail ?? data.error ?? `Erreur ${res.status}` });
      } else {
        setSendResult({ ok: true, msg: `Retrait soumis — ID : ${data.withdraw_id}` });
        setAmount(''); setAddress(''); setConfirm(false);
        void loadHistory();
      }
    } catch (e) {
      setSendResult({ ok: false, msg: (e as Error).message });
    } finally {
      setSending(false);
    }
  };

  const refresh = () => { void loadBalances(); void loadHistory(); };

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Landmark size={22} className="text-purple-400" />
            Trésorerie Binance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestion des soldes et retraits USDT
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <RefreshCw size={14} className={clsx(balLoading && 'animate-spin')} />
          Actualiser
        </button>
      </div>

      {/* ── 1. Soldes ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
          Soldes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BalanceCard
            title="Compte Principal"
            balances={balances?.main ?? []}
            error={balances?.main_error}
            loading={balLoading}
          />
          <BalanceCard
            title="Sous-compte CGL (b.barrere@congogaming.com)"
            balances={balances?.subaccount ?? []}
            error={balances?.subaccount_error}
            loading={balLoading}
          />
        </div>
      </section>

      {/* ── 2. Formulaire retrait ───────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
          Retrait USDT
        </h2>
        <div className="bg-white dark:bg-[#0e1428] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-lg space-y-4">

          {/* Montant */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Montant (USDT)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setConfirm(false); setSendResult(null); }}
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Réseau */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Réseau
            </label>
            <div className="relative">
              <select
                value={network}
                onChange={(e) => { setNetwork(e.target.value as 'BSC' | 'TRC20' | 'ERC20'); setConfirm(false); setSendResult(null); }}
                className="w-full appearance-none px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="BSC">BSC — Fee : 0.5 USDT</option>
                <option value="TRC20">TRC20 — Fee : 1 USDT</option>
                <option value="ERC20">ERC20 — Fee : 5 USDT</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Adresse destination
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setConfirm(false); setSendResult(null); }}
              placeholder={network === 'TRC20' ? 'Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' : '0x...'}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Montant net */}
          {parseFloat(amount) > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-xs text-purple-400">Montant net reçu</span>
              <span className={clsx('text-sm font-semibold', net > 0 ? 'text-purple-300' : 'text-red-400')}>
                {net > 0 ? net.toFixed(6) : '—'} USDT
              </span>
            </div>
          )}

          {/* Confirmation dialog */}
          {confirm && !sending && (
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-300 space-y-1">
              <p className="font-semibold">Confirmer le retrait ?</p>
              <p>Montant : <span className="font-mono">{amount} USDT</span></p>
              <p>Réseau : <span className="font-mono">{network}</span></p>
              <p>Adresse : <span className="font-mono text-xs break-all">{address}</span></p>
              <p>Net : <span className="font-mono">{net.toFixed(6)} USDT</span></p>
            </div>
          )}

          {/* Result */}
          {sendResult && (
            <div className={clsx(
              'flex items-start gap-2 p-3 rounded-xl text-sm',
              sendResult.ok
                ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300',
            )}>
              {sendResult.ok
                ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                : <XCircle size={15} className="mt-0.5 shrink-0" />}
              <span>{sendResult.msg}</span>
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={handleWithdraw}
            disabled={!amount || !address || parseFloat(amount) <= fee || sending}
            className={clsx(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition',
              confirm
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                : 'bg-purple-600 hover:bg-purple-500 text-white',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {sending
              ? <><Loader2 size={14} className="animate-spin" /> Envoi…</>
              : confirm
                ? <><ArrowUpRight size={14} /> Confirmer l&apos;envoi</>
                : <><ArrowUpRight size={14} /> Envoyer</>}
          </button>
          {confirm && !sending && (
            <button
              onClick={() => setConfirm(false)}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition"
            >
              Annuler
            </button>
          )}
        </div>
      </section>

      {/* ── 3. Historique retraits USDT ────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
          Historique des retraits
        </h2>
        <div className="bg-white dark:bg-[#0e1428] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          {histLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm p-5">
              <Loader2 size={14} className="animate-spin" /> Chargement…
            </div>
          ) : histError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm p-5">
              <AlertCircle size={14} /> {histError}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">Aucun retrait enregistré</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Date', 'Montant', 'Réseau', 'Adresse', 'Statut', 'TxHash'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const s = WITHDRAW_STATUS[row.status] ?? { label: `#${row.status}`, color: 'text-gray-400', icon: Clock };
                    const StatusIcon = s.icon;
                    return (
                      <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {fmtDate(row.applyTime)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {parseFloat(row.amount).toFixed(4)} {row.coin}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300">
                            {row.network}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {truncateAddr(row.address)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('flex items-center gap-1 text-xs font-medium', s.color)}>
                            <StatusIcon size={12} className={row.status === 4 ? 'animate-spin' : ''} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {row.txId ? (
                            <span title={row.txId}>{truncateAddr(row.txId)}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Actifs crypto treasury ─────────────────────────────── */}
      <CryptoAssetsSection />

      {/* ── 5. Paiements factures crypto ────────────────────────────── */}
      <CryptoReceiptsSection />

    </div>
  );
}
