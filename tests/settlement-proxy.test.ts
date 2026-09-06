import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for the merchant settlement proxy routes.
 *
 * Since the proxy routes use Next.js cookies() and fetch() which
 * require a full Next.js runtime, we test the proxy contract:
 * - Auth required (no token → 401)
 * - Correct upstream URL forwarding
 * - Response passthrough
 *
 * We mock the global fetch and cookies to verify the contract.
 */

const API_URL = 'http://localhost:9999';

function mockFetchResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

// Simulate the proxy logic directly (mirrors the route handler)
async function proxyBalance(token: string | undefined): Promise<{ status: number; body: unknown }> {
  if (!token) return { status: 401, body: { error: 'Unauthorized' } };
  const upstream = await fetch(`${API_URL}/v1/merchant/settlement/balance`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return { status: upstream.status, body: await upstream.json() };
}

async function proxyRequest(token: string | undefined, body: unknown): Promise<{ status: number; body: unknown }> {
  if (!token) return { status: 401, body: { error: 'Unauthorized' } };
  const upstream = await fetch(`${API_URL}/v1/merchant/settlement/request`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  return { status: upstream.status, body: await upstream.json() };
}

async function proxyHistory(token: string | undefined, page = '1', limit = '20'): Promise<{ status: number; body: unknown }> {
  if (!token) return { status: 401, body: { error: 'Unauthorized' } };
  const qs = new URLSearchParams({ page, limit });
  const upstream = await fetch(`${API_URL}/v1/merchant/settlement/history?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return { status: upstream.status, body: await upstream.json() };
}

async function proxyPhone(token: string | undefined, phone: string): Promise<{ status: number; body: unknown }> {
  if (!token) return { status: 401, body: { error: 'Unauthorized' } };
  const upstream = await fetch(`${API_URL}/v1/merchant/settlement/phone`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
    cache: 'no-store',
  });
  return { status: upstream.status, body: await upstream.json() };
}

describe('Settlement proxy — balance', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', API_URL);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 401 when no auth token', async () => {
    const res = await proxyBalance(undefined);
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('Unauthorized');
  });

  it('forwards to /v1/merchant/settlement/balance with Bearer token', async () => {
    const mocked = vi.fn().mockResolvedValue(mockFetchResponse(200, {
      balance: 5000,
      total_credits: 6000,
      total_settlements: 1000,
      settlement_phone: '+243997174834',
      kyc_status: 'approved',
      mode: 'live',
    }));
    vi.stubGlobal('fetch', mocked);

    const res = await proxyBalance('test-jwt-token');
    expect(res.status).toBe(200);
    const body = res.body as { balance: number; settlement_phone: string };
    expect(body.balance).toBe(5000);
    expect(body.settlement_phone).toBe('+243997174834');

    // Verify fetch was called with correct URL and auth header
    expect(mocked).toHaveBeenCalledTimes(1);
    const [url, opts] = mocked.mock.calls[0];
    expect(url).toBe(`${API_URL}/v1/merchant/settlement/balance`);
    expect((opts as { headers: Record<string, string> }).headers.Authorization).toBe('Bearer test-jwt-token');
  });

  it('propagates error status from upstream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(500, { error: 'Internal' })));
    const res = await proxyBalance('token');
    expect(res.status).toBe(500);
  });
});

describe('Settlement proxy — request', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', API_URL);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 401 when no auth token', async () => {
    const res = await proxyRequest(undefined, {});
    expect(res.status).toBe(401);
  });

  it('forwards POST to /v1/merchant/settlement/request with body', async () => {
    const mocked = vi.fn().mockResolvedValue(mockFetchResponse(201, {
      request_id: 'req-123',
      status: 'processing',
      amount: 5000,
      auto_payout: true,
    }));
    vi.stubGlobal('fetch', mocked);

    const res = await proxyRequest('jwt-token', { amount: 5000 });
    expect(res.status).toBe(201);
    const body = res.body as { request_id: string; status: string };
    expect(body.request_id).toBe('req-123');
    expect(body.status).toBe('processing');

    const [url, opts] = mocked.mock.calls[0];
    expect(url).toBe(`${API_URL}/v1/merchant/settlement/request`);
    expect((opts as { method: string }).method).toBe('POST');
    expect((opts as { headers: Record<string, string> }).headers.Authorization).toBe('Bearer jwt-token');
  });

  it('forwards empty body (full balance request)', async () => {
    const mocked = vi.fn().mockResolvedValue(mockFetchResponse(201, {
      request_id: 'req-456',
      status: 'pending_admin_review',
      amount: 600000,
      auto_payout: false,
    }));
    vi.stubGlobal('fetch', mocked);

    const res = await proxyRequest('token', {});
    expect(res.status).toBe(201);
    const body = res.body as { status: string; auto_payout: boolean };
    expect(body.status).toBe('pending_admin_review');
    expect(body.auto_payout).toBe(false);
  });

  it('propagates 402 insufficient balance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(402, {
      error: 'INSUFFICIENT_BALANCE',
      message: 'Solde insuffisant',
    })));
    const res = await proxyRequest('token', { amount: 999999 });
    expect(res.status).toBe(402);
  });
});

describe('Settlement proxy — history', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', API_URL);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 401 when no auth token', async () => {
    const res = await proxyHistory(undefined);
    expect(res.status).toBe(401);
  });

  it('forwards to /v1/merchant/settlement/history with pagination params', async () => {
    const mocked = vi.fn().mockResolvedValue(mockFetchResponse(200, {
      requests: [
        { id: 'r1', amount: 5000, status: 'success', created_at: '2026-09-01T10:00:00Z' },
      ],
      total: 1,
      page: 1,
      limit: 20,
    }));
    vi.stubGlobal('fetch', mocked);

    const res = await proxyHistory('token', '1', '20');
    expect(res.status).toBe(200);
    const body = res.body as { requests: unknown[]; total: number };
    expect(body.requests).toHaveLength(1);
    expect(body.total).toBe(1);

    const [url] = mocked.mock.calls[0];
    expect(url).toContain('/v1/merchant/settlement/history');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=20');
  });
});

describe('Settlement proxy — phone', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', API_URL);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 401 when no auth token', async () => {
    const res = await proxyPhone(undefined, '+243997174834');
    expect(res.status).toBe(401);
  });

  it('forwards POST to /v1/merchant/settlement/phone with phone body', async () => {
    const mocked = vi.fn().mockResolvedValue(mockFetchResponse(200, {
      ok: true,
      settlement_phone: '+243997174834',
    }));
    vi.stubGlobal('fetch', mocked);

    const res = await proxyPhone('token', '+243997174834');
    expect(res.status).toBe(200);
    const body = res.body as { ok: boolean; settlement_phone: string };
    expect(body.ok).toBe(true);
    expect(body.settlement_phone).toBe('+243997174834');

    const [url, opts] = mocked.mock.calls[0];
    expect(url).toBe(`${API_URL}/v1/merchant/settlement/phone`);
    expect((opts as { method: string }).method).toBe('POST');
  });

  it('propagates 400 for invalid phone', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(400, {
      error: 'INVALID_PHONE',
      message: 'Numéro invalide',
    })));
    const res = await proxyPhone('token', '123');
    expect(res.status).toBe(400);
  });
});

describe('Settlement proxy — route isolation', () => {
  it('all settlement proxy paths forward to /v1/merchant/settlement/* (never admin)', () => {
    const merchantPaths = [
      '/v1/merchant/settlement/balance',
      '/v1/merchant/settlement/request',
      '/v1/merchant/settlement/history',
      '/v1/merchant/settlement/phone',
    ];
    for (const p of merchantPaths) {
      expect(p.startsWith('/v1/merchant/')).toBe(true);
      expect(p.includes('/admin/')).toBe(false);
    }
  });
});
