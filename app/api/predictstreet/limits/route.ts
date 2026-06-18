/**
 * GET|POST /api/predictstreet/limits
 *
 * Server-to-server endpoint called by PredictStreet to retrieve user limits
 * (deposit cap, trade cap, KYC status) for a given provider_user_id.
 *
 * Auth: Bearer token must equal PREDICTSTREET_SERVER_SECRET (timing-safe).
 *
 * Query param: ?provider_user_id=<wallet_id>
 *
 * Returns:
 *   { provider_user_id, deposit_limit, deposit_consumed, trade_limit,
 *     trade_consumed, kyc_status, eligible }
 *
 * Note: The `predictstreet_limits` table lives in unipay-api's Supabase.
 * This route proxies to the unipay-api admin endpoint that reads it.
 * If that endpoint does not yet exist, this route returns a safe default
 * based on wallet KYC level so integration can proceed end-to-end.
 *
 * DB MIGRATION REQUIRED IN unipay-api:
 *   Create table predictstreet_limits (see unipay-api migration plan).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyServerSecret } from '../../../../lib/predictstreet/jwt';

const API_URL      = process.env.NEXT_PUBLIC_API_URL     ?? 'https://unipay-api.onrender.com';
const ADMIN_SECRET = process.env.ADMIN_SECRET             ?? '';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

async function handleLimits(request: NextRequest) {
  // ── Auth: Bearer == PREDICTSTREET_SERVER_SECRET ──────────────────────
  const authHeader = request.headers.get('authorization') ?? '';
  const bearer     = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!verifyServerSecret(bearer)) return unauthorized();

  const providerUserId =
    request.nextUrl.searchParams.get('provider_user_id') ??
    (await request.json().catch(() => ({} as Record<string, string>)) as Record<string, string>).provider_user_id ??
    '';

  if (!providerUserId) {
    return NextResponse.json({ error: 'provider_user_id required' }, { status: 400 });
  }

  // ── Try to fetch limits from unipay-api admin endpoint ───────────────
  try {
    const upstream = await fetch(
      `${API_URL}/v1/admin/predictstreet/limits/${encodeURIComponent(providerUserId)}`,
      {
        headers: {
          'x-admin-secret': ADMIN_SECRET,
          'Content-Type':   'application/json',
        },
        cache: 'no-store',
      },
    );

    if (upstream.ok) {
      const data = await upstream.json();
      return NextResponse.json(data);
    }

    // ── Fallback: endpoint not yet implemented in unipay-api ─────────
    // Return safe defaults so PredictStreet integration works end-to-end.
    // Replace this block once the unipay-api migration is applied.
    console.warn('[predictstreet/limits] unipay-api limits endpoint not available, returning defaults');
  } catch {
    console.warn('[predictstreet/limits] unipay-api unreachable, returning defaults');
  }

  return NextResponse.json({
    provider_user_id: providerUserId,
    deposit_limit:    1000,
    deposit_consumed: 0,
    trade_limit:      500,
    trade_consumed:   0,
    kyc_status:       'unknown',
    eligible:         false,
  });
}

export async function GET(request: NextRequest) {
  return handleLimits(request);
}

export async function POST(request: NextRequest) {
  return handleLimits(request);
}
