function getAdminSecret(): string {
  return process.env.ADMIN_SECRET ?? '';
}
export const COOKIE_NAME = 'admin_session';
const SESSION_TTL = 8 * 60 * 60; // 8 hours in seconds

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

function timingSafeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode('admin-session-signing-key' + getAdminSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return toHex(sig);
}

/**
 * Generate a random session token signed with an HMAC derived from ADMIN_SECRET.
 * Format: {random_hex}.{timestamp_hex}.{hmac_hex}
 * The token is verifiable statelessly and expires after SESSION_TTL seconds.
 */
export async function createSessionToken(): Promise<string> {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const random = toHex(randomBytes);
  const ts = Math.floor(Date.now() / 1000).toString(16);
  const payload = `${random}.${ts}`;
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

/**
 * Verify a session token: checks HMAC signature and expiration.
 * Does NOT compare against ADMIN_SECRET directly.
 */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!getAdminSecret() || !token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [random, tsHex, sig] = parts;

  if (!/^[0-9a-f]+$/.test(random) || !/^[0-9a-f]+$/.test(tsHex) || !/^[0-9a-f]+$/.test(sig)) return false;

  const payload = `${random}.${tsHex}`;
  const expectedSig = await hmacSign(payload);

  if (sig.length !== expectedSig.length) return false;
  if (!timingSafeCompare(fromHex(sig), fromHex(expectedSig))) return false;

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
  if (!getAdminSecret()) return false;
  const a = enc.encode(password);
  const b = enc.encode(getAdminSecret());
  return timingSafeCompare(a, b);
}
