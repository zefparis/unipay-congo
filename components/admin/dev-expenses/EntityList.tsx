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
    legal_name: '', trade_name: '', country_code: '', active: true,
    email: '', phone: '', address: '', city: '', postal_code: '', tax_id: '',
    registration_number: '', vat_number: '',
    address_line_1: '', address_line_2: '', region: '',
    contact_name: '', billing_email: '', contact_email: '', website: '',
    legal_notes: '',
    can_incur_expenses: true, can_receive_invoices: true, can_pay_expenses: true,
    can_cover_expenses: true, can_receive_reimbursements: true,
  });
  const [showBankSection, setShowBankSection] = useState(false);

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
      trade_name: e.trade_name ?? '',
      country_code: e.country_code ?? '',
      active: e.active,
      email: e.email ?? '',
      phone: e.phone ?? '',
      address: e.address ?? '',
      city: e.city ?? '',
      postal_code: e.postal_code ?? '',
      tax_id: e.tax_id ?? '',
      registration_number: e.registration_number ?? '',
      vat_number: e.vat_number ?? '',
      address_line_1: e.address_line_1 ?? '',
      address_line_2: e.address_line_2 ?? '',
      region: e.region ?? '',
      contact_name: e.contact_name ?? '',
      billing_email: e.billing_email ?? '',
      contact_email: e.contact_email ?? '',
      website: e.website ?? '',
      legal_notes: e.legal_notes ?? '',
      can_incur_expenses: e.can_incur_expenses ?? true,
      can_receive_invoices: e.can_receive_invoices ?? true,
      can_pay_expenses: e.can_pay_expenses ?? true,
      can_cover_expenses: e.can_cover_expenses ?? true,
      can_receive_reimbursements: e.can_receive_reimbursements ?? true,
    });
    setShowForm(true);
  }

  function openNew() {
    setEditing(null);
    setForm({ code: '', display_name: '', entity_type: 'company', legal_name: '', trade_name: '', country_code: '', active: true, email: '', phone: '', address: '', city: '', postal_code: '', tax_id: '', registration_number: '', vat_number: '', address_line_1: '', address_line_2: '', region: '', contact_name: '', billing_email: '', contact_email: '', website: '', legal_notes: '', can_incur_expenses: true, can_receive_invoices: true, can_pay_expenses: true, can_cover_expenses: true, can_receive_reimbursements: true });
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
          trade_name: form.trade_name || undefined,
          country_code: form.country_code || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          postal_code: form.postal_code || undefined,
          tax_id: form.tax_id || undefined,
          registration_number: form.registration_number || undefined,
          vat_number: form.vat_number || undefined,
          address_line_1: form.address_line_1 || undefined,
          address_line_2: form.address_line_2 || undefined,
          region: form.region || undefined,
          contact_name: form.contact_name || undefined,
          billing_email: form.billing_email || undefined,
          contact_email: form.contact_email || undefined,
          website: form.website || undefined,
          legal_notes: form.legal_notes || undefined,
          can_incur_expenses: form.can_incur_expenses,
          can_receive_invoices: form.can_receive_invoices,
          can_pay_expenses: form.can_pay_expenses,
          can_cover_expenses: form.can_cover_expenses,
          can_receive_reimbursements: form.can_receive_reimbursements,
          active: form.active,
        });
      } else {
        await createEntity({
          code: form.code,
          display_name: form.display_name,
          entity_type: form.entity_type,
          legal_name: form.legal_name || undefined,
          trade_name: form.trade_name || undefined,
          country_code: form.country_code || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          postal_code: form.postal_code || undefined,
          tax_id: form.tax_id || undefined,
          registration_number: form.registration_number || undefined,
          vat_number: form.vat_number || undefined,
          address_line_1: form.address_line_1 || undefined,
          address_line_2: form.address_line_2 || undefined,
          region: form.region || undefined,
          contact_name: form.contact_name || undefined,
          billing_email: form.billing_email || undefined,
          contact_email: form.contact_email || undefined,
          website: form.website || undefined,
          legal_notes: form.legal_notes || undefined,
          can_incur_expenses: form.can_incur_expenses,
          can_receive_invoices: form.can_receive_invoices,
          can_pay_expenses: form.can_pay_expenses,
          can_cover_expenses: form.can_cover_expenses,
          can_receive_reimbursements: form.can_receive_reimbursements,
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
            {/* Identité */}
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
              <label className={labelCls}>Nom commercial</label>
              <input value={form.trade_name} onChange={set('trade_name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Nom légal *</label>
              <input value={form.legal_name} onChange={set('legal_name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pays (ISO 3166-1 alpha-2) *</label>
              <input value={form.country_code} onChange={set('country_code')} className={inputCls} placeholder="ex: CD, FR, ZA" maxLength={2} />
            </div>

            {/* Adresse */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Adresse (ligne 1)</label>
              <input value={form.address_line_1} onChange={set('address_line_1')} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Compl&eacute;ment d&apos;adresse</label>
              <input value={form.address_line_2} onChange={set('address_line_2')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Code postal</label>
              <input value={form.postal_code} onChange={set('postal_code')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input value={form.city} onChange={set('city')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Région / Province</label>
              <input value={form.region} onChange={set('region')} className={inputCls} />
            </div>

            {/* Contact */}
            <div>
              <label className={labelCls}>Contact principal</label>
              <input value={form.contact_name} onChange={set('contact_name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email de facturation</label>
              <input type="email" value={form.billing_email} onChange={set('billing_email')} className={inputCls} placeholder="billing@…" />
            </div>
            <div>
              <label className={labelCls}>Email général</label>
              <input type="email" value={form.contact_email} onChange={set('contact_email')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input value={form.phone} onChange={set('phone')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Site web</label>
              <input value={form.website} onChange={set('website')} className={inputCls} placeholder="https://…" />
            </div>

            {/* Administration */}
            <div>
              <label className={labelCls}>N&deg; d&apos;enregistrement</label>
              <input value={form.registration_number} onChange={set('registration_number')} className={inputCls} placeholder="RCCM" />
            </div>
            <div>
              <label className={labelCls}>Identifiant fiscal</label>
              <input value={form.tax_id} onChange={set('tax_id')} className={inputCls} placeholder="NIF" />
            </div>
            <div>
              <label className={labelCls}>N° de TVA</label>
              <input value={form.vat_number} onChange={set('vat_number')} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Notes légales (interne)</label>
              <textarea value={form.legal_notes} onChange={set('legal_notes')} className={inputCls} rows={2} />
            </div>

            {/* Rôles */}
            <div className="sm:col-span-2 border-t border-gray-100 dark:border-gray-800 pt-3 mt-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Rôles</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.can_incur_expenses} onChange={set('can_incur_expenses')} className="rounded border-gray-300 text-purple-600 focus:ring-purple-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Peut engager des d&eacute;penses</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.can_receive_invoices} onChange={set('can_receive_invoices')} className="rounded border-gray-300 text-purple-600 focus:ring-purple-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Peut recevoir des factures</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.can_pay_expenses} onChange={set('can_pay_expenses')} className="rounded border-gray-300 text-purple-600 focus:ring-purple-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Peut payer des dépenses</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.can_cover_expenses} onChange={set('can_cover_expenses')} className="rounded border-gray-300 text-purple-600 focus:ring-purple-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Peut prendre en charge une dépense</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.can_receive_reimbursements} onChange={set('can_receive_reimbursements')} className="rounded border-gray-300 text-purple-600 focus:ring-purple-300" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Peut recevoir des remboursements</span>
                </label>
              </div>
            </div>

            {/* Actif */}
            <div className="sm:col-span-2 border-t border-gray-100 dark:border-gray-800 pt-3">
              <label className="flex items-center gap-2">
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
              {(e.billing_email || e.email || e.phone || e.tax_id) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {e.billing_email && <span>{e.billing_email}</span>}
                  {!e.billing_email && e.email && <span>{e.email}</span>}
                  {(e.billing_email || e.email) && e.phone && <span> · </span>}
                  {e.phone && <span>{e.phone}</span>}
                  {((e.billing_email || e.email) || e.phone) && e.tax_id && <span> · </span>}
                  {e.tax_id && <span>N° fiscal: {e.tax_id}</span>}
                </p>
              )}
              {(e.address_line_1 || e.address || e.city) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {[e.address_line_1 ?? e.address, e.city, e.postal_code, e.region].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {e.can_incur_expenses && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">Engagement</span>}
                {e.can_receive_invoices && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">Factures</span>}
                {e.can_pay_expenses && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Payeur</span>}
                {e.can_cover_expenses && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">Prise en charge</span>}
                {e.can_receive_reimbursements && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">Remboursement</span>}
              </div>
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
