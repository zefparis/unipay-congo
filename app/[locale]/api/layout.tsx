import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'api_doc' });
  return pageMetadata({ locale, path: '/api', title: t('title'), description: t('subtitle') });
}

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
