/**
 * PredictStreet JWT utilities — server-side only.
 *
 * Uses Node.js built-in `crypto` (no external JWT library).
 * Signs RS256 JWTs and exports JWKS for PredictStreet to verify.
 *
 * Required env vars:
 *   PREDICTSTREET_JWT_PRIVATE_KEY  — RSA-2048 PEM (newlines escaped as \n)
 *   PREDICTSTREET_JWT_ISSUER       — e.g. https://unipay-api.onrender.com
 *   PREDICTSTREET_JWT_AUDIENCE     — e.g. predictstreet-prod
 *   PREDICTSTREET_PROVIDER_ID      — partner identifier
 */

import crypto from 'crypto';

const KID         = 'unipay-ps-v1';
const TTL_SECONDS = 300; // 5 minutes

/* ── Weak-value detection ───────────────────────────────────────────────
 * Rejects known placeholder / default / insecure credential values.
 * Extend this set as needed.
 */
const WEAK_VALUES = new Set([
  'changeme', 'change-me', 'change_me', 'change_me_strong_secret',
  'dev-secret', 'dev_secret', 'devSecret', 'devsecret',
  'test', 'secret', 'password', '123456', 'admin',
]);

function isWeakSecret(v: string): boolean {
  return !v || WEAK_VALUES.has(v.toLowerCase().trim());
}

/* ── RSA private-key validation ─────────────────────────────────────────
 * Parses the PEM, verifies it is RSA, and checks the modulus length.
 * Throws safe coded errors — never OpenSSL detail strings.
 */
function validatePrivateKey(normalizedPem: string): crypto.KeyObject {
  let keyObj: crypto.KeyObject;
  try {
    keyObj = crypto.createPrivateKey(normalizedPem);
  } catch {
    throw new Error('PRIVATE_KEY_INVALID');
  }
  if (keyObj.asymmetricKeyType !== 'rsa') {
    throw new Error('PRIVATE_KEY_NOT_RSA');
  }
  const modLen = keyObj.asymmetricKeyDetails?.modulusLength;
  if (modLen !== undefined && modLen < 2048) {
    throw new Error('PRIVATE_KEY_TOO_SHORT');
  }
  return keyObj;
}

/* ── Signing-config guard ────────────────────────────────────────────────
 * Called at the start of signPredictStreetJwt().
 * Validates all required env vars and rejects weak / missing values.
 */
function assertSigningConfig(): void {
  const required: Record<string, string | undefined> = {
    PREDICTSTREET_JWT_PRIVATE_KEY: process.env.PREDICTSTREET_JWT_PRIVATE_KEY,
    PREDICTSTREET_JWT_ISSUER:      process.env.PREDICTSTREET_JWT_ISSUER,
    PREDICTSTREET_JWT_AUDIENCE:    process.env.PREDICTSTREET_JWT_AUDIENCE,
    PREDICTSTREET_PROVIDER_ID:     process.env.PREDICTSTREET_PROVIDER_ID,
  };
  for (const [name, value] of Object.entries(required)) {
    if (!value || isWeakSecret(value)) {
      console.error(`[predictstreet] env var ${name} is missing or uses a weak placeholder`);
      throw new Error('SIGNING_CONFIG_INVALID');
    }
  }
}

function b64url(buf: Buffer): string {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g,  '');
}

function encodeSegment(obj: unknown): string {
  return b64url(Buffer.from(JSON.stringify(obj)));
}

/** Normalise PEM stored in env var (escaped \n → real newlines). */
function normalizePem(raw: string): string {
  return raw.replace(/\\n/g, '\n').trim();
}

/**
 * Sign an RS256 JWT for the given wallet user.
 *
 * @param sub  wallet_id of the authenticated user
 * @param extra additional claims merged into payload
 */
export function signPredictStreetJwt(
  sub:   string,
  extra: Record<string, unknown> = {},
): string {
  // M3: validate all required env vars and reject weak/missing values
  assertSigningConfig();

  const normalizedPem = normalizePem(process.env.PREDICTSTREET_JWT_PRIVATE_KEY!);
  // M3: validate RSA key is parseable, is RSA type, and modulus >= 2048 bits
  validatePrivateKey(normalizedPem); // throws PRIVATE_KEY_* coded errors if invalid

  const issuer     = process.env.PREDICTSTREET_JWT_ISSUER!;
  const audience   = process.env.PREDICTSTREET_JWT_AUDIENCE!;
  const providerId = process.env.PREDICTSTREET_PROVIDER_ID!;
  const now        = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT', kid: KID };
  const payload = {
    iss:         issuer,
    aud:         audience,
    sub,
    iat:         now,
    exp:         now + TTL_SECONDS,
    provider_id: providerId,
    ...extra,
  };

  const signingInput = `${encodeSegment(header)}.${encodeSegment(payload)}`;

  // Wrap the actual sign call so any unexpected crypto error stays server-side only
  let signature: Buffer;
  try {
    const signer = crypto.createSign('SHA256');
    signer.update(signingInput, 'utf8');
    signature = signer.sign(normalizedPem);
  } catch {
    throw new Error('SIGN_OPERATION_FAILED');
  }

  return `${signingInput}.${b64url(signature)}`;
}

/**
 * Return the JWKS representation of the RSA public key.
 * Safe to expose publicly — contains only the public component.
 */
export function getPredictStreetJwks(): { keys: Record<string, string>[]; error?: string } {
  const rawKey = process.env.PREDICTSTREET_JWT_PRIVATE_KEY ?? '';
  if (!rawKey || isWeakSecret(rawKey)) {
    console.error('[predictstreet] JWKS: PREDICTSTREET_JWT_PRIVATE_KEY is missing or uses a weak placeholder');
    return { keys: [], error: 'JWKS_UNAVAILABLE' };
  }

  try {
    const privateKey = crypto.createPrivateKey(normalizePem(rawKey));
    if (privateKey.asymmetricKeyType !== 'rsa') {
      console.error('[predictstreet] JWKS: private key is not RSA type');
      return { keys: [], error: 'JWKS_UNAVAILABLE' };
    }
    const publicKey = crypto.createPublicKey(privateKey);
    const jwk       = publicKey.export({ format: 'jwk' }) as Record<string, string>;

    return {
      keys: [{
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        kid: KID,
        n:   jwk.n,
        e:   jwk.e,
      }],
    };
  } catch {
    // No OpenSSL error detail exposed — log only a safe message
    console.error('[predictstreet] JWKS: private key could not be parsed (check PEM format)');
    return { keys: [], error: 'JWKS_UNAVAILABLE' };
  }
}

/**
 * Constant-time comparison for Bearer token validation.
 * Prevents timing attacks on the server secret.
 */
export function verifyServerSecret(bearerToken: string): boolean {
  const secret = process.env.PREDICTSTREET_SERVER_SECRET ?? '';
  // M3: reject missing or weak placeholder secrets
  if (!bearerToken || !secret || isWeakSecret(secret)) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(bearerToken, 'utf8'),
      Buffer.from(secret,      'utf8'),
    );
  } catch {
    return false;
  }
}
