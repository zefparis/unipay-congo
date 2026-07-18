'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { listEntities, createEntity } from '@/lib/dev-expenses/api';
import { ENTITY_TYPE_LABELS } from '@/lib/dev-expenses/labels';
import type { ExpenseEntity } from '@/lib/dev-expenses/types';

interface Props {
  value: string;
  onChange: (id: string) => void;
  entities: ExpenseEntity[];
  onEntityCreated?: (entity: ExpenseEntity) => void;
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

export default function BillingRecipientSelect({ value, onChange, entities, onEntityCreated }: Props) {
  const [showInline, setShowInline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    display_name: '',
    entity_type: 'company',
    legal_name: '',
    country_code: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    tax_id: '',
  });

  const activeEntities = entities.filter((e) => e.active && e.can_receive_invoices);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await createEntity({
        code: form.code,
        display_name: form.display_name,
        entity_type: form.entity_type,
        legal_name: form.legal_name || undefined,
        country_code: form.country_code || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        postal_code: form.postal_code || undefined,
        tax_id: form.tax_id || undefined,
        can_receive_invoices: true,
        active: true,
      });
      onEntityCreated?.(res.entity);
      onChange(res.entity.id);
      setShowInline(false);
      setForm({
        code: '', display_name: '', entity_type: 'company',
        legal_name: '', country_code: '', email: '', phone: '',
        address: '', city: '', postal_code: '', tax_id: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
    setSaving(false);
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
    };

  if (showInline) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Nouvelle entité destinataire</span>
          <button type="button" onClick={() => setShowInline(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleCreate} className="space-y-3 p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Code *</label>
              <input value={form.code} onChange={set('code')} required className={inputCls} placeholder="ex: CLIENT-001" />
            </div>
            <div>
              <label className={labelCls}>Nom affiché *</label>
              <input value={form.display_name} onChange={set('display_name')} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.entity_type} onChange={set('entity_type')} className={inputCls}>
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
              <label className={labelCls}>Pays (ISO) *</label>
              <input value={form.country_code} onChange={set('country_code')} required className={inputCls} placeholder="ex: CD" maxLength={2} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={form.email} onChange={set('email')} className={inputCls} placeholder="contact@…" />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input value={form.phone} onChange={set('phone')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>N° fiscal</label>
              <input value={form.tax_id} onChange={set('tax_id')} className={inputCls} placeholder="NIF / RCCM" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Adresse</label>
              <input value={form.address} onChange={set('address')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input value={form.city} onChange={set('city')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Code postal</label>
              <input value={form.postal_code} onChange={set('postal_code')} className={inputCls} />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowInline(false)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Créer
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + ' flex-1'}>
        <option value="">— Aucun —</option>
        {activeEntities.map((e) => (
          <option key={e.id} value={e.id}>{e.display_name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setShowInline(true)}
        className="flex items-center gap-1 px-2.5 py-2 text-xs rounded-lg border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium whitespace-nowrap"
      >
        <Plus className="w-3.5 h-3.5" /> Nouvelle
      </button>
    </div>
  );
}
