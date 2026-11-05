import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { signedClientIpHeaders } from '../lib/bff-client-ip';

const SECRET = 'test-bff-secret-vitest-0123456789';
const sign = (ip: string) => crypto.createHmac('sha256', SECRET).update(ip).digest('hex');

function req(headers: Record<string, string>, ip?: string): NextRequest {
  const h = new Map(Object.entries(headers.mapKeys ? {} : headers));
  return {
    headers: { get: (k: string) => h.get(k.toLowerCase()) ?? null },
    ip,
  } as unknown as NextRequest;
}

beforeAll(() => { process.env.BFF_IP_SECRET = SECRET; });

describe('signedClientIpHeaders — extraction IP réelle', () => {
  it('utilise cf-connecting-ip sur le domaine prod (chaîne Cloudflare→Vercel)', () => {
    const r = req({ host: 'www.unipaycongo.com', 'cf-connecting-ip': '41.10.20.30', 'x-forwarded-for': '1.1.1.1' });
    const out = signedClientIpHeaders(r);
    expect(out['x-unipay-client-ip']).toBe('41.10.20.30');
    expect(out['x-unipay-client-sig']).toBe(sign('41.10.20.30'));
  });

  it('ignore un x-forwarded-for forgé (jamais utilisé)', () => {
    const r = req({ host: 'www.unipaycongo.com', 'cf-connecting-ip': '41.10.20.30', 'x-forwarded-for': '9.9.9.9, 8.8.8.8' });
    expect(signedClientIpHeaders(r)['x-unipay-client-ip']).toBe('41.10.20.30');
  });

  it('cf-connecting-ip forgé ignoré sur *.vercel.app (bypass CF → x-real-ip)', () => {
    const r = req({ host: 'unipay-congo-git-x.vercel.app', 'cf-connecting-ip': '6.6.6.6', 'x-real-ip': '203.0.113.7' });
    expect(signedClientIpHeaders(r)['x-unipay-client-ip']).toBe('203.0.113.7');
  });

  it('repli sur x-real-ip sans cf-connecting-ip', () => {
    const r = req({ host: 'www.unipaycongo.com', 'x-real-ip': '198.51.100.4' });
    expect(signedClientIpHeaders(r)['x-unipay-client-ip']).toBe('198.51.100.4');
  });

  it('pas d\'en-têtes si le secret est absent', () => {
    const prev = process.env.BFF_IP_SECRET; delete process.env.BFF_IP_SECRET;
    expect(signedClientIpHeaders(req({ host: 'www.unipaycongo.com', 'cf-connecting-ip': '1.2.3.4' }))).toEqual({});
    process.env.BFF_IP_SECRET = prev;
  });
});
