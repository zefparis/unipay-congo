import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function POST(request: NextRequest) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  const body = await request.json();
  const up = await fetch(`${API}/v1/admin/binance/withdraw`, {
    method: 'POST',
    headers: { 'x-admin-secret': ADMIN_SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await up.json();
  return NextResponse.json(data, { status: up.status });
}
