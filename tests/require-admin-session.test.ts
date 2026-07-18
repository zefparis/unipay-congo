import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requireAdminSession } from '@/lib/require-admin-session';
import { createSessionToken } from '@/lib/admin-session';
import { NextRequest } from 'next/server';

const ADMIN_SECRET = 'test-secret-for-vitest';

function makeRequest(cookieValue?: string): NextRequest {
  const headers = new Headers();
  if (cookieValue !== undefined) {
    headers.set('cookie', `admin_session=${cookieValue}`);
  }
  return new NextRequest('http://localhost:3000/api/admin/test', {
    headers,
  });
}

describe('requireAdminSession', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_SECRET', ADMIN_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 401 when cookie is absent', async () => {
    const request = makeRequest(undefined);
    const result = await requireAdminSession(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const json = await result.response.json();
      expect(json.code).toBe('ADMIN_SESSION_REQUIRED');
    }
  });

  it('returns 401 when cookie is invalid', async () => {
    const request = makeRequest('invalid.token.value');
    const result = await requireAdminSession(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns 401 when cookie is expired', async () => {
    // Create a token with an old timestamp (9 hours ago = beyond 8h TTL)
    const enc = new TextEncoder();
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const random = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const oldTs = Math.floor((Date.now() / 1000) - 9 * 60 * 60).toString(16);

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode('admin-session-signing-key' + ADMIN_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${random}.${oldTs}`));
    const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    const expiredToken = `${random}.${oldTs}.${sigHex}`;

    const request = makeRequest(expiredToken);
    const result = await requireAdminSession(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns ok when cookie is valid', async () => {
    const token = await createSessionToken();
    const request = makeRequest(token);
    const result = await requireAdminSession(request);
    expect(result.ok).toBe(true);
  });

  it('does not log the token', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const token = await createSessionToken();
    const request = makeRequest(token);
    await requireAdminSession(request);
    const allCalls = [...consoleSpy.mock.calls, ...consoleErrorSpy.mock.calls];
    for (const call of allCalls) {
      const str = JSON.stringify(call);
      expect(str).not.toContain(token);
    }
  });
});
