'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface Props {
  searchParams: Record<string, string | undefined>;
}

const OPERATORS = ['orange', 'airtel', 'afrimoney', 'usdt'];
const DIRECTIONS = ['collect', 'payout'];
const STATUSES = ['pending', 'processing', 'success', 'failed', 'cancelled'];

export default function TransactionFilters({ searchParams }: Props) {
  const t = useTranslations('dashboard.transactions');
  const router = useRouter();
  const pathname = usePathname();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(
        Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v !== undefined)) as Record<string, string>,
      );
      if (value) {
        sp.set(key, value);
      } else {
        sp.delete(key);
      }
      sp.delete('page');
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const selectClass =
    'px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent transition-all';

  return (
    <div className="flex flex-wrap gap-3">
      {/* Operator */}
      <select
        value={searchParams.operator ?? ''}
        onChange={(e) => updateFilter('operator', e.target.value)}
        className={selectClass}
        aria-label={t('filter_operator')}
      >
        <option value="">{t('filter_operator')} — {t('all')}</option>
        {OPERATORS.map((op) => (
          <option key={op} value={op} className="capitalize">{op}</option>
        ))}
      </select>

      {/* Direction */}
      <select
        value={searchParams.direction ?? ''}
        onChange={(e) => updateFilter('direction', e.target.value)}
        className={selectClass}
        aria-label={t('filter_direction')}
      >
        <option value="">{t('filter_direction')} — {t('all')}</option>
        {DIRECTIONS.map((dir) => (
          <option key={dir} value={dir}>{t(dir as 'collect' | 'payout')}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={searchParams.status ?? ''}
        onChange={(e) => updateFilter('status', e.target.value)}
        className={selectClass}
        aria-label={t('filter_status')}
      >
        <option value="">{t('filter_status')} — {t('all')}</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
