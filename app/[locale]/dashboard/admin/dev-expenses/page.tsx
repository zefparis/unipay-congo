'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Receipt, RefreshCw, Loader2, Check, Upload, FileText,
  Copy, CheckCircle2, Clock, AlertCircle, Plus, Pencil,
  Trash2, Building2, User, Cloud, Users,
  CalendarClock, X,
} from 'lucide-react';
import clsx from 'clsx';

/* ── Types ─────────────────────────────────────────────────── */
interface Creditor {
  id: string;
  name: string;
  entity_type: 'cloud_provider' | 'freelance' | 'company' | 'individual' | 'other';
  contact_email?: string | null;
  payment_method?: string | null;
  payment_details?: Record<string, unknown> | null;
  default_category?: string | null;
  notes?: string | null;
  active: boolean;
}

interface DevExpense {
  id: string;
  creditor_id: string | null;
  creditor_name: string | null;
  category: string;
  project_ref: string | null;
  billing_month: string;
  due_date: string | null;
  invoice_number: string | null;
  amount_usd: number;
  source: string;
  invoice_url: string | null;
  status: 'pending' | 'paid' | 'reconciled';
  paid_at: string | null;
  payment_ref: string | null;
  notes: string | null;
  is_overdue: boolean;
  funded_by: string;
  paid_by: string;
}

interface MonthHistory {
  billing_month: string;
  invoice_count: number;
  creditor_count: number;
  total_usd: number;
  global_status: 'pending' | 'ready';
  share_token: string | null;
  share_url: string | null;
  generated_at: string | null;
}

type Tab = 'upcoming' | 'entry' | 'creditors' | 'reports';

