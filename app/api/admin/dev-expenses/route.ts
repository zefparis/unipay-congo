import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { verifyAdminOrigin } from '@/lib/verify-admin-origin';
import { adminProxyFetch } from '@/lib/admin-proxy';

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const qs = request.nextUrl.searchParams.toString();
  return adminProxyFetch(`/v1/admin/dev-expenses${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const originError = verifyAdminOrigin(request);
  if (originError) return originError;

  const formData = await request.formData();
  return adminProxyFetch('/v1/admin/dev-expenses', {
    method: 'POST',
    body: formData,
  });
}
