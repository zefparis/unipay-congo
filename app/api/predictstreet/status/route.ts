/**
 * GET /api/predictstreet/status
 *
 * Admin-only diagnostic endpoint for the PredictStreet integration.
 * Reports env-var presence, key validity, and endpoint readiness.
 *
 * Auth: admin_session cookie must equal ADMIN_SECRET.
 *
 * NEVER exposes: private key, server secret, raw JWTs, stack traces.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPredictStreetJwks } from '../../../../lib/predictstreet/jwt';

export const dynamic = 'force-dynamic';

// Mirror of the weak-value set in jwt.ts (kept local to avoid coupling)
const WEAK = new Set([
  'changeme', 'change-me', 'change_me', 'change_me_strong_secret',
  'dev-secret', 'dev_secret', 'devSecret', 'devsecret',
  'test', 'secret', 'password', '123456', 'admin',
]);

function envStatus(name: string): { present: boolean; weak: boolean } {
  const v = (process.env[name] ?? '').trim();
  return { present: v.length > 0, weak: WEAK.has(v.toLowerCase()) };
}

function isBad(name: string): boolean {
  const s = envStatus(name);
  return !s.present || s.weak;
}

export async function GET() {
  // ── Admin auth: cookie == ADMIN_SECRET ───────────────────────────────
  const adminSecret   = process.env.ADMIN_SECRET ?? '';
  const adminSession  = cookies().get('admin_session')?.value ?? '';
  if (!adminSecret || adminSession !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Check env vars ────────────────────────────────────────────────────
  const pkStatus     = envStatus('PREDICTSTREET_JWT_PRIVATE_KEY');
  const issStatus    = envStatus('PREDICTSTREET_JWT_ISSUER');
  const audStatus    = envStatus('PREDICTSTREET_JWT_AUDIENCE');
  const pidStatus    = envStatus('PREDICTSTREET_PROVIDER_ID');
  const ssStatus     = envStatus('PREDICTSTREET_SERVER_SECRET');

  // ── Test key parsing via JWKS helper ─────────────────────────────────
  const jwks     = getPredictStreetJwks();
  const jwksOk   = jwks.keys.length > 0 && !jwks.error;

  // ── Derive endpoint readiness ─────────────────────────────────────────
  const signingReady  = pkStatus.present && !pkStatus.weak && jwksOk
    && !isBad('PREDICTSTREET_JWT_ISSUER')
    && !isBad('PREDICTSTREET_JWT_AUDIENCE')
    && !isBad('PREDICTSTREET_PROVIDER_ID');
  const limitsReady   = ssStatus.present && !ssStatus.weak;

  // ── Collect human-readable warnings ──────────────────────────────────
  const warnings: string[] = [];

  if (!pkStatus.present)
    warnings.push('PREDICTSTREET_JWT_PRIVATE_KEY is not set — token signing disabled');
  else if (pkStatus.weak)
    warnings.push('PREDICTSTREET_JWT_PRIVATE_KEY appears to use a weak placeholder');
  else if (!jwksOk)
    warnings.push('PREDICTSTREET_JWT_PRIVATE_KEY is set but cannot be parsed as a valid RSA key — check PEM format');

  if (isBad('PREDICTSTREET_JWT_ISSUER'))
    warnings.push('PREDICTSTREET_JWT_ISSUER is missing or uses a weak placeholder');
  if (isBad('PREDICTSTREET_JWT_AUDIENCE'))
    warnings.push('PREDICTSTREET_JWT_AUDIENCE is missing or uses a weak placeholder');
  if (isBad('PREDICTSTREET_PROVIDER_ID'))
    warnings.push('PREDICTSTREET_PROVIDER_ID is missing or uses a weak placeholder');

  if (!ssStatus.present)
    warnings.push('PREDICTSTREET_SERVER_SECRET is not set — limits endpoint will reject all requests');
  else if (ssStatus.weak)
    warnings.push('PREDICTSTREET_SERVER_SECRET uses a weak placeholder — replace with openssl rand -hex 32 before production');

  if (!process.env.NEXT_PUBLIC_PREDICTSTREET_IFRAME_URL)
    warnings.push('NEXT_PUBLIC_PREDICTSTREET_IFRAME_URL is not set — gaming page iframe will be blank');
  if (!process.env.NEXT_PUBLIC_PREDICTSTREET_ALLOWED_ORIGIN)
    warnings.push('NEXT_PUBLIC_PREDICTSTREET_ALLOWED_ORIGIN is not set — postMessage bridge will reject all iframe messages');

  // ── Build response — no secrets exposed ──────────────────────────────
  return NextResponse.json({
    integration_ready: warnings.length === 0,
    warnings,
    config: {
      iframe_url:               process.env.NEXT_PUBLIC_PREDICTSTREET_IFRAME_URL      ?? null,
      allowed_origin:           process.env.NEXT_PUBLIC_PREDICTSTREET_ALLOWED_ORIGIN  ?? null,
      provider_id:              pidStatus.present && !pidStatus.weak
                                  ? (process.env.PREDICTSTREET_PROVIDER_ID ?? null)
                                  : null,
      jwt_issuer_configured:    issStatus.present && !issStatus.weak,
      jwt_audience_configured:  audStatus.present && !audStatus.weak,
      private_key_present:      pkStatus.present && !pkStatus.weak,
      private_key_valid_rsa:    jwksOk,
      server_secret_configured: limitsReady,
    },
    endpoints: {
      jwks: {
        path:   '/api/predictstreet/jwks',
        status: jwksOk ? 'ok' : 'error',
        auth:   'public',
      },
      token: {
        path:   '/api/predictstreet/token',
        status: signingReady ? 'ok' : 'error',
        auth:   'wallet_token cookie (httpOnly)',
      },
      limits: {
        path:   '/api/predictstreet/limits',
        status: limitsReady ? 'ok' : 'error',
        auth:   'Bearer PREDICTSTREET_SERVER_SECRET',
      },
    },
    gaming_page_path: '/wallet/gaming',
  });
}