/* ── Helpers ────────────────────────────────────────────────── */
function fmtDate(s: string | null): string {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00Z');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function fmtMonth(s: string): string {
  const d = new Date(s + 'T00:00:00Z');
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function daysUntil(due: string | null): number | null {
  if (!due) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d     = new Date(due + 'T00:00:00Z');
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function urgencyBadge(exp: DevExpense): { label: string; cls: string } | null {
  if (exp.status === 'paid') return null;
  if (exp.is_overdue)        return { label: 'En retard', cls: 'bg-red-100 text-red-700 border-red-200' };
  const days = daysUntil(exp.due_date);
  if (days === null)         return null;
  if (days <= 3)             return { label: `J+${days}`, cls: 'bg-orange-100 text-orange-700 border-orange-200' };
  if (days <= 7)             return { label: `J+${days}`, cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  return null;
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  cloud_provider: <Cloud     className="w-3.5 h-3.5" />,
  freelance:      <User      className="w-3.5 h-3.5" />,
  company:        <Building2 className="w-3.5 h-3.5" />,
  individual:     <User      className="w-3.5 h-3.5" />,
  other:          <Users     className="w-3.5 h-3.5" />,
};

/* ── Main Component ─────────────────────────────────────────── */
export default function DevExpensesPage() {
  const [tab, setTab]             = useState<Tab>('upcoming');
  const [upcoming, setUpcoming]   = useState<DevExpense[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [history, setHistory]     = useState<MonthHistory[]>([]);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  /* mark-paid modal */
  const [payTarget, setPayTarget] = useState<DevExpense | null>(null);
  const [payRef, setPayRef]       = useState('');
  const [paying, setPaying]       = useState(false);

  /* copy share link */
  const [copied, setCopied]       = useState<string | null>(null);

  const flashMsg = useCallback((type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  /* ── Data fetching ────────────────────────────────────────── */
  const loadUpcoming = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/dev-expenses/upcoming');
      const d = await r.json();
      setUpcoming(d.data ?? []);
    } catch { flashMsg('err', 'Erreur chargement échéances'); }
    setLoading(false);
  }, [flashMsg]);

  const loadCreditors = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/creditors');
      const d = await r.json();
      setCreditors(d.data ?? []);
    } catch { flashMsg('err', 'Erreur chargement créanciers'); }
  }, [flashMsg]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/dev-expenses/history?limit=24');
      const d = await r.json();
      setHistory(d.data ?? []);
    } catch { flashMsg('err', 'Erreur chargement historique'); }
    setLoading(false);
  }, [flashMsg]);

  useEffect(() => {
    loadCreditors();
    loadUpcoming();
  }, [loadCreditors, loadUpcoming]);

  useEffect(() => {
    if (tab === 'reports') loadHistory();
  }, [tab, loadHistory]);

  /* ── Mark paid ────────────────────────────────────────────── */
  async function markPaid() {
    if (!payTarget) return;
    setPaying(true);
    try {
      const r = await fetch(`/api/admin/dev-expenses/${payTarget.id}/mark-paid`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_ref: payRef || undefined }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      flashMsg('ok', `${payTarget.creditor_name ?? payTarget.category} marqué payé`);
      setPayTarget(null); setPayRef('');
      loadUpcoming();
    } catch (e: any) {
      flashMsg('err', e.message ?? 'Erreur mark-paid');
    }
    setPaying(false);
  }

  /* ── Copy share URL ───────────────────────────────────────── */
  async function copyShare(url: string, token: string) {
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  /* ── Tabs ─────────────────────────────────────────────────── */
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'upcoming',  label: 'À payer',    icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'entry',     label: 'Saisie',     icon: <Plus          className="w-4 h-4" /> },
    { id: 'creditors', label: 'Créanciers', icon: <Building2     className="w-4 h-4" /> },
    { id: 'reports',   label: 'Rapports',   icon: <FileText      className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dev Expenses</h1>
        </div>
        <button
          onClick={() => { loadUpcoming(); loadCreditors(); }}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={clsx('rounded-lg border px-4 py-3 text-sm flex items-center gap-2', {
          'bg-emerald-50 border-emerald-200 text-emerald-700': msg.type === 'ok',
          'bg-red-50 border-red-200 text-red-700':             msg.type === 'err',
        })}>
          {msg.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400',
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: À payer ──────────────────────────────────────── */}
      {tab === 'upcoming' && (
        <UpcomingTab
          upcoming={upcoming}
          loading={loading}
          onMarkPaid={(e) => { setPayTarget(e); setPayRef(''); }}
        />
      )}

      {/* ── TAB: Saisie ───────────────────────────────────────── */}
      {tab === 'entry' && (
        <EntryTab
          creditors={creditors}
          onSuccess={() => { flashMsg('ok', 'Facture enregistrée'); loadUpcoming(); loadCreditors(); }}
          onError={(e) => flashMsg('err', e)}
        />
      )}

      {/* ── TAB: Créanciers ───────────────────────────────────── */}
      {tab === 'creditors' && (
        <CreditorsTab
          creditors={creditors}
          onRefresh={loadCreditors}
          onMsg={flashMsg}
        />
      )}

      {/* ── TAB: Rapports ─────────────────────────────────────── */}
      {tab === 'reports' && (
        <ReportsTab
          history={history}
          loading={loading}
          copied={copied}
          onCopy={copyShare}
          onRefresh={loadHistory}
          onMsg={flashMsg}
        />
      )}

      {/* Mark-paid modal */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Marquer comme payé</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {payTarget.creditor_name ?? payTarget.category}
              {payTarget.project_ref && <span className="ml-1 text-gray-400">— {payTarget.project_ref}</span>}
              &ensp;
              <span className="font-mono font-bold">${Number(payTarget.amount_usd).toFixed(2)}</span>
            </p>
            <input
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
              placeholder="Référence de paiement (optionnel)"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPayTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={markPaid}
                disabled={paying}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
 ═══════════════════════════════════════════════════════════ */

/* ── UpcomingTab ─────────────────────────────────────────────── */
function UpcomingTab({
  upcoming, loading, onMarkPaid,
}: {
  upcoming: DevExpense[];
  loading: boolean;
  onMarkPaid: (e: DevExpense) => void;
}) {
  const overdue = upcoming.filter(e => e.is_overdue);
  const soon    = upcoming.filter(e => !e.is_overdue);

  if (loading) return <Spinner />;
  if (upcoming.length === 0) return (
    <div className="text-center py-16 text-gray-400 text-sm">
      <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-30" />
      Aucune facture à régler dans les 7 prochains jours.
    </div>
  );

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <Section title={`En retard (${overdue.length})`} color="red">
          {overdue.map(e => <ExpenseRow key={e.id} expense={e} onMarkPaid={onMarkPaid} />)}
        </Section>
      )}
      {soon.length > 0 && (
        <Section title={`À payer bientôt (${soon.length})`} color="amber">
          {soon.map(e => <ExpenseRow key={e.id} expense={e} onMarkPaid={onMarkPaid} />)}
        </Section>
      )}
    </div>
  );
}

