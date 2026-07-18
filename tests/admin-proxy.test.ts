import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adminProxyFetch } from '@/lib/admin-proxy';
import { NextRequest } from 'next/server';

const ADMIN_SECRET = 'test-secret-for-vitest';
const API_URL = 'http://localhost:9999';

function mockFetch(
  status: number,
  body: unknown,
  contentType: string = 'application/json',
): ReturnType<typeof vi.fn> {
  const response = {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers({ 'content-type': contentType }),
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
  return vi.fn().mockResolvedValue(response as unknown as Response);
}

describe('adminProxyFetch', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_SECRET', ADMIN_SECRET);
    vi.stubEnv('API_URL', API_URL);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('propagates JSON 200 response', async () => {
    const mocked = mockFetch(200, { data: 'ok' });
    vi.stubGlobal('fetch', mocked);
    const res = await adminProxyFetch('/v1/admin/test', { method: 'GET' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ data: 'ok' });
  });

  it('propagates JSON 400 error response', async () => {
    const mocked = mockFetch(400, { error: 'Bad request' });
    vi.stubGlobal('fetch', mocked);
    const res = await adminProxyFetch('/v1/admin/test', { method: 'POST', body: {} });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Bad request');
  });

  it('handles empty body response', async () => {
    const mocked = mockFetch(204, '', 'application/json');
    vi.stubGlobal('fetch', mocked);
    const res = await adminProxyFetch('/v1/admin/test', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('normalizes HTML 502 response', async () => {
    const mocked = mockFetch(502, '<html>error</html>', 'text/html');
    vi.stubGlobal('fetch', mocked);
    const res = await adminProxyFetch('/v1/admin/test', { method: 'GET' });
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.code).toBe('ADMIN_UPSTREAM_ERROR');
  });

  it('returns 504 on timeout', async () => {
    const mocked = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const err = new DOMException('Aborted', 'AbortError');
          reject(err);
        });
      });
    });
    vi.stubGlobal('fetch', mocked);
    const res = await adminProxyFetch('/v1/admin/test', {
      method: 'GET',
      timeoutMs: 50,
    });
    expect(res.status).toBe(504);
    const json = await res.json();
    expect(json.code).toBe('ADMIN_UPSTREAM_TIMEOUT');
  });

  it('returns 502 on network error', async () => {
    const mocked = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    vi.stubGlobal('fetch', mocked);
    const res = await adminProxyFetch('/v1/admin/test', { method: 'GET' });
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.code).toBe('ADMIN_UPSTREAM_UNAVAILABLE');
  });

  it('returns 503 when ADMIN_SECRET is missing', async () => {
    vi.stubEnv('ADMIN_SECRET', '');
    const res = await adminProxyFetch('/v1/admin/test', { method: 'GET' });
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe('ADMIN_NOT_CONFIGURED');
  });

  it('adds x-admin-secret header server-side', async () => {
    const mocked = mockFetch(200, { ok: true });
    vi.stubGlobal('fetch', mocked);
    await adminProxyFetch('/v1/admin/test', { method: 'GET' });
    const call = mocked.mock.calls[0];
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers as HeadersInit);
    expect(headers.get('x-admin-secret')).toBe(ADMIN_SECRET);
  });

  it('transmits JSON body with Content-Type', async () => {
    const mocked = mockFetch(200, { ok: true });
    vi.stubGlobal('fetch', mocked);
    await adminProxyFetch('/v1/admin/test', {
      method: 'POST',
      body: { name: 'test' },
    });
    const call = mocked.mock.calls[0];
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers as HeadersInit);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ name: 'test' }));
  });

  it('transmits FormData without forcing Content-Type', async () => {
    const mocked = mockFetch(200, { ok: true });
    vi.stubGlobal('fetch', mocked);
    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.pdf');
    await adminProxyFetch('/v1/admin/test', {
      method: 'POST',
      body: formData,
    });
    const call = mocked.mock.calls[0];
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers as HeadersInit);
    expect(headers.get('Content-Type')).toBeNull();
    expect(init.body).toBe(formData);
  });

  it('preserves query string in backend path', async () => {
    const mocked = mockFetch(200, { ok: true });
    vi.stubGlobal('fetch', mocked);
    await adminProxyFetch('/v1/admin/test?foo=bar', { method: 'GET' });
    const url = mocked.mock.calls[0][0] as string;
    expect(url).toContain('foo=bar');
  });

  it('ADMIN_SECRET is not in the response', async () => {
    const mocked = mockFetch(200, { ok: true });
    vi.stubGlobal('fetch', mocked);
    const res = await adminProxyFetch('/v1/admin/test', { method: 'GET' });
    const text = await res.text();
    expect(text).not.toContain(ADMIN_SECRET);
  });
});
