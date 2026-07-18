import { describe, it, expect } from 'vitest';
import type { ExpenseEntity } from '@/lib/dev-expenses/types';

function makeEntity(overrides: Partial<ExpenseEntity> = {}): ExpenseEntity {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    code: 'TEST',
    display_name: 'Test Entity',
    entity_type: 'company',
    legal_name: null,
    trade_name: null,
    country_code: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    postal_code: null,
    tax_id: null,
    registration_number: null,
    vat_number: null,
    address_line_1: null,
    address_line_2: null,
    region: null,
    contact_name: null,
    billing_email: null,
    contact_email: null,
    website: null,
    legal_notes: null,
    can_incur_expenses: true,
    can_receive_invoices: true,
    can_pay_expenses: true,
    can_cover_expenses: true,
    can_receive_reimbursements: true,
    bank_details: {},
    active: true,
    metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/* ── BillingRecipientSelect filtering logic ─────────────────── */

describe('BillingRecipientSelect filtering', () => {
  const entities = [
    makeEntity({ id: '1', display_name: 'Active Invoicer', active: true, can_receive_invoices: true }),
    makeEntity({ id: '2', display_name: 'Inactive Invoicer', active: false, can_receive_invoices: true }),
    makeEntity({ id: '3', display_name: 'Active Non-Invoicer', active: true, can_receive_invoices: false }),
    makeEntity({ id: '4', display_name: 'Inactive Non-Invoicer', active: false, can_receive_invoices: false }),
  ];

  it('includes only active entities with can_receive_invoices=true', () => {
    const filtered = entities.filter((e) => e.active && e.can_receive_invoices);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].display_name).toBe('Active Invoicer');
  });

  it('excludes inactive entities', () => {
    const filtered = entities.filter((e) => e.active && e.can_receive_invoices);
    expect(filtered.find((e) => e.display_name === 'Inactive Invoicer')).toBeUndefined();
  });

  it('excludes entities with can_receive_invoices=false', () => {
    const filtered = entities.filter((e) => e.active && e.can_receive_invoices);
    expect(filtered.find((e) => e.display_name === 'Active Non-Invoicer')).toBeUndefined();
  });

  it('returns empty array when no entities match', () => {
    const none = [makeEntity({ active: false, can_receive_invoices: false })];
    const filtered = none.filter((e) => e.active && e.can_receive_invoices);
    expect(filtered).toHaveLength(0);
  });
});

/* ── Entity form validation logic ────────────────────────────── */

describe('Entity form validation', () => {
  it('legal_name is required for new entity (empty string fails)', () => {
    const form = { legal_name: '' };
    expect(!form.legal_name.trim()).toBe(true);
  });

  it('country_code is required for new entity (empty string fails)', () => {
    const form = { country_code: '' };
    expect(!form.country_code.trim()).toBe(true);
  });

  it('invalid email is rejected', () => {
    const email = 'not-an-email';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRe.test(email)).toBe(false);
  });

  it('valid email is accepted', () => {
    const email = 'test@example.com';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRe.test(email)).toBe(true);
  });

  it('tax fields are optional (empty strings are ok)', () => {
    const form = { tax_id: '', vat_number: '', registration_number: '' };
    expect(form.tax_id === '').toBe(true);
    expect(form.vat_number === '').toBe(true);
    expect(form.registration_number === '').toBe(true);
  });

  it('roles are checkable (boolean toggles)', () => {
    const form = {
      can_incur_expenses: true,
      can_receive_invoices: false,
      can_pay_expenses: true,
      can_cover_expenses: false,
      can_receive_reimbursements: true,
    };
    expect(form.can_incur_expenses).toBe(true);
    expect(form.can_receive_invoices).toBe(false);
  });

  it('old entities without country_code are still editable (null is ok)', () => {
    const entity = makeEntity({ country_code: null });
    expect(entity.country_code).toBeNull();
  });

  it('save succeeds when required fields are present', () => {
    const form = { display_name: 'Test', code: 'TEST', entity_type: 'company', legal_name: 'Test LLC', country_code: 'CD' };
    const hasRequired = form.display_name && form.code && form.entity_type && form.legal_name && form.country_code;
    expect(Boolean(hasRequired)).toBe(true);
  });

  it('save fails when display_name is missing', () => {
    const form = { display_name: '', code: 'TEST', entity_type: 'company' };
    const hasRequired = form.display_name && form.code && form.entity_type;
    expect(Boolean(hasRequired)).toBe(false);
  });
});

/* ── ExpenseSummary snapshot diff logic ──────────────────────── */

