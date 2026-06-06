'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, RefreshCw, CheckCircle2, AlertCircle,
  FlaskConical, Globe, XCircle, Building2, Clock,
} from 'lucide-react';
import { getMerchants, setMerchantMode, approveKyc, rejectKyc, type Merchant } from '@/lib/admin-api';
import clsx from 'clsx';

const KYC_LABELS: Record<string, string> = {
  pending:   'Non soumis',
  submitted: 'En attente de review',
  approved:  'Approuvé',
  rejected:  'Rejeté',
};
const KYC_STYLES: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
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

export default function KycMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMerchants();
      setMerchants(res.data);
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleApprove = async (m: Merchant) => {
    setActing(m.id + ':approve');
    try {
      await approveKyc(m.id);
      setMerchants((prev) => prev.map((x) => x.id === m.id ? { ...x, kyc_status: 'approved', mode: 'live' } : x));
      setToast({ msg: `✓ KYC approuvé — ${m.email} passé en Live`, type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally { setActing(null); }
  };

  const handleReject = async (m: Merchant) => {
    setActing(m.id + ':reject');
    try {
      await rejectKyc(m.id, rejectNotes[m.id]);
      setMerchants((prev) => prev.map((x) => x.id === m.id ? { ...x, kyc_status: 'rejected' } : x));
      setRejectNotes((prev) => { const n = { ...prev }; delete n[m.id]; return n; });
      setToast({ msg: `KYC rejeté — ${m.email}`, type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally { setActing(null); }
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

  const pending = merchants.filter((m) => m.kyc_status === 'submitted');
  const others  = merchants.filter((m) => m.kyc_status !== 'submitted');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-[#1D9E75]" size={22} />
            KYC Merchants
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Approuvez ou refusez les dossiers KYC. L&apos;approbation active le mode Live.
          </p>
        </div>
        <button onClick={() => void load()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400 gap-2">
          <RefreshCw size={16} className="animate-spin" /> Chargement…
        </div>
      ) : (
        <>
          {/* ── Section: Dossiers en attente de review ── */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Dossiers en attente
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">{pending.length}</span>
                </h2>
              </div>
              {pending.map((m) => (
                <div key={m.id} className="bg-white dark:bg-gray-900/60 border-2 border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{m.company_name ?? m.name ?? '—'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{m.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Soumis le {fmt(m.kyc_submitted_at)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Raison sociale</p>
                      <p className="text-gray-900 dark:text-white font-medium">{m.company_name ?? '—'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">RCCM</p>
                      <p className="text-gray-900 dark:text-white font-medium">{m.company_rccm ?? '—'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2.5 col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">IDNAT</p>
                      <p className="text-gray-900 dark:text-white font-medium">{m.company_idnat ?? '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Motif de refus (optionnel)"
                        value={rejectNotes[m.id] ?? ''}
                        onChange={(e) => setRejectNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/50"
                      />
                    </div>
                    <button
                      onClick={() => void handleReject(m)}
                      disabled={acting !== null}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {acting === m.id + ':reject' ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={13} />}
                      Refuser
                    </button>
                    <button
                      onClick={() => void handleApprove(m)}
                      disabled={acting !== null}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D9E75] text-white hover:bg-[#17876A] text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {acting === m.id + ':approve' ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Approuver &amp; Live
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pending.length === 0 && !loading && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 size={16} />
              Aucun dossier KYC en attente de validation.
            </div>
          )}

          {/* ── Section: Tous les merchants ── */}
          {others.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Tous les merchants</h2>
              <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        {['Email', 'Entreprise', 'KYC', 'Mode', 'Action mode'].map((col) => (
                          <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {others.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{m.email}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{m.company_name ?? m.name ?? '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', KYC_STYLES[m.kyc_status] ?? 'bg-gray-100 text-gray-600')}>
                              {KYC_LABELS[m.kyc_status] ?? m.kyc_status}
                            </span>
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
                            <button
                              onClick={() => void handleToggleMode(m)}
                              disabled={acting !== null}
                              className={clsx(
                                'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50',
                                m.mode === 'live'
                                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400',
                              )}
                            >
                              {acting === m.id + ':mode' ? <RefreshCw size={11} className="animate-spin" /> : m.mode === 'live' ? <FlaskConical size={11} /> : <Globe size={11} />}
                              {m.mode === 'live' ? '→ Sandbox' : '→ Live'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
