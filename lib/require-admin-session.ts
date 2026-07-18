import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from './admin-session';

export type AdminSessionResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

export async function requireAdminSession(
  request: NextRequest,
): Promise<AdminSessionResult> {
  const cookie = request.cookies.get(COOKIE_NAME);
  const valid = await verifySessionToken(cookie?.value);

  if (!valid) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized', code: 'ADMIN_SESSION_REQUIRED' },
        { status: 401 },
      ),
    };
  }

  return { ok: true };
}
