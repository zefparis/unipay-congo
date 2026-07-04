'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft, User, Wallet, ShieldCheck, ShieldX,
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Loader2,
  CheckCircle2, XCircle, AlertCircle, Plus, Minus,
} from 'lucide-react';
import { getUserDetail, blockUser, unblockUser, adjustBalance, approveUserKyc, type WalletUser, type WalletTransaction, type LedgerEntry } from '@/lib/admin-api';
import clsx from 'clsx';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n));
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={clsx(
      'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm',
      type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300'
        : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300',
    )}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  );
}

export default function WalletUserDetailPage() {
  const { id } = useParams() as { id: string };

  const [user, setUser] = useState<WalletUser | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [approvingKyc, setApprovingKyc] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUserDetail(id);
      setUser(res.user);
      setTransactions(res.transactions);
      setLedger(res.ledger);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const handleAdjust = async () => {
    const amount = parseFloat(adjustAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      showToast('Montant invalide (non nul)', 'error');
      return;
    }
    if (!adjustReason.trim()) {
      showToast('Motif requis', 'error');
      return;
    }
    setAdjusting(true);
    try {
      const res = await adjustBalance(id, amount, adjustReason);
      setUser((prev) => prev ? { ...prev, balance_cdf: res.new_balance_cdf } : prev);
      setAdjustAmount('');
      setAdjustReason('');
      showToast(`Solde ajusté → ${fmt(res.new_balance_cdf)} CDF`, 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const handleBlock = async () => {
    if (!user) return;
    setBlocking(true);
    try {
      if (user.is_active) {
        await blockUser(id);
        setUser((u) => u ? { ...u, is_active: false } : u);
        showToast('Utilisateur bloqué', 'success');
      } else {
        await unblockUser(id);
        setUser((u) => u ? { ...u, is_active: true } : u);
        showToast('Utilisateur débloqué', 'success');
      }
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setBlocking(false);
    }
  };

  const handleApproveKyc = async () => {
    if (!user) return;
    setApprovingKyc(true);
    try {
      console.log('[wallet-user] approve kyc click', { id, user });
      const res = await approveUserKyc(id);
      console.log('[wallet-user] approve kyc response', res);
      setUser(res.user);
      showToast('KYC wallet validé', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setApprovingKyc(false);
    }
  };

  const dirIcon = (dir: string) => {
    if (dir === 'collect') return <ArrowDownLeft size={13} className="text-green-500" />;
    if (dir === 'payout') return <ArrowUpRight size={13} className="text-orange-500" />;
    return <ArrowLeftRight size={13} className="text-purple-500" />;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-signal" />
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto mt-12 text-center">
      <p className="text-red-500 mb-4">{error}</p>
      <Link href="/dashboard/admin/wallet-users" className="text-sm text-signal-dark hover:underline">← Retour à la liste</Link>
    </div>
  );

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Back */}
      <Link href="/dashboard/admin/wallet-users" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-signal transition-colors">
        <ArrowLeft size={15} /> Retour à la liste
      </Link>

      {/* User info card */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-signal/10 flex items-center justify-center">
              <User size={22} className="text-signal" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                {user.full_name ?? <span className="text-gray-400 font-normal">Nom inconnu</span>}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{user.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.kyc_level < 1 && (
              <button
                onClick={handleApproveKyc}
                disabled={approvingKyc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
              >
                {approvingKyc ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                Valider KYC
              </button>
            )}
            {user.is_active ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 size={13} /> Actif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                <XCircle size={13} /> Bloqué
              </span>
            )}
            <button
              onClick={handleBlock}
              disabled={blocking}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50',
                user.is_active
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/30'
                  : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
              )}
            >
              {blocking ? <Loader2 size={13} className="animate-spin" /> : user.is_active ? <ShieldX size={13} /> : <ShieldCheck size={13} />}
              {user.is_active ? 'Bloquer' : 'Débloquer'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Solde</p>
            <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">{fmt(user.balance_cdf)} CDF</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">KYC</p>
            <p className="font-semibold text-gray-900 dark:text-white">Niveau {user.kyc_level}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Inscription</p>
            <p className="text-gray-700 dark:text-gray-300">{fmtDate(user.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">KYC soumis</p>
            <p className="text-gray-700 dark:text-gray-300">{fmtDate(user.kyc_submitted_at ?? null)}</p>
          </div>
        </div>
      </div>

      {/* Balance adjustment */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-signal" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Ajustement de solde</h2>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Montant CDF
            </label>
            <div className="relative">
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="ex : +5000 ou -1000"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal transition-colors"
              />
            </div>
          </div>
          <div className="flex-[2] min-w-48">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Motif</label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Motif de l'ajustement…"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-signal/40 focus:border-signal transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setAdjustAmount((prev) => prev.startsWith('-') ? prev.slice(1) : (prev ? `+${prev}` : '')); }}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-emerald-600 hover:border-emerald-400 transition-colors"
              title="Crédit"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => { setAdjustAmount((prev) => { const n = prev.replace(/^[+-]/, ''); return n ? `-${n}` : ''; }); }}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-400 transition-colors"
              title="Débit"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={handleAdjust}
              disabled={adjusting || !adjustAmount || !adjustReason}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-signal hover:bg-signal/85 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
            >
              {adjusting ? <Loader2 size={14} className="animate-spin" /> : null}
              Appliquer
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">Saisissez un montant positif pour créditer, négatif pour débiter.</p>
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">20 dernières transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune transaction.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Date', 'Type', 'Opérateur', 'Montant', 'Frais', 'Net', 'Statut'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{fmtDate(tx.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1">{dirIcon(tx.direction)} {tx.direction}</span>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-gray-700 dark:text-gray-300">{tx.operator}</td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-white">{fmt(tx.amount)}</td>
                    <td className="px-4 py-2.5 text-gray-500">{fmt(tx.fee)}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{fmt(tx.net_amount)}</td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_STYLES[tx.status] ?? STATUS_STYLES.cancelled)}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ledger */}
      {ledger.length > 0 && (
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Derniers ajustements admin</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Date', 'Direction', 'Montant', 'Motif'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {ledger.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDate(l.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('text-xs font-semibold', l.direction === 'credit' ? 'text-emerald-600' : 'text-red-500')}>
                        {l.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-white">{fmt(l.amount)}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{l.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
