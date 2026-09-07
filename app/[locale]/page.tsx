import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Stats from '@/components/Stats';
import Features from '@/components/Features';
import LicenseBanner from '@/components/LicenseBanner';
import Channels from '@/components/Channels';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="overflow-x-hidden">
      <Hero />
      <HowItWorks />
      <Stats />
      <Features />
      <LicenseBanner />
      <Channels />
      <Footer />
    </main>
  );
}
