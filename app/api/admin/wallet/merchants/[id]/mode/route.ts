import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json() as { mode?: string };
  const upstream = await fetch(`${API_URL}/v1/admin/merchants/${params.id}/mode`, {
    method: 'POST',
    headers: {
      'x-admin-secret': ADMIN_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
