import { useTranslations } from 'next-intl';
import LegalLayout, { LegalSection } from '@/components/LegalLayout';

export default function TermsPage() {
  const t = useTranslations('terms');

  const sections: LegalSection[] = [
    {
      id: 'objet',
      title: t('objet_title'),
      body: t('objet_body'),
    },
    {
      id: 'acceptation',
      title: t('acceptation_title'),
      body: t('acceptation_body'),
    },
    {
      id: 'description',
      title: t('description_title'),
      body: [t('description_body1'), t('description_body2')],
    },
    {
      id: 'acces',
      title: t('acces_title'),
      body: t('acces_body'),
    },
    {
      id: 'obligations-client',
      title: t('obligations_client_title'),
      intro: t('obligations_client_intro'),
      list: [
        t('obligations_client_li1'),
        t('obligations_client_li2'),
        t('obligations_client_li3'),
        t('obligations_client_li4'),
        t('obligations_client_li5'),
        t('obligations_client_li6'),
      ],
    },
    {
      id: 'obligations-unipay',
      title: t('obligations_unipay_title'),
      intro: t('obligations_unipay_intro'),
      list: [
        t('obligations_unipay_li1'),
        t('obligations_unipay_li2'),
        t('obligations_unipay_li3'),
        t('obligations_unipay_li4'),
        t('obligations_unipay_li5'),
      ],
    },
    {
      id: 'tarification',
      title: t('tarification_title'),
      body: t('tarification_body'),
    },
    {
      id: 'responsabilite',
      title: t('responsabilite_title'),
      body: t('responsabilite_body'),
    },
    {
      id: 'propriete',
      title: t('propriete_title'),
      body: t('propriete_body'),
    },
    {
      id: 'confidentialite',
      title: t('confidentialite_title'),
      body: t('confidentialite_body'),
    },
    {
      id: 'suspension',
      title: t('suspension_title'),
      body: t('suspension_body'),
    },
    {
      id: 'droit',
      title: t('droit_title'),
      body: t('droit_body'),
    },
    {
      id: 'contact',
      title: t('contact_title'),
      body: t('contact_body'),
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
