import { useTranslations } from 'next-intl';
import LegalLayout, { LegalSection } from '@/components/LegalLayout';

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
