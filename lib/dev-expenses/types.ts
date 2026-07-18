export type DevExpenseStatusV4 =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'payment_scheduled'
  | 'partially_paid'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'archived';

export type InitialPaymentStatus =
  | 'unpaid'
  | 'paid_by_incurred_entity'
  | 'paid_by_covering_entity'
  | 'paid_by_third_party'
  | 'unknown';

export type SettlementType =
  | 'supplier_payment'
  | 'reimbursement'
  | 'partial_reimbursement'
  | 'internal_offset'
  | 'adjustment'
  | 'other';

export type SettlementStatus =
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ActorType = 'admin' | 'system' | 'cron' | 'migration' | 'api';

export interface DevExpenseV4 {
  id: string;
  title: string | null;
  description: string | null;
  category: string;
  creditor_id: string | null;
  project_code: string;
  project_ref: string | null;
  quote_id: string | null;
  billing_month: string;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  incurred_by_entity_id: string | null;
  initially_paid_by_entity_id: string | null;
  covered_by_entity_id: string | null;
  reimbursement_recipient_entity_id: string | null;
  billing_recipient_entity_id: string | null;
  billing_recipient_snapshot: Record<string, unknown> | null;
  billing_recipient_reviewed: boolean;
  amount_usd: number;
  invoice_amount: number | null;
  invoice_currency: string;
  requested_amount: number | null;
  approved_amount: number | null;
  settled_amount: number;
  initial_payment_status: InitialPaymentStatus | null;
  initial_payment_method: string | null;
  status_v4: DevExpenseStatusV4 | null;
  status: string;
  submitted_at: string | null;
  review_started_at: string | null;
  approved_at: string | null;
  payment_scheduled_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  rejection_reason: string | null;
  dispute_reason: string | null;
  internal_notes_v4: string | null;
  migration_review_required: boolean;
  migration_notes: string | null;
  legacy_status: string | null;
  legacy_funded_by: string | null;
  legacy_paid_by: string | null;
  archived: boolean;
  archived_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settlement {
  id: string;
  expense_id: string;
  settlement_type: SettlementType;
  payer_entity_id: string | null;
  recipient_entity_id: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  transaction_reference: string | null;
  status: SettlementStatus;
  scheduled_at: string | null;
  executed_at: string | null;
  confirmed_at: string | null;
  proof_file_url: string | null;
  notes: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  expense_id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string | null;
  actor_type: ActorType;
  actor_id: string | null;
  actor_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ExpenseEntity {
  id: string;
  code: string;
  display_name: string;
  entity_type: string;
  legal_name: string | null;
  trade_name: string | null;
  country_code: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  tax_id: string | null;
  // New legal profile fields
  registration_number: string | null;
  vat_number: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  region: string | null;
  contact_name: string | null;
  billing_email: string | null;
  contact_email: string | null;
  website: string | null;
  legal_notes: string | null;
  // Role capabilities
  can_incur_expenses: boolean;
  can_receive_invoices: boolean;
  can_pay_expenses: boolean;
  can_cover_expenses: boolean;
  can_receive_reimbursements: boolean;
  // Sensitive — never exposed in lists
  bank_details: Record<string, unknown>;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Creditor {
  id: string;
  name: string;
  entity_type: string;
  contact_email?: string | null;
  payment_method?: string | null;
  default_category?: string | null;
  notes?: string | null;
  active: boolean;
}

export interface Quote {
  id: string;
  creditor_id: string | null;
  creditor_name: string | null;
  project_ref: string;
  category: string | null;
  amount_usd: number;
  description: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string | null;
  quote_file_url: string | null;
  converted_expense_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  creditors?: { id: string; name: string; entity_type: string } | null;
}

export interface ExpenseDetail {
  expense: DevExpenseV4;
  settlements: Settlement[];
  audit_events: AuditEvent[];
  entities: Record<string, ExpenseEntity>;
  quote: Quote | null;
  expected_amount: number;
  remaining_amount: number;
  allowed_transitions: DevExpenseStatusV4[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ExpenseListResponse {
  items: DevExpenseV4[];
  pagination: Pagination;
}

export interface DevExpensesStats {
  total_engaged: Record<string, number>;
  awaiting_validation: Record<string, number>;
  approved_to_pay: Record<string, number>;
  payment_scheduled: Record<string, number>;
  settled_this_month: Record<string, number>;
  remaining_due: Record<string, number>;
  overdue_count: number;
  migration_review_count: number;
}

export interface MonthHistory {
  billing_month: string;
  invoice_count: number;
  creditor_count: number;
  total_usd: number;
  global_status: 'pending' | 'ready';
  share_token: string | null;
  share_url: string | null;
  generated_at: string | null;
}
