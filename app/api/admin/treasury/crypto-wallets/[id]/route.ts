import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const KEY = process.env.ADMIN_SECRET        ?? '';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const res  = await fetch(`${API}/v1/admin/treasury/crypto-wallets/${params.id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': KEY },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
