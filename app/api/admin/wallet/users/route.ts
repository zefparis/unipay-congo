import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { adminProxyFetch } from '@/lib/admin-proxy';

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const qs = request.nextUrl.searchParams.toString();
  return adminProxyFetch(`/v1/admin/wallet/users${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}
