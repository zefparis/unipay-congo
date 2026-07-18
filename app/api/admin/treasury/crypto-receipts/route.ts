import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { verifyAdminOrigin } from '@/lib/verify-admin-origin';
import { adminProxyFetch } from '@/lib/admin-proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const search = request.nextUrl.searchParams.toString();
  return adminProxyFetch(`/v1/admin/treasury/crypto-receipts${search ? `?${search}` : ''}`, {
    method: 'GET',
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const originError = verifyAdminOrigin(request);
  if (originError) return originError;

  const body = await request.json();
  return adminProxyFetch('/v1/admin/treasury/crypto-receipts', {
    method: 'POST',
    body,
  });
}
