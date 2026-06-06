'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SlidersHorizontal, Search, Loader2, CheckCircle2, AlertCircle,
  ArrowDownLeft, ArrowUpRight, Plus, Minus,
} from 'lucide-react';
import { searchUserByPhone, adjustBalance, type WalletUser, type LedgerEntry } from '@/lib/admin-api';
import clsx from 'clsx';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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

export default function AdjustmentsPage() {
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUsers, setFoundUsers] = useState<WalletUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<WalletUser | null>(null);
  const [searchError, setSearchError] = useState('');

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [applying, setApplying] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [history, setHistory] = useState<(LedgerEntry & { phone?: string })[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSearch.trim()) return;
    setSearching(true);
    setSearchError('');
    setFoundUsers([]);
    setSelectedUser(null);
    try {
      const res = await searchUserByPhone(phoneSearch);
      if (res.data.length === 0) {
        setSearchError('Aucun utilisateur trouvé pour ce numéro.');
      } else {
        setFoundUsers(res.data);
        if (res.data.length === 1) setSelectedUser(res.data[0]);
      }
    } catch (e) {
      setSearchError((e as Error).message);
    } finally {
      setSearching(false);
    }
  }, [phoneSearch]);

  const handleAdjust = async () => {
    if (!selectedUser) return;
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n === 0) {
      setToast({ msg: 'Montant invalide (doit être non nul)', type: 'error' });
      return;
    }
    if (!reason.trim()) {
      setToast({ msg: 'Motif requis', type: 'error' });
      return;
    }
    setApplying(true);
    try {
      const res = await adjustBalance(selectedUser.id, n, reason);
      setSelectedUser((u) => u ? { ...u, balance_cdf: res.new_balance_cdf } : u);
      setFoundUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, balance_cdf: res.new_balance_cdf } : u));
      const entry: LedgerEntry & { phone?: string } = {
        id: Date.now().toString(),
        direction: n > 0 ? 'credit' : 'debit',
        amount: Math.abs(n),
        reason: reason,
        created_at: new Date().toISOString(),
        phone: selectedUser.phone,
      };
      setHistory((prev) => [entry, ...prev]);
      setAmount('');
      setReason('');
      setToast({ msg: `Solde ajusté → ${fmt(res.new_balance_cdf)} CDF`, type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SlidersHorizontal className="text-[#1D9E75]" size={22} />
          Ajustements manuels
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Recherchez un utilisateur wallet et ajustez son solde manuellement.</p>
      </div>

      {/* Search form */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Search size={15} className="text-[#1D9E75]" />
          Recherche par téléphone
        </h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="tel"
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            placeholder="ex : +243812345678"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75] transition-colors"
          />
          <button
            type="submit"
            disabled={searching || !phoneSearch.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a65] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Rechercher
          </button>
        </form>

        {searchError && (
          <p className="text-sm text-red-500 dark:text-red-400">{searchError}</p>
        )}

        {/* Multiple results */}
        {foundUsers.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">{foundUsers.length} résultats — sélectionnez un utilisateur :</p>
            {foundUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={clsx(
                  'w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all',
                  selectedUser?.id === u.id
                    ? 'border-[#1D9E75] bg-[#1D9E75]/5 text-gray-900 dark:text-white'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300',
                )}
              >
                <span className="font-mono">{u.phone}</span>
                <span className="ml-3 text-gray-500">{u.full_name ?? '—'}</span>
                <span className="ml-3 font-semibold">{fmt(u.balance_cdf)} CDF</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected user + adjustment form */}
      {selectedUser && (
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
          {/* User info */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{selectedUser.full_name ?? 'Nom inconnu'}</p>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{selectedUser.phone}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Solde actuel</p>
              <p className="text-xl font-heading font-bold text-gray-900 dark:text-white">{fmt(selectedUser.balance_cdf)} CDF</p>
            </div>
          </div>

          {/* Adjustment inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Montant CDF <span className="text-gray-400 font-normal normal-case">(positif = crédit, négatif = débit)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAmount((prev) => { const n = prev.replace(/^-/, ''); return n; })}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <Plus size={13} /> Crédit
                </button>
                <button
                  type="button"
                  onClick={() => setAmount((prev) => { const n = prev.replace(/^-/, ''); return n ? `-${n}` : ''; })}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800/50 text-red-500 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Minus size={13} /> Débit
                </button>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Montant (CDF)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75] transition-colors"
                />
              </div>
              {amount && Number.isFinite(parseFloat(amount)) && (
                <p className={clsx('text-xs mt-1.5 font-medium', parseFloat(amount) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                  {parseFloat(amount) > 0
                    ? <><ArrowDownLeft size={12} className="inline" /> Crédit de {fmt(Math.abs(parseFloat(amount)))} CDF → nouveau solde estimé : {fmt(selectedUser.balance_cdf + parseFloat(amount))} CDF</>
                    : <><ArrowUpRight size={12} className="inline" /> Débit de {fmt(Math.abs(parseFloat(amount)))} CDF → nouveau solde estimé : {fmt(selectedUser.balance_cdf + parseFloat(amount))} CDF</>
                  }
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Motif</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motif de l'ajustement (ex : remboursement, bonus, correction…)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75] transition-colors"
              />
            </div>

            <button
              onClick={handleAdjust}
              disabled={applying || !amount || !reason || !Number.isFinite(parseFloat(amount)) || parseFloat(amount) === 0}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1D9E75] hover:bg-[#178a65] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-sm"
            >
              {applying ? <Loader2 size={15} className="animate-spin" /> : <SlidersHorizontal size={15} />}
              {applying ? 'Application en cours…' : 'Appliquer l\'ajustement'}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Ajustements de cette session</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Date', 'Téléphone', 'Direction', 'Montant', 'Motif'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {history.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDate(l.created_at)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700 dark:text-gray-300">{l.phone ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold', l.direction === 'credit' ? 'text-emerald-600' : 'text-red-500')}>
                        {l.direction === 'credit' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {l.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{fmt(l.amount)}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{l.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {history.length === 0 && !histLoading && (
        <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-600">
          Aucun ajustement effectué dans cette session.
        </div>
      )}
    </div>
  );
}
