import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import LegalLayout, { LegalSection } from '@/components/LegalLayout';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'legal' });
  return pageMetadata({ locale, path: '/legal', title: t('title'), description: t('subtitle') });
}

export default function LegalPage() {
  const t = useTranslations('legal');

  const sections: LegalSection[] = [
    {
      id: 'editeur',
      title: t('editeur_title'),
      body: t('editeur_body'),
    },
    {
      id: 'directeur',
      title: t('directeur_title'),
      body: t('directeur_body'),
    },
    {
      id: 'hebergement',
      title: t('hebergement_title'),
      body: t('hebergement_body'),
    },
    {
      id: 'propriete',
      title: t('propriete_title'),
      body: t('propriete_body'),
    },
    {
      id: 'responsabilite',
      title: t('responsabilite_title'),
      body: t('responsabilite_body'),
    },
    {
      id: 'droit',
      title: t('droit_title'),
      body: t('droit_body'),
    },
  ];

  return (
    <LegalLayout
      badge={t('badge')}
      title={t('title')}
      subtitle={t('subtitle')}
      updated={t('updated')}
      tocLabel={t('toc_label')}
      back={t('back')}
      sections={sections}
    />
  );
}
