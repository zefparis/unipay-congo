import { describe, it, expect } from 'vitest';
import {
  STATUS_MAP,
  VISUAL_STATUS_CONFIG,
  getVisualStatus,
  getStatusLabel,
  getTechnicalStatusLabel,
  SETTLEMENT_TYPE_LABELS,
  SETTLEMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  INITIAL_PAYMENT_STATUS_LABELS,
  CREDITOR_TYPE_LABELS,
} from '@/lib/dev-expenses/labels';
import type { DevExpenseStatusV4 } from '@/lib/dev-expenses/types';

describe('STATUS_MAP', () => {
  it('maps draft to draft', () => {
    expect(STATUS_MAP.draft).toBe('draft');
  });

  it('maps submitted and under_review to to_validate', () => {
    expect(STATUS_MAP.submitted).toBe('to_validate');
    expect(STATUS_MAP.under_review).toBe('to_validate');
  });

  it('maps approved and partially_approved to validated', () => {
    expect(STATUS_MAP.approved).toBe('validated');
    expect(STATUS_MAP.partially_approved).toBe('validated');
  });

  it('maps payment_scheduled and partially_paid to payment_in_progress', () => {
    expect(STATUS_MAP.payment_scheduled).toBe('payment_in_progress');
    expect(STATUS_MAP.partially_paid).toBe('payment_in_progress');
  });

  it('maps completed to completed', () => {
    expect(STATUS_MAP.completed).toBe('completed');
  });

  it('maps all statuses', () => {
    const allStatuses: DevExpenseStatusV4[] = [
      'draft', 'submitted', 'under_review', 'approved', 'partially_approved',
      'rejected', 'payment_scheduled', 'partially_paid', 'completed',
      'disputed', 'cancelled', 'archived',
    ];
    for (const s of allStatuses) {
      expect(STATUS_MAP[s]).toBeDefined();
    }
  });
});

describe('VISUAL_STATUS_CONFIG', () => {
  it('has all visual statuses', () => {
    expect(VISUAL_STATUS_CONFIG.draft).toBeDefined();
    expect(VISUAL_STATUS_CONFIG.to_validate).toBeDefined();
    expect(VISUAL_STATUS_CONFIG.validated).toBeDefined();
    expect(VISUAL_STATUS_CONFIG.payment_in_progress).toBeDefined();
    expect(VISUAL_STATUS_CONFIG.completed).toBeDefined();
    expect(VISUAL_STATUS_CONFIG.rejected).toBeDefined();
    expect(VISUAL_STATUS_CONFIG.disputed).toBeDefined();
    expect(VISUAL_STATUS_CONFIG.cancelled).toBeDefined();
    expect(VISUAL_STATUS_CONFIG.archived).toBeDefined();
  });

  it('each config has label, cls, and dot', () => {
    for (const cfg of Object.values(VISUAL_STATUS_CONFIG)) {
      expect(cfg.label).toBeTruthy();
      expect(cfg.cls).toBeTruthy();
      expect(cfg.dot).toBeTruthy();
    }
  });
});

describe('getVisualStatus', () => {
  it('returns null for null input', () => {
    expect(getVisualStatus(null)).toBeNull();
  });

  it('returns correct visual status', () => {
    expect(getVisualStatus('draft')).toBe('draft');
    expect(getVisualStatus('submitted')).toBe('to_validate');
    expect(getVisualStatus('completed')).toBe('completed');
  });
});

describe('getStatusLabel', () => {
  it('returns À vérifier for null', () => {
    expect(getStatusLabel(null)).toBe('À vérifier');
  });

  it('returns correct label', () => {
    expect(getStatusLabel('draft')).toBe('Brouillon');
    expect(getStatusLabel('completed')).toBe('Terminée');
  });
});

describe('getTechnicalStatusLabel', () => {
  it('returns correct technical label', () => {
    expect(getTechnicalStatusLabel('under_review')).toBe('En cours de vérification');
    expect(getTechnicalStatusLabel('partially_approved')).toBe('Validée partiellement');
  });
});

describe('SETTLEMENT_TYPE_LABELS', () => {
  it('has supplier_payment and reimbursement', () => {
    expect(SETTLEMENT_TYPE_LABELS.supplier_payment).toBe('Paiement fournisseur');
    expect(SETTLEMENT_TYPE_LABELS.reimbursement).toBe('Remboursement');
  });
});

describe('PAYMENT_METHOD_LABELS', () => {
  it('has bank_transfer', () => {
    expect(PAYMENT_METHOD_LABELS.bank_transfer).toBe('Virement bancaire');
  });

  it('has usdt', () => {
    expect(PAYMENT_METHOD_LABELS.usdt).toBe('USDT');
  });
});

describe('INITIAL_PAYMENT_STATUS_LABELS', () => {
  it('has unpaid', () => {
    expect(INITIAL_PAYMENT_STATUS_LABELS.unpaid).toBe('Non payée');
  });
});

describe('CREDITOR_TYPE_LABELS', () => {
  it('has cloud_provider', () => {
    expect(CREDITOR_TYPE_LABELS.cloud_provider).toBe('Fournisseur cloud');
  });
});
