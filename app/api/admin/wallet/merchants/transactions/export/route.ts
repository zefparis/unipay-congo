import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { adminProxyFetch } from '@/lib/admin-proxy';

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const qs = request.nextUrl.searchParams.toString();
  const path = qs
    ? `/v1/admin/merchants/transactions/export?${qs}`
    : '/v1/admin/merchants/transactions/export';
  return adminProxyFetch(path, { method: 'GET', responseType: 'text' });
}
