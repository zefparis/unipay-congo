'use client';

import { useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { resolveMigrationReview } from '@/lib/dev-expenses/api';
import { TECHNICAL_STATUS_LABELS } from '@/lib/dev-expenses/labels';
import type { DevExpenseV4, DevExpenseStatusV4, ExpenseEntity } from '@/lib/dev-expenses/types';

interface Props {
  expense: DevExpenseV4;
  entities: Record<string, ExpenseEntity>;
  onClose: () => void;
  onResolved: (message: string) => void;
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

const STATUS_OPTIONS: DevExpenseStatusV4[] = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'partially_approved',
  'payment_scheduled',
  'partially_paid',
  'completed',
  'rejected',
  'disputed',
  'cancelled',
];

export default function MigrationReviewForm({ expense, entities, onClose, onResolved }: Props) {
  const [status, setStatus] = useState<DevExpenseStatusV4>(
    expense.status_v4 ?? 'under_review',
  );
  const [incurredBy, setIncurredBy] = useState(expense.incurred_by_entity_id ?? '');
  const [initiallyPaidBy, setInitiallyPaidBy] = useState(expense.initially_paid_by_entity_id ?? '');
  const [coveredBy, setCoveredBy] = useState(expense.covered_by_entity_id ?? '');
  const [reimbursementTo, setReimbursementTo] = useState(expense.reimbursement_recipient_entity_id ?? '');
  const [billingRecipient, setBillingRecipient] = useState(expense.billing_recipient_entity_id ?? '');
  const [approvedAmount, setApprovedAmount] = useState(
    expense.approved_amount != null ? String(expense.approved_amount) : '',
  );
  const [settledAmount, setSettledAmount] = useState(
    expense.settled_amount != null ? String(expense.settled_amount) : '',
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entityOptions = Object.values(entities);

  // Legal completeness warning for billing recipient
  const billingEntity = billingRecipient ? entities[billingRecipient] : null;
  const legalWarnings: string[] = [];
  if (billingEntity) {
    if (!billingEntity.country_code) legalWarnings.push('Pays manquant');
    if (!billingEntity.legal_name && !billingEntity.display_name) legalWarnings.push('Nom légal manquant');
    if (!billingEntity.address_line_1 && !billingEntity.address) legalWarnings.push('Adresse manquante');
    if (!billingEntity.billing_email && !billingEntity.email) legalWarnings.push('Email de facturation manquant');
  }

  async function handleResolve() {
    setLoading(true);
    setError(null);
    try {
      await resolveMigrationReview(expense.id, {
        status,
        incurred_by_entity_id: incurredBy || null,
        initially_paid_by_entity_id: initiallyPaidBy || null,
        covered_by_entity_id: coveredBy || null,
        reimbursement_recipient_entity_id: reimbursementTo || null,
        billing_recipient_entity_id: billingRecipient || null,
        approved_amount: approvedAmount ? parseFloat(approvedAmount) : null,
        settled_amount: settledAmount ? parseFloat(settledAmount) : null,
        notes: notes.trim() || undefined,
      });
      onResolved('Données historiques vérifiées');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="font-semibold text-gray-900 dark:text-white">Vérifier les informations</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Statut réel</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as DevExpenseStatusV4)} className={inputCls}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{TECHNICAL_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Dépense engagée par</label>
              <select value={incurredBy} onChange={(e) => setIncurredBy(e.target.value)} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {entityOptions.filter((e) => e.can_incur_expenses).map((e) => (
                  <option key={e.id} value={e.id}>{e.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Payée initialement par</label>
              <select value={initiallyPaidBy} onChange={(e) => setInitiallyPaidBy(e.target.value)} className={inputCls}>
                <option value="">— Aucune —</option>
                {entityOptions.filter((e) => e.can_pay_expenses).map((e) => (
                  <option key={e.id} value={e.id}>{e.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Prise en charge par</label>
              <select value={coveredBy} onChange={(e) => setCoveredBy(e.target.value)} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {entityOptions.filter((e) => e.can_cover_expenses).map((e) => (
                  <option key={e.id} value={e.id}>{e.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bénéficiaire du remboursement</label>
              <select value={reimbursementTo} onChange={(e) => setReimbursementTo(e.target.value)} className={inputCls}>
                <option value="">— Aucun —</option>
                {entityOptions.filter((e) => e.can_receive_reimbursements).map((e) => (
                  <option key={e.id} value={e.id}>{e.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Destinataire de facturation</label>
              <select value={billingRecipient} onChange={(e) => setBillingRecipient(e.target.value)} className={inputCls}>
                <option value="">— Aucun —</option>
                {entityOptions.filter((e) => e.can_receive_invoices).map((e) => (
                  <option key={e.id} value={e.id}>{e.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Montant validé</label>
              <input type="number" step="0.01" min="0" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} className={inputCls} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Montant déjà réglé</label>
              <input type="number" step="0.01" min="0" value={settledAmount} onChange={(e) => setSettledAmount(e.target.value)} className={inputCls} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes de vérification</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="Notes sur la vérification…" />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {legalWarnings.length > 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Coordonnées légales incomplètes :</p>
              <ul className="text-xs text-amber-600 dark:text-amber-400 list-disc list-inside">
                {legalWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Compl&eacute;tez l&apos;entit&eacute; puis rafra&icirc;chissez le snapshot.</p>
            </div>
          )}

          <div className="flex gap-2 justify-end border-t border-gray-100 dark:border-gray-800 pt-4">
            <button onClick={onClose} className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium">
              Annuler
            </button>
            <button
              onClick={handleResolve}
              disabled={loading}
              className="px-4 py-2.5 text-sm rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Vérifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
