import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { password?: string };
  const secret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '';

  if (!secret) {
    return NextResponse.json({ ok: true });
  }

  if (body.password !== secret) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
