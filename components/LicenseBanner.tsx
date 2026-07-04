import { useTranslations } from 'next-intl';
import { BadgeCheck, Building2 } from 'lucide-react';

export default function LicenseBanner() {
  const t = useTranslations('license');

  return (
    <section
      id="licences"
      className="py-16 bg-gradient-to-br from-signal/8 via-transparent to-signal/8 dark:from-signal/10 dark:via-ink dark:to-signal/10 border-y border-signal/15 dark:border-signal/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Icon */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-signal flex items-center justify-center shadow-lg shadow-signal/30">
            <BadgeCheck size={30} className="text-white" />
          </div>

          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-signal mb-2">
              <Building2 size={11} />
              {t('label')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
              {t('number')}
            </h2>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
              {t('company')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t('description')}
            </p>
          </div>

          {/* Stamp badge */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-signal/30 bg-white dark:bg-ink shadow-inner">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
              ARPTC
            </div>
            <div className="text-3xl font-heading font-bold text-signal">2023</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-0.5">
              RDC
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
