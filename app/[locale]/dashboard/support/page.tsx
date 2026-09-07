'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageCircle, Send, Loader2, AlertCircle, RefreshCw,
  Headset, ArrowLeft, CheckCircle2,
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
  status: 'open' | 'escalated' | 'resolved';
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouverte',
  escalated: 'Escaladée — un humain va répondre',
  resolved: 'Résolue',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  escalated: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-gray-100 text-gray-600 dark:bg-navy-panel dark:text-text-secondary',
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' });
}

export default function MerchantSupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/merchant/support/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data.data ?? []);
      // Auto-select most recent if none selected
      if (data.data?.length > 0 && !activeConv) {
        setActiveConv(data.data[0]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [activeConv]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/merchant/support/conversations/${convId}/messages`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages ?? []);
      setActiveConv(data.conversation ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (activeConv) void loadMessages(activeConv.id);
  }, [activeConv?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    setError('');
    const msg = input.trim();
    setInput('');

    // Optimistic: add merchant message
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId,
      role: 'merchant',
      content: msg,
      created_at: new Date().toISOString(),
    }]);

    try {
      const res = await fetch('/api/merchant/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConv?.id,
          message: msg,
        }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();

      // Add bot reply
      setMessages((prev) => [...prev.filter((m) => m.id !== tempId), {
        id: `temp-bot-${Date.now()}`,
        role: 'merchant',
        content: msg,
        created_at: new Date().toISOString(),
      }, {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: data.reply,
        created_at: new Date().toISOString(),
      }]);

      // Update conversation status
      if (data.status === 'escalated') {
        setActiveConv((prev) => prev ? { ...prev, status: 'escalated' } : prev);
      }

      // Reload conversations list
      void loadConversations();
    } catch (e) {
      setError((e as Error).message);
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
          <Headset className="text-green-deep" size={22} />
          Support
        </h1>
        <button
          onClick={loadConversations}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations list */}
        <div className="md:col-span-1 bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-text-secondary/15">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-green-deep" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400 px-4">
                Aucune conversation. Envoyez un message pour commencer.
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={clsx(
                      'w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-navy-panel/30 transition-colors',
                      activeConv?.id === c.id && 'bg-green-deep/5 dark:bg-green-deep/10',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-gray-400">{new Date(c.updated_at).toLocaleDateString('fr-CD')}</span>
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', STATUS_STYLES[c.status])}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-text-secondary truncate">{c.id.slice(0, 8)}…</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="md:col-span-2 bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl overflow-hidden flex flex-col">
          {activeConv && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-text-secondary/15 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">{activeConv.id.slice(0, 8)}…</span>
              <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', STATUS_STYLES[activeConv.status])}>
                {STATUS_LABELS[activeConv.status]}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !loading ? (
              <div className="text-center py-12 text-sm text-gray-400">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                Posez votre question, nous sommes là pour vous aider.
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={clsx(
                    'flex',
                    m.role === 'merchant' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={clsx(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                      m.role === 'merchant'
                        ? 'bg-green-deep text-white rounded-br-sm'
                        : m.role === 'admin'
                        ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300 rounded-bl-sm'
                        : 'bg-gray-100 text-gray-900 dark:bg-navy-panel dark:text-text-primary rounded-bl-sm',
                    )}
                  >
                    {m.role === 'admin' && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 mb-1">
                        <CheckCircle2 size={10} /> Équipe UniPay
                      </div>
                    )}
                    {m.role === 'bot' && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-text-secondary mb-1">
                        <Headset size={10} /> Assistant
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <div className={clsx('text-[10px] mt-1', m.role === 'merchant' ? 'text-white/60' : 'text-gray-400')}>
                      {fmtTime(m.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-navy-panel rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}
            {activeConv?.status === 'escalated' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                <AlertCircle size={16} />
                Un membre de notre équipe va prendre le relais et vous répondre sous peu.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 dark:border-text-secondary/15 p-3">
            {activeConv?.status === 'resolved' ? (
              <div className="text-center text-sm text-gray-400 py-2">
                Cette conversation est résolue. Démarrez une nouvelle conversation pour une nouvelle question.
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrivez votre message…"
                  rows={1}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-deep/30 resize-none"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="flex-shrink-0 p-2.5 rounded-xl bg-green-deep text-white hover:bg-green-deep/85 transition-colors disabled:opacity-50"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
