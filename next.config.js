const createNextIntlPlugin = require('next-intl/plugin');
const withPWA = require('@ducanh2912/next-pwa').default;

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {};

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
