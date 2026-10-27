import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unipaycongo.com';

export async function POST(request: NextRequest) {
  let body: unknown = {};
  try { body = await request.json(); } catch { /* empty body */ }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/merchant/password-reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE', statusCode: 503 }, { status: 503 });
  }


  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
