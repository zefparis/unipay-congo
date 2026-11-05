import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signedClientIpHeaders } from '@/lib/bff-client-ip';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unipaycongo.com';

export async function GET(request: NextRequest) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/merchant/profile`, {
    headers: { ...signedClientIpHeaders(request), Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE', statusCode: 503 }, { status: 503 });
  }


  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function PATCH(request: NextRequest) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown = {};
  try { body = await request.json(); } catch { /* empty body */ }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/merchant/profile`, {
    method: 'PATCH',
    headers: { ...signedClientIpHeaders(request), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE', statusCode: 503 }, { status: 503 });
  }


  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
