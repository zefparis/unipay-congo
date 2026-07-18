import type {
  DevExpenseV4,
  ExpenseListResponse,
  ExpenseDetail,
  DevExpensesStats,
  Settlement,
  AuditEvent,
  ExpenseEntity,
  Creditor,
  Quote,
  MonthHistory,
  DevExpenseStatusV4,
  SettlementType,
  SettlementStatus,
} from './types';

export type { DevExpensesStats };

const BASE_V4 = '/api/admin/dev-expenses-v4';
const BASE_LEGACY = '/api/admin/dev-expenses';
const BASE_CREDITORS = '/api/admin/creditors';
const BASE_QUOTES = '/api/admin/quotes';
const BASE_ENTITIES = '/api/admin/expense-entities';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/admin/auth?redirect=' + encodeURIComponent(window.location.pathname);
    }
    throw new ApiError('Session expirée', 401);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new ApiError(err.error ?? `HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/admin/auth?redirect=' + encodeURIComponent(window.location.pathname);
    }
    throw new ApiError('Session expirée', 401);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new ApiError(err.error ?? `HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/admin/auth?redirect=' + encodeURIComponent(window.location.pathname);
    }
    throw new ApiError('Session expirée', 401);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new ApiError(err.error ?? `HTTP ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== undefined && v !== null) {
      qs.set(k, String(v));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/* ── V4 Expenses ──────────────────────────────────────────── */

export function listExpenses(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplier_id?: string;
  incurred_by_entity_id?: string;
  covered_by_entity_id?: string;
  currency?: string;
  date_from?: string;
  date_to?: string;
  archived?: boolean;
  migration_review_required?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<ExpenseListResponse> {
  return get<ExpenseListResponse>(`${BASE_V4}${buildQuery(params)}`);
}

export function getExpenseDetail(id: string): Promise<ExpenseDetail> {
  return get<ExpenseDetail>(`${BASE_V4}/${id}`);
}

export function createExpense(data: Record<string, unknown>): Promise<{ expense: DevExpenseV4 }> {
  return post(`${BASE_V4}`, data);
}

export function updateExpense(id: string, data: Record<string, unknown>): Promise<{ expense: DevExpenseV4 }> {
  return patch(`${BASE_V4}/${id}`, data);
}

export function transitionExpense(
  id: string,
  data: {
    to: DevExpenseStatusV4;
    approved_amount?: number | null;
    reason?: string | null;
    notes?: string | null;
    approved_equals_requested?: boolean;
  },
): Promise<{ expense: DevExpenseV4 }> {
  return post(`${BASE_V4}/${id}/transition`, data);
}

export function listSettlements(expenseId: string): Promise<{ items: Settlement[] }> {
  return get(`${BASE_V4}/${expenseId}/settlements`);
}

export function createSettlement(
  expenseId: string,
  data: {
    settlement_type: SettlementType;
    payer_entity_id?: string | null;
    recipient_entity_id?: string | null;
    amount: number;
    currency?: string;
    payment_method?: string | null;
    transaction_reference?: string | null;
    scheduled_at?: string | null;
    notes?: string | null;
    idempotency_key?: string | null;
  },
): Promise<{ settlement: Settlement }> {
  return post(`${BASE_V4}/${expenseId}/settlements`, data);
}

export function updateSettlement(
  expenseId: string,
  settlementId: string,
  data: {
    status?: SettlementStatus;
    payment_method?: string | null;
    transaction_reference?: string | null;
    scheduled_at?: string | null;
    executed_at?: string | null;
    confirmed_at?: string | null;
    proof_file_url?: string | null;
    notes?: string | null;
  },
): Promise<{ settlement: Settlement }> {
  return patch(`${BASE_V4}/${expenseId}/settlements/${settlementId}`, data);
}

export function listAuditEvents(expenseId: string): Promise<{ items: AuditEvent[] }> {
  return get(`${BASE_V4}/${expenseId}/audit`);
}

export function getStats(): Promise<DevExpensesStats> {
  return get<DevExpensesStats>(`${BASE_V4}/stats`);
}

export function resolveMigrationReview(
  id: string,
  data: {
    status?: DevExpenseStatusV4;
    incurred_by_entity_id?: string | null;
    initially_paid_by_entity_id?: string | null;
    covered_by_entity_id?: string | null;
    reimbursement_recipient_entity_id?: string | null;
    approved_amount?: number | null;
    settled_amount?: number | null;
    notes?: string;
  },
): Promise<{ expense: DevExpenseV4 }> {
  return post(`${BASE_V4}/${id}/resolve-migration-review`, data);
}

/* ── Expense Entities ─────────────────────────────────────── */

export function listEntities(params?: { active?: boolean; entity_type?: string }): Promise<{ items: ExpenseEntity[] }> {
  return get(`${BASE_ENTITIES}${buildQuery(params as Record<string, string | boolean | undefined> ?? {})}`);
}

export function createEntity(data: {
  code: string;
  display_name: string;
  entity_type: string;
  legal_name?: string;
  country_code?: string;
  active?: boolean;
}): Promise<{ entity: ExpenseEntity }> {
  return post(`${BASE_ENTITIES}`, data);
}

export function updateEntity(id: string, data: Record<string, unknown>): Promise<{ entity: ExpenseEntity }> {
  return patch(`${BASE_ENTITIES}/${id}`, data);
}

/* ── Creditors (legacy, still used) ───────────────────────── */

export function listCreditors(): Promise<{ data: Creditor[] }> {
  return get(`${BASE_CREDITORS}`);
}

export function createCreditor(data: Record<string, unknown>): Promise<{ data: Creditor }> {
  return post(`${BASE_CREDITORS}`, data);
}

export function updateCreditor(id: string, data: Record<string, unknown>): Promise<{ data: Creditor }> {
  return patch(`${BASE_CREDITORS}/${id}`, data);
}

/* ── Quotes (legacy, still used) ──────────────────────────── */

export function listQuotes(): Promise<{ data: Quote[] }> {
  return get(`${BASE_QUOTES}`);
}

/* ── Reports (legacy, still used) ─────────────────────────── */

export function listHistory(limit: number = 24): Promise<{ data: MonthHistory[] }> {
  return get(`${BASE_LEGACY}/history?limit=${limit}`);
}

export function generateReport(month: string): Promise<{
  share_url: string;
  total_usd: number;
  pending_warnings?: unknown[];
}> {
  return post(`${BASE_LEGACY}/generate-report`, { month });
}

export { ApiError };
