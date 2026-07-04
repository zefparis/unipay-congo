import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const KEY = process.env.ADMIN_SECRET        ?? '';

export async function GET() {
  if (!KEY) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  const res = await fetch(`${API}/v1/admin/treasury/crypto-wallets`, {
    headers: { 'x-admin-secret': KEY },
    cache:   'no-store',
  });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}

export async function POST(req: NextRequest) {
  if (!KEY) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  const body = await req.json();
  const res  = await fetch(`${API}/v1/admin/treasury/crypto-wallets`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': KEY },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
