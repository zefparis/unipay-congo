'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
interface KycSub {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  doc_type: string;
  full_name: string;
  birth_date: string | null;
  doc_number: string | null;
  doc_front_url: string | null;
  doc_back_url:  string | null;
  selfie_url:    string | null;
  reviewer_note: string | null;
  submitted_at: string;
  reviewed_at:  string | null;
  wallet_users: { phone: string; full_name: string | null; balance_cdf: number } | null;
}

const STATUS_FILTERS = ['pending', 'approved', 'rejected'] as const;

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function DocBadge({ type }: { type: string }) {
  const labels: Record<string, string> = { national_id: 'CNI', passport: 'Passeport', driving_license: 'Permis' };
  return <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">{labels[type] ?? type}</span>;
}

// ── Reject modal ───────────────────────────────────────────────────────
function RejectModal({ id, onDone, onClose }: { id: string; onDone: () => void; onClose: () => void }) {
  const [note, setNote]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  async function submit() {
    if (!note.trim()) { setErr('Le motif est obligatoire'); return; }
    setSaving(true); setErr('');
    const r = await fetch(`/api/wallet/kyc/${id}/reject`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer_note: note.trim() }),
    });
    const d = await r.json();
    setSaving(false);
    if (r.ok) onDone(); else setErr(d.error ?? 'Erreur');
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <XCircle size={18} className="text-red-500" />
          <p className="font-bold text-gray-900 dark:text-white">Motif de rejet</p>
        </div>
        {err && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{err}</p>}
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="Expliquez pourquoi le dossier est rejeté…"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-gray-900 dark:text-white outline-none resize-none focus:border-red-400 transition" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-gray-600 dark:text-slate-400">Annuler</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Rejeter
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Submission card ────────────────────────────────────────────────────
function SubCard({ sub, onApprove, onReject }: {
  sub: KycSub;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
}) {
  const [approving, setApproving] = useState(false);

  async function approve() {
    setApproving(true);
    const r = await fetch(`/api/wallet/kyc/${sub.id}/approve`, { method: 'POST' });
    setApproving(false);
    if (r.ok) onApprove(sub.id);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{sub.full_name}</p>
            <DocBadge type={sub.doc_type} />
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">{sub.wallet_users?.phone ?? '—'} · Soumis {fmt(sub.submitted_at)}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          sub.status === 'pending'  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
          sub.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
          {sub.status === 'pending' ? 'En attente' : sub.status === 'approved' ? 'Approuvé' : 'Rejeté'}
        </span>
      </div>

      {/* Document thumbnails */}
      <div className="flex gap-2 px-5 py-3 bg-gray-50 dark:bg-slate-700/30">
        {[
          { url: sub.doc_front_url, label: 'Recto' },
          { url: sub.doc_back_url,  label: 'Verso' },
          { url: sub.selfie_url,    label: 'Selfie' },
        ].filter(d => d.url).map(({ url, label }) => (
          <a key={label} href={`https://[YOUR_SUPABASE_URL]/storage/v1/object/kyc-docs/${url}`}
            target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 group">
            <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-gray-400 dark:text-slate-500 group-hover:ring-2 ring-[#1D9E75] transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <span className="text-xs text-gray-500 dark:text-slate-500">{label}</span>
          </a>
        ))}
        {sub.doc_number && (
          <div className="flex flex-col justify-center ml-auto">
            <p className="text-xs text-gray-400 dark:text-slate-500">N° document</p>
            <p className="text-sm font-mono font-semibold text-gray-700 dark:text-slate-300">{sub.doc_number}</p>
          </div>
        )}
      </div>

      {/* Reviewer note */}
      {sub.reviewer_note && (
        <div className="px-5 py-3 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-800/30">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5">Motif de rejet</p>
          <p className="text-xs text-red-700 dark:text-red-300">{sub.reviewer_note}</p>
        </div>
      )}

      {/* Actions */}
      {sub.status === 'pending' && (
        <div className="flex gap-3 px-5 py-4 border-t border-gray-50 dark:border-slate-700">
          <button onClick={() => onReject(sub.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition">
            <XCircle size={15} /> Rejeter
          </button>
          <button onClick={approve} disabled={approving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#178a65] disabled:opacity-60 transition">
            {approving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Approuver
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────
export default function WalletKycAdminPage() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [subs, setSubs]       = useState<KycSub[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const load = useCallback(async (filter = statusFilter) => {
    setLoading(true);
    const r = await fetch(`/api/wallet/kyc?status=${filter}`);
    const d = await r.json();
    setSubs(d.data ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  function onApproved(id: string) {
    setSubs(s => s.filter(x => x.id !== id));
    setTotal(t => t - 1);
  }
  function onRejected() {
    setRejectId(null);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {rejectId && (
        <RejectModal id={rejectId} onDone={onRejected} onClose={() => setRejectId(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#1D9E75]/10">
            <ShieldCheck size={20} className="text-[#1D9E75]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">KYC Wallet</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{total} dossier(s)</p>
          </div>
        </div>
        <button onClick={() => load()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 transition">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => { setStatusFilter(f); load(f); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition
              ${statusFilter === f
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}>
            {f === 'pending' ? <span className="flex items-center justify-center gap-1.5"><Clock size={13} /> En attente</span>
              : f === 'approved' ? <span className="flex items-center justify-center gap-1.5"><CheckCircle2 size={13} /> Approuvés</span>
              : <span className="flex items-center justify-center gap-1.5"><XCircle size={13} /> Rejetés</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#1D9E75]" />
        </div>
      ) : subs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400 dark:text-slate-500">
          <ShieldCheck size={32} />
          <p className="text-sm font-medium">Aucun dossier {statusFilter === 'pending' ? 'en attente' : statusFilter === 'approved' ? 'approuvé' : 'rejeté'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map(sub => (
            <SubCard key={sub.id} sub={sub}
              onApprove={onApproved}
              onReject={(id) => setRejectId(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
