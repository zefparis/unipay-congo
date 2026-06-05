'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { Sun, Moon, Menu, X } from 'lucide-react';
import Image from 'next/image';

interface NavbarProps {
  isAuthenticated?: boolean;
}

export default function Navbar({ isAuthenticated = false }: NavbarProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const switchLocale = () => {
    router.push(pathname, { locale: locale === 'fr' ? 'en' : 'fr' });
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navLinks = [
    { href: '#solutions', label: t('solutions'), isRoute: false },
    { href: '#licences', label: t('licences'), isRoute: false },
    { href: '/pricing', label: t('pricing'), isRoute: true },
    { href: '/api', label: t('api'), isRoute: true },
    { href: '/contact', label: t('contact'), isRoute: true },
    ...(isAuthenticated ? [{ href: '/dashboard', label: t('dashboard'), isRoute: true }] : []),
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-[#0a0f1e]/90 backdrop-blur-md shadow-sm border-b border-gray-200/80 dark:border-gray-800/80'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src={mounted && theme === 'dark' ? '/logodark.png' : '/logo.png'}
              alt="UniPay Congo"
              height={40}
              width={120}
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#1D9E75] dark:hover:text-[#1D9E75] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#1D9E75] dark:hover:text-[#1D9E75] transition-colors duration-200"
                >
                  {link.label}
                </a>
              )
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={switchLocale}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#1D9E75] hover:text-[#1D9E75] dark:hover:border-[#1D9E75] dark:hover:text-[#1D9E75] transition-all duration-200"
            >
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {mounted ? (
                theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />
              ) : (
                <Moon size={17} />
              )}
            </button>

            {/* CTA / Logout */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400 transition-all duration-200"
              >
                {t('logout')}
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:border-[#1D9E75] hover:text-[#1D9E75] dark:hover:border-[#1D9E75] dark:hover:text-[#1D9E75] transition-all duration-200"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#178a65] transition-all duration-200 shadow-sm shadow-[#1D9E75]/20"
                >
                  {t('cta')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-[#0a0f1e] border-t border-gray-200 dark:border-gray-800 px-4 py-5 flex flex-col gap-4 shadow-lg">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#1D9E75] py-1 transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#1D9E75] py-1 transition-colors"
              >
                {link.label}
              </a>
            )
          )}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={switchLocale}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#1D9E75] hover:text-[#1D9E75]"
            >
              {locale === 'fr' ? 'EN' : 'FR'}
            </button>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex-1 text-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:border-red-400 hover:text-red-500 transition-colors"
              >
                {t('logout')}
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2 rounded-lg bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#178a65] transition-colors"
                >
                  {t('cta')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
