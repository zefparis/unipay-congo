const BASE = '/api/admin/wallet';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface WalletStats {
  total_users: number;
  kyc_verified: number;
  total_deposited_cdf: number;
  total_withdrawn_cdf: number;
  total_p2p_cdf: number;
  transactions_today: number;
  total_cglt_circulating?: number;
  swaps_today?: number;
  chart: { date: string; collect: number; payout: number; p2p: number }[];
}

export interface SwapRate {
  rate: number;
  fee: number;
  paused: boolean;
  /** Operational hot wallet USDT balance (legacy field name — not a liquidity pool) */
  pool_usdt: number;
  /** Same value as pool_usdt — honest field name, prefer this going forward */
  hot_wallet_usdt: number;
}

export interface WalletUser {
  id: string;
  phone: string;
  full_name: string | null;
  balance_cdf: number;
  kyc_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  kyc_submitted_at?: string | null;
}

export interface WalletTransaction {
  id: string;
  wallet_user_id: string | null;
  direction: 'collect' | 'payout' | 'p2p' | 'swap' | 'p2p_usdt' | 'cglt_gaming_debit' | 'cglt_gaming_credit' | string;
  operator: string;
  phone: string;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  status: string;
  reference: string | null;
  created_at: string;
  updated_at: string;
  swap_direction?: string | null;
  cglt_amount?: number | null;
  usdt_amount?: number | null;
  blockchain_tx_hash?: string | null;
  wallet_users?: { phone: string; full_name: string | null } | null;
}

export interface LedgerEntry {
  id: string;
  direction: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface RevenuePeriod {
  volume:       number;
  frais_avada:  number;
  frais_client: number;
  marge_nette:  number;
  nb_tx:        number;
}

export interface RevenueStats {
  today: RevenuePeriod;
  month: RevenuePeriod;
  all:   RevenuePeriod;
}

export function getStats(): Promise<WalletStats> {
  return get<WalletStats>(`${BASE}/stats`);
}

export function getRevenue(): Promise<RevenueStats> {
  return get<RevenueStats>(`${BASE}/revenue`);
}

export function getSwapRate(): Promise<SwapRate> {
  return get<SwapRate>('/api/wallet/swap-rate');
}

export function getAvadaBalance(): Promise<{ balance: number | null; currency: string; error?: string }> {
  return get<{ balance: number | null; currency: string; error?: string }>(`${BASE}/avada-balance`);
}

export function getUsers(params: Record<string, string | number | boolean>): Promise<{ data: WalletUser[]; pagination: Pagination }> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]),
  );
  return get(`${BASE}/users?${qs}`);
}

export function getUserDetail(id: string): Promise<{ user: WalletUser; transactions: WalletTransaction[]; ledger: LedgerEntry[] }> {
  return get(`${BASE}/users/${id}`);
}

export function blockUser(id: string): Promise<{ ok: boolean }> {
  return post(`${BASE}/users/${id}/block`);
}

export function unblockUser(id: string): Promise<{ ok: boolean }> {
  return post(`${BASE}/users/${id}/unblock`);
}

export function approveUserKyc(id: string): Promise<{ ok: boolean; user: WalletUser }> {
  return post(`${BASE}/users/${id}/kyc/approve`);
}

export function adjustBalance(wallet_user_id: string, amount: number, reason: string): Promise<{ ok: boolean; new_balance_cdf: number }> {
  return post(`${BASE}/adjust`, { wallet_user_id, amount, reason });
}

export function getTransactions(params: Record<string, string | number>): Promise<{ data: WalletTransaction[]; pagination: Pagination }> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]),
  );
  return get(`${BASE}/transactions?${qs}`);
}

export function searchUserByPhone(phone: string): Promise<{ data: WalletUser[]; pagination: Pagination }> {
  return getUsers({ phone, page: 1, limit: 5 });
}

export interface Merchant {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  country: string;
  mode: 'sandbox' | 'live';
  kyc_status: string;
  status: string;
  company_name: string | null;
  company_rccm: string | null;
  company_idnat: string | null;
  kyc_submitted_at: string | null;
  kyc_notes: string | null;
  kyc_reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
  transaction_count?: number;
  total_volume?: number;
  last_transaction_at?: string | null;
  api_key_status?: 'none' | 'active' | 'inactive';
  last_kyc_reminder_count?: number;
  last_kyc_reminder_at?: string | null;
  settlement_phone?: string | null;
  webhook_url?: string | null;
  webhook_secret?: string | null;
}

