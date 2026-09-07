'use client';

import { Menu, User } from 'lucide-react';
import BrandLogo from '../BrandLogo';

interface DashboardTopBarProps {
  onMenuClick: () => void;
}

export default function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
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

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-green-deep/10 border-2 border-green-deep/25 flex items-center justify-center flex-shrink-0">
        <User size={17} className="text-green-deep" />
      </div>
    </header>
  );
}
