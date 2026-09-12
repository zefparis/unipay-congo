const createNextIntlPlugin = require('next-intl/plugin');
const withPWA = require('@ducanh2912/next-pwa').default;

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/**
 * Security headers for the UniPay Congo payment platform.
 *
 * Architecture note: unipaycongo.com is a standalone Next.js app on Vercel.
 * It is NOT routed through the hcs-u7-proxy Cloudflare Worker (unlike
 * congogaming.com / hcs-u7.org which get their headers from the Worker's
 * addCorsHeaders function). The Worker's wildcard route (asterisk-slash-asterisk) is scoped to
 * the hcs-u7.org zone only, so it never catches unipaycongo.com traffic.
 * Headers therefore belong here at the Next.js level. If unipaycongo.com is
 * ever routed through the Worker, its addCorsHeaders already respects
 * upstream CSP (only sets a fallback when none is present), so no conflicts.
 *
 * CSP is deployed in Report-Only mode first (Content-Security-Policy-Report-Only)
 * to observe violations without breaking the HCS-U7 widget or payment flows.
 * Once validated, rename the header to Content-Security-Policy to enforce.
 */
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    // Payment platform — no camera/geolocation/payment API needed at the
    // browser level (payments go through server-side API calls, not the
    // browser Payment Request API). microphone=(self) kept for potential
    // future HCS cognitive test integration.
    value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },
  {
    key: 'X-XSS-Protection',
    // 0 disables the legacy XSS auditor (which is buggy and can introduce
    // vulnerabilities). CSP is the modern defense; this header is kept at 0
    // for explicitness per OWASP guidance.
    value: '0',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  // CSP — Report-Only mode for observation. Rename to
  // 'Content-Security-Policy' to enforce after validating no legitimate
  // resources are blocked.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      // HCS-U7 widget script loaded from Vercel; 'unsafe-inline' needed for
      // Next.js hydration/RSC inline scripts.
      "script-src 'self' 'unsafe-inline' https://hcs-widget-mvp.vercel.app",
      // 'unsafe-inline' for Next.js styled-jsx / inline styles.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      // next/font/google self-hosts fonts at /_next/static/media/
      "font-src 'self' data:",
      // connect-src: same-origin API routes + HCS widget API + UniPay backend
      // (lib/api.ts makes direct browser→backend fetch calls via NEXT_PUBLIC_API_URL)
      "connect-src 'self' https://api.hcs-u7.org https://hcs-widget-mvp.vercel.app https://unipay-api.onrender.com https://api.unipaycongo.com",
      // Service worker + workbox blob workers
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Custom rules are registered BEFORE the plugin's defaults (first match wins in
  // workbox), so session-sensitive routes below are never served from the SW cache
  // even though cacheOnFrontEndNav writes them into the "pages" cache.
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      // Wallet pages (with or without /fr|/en locale prefix) — always network,
      // never cache: HTML/RSC reflects session state (isLoggedIn, balances, KYC).
      {
        urlPattern: /^https?:\/\/[^/]+\/((fr|en)\/)?wallet(\/.*)?$/,
        handler: 'NetworkOnly',
      },
      // Wallet + auth API proxies — the default "apis" rule is NetworkFirst
      // (cacheable); session data must never be served stale.
      {
        urlPattern: /^https?:\/\/[^/]+\/api\/(wallet|auth)(\/.*)?$/,
        handler: 'NetworkOnly',
      },
    ],
  },
});

module.exports = withNextIntl(withPWAConfig(nextConfig));
