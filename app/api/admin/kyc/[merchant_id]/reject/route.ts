import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { verifyAdminOrigin } from '@/lib/verify-admin-origin';
import { adminProxyFetch } from '@/lib/admin-proxy';
import { isValidUUID } from '@/lib/validate-uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { merchant_id: string } },
) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const originError = verifyAdminOrigin(request);
  if (originError) return originError;

  if (!isValidUUID(params.merchant_id)) {
    return NextResponse.json(
      { error: 'Invalid resource identifier', code: 'INVALID_RESOURCE_ID' },
      { status: 400 },
    );
  }

  let body: unknown = {};
  try { body = await request.json(); } catch { /* empty body */ }

  return adminProxyFetch(`/v1/admin/kyc/${params.merchant_id}/reject`, {
    method: 'POST',
    body,
  });
}
