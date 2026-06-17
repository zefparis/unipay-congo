import { NextRequest, NextResponse } from 'next/server';

const API  = process.env.NEXT_PUBLIC_API_URL ?? '';
const KEY  = process.env.ADMIN_SECRET        ?? '';

export async function GET(req: NextRequest) {
  const res = await fetch(`${API}/v1/admin/treasury/crypto-assets`, {
    headers: { 'x-admin-secret': KEY },
    cache:   'no-store',
  });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
