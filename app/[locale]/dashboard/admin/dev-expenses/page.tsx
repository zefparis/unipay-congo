'use client';

import { useState } from 'react';
import { Receipt, Plus, RefreshCw, Check, AlertCircle } from 'lucide-react';
import OverviewCards from '@/components/admin/dev-expenses/OverviewCards';
import ExpenseForm from '@/components/admin/dev-expenses/ExpenseForm';

export default function DevExpensesOverviewPage() {
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function flashMsg(type: 'ok' | 'err', text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Factures &amp; Remboursements</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
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

      {/* Overview cards */}
      <div key={refreshKey}>
        <OverviewCards />
      </div>

      {/* Create form modal */}
      {showForm && (
        <ExpenseForm
          onClose={() => setShowForm(false)}
          onCreated={(message) => {
            flashMsg('ok', message);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
