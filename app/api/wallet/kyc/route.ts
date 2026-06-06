import { NextRequest, NextResponse } from 'next/server';

const API_URL      = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function GET(request: NextRequest) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const upstream = await fetch(`${API_URL}/v1/admin/wallet/kyc${qs ? `?${qs}` : ''}`, {
    headers: { 'x-admin-secret': ADMIN_SECRET },
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
