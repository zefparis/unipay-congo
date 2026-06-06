import { NextRequest, NextResponse } from 'next/server';

const API_URL      = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const upstream = await fetch(`${API_URL}/v1/admin/wallet/kyc/${params.id}/reject`, {
    method: 'POST',
    headers: { 'x-admin-secret': ADMIN_SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
