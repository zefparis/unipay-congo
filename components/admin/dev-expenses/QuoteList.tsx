'use client';

import { useState, useRef } from 'react';
import { Plus, Loader2, Check, X, ArrowRight, Upload } from 'lucide-react';
import clsx from 'clsx';
import { formatDate, formatMoney } from '@/lib/dev-expenses/formatters';
import { QUOTE_STATUS_CONFIG } from '@/lib/dev-expenses/labels';
import { listQuotes, listCreditors } from '@/lib/dev-expenses/api';
import type { Quote, Creditor } from '@/lib/dev-expenses/types';

interface Props {
  locale: string;
  onMsg: (type: 'ok' | 'err', text: string) => void;
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

export default function QuoteList({ locale, onMsg }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    creditor_id: '', project_ref: '', category: '',
    amount_usd: '', description: '', valid_until: '',
  });

  // Load on mount
  if (loading && quotes.length === 0) {
    Promise.all([listQuotes(), listCreditors()])
      .then(([qRes, cRes]) => {
        setQuotes(qRes.data ?? []);
        setCreditors(cRes.data ?? []);
      })
      .catch(() => onMsg('err', 'Erreur chargement devis'))
      .finally(() => setLoading(false));
  }

  const activeCreditors = creditors.filter((c) => c.active);
  const todayStr = new Date().toISOString().slice(0, 10);
  const displayStatus = (q: Quote): Quote['status'] => {
    if (q.status === 'sent' && q.valid_until && q.valid_until < todayStr) return 'expired';
    return q.status;
  };

  const filtered = filterStatus ? quotes.filter((q) => displayStatus(q) === filterStatus) : quotes;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    if (form.creditor_id) fd.append('creditor_id', form.creditor_id);
    fd.append('project_ref', form.project_ref);
    fd.append('amount_usd', form.amount_usd);
    if (form.category) fd.append('category', form.category);
    if (form.description) fd.append('description', form.description);
    if (form.valid_until) fd.append('valid_until', form.valid_until);
    if (file) fd.append('quote_file', file);

    try {
      const r = await fetch('/api/admin/quotes', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erreur');
      onMsg('ok', 'Devis créé');
      setShowForm(false);
      setForm({ creditor_id: '', project_ref: '', category: '', amount_usd: '', description: '', valid_until: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      // Reload
      const res = await listQuotes();
      setQuotes(res.data ?? []);
    } catch (err: any) {
      onMsg('err', err.message);
    }
    setSubmitting(false);
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600">
            <option value="">Tous statuts</option>
            <option value="draft">Brouillon</option>
            <option value="sent">Envoyé</option>
            <option value="accepted">Accepté</option>
            <option value="rejected">Refusé</option>
            <option value="expired">Expiré</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} devis</span>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          <Plus className="w-4 h-4" /> Nouveau devis
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">Nouveau devis</h3>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div>
            <label className={labelCls}>Fournisseur</label>
            <select value={form.creditor_id} onChange={set('creditor_id')} className={inputCls}>
              <option value="">— Sélectionner —</option>
              {activeCreditors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Projet / Référence *</label>
              <input value={form.project_ref} onChange={set('project_ref')} required className={inputCls} placeholder="ex: UniPay Congo" />
            </div>
            <div>
              <label className={labelCls}>Catégorie</label>
              <input value={form.category} onChange={set('category')} className={inputCls} placeholder="ex: Développement" />
            </div>
            <div>
              <label className={labelCls}>Montant USD *</label>
              <input type="number" step="0.01" min="0" value={form.amount_usd} onChange={set('amount_usd')} required className={inputCls} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Valide jusqu&apos;au</label>
              <input type="date" value={form.valid_until} onChange={set('valid_until')} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className={inputCls + ' resize-none'} placeholder="Détails…" />
          </div>
          <div>
            <label className={labelCls}>Devis PDF (optionnel)</label>
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{file ? file.name : 'Choisir un fichier…'}</span>
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Créer le devis
          </button>
        </form>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.map((q) => {
          const st = displayStatus(q);
          const cfg = QUOTE_STATUS_CONFIG[st] ?? QUOTE_STATUS_CONFIG.draft;
          const cname = q.creditors?.name ?? q.creditor_name ?? '—';
          return (
            <div key={q.id} className="px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{q.project_ref}</span>
                    <span className={clsx('text-xs px-1.5 py-0.5 rounded border font-medium', cfg.cls)}>{cfg.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {cname} · {q.category ?? '—'}
                    {q.valid_until && <span> · valide jusqu&apos;au {formatDate(q.valid_until, locale)}</span>}
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {formatMoney(q.amount_usd, 'USD', locale)}
                </span>
              </div>
              {st === 'accepted' && q.converted_expense_id && (
                <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> Devis accepté → engagement créé → en attente de facture finale
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Aucun devis</div>
        )}
      </div>
    </div>
  );
}
