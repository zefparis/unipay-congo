'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Copy, ExternalLink, CheckCircle2, AlertTriangle,
  AlertCircle, Loader2, Plus, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import clsx from 'clsx';

/* ── Types ───────────────────────────────────────────────────────────── */

interface CryptoAsset {
  wallet_id:                string;
  label:                    string;
  asset:                    string;
  network:                  string;
  address:                  string;
  token_contract:           string;
  onchain_balance:          number | null;
  onchain_error:            string | null;
  confirmed_receipts_total: number;
  difference:               number | null;
  status:                   'ok' | 'warning' | 'alert' | 'unknown';
  last_checked_at:          string;
  explorer_url:             string;
  notes:                    string | null;
}

interface TreasuryWallet {
  id:             string;
  label:          string;
  asset:          string;
  network:        string;
  address:        string;
  token_contract: string;
  decimals:       number;
  is_active:      boolean;
  notes:          string | null;
}

/* ── Constants ───────────────────────────────────────────────────────── */

const ASSETS   = ['USDC', 'USDT'] as const;
const NETWORKS = ['BSC', 'ERC20', 'TRC20', 'Polygon', 'Base', 'Arbitrum'] as const;

const BSC_CONTRACTS: Record<string, string> = {
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

function truncateAddr(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

function fmtBalance(n: number | null): string {
  if (n === null) return '—';
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text);
}

/* ── Status display ──────────────────────────────────────────────────── */

function StatusBadge({ status, diff }: { status: CryptoAsset['status']; diff: number | null }) {
  if (status === 'unknown') {
    return <span className="text-xs text-gray-400 flex items-center gap-1"><AlertCircle size={12} />inconnu</span>;
  }
  if (status === 'ok') {
    return <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 size={12} />équilibré</span>;
  }
  if (status === 'warning') {
    return (
      <span className="text-xs text-yellow-400 flex items-center gap-1">
        <AlertTriangle size={12} />+{fmtBalance(diff)} non comptabilisé
      </span>
    );
  }
  return (
    <span className="text-xs text-red-400 flex items-center gap-1">
      <AlertCircle size={12} />{fmtBalance(diff)} incohérence
    </span>
  );
}

/* ── Asset / Network badges ──────────────────────────────────────────── */

function AssetBadge({ asset }: { asset: string }) {
  return (
    <span className={clsx('px-2 py-0.5 rounded-md text-xs font-bold',
      asset === 'USDC'
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    )}>
      {asset}
    </span>
  );
}

function NetworkBadge({ network }: { network: string }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">
      {network}
    </span>
  );
}

/* ── Add wallet form ─────────────────────────────────────────────────── */

const EMPTY_FORM = { label: '', asset: 'USDC' as string, network: 'BSC' as string, address: '', notes: '' };

function autoContract(asset: string, network: string): string {
  if (network === 'BSC') return BSC_CONTRACTS[asset] ?? '';
  return '';
}

/* ═══════════════════════════════════════════════════════════════════════
 * Main component
 * ═══════════════════════════════════════════════════════════════════════ */

