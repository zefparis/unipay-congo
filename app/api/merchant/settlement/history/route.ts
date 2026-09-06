import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function GET(request: NextRequest) {
  const token = cookies().get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') ?? '1';
  const limit = searchParams.get('limit') ?? '20';

  const qs = new URLSearchParams({ page, limit });

  const upstream = await fetch(`${API_URL}/v1/merchant/settlement/history?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
