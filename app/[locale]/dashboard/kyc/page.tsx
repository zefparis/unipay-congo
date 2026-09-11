'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle,
  Loader2, AlertTriangle, Send, Upload, FileText, Lock,
} from 'lucide-react';

/* ── types ──────────────────────────────────────────────────── */
type KycStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

interface KycData {
  kyc_status: KycStatus;
  kyc_submitted_at: string | null;
  kyc_reviewed_at: string | null;
  kyc_notes: string | null;
  company_name: string | null;
  company_rccm: string | null;
  company_idnat: string | null;
  rccm_file_url: string | null;
  idnat_file_url: string | null;
  rep_id_file_url: string | null;
}

/* ── status badge ───────────────────────────────────────────── */
const STATUS_CFG: Record<KycStatus, { icon: typeof CheckCircle2; badge: string; bar: string }> = {
  pending:   { icon: Clock,        badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40', bar: 'bg-amber-500' },
  submitted: { icon: Clock,        badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40', bar: 'bg-blue-500' },
  approved:  { icon: CheckCircle2, badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40', bar: 'bg-emerald-500' },
  rejected:  { icon: XCircle,      badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40', bar: 'bg-red-500' },
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── file validation ────────────────────────────────────────── */
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = '.pdf,.jpg,.jpeg,.png';
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return 'Le fichier dépasse la taille maximale de 10 Mo.';
  }
  const nameOk = /\.(pdf|jpe?g|png)$/i.test(file.name);
  const typeOk = ACCEPTED_TYPES.includes(file.type) || nameOk;
  if (!typeOk) {
    return 'Type de fichier non autorisé (PDF, JPG ou PNG uniquement).';
  }
  return null;
}

/* ── input ──────────────────────────────────────────────────── */
function Field({
  label, value, onChange, placeholder, required, hint, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; hint?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-text-primary uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-deep/40 focus:border-green-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

/* ── file input ─────────────────────────────────────────────── */
function FileInput({
  label, file, onPick, onClear, error, disabled, required,
}: {
  label: string;
  file: File | null;
  onPick: (f: File | null) => void;
  onClear: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-text-primary uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-700 dark:text-text-primary hover:bg-gray-50 dark:hover:bg-navy-panel/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Upload size={14} />
          {file ? 'Changer' : 'Choisir un fichier'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onPick(f);
            e.target.value = '';
          }}
        />
        {file && (
          <>
            <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-text-primary truncate">
              <FileText size={14} className="text-green-deep flex-shrink-0" />
              <span className="truncate">{file.name}</span>
              <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(0)} Ko)</span>
            </span>
            {!disabled && (
              <button type="button" onClick={onClear} className="text-xs text-red-500 hover:underline">
                Retirer
              </button>
            )}
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
      <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG — 10 Mo max.</p>
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
  const [rccmFile, setRccmFile] = useState<File | null>(null);
  const [idnatFile, setIdnatFile] = useState<File | null>(null);
  const [repIdFile, setRepIdFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
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
      .catch(() => setData({ kyc_status: 'pending', kyc_submitted_at: null, kyc_reviewed_at: null, kyc_notes: null, company_name: null, company_rccm: null, company_idnat: null, rccm_file_url: null, idnat_file_url: null, rep_id_file_url: null }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    // Validate text
    if (!companyName.trim()) { setSubmitError(t('company_name') + ' requis'); return; }
    // Validate files
    const errs: Record<string, string> = {};
    if (rccmFile)  { const e = validateFile(rccmFile);  if (e) errs.rccm = e; }
    if (idnatFile) { const e = validateFile(idnatFile); if (e) errs.idnat = e; }
    if (repIdFile) { const e = validateFile(repIdFile); if (e) errs.repId = e; }
    setFileErrors(errs);
    if (Object.keys(errs).length > 0) { setSubmitError('Vérifiez les fichiers sélectionnés.'); return; }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    const fd = new FormData();
    fd.append('company_name', companyName.trim());
    if (companyRccm.trim())  fd.append('company_rccm', companyRccm.trim());
    if (companyIdnat.trim()) fd.append('company_idnat', companyIdnat.trim());
    if (rccmFile)  fd.append('rccm_file', rccmFile);
    if (idnatFile) fd.append('idnat_file', idnatFile);
    if (repIdFile) fd.append('rep_id_file', repIdFile);

    const res = await fetch('/api/merchant/kyc', {
      method: 'POST',
      body: fd,
    });
    const result = await res.json() as { ok?: boolean; kyc_status?: string; error?: string };

    if (res.ok) {
      setData((prev) => prev ? {
        ...prev,
        kyc_status: 'submitted',
        kyc_submitted_at: new Date().toISOString(),
        company_name: companyName.trim(),
        company_rccm: companyRccm.trim() || null,
        company_idnat: companyIdnat.trim() || null,
        rccm_file_url: rccmFile ? 'uploaded' : prev.rccm_file_url,
        idnat_file_url: idnatFile ? 'uploaded' : prev.idnat_file_url,
        rep_id_file_url: repIdFile ? 'uploaded' : prev.rep_id_file_url,
      } : prev);
      setRccmFile(null);
      setIdnatFile(null);
      setRepIdFile(null);
      setSubmitSuccess(true);
    } else {
      setSubmitError(result.error ?? 'Error');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-green-deep" />
      </div>
    );
  }

  const status = data?.kyc_status ?? 'pending';
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const StatusIcon = cfg.icon;
  const formLocked = status === 'submitted';
  const showForm = status !== 'approved';

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-green-deep/10 dark:bg-green-deep/15">
            <ShieldCheck className="text-green-deep" size={20} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary">{t('title')}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-text-secondary ml-12">{t('subtitle')}</p>
      </div>

      {/* ── Status card ───────────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${
        status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40' :
        status === 'rejected' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40' :
        status === 'submitted' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40' :
        'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
      }`}>
        <div className="flex items-start gap-3">
          <StatusIcon size={20} className={
            status === 'approved' ? 'text-emerald-500 mt-0.5 flex-shrink-0' :
            status === 'rejected' ? 'text-red-500 mt-0.5 flex-shrink-0' :
            status === 'submitted' ? 'text-blue-500 mt-0.5 flex-shrink-0' :
            'text-amber-500 mt-0.5 flex-shrink-0'
          } />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                {t(`badge_${status}` as Parameters<typeof t>[0])}
              </span>
              {data?.kyc_submitted_at && (
                <span className="text-xs text-gray-500 dark:text-text-secondary">{t('submitted_at')}: {fmt(data.kyc_submitted_at)}</span>
              )}
              {data?.kyc_reviewed_at && (
                <span className="text-xs text-gray-500 dark:text-text-secondary">{t('reviewed_at')}: {fmt(data.kyc_reviewed_at)}</span>
              )}
            </div>
            <p className={`text-sm font-medium ${
              status === 'approved' ? 'text-emerald-800 dark:text-emerald-300' :
              status === 'rejected' ? 'text-red-800 dark:text-red-300' :
              status === 'submitted' ? 'text-blue-800 dark:text-blue-300' :
              'text-amber-800 dark:text-amber-300'
            }`}>
              {t(`status_${status}` as Parameters<typeof t>[0])}
            </p>
            {/* Rejection reason */}
            {status === 'rejected' && data?.kyc_notes && (
              <div className="mt-3 bg-white dark:bg-navy-panel/60 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">{t('rejection_reason')}</p>
                <p className="text-sm text-red-800 dark:text-red-300">{data.kyc_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KYC form ──────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary">{t('form_title')}</h2>
            {formLocked && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <Lock size={12} /> {t('locked')}
              </span>
            )}
          </div>

          <Field
            label={t('company_name')}
            value={companyName}
            onChange={setCompanyName}
            placeholder={t('company_name_placeholder')}
            required
            disabled={formLocked}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={t('company_rccm')}
              value={companyRccm}
              onChange={setCompanyRccm}
              placeholder={t('company_rccm_placeholder')}
              disabled={formLocked}
            />
            <Field
              label={t('company_idnat')}
              value={companyIdnat}
              onChange={setCompanyIdnat}
              placeholder={t('company_idnat_placeholder')}
              disabled={formLocked}
            />
          </div>

          {/* Already-uploaded docs indicator (when locked / resubmitting) */}
          {formLocked && (data?.rccm_file_url || data?.idnat_file_url || data?.rep_id_file_url) && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">{t('docs_uploaded')}</p>
              {data?.rccm_file_url  && <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-1"><FileText size={13} /> {t('rccm_file')}</p>}
              {data?.idnat_file_url && <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-1"><FileText size={13} /> {t('idnat_file')}</p>}
              {data?.rep_id_file_url && <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-1"><FileText size={13} /> {t('rep_id_file')}</p>}
            </div>
          )}

          {/* File inputs — only when not locked */}
          {!formLocked && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-text-secondary/15">
              <p className="text-xs font-semibold text-gray-700 dark:text-text-primary uppercase tracking-wider">{t('docs_section')}</p>
              <FileInput
                label={t('rccm_file')}
                file={rccmFile}
                onPick={(f) => { setRccmFile(f); setFileErrors((p) => ({ ...p, rccm: '' })); }}
                onClear={() => setRccmFile(null)}
                error={fileErrors.rccm}
                required
              />
              <FileInput
                label={t('idnat_file')}
                file={idnatFile}
                onPick={(f) => { setIdnatFile(f); setFileErrors((p) => ({ ...p, idnat: '' })); }}
                onClear={() => setIdnatFile(null)}
                error={fileErrors.idnat}
                required
              />
              <FileInput
                label={t('rep_id_file')}
                file={repIdFile}
                onPick={(f) => { setRepIdFile(f); setFileErrors((p) => ({ ...p, repId: '' })); }}
                onClear={() => setRepIdFile(null)}
                error={fileErrors.repId}
              />
            </div>
          )}

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

          {!formLocked && (
            <button
              onClick={handleSubmit}
              disabled={submitting || !companyName.trim()}
              className="flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-green-deep hover:bg-green-deep/85 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-sm shadow-green-deep/20"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? t('submitting') : (data?.kyc_submitted_at ? t('resubmit') : t('submit'))}
            </button>
          )}
        </div>
      )}

      {/* ── What is KYC ───────────────────────────────────────── */}
      <div className="bg-gray-50 dark:bg-navy-panel/40 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-text-primary">{t('what_is_title')}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">{t('what_is_body')}</p>
      </div>

    </div>
  );
}
