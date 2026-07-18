'use client';

import { formatDate } from '@/lib/dev-expenses/formatters';
import type { DevExpenseV4, ExpenseEntity } from '@/lib/dev-expenses/types';

const SNAPSHOT_COMPARE_FIELDS: readonly string[] = [
  'legal_name',
  'trade_name',
  'registration_number',
  'tax_id',
  'vat_number',
  'address_line_1',
  'address_line_2',
  'postal_code',
  'city',
  'region',
  'country_code',
  'contact_name',
  'billing_email',
  'phone',
];

const FIELD_LABELS: Record<string, string> = {
  legal_name: 'Nom légal',
  trade_name: 'Nom commercial',
  registration_number: 'N° d\'enregistrement',
  tax_id: 'Identifiant fiscal',
  vat_number: 'N° de TVA',
  address_line_1: 'Adresse',
  address_line_2: 'Complément d\'adresse',
  postal_code: 'Code postal',
  city: 'Ville',
  region: 'Région',
  country_code: 'Pays',
  contact_name: 'Contact',
  billing_email: 'Email de facturation',
  phone: 'Téléphone',
};

function getBillingSnapshotDifference(
  snapshot: Record<string, unknown> | null,
  entity: ExpenseEntity | null,
): { differs: boolean; changedFields: string[] } {
  if (!snapshot || !entity) return { differs: false, changedFields: [] };
  const changedFields: string[] = [];
  for (const field of SNAPSHOT_COMPARE_FIELDS) {
    const snapshotVal = snapshot[field] ?? null;
    let entityVal: unknown;
    if (field === 'address_line_1') {
      entityVal = entity.address_line_1 ?? entity.address ?? null;
    } else if (field === 'billing_email') {
      entityVal = entity.billing_email ?? entity.email ?? null;
    } else {
      entityVal = (entity as unknown as Record<string, unknown>)[field] ?? null;
    }
    const norm = (v: unknown) => (v === '' ? null : v);
    if (norm(snapshotVal) !== norm(entityVal)) {
      changedFields.push(field);
    }
  }
  return { differs: changedFields.length > 0, changedFields };
}

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

  const billingRecipientName = (id: string | null) => {
    if (!id) return '—';
    return entities[id]?.display_name ?? id;
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

  const snapshot = expense.billing_recipient_snapshot as Record<string, unknown> | null;
  const snapshotDate = (snapshot?.captured_at ?? snapshot?.snapshot_at) as string | undefined;
  const currentEntity = expense.billing_recipient_entity_id ? entities[expense.billing_recipient_entity_id] : null;
  const diff = getBillingSnapshotDifference(snapshot, currentEntity);

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

      {/* Facturation block */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Facturation</h4>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Émetteur</dt>
            <dd className="text-sm text-gray-900 dark:text-white">{supplierName(expense.creditor_id)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Destinataire</dt>
            <dd className="text-sm text-gray-900 dark:text-white">
              {billingRecipientName(expense.billing_recipient_entity_id)}
              {expense.billing_recipient_reviewed && (
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Vérifié
                </span>
              )}
            </dd>
          </div>
          {snapshotDate && (
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400">Snapshot</dt>
              <dd className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(snapshotDate, locale)}
                {diff.differs && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Coordonnées actuelles différentes
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>
        {diff.differs && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Champs modifiés depuis le snapshot :</p>
            <ul className="flex flex-wrap gap-1.5">
              {diff.changedFields.map((field) => (
                <li key={field} className="text-[11px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                  {FIELD_LABELS[field] ?? field}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
