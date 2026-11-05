import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signedClientIpHeaders } from '@/lib/bff-client-ip';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unipaycongo.com';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function GET(request: NextRequest) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/v1/merchant/webhook`, {
    headers: { ...signedClientIpHeaders(request), Authorization: `Bearer ${token}` },
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(request: NextRequest) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown = {};
  try { body = await request.json(); } catch { /* empty body */ }

  const upstream = await fetch(`${API_URL}/v1/merchant/webhook`, {
    method: 'POST',
    headers: { ...signedClientIpHeaders(request), ...authHeaders(token), ...signedClientIpHeaders(request) },
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function DELETE(request: NextRequest) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/v1/merchant/webhook`, {
    method: 'DELETE',
    headers: { ...signedClientIpHeaders(request), Authorization: `Bearer ${token}` },
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
