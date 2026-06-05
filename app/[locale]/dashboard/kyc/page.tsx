'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle,
  Loader2, AlertTriangle, Send,
} from 'lucide-react';

/* ── types ──────────────────────────────────────────────────── */
type KycStatus = 'pending' | 'approved' | 'rejected';

interface KycData {
  kyc_status: KycStatus;
  kyc_submitted_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_notes: string | null;
  company_name: string | null;
  company_rccm: string | null;
  company_idnat: string | null;
}

/* ── status badge ───────────────────────────────────────────── */
const STATUS_CFG: Record<KycStatus, { icon: typeof CheckCircle2; badge: string; bar: string }> = {
  pending:  { icon: Clock,         badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40', bar: 'bg-amber-500' },
  approved: { icon: CheckCircle2,  badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40', bar: 'bg-emerald-500' },
  rejected: { icon: XCircle,       badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40', bar: 'bg-red-500' },
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── input ──────────────────────────────────────────────────── */
function Field({
  label, value, onChange, placeholder, required, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75] transition-colors"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

/* ── page ───────────────────────────────────────────────────── */
export default function KycPage() {
  const t = useTranslations('dashboard.kyc');

  const [data, setData] = useState<KycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [companyRccm, setCompanyRccm] = useState('');
  const [companyIdnat, setCompanyIdnat] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/merchant/kyc')
      .then((r) => r.json())
      .then((d: KycData) => {
        setData(d);
        setCompanyName(d.company_name ?? '');
        setCompanyRccm(d.company_rccm ?? '');
        setCompanyIdnat(d.company_idnat ?? '');
      })
      .catch(() => setData({ kyc_status: 'pending', kyc_submitted_at: null, kyc_reviewed_at: null, kyc_notes: null, company_name: null, company_rccm: null, company_idnat: null }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!companyName.trim()) { setSubmitError(t('company_name') + ' requis'); return; }
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    const res = await fetch('/api/merchant/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: companyName, company_rccm: companyRccm || undefined, company_idnat: companyIdnat || undefined }),
    });
    const result = await res.json() as { ok?: boolean; error?: string };

    if (res.ok) {
      setData((prev) => prev ? { ...prev, kyc_status: 'pending', kyc_submitted_at: new Date().toISOString(), company_name: companyName, company_rccm: companyRccm || null, company_idnat: companyIdnat || null } : prev);
      setSubmitSuccess(true);
    } else {
      setSubmitError(result.error ?? 'Error');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-[#1D9E75]" />
      </div>
    );
  }

  const status = data?.kyc_status ?? 'pending';
  const cfg = STATUS_CFG[status];
  const StatusIcon = cfg.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[#1D9E75]/10 dark:bg-[#1D9E75]/15">
            <ShieldCheck className="text-[#1D9E75]" size={20} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">{t('subtitle')}</p>
      </div>

      {/* ── Status card ───────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${
        status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40' :
        status === 'rejected' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40' :
        'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
      }`}>
        <div className="flex items-start gap-3">
          <StatusIcon size={20} className={
            status === 'approved' ? 'text-emerald-500 mt-0.5 flex-shrink-0' :
            status === 'rejected' ? 'text-red-500 mt-0.5 flex-shrink-0' :
            'text-amber-500 mt-0.5 flex-shrink-0'
          } />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                {t(`badge_${status}` as Parameters<typeof t>[0])}
              </span>
              {data?.kyc_submitted_at && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('submitted_at')}: {fmt(data.kyc_submitted_at)}</span>
              )}
              {data?.kyc_reviewed_at && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('reviewed_at')}: {fmt(data.kyc_reviewed_at)}</span>
              )}
            </div>
            <p className={`text-sm font-medium ${
              status === 'approved' ? 'text-emerald-800 dark:text-emerald-300' :
              status === 'rejected' ? 'text-red-800 dark:text-red-300' :
              'text-amber-800 dark:text-amber-300'
            }`}>
              {t(`status_${status}` as Parameters<typeof t>[0])}
            </p>
            {/* Rejection reason */}
            {status === 'rejected' && data?.kyc_notes && (
              <div className="mt-3 bg-white dark:bg-gray-900/60 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">{t('rejection_reason')}</p>
                <p className="text-sm text-red-800 dark:text-red-300">{data.kyc_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KYC form ──────────────────────────────────────────── */}
      {status !== 'approved' && (
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('form_title')}</h2>

          <Field
            label={t('company_name')}
            value={companyName}
            onChange={setCompanyName}
            placeholder={t('company_name_placeholder')}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={t('company_rccm')}
              value={companyRccm}
              onChange={setCompanyRccm}
              placeholder={t('company_rccm_placeholder')}
            />
            <Field
              label={t('company_idnat')}
              value={companyIdnat}
              onChange={setCompanyIdnat}
              placeholder={t('company_idnat_placeholder')}
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-2.5">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={15} /> {t('submit_success')}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !companyName.trim()}
            className="flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-[#1D9E75] hover:bg-[#178a65] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-sm shadow-[#1D9E75]/20"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {submitting ? t('submitting') : (data?.kyc_submitted_at ? t('resubmit') : t('submit'))}
          </button>
        </div>
      )}

      {/* ── What is KYC ───────────────────────────────────────── */}
      <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('what_is_title')}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('what_is_body')}</p>
      </div>

    </div>
  );
}
