import { NextRequest, NextResponse } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getAllowedOrigins(): Set<string> {
  const origins: string[] = [];

  const explicit = process.env.ADMIN_ALLOWED_ORIGINS;
  if (explicit) {
    for (const o of explicit.split(',')) {
      const trimmed = o.trim();
      if (trimmed) origins.push(trimmed);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) origins.push(appUrl.replace(/\/$/, ''));

  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000');
  }

  return new Set(origins);
}

export function verifyAdminOrigin(
  request: NextRequest,
): NextResponse | null {
  const method = request.method.toUpperCase();
  if (!MUTATING_METHODS.has(method)) return null;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  let candidate: string | null = null;
  if (origin) {
    candidate = origin;
  } else if (referer) {
    try {
      const url = new URL(referer);
      candidate = `${url.protocol}//${url.host}`;
    } catch {
      candidate = null;
    }
  }

  if (!candidate) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'INVALID_ADMIN_ORIGIN' },
      { status: 403 },
    );
  }

  const allowed = getAllowedOrigins();
  if (!allowed.has(candidate)) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'INVALID_ADMIN_ORIGIN' },
      { status: 403 },
    );
  }

  return null;
}
