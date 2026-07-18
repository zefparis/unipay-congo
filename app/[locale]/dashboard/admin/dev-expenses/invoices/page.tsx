'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Plus, RefreshCw, Check, AlertCircle, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import ExpenseTable from '@/components/admin/dev-expenses/ExpenseTable';
import ExpenseMobileCard from '@/components/admin/dev-expenses/ExpenseMobileCard';
import ExpenseFilters from '@/components/admin/dev-expenses/ExpenseFilters';
import ExpenseForm from '@/components/admin/dev-expenses/ExpenseForm';
import Spinner from '@/components/admin/dev-expenses/Spinner';
import EmptyState from '@/components/admin/dev-expenses/EmptyState';
import { listExpenses, listCreditors, listEntities } from '@/lib/dev-expenses/api';
import { PAGE_SIZE_OPTIONS } from '@/lib/dev-expenses/labels';
import type { DevExpenseV4, Creditor, ExpenseEntity } from '@/lib/dev-expenses/types';

export default function InvoicesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [expenses, setExpenses] = useState<DevExpenseV4[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [suppliers, setSuppliers] = useState<Creditor[]>([]);
  const [entities, setEntities] = useState<ExpenseEntity[]>([]);

  // Filters from URL
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? String(PAGE_SIZE_OPTIONS[0]));
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const supplierId = searchParams.get('supplier_id') ?? '';
  const incurredByEntityId = searchParams.get('incurred_by_entity_id') ?? '';
  const coveredByEntityId = searchParams.get('covered_by_entity_id') ?? '';
  const currency = searchParams.get('currency') ?? '';
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';
  const archived = searchParams.get('archived') === 'true';
  const migrationReviewRequired = searchParams.get('migration_review_required') === 'true';
  const sort = searchParams.get('sort') ?? 'created_at';
  const order = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc';

  const locale = 'fr';

  // Update URL helper
  const updateUrl = useCallback((updates: Record<string, string | number | boolean | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === '' || v === undefined || v === false) {
        params.delete(k);
      } else if (v === true) {
        params.set(k, 'true');
      } else {
        params.set(k, String(v));
      }
    }
    // Reset to page 1 when filters change (unless updating page itself)
    if (!('page' in updates)) params.delete('page');
    router.push(pathname + '?' + params.toString());
  }, [searchParams, pathname, router]);

  // Load data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [res, creditorRes, entityRes] = await Promise.all([
          listExpenses({
            page, limit, search, status, supplier_id: supplierId,
            incurred_by_entity_id: incurredByEntityId,
            covered_by_entity_id: coveredByEntityId,
            currency, date_from: dateFrom, date_to: dateTo,
            archived, migration_review_required: migrationReviewRequired,
            sort, order,
          }),
          listCreditors(),
          listEntities({ active: true }),
        ]);
        if (!cancelled) {
          setExpenses(res.items ?? []);
          setTotal(res.pagination?.total ?? 0);
          setPages(res.pagination?.pages ?? 0);
          setSuppliers(creditorRes.data ?? []);
          setEntities(entityRes.items ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, limit, search, status, supplierId, incurredByEntityId, coveredByEntityId, currency, dateFrom, dateTo, archived, migrationReviewRequired, sort, order]);

  function flashMsg(type: 'ok' | 'err', text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  function resetFilters() {
    router.push(pathname);
  }

  const supplierOptions = suppliers.map((c) => ({ id: c.id, name: c.name }));
  const entityOptions = entities.map((e) => ({ id: e.id, display_name: e.display_name }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Factures</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.refresh()}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualiser
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            <Plus className="w-4 h-4" /> Nouvelle facture
          </button>
        </div>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
          msg.type === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          {msg.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <ExpenseFilters
        search={search}
        status={status}
        supplierId={supplierId}
        incurredByEntityId={incurredByEntityId}
        coveredByEntityId={coveredByEntityId}
        currency={currency}
        dateFrom={dateFrom}
        dateTo={dateTo}
        archived={archived}
        migrationReviewRequired={migrationReviewRequired}
        sort={sort}
        order={order}
        limit={limit}
        suppliers={supplierOptions}
        entities={entityOptions}
        onSearchChange={(v) => updateUrl({ search: v })}
        onStatusChange={(v) => updateUrl({ status: v })}
        onSupplierChange={(v) => updateUrl({ supplier_id: v })}
        onIncurredByChange={(v) => updateUrl({ incurred_by_entity_id: v })}
        onCoveredByChange={(v) => updateUrl({ covered_by_entity_id: v })}
        onCurrencyChange={(v) => updateUrl({ currency: v })}
        onDateFromChange={(v) => updateUrl({ date_from: v })}
        onDateToChange={(v) => updateUrl({ date_to: v })}
        onArchivedChange={(v) => updateUrl({ archived: v })}
        onMigrationReviewChange={(v) => updateUrl({ migration_review_required: v })}
        onSortChange={(v) => updateUrl({ sort: v })}
        onOrderChange={(v) => updateUrl({ order: v })}
        onLimitChange={(v) => updateUrl({ limit: v })}
        onReset={resetFilters}
      />

      {/* Content */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <EmptyState icon={AlertCircle} title="Erreur de chargement" message={error} />
      ) : expenses.length === 0 ? (
        <EmptyState icon={Receipt} title="Aucune facture" message="Aucune facture ne correspond aux filtres sélectionnés." />
      ) : (
        <>
          <ExpenseTable expenses={expenses} suppliers={supplierOptions} locale={locale} />
          <ExpenseMobileCard expenses={expenses} suppliers={supplierOptions} locale={locale} />

          {/* Pagination */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              {total} facture(s) · Page {page} sur {pages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateUrl({ page: Math.max(1, page - 1) })}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30"
                aria-label="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 px-2">{page} / {pages}</span>
              <button
                onClick={() => updateUrl({ page: Math.min(pages, page + 1) })}
                disabled={page >= pages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30"
                aria-label="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create form modal */}
      {showForm && (
        <ExpenseForm
          onClose={() => setShowForm(false)}
          onCreated={(message) => {
            flashMsg('ok', message);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
