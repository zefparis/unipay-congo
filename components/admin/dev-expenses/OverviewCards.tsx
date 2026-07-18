'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { AlertCircle, ArrowRight, Activity } from 'lucide-react';
import { getStats, type DevExpensesStats } from '@/lib/dev-expenses/api';
import { formatMultiCurrency } from '@/lib/dev-expenses/formatters';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

const LOCALE = 'fr';

interface ActionItem {
  label: string;
  count: number;
  href: string;
  params: Record<string, string>;
}

export default function OverviewCards() {
  const router = useRouter();
  const [stats, setStats] = useState<DevExpensesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getStats();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Spinner />;
  if (error || !stats) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Impossible de charger les statistiques"
        message={error ?? undefined}
      />
    );
  }

  const cards = [
    { label: 'Total engagé', amounts: stats.total_engaged, color: 'text-gray-900 dark:text-white' },
    { label: 'En attente de validation', amounts: stats.awaiting_validation, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Validé à payer', amounts: stats.approved_to_pay, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Paiement programmé', amounts: stats.payment_scheduled, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Réglé ce mois', amounts: stats.settled_this_month, color: 'text-green-600 dark:text-green-400' },
    { label: 'Reste dû', amounts: stats.remaining_due, color: 'text-red-600 dark:text-red-400' },
  ];

  const hasAmounts = (amounts: Record<string, number> | undefined): boolean =>
    !!amounts && Object.values(amounts).some((v: number) => v > 0);

  const actions: ActionItem[] = [
    ...(hasAmounts(stats.awaiting_validation)
      ? [{ label: 'factures à valider', count: 1, href: '/dashboard/admin/dev-expenses/invoices', params: { status: 'submitted' } }]
      : []),
    ...(hasAmounts(stats.remaining_due)
      ? [{ label: 'paiements à confirmer', count: 1, href: '/dashboard/admin/dev-expenses/invoices', params: { status: 'payment_scheduled' } }]
      : []),
    ...(stats.migration_review_count > 0
      ? [{ label: 'anciennes factures à vérifier', count: stats.migration_review_count, href: '/dashboard/admin/dev-expenses/invoices', params: { migration_review_required: 'true' } }]
      : []),
    ...(stats.overdue_count > 0
      ? [{ label: 'facture(s) en retard', count: stats.overdue_count, href: '/dashboard/admin/dev-expenses/invoices', params: { status: 'payment_scheduled' } }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const amounts = formatMultiCurrency(card.amounts, LOCALE);
          return (
            <div
              key={card.label}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{card.label}</p>
              {amounts.length === 0 ? (
                <p className={`text-lg font-semibold ${card.color}`}>—</p>
              ) : (
                <div className="space-y-0.5">
                  {amounts.map((a) => (
                    <p key={a.currency} className={`text-lg font-semibold ${card.color}`}>
                      {a.amount}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overdue + Migration review inline */}
      <div className="flex flex-wrap gap-3">
        {stats.overdue_count > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            {stats.overdue_count} facture(s) en retard
          </div>
        )}
        {stats.migration_review_count > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            {stats.migration_review_count} donnée(s) à vérifier
          </div>
        )}
      </div>

      {/* Actions required */}
      {actions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Actions requises</h3>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.href + '?' + new URLSearchParams(action.params).toString())}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{action.count}</span> {action.label}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity note */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          Activité récente
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Consultez les factures récentes pour voir l&apos;historique des actions.
        </p>
      </div>
    </div>
  );
}
