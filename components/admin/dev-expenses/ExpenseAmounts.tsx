'use client';

import { formatMoney, getUnvalidatedAmount, getExpectedSettlementAmount, getRemainingAmount } from '@/lib/dev-expenses/formatters';
import type { DevExpenseV4 } from '@/lib/dev-expenses/types';

interface Props {
  expense: DevExpenseV4;
  locale: string;
}

export default function ExpenseAmounts({ expense, locale }: Props) {
  const unvalidated = getUnvalidatedAmount(expense);
  const expected = getExpectedSettlementAmount(expense);
  const remaining = getRemainingAmount(expense);
  const currency = expense.invoice_currency;

  const rows: { label: string; value: string; highlight?: boolean; muted?: boolean }[] = [
    { label: 'Montant facture', value: formatMoney(expense.invoice_amount ?? expense.amount_usd, currency, locale) },
    {
      label: 'Montant demandé',
      value: expense.requested_amount != null ? formatMoney(expense.requested_amount, currency, locale) : '—',
    },
    {
      label: 'Montant validé',
      value: expense.approved_amount != null ? formatMoney(expense.approved_amount, currency, locale) : '—',
    },
    {
      label: 'Montant réglé',
      value: formatMoney(expense.settled_amount, currency, locale),
    },
    {
      label: 'Reste dû',
      value: formatMoney(remaining, currency, locale),
      highlight: true,
    },
  ];

  if (unvalidated !== null && unvalidated > 0) {
    rows.push({
      label: 'Part non validée',
      value: formatMoney(unvalidated, currency, locale),
      muted: true,
    });
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Montants</h3>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className={`text-sm ${row.muted ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {row.label}
            </dt>
            <dd
              className={`font-mono text-sm ${
                row.highlight
                  ? 'font-bold text-gray-900 dark:text-white'
                  : row.muted
                    ? 'text-gray-400'
                    : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