export interface MerchantStats {
  total_merchants: number;
  mode_breakdown: { sandbox: number; live: number };
  kyc_breakdown: { pending: number; submitted: number; approved: number };
  volume_30d: Record<string, number>;
  transactions_today: number;
}

export interface MerchantApiKey {
  id: string;
  key_prefix: string;
  label: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface MerchantTransaction {
  id: string;
  merchant_id: string;
  direction: 'collect' | 'payout';
  operator: string;
  phone: string;
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  status: string;
  reference: string | null;
  avada_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  merchants?: { name: string; email: string }[] | null;
}

export interface MerchantBalance {
  currency: string;
  balance: number;
  total_credits: number;
  total_settlements: number;
}

export interface SettlementRequest {
  id: string;
  amount: number;
  currency: string;
  phone: string;
  status: string;
  provider_ref: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function getMerchants(params?: Record<string, string | number>): Promise<{ data: Merchant[]; pagination: Pagination }> {
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== '' && v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)]),
    );
    return get(`${BASE}/merchants?${qs}`);
  }
  return get(`${BASE}/merchants`);
}

export function getMerchantStats(): Promise<MerchantStats> {
  return get<MerchantStats>(`${BASE}/merchants/stats`);
}

export function getMerchantDetail(id: string): Promise<{ merchant: Merchant; api_keys: MerchantApiKey[]; transactions: MerchantTransaction[]; balances: MerchantBalance[]; settlement_requests: SettlementRequest[] }> {
  return get(`${BASE}/merchants/${id}`);
}

export function getMerchantTransactions(params: Record<string, string | number>): Promise<{ data: MerchantTransaction[]; pagination: Pagination }> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== '' && v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]),
  );
  return get(`${BASE}/merchants/transactions?${qs}`);
}

export function revokeApiKey(merchantId: string, keyId: string): Promise<{ ok: boolean; key: MerchantApiKey }> {
  return post(`${BASE}/merchants/${merchantId}/api-keys/revoke`, { key_id: keyId });
}

export function regenerateApiKey(merchantId: string, label?: string): Promise<{ ok: boolean; api_key: string; key_prefix: string; label: string; note: string }> {
  return post(`${BASE}/merchants/${merchantId}/api-keys/regenerate`, label ? { label } : {});
}

export function suspendMerchant(id: string): Promise<{ ok: boolean; merchant: Merchant }> {
  return post(`${BASE}/merchants/${id}/suspend`);
}

export function reactivateMerchant(id: string): Promise<{ ok: boolean; merchant: Merchant }> {
  return post(`${BASE}/merchants/${id}/reactivate`);
}

export interface SettlementResult {
  request_id: string;
  status: string;
  amount: number;
  currency: string;
  provider_ref?: string;
  balance_after?: number;
  auto_payout?: boolean;
  idempotent?: boolean;
  error?: string;
  message?: string;
}

export function settleMerchant(
  id: string,
  body: { amount?: number; currency?: string; phone?: string; operator?: string },
): Promise<SettlementResult> {
  return post(`${BASE}/merchants/${id}/settle`, body);
}

export interface MerchantStatsOperator {
  operator: string;
  total_attempts: number;
  success_count: number;
  failed_count: number;
  processing_count: number;
  provider_outage_failures: number;
  client_error_failures: number;
  success_rate_pct: number | null;
}

export interface MerchantStats {
  window: string;
  window_days: number;
  totals: {
    total_attempts: number;
    success_count: number;
    failed_count: number;
    processing_count: number;
    provider_outage_failures: number;
    client_error_failures: number;
    success_rate_pct: number | null;
  };
  operators: MerchantStatsOperator[];
}

export async function getMerchantStatsById(id: string, window: '7d' | '30d' = '7d'): Promise<MerchantStats> {
  const res = await fetch(`/api/admin/wallet/merchants/${id}/stats?window=${window}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  return res.json();
}

export function setMerchantMode(id: string, mode: 'sandbox' | 'live'): Promise<{ ok: boolean; merchant: Merchant }> {
  return post<{ ok: boolean; merchant: Merchant }>(`${BASE}/merchants/${id}/mode`, { mode });
}

export function approveKyc(id: string): Promise<{ ok: boolean; merchant: Partial<Merchant> }> {
  return post<{ ok: boolean; merchant: Partial<Merchant> }>(`${BASE}/merchants/${id}/kyc/approve`);
}

export function rejectKyc(id: string, notes?: string): Promise<{ ok: boolean; merchant: Partial<Merchant> }> {
  return post<{ ok: boolean; merchant: Partial<Merchant> }>(`${BASE}/merchants/${id}/kyc/reject`, { notes });
}
