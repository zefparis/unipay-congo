'use client';

import { useState } from 'react';
import { Loader2, Send, CheckCircle2, XCircle, CalendarClock, AlertTriangle, Archive, Gavel } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { transitionExpense } from '@/lib/dev-expenses/api';
import type { DevExpenseV4, DevExpenseStatusV4, ExpenseDetail } from '@/lib/dev-expenses/types';

interface Props {
  detail: ExpenseDetail;
  onUpdated: (message: string) => void;
  onActionNeeded: (action: string) => void;
}

type ModalType = 'submit' | 'start_review' | 'approve' | 'reject' | 'dispute' | 'archive' | null;

export default function ExpenseActions({ detail, onUpdated, onActionNeeded }: Props) {
  const [modal, setModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const expense = detail.expense;
  const allowed = detail.allowed_transitions ?? [];
  const remaining = detail.remaining_amount;

  const can = (status: DevExpenseStatusV4) => allowed.includes(status);

  async function doTransition(to: DevExpenseStatusV4, extra?: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      await transitionExpense(expense.id, { to, ...extra });
      const messages: Record<string, string> = {
        submitted: 'Facture envoyée pour validation',
        under_review: 'Vérification démarrée',
        approved: 'Validation enregistrée',
        partially_approved: 'Validation partielle enregistrée',
        rejected: 'Facture refusée',
        disputed: 'Litige ouvert',
        archived: 'Facture archivée',
        cancelled: 'Facture annulée',
      };
      onUpdated(messages[to] ?? 'Action effectuée');
      setModal(null);
      setApprovedAmount('');
      setReason('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
    setLoading(false);
  }

  function handleApprove() {
    const amount = parseFloat(approvedAmount);
    if (!amount || amount <= 0) {
      setError('Le montant validé doit être supérieur à 0');
      return;
    }
    const requested = expense.requested_amount ?? expense.invoice_amount ?? 0;
    if (amount === requested) {
      doTransition('approved', { approved_amount: amount, approved_equals_requested: true });
    } else if (amount < requested) {
      if (!notes.trim()) {
        setError('Une note est obligatoire pour une validation partielle');
        return;
      }
      doTransition('partially_approved', { approved_amount: amount, notes: notes.trim() });
    } else {
      setError('Le montant validé ne peut pas dépasser le montant demandé');
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';
  const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {can('submitted') && (
          <button
            onClick={() => setModal('submit')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            <Send className="w-4 h-4" /> Soumettre
          </button>
        )}
        {can('under_review') && (
          <button
            onClick={() => setModal('start_review')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
          >
            <CheckCircle2 className="w-4 h-4" /> Commencer la vérification
          </button>
        )}
        {(can('approved') || can('partially_approved')) && (
          <button
            onClick={() => setModal('approve')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <CheckCircle2 className="w-4 h-4" /> Valider
          </button>
        )}
        {can('rejected') && (
          <button
            onClick={() => setModal('reject')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
          >
            <XCircle className="w-4 h-4" /> Refuser
          </button>
        )}
        {can('disputed') && (
          <button
            onClick={() => setModal('dispute')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium"
          >
            <Gavel className="w-4 h-4" /> Ouvrir un litige
          </button>
        )}
        {can('payment_scheduled') && (
          <button
            onClick={() => onActionNeeded('settlement')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium"
          >
            <CalendarClock className="w-4 h-4" /> Programmer un paiement
          </button>
        )}
        {can('archived') && (
          <button
            onClick={() => setModal('archive')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            <Archive className="w-4 h-4" /> Archiver
          </button>
        )}
      </div>

      {/* Submit confirmation */}
      <ConfirmDialog open={modal === 'submit'} onClose={() => setModal(null)} title="Soumettre pour validation">
        <p className="text-sm text-gray-600 dark:text-gray-400">Envoyer cette facture pour validation ?</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => doTransition('submitted')}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Confirmer
          </button>
        </div>
      </ConfirmDialog>

      {/* Start review */}
      <ConfirmDialog open={modal === 'start_review'} onClose={() => setModal(null)} title="Commencer la vérification">
        <p className="text-sm text-gray-600 dark:text-gray-400">Démarrer la vérification de cette facture ?</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => doTransition('under_review')}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirmer
          </button>
        </div>
      </ConfirmDialog>

      {/* Approve / Partially approve */}
      <ConfirmDialog open={modal === 'approve'} onClose={() => setModal(null)} title="Valider la facture" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Montant demandé</label>
              <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                {expense.requested_amount ?? expense.invoice_amount ?? '—'}
              </p>
            </div>
            <div>
              <label className={labelCls}>Montant validé *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                className={inputCls}
                placeholder={String(expense.requested_amount ?? expense.invoice_amount ?? '')}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Note (obligatoire si validation partielle)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputCls + ' resize-none'}
              placeholder="Justification si validation partielle…"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Valider
            </button>
          </div>
        </div>
      </ConfirmDialog>

      {/* Reject */}
      <ConfirmDialog open={modal === 'reject'} onClose={() => setModal(null)} title="Refuser la facture">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Motif du refus *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="Expliquer la raison du refus…"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button
              onClick={() => {
                if (!reason.trim()) { setError('Le motif est obligatoire'); return; }
                doTransition('rejected', { reason: reason.trim() });
              }}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Confirmer le refus
            </button>
          </div>
        </div>
      </ConfirmDialog>

      {/* Dispute */}
      <ConfirmDialog open={modal === 'dispute'} onClose={() => setModal(null)} title="Ouvrir un litige">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Motif du litige *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={inputCls + ' resize-none'}
              placeholder="Expliquer le litige…"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
            <button
              onClick={() => {
                if (!reason.trim()) { setError('Le motif est obligatoire'); return; }
                doTransition('disputed', { reason: reason.trim() });
              }}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Ouvrir le litige
            </button>
          </div>
        </div>
      </ConfirmDialog>

      {/* Archive */}
      <ConfirmDialog open={modal === 'archive'} onClose={() => setModal(null)} title="Archiver la facture">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Cette action archivera la facture. Elle restera accessible mais ne sera plus active.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50">Annuler</button>
          <button
            onClick={() => doTransition('archived')}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            Archiver
          </button>
        </div>
      </ConfirmDialog>
    </>
  );
}
