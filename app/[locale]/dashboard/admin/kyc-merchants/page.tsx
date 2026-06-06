'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, FlaskConical, Globe } from 'lucide-react';
import { getMerchants, setMerchantMode, type Merchant } from '@/lib/admin-api';
import clsx from 'clsx';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric' });
}

const KYC_LABELS: Record<string, string> = {
  pending: 'En attente',
  submitted: 'Soumis',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

const KYC_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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

export default function KycMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
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

  const handleToggleMode = async (merchant: Merchant) => {
    const newMode = merchant.mode === 'live' ? 'sandbox' : 'live';
    setToggling(merchant.id);
    try {
      const res = await setMerchantMode(merchant.id, newMode);
      setMerchants((prev) =>
        prev.map((m) => m.id === merchant.id ? { ...m, mode: res.merchant.mode } : m),
      );
      setToast({ msg: `${merchant.email} → ${newMode}`, type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-[#1D9E75]" size={22} />
            KYC Merchants
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gérez le mode sandbox/live de chaque merchant.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400 gap-2">
            <RefreshCw size={16} className="animate-spin" />
            Chargement…
          </div>
        ) : merchants.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400 dark:text-gray-600">
            Aucun merchant trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Email', 'Nom', 'Mode', 'KYC', 'Statut', 'Créé le', 'Action'].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {m.email}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {m.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold',
                        m.mode === 'live'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                      )}>
                        {m.mode === 'live' ? <Globe size={11} /> : <FlaskConical size={11} />}
                        {m.mode === 'live' ? 'Live' : 'Sandbox'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
                        KYC_STYLES[m.kyc_status] ?? 'bg-gray-100 text-gray-600',
                      )}>
                        {KYC_LABELS[m.kyc_status] ?? m.kyc_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap capitalize">
                      {m.status}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {fmt(m.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => void handleToggleMode(m)}
                        disabled={toggling === m.id}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                          m.mode === 'live'
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
                          toggling === m.id && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        {toggling === m.id ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : m.mode === 'live' ? (
                          <FlaskConical size={11} />
                        ) : (
                          <Globe size={11} />
                        )}
                        {m.mode === 'live' ? '→ Sandbox' : '→ Live'}
                      </button>
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
