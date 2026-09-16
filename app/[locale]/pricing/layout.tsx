import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return pageMetadata({ locale, path: '/pricing', title: t('title'), description: t('subtitle') });
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
