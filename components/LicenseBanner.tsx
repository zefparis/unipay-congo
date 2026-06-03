import { useTranslations } from 'next-intl';
import { BadgeCheck, Building2 } from 'lucide-react';

export default function LicenseBanner() {
  const t = useTranslations('license');

  return (
    <section
      id="licences"
      className="py-16 bg-gradient-to-br from-[#1D9E75]/8 via-transparent to-[#1D9E75]/8 dark:from-[#1D9E75]/10 dark:via-[#0a0f1e] dark:to-[#1D9E75]/10 border-y border-[#1D9E75]/15 dark:border-[#1D9E75]/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Icon */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[#1D9E75] flex items-center justify-center shadow-lg shadow-[#1D9E75]/30">
            <BadgeCheck size={30} className="text-white" />
          </div>

          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-2">
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
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 border-[#1D9E75]/30 bg-white dark:bg-[#0a0f1e] shadow-inner">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
              ARPTC
            </div>
            <div className="text-3xl font-heading font-bold text-[#1D9E75]">2023</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-0.5">
              RDC
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
