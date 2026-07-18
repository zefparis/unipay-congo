'use client';

import { INITIAL_PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/dev-expenses/labels';
import type { DevExpenseV4, ExpenseEntity } from '@/lib/dev-expenses/types';

interface Props {
  expense: DevExpenseV4;
  entities: Record<string, ExpenseEntity>;
}

export default function ExpenseResponsibilities({ expense, entities }: Props) {
  const entityName = (id: string | null) => {
    if (!id) return '—';
    return entities[id]?.display_name ?? id;
  };

  const rows: { label: string; value: string }[] = [
    { label: 'Engagée par', value: entityName(expense.incurred_by_entity_id) },
    { label: 'Payée initialement par', value: entityName(expense.initially_paid_by_entity_id) },
    { label: 'Prise en charge par', value: entityName(expense.covered_by_entity_id) },
    { label: 'Remboursement destiné à', value: entityName(expense.reimbursement_recipient_entity_id) },
    { label: 'Destinataire de facturation', value: entityName(expense.billing_recipient_entity_id) },
    {
      label: 'Situation du paiement',
      value: expense.initial_payment_status
        ? INITIAL_PAYMENT_STATUS_LABELS[expense.initial_payment_status] ?? expense.initial_payment_status
        : '—',
    },
    {
      label: 'Moyen de paiement initial',
      value: expense.initial_payment_method
        ? PAYMENT_METHOD_LABELS[expense.initial_payment_method] ?? expense.initial_payment_method
        : '—',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Responsabilités</h3>
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
