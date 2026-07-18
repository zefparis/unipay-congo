import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/require-admin-session';
import { verifyAdminOrigin } from '@/lib/verify-admin-origin';
import { adminProxyFetch } from '@/lib/admin-proxy';
import { isValidUUID } from '@/lib/validate-uuid';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminSession(request);
  if (!auth.ok) return auth.response;

  const originError = verifyAdminOrigin(request);
  if (originError) return originError;

  if (!isValidUUID(params.id)) {
    return NextResponse.json(
      { error: 'Invalid resource identifier', code: 'INVALID_RESOURCE_ID' },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  return adminProxyFetch(`/v1/admin/treasury/crypto-receipts/${params.id}/archive`, {
    method: 'POST',
    body,
  });
}
