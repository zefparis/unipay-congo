import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function GET() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/v1/merchant/balance`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return NextResponse.json({ error: err }, { status: upstream.status });
  }

  const data = await upstream.json() as { balance?: unknown; currency?: string; mode?: string };

  return NextResponse.json({
    balance: Number(data.balance ?? 0),
    currency: data.currency ?? 'CDF',
    mode: data.mode ?? 'sandbox',
  });
}
