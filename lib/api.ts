const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export interface Transaction {
  id: string;
  operator: string;
  direction: 'collect' | 'payout';
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  phone: string;
  reference: string | null;
  avada_transaction_id: string | null;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface BalanceResponse {
  merchant_id: string;
  balance_cdf: number;
  currency: string;
}

export interface ApiKeyResponse {
  api_key: string;
  key_prefix: string;
  label: string;
  note: string;
}

export interface TransactionParams {
  page?: number;
  limit?: number;
  status?: string;
  operator?: string;
  direction?: string;
}

async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, token: string, body?: object): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function getBalance(token: string): Promise<BalanceResponse> {
  return apiGet<BalanceResponse>('/v1/merchant/balance', token);
}

export function getTransactions(token: string, params: TransactionParams = {}): Promise<TransactionsResponse> {
  const p = new URLSearchParams();
  if (params.page) p.set('page', String(params.page));
  if (params.limit) p.set('limit', String(params.limit));
  if (params.status) p.set('status', params.status);
  if (params.operator) p.set('operator', params.operator);
  if (params.direction) p.set('direction', params.direction);
  return apiGet<TransactionsResponse>(`/v1/merchant/transactions${p.size ? `?${p}` : ''}`, token);
}

export function generateApiKey(token: string, label = 'default'): Promise<ApiKeyResponse> {
  return apiPost<ApiKeyResponse>('/v1/merchant/apikey', token, { label });
}
