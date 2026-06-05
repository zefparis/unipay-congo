'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShieldCheck, CheckCircle2, XCircle, Clock,
  Loader2, RefreshCw, LogOut, Check, X as XIcon,
} from 'lucide-react';

/* ── types ──────────────────────────────────────────────────── */
type KycStatus = 'pending' | 'approved' | 'rejected';

interface Merchant {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  company_rccm: string | null;
  company_idnat: string | null;
  kyc_status: KycStatus;
  kyc_submitted_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_notes: string | null;
  created_at: string;
}

type FilterType = 'all' | KycStatus;

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '';

const STATUS_CFG: Record<KycStatus, { icon: typeof CheckCircle2; badge: string }> = {
  pending:  { icon: Clock,        badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' },
  approved: { icon: CheckCircle2, badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' },
  rejected: { icon: XCircle,      badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40' },
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── page ───────────────────────────────────────────────────── */
export default function AdminPage() {
  const t = useTranslations('admin');

  /* auth */
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  /* data */
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [dataLoading, setDataLoading] = useState(false);

  /* per-row action state */
  const [actioning, setActioning] = useState<Record<string, 'approving' | 'rejecting' | null>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [showReject, setShowReject] = useState<Record<string, boolean>>({});

  const load = useCallback(async (f: FilterType) => {
    setDataLoading(true);
    const qs = f !== 'all' ? `?kyc_status=${f}` : '';
    const res = await fetch(`/api/admin/kyc${qs}`);
    const data = await res.json() as { data?: Merchant[]; pagination?: { total: number } };
    setMerchants(data.data ?? []);
    setTotal(data.pagination?.total ?? 0);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (authed) load(filter);
  }, [authed, filter, load]);

  const handleLogin = () => {
    if (!ADMIN_PASSWORD || pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError('');
    } else {
      setPwError(t('wrong_password'));
    }
  };

  const handleApprove = async (id: string) => {
    setActioning((a) => ({ ...a, [id]: 'approving' }));
    await fetch(`/api/admin/kyc/${id}/approve`, { method: 'POST' });
    setMerchants((ms) => ms.map((m) => m.id === id ? { ...m, kyc_status: 'approved', kyc_reviewed_at: new Date().toISOString() } : m));
    setActioning((a) => ({ ...a, [id]: null }));
  };

  const handleReject = async (id: string) => {
    const notes = rejectNotes[id]?.trim();
    if (!notes) return;
    setActioning((a) => ({ ...a, [id]: 'rejecting' }));
    await fetch(`/api/admin/kyc/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    setMerchants((ms) => ms.map((m) => m.id === id ? { ...m, kyc_status: 'rejected', kyc_notes: notes, kyc_reviewed_at: new Date().toISOString() } : m));
    setActioning((a) => ({ ...a, [id]: null }));
    setShowReject((s) => ({ ...s, [id]: false }));
  };

  /* ── Login screen ─────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0f1e] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1D9E75]/10 mb-4">
              <ShieldCheck size={28} className="text-[#1D9E75]" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder={t('password_placeholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75]"
            />
            {pwError && <p className="text-sm text-red-500">{pwError}</p>}
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl bg-[#1D9E75] hover:bg-[#178a65] text-white font-semibold text-sm transition-all"
            >
              {t('enter')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Admin panel ──────────────────────────────────────────── */
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('filter_all') },
    { key: 'pending', label: t('filter_pending') },
    { key: 'approved', label: t('filter_approved') },
    { key: 'rejected', label: t('filter_rejected') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e]">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#0d1420] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#1D9E75]" />
            <h1 className="text-base font-heading font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{t('total', { count: total })}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(filter)}
              disabled={dataLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#1D9E75] hover:bg-[#1D9E75]/10 transition-colors"
            >
              <RefreshCw size={13} className={dataLoading ? 'animate-spin' : ''} />
              {t('refresh')}
            </button>
            <button
              onClick={() => setAuthed(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={13} />
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Filter tabs ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-[#1D9E75] text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#1D9E75] hover:text-[#1D9E75]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Merchant list ────────────────────────────────────── */}
        {dataLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#1D9E75]" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">{t('no_merchants')}</div>
        ) : (
          <div className="space-y-4">
            {merchants.map((m) => {
              const sc = STATUS_CFG[m.kyc_status];
              const Icon = sc.icon;
              const isActioning = actioning[m.id];
              const rejectOpen = showReject[m.id];

              return (
                <div key={m.id} className="bg-white dark:bg-[#0d1420] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${sc.badge}`}>
                            <Icon size={10} />
                            {t(`badge_${m.kyc_status}` as Parameters<typeof t>[0])}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{m.email}</p>
                        {m.company_name && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 font-medium">{m.company_name}</p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                          {m.company_rccm && <span className="text-xs text-gray-400">{t('rccm_label')}: <span className="font-mono">{m.company_rccm}</span></span>}
                          {m.company_idnat && <span className="text-xs text-gray-400">{t('idnat_label')}: <span className="font-mono">{m.company_idnat}</span></span>}
                          {m.kyc_submitted_at && <span className="text-xs text-gray-400">{t('col_submitted')}: {fmt(m.kyc_submitted_at)}</span>}
                        </div>
                        {m.kyc_notes && (
                          <div className="mt-2 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
                            <p className="text-xs text-red-700 dark:text-red-400">{m.kyc_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {m.kyc_status !== 'approved' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(m.id)}
                            disabled={!!isActioning}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                          >
                            {isActioning === 'approving' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            {isActioning === 'approving' ? t('approving') : t('approve')}
                          </button>
                          {m.kyc_status !== 'rejected' && (
                            <button
                              onClick={() => setShowReject((s) => ({ ...s, [m.id]: !s[m.id] }))}
                              disabled={!!isActioning}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold disabled:opacity-50 transition-all"
                            >
                              <XIcon size={12} />
                              {t('reject')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reject notes inline form */}
                    {rejectOpen && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={rejectNotes[m.id] ?? ''}
                          onChange={(e) => setRejectNotes((n) => ({ ...n, [m.id]: e.target.value }))}
                          placeholder={t('notes_placeholder')}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(m.id)}
                            disabled={!rejectNotes[m.id]?.trim() || !!isActioning}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                          >
                            {isActioning === 'rejecting' ? <Loader2 size={12} className="animate-spin" /> : <XIcon size={12} />}
                            {isActioning === 'rejecting' ? t('rejecting') : t('notes_confirm')}
                          </button>
                          <button
                            onClick={() => setShowReject((s) => ({ ...s, [m.id]: false }))}
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
