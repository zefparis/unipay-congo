'use client';

import { useState } from 'react';
import { Plus, Loader2, Check } from 'lucide-react';
import clsx from 'clsx';
import { formatMoney, formatDate, getRemainingAmount } from '@/lib/dev-expenses/formatters';
import { SETTLEMENT_TYPE_LABELS, SETTLEMENT_STATUS_CONFIG, PAYMENT_METHOD_LABELS } from '@/lib/dev-expenses/labels';
import { createSettlement, updateSettlement } from '@/lib/dev-expenses/api';
import type { DevExpenseV4, Settlement, ExpenseEntity, SettlementType, SettlementStatus } from '@/lib/dev-expenses/types';

interface Props {
  expense: DevExpenseV4;
  settlements: Settlement[];
  entities: Record<string, ExpenseEntity>;
  locale: string;
  onUpdated: (message: string) => void;
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

export default function SettlementList({ expense, settlements, entities, locale, onUpdated }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<SettlementType>('supplier_payment');
  const [payerId, setPayerId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(expense.invoice_currency || 'USD');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  // Confirm state
  const [confirmTarget, setConfirmTarget] = useState<Settlement | null>(null);
  const [confirmRef, setConfirmRef] = useState('');
  const [confirmDate, setConfirmDate] = useState('');

  const remaining = getRemainingAmount(expense);
  const entityName = (id: string | null) => {
    if (!id) return '—';
    return entities[id]?.display_name ?? id;
  };

  async function handleCreate() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createSettlement(expense.id, {
        settlement_type: type,
        payer_entity_id: payerId || null,
        recipient_entity_id: recipientId || null,
        amount: amt,
        currency,
        payment_method: method || null,
        transaction_reference: reference || null,
        scheduled_at: scheduledAt || null,
        notes: notes || null,
      });
      onUpdated('Paiement programmé');
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
    setLoading(false);
  }

  async function handleConfirm() {
    if (!confirmTarget) return;
    if (!confirmTarget.payer_entity_id || !confirmTarget.recipient_entity_id) {
      setError('Le paiement doit avoir un payeur et un bénéficiaire');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateSettlement(expense.id, confirmTarget.id, {
        status: 'completed' as SettlementStatus,
        transaction_reference: confirmRef || confirmTarget.transaction_reference,
        confirmed_at: confirmDate || new Date().toISOString().slice(0, 10),
      });
      onUpdated('Paiement confirmé');
      setConfirmTarget(null);
      setConfirmRef('');
      setConfirmDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
    setLoading(false);
  }

  function resetForm() {
    setType('supplier_payment');
    setPayerId('');
    setRecipientId('');
    setAmount('');
    setMethod('');
    setReference('');
    setScheduledAt('');
    setNotes('');
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Paiements et remboursements</h3>
        {!showForm && (
          <button
            onClick={() => {
              setAmount(String(remaining > 0 ? remaining.toFixed(2) : ''));
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        )}
      </div>

      {/* Settlement form */}
      {showForm && (
        <div className="mb-4 p-4 rounded-lg border border-purple-200 dark:border-purple-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type de règlement</label>
              <select value={type} onChange={(e) => setType(e.target.value as SettlementType)} className={inputCls}>
                {Object.entries(SETTLEMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Montant *</label>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Payeur</label>
              <select value={payerId} onChange={(e) => setPayerId(e.target.value)} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {Object.values(entities).map((e) => (
                  <option key={e.id} value={e.id}>{e.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Bénéficiaire</label>
              <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {Object.values(entities).map((e) => (
                  <option key={e.id} value={e.id}>{e.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Devise</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Méthode</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
                <option value="">— Aucune —</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Référence</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} placeholder="N° de transaction" />
            </div>
            <div>
              <label className={labelCls}>Date prévue</label>
              <input type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} placeholder="Notes…" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-3 py-2 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Confirm payment modal */}
      {confirmTarget && (
        <div className="mb-4 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Confirmer le paiement</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {SETTLEMENT_TYPE_LABELS[confirmTarget.settlement_type]} · {formatMoney(confirmTarget.amount, confirmTarget.currency, locale)}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Référence</label>
              <input value={confirmRef} onChange={(e) => setConfirmRef(e.target.value)} className={inputCls} placeholder="N° de transaction" />
            </div>
            <div>
              <label className={labelCls}>Date de confirmation</label>
              <input type="date" value={confirmDate} onChange={(e) => setConfirmDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmTarget(null)} className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-3 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {settlements.length === 0 && !showForm && (
          <p className="text-sm text-gray-400 text-center py-6">Aucun paiement enregistré</p>
        )}
        {settlements.map((s) => {
          const cfg = SETTLEMENT_STATUS_CONFIG[s.status] ?? SETTLEMENT_STATUS_CONFIG.scheduled;
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {SETTLEMENT_TYPE_LABELS[s.settlement_type] ?? s.settlement_type}
                  </span>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', cfg.cls)}>
                    {cfg.label}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex gap-2 flex-wrap">
                  <span>{entityName(s.payer_entity_id)} → {entityName(s.recipient_entity_id)}</span>
                  {s.payment_method && <span>· {PAYMENT_METHOD_LABELS[s.payment_method] ?? s.payment_method}</span>}
                  {s.transaction_reference && <span>· {s.transaction_reference}</span>}
                  {s.scheduled_at && <span>· {formatDate(s.scheduled_at, locale)}</span>}
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                {formatMoney(s.amount, s.currency, locale)}
              </span>
              {s.status === 'scheduled' && (
                <button
                  onClick={() => {
                    setConfirmTarget(s);
                    setConfirmRef(s.transaction_reference ?? '');
                    setConfirmDate(new Date().toISOString().slice(0, 10));
                    setError(null);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Confirmer
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
