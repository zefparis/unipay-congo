import { useTranslations } from 'next-intl';
import { Code2, Shield, LayoutDashboard, BarChart3, Headphones, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export default function Features() {
  const t = useTranslations('features');

  const features: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: Code2, title: t('f1_title'), desc: t('f1_desc') },
    { icon: Shield, title: t('f2_title'), desc: t('f2_desc') },
    { icon: LayoutDashboard, title: t('f3_title'), desc: t('f3_desc') },
    { icon: BarChart3, title: t('f4_title'), desc: t('f4_desc') },
    { icon: Headphones, title: t('f5_title'), desc: t('f5_desc') },
    { icon: Zap, title: t('f6_title'), desc: t('f6_desc') },
  ];

  return (
    <section id="solutions" className="py-24 bg-white dark:bg-[#0a0f1e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0d1420] hover:border-[#1D9E75]/40 dark:hover:border-[#1D9E75]/40 hover:shadow-lg hover:shadow-[#1D9E75]/5 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center mb-4 group-hover:bg-[#1D9E75]/20 transition-colors duration-300">
                <Icon size={22} className="text-[#1D9E75]" />
              </div>
              <h3 className="text-base font-heading font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
