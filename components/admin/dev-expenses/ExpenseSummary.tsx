'use client';

import { formatDate } from '@/lib/dev-expenses/formatters';
import type { DevExpenseV4, ExpenseEntity } from '@/lib/dev-expenses/types';

interface Props {
  expense: DevExpenseV4;
  entities: Record<string, ExpenseEntity>;
  suppliers: { id: string; name: string }[];
  locale: string;
}

export default function ExpenseSummary({ expense, entities, suppliers, locale }: Props) {
  const entityName = (id: string | null) => {
    if (!id) return '—';
    return entities[id]?.display_name ?? id;
  };
  const supplierName = (id: string | null) => {
    if (!id) return '—';
    return suppliers.find((s) => s.id === id)?.name ?? '—';
  };

  const rows: { label: string; value: string }[] = [
    { label: 'Fournisseur', value: supplierName(expense.creditor_id) },
    { label: 'Projet', value: expense.project_ref || expense.project_code },
    { label: 'Catégorie', value: expense.category },
    { label: 'Date de facture', value: formatDate(expense.invoice_date, locale) },
    { label: 'Mois de facturation', value: formatDate(expense.billing_month, locale) },
    { label: 'Date d\'échéance', value: formatDate(expense.due_date, locale) },
    { label: 'Devise', value: expense.invoice_currency },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Résumé</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-gray-500 dark:text-gray-400">{row.label}</dt>
            <dd className="text-sm text-gray-900 dark:text-white">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
