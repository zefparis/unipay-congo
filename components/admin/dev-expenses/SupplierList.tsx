'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, X, Loader2, Building2, User, Cloud, Users } from 'lucide-react';
import clsx from 'clsx';
import { listCreditors, createCreditor, updateCreditor } from '@/lib/dev-expenses/api';
import { CREDITOR_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/dev-expenses/labels';
import type { Creditor } from '@/lib/dev-expenses/types';
import EntityList from './EntityList';

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  cloud_provider: <Cloud className="w-3.5 h-3.5" />,
  freelance: <User className="w-3.5 h-3.5" />,
  company: <Building2 className="w-3.5 h-3.5" />,
  individual: <User className="w-3.5 h-3.5" />,
  other: <Users className="w-3.5 h-3.5" />,
};

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

type SubTab = 'suppliers' | 'entities';

export default function SupplierList() {
  const [subTab, setSubTab] = useState<SubTab>('suppliers');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setSubTab('suppliers')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            subTab === 'suppliers'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400',
          )}
        >
          Fournisseurs
        </button>
        <button
          onClick={() => setSubTab('entities')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            subTab === 'entities'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400',
          )}
        >
          Entités financières
        </button>
      </div>

      {subTab === 'suppliers' && <SuppliersTab />}
      {subTab === 'entities' && <EntityList />}
    </div>
  );
}

function SuppliersTab() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Creditor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', entity_type: 'cloud_provider',
    contact_email: '', payment_method: '', default_category: '', notes: '',
  });

  useEffect(() => {
    listCreditors()
      .then((res) => setCreditors(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openEdit(c: Creditor) {
    setEditing(c);
    setForm({
      name: c.name,
      entity_type: c.entity_type,
      contact_email: c.contact_email ?? '',
      payment_method: c.payment_method ?? '',
      default_category: c.default_category ?? '',
      notes: c.notes ?? '',
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
      name: form.name,
      entity_type: form.entity_type,
      contact_email: form.contact_email || undefined,
      payment_method: form.payment_method || undefined,
      default_category: form.default_category || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editing) {
        await updateCreditor(editing.id, body);
      } else {
        await createCreditor(body);
      }
      setShowForm(false);
      const res = await listCreditors();
      setCreditors(res.data ?? []);
    } catch {
      // Error handled by API layer
    }
    setSaving(false);
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const active = creditors.filter((c) => c.active);
  const inactive = creditors.filter((c) => !c.active);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{active.length} fournisseur(s) actif(s)</span>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          <Plus className="w-4 h-4" /> Nouveau fournisseur
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {editing ? `Modifier : ${editing.name}` : 'Nouveau fournisseur'}
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
                {Object.entries(CREDITOR_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
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
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Catégorie par défaut</label>
              <input value={form.default_category} onChange={set('default_category')} className={inputCls} placeholder="ex: Infra Cloud" />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <input value={form.notes} onChange={set('notes')} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {active.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900">
            <span className="text-gray-400">{ENTITY_ICONS[c.entity_type] ?? <Users className="w-3.5 h-3.5" />}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
              <p className="text-xs text-gray-500 flex gap-2 flex-wrap">
                {c.default_category && <span>{c.default_category}</span>}
                {c.payment_method && <span>· {PAYMENT_METHOD_LABELS[c.payment_method] ?? c.payment_method}</span>}
                {c.contact_email && <span>· {c.contact_email}</span>}
              </p>
            </div>
            <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {active.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Aucun fournisseur actif</div>
        )}
      </div>

      {inactive.length > 0 && (
        <p className="text-xs text-gray-400">{inactive.length} fournisseur(s) désactivé(s)</p>
      )}
    </div>
  );
}
