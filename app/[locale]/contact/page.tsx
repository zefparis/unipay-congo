import { useTranslations } from 'next-intl';
import { MapPin, Phone, Mail, Globe, ShieldCheck } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const t = useTranslations('contact_page');

  const infoItems = [
    {
      icon: MapPin,
      label: t('address_label'),
      value: t('address'),
      href: 'https://maps.google.com/?q=195+Avenue+Colonel+Ebeya,+Gombe,+Kinshasa,+RDC',
    },
    {
      icon: Phone,
      label: t('phone_label'),
      value: t('phone'),
      href: 'tel:+243891023520',
    },
    {
      icon: Mail,
      label: t('email_label'),
      value: t('email'),
      href: 'mailto:contact@unipaycongo.com',
    },
    {
      icon: Globe,
      label: t('website_label'),
      value: t('website'),
      href: 'https://unipaycongo.com',
    },
  ];

  return (
    <>
      <main className="min-h-screen bg-white dark:bg-[#0a0f1e] pt-16">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-20 lg:py-28">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/40 to-white dark:from-[#0a0f1e] dark:via-[#0d1a2e] dark:to-[#0a0f1e]" />

          {/* Decorative blobs */}
          <div className="absolute top-0 right-[-5%] w-96 h-96 bg-[#1D9E75]/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-[-5%] w-64 h-64 bg-[#1D9E75]/6 rounded-full blur-3xl pointer-events-none" />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#1D9E75 1px, transparent 1px), linear-gradient(90deg, #1D9E75 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/25 text-[#1D9E75] text-sm font-medium mb-6">
              <ShieldCheck size={15} />
              <span>{t('hero_badge')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-5">
              {t('hero_title')}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
              {t('hero_subtitle')}
            </p>
          </div>
        </section>

        {/* ── Contact grid ─────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid lg:grid-cols-5 gap-8">

            {/* Left: Info card (2/5) */}
            <div className="lg:col-span-2">
              <div className="h-full rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1420] p-8">
                <h2 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-8">
                  {t('info_title')}
                </h2>

                <ul className="space-y-7">
                  {infoItems.map(({ icon: Icon, label, value, href }) => (
                    <li key={label} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={18} className="text-[#1D9E75]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                          {label}
                        </p>
                        <a
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-sm text-gray-800 dark:text-gray-200 hover:text-[#1D9E75] dark:hover:text-[#1D9E75] transition-colors leading-relaxed"
                        >
                          {value}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Decorative accent */}
                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Kinshasa, RDC · UTC+2
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form (3/5) */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1420] p-8">
                <h2 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-8">
                  {t('form_title')}
                </h2>
                <ContactForm />
              </div>
            </div>

          </div>
        </section>

        {/* ── Google Maps ──────────────────────────────────── */}
        <section className="w-full pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
              {t('map_title')}
            </h2>
          </div>
          <div className="w-full h-80 sm:h-96 lg:h-[460px] overflow-hidden border-t border-gray-100 dark:border-gray-800">
            <iframe
              title={t('map_title')}
              src="https://maps.google.com/maps?q=Gombe,+Kinshasa,+Democratic+Republic+of+the+Congo&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(20%)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
