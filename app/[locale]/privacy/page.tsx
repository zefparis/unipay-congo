import { useTranslations } from 'next-intl';
import LegalLayout, { LegalSection } from '@/components/LegalLayout';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  const sections: LegalSection[] = [
    {
      id: 'responsable',
      title: t('responsable_title'),
      body: t('responsable_body'),
    },
    {
      id: 'donnees',
      title: t('donnees_title'),
      intro: t('donnees_intro'),
      list: [t('donnees_li1'), t('donnees_li2'), t('donnees_li3'), t('donnees_li4')],
    },
    {
      id: 'finalites',
      title: t('finalites_title'),
      intro: t('finalites_intro'),
      list: [
        t('finalites_li1'),
        t('finalites_li2'),
        t('finalites_li3'),
        t('finalites_li4'),
        t('finalites_li5'),
        t('finalites_li6'),
      ],
    },
    {
      id: 'base-legale',
      title: t('base_legale_title'),
      intro: t('base_legale_intro'),
      list: [
        t('base_legale_li1'),
        t('base_legale_li2'),
        t('base_legale_li3'),
        t('base_legale_li4'),
      ],
    },
    {
      id: 'conservation',
      title: t('conservation_title'),
      intro: t('conservation_intro'),
      list: [t('conservation_li1'), t('conservation_li2'), t('conservation_li3')],
    },
    {
      id: 'destinataires',
      title: t('destinataires_title'),
      intro: t('destinataires_intro'),
      list: [t('destinataires_li1'), t('destinataires_li2'), t('destinataires_li3')],
      footer: t('destinataires_footer'),
    },
    {
      id: 'droits',
      title: t('droits_title'),
      intro: t('droits_intro'),
      list: [
        t('droits_li1'),
        t('droits_li2'),
        t('droits_li3'),
        t('droits_li4'),
        t('droits_li5'),
      ],
      footer: t('droits_footer'),
    },
    {
      id: 'securite',
      title: t('securite_title'),
      body: t('securite_body'),
    },
    {
      id: 'cookies',
      title: t('cookies_title'),
      body: t('cookies_body'),
    },
    {
      id: 'dpo',
      title: t('dpo_title'),
      body: t('dpo_body'),
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
