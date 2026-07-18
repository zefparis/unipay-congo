'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Check, AlertCircle, RefreshCw } from 'lucide-react';
import { getExpenseDetail, listCreditors, refreshSnapshot } from '@/lib/dev-expenses/api';
import ExpenseDetailHeader from '@/components/admin/dev-expenses/ExpenseDetailHeader';
import ExpenseSummary from '@/components/admin/dev-expenses/ExpenseSummary';
import ExpenseAmounts from '@/components/admin/dev-expenses/ExpenseAmounts';
import ExpenseResponsibilities from '@/components/admin/dev-expenses/ExpenseResponsibilities';
import ExpenseActions from '@/components/admin/dev-expenses/ExpenseActions';
import SettlementList from '@/components/admin/dev-expenses/SettlementList';
import ExpenseTimeline from '@/components/admin/dev-expenses/ExpenseTimeline';
import MigrationReviewBanner from '@/components/admin/dev-expenses/MigrationReviewBanner';
import MigrationReviewForm from '@/components/admin/dev-expenses/MigrationReviewForm';
import Spinner from '@/components/admin/dev-expenses/Spinner';
import EmptyState from '@/components/admin/dev-expenses/EmptyState';
import type { ExpenseDetail, Creditor } from '@/lib/dev-expenses/types';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [detail, setDetail] = useState<ExpenseDetail | null>(null);
  const [suppliers, setSuppliers] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showMigrationForm, setShowMigrationForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const locale = 'fr';

  const loadDetail = useCallback(async () => {
    try {
      const [d, cRes] = await Promise.all([
        getExpenseDetail(id),
        listCreditors(),
      ]);
      setDetail(d);
      setSuppliers(cRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  function flashMsg(type: 'ok' | 'err', text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  if (loading) return <Spinner />;
  if (error || !detail) {
    return <EmptyState icon={AlertCircle} title="Facture introuvable" message={error ?? undefined} />;
  }

  const supplierOptions = suppliers.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-4">
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

      {/* Migration review banner */}
      {detail.expense.migration_review_required && !showMigrationForm && (
        <MigrationReviewBanner onResolve={() => setShowMigrationForm(true)} />
      )}

      {/* Migration review form */}
      {showMigrationForm && (
        <MigrationReviewForm
          expense={detail.expense}
          entities={detail.entities}
          onClose={() => setShowMigrationForm(false)}
          onResolved={(message) => {
            flashMsg('ok', message);
            setShowMigrationForm(false);
            setLoading(true);
            loadDetail();
          }}
        />
      )}

      {/* Header */}
      <ExpenseDetailHeader expense={detail.expense} locale={locale} />

      {/* Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <ExpenseActions
          detail={detail}
          onUpdated={(message) => {
            flashMsg('ok', message);
            setLoading(true);
            loadDetail();
          }}
          onActionNeeded={() => {
            // Scroll to settlements section
            document.getElementById('settlements')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      {/* Grid: Summary + Amounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpenseSummary
          expense={detail.expense}
          entities={detail.entities}
          suppliers={supplierOptions}
          locale={locale}
        />
        <ExpenseAmounts expense={detail.expense} locale={locale} />
      </div>

      {/* Responsibilities */}
      <ExpenseResponsibilities expense={detail.expense} entities={detail.entities} />

      {/* Refresh snapshot button */}
      {detail.expense.billing_recipient_entity_id && (
        <div className="flex justify-end">
          <button
            onClick={async () => {
              setRefreshing(true);
              try {
                await refreshSnapshot(detail.expense.id);
                flashMsg('ok', 'Snapshot du destinataire mis à jour');
                setLoading(true);
                loadDetail();
              } catch (err) {
                flashMsg('err', err instanceof Error ? err.message : 'Erreur');
              }
              setRefreshing(false);
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser le snapshot destinataire
          </button>
        </div>
      )}

      {/* Settlements */}
      <div id="settlements">
        <SettlementList
          expense={detail.expense}
          settlements={detail.settlements}
          entities={detail.entities}
          locale={locale}
          onUpdated={(message) => {
            flashMsg('ok', message);
            setLoading(true);
            loadDetail();
          }}
        />
      </div>

      {/* Timeline */}
      <ExpenseTimeline events={detail.audit_events} locale={locale} />
    </div>
  );
}
