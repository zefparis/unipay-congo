'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import clsx from 'clsx';

type ConvStatus = 'open' | 'escalated' | 'resolved';
type Role = 'wallet' | 'bot' | 'admin';

interface Message {
  id: string;
  role: Role;
  content: string;
  channel?: string;
  subject?: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  status: ConvStatus;
  type: 'merchant' | 'wallet';
  owner_name: string;
  owner_email: string | null;
  owner_phone: string | null;
}

const STATUS_LABELS: Record<ConvStatus, string> = {
  open: 'Ouverte',
  escalated: 'Escaladée',
  resolved: 'Résolue',
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('fr-CD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function WalletSupportDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolve, setResolve] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/conversations/${id}/messages`);
      if (!res.ok) throw new Error('Failed to load conversation');
      const data = await res.json();
      const c = data.conversation as Record<string, unknown>;
      setConv({
        id: c.id as string,
        status: c.status as ConvStatus,
        type: (c.type as 'merchant' | 'wallet') ?? 'wallet',
        owner_name: (c.owner_name as string) ?? '—',
        owner_email: c.owner_email as string | null,
        owner_phone: c.owner_phone as string | null,
      });
      setMessages(data.messages ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleReply() {
    if (!input.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/support/conversations/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), resolve }),
      });
      if (!res.ok) throw new Error('Failed to send reply');
      setInput('');
      setResolve(false);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-green-deep" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/admin/wallet-support')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-panel text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-serif font-bold text-gray-900 dark:text-text-primary">
            {conv?.owner_name ?? '—'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-text-secondary">
            {conv?.owner_phone ?? '—'} · {conv?.owner_email ?? 'pas d\'email'}
          </p>
        </div>
        {conv && (
          <span className={clsx(
            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
            conv.status === 'open' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            conv.status === 'escalated' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            conv.status === 'resolved' && 'bg-gray-100 text-gray-500 dark:bg-navy-panel dark:text-text-secondary',
          )}>
            {STATUS_LABELS[conv.status]}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Chat */}
      <div className="h-[500px] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-text-secondary/15 dark:bg-navy-panel/60">
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={clsx('flex', m.role === 'admin' ? 'justify-end' : 'justify-start')}>
              <div className={clsx(
                'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                m.role === 'admin' && m.channel === 'email'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 rounded-br-sm'
                  : m.role === 'admin'
                  ? 'bg-purple-500 text-white rounded-br-sm'
                  : m.role === 'wallet'
                  ? 'bg-green-deep text-white rounded-bl-sm'
                  : 'bg-gray-100 dark:bg-navy-panel text-gray-800 dark:text-slate-200 rounded-bl-sm',
              )}>
                {m.channel === 'email' && m.subject && (
                  <p className="text-xs font-semibold mb-1 opacity-70">📧 {m.subject}</p>
                )}
                <p className="text-xs font-semibold mb-0.5 opacity-60">
                  {m.role === 'wallet' ? 'Utilisateur' : m.role === 'admin' ? 'Admin' : 'Bot'}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                <p className="text-xs mt-1 opacity-40">{fmtTime(m.created_at)}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply */}
      {conv?.status !== 'resolved' && (
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Votre réponse…"
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-deep focus:ring-2 focus:ring-green-deep/20 dark:border-text-secondary/20 dark:bg-navy-panel dark:text-text-primary"
          />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-text-secondary">
              <input type="checkbox" checked={resolve} onChange={(e) => setResolve(e.target.checked)} className="rounded border-gray-300" />
              Marquer comme résolu après envoi
            </label>
            <button
              onClick={handleReply}
              disabled={!input.trim() || sending}
              className="flex items-center gap-2 rounded-xl bg-green-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-deep/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
