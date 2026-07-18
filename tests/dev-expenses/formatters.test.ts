import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatMonth,
  formatMoney,
  formatMultiCurrency,
  daysUntil,
  isOverdue,
  getUnvalidatedAmount,
  getExpectedSettlementAmount,
  getRemainingAmount,
} from '@/lib/dev-expenses/formatters';
import type { DevExpenseV4 } from '@/lib/dev-expenses/types';

describe('formatDate', () => {
  it('returns — for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats a date string', () => {
    const result = formatDate('2026-07-15', 'fr');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/juil/i);
  });

  it('formats an ISO datetime', () => {
    const result = formatDate('2026-07-15T10:30:00Z', 'fr');
    expect(result).toMatch(/15/);
  });
});

describe('formatMoney', () => {
  it('formats USD amount', () => {
    const result = formatMoney(1000, 'USD', 'fr');
    expect(result).toMatch(/1.000,00 USD/);
    expect(result).not.toContain('$');
  });

  it('formats EUR amount', () => {
    expect(formatMoney(50.5, 'EUR', 'fr')).toBe('50,50 EUR');
  });

  it('formats USDT without $ symbol', () => {
    const result = formatMoney(100, 'USDT', 'fr');
    expect(result).toBe('100,00 USDT');
    expect(result).not.toContain('$');
  });

  it('handles null/undefined', () => {
    expect(formatMoney(null, 'USD')).toBe('0,00 USD');
    expect(formatMoney(undefined, 'USD')).toBe('0,00 USD');
  });
});

describe('formatMultiCurrency', () => {
  it('filters out zero amounts', () => {
    const result = formatMultiCurrency({ USD: 100, EUR: 0, USDT: 50 }, 'fr');
    expect(result).toHaveLength(2);
    expect(result[0].currency).toBe('USD');
    expect(result[1].currency).toBe('USDT');
  });

  it('returns empty array for all zeros', () => {
    const result = formatMultiCurrency({ USD: 0, EUR: 0 }, 'fr');
    expect(result).toHaveLength(0);
  });
});

describe('daysUntil', () => {
  it('returns null for no date', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
  });

  it('returns positive for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(daysUntil(future.toISOString().slice(0, 10))).toBe(5);
  });

  it('returns negative for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(daysUntil(past.toISOString().slice(0, 10))).toBe(-3);
  });
});

describe('isOverdue', () => {
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
    status_v4: 'payment_scheduled',
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

  it('returns false when no due date', () => {
    expect(isOverdue(baseExpense)).toBe(false);
  });

  it('returns true when due date is in the past and status is active', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isOverdue({ ...baseExpense, due_date: past.toISOString().slice(0, 10) })).toBe(true);
  });

  it('returns false when status is completed', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isOverdue({ ...baseExpense, due_date: past.toISOString().slice(0, 10), status_v4: 'completed' })).toBe(false);
  });
});

describe('getUnvalidatedAmount', () => {
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
    requested_amount: 100,
    approved_amount: null,
    settled_amount: 0,
    initial_payment_status: null,
    initial_payment_method: null,
    status_v4: 'submitted',
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

  it('returns null when approved_amount is null', () => {
    expect(getUnvalidatedAmount(baseExpense)).toBeNull();
  });

  it('returns 0 when approved equals requested', () => {
    expect(getUnvalidatedAmount({ ...baseExpense, approved_amount: 100 })).toBe(0);
  });

  it('returns difference when partially approved', () => {
    expect(getUnvalidatedAmount({ ...baseExpense, approved_amount: 70 })).toBe(30);
  });
});

describe('getExpectedSettlementAmount', () => {
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
    status_v4: 'draft',
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

  it('uses approved_amount first', () => {
    expect(getExpectedSettlementAmount({ ...baseExpense, approved_amount: 80, requested_amount: 100, invoice_amount: 120 })).toBe(80);
  });

  it('uses requested_amount when no approved', () => {
    expect(getExpectedSettlementAmount({ ...baseExpense, requested_amount: 100, invoice_amount: 120 })).toBe(100);
  });

  it('uses invoice_amount when no approved/requested', () => {
    expect(getExpectedSettlementAmount({ ...baseExpense, invoice_amount: 120 })).toBe(120);
  });

  it('falls back to amount_usd', () => {
    expect(getExpectedSettlementAmount({ ...baseExpense, invoice_amount: null, amount_usd: 50 })).toBe(50);
  });
});

describe('getRemainingAmount', () => {
  it('returns expected minus settled', () => {
    const expense = {
      id: '1',
      title: null, description: null, category: 'Test', creditor_id: null,
      project_code: 'test', project_ref: null, quote_id: null,
      billing_month: '2026-07-01', invoice_number: null, invoice_date: null,
      due_date: null, incurred_by_entity_id: null, initially_paid_by_entity_id: null,
      covered_by_entity_id: null, reimbursement_recipient_entity_id: null,
      amount_usd: 100, invoice_amount: 100, invoice_currency: 'USD',
      requested_amount: 100, approved_amount: 100, settled_amount: 30,
      initial_payment_status: null, initial_payment_method: null,
      status_v4: 'partially_paid', status: 'pending',
      submitted_at: null, review_started_at: null, approved_at: null,
      payment_scheduled_at: null, completed_at: null, cancelled_at: null,
      rejection_reason: null, dispute_reason: null, internal_notes_v4: null,
      migration_review_required: false, migration_notes: null,
      legacy_status: null, legacy_funded_by: null, legacy_paid_by: null,
      archived: false, archived_at: null, paid_at: null,
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    } as DevExpenseV4;
    expect(getRemainingAmount(expense)).toBe(70);
  });

  it('returns 0 when settled exceeds expected', () => {
    const expense = {
      id: '1',
      title: null, description: null, category: 'Test', creditor_id: null,
      project_code: 'test', project_ref: null, quote_id: null,
      billing_month: '2026-07-01', invoice_number: null, invoice_date: null,
      due_date: null, incurred_by_entity_id: null, initially_paid_by_entity_id: null,
      covered_by_entity_id: null, reimbursement_recipient_entity_id: null,
      amount_usd: 100, invoice_amount: 100, invoice_currency: 'USD',
      requested_amount: 100, approved_amount: 100, settled_amount: 150,
      initial_payment_status: null, initial_payment_method: null,
      status_v4: 'completed', status: 'pending',
      submitted_at: null, review_started_at: null, approved_at: null,
      payment_scheduled_at: null, completed_at: null, cancelled_at: null,
      rejection_reason: null, dispute_reason: null, internal_notes_v4: null,
      migration_review_required: false, migration_notes: null,
      legacy_status: null, legacy_funded_by: null, legacy_paid_by: null,
      archived: false, archived_at: null, paid_at: null,
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    } as DevExpenseV4;
    expect(getRemainingAmount(expense)).toBe(0);
  });
});
