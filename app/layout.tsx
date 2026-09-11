import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Space_Grotesk, DM_Sans, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import ProtectionBadge from '@/components/ProtectionBadge';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'UniPay Congo — Paiements mobiles unifiés pour la RDC',
  description:
    'Agrégateur de paiements mobiles licencié en République Démocratique du Congo. Intégrez Orange Money, Airtel Money, Afrimoney via une seule API.',
  metadataBase: new URL('https://unipaycongo.com'),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'UniPay Congo — Paiements mobiles unifiés pour la RDC',
    description:
      'Agrégateur de paiements mobiles licencié en RDC. Intégrez Orange Money, Airtel Money, Afrimoney via une seule API.',
    url: 'https://unipaycongo.com',
    siteName: 'UniPay Congo',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'UniPay Congo — Your Payment Infrastructure in DRC' }],
    locale: 'fr_CD',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${sourceSerif.variable}`}>
      <body>
        {children}
        <ProtectionBadge />
        <Script
          src="https://hcs-widget-mvp.vercel.app/widget/v3/hcs-widget.js"
          data-widget="wid_252792d76ceaa21f2d263aab"
          data-badge="false"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
