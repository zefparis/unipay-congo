import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function POST(
  _request: Request,
  { params }: { params: { merchant_id: string } },
) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });

  const upstream = await fetch(`${API_URL}/v1/admin/kyc/${params.merchant_id}/approve`, {
    method: 'POST',
    headers: { 'x-admin-secret': ADMIN_SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
