'use client';

import { useState, useEffect } from 'react';
import { Menu, User, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Link } from '@/i18n/navigation';
import BrandLogo from '../BrandLogo';

interface DashboardTopBarProps {
  onMenuClick: () => void;
}

export default function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 z-50 bg-white dark:bg-navy border-b border-gray-200 dark:border-text-secondary/15 flex items-center justify-between px-4">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="p-2 -ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {/* Brand — centered */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <BrandLogo size={28} />
      </div>

      {/* Right actions: theme toggle + profile link */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />
          ) : (
            <Moon size={20} />
          )}
        </button>

        {/* Profile — direct link to /dashboard/profile */}
        <Link
          href="/dashboard/profile"
          className="w-9 h-9 min-h-[44px] min-w-[44px] rounded-full bg-green-deep/10 border-2 border-green-deep/25 flex items-center justify-center flex-shrink-0 hover:bg-green-deep/20 transition-colors"
          aria-label="View profile"
        >
          <User size={17} className="text-green-deep" />
        </Link>
      </div>
    </header>
  );
}
