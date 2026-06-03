import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer id="contact" className="py-12 bg-white dark:bg-[#0a0f1e] border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#1D9E75] flex items-center justify-center shadow-md shadow-[#1D9E75]/30">
              <span className="text-white font-heading font-bold text-sm leading-none">U</span>
            </div>
            <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">
              UniPay<span className="text-[#1D9E75]">Congo</span>
            </span>
          </div>

          {/* Quick nav */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {['#solutions', '#licences', '#api', '#contact'].map((href) => (
              <a
                key={href}
                href={href}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#1D9E75] dark:hover:text-[#1D9E75] transition-colors capitalize"
              >
                {href.replace('#', '')}
              </a>
            ))}
          </nav>

          {/* Legal */}
          <div className="text-center md:text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('copyright')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('rights')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
