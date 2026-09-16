import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Stats from '@/components/Stats';
import Features from '@/components/Features';
import FundsSecurity from '@/components/FundsSecurity';
import LicenseBanner from '@/components/LicenseBanner';
import Channels from '@/components/Channels';
import Footer from '@/components/Footer';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'hero' });
  return pageMetadata({ locale, title: t('title'), description: t('subtitle') });
}

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <HowItWorks />
      <Stats />
      <Features />
      <FundsSecurity />
      <LicenseBanner />
      <Channels />
      <Footer />
    </main>
  );
}
