import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unipaycongo.com';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/merchant/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { error: 'SERVICE_UNAVAILABLE', statusCode: 503 },
      { status: 503 },
    );
  }

  const data = await upstream.json().catch(() => ({} as Record<string, unknown>));

  if (!upstream.ok) {
    return NextResponse.json({ error: data.error ?? 'Login failed' }, { status: upstream.status });
  }

  const response = NextResponse.json({ ok: true, name: data.name, merchant_id: data.merchant_id });

  response.cookies.set('auth_token', data.access_token as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: (data.expires_in as number) ?? 86_400,
    path: '/',
  });

  return response;
}
