import { NextRequest } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { adminProxyFetch } from '@/lib/admin-proxy';

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const merchantId = searchParams.get('merchant_id');

  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  if (merchantId) qs.set('merchant_id', merchantId);

  return adminProxyFetch(`/v1/admin/merchants/revenue/daily?${qs.toString()}`, { method: 'GET' });
}
