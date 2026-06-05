import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function POST() {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/v1/merchant/webhook/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