export default function CryptoAssetsSection() {
  /* ── Assets state ────────────────────────────────────────────────── */
  const [assets,    setAssets]    = useState<CryptoAsset[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [lastCheck, setLastCheck] = useState('');

  /* ── Wallet management state ─────────────────────────────────────── */
  const [wallets,      setWallets]      = useState<TreasuryWallet[]>([]);
  const [showManage,   setShowManage]   = useState(false);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [wForm,        setWForm]        = useState({ ...EMPTY_FORM });
  const [adding,       setAdding]       = useState(false);
  const [addRes,       setAddRes]       = useState<{ ok: boolean; msg: string } | null>(null);
  const [togglingId,   setTogglingId]   = useState<string | null>(null);

  /* ── Load assets (with balances) ─────────────────────────────────── */
  const loadAssets = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/admin/treasury/crypto-assets', { cache: 'no-store' });
      const json = await res.json() as { data?: CryptoAsset[]; error?: string };
      if (!res.ok) { setError(json.error ?? 'Erreur serveur'); return; }
      setAssets(json.data ?? []);
      if (json.data?.[0]?.last_checked_at) setLastCheck(json.data[0].last_checked_at);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Load wallet list ────────────────────────────────────────────── */
  const loadWallets = useCallback(async () => {
    const res  = await fetch('/api/admin/treasury/crypto-wallets', { cache: 'no-store' });
    const json = await res.json() as { data?: TreasuryWallet[] };
    setWallets(json.data ?? []);
  }, []);

  useEffect(() => { void loadAssets(); }, [loadAssets]);
  useEffect(() => { if (showManage) void loadWallets(); }, [showManage, loadWallets]);

  /* ── Add wallet ──────────────────────────────────────────────────── */
  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true); setAddRes(null);
    try {
      const res  = await fetch('/api/admin/treasury/crypto-wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label:   wForm.label.trim(),
          asset:   wForm.asset,
          network: wForm.network,
          address: wForm.address.trim(),
          notes:   wForm.notes.trim() || undefined,
        }),
      });
      const json = await res.json() as { success?: boolean; error?: string; message?: string };
      if (!res.ok) {
        setAddRes({ ok: false, msg: json.message ?? json.error ?? 'Erreur' });
      } else {
        setAddRes({ ok: true, msg: 'Portefeuille ajouté !' });
        setWForm({ ...EMPTY_FORM });
        setShowAddForm(false);
        void loadWallets();
        void loadAssets();
      }
    } finally {
      setAdding(false);
    }
  };

  /* ── Toggle active ────────────────────────────────────────────────── */
  const toggleActive = async (wallet: TreasuryWallet) => {
    setTogglingId(wallet.id);
    try {
      await fetch(`/api/admin/treasury/crypto-wallets/${wallet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !wallet.is_active }),
      });
      void loadWallets();
      void loadAssets();
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Input styles ────────────────────────────────────────────────── */
  const inputCls = 'w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40';

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <section className="bg-white dark:bg-[#0e1428] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-800 dark:text-white">Actifs Crypto Treasury</h2>
          {lastCheck && (
            <p className="text-xs text-gray-400 mt-0.5">Vérifié à {fmtTime(lastCheck)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowManage((p) => !p); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {showManage ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Gérer les wallets
          </button>
          <button
            onClick={() => void loadAssets()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>
      )}

      {/* Loading skeleton */}
      {loading && !assets.length && (
        <div className="flex justify-center py-8">
          <Loader2 size={22} className="animate-spin text-purple-400" />
        </div>
      )}

      {/* No wallets yet */}
      {!loading && !assets.length && !error && (
        <p className="text-sm text-gray-400 text-center py-6">
          Aucun portefeuille treasury actif. Ajoutez-en un via « Gérer les wallets ».
        </p>
      )}

      {/* Asset cards */}
      {assets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {assets.map((a) => (
            <div
              key={a.wallet_id}
              className={clsx(
                'rounded-2xl border p-5 space-y-4 transition',
                a.status === 'ok'      && 'border-green-500/30  bg-green-500/5',
                a.status === 'warning' && 'border-yellow-500/30 bg-yellow-500/5',
                a.status === 'alert'   && 'border-red-500/30    bg-red-500/5',
                a.status === 'unknown' && 'border-gray-700/40   bg-gray-800/20',
              )}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{a.label}</p>
                  <div className="flex items-center gap-1.5">
                    <AssetBadge asset={a.asset} />
                    <NetworkBadge network={a.network} />
                  </div>
                </div>
                <StatusBadge status={a.status} diff={a.difference} />
              </div>

              {/* Address */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-mono">{truncateAddr(a.address)}</span>
                <button onClick={() => copyToClipboard(a.address)} title="Copier l'adresse"
                  className="text-gray-400 hover:text-white transition"><Copy size={11} /></button>
                <a href={a.explorer_url} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-yellow-400 transition" title="Voir sur BscScan">
                  <ExternalLink size={11} />
                </a>
              </div>

              {/* Balance table */}
              <div className="rounded-xl overflow-hidden border border-gray-700/30 text-xs">
                <div className="grid grid-cols-2 divide-x divide-gray-700/30">
                  <div className="p-3 space-y-0.5">
                    <p className="text-gray-400">Solde on-chain</p>
                    {a.onchain_error ? (
                      <p className="text-red-400 text-[10px]">{a.onchain_error}</p>
                    ) : (
                      <p className="text-lg font-bold text-white tabular-nums">
                        {fmtBalance(a.onchain_balance)}
                        <span className="text-xs font-normal text-gray-400 ml-1">{a.asset}</span>
                      </p>
                    )}
                  </div>
                  <div className="p-3 space-y-0.5">
                    <p className="text-gray-400">Reçus confirmés</p>
                    <p className="text-lg font-bold text-white tabular-nums">
                      {fmtBalance(a.confirmed_receipts_total)}
                      <span className="text-xs font-normal text-gray-400 ml-1">{a.asset}</span>
                    </p>
                  </div>
                </div>
                {a.difference !== null && (
                  <div className={clsx(
                    'px-3 py-2 text-xs border-t border-gray-700/30 flex justify-between',
                    a.status === 'ok'      ? 'text-green-400'  :
                    a.status === 'warning' ? 'text-yellow-400' : 'text-red-400',
                  )}>
                    <span>Différence</span>
                    <span className="font-mono font-semibold">
                      {a.difference >= 0 ? '+' : ''}{fmtBalance(a.difference)} {a.asset}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Wallet management panel ────────────────────────────────── */}
      {showManage && (
        <div className="border-t border-gray-200 dark:border-gray-700/50 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Portefeuilles treasury enregistrés
            </h3>
            <button
              onClick={() => { setShowAddForm((p) => !p); setAddRes(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              {showAddForm ? <X size={12} /> : <Plus size={12} />}
              {showAddForm ? 'Annuler' : 'Ajouter un wallet'}
            </button>
          </div>

          {/* Add wallet form */}
          {showAddForm && (
            <form onSubmit={(e) => void handleAddWallet(e)}
              className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/50 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Libellé *</label>
                  <input required value={wForm.label}
                    onChange={(e) => setWForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Ex : PredictStreet RDC Treasury"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Asset *</label>
                  <select required value={wForm.asset}
                    onChange={(e) => setWForm((p) => ({ ...p, asset: e.target.value }))}
                    className={inputCls}>
                    {ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Réseau *</label>
                  <select required value={wForm.network}
                    onChange={(e) => setWForm((p) => ({ ...p, network: e.target.value }))}
                    className={inputCls}>
                    {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Adresse *
                  </label>
                  <input required value={wForm.address}
                    onChange={(e) => setWForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="0x…"
                    className={`${inputCls} font-mono`} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                  <input value={wForm.notes}
                    onChange={(e) => setWForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Remarques internes…"
                    className={inputCls} />
                </div>
              </div>
              {autoContract(wForm.asset, wForm.network) && (
                <p className="text-xs text-gray-400">
                  Contrat auto-résolu : <span className="font-mono">{autoContract(wForm.asset, wForm.network)}</span>
                </p>
              )}
              {addRes && (
                <p className={clsx('text-xs', addRes.ok ? 'text-green-400' : 'text-red-400')}>{addRes.msg}</p>
              )}
              <button type="submit" disabled={adding}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5">
                {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Enregistrer le wallet
              </button>
            </form>
          )}

          {/* Wallet list */}
          {wallets.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 text-left">
                    <th className="px-3 py-2 font-medium">Libellé</th>
                    <th className="px-3 py-2 font-medium">Asset / Réseau</th>
                    <th className="px-3 py-2 font-medium hidden sm:table-cell">Adresse</th>
                    <th className="px-3 py-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.id} className="border-t border-gray-100 dark:border-gray-700/40">
                      <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-white">{w.label}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <AssetBadge asset={w.asset} />
                          <NetworkBadge network={w.network} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-400 hidden sm:table-cell">
                        {truncateAddr(w.address)}
                        <button onClick={() => copyToClipboard(w.address)} className="ml-1.5 text-gray-500 hover:text-white transition">
                          <Copy size={10} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => void toggleActive(w)}
                          disabled={togglingId === w.id}
                          className={clsx(
                            'px-2 py-0.5 rounded-md text-xs font-semibold transition',
                            w.is_active
                              ? 'bg-green-900/30 text-green-400 hover:bg-red-900/30 hover:text-red-400'
                              : 'bg-gray-700/30 text-gray-400 hover:bg-green-900/30 hover:text-green-400',
                          )}
                        >
                          {togglingId === w.id ? '…' : w.is_active ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
