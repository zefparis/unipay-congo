'use client';

import { Search, X } from 'lucide-react';
import { SORT_OPTIONS, PAGE_SIZE_OPTIONS } from '@/lib/dev-expenses/labels';

interface Props {
  search: string;
  status: string;
  supplierId: string;
  incurredByEntityId: string;
  coveredByEntityId: string;
  billingRecipientEntityId: string;
  currency: string;
  dateFrom: string;
  dateTo: string;
  archived: boolean;
  migrationReviewRequired: boolean;
  sort: string;
  order: 'asc' | 'desc';
  limit: number;
  suppliers: { id: string; name: string }[];
  entities: { id: string; display_name: string }[];
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSupplierChange: (v: string) => void;
  onIncurredByChange: (v: string) => void;
  onBillingRecipientChange: (v: string) => void;
  onCoveredByChange: (v: string) => void;
  onCurrencyChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onArchivedChange: (v: boolean) => void;
  onMigrationReviewChange: (v: boolean) => void;
  onSortChange: (v: string) => void;
  onOrderChange: (v: 'asc' | 'desc') => void;
  onLimitChange: (v: number) => void;
  onReset: () => void;
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

export default function ExpenseFilters(props: Props) {
  const hasActiveFilters =
    props.search || props.status || props.supplierId || props.incurredByEntityId ||
    props.coveredByEntityId || props.billingRecipientEntityId || props.currency || props.dateFrom || props.dateTo ||
    props.archived || props.migrationReviewRequired;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            placeholder="Rechercher par objet, fournisseur, projet…"
            className={inputCls + ' pl-9'}
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={props.onReset}
            className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Grid of filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>Statut</label>
          <select value={props.status} onChange={(e) => props.onStatusChange(e.target.value)} className={inputCls}>
            <option value="">Tous</option>
            <option value="draft">Brouillon</option>
            <option value="submitted">À valider</option>
            <option value="under_review">En vérification</option>
            <option value="approved">Validée</option>
            <option value="partially_approved">Validée partiellement</option>
            <option value="payment_scheduled">Paiement programmé</option>
            <option value="partially_paid">Partiellement payée</option>
            <option value="completed">Terminée</option>
            <option value="rejected">Refusée</option>
            <option value="disputed">Litige</option>
            <option value="cancelled">Annulée</option>
            <option value="archived">Archivée</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Fournisseur</label>
          <select value={props.supplierId} onChange={(e) => props.onSupplierChange(e.target.value)} className={inputCls}>
            <option value="">Tous</option>
            {props.suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Engagée par</label>
          <select value={props.incurredByEntityId} onChange={(e) => props.onIncurredByChange(e.target.value)} className={inputCls}>
            <option value="">Toutes</option>
            {props.entities.map((e) => (
              <option key={e.id} value={e.id}>{e.display_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Prise en charge par</label>
          <select value={props.coveredByEntityId} onChange={(e) => props.onCoveredByChange(e.target.value)} className={inputCls}>
            <option value="">Toutes</option>
            {props.entities.map((e) => (
              <option key={e.id} value={e.id}>{e.display_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Destinataire de facturation</label>
          <select value={props.billingRecipientEntityId} onChange={(e) => props.onBillingRecipientChange(e.target.value)} className={inputCls}>
            <option value="">Tous</option>
            {props.entities.map((e) => (
              <option key={e.id} value={e.id}>{e.display_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Devise</label>
          <select value={props.currency} onChange={(e) => props.onCurrencyChange(e.target.value)} className={inputCls}>
            <option value="">Toutes</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Du</label>
          <input type="date" value={props.dateFrom} onChange={(e) => props.onDateFromChange(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Au</label>
          <input type="date" value={props.dateTo} onChange={(e) => props.onDateToChange(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Tri</label>
          <div className="flex gap-2">
            <select value={props.sort} onChange={(e) => props.onSortChange(e.target.value)} className={inputCls}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select value={props.order} onChange={(e) => props.onOrderChange(e.target.value as 'asc' | 'desc')} className={inputCls + ' w-24'}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toggles + page size */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={props.archived}
            onChange={(e) => props.onArchivedChange(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-700 text-purple-600 focus:ring-purple-300"
          />
          Archives
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={props.migrationReviewRequired}
            onChange={(e) => props.onMigrationReviewChange(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-700 text-purple-600 focus:ring-purple-300"
          />
          Données à vérifier
        </label>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-gray-500">Par page</label>
          <select
            value={props.limit}
            onChange={(e) => props.onLimitChange(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
