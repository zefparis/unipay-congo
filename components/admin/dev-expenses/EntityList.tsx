'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, X, Loader2, Check } from 'lucide-react';
import { listEntities, createEntity, updateEntity } from '@/lib/dev-expenses/api';
import { ENTITY_TYPE_LABELS } from '@/lib/dev-expenses/labels';
import type { ExpenseEntity } from '@/lib/dev-expenses/types';

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

export default function EntityList() {
  const [entities, setEntities] = useState<ExpenseEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExpenseEntity | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', display_name: '', entity_type: 'company',
    legal_name: '', country_code: '', active: true,
  });

  useEffect(() => {
    listEntities()
      .then((res) => setEntities(res.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openEdit(e: ExpenseEntity) {
    setEditing(e);
    setForm({
      code: e.code,
      display_name: e.display_name,
      entity_type: e.entity_type,
      legal_name: e.legal_name ?? '',
      country_code: e.country_code ?? '',
      active: e.active,
    });
    setShowForm(true);
  }

  function openNew() {
    setEditing(null);
    setForm({ code: '', display_name: '', entity_type: 'company', legal_name: '', country_code: '', active: true });
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateEntity(editing.id, {
          display_name: form.display_name,
          legal_name: form.legal_name || undefined,
          country_code: form.country_code || undefined,
          active: form.active,
        });
      } else {
        await createEntity({
          code: form.code,
          display_name: form.display_name,
          entity_type: form.entity_type,
          legal_name: form.legal_name || undefined,
          country_code: form.country_code || undefined,
          active: form.active,
        });
      }
      setShowForm(false);
      const res = await listEntities();
      setEntities(res.items ?? []);
    } catch {
      // Error handled by API layer
    }
    setSaving(false);
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((f) => ({ ...f, [k]: value }));
    };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{entities.length} entité(s)</span>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          <Plus className="w-4 h-4" /> Nouvelle entité
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {editing ? `Modifier : ${editing.display_name}` : 'Nouvelle entité'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Code *</label>
              <input value={form.code} onChange={set('code')} required disabled={!!editing} className={inputCls + ' disabled:opacity-50'} placeholder="ex: UNIPAY" />
            </div>
            <div>
              <label className={labelCls}>Nom affiché *</label>
              <input value={form.display_name} onChange={set('display_name')} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.entity_type} onChange={set('entity_type')} className={inputCls} disabled={!!editing}>
                {Object.entries(ENTITY_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Nom légal</label>
              <input value={form.legal_name} onChange={set('legal_name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Code pays</label>
              <input value={form.country_code} onChange={set('country_code')} className={inputCls} placeholder="ex: CD" />
            </div>
            <div>
              <label className={labelCls}>Actif</label>
              <label className="flex items-center gap-2 mt-1">
                <input type="checkbox" checked={form.active} onChange={set('active')} className="rounded border-gray-300 text-purple-600 focus:ring-purple-300" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Entité active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editing ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {entities.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{e.display_name}</p>
                <span className="text-xs text-gray-400 font-mono">{e.code}</span>
                {!e.active && <span className="text-xs text-gray-400">(inactif)</span>}
              </div>
              <p className="text-xs text-gray-500">
                {ENTITY_TYPE_LABELS[e.entity_type] ?? e.entity_type}
                {e.legal_name && <span> · {e.legal_name}</span>}
                {e.country_code && <span> · {e.country_code}</span>}
              </p>
            </div>
            <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {entities.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Aucune entité</div>
        )}
      </div>
    </div>
  );
}
