'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Headset, RefreshCw, Loader2, AlertCircle, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from '@/i18n/navigation';

interface AdminConversation {
  id: string;
  merchant_id: string;
  status: 'open' | 'escalated' | 'resolved';
  created_at: string;
  updated_at: string;
  merchants: { name: string; email: string }[] | { name: string; email: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouverte',
  escalated: 'Escaladée',
  resolved: 'Résolue',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  escalated: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-gray-100 text-gray-600 dark:bg-navy-panel dark:text-text-secondary',
};

function getMerchantName(c: AdminConversation): string {
  if (!c.merchants) return '—';
  if (Array.isArray(c.merchants)) return c.merchants[0]?.name ?? c.merchants[0]?.email ?? '—';
  return c.merchants.name ?? c.merchants.email ?? '—';
}

function getMerchantEmail(c: AdminConversation): string {
  if (!c.merchants) return '—';
  if (Array.isArray(c.merchants)) return c.merchants[0]?.email ?? '—';
  return c.merchants.email ?? '—';
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [counts, setCounts] = useState({ open: 0, escalated: 0, resolved: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = filter ? `?status=${filter}` : '';
      const res = await fetch(`/api/admin/support/conversations${qs}`);
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data.data ?? []);

      // Count by status (from unfiltered if filtered)
      if (!filter) {
        const all = data.data ?? [];
        setCounts({
          open: all.filter((c: AdminConversation) => c.status === 'open').length,
          escalated: all.filter((c: AdminConversation) => c.status === 'escalated').length,
          resolved: all.filter((c: AdminConversation) => c.status === 'resolved').length,
        });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  // Load counts separately when filtered
  useEffect(() => {
    if (filter) {
      fetch('/api/admin/support/conversations')
        .then((r) => r.json())
        .then((data) => {
          const all = data.data ?? [];
          setCounts({
            open: all.filter((c: AdminConversation) => c.status === 'open').length,
            escalated: all.filter((c: AdminConversation) => c.status === 'escalated').length,
            resolved: all.filter((c: AdminConversation) => c.status === 'resolved').length,
          });
        })
        .catch(() => {});
    }
  }, [filter]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
          <Headset className="text-green-deep" size={22} />
          Support Marchands
        </h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{counts.open}</p>
          <p className="text-xs text-gray-500 dark:text-text-secondary mt-1">Ouvertes</p>
        </div>
        <div className={clsx(
          'bg-white dark:bg-navy-panel/60 border rounded-xl p-4',
          counts.escalated > 0 ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-text-secondary/15',
        )}>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.escalated}</p>
          <p className="text-xs text-gray-500 dark:text-text-secondary mt-1">Escaladées ⚠</p>
        </div>
        <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-600 dark:text-text-secondary">{counts.resolved}</p>
          <p className="text-xs text-gray-500 dark:text-text-secondary mt-1">Résolues</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { value: '', label: 'Toutes' },
          { value: 'escalated', label: 'Escaladées' },
          { value: 'open', label: 'Ouvertes' },
          { value: 'resolved', label: 'Résolues' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              filter === f.value
                ? 'bg-green-deep text-white'
                : 'border border-gray-200 dark:border-text-secondary/20 text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Conversations table */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-green-deep" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">Aucune conversation.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                  {['Marchand', 'Email', 'Statut', 'Dernière MAJ', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                {conversations.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/dashboard/admin/merchants/support/${c.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-navy-panel/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-text-primary whitespace-nowrap">
                      {c.status === 'escalated' && <AlertCircle size={14} className="inline mr-1.5 text-amber-500" />}
                      {getMerchantName(c)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-text-secondary whitespace-nowrap">{getMerchantEmail(c)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_STYLES[c.status])}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-text-secondary whitespace-nowrap text-xs">
                      {new Date(c.updated_at).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ChevronRight size={16} className="text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
