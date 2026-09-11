'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import {
  ShieldCheck, RefreshCw, CheckCircle2, AlertCircle,
  FlaskConical, Globe, XCircle, Building2, Clock,
  FileText, Download, X, ExternalLink, Loader2, Filter,
} from 'lucide-react';
import {
  getMerchants, setMerchantMode, approveKyc, rejectKyc,
  getMerchantKycDocs, type Merchant, type MerchantKycDocs,
} from '@/lib/admin-api';
import clsx from 'clsx';

const KYC_LABELS: Record<string, string> = {
  pending:   'Non soumis',
  submitted: 'En attente de review',
  approved:  'Approuvé',
  rejected:  'Rejeté',
};
const KYC_STYLES: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-500 dark:bg-navy-panel dark:text-text-secondary',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/* ── KYC status filter options ── */
type KycFilter = 'all' | 'pending' | 'submitted' | 'approved' | 'rejected';
const FILTER_OPTIONS: { value: KycFilter; label: string }[] = [
  { value: 'all',       label: 'Tous' },
  { value: 'submitted', label: 'En attente' },
  { value: 'pending',   label: 'Non soumis' },
  { value: 'approved',  label: 'Approuvé' },
  { value: 'rejected',  label: 'Rejeté' },
];

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

/* ── Document viewer modal ────────────────────────────────── */
function KycDocsModal({
  merchant, onClose, onApprove, approving,
}: {
  merchant: Merchant;
  onClose: () => void;
  onApprove: () => void;
  approving: boolean;
}) {
  const [docs, setDocs] = useState<MerchantKycDocs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getMerchantKycDocs(merchant.id)
      .then((d) => { if (!cancelled) setDocs(d); })
      .catch((e) => { if (!cancelled) setError((e as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [merchant.id]);

  const docEntries: { key: 'rccm_file' | 'idnat_file' | 'rep_id_file'; label: string }[] = [
    { key: 'rccm_file',  label: 'RCCM scanné' },
    { key: 'idnat_file', label: 'ID NAT scanné' },
    { key: 'rep_id_file', label: 'Pièce d’identité du représentant légal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-navy-panel rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-text-secondary/15">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
              <FileText size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-text-primary truncate">{merchant.company_name ?? merchant.name ?? '—'}</p>
              <p className="text-xs text-gray-500 dark:text-text-secondary truncate">{merchant.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-panel/60 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* KYC info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 dark:bg-navy-panel/50 rounded-xl px-3 py-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">RCCM</p>
              <p className="text-gray-900 dark:text-text-primary font-medium truncate">{merchant.company_rccm ?? '—'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-navy-panel/50 rounded-xl px-3 py-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">IDNAT</p>
              <p className="text-gray-900 dark:text-text-primary font-medium truncate">{merchant.company_idnat ?? '—'}</p>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-text-secondary">
            Soumis le {fmt(merchant.kyc_submitted_at)} · Statut :{' '}
            <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', KYC_STYLES[merchant.kyc_status] ?? 'bg-gray-100 text-gray-600')}>
              {KYC_LABELS[merchant.kyc_status] ?? merchant.kyc_status}
            </span>
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-text-primary uppercase tracking-wider">Documents</p>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <Loader2 size={14} className="animate-spin" /> Chargement des documents…
              </div>
            )}
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}
            {!loading && !error && docs && (
              <div className="space-y-2">
                {docEntries.map(({ key, label }) => {
                  const doc = docs.docs[key];
                  if (!doc?.signed_url) {
                    return (
                      <div key={key} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-gray-50 dark:bg-navy-panel/50 text-sm text-gray-400">
                        <FileText size={14} className="flex-shrink-0" />
                        <span className="flex-1">{label}</span>
                        <span className="text-xs italic">Non fourni</span>
                      </div>
                    );
                  }
                  return (
                    <a
                      key={key}
                      href={doc.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-gray-50 dark:bg-navy-panel/50 hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors text-sm text-gray-700 dark:text-text-primary"
                    >
                      <FileText size={14} className="text-green-deep flex-shrink-0" />
                      <span className="flex-1 truncate">{label}</span>
                      <Download size={14} className="text-gray-400 flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer — actions */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-100 dark:border-text-secondary/15">
          <Link
            href={`/dashboard/admin/merchants/${merchant.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm font-medium text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
          >
            <ExternalLink size={14} /> Profil complet
          </Link>
          {merchant.kyc_status !== 'approved' && (
            <button
              onClick={onApprove}
              disabled={approving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-deep text-white hover:bg-green-deep/85 text-sm font-semibold transition-all disabled:opacity-50"
            >
              {approving ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Valider le KYC
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────── */
export default function KycMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [kycFilter, setKycFilter] = useState<KycFilter>('all');
  const [docsModalMerchant, setDocsModalMerchant] = useState<Merchant | null>(null);

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

  // Filter
  const filtered = kycFilter === 'all' ? merchants : merchants.filter((m) => m.kyc_status === kycFilter);
  const pending = filtered.filter((m) => m.kyc_status === 'submitted');
  const others  = filtered.filter((m) => m.kyc_status !== 'submitted');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Docs modal */}
      {docsModalMerchant && (
        <KycDocsModal
          merchant={docsModalMerchant}
          onClose={() => setDocsModalMerchant(null)}
          onApprove={() => { void handleApprove(docsModalMerchant); setDocsModalMerchant(null); }}
          approving={acting === docsModalMerchant.id + ':approve'}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
            <ShieldCheck className="text-green-deep" size={22} />
            KYC Merchants
          </h1>
          <p className="text-sm text-gray-500 dark:text-text-secondary mt-0.5">
            Approuvez ou refusez les dossiers KYC. L&apos;approbation active le mode Live.
          </p>
        </div>
        <button onClick={() => void load()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* ── KYC status filter ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider">
          <Filter size={12} /> Filtrer :
        </span>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setKycFilter(opt.value)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
              kycFilter === opt.value
                ? 'bg-green-deep text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-navy-panel dark:text-text-secondary hover:bg-gray-200 dark:hover:bg-navy-panel/80',
            )}
          >
            {opt.label}
          </button>
        ))}
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
                <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary uppercase tracking-wider">
                  Dossiers en attente
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">{pending.length}</span>
                </h2>
              </div>
              {pending.map((m) => (
                <div key={m.id} className="bg-white dark:bg-navy-panel/60 border-2 border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-text-primary">{m.company_name ?? m.name ?? '—'}</p>
                        <p className="text-xs text-gray-500 dark:text-text-secondary">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {m.kyc_docs_count != null && m.kyc_docs_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-text-secondary">
                          <FileText size={12} /> {m.kyc_docs_count} doc{m.kyc_docs_count > 1 ? 's' : ''}
                        </span>
                      )}
                      <p className="text-xs text-gray-400">Soumis le {fmt(m.kyc_submitted_at)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 dark:bg-navy-panel/50 rounded-xl px-4 py-2.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Raison sociale</p>
                      <p className="text-gray-900 dark:text-text-primary font-medium">{m.company_name ?? '—'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-navy-panel/50 rounded-xl px-4 py-2.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">RCCM</p>
                      <p className="text-gray-900 dark:text-text-primary font-medium">{m.company_rccm ?? '—'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-navy-panel/50 rounded-xl px-4 py-2.5 col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">IDNAT</p>
                      <p className="text-gray-900 dark:text-text-primary font-medium">{m.company_idnat ?? '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Motif de refus (optionnel)"
                        value={rejectNotes[m.id] ?? ''}
                        onChange={(e) => setRejectNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-text-secondary/20 bg-gray-50 dark:bg-navy-panel text-gray-900 dark:text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-deep/50"
                      />
                    </div>
                    <button
                      onClick={() => setDocsModalMerchant(m)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-text-secondary/20 text-sm font-semibold text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all"
                    >
                      <FileText size={13} /> Voir les documents
                    </button>
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
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-deep text-white hover:bg-green-deep/85 text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {acting === m.id + ':approve' ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Approuver &amp; Live
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pending.length === 0 && !loading && kycFilter === 'submitted' && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 size={16} />
              Aucun dossier KYC en attente de validation.
            </div>
          )}

          {/* ── Section: Tous les merchants ── */}
          {others.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider">Tous les merchants</h2>
              <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                        {['Email', 'Entreprise', 'KYC', 'Docs', 'Mode', 'Actions'].map((col) => (
                          <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                      {others.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-navy-panel/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-text-primary whitespace-nowrap">{m.email}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-text-secondary whitespace-nowrap">{m.company_name ?? m.name ?? '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', KYC_STYLES[m.kyc_status] ?? 'bg-gray-100 text-gray-600')}>
                              {KYC_LABELS[m.kyc_status] ?? m.kyc_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {m.kyc_docs_count != null && m.kyc_docs_count > 0 ? (
                              <button
                                onClick={() => setDocsModalMerchant(m)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <FileText size={12} /> {m.kyc_docs_count} doc{m.kyc_docs_count > 1 ? 's' : ''}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
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
                            <div className="flex items-center gap-2">
                              {m.kyc_docs_count != null && m.kyc_docs_count > 0 && (
                                <button
                                  onClick={() => setDocsModalMerchant(m)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-text-secondary/20 text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
                                >
                                  <FileText size={11} /> Voir docs
                                </button>
                              )}
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {filtered.length === 0 && !loading && kycFilter !== 'all' && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-navy-panel/40 border border-gray-200 dark:border-text-secondary/15 text-sm text-gray-500 dark:text-text-secondary">
              <AlertCircle size={16} />
              Aucun marchand avec le statut « {FILTER_OPTIONS.find((o) => o.value === kycFilter)?.label} ».
            </div>
          )}
        </>
      )}
    </div>
  );
}
