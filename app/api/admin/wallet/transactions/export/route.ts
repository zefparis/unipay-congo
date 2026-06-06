import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function GET(request: NextRequest) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  const qs = new URL(request.url).searchParams.toString();
  const up = await fetch(`${API}/v1/admin/wallet/transactions/export${qs ? `?${qs}` : ''}`, {
    headers: { 'x-admin-secret': ADMIN_SECRET },
    cache: 'no-store',
  });
  const csv = await up.text();
  return new NextResponse(csv, {
    status: up.status,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="wallet-transactions.csv"',
    },
  });
}
