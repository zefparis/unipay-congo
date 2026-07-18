'use client';

import { Link } from '@/i18n/navigation';
import { Receipt } from 'lucide-react';
import ExpenseStatusBadge from './ExpenseStatusBadge';
import ExpenseNextAction from './ExpenseNextAction';
import { formatDate, formatMoney, getRemainingAmount, isOverdue } from '@/lib/dev-expenses/formatters';
import type { DevExpenseV4, ExpenseEntity } from '@/lib/dev-expenses/types';

interface Props {
  expenses: DevExpenseV4[];
  suppliers: { id: string; name: string }[];
  entities: Record<string, ExpenseEntity>;
  locale: string;
}

export default function ExpenseTable({ expenses, suppliers, entities, locale }: Props) {
  const supplierName = (id: string | null) => {
    if (!id) return '—';
    return suppliers.find((s) => s.id === id)?.name ?? '—';
  };
  const entityName = (id: string | null) => {
    if (!id) return '—';
    return entities[id]?.display_name ?? '—';
  };

  return (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <th className="px-4 py-3">Facture / Objet</th>
            <th className="px-4 py-3">Fournisseur</th>
            <th className="px-4 py-3">Destinataire</th>
            <th className="px-4 py-3">Projet</th>
            <th className="px-4 py-3 text-right">Montant</th>
            <th className="px-4 py-3 text-right">Demandé</th>
            <th className="px-4 py-3 text-right">Validé</th>
            <th className="px-4 py-3 text-right">Réglé</th>
            <th className="px-4 py-3 text-right">Reste dû</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Échéance</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {expenses.map((e) => {
            const remaining = getRemainingAmount(e);
            const overdue = isOverdue(e);
            return (
              <tr
                key={e.id}
                className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/admin/dev-expenses/invoices/${e.id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    {e.title || e.category}
                  </Link>
                  {e.invoice_number && (
                    <span className="block text-xs text-gray-400">{e.invoice_number}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {supplierName(e.creditor_id)}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {entityName(e.billing_recipient_entity_id)}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {e.project_ref || e.project_code}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                  {formatMoney(e.invoice_amount ?? e.amount_usd, e.invoice_currency, locale)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                  {e.requested_amount != null ? formatMoney(e.requested_amount, e.invoice_currency, locale) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                  {e.approved_amount != null ? formatMoney(e.approved_amount, e.invoice_currency, locale) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                  {formatMoney(e.settled_amount, e.invoice_currency, locale)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900 dark:text-white">
                  {formatMoney(remaining, e.invoice_currency, locale)}
                </td>
                <td className="px-4 py-3">
                  <ExpenseStatusBadge status={e.status_v4} />
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {formatDate(e.due_date, locale)}
                  {overdue && (
                    <span className="block text-xs text-red-600 dark:text-red-400 font-medium">En retard</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ExpenseNextAction expense={e} compact />
                </td>
              </tr>
            );
          })}
          {expenses.length === 0 && (
            <tr>
              <td colSpan={12} className="px-4 py-12 text-center text-gray-400">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Aucune facture
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
