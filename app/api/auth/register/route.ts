import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, password, webhook_url } = body;

  const upstream = await fetch(`${API_URL}/v1/merchant/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, webhook_url }),
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json({ error: data.error ?? 'Registration failed' }, { status: upstream.status });
  }

  return NextResponse.json({ ok: true, merchant_id: data.merchant_id }, { status: 201 });
}
