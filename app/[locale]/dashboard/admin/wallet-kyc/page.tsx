'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, Loader2, RefreshCw, ShieldCheck, X, XCircle } from 'lucide-react';
import clsx from 'clsx';

type KycStatus = 'pending' | 'approved' | 'rejected' | 'failed';

interface WalletUserRef {
  id: string;
  phone: string;
  full_name: string | null;
  balance_cdf: number;
  kyc_level: number;
  is_verified: boolean;
}

interface KycSubmission {
  id: string;
  wallet_user_id: string;
  status: KycStatus;
  doc_type: string;
  full_name: string;
  birth_date: string | null;
  doc_number: string | null;
  selfie_url: string | null;
  selfie_signed_url: string | null;
  reviewer_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  payguard_confidence: number | null;
  payguard_decision: string | null;
  submission_type: string | null;
  wallet_users: WalletUserRef | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUS_LABELS: Record<KycStatus, string> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  failed: 'failed',
};

const DOC_LABELS: Record<string, string> = {
  national_id: 'CNI',
  passport: 'Passeport',
  driving_license: 'Permis',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtConfidence(value: number | null) {
  return value === null || value === undefined ? '—' : `${Math.round(value)}%`;
}

function StatusBadge({ status }: { status: KycStatus }) {
  return (
    <span className={clsx(
      'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
      status === 'pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      status === 'approved' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      status === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      status === 'failed' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    )}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={clsx(
      'fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
      type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-300'
        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-300',
    )}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  );
}

function DetailModal({ submission, onClose, onApprove, onReject }: {
  submission: KycSubmission;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState('');

  async function approve() {
    console.log('[wallet-kyc] approve click modal', { id: submission.id, submission });
    setBusy('approve');
    setError('');
    try {
      await onApprove(submission.id);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    console.log('[wallet-kyc] reject confirm modal', { id: submission.id, note });
    if (!note.trim()) {
      setError('Le motif est obligatoire');
      return;
    }
    setBusy('reject');
    setError('');
    try {
      await onReject(submission.id, note.trim());
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-white">Détail soumission KYC</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Soumis le {fmtDate(submission.submitted_at)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Infos user</h3>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Téléphone" value={submission.wallet_users?.phone ?? '—'} mono />
                <Info label="Nom complet" value={submission.full_name} />
                <Info label="Date naissance" value={submission.birth_date ?? '—'} />
                <Info label="Type document" value={DOC_LABELS[submission.doc_type] ?? submission.doc_type} />
                <Info label="Numéro document" value={submission.doc_number ?? '—'} mono />
                <Info label="Statut" value={submission.status} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">PayGuard</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="rounded-2xl bg-signal/10 px-6 py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-signal-dark">Score</p>
                  <p className="text-4xl font-heading font-bold text-gray-900 dark:text-white">{fmtConfidence(submission.payguard_confidence)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Décision PayGuard</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{submission.payguard_decision ?? '—'}</p>
                </div>
              </div>
            </div>

            {submission.reviewer_note && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Motif de rejet</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{submission.reviewer_note}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
              {submission.selfie_signed_url ? (
                <img src={submission.selfie_signed_url} alt="Selfie KYC" className="h-80 w-full object-cover" />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-gray-400">Selfie indisponible</div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={approve}
                disabled={busy !== null || submission.status === 'approved'}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-white transition hover:bg-signal/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'approve' ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Approuver
              </button>
              <button
                onClick={() => setRejectOpen(true)}
                disabled={busy !== null || submission.status === 'rejected'}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <XCircle size={15} />
                Rejeter
              </button>
            </div>

            {rejectOpen && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Motif du rejet</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-400 dark:border-red-800/50 dark:bg-gray-900 dark:text-white"
                  placeholder="Expliquez la raison du rejet…"
                />
                <button
                  onClick={reject}
                  disabled={busy !== null || !note.trim()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === 'reject' ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                  Confirmer le rejet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={clsx('mt-1 text-sm font-medium text-gray-900 dark:text-white', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  console.log('[wallet-kyc] request', { method: options?.method ?? 'GET', path });
  const res = await fetch(path, { ...options, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  console.log('[wallet-kyc] response', { method: options?.method ?? 'GET', path, status: res.status, data });
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export default function WalletKycPage() {
  const [rows, setRows] = useState<KycSubmission[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<KycStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<KycSubmission | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '50' });
      if (status) qs.set('status', status);
      const path = `/api/admin/wallet/kyc?${qs}`;
      console.log('[wallet-kyc] mount/list fetch', { path, page, status });
      const data = await requestJson<{ data: KycSubmission[]; pagination: Pagination }>(path);
      console.log('[wallet-kyc] fetched submissions', { count: data.data.length, pagination: data.pagination });
      setRows(data.data);
      setPagination(data.pagination);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { void load(); }, [load]);

  async function approve(id: string) {
    console.log('[wallet-kyc] approve click', { id });
    if (!id) throw new Error('KYC submission id is missing');
    const path = `/api/admin/wallet/kyc/${id}/approve`;
    await requestJson<{ ok: boolean }>(path, { method: 'POST' });
    setRows((prev) => prev.map((row) => row.id === id ? { ...row, status: 'approved', reviewer_note: null } : row));
    setSelected((prev) => prev?.id === id ? { ...prev, status: 'approved', reviewer_note: null } : prev);
    setToast({ msg: 'Soumission KYC approuvée', type: 'success' });
  }

  async function reject(id: string, note: string) {
    console.log('[wallet-kyc] reject submit', { id, note });
    if (!id) throw new Error('KYC submission id is missing');
    const path = `/api/admin/wallet/kyc/${id}/reject`;
    await requestJson<{ ok: boolean }>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    setRows((prev) => prev.map((row) => row.id === id ? { ...row, status: 'rejected', reviewer_note: note } : row));
    setSelected((prev) => prev?.id === id ? { ...prev, status: 'rejected', reviewer_note: note } : prev);
    setToast({ msg: 'Soumission KYC rejetée', type: 'success' });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {selected && <DetailModal submission={selected} onClose={() => setSelected(null)} onApprove={approve} onReject={reject} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-heading font-bold text-gray-900 dark:text-white">
            <ShieldCheck className="text-signal" size={22} />
            KYC Wallet
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Validation des soumissions wallet et résultats PayGuard.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as KycStatus | ''); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-signal/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="failed">failed</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-signal" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-600">Aucune soumission KYC.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Téléphone user', 'Nom complet', 'Type', 'Date soumission', 'Statut', 'Score PayGuard', 'Décision PayGuard', 'Actions'].map((col) => (
                    <th key={col} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">{row.wallet_users?.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.full_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{row.submission_type === 'cognitive_upgrade' ? 'Upgrade' : 'Initial'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">{fmtDate(row.submitted_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{fmtConfidence(row.payguard_confidence)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.payguard_decision ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(row)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                          <Eye size={12} /> Voir
                        </button>
                        <button onClick={() => { console.log('[wallet-kyc] approve row button', { id: row.id, row }); void approve(row.id); }} disabled={row.status === 'approved'} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40 dark:border-emerald-800/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                          <CheckCircle2 size={12} /> Approuver
                        </button>
                        <button onClick={() => { console.log('[wallet-kyc] reject row button', { id: row.id, row }); setSelected(row); }} disabled={row.status === 'rejected'} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20">
                          <XCircle size={12} /> Rejeter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{pagination.total} soumissions — page {pagination.page}/{pagination.pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700">Précédent</button>
            <button disabled={page >= pagination.pages || loading} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 dark:border-gray-700">Suivant</button>
          </div>
        </div>
      )}
    </div>
  );
}
