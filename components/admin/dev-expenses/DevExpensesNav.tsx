'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { LayoutGrid, FileText, FileSearch, Building2, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard/admin/dev-expenses', label: 'Vue d\'ensemble', icon: LayoutGrid, exact: true },
  { href: '/dashboard/admin/dev-expenses/invoices', label: 'Factures', icon: FileText, exact: false },
  { href: '/dashboard/admin/dev-expenses/quotes', label: 'Devis', icon: FileSearch, exact: false },
  { href: '/dashboard/admin/dev-expenses/suppliers', label: 'Fournisseurs', icon: Building2, exact: false },
  { href: '/dashboard/admin/dev-expenses/reports', label: 'Rapports', icon: BarChart3, exact: false },
];

export default function DevExpensesNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            isActive(href, exact)
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400',
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
