import { NextRequest, NextResponse } from 'next/server';

const API          = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function GET(request: NextRequest) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  const search = request.nextUrl.searchParams.toString();
  const r = await fetch(`${API}/v1/admin/quotes${search ? '?' + search : ''}`, {
    headers: { 'x-admin-secret': ADMIN_SECRET },
  });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}

export async function POST(request: NextRequest) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  const body = await request.formData();
  const r = await fetch(`${API}/v1/admin/quotes`, {
    method: 'POST',
    headers: { 'x-admin-secret': ADMIN_SECRET },
    body,
  });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
