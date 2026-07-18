import { describe, it, expect } from 'vitest';
import {
  validateCreateForm,
  formToApiPayload,
  EMPTY_FORM,
  type CreateExpenseForm,
} from '@/lib/dev-expenses/validation';

describe('validateCreateForm', () => {
  it('returns errors for empty form', () => {
    const emptyForm = { ...EMPTY_FORM, billing_month: '', initial_payment_status: '' };
    const errors = validateCreateForm(emptyForm);
    expect(errors.title).toBeDefined();
    expect(errors.category).toBeDefined();
    expect(errors.billing_month).toBeDefined();
    expect(errors.invoice_amount).toBeDefined();
    expect(errors.incurred_by_entity_id).toBeDefined();
    expect(errors.covered_by_entity_id).toBeDefined();
    expect(errors.initial_payment_status).toBeDefined();
  });

  it('passes with valid form', () => {
    const form: CreateExpenseForm = {
      ...EMPTY_FORM,
      title: 'Test invoice',
      category: 'Cloud',
      billing_month: '2026-07-01',
      invoice_amount: '100',
      invoice_currency: 'USD',
      incurred_by_entity_id: 'entity-1',
      covered_by_entity_id: 'entity-2',
      initial_payment_status: 'unpaid',
    };
    const errors = validateCreateForm(form);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('fails for zero amount', () => {
    const form: CreateExpenseForm = {
      ...EMPTY_FORM,
      title: 'Test',
      category: 'Cloud',
      billing_month: '2026-07-01',
      invoice_amount: '0',
      invoice_currency: 'USD',
      incurred_by_entity_id: 'entity-1',
      covered_by_entity_id: 'entity-2',
      initial_payment_status: 'unpaid',
    };
    const errors = validateCreateForm(form);
    expect(errors.invoice_amount).toBeDefined();
  });

  it('fails for negative amount', () => {
    const form: CreateExpenseForm = {
      ...EMPTY_FORM,
      title: 'Test',
      category: 'Cloud',
      billing_month: '2026-07-01',
      invoice_amount: '-10',
      invoice_currency: 'USD',
      incurred_by_entity_id: 'entity-1',
      covered_by_entity_id: 'entity-2',
      initial_payment_status: 'unpaid',
    };
    const errors = validateCreateForm(form);
    expect(errors.invoice_amount).toBeDefined();
  });
});

describe('formToApiPayload', () => {
  it('converts form to API payload', () => {
    const form: CreateExpenseForm = {
      ...EMPTY_FORM,
      title: 'Test invoice',
      category: 'Cloud',
      project_ref: 'UniPay',
      invoice_number: 'INV-001',
      invoice_date: '2026-07-01',
      billing_month: '2026-07-01',
      due_date: '2026-07-15',
      invoice_amount: '100',
      invoice_currency: 'USD',
      description: 'Test description',
      incurred_by_entity_id: 'entity-1',
      covered_by_entity_id: 'entity-2',
      initial_payment_status: 'unpaid',
    };
    const payload = formToApiPayload(form);
    expect(payload.title).toBe('Test invoice');
    expect(payload.category).toBe('Cloud');
    expect(payload.invoice_amount).toBe(100);
    expect(payload.invoice_currency).toBe('USD');
    expect(payload.incurred_by_entity_id).toBe('entity-1');
    expect(payload.covered_by_entity_id).toBe('entity-2');
    expect(payload.requested_amount).toBe(100); // auto-filled from invoice_amount
  });

  it('uses requested_amount when provided', () => {
    const form: CreateExpenseForm = {
      ...EMPTY_FORM,
      title: 'Test',
      category: 'Cloud',
      billing_month: '2026-07-01',
      invoice_amount: '100',
      invoice_currency: 'USD',
      requested_amount: '80',
      incurred_by_entity_id: 'entity-1',
      covered_by_entity_id: 'entity-2',
      initial_payment_status: 'unpaid',
    };
    const payload = formToApiPayload(form);
    expect(payload.requested_amount).toBe(80);
  });

  it('trims whitespace', () => {
    const form: CreateExpenseForm = {
      ...EMPTY_FORM,
      title: '  Test  ',
      category: '  Cloud  ',
      billing_month: '2026-07-01',
      invoice_amount: '100',
      invoice_currency: 'USD',
      incurred_by_entity_id: 'entity-1',
      covered_by_entity_id: 'entity-2',
      initial_payment_status: 'unpaid',
    };
    const payload = formToApiPayload(form);
    expect(payload.title).toBe('Test');
    expect(payload.category).toBe('Cloud');
  });

  it('omits empty optional fields', () => {
    const form: CreateExpenseForm = {
      ...EMPTY_FORM,
      title: 'Test',
      category: 'Cloud',
      billing_month: '2026-07-01',
      invoice_amount: '100',
      invoice_currency: 'USD',
      incurred_by_entity_id: 'entity-1',
      covered_by_entity_id: 'entity-2',
      initial_payment_status: 'unpaid',
    };
    const payload = formToApiPayload(form);
    expect(payload.creditor_id).toBeUndefined();
    expect(payload.project_ref).toBeUndefined();
    expect(payload.invoice_number).toBeUndefined();
    expect(payload.description).toBeUndefined();
  });
});
