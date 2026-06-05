'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { LayoutDashboard, ArrowLeftRight, Key, Webhook, LogOut, X } from 'lucide-react';
import clsx from 'clsx';

interface DashboardSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ mobileOpen = false, onClose }: DashboardSidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard', label: t('dashboard.nav.overview'), icon: LayoutDashboard, exact: true },
    { href: '/dashboard/transactions', label: t('dashboard.nav.transactions'), icon: ArrowLeftRight, exact: false },
    { href: '/dashboard/api-keys', label: t('dashboard.nav.api_keys'), icon: Key, exact: false },
    { href: '/dashboard/webhooks', label: t('dashboard.nav.webhooks'), icon: Webhook, exact: false },
  ];

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const Inner = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <Link href="/" onClick={onItemClick}>
          <Image src="/logo.png" alt="UniPay Congo" height={32} width={100} priority />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={onItemClick}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive(href, exact)
                ? 'bg-[#1D9E75]/10 text-[#1D9E75] dark:bg-[#1D9E75]/15 dark:text-[#22b587]'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={18} />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — full height, global Navbar is hidden on dashboard routes */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#0a0f1e] border-r border-gray-200 dark:border-gray-800 z-40">
        <Inner />
      </aside>

      {/* Mobile overlay — toggled by DashboardTopBar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative w-72 h-full bg-white dark:bg-[#0a0f1e] border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <Inner onItemClick={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
