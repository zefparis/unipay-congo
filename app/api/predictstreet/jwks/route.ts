/**
 * GET /api/predictstreet/jwks
 *
 * Public JWKS endpoint.  PredictStreet fetches this to verify the RS256 JWTs
 * issued by /api/predictstreet/token.
 *
 * Auth: NONE — intentionally public.
 * Cache: 1 hour (the key rotates rarely; PredictStreet may cache aggressively).
 */

import { NextResponse } from 'next/server';
import { getPredictStreetJwks } from '../../../../lib/predictstreet/jwt';

export const dynamic = 'force-dynamic';

export async function GET() {
  const jwks = getPredictStreetJwks();

  // M1/M3: if key is missing, invalid, or not RSA — return 503, not 200 with empty keys
  if (jwks.error === 'JWKS_UNAVAILABLE' || jwks.keys.length === 0) {
    return NextResponse.json({ error: 'JWKS_UNAVAILABLE' }, { status: 503 });
  }

  // Strip internal error field before sending public response
  const { error: _ignored, ...publicJwks } = jwks;

  return NextResponse.json(publicJwks, {
    status:  200,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Type':  'application/json',
    },
  });
}
