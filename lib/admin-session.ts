import crypto from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';
export const COOKIE_NAME = 'admin_session';
const SESSION_TTL = 8 * 60 * 60; // 8 hours in seconds

function hmacKey(): Buffer {
  return crypto.createHmac('sha256', 'admin-session-signing-key').update(ADMIN_SECRET).digest();
}

/**
 * Generate a random session token signed with an HMAC derived from ADMIN_SECRET.
 * Format: {random_hex}.{timestamp_hex}.{hmac_hex}
 * The token is verifiable statelessly and expires after SESSION_TTL seconds.
 */
export function createSessionToken(): string {
  const random = crypto.randomBytes(32).toString('hex');
  const ts = Math.floor(Date.now() / 1000).toString(16);
  const payload = `${random}.${ts}`;
  const sig = crypto.createHmac('sha256', hmacKey()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/**
 * Verify a session token: checks HMAC signature and expiration.
 * Does NOT compare against ADMIN_SECRET directly.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!ADMIN_SECRET || !token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [random, tsHex, sig] = parts;

  if (!/^[0-9a-f]+$/.test(random) || !/^[0-9a-f]+$/.test(tsHex) || !/^[0-9a-f]+$/.test(sig)) return false;

  const payload = `${random}.${tsHex}`;
  const expectedSig = crypto.createHmac('sha256', hmacKey()).update(payload).digest('hex');

  if (sig.length !== expectedSig.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) return false;
  } catch {
    return false;
  }

  const ts = parseInt(tsHex, 16);
  if (isNaN(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (now - ts > SESSION_TTL) return false;

  return true;
}

/**
 * Verify the admin password using a constant-time comparison.
 */
export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_SECRET) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(ADMIN_SECRET);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
