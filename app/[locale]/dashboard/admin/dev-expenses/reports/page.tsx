'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, RefreshCw, Loader2, FileText, Copy, Check, AlertCircle } from 'lucide-react';
import { listHistory, generateReport } from '@/lib/dev-expenses/api';
import { formatDate, formatMonth, formatMoney } from '@/lib/dev-expenses/formatters';
import type { MonthHistory } from '@/lib/dev-expenses/types';

export default function ReportsPage() {
  const [history, setHistory] = useState<MonthHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [genMonth, setGenMonth] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [lastReport, setLastReport] = useState<{
    share_url: string; total_usd: number; pending_warnings?: unknown[];
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const locale = 'fr';

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listHistory(24);
      setHistory(res.data ?? []);
    } catch {
      setMsg({ type: 'err', text: 'Erreur chargement historique' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function flashMsg(type: 'ok' | 'err', text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function generate() {
    if (!genMonth) return;
    setGenLoading(true);
    try {
      const result = await generateReport(genMonth + '-01');
      setLastReport({ share_url: result.share_url, total_usd: result.total_usd, pending_warnings: result.pending_warnings });
      flashMsg('ok', 'Rapport généré');
      loadHistory();
    } catch (err) {
      flashMsg('err', err instanceof Error ? err.message : 'Erreur génération');
    }
    setGenLoading(false);
  }

  async function copyShare(url: string, key: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Ignore
    }
  }

  const inputCls = 'px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Rapports</h1>
        </div>
        <button onClick={loadHistory} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
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

      {/* Generate */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Générer un rapport</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mois</label>
            <input type="month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)} className={inputCls} />
          </div>
          <button
            onClick={generate}
            disabled={!genMonth || genLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Générer PDF + lien
          </button>
        </div>
        {lastReport && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 space-y-2">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Rapport généré — Total : <span className="font-mono">{formatMoney(lastReport.total_usd, 'USD', locale)}</span>
            </p>
            {lastReport.pending_warnings && lastReport.pending_warnings.length > 0 && (
              <p className="text-xs text-amber-600">
                ⚠ {lastReport.pending_warnings.length} facture(s) encore en statut &quot;pending&quot; incluse(s)
              </p>
            )}
            <button
              onClick={() => copyShare(lastReport.share_url, lastReport.share_url)}
              className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              {copied === lastReport.share_url ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === lastReport.share_url ? 'Copié !' : lastReport.share_url}
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400 italic">
          Le rapport PDF utilise encore le format historique.
        </p>
      </div>

      {/* History */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm">Historique</h3>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {history.map((m) => (
              <div key={m.billing_month} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{formatMonth(m.billing_month, locale)}</p>
                  <p className="text-xs text-gray-500">
                    {m.invoice_count} facture(s) · {m.creditor_count} fournisseur(s)
                    {m.generated_at && ` · rapport ${formatDate(m.generated_at, locale)}`}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold">{formatMoney(m.total_usd, 'USD', locale)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  m.global_status === 'ready'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                }`}>
                  {m.global_status === 'ready' ? 'Complet' : 'En cours'}
                </span>
                {m.share_url && m.share_token && (
                  <button
                    onClick={() => copyShare(m.share_url!, m.share_token!)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700"
                    title="Copier le lien public"
                  >
                    {copied === m.share_token ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            ))}
            {history.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Aucun historique disponible</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
