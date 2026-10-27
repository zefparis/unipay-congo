import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unipaycongo.com';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', statusCode: 400 }, { status: 400 });
  }

  const { name, email, password, webhook_url, ref } = body;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/merchant/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, webhook_url, ref: ref ?? undefined }),
    });
  } catch {
    // Network/DNS failure reaching the API — always return JSON, never an HTML 500.
    return NextResponse.json(
      { error: 'SERVICE_UNAVAILABLE', statusCode: 503 },
      { status: 503 },
    );
  }

  const data = await upstream.json().catch(() => ({} as Record<string, unknown>));

  if (!upstream.ok) {
    return NextResponse.json(
      { error: data.error ?? 'REGISTRATION_FAILED', statusCode: upstream.status },
      { status: upstream.status },
    );
  }

  return NextResponse.json({
    ok: true,
    merchant_id: data.merchant_id,
    api_key: data.api_key,
  }, { status: 201 });
}
