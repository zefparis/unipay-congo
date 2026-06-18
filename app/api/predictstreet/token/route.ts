/**
 * POST /api/predictstreet/token
 *
 * Generates a short-lived RS256 JWT for the currently authenticated wallet
 * user and returns it to the browser.  The JWT is then forwarded by the
 * postMessage bridge to the PredictStreet iframe.
 *
 * Auth: requires valid `wallet_token` httpOnly cookie.
 *
 * Flow:
 *   1. Read wallet_token cookie → 401 if missing
 *   2. Verify token by calling unipay-api /v1/wallet/balance → 401 if fails
 *   3. Sign JWT using RSA private key with wallet_id as `sub`
 *   4. Return { token }
 */

import { NextRequest, NextResponse } from 'next/server';
import { signPredictStreetJwt } from '../../../../lib/predictstreet/jwt';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

// M2: wallet_id must be a non-empty alphanumeric-safe string, max 128 chars
const WALLET_ID_RE = /^[a-zA-Z0-9_-]+$/;

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let walletId: string;
  let kycLevel: number;

  try {
    const upstream = await fetch(`${API_URL}/v1/wallet/balance`, {
      headers: { Authorization: `Bearer ${walletToken}` },
      cache:   'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const data = await upstream.json() as {
      wallet_id:   string;
      kyc_level:   number;
      balance_cdf: number;
    };

    // M2: validate wallet_id before using it as JWT sub
    const rawId = data.wallet_id;
    if (
      typeof rawId !== 'string' ||
      rawId.length === 0 ||
      rawId.length > 128 ||
      !WALLET_ID_RE.test(rawId)
    ) {
      return NextResponse.json({ error: 'INVALID_SESSION' }, { status: 401 });
    }
    walletId = rawId;
    kycLevel = data.kyc_level ?? 0;
  } catch {
    return NextResponse.json({ error: 'Session verification failed' }, { status: 502 });
  }

  try {
    const token = signPredictStreetJwt(walletId, { kyc_level: kycLevel });
    return NextResponse.json({ token });
  } catch (err) {
    // M1: log full error server-side only — never expose to client
    console.error('[predictstreet/token] JWT signing failed:', err);
    return NextResponse.json({ error: 'TOKEN_SIGNING_FAILED' }, { status: 500 });
  }
}
