import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!ADMIN_SECRET) return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  const up = await fetch(`${API}/v1/admin/wallet/users/${params.id}/unblock`, {
    method: 'POST',
    headers: { 'x-admin-secret': ADMIN_SECRET },
  });
  const text = await up.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return { error: text };
        }
      })()
    : { ok: up.ok };
  return NextResponse.json(data, { status: up.status });
}
