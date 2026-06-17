import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API          = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

/* ── POST /api/admin/treasury/crypto-receipts/:id/restore ─────────────── */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const up   = await fetch(`${API}/v1/admin/treasury/crypto-receipts/${params.id}/restore`, {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'x-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify(body),
  });
  const data = await up.json();
  return NextResponse.json(data, { status: up.status });
}
