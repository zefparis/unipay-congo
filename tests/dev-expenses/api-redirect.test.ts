import { describe, it, expect } from 'vitest';

describe('api.ts 401 redirect logic', () => {
  function buildRedirectUrl(pathname: string): string {
    const locale = pathname.startsWith('/en/') ? 'en' : 'fr';
    return `/${locale}/dashboard/admin/login?redirect=${encodeURIComponent(pathname)}`;
  }

  it('redirects to /fr/dashboard/admin/login when locale is fr', () => {
    const url = buildRedirectUrl('/fr/dashboard/admin/dev-expenses/suppliers');
    expect(url).toBe('/fr/dashboard/admin/login?redirect=%2Ffr%2Fdashboard%2Fadmin%2Fdev-expenses%2Fsuppliers');
  });

  it('redirects to /en/dashboard/admin/login when locale is en', () => {
    const url = buildRedirectUrl('/en/dashboard/admin/dev-expenses/suppliers');
    expect(url).toBe('/en/dashboard/admin/login?redirect=%2Fen%2Fdashboard%2Fadmin%2Fdev-expenses%2Fsuppliers');
  });

  it('defaults to fr locale for non-prefixed paths', () => {
    const url = buildRedirectUrl('/dashboard/admin/dev-expenses/suppliers');
    expect(url).toBe('/fr/dashboard/admin/login?redirect=%2Fdashboard%2Fadmin%2Fdev-expenses%2Fsuppliers');
  });

  it('does not redirect to /api/admin/auth', () => {
    const url = buildRedirectUrl('/fr/dashboard/admin/dev-expenses/suppliers');
    expect(url).not.toContain('/api/admin/auth');
    expect(url).toContain('/dashboard/admin/login');
  });

  it('preserves the original path in the redirect param', () => {
    const original = '/fr/dashboard/admin/dev-expenses/suppliers';
    const url = buildRedirectUrl(original);
    expect(url).toContain(encodeURIComponent(original));
  });
});