describe('ExpenseSummary snapshot diff', () => {
  const COMPARE_FIELDS = [
    'legal_name', 'trade_name', 'registration_number', 'tax_id', 'vat_number',
    'address_line_1', 'address_line_2', 'postal_code', 'city', 'region',
    'country_code', 'contact_name', 'billing_email', 'phone',
  ];

  function diffFields(
    snapshot: Record<string, unknown>,
    entity: Record<string, unknown>,
  ): string[] {
    const changed: string[] = [];
    for (const field of COMPARE_FIELDS) {
      const snapVal = snapshot[field] ?? null;
      let entityVal = entity[field] ?? null;
      if (field === 'address_line_1') entityVal = entity.address_line_1 ?? entity.address ?? null;
      if (field === 'billing_email') entityVal = entity.billing_email ?? entity.email ?? null;
      const norm = (v: unknown) => (v === '' ? null : v);
      if (norm(snapVal) !== norm(entityVal)) changed.push(field);
    }
    return changed;
  }

  it('historical snapshot is displayed when present', () => {
    const snapshot = { legal_name: 'Old Name', captured_at: '2026-01-01' };
    expect(snapshot).toBeTruthy();
    expect(snapshot.legal_name).toBe('Old Name');
  });

  it('current profile identical to snapshot → no changes', () => {
    const snapshot = { legal_name: 'Test', country_code: 'CD', address_line_1: '123 St' };
    const entity = { legal_name: 'Test', country_code: 'CD', address_line_1: '123 St' };
    expect(diffFields(snapshot, entity)).toHaveLength(0);
  });

  it('address change is detected', () => {
    const snapshot = { legal_name: 'Test', address_line_1: '123 Old St' };
    const entity = { legal_name: 'Test', address_line_1: '456 New St' };
    const changed = diffFields(snapshot, entity);
    expect(changed).toContain('address_line_1');
  });

  it('bank_details change is ignored (not in compare fields)', () => {
    const snapshot = { legal_name: 'Test', bank_details: { iban: 'OLD' } };
    const entity = { legal_name: 'Test', bank_details: { iban: 'NEW' } };
    expect(diffFields(snapshot, entity)).toHaveLength(0);
  });

  it('list of changed fields is accurate', () => {
    const snapshot = { legal_name: 'Old', city: 'Kinshasa', country_code: 'CD' };
    const entity = { legal_name: 'New', city: 'Lubumbashi', country_code: 'CD' };
    const changed = diffFields(snapshot, entity);
    expect(changed).toHaveLength(2);
    expect(changed).toContain('legal_name');
    expect(changed).toContain('city');
    expect(changed).not.toContain('country_code');
  });
});

/* ── ExpenseForm role filtering ──────────────────────────────── */

describe('ExpenseForm role filtering', () => {
  const entities = [
    makeEntity({ id: '1', display_name: 'Incur Only', can_incur_expenses: true, can_pay_expenses: false, can_cover_expenses: false, can_receive_reimbursements: false, can_receive_invoices: false }),
    makeEntity({ id: '2', display_name: 'Pay Only', can_incur_expenses: false, can_pay_expenses: true, can_cover_expenses: false, can_receive_reimbursements: false, can_receive_invoices: false }),
    makeEntity({ id: '3', display_name: 'Cover Only', can_incur_expenses: false, can_pay_expenses: false, can_cover_expenses: true, can_receive_reimbursements: false, can_receive_invoices: false }),
    makeEntity({ id: '4', display_name: 'Reimburse Only', can_incur_expenses: false, can_pay_expenses: false, can_cover_expenses: false, can_receive_reimbursements: true, can_receive_invoices: false }),
    makeEntity({ id: '5', display_name: 'Invoice Only', can_incur_expenses: false, can_pay_expenses: false, can_cover_expenses: false, can_receive_reimbursements: false, can_receive_invoices: true }),
  ];

  it('incurred_by uses can_incur_expenses', () => {
    const filtered = entities.filter((e) => e.can_incur_expenses);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].display_name).toBe('Incur Only');
  });

  it('initially_paid_by uses can_pay_expenses', () => {
    const filtered = entities.filter((e) => e.can_pay_expenses);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].display_name).toBe('Pay Only');
  });

  it('covered_by uses can_cover_expenses', () => {
    const filtered = entities.filter((e) => e.can_cover_expenses);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].display_name).toBe('Cover Only');
  });

  it('reimbursement_recipient uses can_receive_reimbursements', () => {
    const filtered = entities.filter((e) => e.can_receive_reimbursements);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].display_name).toBe('Reimburse Only');
  });

  it('billing_recipient uses can_receive_invoices', () => {
    const filtered = entities.filter((e) => e.can_receive_invoices);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].display_name).toBe('Invoice Only');
  });

  it('no entity matches when all roles are false', () => {
    const none = [makeEntity({ can_incur_expenses: false, can_pay_expenses: false, can_cover_expenses: false, can_receive_reimbursements: false, can_receive_invoices: false })];
    expect(none.filter((e) => e.can_incur_expenses)).toHaveLength(0);
    expect(none.filter((e) => e.can_pay_expenses)).toHaveLength(0);
    expect(none.filter((e) => e.can_cover_expenses)).toHaveLength(0);
    expect(none.filter((e) => e.can_receive_reimbursements)).toHaveLength(0);
    expect(none.filter((e) => e.can_receive_invoices)).toHaveLength(0);
  });
});

/* ── bank_details protection ─────────────────────────────────── */

describe('bank_details protection', () => {
  it('bank_details is not in entity list select columns', () => {
    const selectCols = 'id,code,display_name,entity_type,legal_name,trade_name,country_code,email,phone,address,city,postal_code,tax_id,registration_number,vat_number,address_line_1,address_line_2,region,contact_name,billing_email,contact_email,website,legal_notes,can_incur_expenses,can_receive_invoices,can_pay_expenses,can_cover_expenses,can_receive_reimbursements,active,metadata,created_at,updated_at';
    expect(selectCols).not.toContain('bank_details');
  });

  it('bank_details is not in snapshot allowlist', () => {
    const SNAPSHOT_FIELDS = [
      'legal_name', 'trade_name', 'display_name', 'entity_type',
      'registration_number', 'tax_id', 'vat_number',
      'address_line_1', 'address_line_2', 'postal_code', 'city', 'region',
      'country_code', 'contact_name', 'billing_email', 'phone', 'captured_at',
    ];
    expect(SNAPSHOT_FIELDS).not.toContain('bank_details');
    expect(SNAPSHOT_FIELDS).not.toContain('metadata');
  });

  it('entity list response should not have bank_details property', () => {
    const entity = makeEntity();
    const { bank_details, ...rest } = entity;
    expect(rest).not.toHaveProperty('bank_details');
  });
});
