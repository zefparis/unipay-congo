import { useTranslations } from 'next-intl';
import { channels } from '@/constants/channels';
import { CheckCircle2 } from 'lucide-react';

export default function Channels() {
  const t = useTranslations('channels');

  return (
    <section id="api" className="py-24 bg-gray-50 dark:bg-[#0d1420]">
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

        {/* Channels grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="relative flex flex-col items-center p-7 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0f1e] overflow-hidden group hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              {/* Top color stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ backgroundColor: channel.color }}
              />

              {/* Logo avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-2xl font-heading font-bold text-white shadow-lg mt-2"
                style={{
                  backgroundColor: channel.color,
                  boxShadow: `0 8px 24px ${channel.color}40`,
                }}
              >
                {channel.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Name + description */}
              <h3 className="text-base font-heading font-bold text-gray-900 dark:text-white mb-1 text-center">
                {channel.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 text-center">
                {channel.description}
              </p>

              {/* Status badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={12} />
                {t('status_active')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
