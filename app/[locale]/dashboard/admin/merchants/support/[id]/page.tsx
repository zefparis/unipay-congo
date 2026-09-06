'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import {
  ArrowLeft, Send, Loader2, AlertCircle, CheckCircle2, Headset,
} from 'lucide-react';
import clsx from 'clsx';

interface Message {
  id: string;
  role: 'merchant' | 'bot' | 'admin';
  content: string;
  created_at: string;
}

interface Conversation {
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
  resolved: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' });
}

function getMerchantName(c: Conversation | null): string {
  if (!c?.merchants) return '—';
  if (Array.isArray(c.merchants)) return c.merchants[0]?.name ?? c.merchants[0]?.email ?? '—';
  return c.merchants.name ?? c.merchants.email ?? '—';
}

function getMerchantEmail(c: Conversation | null): string {
  if (!c?.merchants) return '—';
  if (Array.isArray(c.merchants)) return c.merchants[0]?.email ?? '—';
  return c.merchants.email ?? '—';
}

export default function AdminSupportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolve, setResolve] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/support/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error('Failed to load conversation');
      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    setError('');
    const msg = input.trim();
    setInput('');

    try {
      const res = await fetch(`/api/admin/support/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, resolve }),
      });
      if (!res.ok) throw new Error('Failed to send reply');
      const data = await res.json();

      // Add admin message optimistically
      setMessages((prev) => [...prev, {
        id: `admin-${Date.now()}`,
        role: 'admin',
        content: msg,
        created_at: new Date().toISOString(),
      }]);

      if (data.status === 'resolved') {
        setConversation((prev) => prev ? { ...prev, status: 'resolved' } : prev);
      }
      setResolve(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-signal" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-400">Conversation introuvable.</p>
        <button
          onClick={() => router.push('/dashboard/admin/merchants/support')}
          className="mt-4 text-sm text-signal hover:underline"
        >
          ← Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/admin/merchants/support')}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-heading font-bold text-gray-900 dark:text-white">
              {getMerchantName(conversation)}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getMerchantEmail(conversation)}</p>
          </div>
        </div>
        <span className={clsx('inline-flex px-3 py-1 rounded-full text-xs font-semibold', STATUS_STYLES[conversation.status])}>
          {STATUS_LABELS[conversation.status]}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">Aucun message dans cette conversation.</div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={clsx('flex', m.role === 'admin' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={clsx(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    m.role === 'admin'
                      ? 'bg-purple-500 text-white rounded-br-sm'
                      : m.role === 'merchant'
                      ? 'bg-signal text-white rounded-bl-sm'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-bl-sm',
                  )}
                >
                  {m.role === 'merchant' && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-white/70 mb-1">
                      Marchand
                    </div>
                  )}
                  {m.role === 'bot' && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      <Headset size={10} /> Assistant IA
                    </div>
                  )}
                  {m.role === 'admin' && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-white/70 mb-1">
                      <CheckCircle2 size={10} /> Vous
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <div className={clsx('text-[10px] mt-1', m.role === 'admin' || m.role === 'merchant' ? 'text-white/60' : 'text-gray-400')}>
                    {fmtTime(m.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply input */}
        {conversation.status !== 'resolved' && (
          <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-2">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Répondez au marchand…"
                rows={2}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-signal/30 resize-none"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex-shrink-0 p-2.5 rounded-xl bg-signal text-white hover:bg-signal/85 transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <input
                type="checkbox"
                checked={resolve}
                onChange={(e) => setResolve(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Marquer comme résolu après envoi
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
