'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Webhook, CheckCircle2, XCircle, Copy, Check,
  RefreshCw, Loader2, AlertTriangle, Trash2,
  Send, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';

/* ── types ──────────────────────────────────────────────────── */
interface WebhookConfig {
  configured: boolean;
  webhook_url: string | null;
  has_secret: boolean;
}

interface TestResult {
  ok: boolean;
  status_code: number;
  duration_ms: number;
}

/* ── copy button ────────────────────────────────────────────── */
function CopyButton({ value, label, copied: copiedLabel }: { value: string; label: string; copied: string }) {
  const [done, setDone] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1D9E75] hover:bg-[#178a65] text-white text-xs font-semibold transition-all"
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
      {done ? copiedLabel : label}
    </button>
  );
}

/* ── Node.js code snippet ───────────────────────────────────── */
const CODE_SNIPPET = `const crypto = require('crypto');

function verifySignature(rawBody, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your Express / Fastify handler:
app.post('/webhooks/unipay', (req, res) => {
  const sig = req.headers['x-unipay-signature'];
  const rawBody = JSON.stringify(req.body);
  if (!verifySignature(rawBody, sig, process.env.UNIPAY_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const { event, data } = req.body;
  // handle event…
  res.sendStatus(200);
});`;

/* ── page ───────────────────────────────────────────────────── */
export default function WebhooksPage() {
  const t = useTranslations('dashboard.webhooks');

  /* state */
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  /* load on mount */
  useEffect(() => {
    fetch('/api/merchant/webhook')
      .then((r) => r.json())
      .then((d: WebhookConfig) => {
        setConfig(d);
        setUrlInput(d.webhook_url ?? '');
      })
      .catch(() => setConfig({ configured: false, webhook_url: null, has_secret: false }))
      .finally(() => setLoading(false));
  }, []);

  /* save / rotate */
  const handleSave = async () => {
    if (!urlInput.startsWith('https://')) {
      setSaveError(t('url_hint'));
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    setNewSecret(null);

    const res = await fetch('/api/merchant/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: urlInput }),
    });
    const data = await res.json() as { webhook_url?: string; webhook_secret?: string; error?: string };

    if (res.ok) {
      setConfig({ configured: true, webhook_url: data.webhook_url ?? urlInput, has_secret: true });
      setNewSecret(data.webhook_secret ?? null);
      setSaveSuccess(true);
    } else {
      setSaveError(data.error ?? 'Error');
    }
    setSaving(false);
  };

  /* test */
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError('');
    const res = await fetch('/api/merchant/webhook/test', { method: 'POST' });
    const data = await res.json() as TestResult & { error?: string };
    if (res.ok) {
      setTestResult(data);
    } else {
      setTestError(data.error ?? t('test_error'));
    }
    setTesting(false);
  };

  /* delete */
  const handleDelete = async () => {
    setDeleting(true);
    await fetch('/api/merchant/webhook', { method: 'DELETE' });
    setConfig({ configured: false, webhook_url: null, has_secret: false });
    setUrlInput('');
    setNewSecret(null);
    setTestResult(null);
    setShowDeleteConfirm(false);
    setDeleting(false);
  };

  /* copy code snippet */
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(CODE_SNIPPET);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-[#1D9E75]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[#1D9E75]/10 dark:bg-[#1D9E75]/15">
            <Webhook className="text-[#1D9E75]" size={20} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">{t('subtitle')}</p>
      </div>

      {/* ── Status pill ───────────────────────────────────────── */}
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${
        config?.configured
          ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
      }`}>
        {config?.configured
          ? <><CheckCircle2 size={16} /> {t('status_configured')}</>
          : <><XCircle size={16} /> {t('status_none')}</>
        }
      </div>

      {/* ── URL form ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            {t('url_label')}
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={t('url_placeholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75] transition-colors font-mono"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{t('url_hint')}</p>
        </div>

        {saveError && (
          <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-2.5">
            {saveError}
          </p>
        )}

        {saveSuccess && !newSecret && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={15} /> {t('save_success')}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !urlInput}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a65] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-sm shadow-[#1D9E75]/20"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Webhook size={15} />}
            {saving ? t('saving') : config?.configured ? t('secret_rotate') : t('save')}
          </button>

          {config?.configured && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-[#1D9E75] hover:text-[#1D9E75] disabled:opacity-50 transition-all"
            >
              {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {testing ? t('test_sending') : t('test_btn')}
            </button>
          )}
        </div>
      </div>

      {/* ── New secret reveal ─────────────────────────────────── */}
      {newSecret && (
        <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('warning_title')}</p>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">{t('warning_secret')}</p>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-2.5">
            <code className="flex-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all select-all">
              {newSecret}
            </code>
            <CopyButton value={newSecret} label={t('copy')} copied={t('copied')} />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Shield size={13} className="text-[#1D9E75] flex-shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('secret_hint')}</p>
          </div>
        </div>
      )}

      {/* ── Secret status (no new secret revealed) ────────────── */}
      {!newSecret && config && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
          config.has_secret
            ? 'bg-white dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-400'
        }`}>
          <Shield size={16} className={config.has_secret ? 'text-[#1D9E75]' : 'text-gray-400'} />
          <span className="text-xs font-medium">{config.has_secret ? t('secret_configured') : t('secret_none')}</span>
        </div>
      )}

      {/* ── Test result ───────────────────────────────────────── */}
      {testResult && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
          testResult.ok
            ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400'
        }`}>
          {testResult.ok ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <XCircle size={16} className="mt-0.5 flex-shrink-0" />}
          <div>
            <p className="font-semibold text-xs">
              {t('test_success')} {testResult.status_code} · {testResult.duration_ms}ms
            </p>
          </div>
        </div>
      )}
      {testError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/15 text-sm text-red-600 dark:text-red-400">
          <XCircle size={15} />
          {testError}
        </div>
      )}

      {/* ── Events reference ──────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">{t('event_label')}</p>
        <div className="space-y-2">
          {[t('event_payment'), t('event_test')].map((ev) => (
            <div key={ev} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1D9E75] flex-shrink-0" />
              <code className="text-xs text-gray-700 dark:text-gray-300">{ev}</code>
            </div>
          ))}
        </div>
      </div>

      {/* ── Node.js code example ──────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <button
          onClick={() => setShowCode(!showCode)}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#0d1420] text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#1D9E75]" />
            {t('code_title')}
          </div>
          {showCode ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {showCode && (
          <div className="relative">
            <pre className="bg-[#0d1117] text-[#e6edf3] text-xs leading-relaxed p-5 overflow-x-auto font-mono">
              <code>{CODE_SNIPPET}</code>
            </pre>
            <button
              onClick={handleCopyCode}
              className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold transition-all"
            >
              {codeCopied ? <Check size={12} /> : <Copy size={12} />}
              {codeCopied ? t('copied') : t('copy')}
            </button>
          </div>
        )}
      </div>

      {/* ── Danger zone ───────────────────────────────────────── */}
      {config?.configured && (
        <div className="border border-red-200 dark:border-red-900/50 rounded-2xl p-5">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={15} />
              {t('delete_btn')}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400">{t('delete_confirm')}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50 transition-all"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleting ? t('deleting') : t('delete_btn')}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
