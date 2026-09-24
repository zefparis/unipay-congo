import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, DM_Sans, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/ThemeProvider';
import NavbarWrapper from '@/components/NavbarWrapper';
import NavbarConditional from '@/components/NavbarConditional';
import ProtectionBadge from '@/components/ProtectionBadge';
import '../globals.css';

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
  title: {
    default: 'UniPay Congo — Paiements mobiles unifiés pour la RDC',
    template: '%s — UniPay Congo',
  },
  description:
    'Agrégateur de paiements mobiles licencié en République Démocratique du Congo. Intégrez Orange Money, Airtel Money, Afrimoney via une seule API.',
  metadataBase: new URL('https://www.unipaycongo.com'),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'UniPay Congo — Paiements mobiles unifiés pour la RDC',
    description:
      'Agrégateur de paiements mobiles licencié en RDC. Intégrez Orange Money, Airtel Money, Afrimoney via une seule API.',
    url: 'https://www.unipaycongo.com',
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params: { locale } }: LocaleLayoutProps) {
  if (!routing.locales.includes(locale as 'fr' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${sourceSerif.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
            <NavbarConditional>
              <NavbarWrapper />
            </NavbarConditional>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
        <ProtectionBadge />
      </body>
    </html>
  );
}
