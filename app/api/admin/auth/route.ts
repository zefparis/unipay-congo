import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, createSessionToken, COOKIE_NAME } from '@/lib/admin-session';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

export async function POST(request: NextRequest) {
  if (!ADMIN_SECRET) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  }
  const body = await request.json().catch(() => ({})) as { password?: string };
  if (!verifyAdminPassword(body.password ?? '')) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 h
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
