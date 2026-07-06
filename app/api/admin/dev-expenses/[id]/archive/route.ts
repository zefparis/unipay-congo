import { NextRequest, NextResponse } from 'next/server';

const API          = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function PATCH(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  const r = await fetch(`${API}/v1/admin/dev-expenses/${params.id}/archive`, {
    method: 'PATCH',
    headers: { 'x-admin-secret': ADMIN_SECRET, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
