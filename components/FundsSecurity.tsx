import { useTranslations } from 'next-intl';
import { ShieldCheck, Workflow, Wallet, BadgeCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export default function FundsSecurity() {
  const t = useTranslations('funds_security');

  const points: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: ShieldCheck, title: t('p1_title'), desc: t('p1_desc') },
    { icon: Workflow,    title: t('p2_title'), desc: t('p2_desc') },
    { icon: Wallet,      title: t('p3_title'), desc: t('p3_desc') },
  ];

  return (
    <section
      id="funds-security"
      className="py-24 bg-[#E8EBF0] dark:bg-navy border-t border-text-secondary/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-deep/10 border border-green-deep/25 text-green-deep text-xs font-semibold mb-5">
            <ShieldCheck size={13} />
            {t('badge')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Points grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {points.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-gray-100 dark:border-text-secondary/15 bg-gray-50/50 dark:bg-navy-panel/40 hover:border-green-deep/40 dark:hover:border-green-deep/40 hover:shadow-lg hover:shadow-green-deep/5 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-green-deep/10 flex items-center justify-center mb-4 group-hover:bg-green-deep/20 transition-colors duration-300">
                <Icon size={22} className="text-green-deep" />
              </div>
              <h3 className="text-base font-serif font-semibold text-gray-900 dark:text-text-primary mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer note — references the ARPTC license shown in the Licenses section below */}
        <div className="mt-12 flex items-start gap-3 p-5 rounded-2xl border border-gold/20 bg-gold/5 dark:bg-gold/10 max-w-3xl mx-auto">
          <BadgeCheck size={20} className="text-gold flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 dark:text-text-secondary leading-relaxed">
            {t('license_note')}
          </p>
        </div>
      </div>
    </section>
  );
}
