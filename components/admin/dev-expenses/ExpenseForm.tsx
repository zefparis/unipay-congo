'use client';

import { useState, useRef } from 'react';
import { Loader2, Check, Upload, X } from 'lucide-react';
import { createExpense, transitionExpense, listEntities, listCreditors } from '@/lib/dev-expenses/api';
import { validateCreateForm, formToApiPayload, EMPTY_FORM, type CreateExpenseForm, type FormErrors } from '@/lib/dev-expenses/validation';
import { PAYMENT_METHOD_LABELS, INITIAL_PAYMENT_STATUS_LABELS } from '@/lib/dev-expenses/labels';
import type { ExpenseEntity, Creditor } from '@/lib/dev-expenses/types';

interface Props {
  onClose: () => void;
  onCreated: (message: string) => void;
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300';
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

export default function ExpenseForm({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateExpenseForm>({
    ...EMPTY_FORM,
    requested_amount: '', // Will auto-fill from invoice_amount
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitAndTransition, setSubmitAndTransition] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [entities, setEntities] = useState<ExpenseEntity[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  // Load entities and creditors on first render
  if (!loaded) {
    setLoaded(true);
    Promise.all([listEntities({ active: true }), listCreditors()])
      .then(([entityRes, creditorRes]) => {
        setEntities(entityRes.items ?? []);
        setCreditors(creditorRes.data ?? []);
      })
      .catch(() => {});
  }

  const set = (k: keyof CreateExpenseForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
    };

  function handleAmountChange(v: string) {
    setForm((f) => ({
      ...f,
      invoice_amount: v,
      requested_amount: f.requested_amount || v, // Auto-fill if empty
    }));
  }

  async function handleSubmit(e: React.FormEvent, andSubmit: boolean) {
    e.preventDefault();
    setSubmitAndTransition(andSubmit);
    const validationErrors = validateCreateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setErrorMsg('Veuillez corriger les champs en rouge');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = formToApiPayload(form);
      const result = await createExpense(payload);
      const expenseId = result.expense.id;

      if (andSubmit) {
        try {
          await transitionExpense(expenseId, { to: 'submitted' });
          onCreated('Facture enregistrée et envoyée pour validation');
        } catch (transitionErr) {
          // Creation succeeded but transition failed — not an inconsistent state, just stays as draft
          onCreated('Facture enregistrée comme brouillon (la soumission a échoué)');
        }
      } else {
        onCreated('Facture enregistrée comme brouillon');
      }
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    }
    setSubmitting(false);
  }

  const activeCreditors = creditors.filter((c) => c.active);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="font-semibold text-gray-900 dark:text-white">Nouvelle facture</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="px-6 py-4 space-y-6">
          {/* Section 1: Facture */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1">
              Facture
            </h3>
            <div>
              <label className={labelCls}>Objet *</label>
              <input value={form.title} onChange={set('title')} className={inputCls} placeholder="Objet de la facture" />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Fournisseur</label>
                <select value={form.creditor_id} onChange={set('creditor_id')} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {activeCreditors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Catégorie *</label>
                <input value={form.category} onChange={set('category')} className={inputCls} placeholder="ex: Infra Cloud" />
                {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className={labelCls}>Projet</label>
                <input value={form.project_ref} onChange={set('project_ref')} className={inputCls} placeholder="ex: UniPay Congo" />
              </div>
              <div>
                <label className={labelCls}>Numéro de facture</label>
                <input value={form.invoice_number} onChange={set('invoice_number')} className={inputCls} placeholder="ex: INV-2026-001" />
              </div>
              <div>
                <label className={labelCls}>Date de facture</label>
                <input type="date" value={form.invoice_date} onChange={set('invoice_date')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mois de facturation *</label>
                <input
                  type="month"
                  value={form.billing_month.slice(0, 7)}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, billing_month: e.target.value + '-01' }))}
                  className={inputCls}
                />
                {errors.billing_month && <p className="text-xs text-red-600 mt-1">{errors.billing_month}</p>}
              </div>
              <div>
                <label className={labelCls}>Date d&apos;échéance</label>
                <input type="date" value={form.due_date} onChange={set('due_date')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Montant *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.invoice_amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={inputCls}
                  placeholder="0.00"
                />
                {errors.invoice_amount && <p className="text-xs text-red-600 mt-1">{errors.invoice_amount}</p>}
              </div>
              <div>
                <label className={labelCls}>Devise *</label>
                <select value={form.invoice_currency} onChange={set('invoice_currency')} className={inputCls}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Description / notes</label>
              <textarea value={form.description} onChange={set('description')} rows={2} className={inputCls + ' resize-none'} placeholder="Notes libres…" />
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
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

          {/* Section 2: Prise en charge */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1">
              Prise en charge
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Dépense engagée par *</label>
                <select value={form.incurred_by_entity_id} onChange={set('incurred_by_entity_id')} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>{e.display_name}</option>
                  ))}
                </select>
                {errors.incurred_by_entity_id && <p className="text-xs text-red-600 mt-1">{errors.incurred_by_entity_id}</p>}
              </div>
              <div>
                <label className={labelCls}>Facture payée initialement par</label>
                <select value={form.initially_paid_by_entity_id} onChange={set('initially_paid_by_entity_id')} className={inputCls}>
                  <option value="">— Aucune —</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>{e.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Prise en charge par *</label>
                <select value={form.covered_by_entity_id} onChange={set('covered_by_entity_id')} className={inputCls}>
                  <option value="">— Sélectionner —</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>{e.display_name}</option>
                  ))}
                </select>
                {errors.covered_by_entity_id && <p className="text-xs text-red-600 mt-1">{errors.covered_by_entity_id}</p>}
              </div>
              <div>
                <label className={labelCls}>Remboursement destiné à</label>
                <select value={form.reimbursement_recipient_entity_id} onChange={set('reimbursement_recipient_entity_id')} className={inputCls}>
                  <option value="">— Aucun —</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>{e.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Situation actuelle du paiement *</label>
                <select value={form.initial_payment_status} onChange={set('initial_payment_status')} className={inputCls}>
                  {Object.entries(INITIAL_PAYMENT_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {errors.initial_payment_status && <p className="text-xs text-red-600 mt-1">{errors.initial_payment_status}</p>}
              </div>
              <div>
                <label className={labelCls}>Moyen de paiement initial</label>
                <select value={form.initial_payment_method} onChange={set('initial_payment_method')} className={inputCls}>
                  <option value="">— Aucun —</option>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Montant demandé</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.requested_amount}
                  onChange={set('requested_amount')}
                  className={inputCls}
                  placeholder={form.invoice_amount || '0.00'}
                />
                <p className="text-xs text-gray-400 mt-1">Laisser vide pour utiliser le montant de la facture</p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 text-sm rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting && !submitAndTransition ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enregistrer comme brouillon
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
              disabled={submitting}
              className="px-4 py-2.5 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting && submitAndTransition ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Enregistrer et soumettre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
