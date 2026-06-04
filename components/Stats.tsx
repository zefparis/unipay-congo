import { useTranslations } from 'next-intl';
import { Users, Wifi, Calendar } from 'lucide-react';

export default function Stats() {
  const t = useTranslations('stats');

  const stats = [
    { icon: Users, value: t('population'), label: t('population_label') },
    { icon: Wifi, value: t('networks'), label: t('networks_label') },
    { icon: Calendar, value: t('since'), label: t('since_label') },
  ];

  return (
    <section className="py-14 bg-gray-50 dark:bg-[#0d1420] border-y border-gray-200 dark:border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700">
          {stats.map(({ icon: Icon, value, label }, i) => (
            <div key={i} className="flex flex-col items-center text-center py-8 sm:py-0 sm:px-8 first:pt-0 sm:first:pt-0 last:pb-0 sm:last:pb-0 first:pl-0 last:pr-0">
              <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center mb-3">
                <Icon size={20} className="text-[#1D9E75]" />
              </div>
              <div className="text-4xl sm:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-1">
                {value}
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
