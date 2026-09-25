# UniPay Congo — Agent Guide

## Build & Test Commands

- **Dev**: `npm run dev`
- **Build**: `npm run build` (Next.js 14.2.4 + next-pwa + next-intl)
- **Typecheck**: `npx tsc --noEmit`
- **Tests**: `npx vitest run`
- **Start prod locally**: `npx next start -p <port>`

## Security Headers (added 2026-09-12)

### Architecture decision — headers at Next.js level, NOT the Worker

`unipaycongo.com` is a standalone Next.js app on Vercel. Security headers are
set in `next.config.js` via the `headers()` function.

### Headers deployed

| Header | Value | Mode |
|--------|-------|------|
| X-Frame-Options | DENY | Enforced |
| X-Content-Type-Options | nosniff | Enforced |
| Referrer-Policy | strict-origin-when-cross-origin | Enforced |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=() | Enforced |
| X-XSS-Protection | 0 | Enforced (0 = disables buggy auditor; CSP is the modern defense) |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Enforced |
| Cross-Origin-Opener-Policy | same-origin | Enforced |
| Content-Security-Policy-Report-Only | (see below) | **Report-Only** — rename to `Content-Security-Policy` to enforce after validation |

### CSP policy (Report-Only — observe before enforcing)

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https://api.unipaycongo.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

**Sources listed in connect-src:**
- `'self'` — same-origin Next.js API routes (`/api/merchant/*`, `/api/auth/*`)
- `https://api.unipaycongo.com` — UniPay API backend on x2 via Cloudflare Tunnel (direct browser→backend calls via `lib/api.ts`, NEXT_PUBLIC_API_URL default)

### To enforce CSP

1. Deploy with Report-Only and observe browser console for violations
2. Add any missing sources to the policy
3. In `next.config.js`, rename `Content-Security-Policy-Report-Only` → `Content-Security-Policy`
4. Redeploy

## Subdomain exposure (audit 2026-09-12)

| Subdomain | Service | Headers | Risk |
|-----------|---------|---------|------|
| www.unipaycongo.com | Marketing/API platform (Next.js/Vercel) | Fixed (this change) | Was MEDIUM, now LOW |
| unipaycongo.com (apex) | Redirects to www | Same deployment as www | Fixed with www |
| app.unipaycongo.com | UniPay Wallet app (Next.js/Vercel) | Already has CSP+headers | LOW |
| api.unipaycongo.com | API backend (Render) | Helmet headers, 401 without auth | LOW |
| imap.unipaycongo.com | Roundcube webmail (email provider) | Missing CSP/nosniff | MEDIUM — managed by email provider, not fixable here |
| mail.unipaycongo.com | Mail DNS record (no HTTP) | N/A | LOW |
| pop.unipaycongo.com | POP3 DNS record (no HTTP) | N/A | LOW |
| smtp.unipaycongo.com | SMTP/redirect (email provider) | N/A | LOW |

No staging/test environment found among exposed subdomains. `app.unipaycongo.com`
is a legitimate production wallet app (separate Vercel project), not staging.

The Roundcube webmail on `imap.unipaycongo.com/roundcube/` is managed by the
email hosting provider (MX: `_dc-mx.a77d9e5e7204.unipaycongo.com`). Its missing
CSP/nosniff headers cannot be fixed from this codebase — escalate to the
email provider or add a Cloudflare Transform Rule for that subdomain.

## DNSSEC — disabled

DNSSEC is **not enabled** for `unipaycongo.com`. No DS record at the `.com`
parent zone, no DNSKEY records, no RRSIG in responses. DNSSEC is a registrar-
side configuration (not code-side). To enable:
1. Verify the registrar supports DNSSEC
2. Generate a KSK/ZSK key pair in the Cloudflare dashboard (Cloudflare supports
   DNSSEC for zones it manages)
3. Cloudflare provides a DS record to publish at the registrar
4. Add the DS record at the registrar

This is a separate task — it requires access to the domain registrar and
cannot be done from the codebase.
