import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'status' });
  return pageMetadata({ locale, path: '/status', title: t('title'), description: t('subtitle') });
}

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
