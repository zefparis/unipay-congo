import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { getBalance, getTransactions, type Transaction } from '@/lib/api';
import { Link } from '@/i18n/navigation';
import { RefreshCw, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function fmt(n: number | undefined | null) {
  const num = Number(n ?? NaN);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function DashboardPage() {
  const t = await getTranslations();
  const token = cookies().get('auth_token')?.value;

  let balance = null;
  let transactions: Transaction[] = [];

  if (token) {
    const [balanceRes, txnsRes] = await Promise.allSettled([
      getBalance(token),
      getTransactions(token, { page: 1, limit: 10 }),
    ]);
    if (balanceRes.status === 'fulfilled') balance = balanceRes.value;
    if (txnsRes.status === 'fulfilled') transactions = txnsRes.value.data;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          {t('dashboard.overview.title')}
        </h1>
        <form action="">
          <button
            formAction={undefined}
            type="submit"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <RefreshCw size={14} />
            {t('dashboard.overview.refresh')}
          </button>
        </form>
      </div>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-signal to-[#0f6b4f] p-6 text-white shadow-lg shadow-signal/20">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -right-2 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-white/70" />
            <span className="text-sm font-medium text-white/70">{t('dashboard.overview.balance_title')}</span>
          </div>
          <div className="text-4xl font-heading font-bold tracking-tight">
            {balance !== null ? fmt(balance.balance) : '—'}
          </div>
          <div className="text-sm text-white/60 mt-1">{balance?.currency ?? 'CDF'}</div>
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-gray-900 dark:text-white">
            {t('dashboard.overview.recent_title')}
          </h2>
          <Link
            href="/dashboard/transactions"
            className="text-sm text-signal-dark hover:text-signal font-medium"
          >
            {t('dashboard.overview.view_all')} →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-600">
              {t('dashboard.overview.no_transactions')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['date', 'operator', 'direction', 'amount', 'fee', 'net', 'status'].map((col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {t(`dashboard.transactions.${col}` as Parameters<typeof t>[0])}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">{tx.operator}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={clsx('inline-flex items-center gap-1', tx.direction === 'collect' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400')}>
                          {tx.direction === 'collect' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          {t(`dashboard.transactions.${tx.direction}` as Parameters<typeof t>[0])}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{fmt(tx.amount)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmt(tx.fee)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{fmt(tx.net_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_STYLES[tx.status])}>
                          {t(`dashboard.status.${tx.status}` as Parameters<typeof t>[0])}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