function Section({
  title, color, children,
}: {
  title: string; color: 'red' | 'amber'; children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className={clsx('text-xs font-semibold uppercase tracking-wide mb-2',
        color === 'red' ? 'text-red-600' : 'text-amber-600')}>{title}</h3>
      <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ExpenseRow({
  expense: e, onMarkPaid,
}: {
  expense: DevExpense; onMarkPaid: (e: DevExpense) => void;
}) {
  const badge = urgencyBadge(e);
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {e.creditor_name ?? e.category}
          </span>
          {e.project_ref && (
            <span className="text-xs text-gray-500 truncate">{e.project_ref}</span>
          )}
          {badge && (
            <span className={clsx('text-xs px-1.5 py-0.5 rounded border font-medium', badge.cls)}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
          <span>{e.category}</span>
          {e.due_date && <span>· échéance {fmtDate(e.due_date)}</span>}
          {e.invoice_number && <span>· {e.invoice_number}</span>}
        </div>
      </div>
      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
        ${Number(e.amount_usd).toFixed(2)}
      </span>
      {e.status !== 'paid' && (
        <button
          onClick={() => onMarkPaid(e)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium transition-colors"
        >
          Réglé
        </button>
      )}
      {e.status === 'paid' && (
        <span className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Payé
        </span>
      )}
    </div>
  );
}

/* ── EntryTab ────────────────────────────────────────────────── */
function EntryTab({
  creditors, onSuccess, onError,
}: {
  creditors: Creditor[];
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    creditor_id: '', creditor_name: '', category: '',
    billing_month: '', due_date: '', amount_usd: '',
    project_ref: '', invoice_number: '', notes: '',
  });
  const [file, setFile]       = useState<File | null>(null);
  const [submitting, setSub]  = useState(false);
  const [showNew, setShowNew] = useState(false);

  const activeCreditors = creditors.filter(c => c.active);

  function onCreditorChange(id: string) {
    const found = creditors.find(c => c.id === id);
    setForm(f => ({
      ...f,
      creditor_id: id,
      creditor_name: '',
      category: f.category || found?.default_category || '',
    }));
    setShowNew(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSub(true);
    const fd = new FormData();
    if (form.creditor_id) fd.append('creditor_id', form.creditor_id);
    if (form.creditor_name && !form.creditor_id) fd.append('creditor_name', form.creditor_name);
    fd.append('category',       form.category);
    fd.append('billing_month',  form.billing_month);
    fd.append('amount_usd',     form.amount_usd);
    if (form.due_date)       fd.append('due_date',       form.due_date);
    if (form.project_ref)    fd.append('project_ref',    form.project_ref);
    if (form.invoice_number) fd.append('invoice_number', form.invoice_number);
    if (form.notes)          fd.append('notes',          form.notes);
    if (file)                fd.append('invoice',        file);

    try {
      const r = await fetch('/api/admin/dev-expenses', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erreur');
      setForm({
        creditor_id: '', creditor_name: '', category: '', billing_month: '',
        due_date: '', amount_usd: '', project_ref: '', invoice_number: '', notes: '',
      });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onSuccess();
    } catch (err: any) {
      onError(err.message);
    }
    setSub(false);
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const suggestions = Array.from(
    new Set(creditors.map(c => c.default_category).filter((s): s is string => Boolean(s)))
  );

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300';
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

  return (
    <form
      onSubmit={submit}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5"
    >
      <h2 className="font-semibold text-gray-900 dark:text-white">Nouvelle facture</h2>

      {/* Creditor selector */}
      <div>
        <label className={labelCls}>Créancier *</label>
        <select
          value={form.creditor_id}
          onChange={e => {
            if (e.target.value === '__new__') {
              setShowNew(true);
              setForm(f => ({ ...f, creditor_id: '', creditor_name: '' }));
            } else {
              onCreditorChange(e.target.value);
            }
          }}
          className={inputCls}
        >
          <option value="">— Sélectionner —</option>
          {activeCreditors.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          <option value="__new__">+ Nouveau créancier</option>
        </select>
        {showNew && (
          <input
            value={form.creditor_name}
            onChange={set('creditor_name')}
            required
            placeholder="Nom du nouveau créancier"
            className={inputCls + ' mt-2'}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Catégorie *</label>
          <input
            value={form.category}
            onChange={set('category')}
            required
            list="cat-suggestions"
            placeholder="ex: Infra Cloud, Développement…"
            className={inputCls}
          />
          <datalist id="cat-suggestions">
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Mois de facturation *</label>
          <input
            type="month"
            value={form.billing_month.slice(0, 7)}
            required
            onChange={e => setForm(f => ({ ...f, billing_month: e.target.value + '-01' }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Montant USD *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount_usd}
            onChange={set('amount_usd')}
            required
            placeholder="0.00"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Date d&apos;échéance</label>
          <input type="date" value={form.due_date} onChange={set('due_date')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Projet / Référence</label>
          <input
            value={form.project_ref}
            onChange={set('project_ref')}
            placeholder="ex: Tekkbridge - Site vitrine"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>N° de facture</label>
          <input
            value={form.invoice_number}
            onChange={set('invoice_number')}
            placeholder="ex: INV-2026-001"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          rows={2}
          className={inputCls + ' resize-none'}
          placeholder="Commentaire libre…"
        />
      </div>

      <div>
        <label className={labelCls}>Pièce jointe (PDF / PNG / JPEG, max 10 Mo)</label>
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">{file ? file.name : 'Choisir un fichier…'}</span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Enregistrer la facture
      </button>
    </form>
  );
}

/* ── CreditorsTab ────────────────────────────────────────────── */
function CreditorsTab({
  creditors, onRefresh, onMsg,
}: {
  creditors: Creditor[];
  onRefresh: () => void;
  onMsg: (type: 'ok' | 'err', text: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Creditor | null>(null);
  const [form, setForm]         = useState({
    name: '', entity_type: 'cloud_provider',
    contact_email: '', payment_method: '', default_category: '', notes: '',
  });
  const [saving, setSaving]     = useState(false);

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300';
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

  function openEdit(c: Creditor) {
    setEditing(c);
    setForm({
      name:             c.name,
      entity_type:      c.entity_type,
      contact_email:    c.contact_email    ?? '',
      payment_method:   c.payment_method   ?? '',
      default_category: c.default_category ?? '',
      notes:            c.notes            ?? '',
    });
    setShowForm(true);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: '', entity_type: 'cloud_provider', contact_email: '', payment_method: '', default_category: '', notes: '' });
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = {
      name:             form.name,
      entity_type:      form.entity_type,
      contact_email:    form.contact_email    || undefined,
      payment_method:   form.payment_method   || undefined,
      default_category: form.default_category || undefined,
      notes:            form.notes            || undefined,
    };
    try {
      const url    = editing ? `/api/admin/creditors/${editing.id}` : '/api/admin/creditors';
      const method = editing ? 'PATCH' : 'POST';
      const r      = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erreur');
      onMsg('ok', editing ? 'Créancier mis à jour' : 'Créancier créé');
      setShowForm(false);
      onRefresh();
    } catch (err: any) {
      onMsg('err', err.message);
    }
    setSaving(false);
  }

  async function softDelete(c: Creditor) {
    if (!confirm(`Désactiver "${c.name}" ? Ses factures restent liées.`)) return;
    try {
      const r = await fetch(`/api/admin/creditors/${c.id}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erreur');
      onMsg('ok', `${c.name} désactivé`);
      onRefresh();
    } catch (err: any) {
      onMsg('err', err.message);
    }
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const active   = creditors.filter(c => c.active);
  const inactive = creditors.filter(c => !c.active);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{active.length} créancier(s) actif(s)</span>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouveau créancier
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={save}
          className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 p-5 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {editing ? `Modifier : ${editing.name}` : 'Nouveau créancier'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nom *</label>
              <input value={form.name} onChange={set('name')} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select value={form.entity_type} onChange={set('entity_type')} className={inputCls}>
                <option value="cloud_provider">Cloud provider</option>
                <option value="freelance">Freelance</option>
                <option value="company">Société</option>
                <option value="individual">Particulier</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Email contact</label>
              <input type="email" value={form.contact_email} onChange={set('contact_email')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mode de paiement</label>
              <select value={form.payment_method} onChange={set('payment_method')} className={inputCls}>
                <option value="">— Aucun —</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="mobile_money">Mobile money</option>
                <option value="crypto">Crypto</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Catégorie par défaut</label>
              <input value={form.default_category} onChange={set('default_category')} placeholder="ex: Infra Cloud" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <input value={form.notes} onChange={set('notes')} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {active.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900">
            <span className="text-gray-400">{ENTITY_ICONS[c.entity_type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
              <p className="text-xs text-gray-500 flex gap-2 flex-wrap">
                {c.default_category && <span>{c.default_category}</span>}
                {c.payment_method   && <span>· {c.payment_method.replace('_', ' ')}</span>}
                {c.contact_email    && <span>· {c.contact_email}</span>}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => softDelete(c)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {active.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Aucun créancier actif</div>
        )}
      </div>

      {inactive.length > 0 && (
        <p className="text-xs text-gray-400">{inactive.length} créancier(s) désactivé(s)</p>
      )}
    </div>
  );
}

/* ── ReportsTab ──────────────────────────────────────────────── */
function ReportsTab({
  history, loading, copied, onCopy, onRefresh, onMsg,
}: {
  history: MonthHistory[];
  loading: boolean;
  copied: string | null;
  onCopy: (url: string, token: string) => void;
  onRefresh: () => void;
  onMsg: (type: 'ok' | 'err', text: string) => void;
}) {
  const [genMonth, setGenMonth] = useState('');
  const [genLoading, setGenL]   = useState(false);
  const [lastReport, setLast]   = useState<{
    share_url: string; total_usd: number; pending_warnings?: unknown[];
  } | null>(null);

  async function generate() {
    if (!genMonth) return;
    setGenL(true);
    try {
      const r = await fetch('/api/admin/dev-expenses/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: genMonth + '-01' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erreur génération');
      setLast({ share_url: d.share_url, total_usd: d.total_usd, pending_warnings: d.pending_warnings });
      onMsg('ok', 'Rapport généré');
      onRefresh();
    } catch (err: any) {
      onMsg('err', err.message);
    }
    setGenL(false);
  }

  const inputCls = 'px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      {/* Generate */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Générer un rapport</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mois</label>
            <input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)} className={inputCls} />
          </div>
          <button
            onClick={generate}
            disabled={!genMonth || genLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Générer PDF + lien
          </button>
        </div>
        {lastReport && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 p-3 space-y-2">
            <p className="text-sm text-emerald-700 font-medium">
              Rapport généré — Total : <span className="font-mono">${Number(lastReport.total_usd).toFixed(2)}</span>
            </p>
            {lastReport.pending_warnings && lastReport.pending_warnings.length > 0 && (
              <p className="text-xs text-amber-600">
                ⚠ {lastReport.pending_warnings.length} facture(s) encore en statut &quot;pending&quot; incluse(s)
              </p>
            )}
            <button
              onClick={() => onCopy(lastReport.share_url, lastReport.share_url)}
              className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied === lastReport.share_url ? 'Copié !' : lastReport.share_url}
            </button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm">Historique</h3>
          <button onClick={onRefresh} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Actualiser
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {history.map(m => (
            <div key={m.billing_month} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{fmtMonth(m.billing_month)}</p>
                <p className="text-xs text-gray-500">
                  {m.invoice_count} facture(s) · {m.creditor_count} créancier(s)
                  {m.generated_at ? ` · rapport ${new Date(m.generated_at).toLocaleDateString('fr-FR')}` : ''}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold">${Number(m.total_usd).toFixed(2)}</span>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full border',
                m.global_status === 'ready'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200')}>
                {m.global_status === 'ready' ? 'Complet' : 'En cours'}
              </span>
              {m.share_url && m.share_token && (
                <button
                  onClick={() => onCopy(m.share_url!, m.share_token!)}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700"
                  title="Copier le lien public"
                >
                  {copied === m.share_token ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
          {history.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Aucun historique disponible</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
    </div>
  );
}

