import { NextResponse } from 'next/server';

const API          = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });

  const up = await fetch(`${API}/v1/admin/predictstreet/transactions`, {
    headers: { 'x-admin-secret': ADMIN_SECRET },
    cache:   'no-store',
  });

  const data = await up.json();
  return NextResponse.json(data, { status: up.status });
}
