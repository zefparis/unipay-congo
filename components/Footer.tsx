import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import BrandLogo from './BrandLogo';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer id="contact" className="py-12 bg-[#E8EBF0] dark:bg-navy border-t border-gray-200 dark:border-text-secondary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <BrandLogo size={36} />

          {/* Quick nav */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {['#solutions', '#licences', '#api', '#contact'].map((href) => (
              <a
                key={href}
                href={href}
                className="text-sm text-gray-500 dark:text-text-secondary hover:text-green-deep dark:hover:text-green-deep transition-colors capitalize"
              >
                {href.replace('#', '')}
              </a>
            ))}
          </nav>

          {/* Legal */}
          <div className="text-center md:text-right">
            <p className="text-xs text-gray-500 dark:text-text-secondary leading-relaxed">
              {t('copyright')}
            </p>
            <p className="text-xs text-gray-400 dark:text-text-secondary/70 mt-1">
              {t('rights')}
            </p>
          </div>
        </div>

        {/* Legal pages */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-text-secondary/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            href="/legal"
            className="text-xs text-gray-400 dark:text-text-secondary/70 hover:text-green-deep dark:hover:text-green-deep transition-colors"
          >
            {t('legal_link')}
          </Link>
          <Link
            href="/privacy"
            className="text-xs text-gray-400 dark:text-text-secondary/70 hover:text-green-deep dark:hover:text-green-deep transition-colors"
          >
            {t('privacy_link')}
          </Link>
          <Link
            href="/terms"
            className="text-xs text-gray-400 dark:text-text-secondary/70 hover:text-green-deep dark:hover:text-green-deep transition-colors"
          >
            {t('terms_link')}
          </Link>
          <Link
            href="/status"
            className="text-xs text-gray-400 dark:text-text-secondary/70 hover:text-green-deep dark:hover:text-green-deep transition-colors"
          >
            {t('status_link')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
