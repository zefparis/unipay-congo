'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Key, Copy, Check, AlertTriangle, RefreshCw, Loader2, Eye, EyeOff } from 'lucide-react';

export default function ApiKeysPage() {
  const t = useTranslations('dashboard.api_keys');

  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyPrefix, setKeyPrefix] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    const res = await fetch('/api/merchant/apikey', { method: 'POST' });

    if (res.ok) {
      const data = (await res.json()) as { api_key: string; key_prefix: string };
      setNewKey(data.api_key);
      setKeyPrefix(data.key_prefix);
      setConfirmed(false);
    } else {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? 'Error');
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[#1D9E75]/10 dark:bg-[#1D9E75]/15">
            <Key className="text-[#1D9E75]" size={20} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-13">{t('subtitle')}</p>
      </div>

      {/* Current key indicator */}
      {!newKey && keyPrefix && (
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('label')}</p>
          <div className="font-mono text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
            {t('prefix_hint', { prefix: keyPrefix })}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">{t('masked')}</p>
        </div>
      )}

      {/* New key display */}
      {newKey && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">{t('new_key_title')}</p>
            <p className="text-xs text-green-700 dark:text-green-400">{t('new_key_note')}</p>
          </div>
          <div className="relative">
            <div className="font-mono text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800/50 rounded-xl px-4 py-3 pr-24 break-all select-all">
              {showKey ? newKey : `${newKey.slice(0, 12)}${'•'.repeat(newKey.length - 12)}`}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1D9E75] hover:bg-[#178a65] text-white text-xs font-semibold transition-all"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? t('copied') : t('copy')}
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#1D9E75] accent-[#1D9E75]"
            />
            <span className="text-xs text-green-700 dark:text-green-400">
              J&apos;ai copié ma clé API et je comprends qu&apos;elle ne sera plus affichée.
            </span>
          </label>
        </div>
      )}

      {/* Warning */}
      <div className="flex gap-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4">
        <AlertTriangle className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-0.5">{t('warning_title')}</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">{t('warning')}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || (!!newKey && !confirmed)}
        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1D9E75] hover:bg-[#178a65] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-sm shadow-[#1D9E75]/25"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        {loading ? t('loading') : t('generate')}
      </button>
    </div>
  );
}
