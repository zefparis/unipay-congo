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
  chart: { date: string; collect: number; payout: number; p2p: number }[];
}

export interface WalletUser {
  id: string;
  phone: string;
  full_name: string | null;
  email: string | null;
  balance_cdf: number;
  kyc_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  kyc_submitted_at?: string | null;
  kyc_approved_at?: string | null;
  kyc_document_urls?: string[] | null;
}

export interface WalletTransaction {
  id: string;
  wallet_user_id: string | null;
  direction: 'collect' | 'payout' | 'p2p';
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

export function getStats(): Promise<WalletStats> {
  return get<WalletStats>(`${BASE}/stats`);
}

export function getAvadaBalance(): Promise<{ balance: number; currency: string }> {
  return get<{ balance: number; currency: string }>(`${BASE}/avada-balance`);
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
  mode: 'sandbox' | 'live';
  kyc_status: string;
  status: string;
  company_name: string | null;
  company_rccm: string | null;
  company_idnat: string | null;
  kyc_submitted_at: string | null;
  kyc_notes: string | null;
}

export function getMerchants(): Promise<{ data: Merchant[] }> {
  return get<{ data: Merchant[] }>(`${BASE}/merchants`);
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
