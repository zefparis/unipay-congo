import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upstream = await fetch(
    `${API_URL}/v1/merchant/support/conversations/${params.id}/messages`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
