'use client';

import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import type { Transaction } from '@/lib/api';

interface Props {
  transactions: Transaction[];
}

function toCsv(rows: Transaction[]): string {
  const headers = ['id', 'date', 'operator', 'direction', 'amount', 'fee', 'net_amount', 'currency', 'phone', 'reference', 'status'];
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [r.id, r.created_at, r.operator, r.direction, r.amount, r.fee, r.net_amount, r.currency, r.phone, r.reference ?? '', r.status]
        .map(escape)
        .join(','),
    ),
  ];
  return lines.join('\n');
}

export default function ExportCsvButton({ transactions }: Props) {
  const t = useTranslations('dashboard.transactions');

  const handleExport = () => {
    const csv = toCsv(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={transactions.length === 0}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      <Download size={14} />
      {t('export_csv')}
    </button>
  );
}
