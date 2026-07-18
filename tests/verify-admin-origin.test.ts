import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyAdminOrigin } from '@/lib/verify-admin-origin';
import { NextRequest } from 'next/server';

function makeRequest(
  method: string,
  origin?: string,
  referer?: string,
): NextRequest {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  if (referer) headers.set('referer', referer);
  return new NextRequest('http://localhost:3000/api/admin/test', {
    method,
    headers,
  });
}

describe('verifyAdminOrigin', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_ALLOWED_ORIGINS', 'https://unipay-congo.example.com,http://localhost:3000');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://unipay-congo.example.com');
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('allows POST with authorized origin', () => {
    const req = makeRequest('POST', 'http://localhost:3000');
    const result = verifyAdminOrigin(req);
    expect(result).toBeNull();
  });

  it('allows PATCH with authorized origin', () => {
    const req = makeRequest('PATCH', 'https://unipay-congo.example.com');
    const result = verifyAdminOrigin(req);
    expect(result).toBeNull();
  });

  it('rejects POST with foreign origin', () => {
    const req = makeRequest('POST', 'https://evil.com');
    const result = verifyAdminOrigin(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('rejects DELETE with foreign origin', () => {
    const req = makeRequest('DELETE', 'https://evil.com');
    const result = verifyAdminOrigin(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('allows GET without origin', () => {
    const req = makeRequest('GET');
    const result = verifyAdminOrigin(req);
    expect(result).toBeNull();
  });

  it('allows localhost in non-production environment', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ADMIN_ALLOWED_ORIGINS', '');
    const req = makeRequest('POST', 'http://localhost:3000');
    const result = verifyAdminOrigin(req);
    expect(result).toBeNull();
  });

  it('allows POST with no origin or referer (same-origin fallback)', () => {
    const req = makeRequest('POST');
    const result = verifyAdminOrigin(req);
    expect(result).toBeNull();
  });

  it('rejects POST with no origin/referer when request URL not in allowed list', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_ALLOWED_ORIGINS', 'https://unipay-congo.example.com');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://unipay-congo.example.com');
    const req = new NextRequest('http://localhost:3000/api/admin/test', {
      method: 'POST',
      headers: new Headers(),
    });
    const result = verifyAdminOrigin(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('uses referer as fallback when origin is missing', () => {
    const req = makeRequest('POST', undefined, 'http://localhost:3000/api/admin/test');
    const result = verifyAdminOrigin(req);
    expect(result).toBeNull();
  });

  it('normalizes trailing slashes in ADMIN_ALLOWED_ORIGINS', () => {
    vi.stubEnv('ADMIN_ALLOWED_ORIGINS', 'https://unipay-congo.example.com/');
    const req = makeRequest('POST', 'https://unipay-congo.example.com');
    const result = verifyAdminOrigin(req);
    expect(result).toBeNull();
  });

  it('normalizes trailing slashes in NEXT_PUBLIC_APP_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://unipay-congo.example.com/');
    vi.stubEnv('ADMIN_ALLOWED_ORIGINS', '');
    const req = makeRequest('POST', 'https://unipay-congo.example.com');
    const result = verifyAdminOrigin(req);
    expect(result).toBeNull();
  });

  it('allows VERCEL_URL as origin', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_ALLOWED_ORIGINS', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_URL', 'unipay-congo-abc.vercel.app');
    const req = makeRequest('POST', 'https://unipay-congo-abc.vercel.app');
    const result = verifyAdminOrigin(req);
    expect(result).toBeNull();
  });

  it('includes detail in 403 response for debugging', () => {
    const req = makeRequest('POST', 'https://evil.com');
    const result = verifyAdminOrigin(req);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });
});
