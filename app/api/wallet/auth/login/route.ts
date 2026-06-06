import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/v1/wallet/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json({ error: data.error ?? 'Login failed' }, { status: upstream.status });
  }

  const response = NextResponse.json({
    ok: true,
    wallet_id: data.wallet_id,
    phone: data.phone,
    full_name: data.full_name ?? null,
  });

  response.cookies.set('wallet_token', data.access_token as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: (data.expires_in as number) ?? 86_400,
    path: '/',
  });

  return response;
}
