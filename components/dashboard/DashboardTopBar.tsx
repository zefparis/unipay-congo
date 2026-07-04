'use client';

import { Menu, User } from 'lucide-react';

interface DashboardTopBarProps {
  onMenuClick: () => void;
}

export default function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 z-50 bg-white dark:bg-ink border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="p-2 -ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {/* Brand — centered */}
      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <div className="w-7 h-7 rounded-lg bg-signal flex items-center justify-center shadow-sm shadow-signal/30">
          <span className="text-white font-heading font-bold text-xs leading-none">U</span>
        </div>
        <span className="font-heading font-bold text-sm text-gray-900 dark:text-white">
          UniPay<span className="text-signal">Congo</span>
        </span>
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-signal/10 border-2 border-signal/25 flex items-center justify-center flex-shrink-0">
        <User size={17} className="text-signal" />
      </div>
    </header>
  );
}
