import { describe, it, expect } from 'vitest';
import { getExpenseNextAction } from '@/lib/dev-expenses/next-action';
import type { DevExpenseV4 } from '@/lib/dev-expenses/types';

const baseExpense = {
  id: '1',
  title: null,
  description: null,
  category: 'Test',
  creditor_id: null,
  project_code: 'test',
  project_ref: null,
  quote_id: null,
  billing_month: '2026-07-01',
  invoice_number: null,
  invoice_date: null,
  due_date: null,
  incurred_by_entity_id: null,
  initially_paid_by_entity_id: null,
  covered_by_entity_id: null,
  reimbursement_recipient_entity_id: null,
  amount_usd: 100,
  invoice_amount: 100,
  invoice_currency: 'USD',
  requested_amount: null,
  approved_amount: null,
  settled_amount: 0,
  initial_payment_status: null,
  initial_payment_method: null,
  status_v4: null,
  status: 'pending',
  submitted_at: null,
  review_started_at: null,
  approved_at: null,
  payment_scheduled_at: null,
  completed_at: null,
  cancelled_at: null,
  rejection_reason: null,
  dispute_reason: null,
  internal_notes_v4: null,
  migration_review_required: false,
  migration_notes: null,
  legacy_status: null,
  legacy_funded_by: null,
  legacy_paid_by: null,
  archived: false,
  archived_at: null,
  paid_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as DevExpenseV4;

describe('getExpenseNextAction', () => {
  it('returns warning action when migration_review_required', () => {
    const action = getExpenseNextAction({ ...baseExpense, migration_review_required: true });
    expect(action).not.toBeNull();
    expect(action!.variant).toBe('warning');
    expect(action!.label).toBe('Vérifier les données');
  });

  it('returns warning when status_v4 is null', () => {
    const action = getExpenseNextAction({ ...baseExpense, status_v4: null });
    expect(action).not.toBeNull();
    expect(action!.variant).toBe('warning');
  });

  it('returns submit action for draft', () => {
    const action = getExpenseNextAction({ ...baseExpense, status_v4: 'draft' });
    expect(action).not.toBeNull();
    expect(action!.label).toBe('Compléter et soumettre');
    expect(action!.targetStatus).toBe('submitted');
  });

  it('returns start review action for submitted', () => {
    const action = getExpenseNextAction({ ...baseExpense, status_v4: 'submitted' });
    expect(action).not.toBeNull();
    expect(action!.label).toBe('Commencer la vérification');
    expect(action!.variant).toBe('info');
  });

  it('returns validate action for under_review', () => {
    const action = getExpenseNextAction({ ...baseExpense, status_v4: 'under_review' });
    expect(action).not.toBeNull();
    expect(action!.label).toBe('Valider ou refuser');
  });

  it('returns schedule payment for approved', () => {
    const action = getExpenseNextAction({ ...baseExpense, status_v4: 'approved' });
    expect(action).not.toBeNull();
    expect(action!.label).toBe('Programmer le paiement');
    expect(action!.targetStatus).toBe('payment_scheduled');
  });

  it('returns confirm settlement for payment_scheduled', () => {
    const action = getExpenseNextAction({ ...baseExpense, status_v4: 'payment_scheduled' });
    expect(action).not.toBeNull();
    expect(action!.label).toBe('Confirmer le règlement');
  });

  it('returns archive for completed', () => {
    const action = getExpenseNextAction({ ...baseExpense, status_v4: 'completed' });
    expect(action).not.toBeNull();
    expect(action!.label).toBe('Archiver');
    expect(action!.targetStatus).toBe('archived');
  });

  it('returns null for archived', () => {
    const action = getExpenseNextAction({ ...baseExpense, status_v4: 'archived' });
    expect(action).toBeNull();
  });
});
