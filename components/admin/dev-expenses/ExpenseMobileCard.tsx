'use client';

import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import ExpenseStatusBadge from './ExpenseStatusBadge';
import ExpenseNextAction from './ExpenseNextAction';
import { formatDate, formatMoney, getRemainingAmount, isOverdue } from '@/lib/dev-expenses/formatters';
import type { DevExpenseV4 } from '@/lib/dev-expenses/types';

interface Props {
  expenses: DevExpenseV4[];
  suppliers: { id: string; name: string }[];
  locale: string;
}

export default function ExpenseMobileCard({ expenses, suppliers, locale }: Props) {
  const supplierName = (id: string | null) => {
    if (!id) return '—';
    return suppliers.find((s) => s.id === id)?.name ?? '—';
  };

  return (
    <div className="md:hidden space-y-3">
      {expenses.map((e) => {
        const remaining = getRemainingAmount(e);
        const overdue = isOverdue(e);
        return (
          <Link
            key={e.id}
            href={`/dashboard/admin/dev-expenses/invoices/${e.id}`}
            className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {e.title || e.category}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {supplierName(e.creditor_id)} · {e.project_ref || e.project_code}
                </p>
              </div>
              <ExpenseStatusBadge status={e.status_v4} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {formatMoney(e.invoice_amount ?? e.amount_usd, e.invoice_currency, locale)}
                </p>
                <p className="text-xs text-gray-500">
                  Reste dû : <span className="font-medium text-gray-700 dark:text-gray-300">{formatMoney(remaining, e.invoice_currency, locale)}</span>
                </p>
              </div>
              <div className="text-right">
                {overdue && (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium block">En retard</span>
                )}
                <ExpenseNextAction expense={e} compact />
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto mt-1" />
              </div>
            </div>
          </Link>
        );
      })}
      {expenses.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">Aucune facture</div>
      )}
    </div>
  );
}
