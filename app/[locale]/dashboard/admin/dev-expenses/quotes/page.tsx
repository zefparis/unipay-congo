'use client';

import { useState } from 'react';
import { FileSearch, Check, AlertCircle } from 'lucide-react';
import QuoteList from '@/components/admin/dev-expenses/QuoteList';

export default function QuotesPage() {
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const locale = 'fr';

  function flashMsg(type: 'ok' | 'err', text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileSearch className="w-6 h-6 text-purple-600" />
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Devis</h1>
      </div>

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

      <QuoteList locale={locale} onMsg={flashMsg} />
    </div>
  );
}
