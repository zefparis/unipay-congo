import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signedClientIpHeaders } from '@/lib/bff-client-ip';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unipaycongo.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upstream = await fetch(
    `${API_URL}/v1/merchant/support/conversations/${params.id}/messages`,
    { headers: { ...signedClientIpHeaders(request), Authorization: `Bearer ${token}` } },
  );
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
