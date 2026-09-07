import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, BookOpen, ShieldCheck, Check } from 'lucide-react';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section
      className="relative h-[100svh] md:h-screen flex items-center pt-16 overflow-hidden bg-white dark:bg-navy"
    >
      {/* Subtle radial glow — same pattern as other sections, no image */}
      <div
        className="absolute inset-0 pointer-events-none dark:block"
        style={{
          background:
            'radial-gradient(ellipse at 70% 50%, rgba(15,110,86,0.08) 0%, transparent 60%)',
        }}
      />

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            {/* Institutional badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-panel/60 dark:bg-navy-panel/60 border border-gold/40 text-navy dark:text-text-primary text-sm font-medium mb-8">
              <ShieldCheck size={16} className="text-gold" />
              <span>{t('badge')}</span>
            </div>

            {/* Heading — serif. Navy in light mode, light in dark mode */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-navy dark:text-text-primary leading-[1.1] tracking-tight mb-6">
              {t('title')}
            </h1>

            {/* Subtitle — darker secondary in light, muted in dark */}
            <p className="text-lg sm:text-xl text-navy/70 dark:text-text-secondary leading-relaxed mb-10 max-w-lg">
              {t('subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-green-deep text-white font-semibold text-base hover:bg-green-deep/85 transition-all duration-200 shadow-lg shadow-green-deep/20"
              >
                {t('cta_primary')}
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#api"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-navy/30 dark:border-text-secondary/30 text-navy dark:text-text-primary font-semibold text-base hover:border-navy/60 dark:hover:border-text-secondary/60 hover:bg-navy/5 dark:hover:bg-navy-panel/30 transition-all duration-200"
              >
                <BookOpen size={18} />
                {t('cta_secondary')}
              </a>
            </div>
          </div>

          {/* Right: Trust panel — official document style */}
          <div className="hidden lg:block">
            <div className="relative rounded-xl border border-text-secondary/15 bg-navy-panel shadow-2xl shadow-black/40 overflow-hidden max-w-sm ml-auto">
              {/* Panel header */}
              <div className="px-6 py-4 border-b border-text-secondary/10 bg-navy/50">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-gold" />
                  <span className="text-sm font-serif font-semibold text-text-primary tracking-wide">
                    {t('panel_title')}
                  </span>
                </div>
              </div>

              {/* Panel body */}
              <div className="p-6 space-y-5">
                {/* License number */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
                    {t('panel_license_label')}
                  </p>
                  <p className="text-base font-mono text-text-primary leading-relaxed">
                    ASVA-ARPTC n°0573/008/Mars/2023
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-text-secondary/10" />

                {/* Connected networks */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3">
                    {t('panel_networks_label')}
                  </p>
                  <ul className="space-y-2.5">
                    {['Orange Money', 'Airtel Money', 'Afrimoney'].map((network) => (
                      <li key={network} className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-deep/15">
                          <Check size={12} className="text-green-deep" />
                        </span>
                        <span className="text-sm text-text-primary font-medium">{network}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Divider */}
                <div className="border-t border-text-secondary/10" />

                {/* Platform status */}
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-deep opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-deep" />
                  </span>
                  <span className="text-sm text-text-secondary font-medium">
                    {t('panel_status')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
