import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { getTransactions, type Transaction } from '@/lib/api';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import clsx from 'clsx';
import TransactionFilters from './TransactionFilters';
import ExportCsvButton from './ExportCsvButton';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-CD', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface PageProps {
  searchParams: {
    page?: string;
    operator?: string;
    direction?: string;
    status?: string;
  };
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const t = await getTranslations();
  const token = cookies().get('auth_token')?.value ?? '';

  const page = Math.max(1, Number(searchParams.page) || 1);
  const params = {
    page,
    limit: 20,
    operator: searchParams.operator || undefined,
    direction: searchParams.direction || undefined,
    status: searchParams.status || undefined,
  };

  let data = { data: [] as Transaction[], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
  try {
    data = await getTransactions(token, params);
  } catch {
    /* will show empty state */
  }

  const { data: transactions, pagination } = data;

  const buildHref = (p: number, extra?: Record<string, string>) => {
    const sp = new URLSearchParams({ ...searchParams, page: String(p), ...extra });
    return `?${sp.toString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          {t('dashboard.transactions.title')}
        </h1>
        <ExportCsvButton transactions={transactions} />
      </div>

      {/* Filters */}
      <TransactionFilters searchParams={searchParams} />

      {/* Table */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {transactions.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400 dark:text-gray-600">
            {t('dashboard.transactions.no_results')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {(['date', 'operator', 'direction', 'amount', 'fee', 'net', 'status'] as const).map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {t(`dashboard.transactions.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{fmtDate(tx.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">{tx.operator}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx('inline-flex items-center gap-1 text-xs font-medium', tx.direction === 'collect' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400')}>
                        {tx.direction === 'collect' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                        {t(`dashboard.transactions.${tx.direction}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{fmt(tx.amount)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmt(tx.fee)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{fmt(tx.net_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_STYLES[tx.status])}>
                        {t(`dashboard.status.${tx.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('dashboard.transactions.page_info', { page: pagination.page, pages: pagination.pages, total: pagination.total })}</span>
          <div className="flex items-center gap-2">
            {pagination.page > 1 ? (
              <Link
                href={buildHref(pagination.page - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={14} />
                {t('dashboard.transactions.prev')}
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed">
                <ChevronLeft size={14} />
                {t('dashboard.transactions.prev')}
              </span>
            )}
            {pagination.page < pagination.pages ? (
              <Link
                href={buildHref(pagination.page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('dashboard.transactions.next')}
                <ChevronRight size={14} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed">
                {t('dashboard.transactions.next')}
                <ChevronRight size={14} />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
