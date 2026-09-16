import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

const BASE_URL = 'https://www.unipaycongo.com';

interface PageMetadataOptions {
  locale: string;
  /** Path after the locale prefix — '' for the locale home, '/pricing', etc. */
  path?: string;
  title?: string;
  description?: string;
}

/**
 * Builds per-page metadata with a self-referencing canonical URL and hreflang
 * alternates (fr, en, x-default → default locale). Absolute URLs are emitted
 * so the tags never depend on metadataBase resolution.
 */
export function pageMetadata({ locale, path = '', title, description }: PageMetadataOptions): Metadata {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${BASE_URL}/${l}${path}`;
  }
  languages['x-default'] = `${BASE_URL}/${routing.defaultLocale}${path}`;

  const canonical = `${BASE_URL}/${locale}${path}`;

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: { url: canonical, title, description },
  };
}
