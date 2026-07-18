import { NextRequest, NextResponse } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function getAllowedOrigins(): Set<string> {
  const origins: string[] = [];

  const explicit = process.env.ADMIN_ALLOWED_ORIGINS;
  if (explicit) {
    for (const o of explicit.split(',')) {
      const normalized = normalizeOrigin(o);
      if (normalized) origins.push(normalized);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) origins.push(normalizeOrigin(appUrl));

  // Vercel automatically sets VERCEL_URL (e.g. "unipay-congo-xxx.vercel.app")
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) origins.push(`https://${normalizeOrigin(vercelUrl)}`);

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

  // Fallback: for same-origin requests, derive candidate from the request URL itself.
  // This handles cases where Origin/Referer are stripped by proxies or browsers.
  if (!candidate) {
    const requestUrl = new URL(request.url);
    candidate = `${requestUrl.protocol}//${requestUrl.host}`;
  }

  const allowed = getAllowedOrigins();
  const normalizedCandidate = normalizeOrigin(candidate);
  if (!allowed.has(normalizedCandidate)) {
    return NextResponse.json(
      { error: 'Forbidden', code: 'INVALID_ADMIN_ORIGIN', detail: { candidate: normalizedCandidate, allowed: Array.from(allowed) } },
      { status: 403 },
    );
  }

  return null;
}
