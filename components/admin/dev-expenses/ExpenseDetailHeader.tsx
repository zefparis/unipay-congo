'use client';

import { useRouter } from '@/i18n/navigation';
import { ArrowLeft, Receipt } from 'lucide-react';
import ExpenseStatusBadge from './ExpenseStatusBadge';
import ExpenseNextAction from './ExpenseNextAction';
import { formatMoney, getRemainingAmount } from '@/lib/dev-expenses/formatters';
import { getTechnicalStatusLabel } from '@/lib/dev-expenses/labels';
import type { DevExpenseV4 } from '@/lib/dev-expenses/types';

interface Props {
  expense: DevExpenseV4;
  locale: string;
}

export default function ExpenseDetailHeader({ expense, locale }: Props) {
  const router = useRouter();
  const remaining = getRemainingAmount(expense);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.push('/dashboard/admin/dev-expenses/invoices')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Receipt className="w-5 h-5 text-purple-600" />
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">
          {expense.title || expense.category}
        </h1>
        <ExpenseStatusBadge status={expense.status_v4} size="md" />
      </div>

      {expense.status_v4 && (
        <p className="text-xs text-gray-400 mb-4">
          Statut technique : {getTechnicalStatusLabel(expense.status_v4)}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Montant</p>
          <p className="font-mono font-semibold text-gray-900 dark:text-white">
            {formatMoney(expense.invoice_amount ?? expense.amount_usd, expense.invoice_currency, locale)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reste dû</p>
          <p className="font-mono font-semibold text-gray-900 dark:text-white">
            {formatMoney(remaining, expense.invoice_currency, locale)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">N° facture</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{expense.invoice_number || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prochaine action</p>
          <ExpenseNextAction expense={expense} />
        </div>
      </div>
    </div>
  );
}
