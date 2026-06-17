import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API          = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

function notConfigured() {
  return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
}

/* ── GET /api/admin/treasury/crypto-receipts?asset=...&... ─────────── */
export async function GET(req: NextRequest) {
  if (!ADMIN_SECRET) return notConfigured();

  const search = req.nextUrl.searchParams.toString();
  const url    = `${API}/v1/admin/treasury/crypto-receipts${search ? `?${search}` : ''}`;

  const up   = await fetch(url, {
    headers: { 'x-admin-secret': ADMIN_SECRET },
    cache:   'no-store',
  });
  const data = await up.json();
  return NextResponse.json(data, { status: up.status });
}

/* ── POST /api/admin/treasury/crypto-receipts ───────────────────────── */
export async function POST(req: NextRequest) {
  if (!ADMIN_SECRET) return notConfigured();

  const body = await req.json();
  const up   = await fetch(`${API}/v1/admin/treasury/crypto-receipts`, {
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
