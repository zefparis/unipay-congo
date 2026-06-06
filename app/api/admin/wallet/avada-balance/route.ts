import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function GET() {
  const upstream = await fetch(`${API_URL}/v1/admin/wallet/avada-balance`, {
    headers: { 'x-admin-secret': ADMIN_SECRET },
    cache: 'no-store',
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
