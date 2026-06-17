import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API          = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

/* ── POST /api/admin/treasury/crypto-receipts/:id/verify ─────────────── */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  }

  const up   = await fetch(`${API}/v1/admin/treasury/crypto-receipts/${params.id}/verify`, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'x-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({}),
  });
  const data = await up.json();
  return NextResponse.json(data, { status: up.status });
}
