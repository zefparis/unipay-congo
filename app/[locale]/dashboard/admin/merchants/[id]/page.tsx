'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  Building2, ArrowLeft, RefreshCw, KeyRound, Ban, CheckCircle2,
  AlertCircle, Loader2, FlaskConical, Globe, ShieldCheck,
  Copy, Check, Trash2, ArrowDownLeft, ArrowUpRight, Mail, Headset, X, Send, AlertTriangle,
  Wallet, Banknote, Coins, Activity,
} from 'lucide-react';
import {
  getMerchantDetail, revokeApiKey, regenerateApiKey,
  suspendMerchant, reactivateMerchant, settleMerchant, getMerchantStatsById,
  type Merchant, type MerchantApiKey, type MerchantTransaction,
  type MerchantBalance, type SettlementRequest, type MerchantStats as MerchantStatsType,
} from '@/lib/admin-api';
import clsx from 'clsx';

const KYC_LABELS: Record<string, string> = {
  pending: 'Non soumis',
  submitted: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};
const KYC_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-500 dark:bg-navy-panel dark:text-text-secondary',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-navy-panel dark:text-text-secondary',
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD').format(Math.round(n));
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MerchantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [apiKeys, setApiKeys] = useState<MerchantApiKey[]>([]);
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [balances, setBalances] = useState<MerchantBalance[]>([]);
  const [settlementRequests, setSettlementRequests] = useState<SettlementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Email modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [templates, setTemplates] = useState<Array<{ label: string; subject: string; body: string }>>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailHistorySummary, setEmailHistorySummary] = useState<Array<{ template_label: string; count: number; last_sent_at: string }>>([]);

  // Support history state
  const [supportConvs, setSupportConvs] = useState<Array<{ id: string; status: string; updated_at: string }>>([]);
  const [supportMessages, setSupportMessages] = useState<Array<{ id: string; role: string; content: string; channel: string; subject: string | null; created_at: string }>>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [supportLoading, setSupportLoading] = useState(false);

  // Settlement modal state
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleCurrency, setSettleCurrency] = useState('CDF');
  const [settleAmount, setSettleAmount] = useState('');
  const [settlePhone, setSettlePhone] = useState('');
  const [settleOperator, setSettleOperator] = useState('orange');
  const [settling, setSettling] = useState(false);

  // Stats state
  const [stats, setStats] = useState<MerchantStatsType | null>(null);
  const [statsWindow, setStatsWindow] = useState<'7d' | '30d'>('7d');
  const [statsLoading, setStatsLoading] = useState(false);

  // Webhook test state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEditing, setWebhookEditing] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ ok: boolean; http_status: number; elapsed_ms: number; body: string; content_type: string | null; signed: boolean } | null>(null);
  const [webhookError, setWebhookError] = useState('');

  // Company IDs (RCCM / ID Nat.) manual edit state
  const [companyIdsEditing, setCompanyIdsEditing] = useState(false);
  const [companyIdsSaving, setCompanyIdsSaving] = useState(false);
  const [editRccm, setEditRccm] = useState('');
  const [editIdnat, setEditIdnat] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMerchantDetail(id);
      setMerchant(res.merchant);
      setApiKeys(res.api_keys);
      setTransactions(res.transactions);
      setBalances(res.balances ?? []);
      setSettlementRequests(res.settlement_requests ?? []);
      setWebhookUrl(res.merchant.webhook_url ?? '');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getMerchantStatsById(id, statsWindow);
      setStats(s);
    } catch (e) {
      console.error('[stats] fetch error:', e);
    } finally {
      setStatsLoading(false);
    }
  }, [id, statsWindow]);

  useEffect(() => { void loadStats(); }, [loadStats]);

  const handleRevoke = async (keyId: string) => {
    if (!merchant) return;
    setActing(keyId + ':revoke');
    try {
      await revokeApiKey(merchant.id, keyId);
      setApiKeys((prev) => prev.map((k) => k.id === keyId ? { ...k, is_active: false } : k));
      setToast({ msg: 'Clé API révoquée', type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally { setActing(null); }
  };

  const handleRegenerate = async () => {
    if (!merchant) return;
    if (!confirm('Régénérer la clé API ? L\'ancienne clé sera désactivée immédiatement.')) return;
    setActing('regenerate');
    setNewKey(null);
    try {
      const res = await regenerateApiKey(merchant.id);
      setNewKey(res.api_key);
      setToast({ msg: 'Nouvelle clé générée — copiez-la maintenant', type: 'success' });
      void load();
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally { setActing(null); }
  };

  const handleSuspend = async () => {
    if (!merchant) return;
    setActing('suspend');
    try {
      await suspendMerchant(merchant.id);
      setMerchant((prev) => prev ? { ...prev, status: 'suspended' } : prev);
      setToast({ msg: 'Marchand suspendu', type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally { setActing(null); }
  };

  const handleReactivate = async () => {
    if (!merchant) return;
    setActing('reactivate');
    try {
      await reactivateMerchant(merchant.id);
      setMerchant((prev) => prev ? { ...prev, status: 'active' } : prev);
      setToast({ msg: 'Marchand réactivé', type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally { setActing(null); }
  };

  const copyKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSettleModal = (currency: string, balance: number) => {
    setSettleCurrency(currency);
    setSettleAmount(String(Math.round(balance * 100) / 100));
    setSettlePhone(merchant?.settlement_phone ?? '');
    setSettleOperator('orange');
    setSettleModalOpen(true);
  };

  const handleSettle = async () => {
    if (!merchant || settling) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      setToast({ msg: 'Montant invalide', type: 'error' });
      return;
    }
    if (!settlePhone.trim()) {
      setToast({ msg: 'Téléphone de règlement requis', type: 'error' });
      return;
    }
    setSettling(true);
    try {
      const res = await settleMerchant(merchant.id, {
        amount,
        currency: settleCurrency,
        phone: settlePhone.trim(),
        operator: settleOperator,
      });
      if (res.error) {
        setToast({ msg: res.message ?? res.error, type: 'error' });
      } else if (res.status === 'success') {
        setToast({ msg: `Règlement de ${fmt(res.amount)} ${res.currency} effectué avec succès`, type: 'success' });
        setSettleModalOpen(false);
        void load();
      } else if (res.status === 'pending_admin_review') {
        setToast({ msg: `Règlement de ${fmt(res.amount)} ${res.currency} créé — en attente de validation admin`, type: 'success' });
        setSettleModalOpen(false);
        void load();
      } else {
        setToast({ msg: `Statut: ${res.status}`, type: 'success' });
        setSettleModalOpen(false);
        void load();
      }
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally {
      setSettling(false);
    }
  };

  const handleSaveWebhookUrl = async () => {
    if (!merchant || webhookSaving) return;
    setWebhookSaving(true);
    try {
      const res = await fetch(`/api/admin/wallet/merchants/${id}/webhook-url`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookUrl.trim() || null }),
      });
      if (!res.ok) throw new Error('Échec de la sauvegarde');
      const data = await res.json();
      setWebhookUrl(data.webhook_url ?? '');
      setMerchant((prev) => prev ? { ...prev, webhook_url: data.webhook_url } : prev);
      setWebhookEditing(false);
      setToast({ msg: 'Webhook URL mis à jour', type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleSaveCompanyIds = async () => {
    if (!merchant || companyIdsSaving) return;
    setCompanyIdsSaving(true);
    try {
      const res = await fetch(`/api/admin/wallet/merchants/${id}/company-ids`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_rccm: editRccm.trim() || null,
          company_idnat: editIdnat.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Échec de la sauvegarde');
      }
      const data = await res.json() as { company_rccm: string | null; company_idnat: string | null };
      setMerchant((prev) => prev ? { ...prev, company_rccm: data.company_rccm, company_idnat: data.company_idnat } : prev);
      setCompanyIdsEditing(false);
      setToast({ msg: 'RCCM / ID Nat. mis à jour', type: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally {
      setCompanyIdsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!merchant || webhookTesting) return;
    setWebhookTesting(true);
    setWebhookResult(null);
    setWebhookError('');
    try {
      const res = await fetch(`/api/admin/wallet/merchants/${id}/test-webhook`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setWebhookError(data.message ?? data.error ?? 'Échec du test');
      } else {
        setWebhookResult(data);
      }
    } catch (e) {
      setWebhookError((e as Error).message);
    } finally {
      setWebhookTesting(false);
    }
  };

  const openEmailModal = async () => {
    setEmailModalOpen(true);
    setSelectedTemplate('');
    setEmailSubject('');
    setEmailBody('');
    setTemplates([]);
    setEmailHistorySummary([]);
    setTemplatesLoading(true);
    try {
      const [tplRes, histRes] = await Promise.all([
        fetch(`/api/admin/wallet/merchants/${id}/support-templates`, { cache: 'no-store' }),
        fetch(`/api/admin/wallet/merchants/${id}/email-history-summary`, { cache: 'no-store' }),
      ]);
      if (tplRes.ok) {
        const data = await tplRes.json();
        setTemplates(data.templates ?? []);
      } else {
        console.error('[email-modal] templates fetch failed:', tplRes.status, await tplRes.text().catch(() => ''));
      }
      if (histRes.ok) {
        const histData = await histRes.json();
        setEmailHistorySummary(histData.summary ?? []);
      }
    } catch (err) {
      console.error('[email-modal] fetch error:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const applyTemplate = (label: string) => {
    setSelectedTemplate(label);
    const t = templates.find((x) => x.label === label);
    if (t) {
      setEmailSubject(t.subject);
      setEmailBody(t.body);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim() || sendingEmail) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/admin/wallet/merchants/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
          conversation_id: activeConvId ?? undefined,
          template_label: selectedTemplate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Échec envoi email');
      const data = await res.json();
      setToast({ msg: `Email envoyé à ${merchant?.email}`, type: 'success' });
      setEmailModalOpen(false);
      if (data.conversation_id) {
        setActiveConvId(data.conversation_id);
      }
      void loadSupportHistory();
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally {
      setSendingEmail(false);
    }
  };

  const loadSupportHistory = useCallback(async () => {
    setSupportLoading(true);
    try {
      const res = await fetch(`/api/admin/wallet/merchants/${id}/support`);
      if (!res.ok) return;
      const data = await res.json();
      const allConvs = (data.data ?? []).filter((c: { merchant_id?: string }) => c.merchant_id === id);
      setSupportConvs(allConvs);
      if (allConvs.length > 0 && !activeConvId) {
        setActiveConvId(allConvs[0].id);
      }
      if (activeConvId) {
        const msgRes = await fetch(`/api/admin/support/conversations/${activeConvId}/messages`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setSupportMessages(msgData.messages ?? []);
        }
      }
    } catch { /* silent */ } finally {
      setSupportLoading(false);
    }
  }, [id, activeConvId]);

  useEffect(() => { void loadSupportHistory(); }, [loadSupportHistory]);

  if (loading && !merchant) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-green-deep" />
      </div>
    );
  }

  if (error && !merchant) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/dashboard/admin/merchants/list" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-deep">
          <ArrowLeft size={14} /> Retour à la liste
        </Link>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!merchant) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && (
        <div className={clsx(
          'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm',
          toast.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300',
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin/merchants/list" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-deep">
            <ArrowLeft size={14} /> Retour
          </Link>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
            <Building2 className="text-green-deep" size={22} />
            {merchant.company_name ?? merchant.name ?? merchant.email}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openEmailModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-all"
          >
            <Mail size={14} />
            Contacter par email
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Balance card */}
      <div className={clsx(
        'relative overflow-hidden rounded-2xl p-5 border shadow-sm',
        'bg-gradient-to-r from-green-deep/10 to-emerald-500/5 border-green-deep/30 dark:border-green-deep/20',
      )}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-deep/15">
            <Wallet size={22} className="text-green-deep" />
          </div>
          <div>
            <p className="text-xs font-semibold text-green-deep-dark uppercase tracking-wider mb-0.5">Solde dû au marchand</p>
            <div className="flex items-end gap-4 flex-wrap">
              {balances.length === 0 ? (
                <p className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary">—</p>
              ) : (
                balances.map((b) => (
                  <div key={b.currency} className="flex items-baseline gap-1.5">
                    <span className={clsx(
                      'text-2xl font-serif font-bold',
                      b.balance > 0 ? 'text-gray-900 dark:text-text-primary' : 'text-gray-400',
                    )}>
                      {fmt(b.balance)}
                    </span>
                    <span className="text-sm font-normal text-gray-500 dark:text-text-secondary">{b.currency}</span>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">
              Cumul des crédits moins les règlements déjà payés (ledger entries)
              {merchant?.settlement_phone && (
                <> · Règlement via <span className="font-mono">{merchant.settlement_phone}</span></>
              )}
            </p>
          </div>
        </div>
        {balances.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-green-deep/15">
            {balances.map((b) => (
              <div key={`detail-${b.currency}`} className="text-xs">
                <div className="text-gray-400 uppercase tracking-wider mb-0.5">{b.currency}</div>
                <div className="text-gray-700 dark:text-text-primary">
                  Crédits: <span className="font-medium">{fmt(b.total_credits)}</span>
                </div>
                <div className="text-gray-700 dark:text-text-primary">
                  Réglé: <span className="font-medium">{fmt(b.total_settlements)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {balances.some((b) => b.balance > 0) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-green-deep/15">
            {balances.filter((b) => b.balance > 0).map((b) => (
              <button
                key={`settle-${b.currency}`}
                onClick={() => openSettleModal(b.currency, b.balance)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-colors"
              >
                <Coins size={14} />
                Régler {b.currency}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats card — success/failure per operator */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary flex items-center gap-2">
            <Activity size={16} className="text-purple-500" />
            Taux de succès par opérateur
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={statsWindow}
              onChange={(e) => setStatsWindow(e.target.value as '7d' | '30d')}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-xs text-gray-700 dark:text-text-primary"
            >
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
            </select>
            <button
              onClick={() => void loadStats()}
              disabled={statsLoading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={statsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {statsLoading && !stats ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={20} className="animate-spin text-purple-500" />
          </div>
        ) : stats ? (
          <>
            {/* Totals row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Tentatives</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-text-primary">{stats.totals.total_attempts}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Succès</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">{stats.totals.success_count}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Échecs</div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.totals.failed_count}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Taux succès</div>
                <div className={clsx(
                  'text-lg font-semibold',
                  stats.totals.success_rate_pct === null ? 'text-gray-400'
                  : stats.totals.success_rate_pct >= 95 ? 'text-green-600 dark:text-green-400'
                  : stats.totals.success_rate_pct >= 80 ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400',
                )}>
                  {stats.totals.success_rate_pct !== null ? `${stats.totals.success_rate_pct}%` : '—'}
                </div>
              </div>
            </div>

            {/* Per-operator breakdown */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                    {['Opérateur', 'Tentatives', 'Succès', 'Échecs', 'Taux', 'Panne provider', 'Erreur client'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                  {stats.operators.map((op) => (
                    <tr key={op.operator} className="hover:bg-gray-50 dark:hover:bg-navy-panel/30 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-text-primary capitalize">{op.operator}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-text-primary">{op.total_attempts}</td>
                      <td className="px-3 py-2 text-green-600 dark:text-green-400">{op.success_count}</td>
                      <td className="px-3 py-2 text-red-600 dark:text-red-400">{op.failed_count}</td>
                      <td className="px-3 py-2">
                        <span className={clsx(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
                          op.success_rate_pct === null ? 'bg-gray-100 text-gray-500 dark:bg-navy-panel dark:text-text-secondary'
                          : op.success_rate_pct >= 95 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : op.success_rate_pct >= 80 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                        )}>
                          {op.success_rate_pct !== null ? `${op.success_rate_pct}%` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {op.provider_outage_failures > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <AlertTriangle size={12} /> {op.provider_outage_failures}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500 dark:text-text-secondary">{op.client_error_failures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400">
              {"« Panne provider » = échec causé par l'opérateur (API unreachable, token error, code 10301/10201)."}
              {"« Erreur client » = solde insuffisant, MSISDN incorrect, etc."}
            </p>
          </>
        ) : (
          <div className="text-sm text-gray-400 text-center py-4">Aucune donnée de statistique.</div>
        )}
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary flex items-center gap-2">
          <Building2 size={16} className="text-blue-500" />
          Profil
          {!companyIdsEditing && (
            <button
              onClick={() => {
                setEditRccm(merchant.company_rccm ?? '');
                setEditIdnat(merchant.company_idnat ?? '');
                setCompanyIdsEditing(true);
              }}
              className="ml-auto px-2.5 py-1 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-xs text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
            >
              Modifier RCCM / ID Nat.
            </button>
          )}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Email</div>
            <div className="text-gray-900 dark:text-text-primary font-medium">{merchant.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Téléphone</div>
            <div className="text-gray-900 dark:text-text-primary font-medium">{merchant.phone ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Pays</div>
            <div className="text-gray-900 dark:text-text-primary font-medium">{merchant.country}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Entreprise</div>
            <div className="text-gray-900 dark:text-text-primary font-medium">{merchant.company_name ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">RCCM</div>
            {companyIdsEditing ? (
              <input
                value={editRccm}
                onChange={(e) => setEditRccm(e.target.value)}
                placeholder="CD/KIN/RCCM/XX-X-XXXX"
                className="mt-0.5 w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-green-deep/30"
              />
            ) : (
              <div className="text-gray-900 dark:text-text-primary font-medium">{merchant.company_rccm ?? '—'}</div>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">ID Nat.</div>
            {companyIdsEditing ? (
              <input
                value={editIdnat}
                onChange={(e) => setEditIdnat(e.target.value)}
                placeholder="XX-XX-XXXXXXX"
                className="mt-0.5 w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-green-deep/30"
              />
            ) : (
              <div className="text-gray-900 dark:text-text-primary font-medium">{merchant.company_idnat ?? '—'}</div>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Mode</div>
            <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
              merchant.mode === 'live' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            )}>
              {merchant.mode === 'live' ? <Globe size={10} /> : <FlaskConical size={10} />}
              {merchant.mode === 'live' ? 'Live' : 'Sandbox'}
            </span>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">KYC</div>
            <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', KYC_STYLES[merchant.kyc_status] ?? 'bg-gray-100 text-gray-600')}>
              {KYC_LABELS[merchant.kyc_status] ?? merchant.kyc_status}
            </span>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Statut</div>
            <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
              merchant.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            )}>
              {merchant.status === 'active' ? 'Actif' : 'Suspendu'}
            </span>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Inscrit le</div>
            <div className="text-gray-900 dark:text-text-primary font-medium">{fmtDate(merchant.created_at)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">KYC soumis le</div>
            <div className="text-gray-900 dark:text-text-primary font-medium">{fmtDate(merchant.kyc_submitted_at)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">KYC reviewé le</div>
            <div className="text-gray-900 dark:text-text-primary font-medium">{fmtDate(merchant.kyc_reviewed_at)}</div>
          </div>
        </div>
        {companyIdsEditing && (
          <div className="flex gap-2">
            <button
              onClick={handleSaveCompanyIds}
              disabled={companyIdsSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-colors disabled:opacity-50"
            >
              {companyIdsSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Enregistrer
            </button>
            <button
              onClick={() => setCompanyIdsEditing(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
            >
              <X size={14} />
              Annuler
            </button>
          </div>
        )}
        {merchant.kyc_notes && (
          <div className="text-sm">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notes KYC</div>
            <div className="text-gray-700 dark:text-text-primary bg-gray-50 dark:bg-navy-panel/50 rounded-lg p-3">{merchant.kyc_notes}</div>
          </div>
        )}
        {/* Suspend/Reactivate */}
        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-text-secondary/15">
          {merchant.status === 'active' ? (
            <button
              onClick={handleSuspend}
              disabled={acting === 'suspend'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <Ban size={14} /> Suspendre
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              disabled={acting === 'reactivate'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800/50 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> Réactiver
            </button>
          )}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary flex items-center gap-2">
            <KeyRound size={16} className="text-amber-500" />
            Clés API
          </h2>
          <button
            onClick={handleRegenerate}
            disabled={acting === 'regenerate'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-colors disabled:opacity-50"
          >
            {acting === 'regenerate' ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            Régénérer
          </button>
        </div>

        {/* New key display */}
        {newKey && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              <AlertCircle size={16} />
              Nouvelle clé — copiez-la maintenant, elle ne sera plus affichée
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-navy-panel rounded-lg px-3 py-2 text-sm font-mono text-gray-900 dark:text-text-primary break-all">
                {newKey}
              </code>
              <button
                onClick={copyKey}
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">Aucune clé API.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                  {['Préfixe', 'Label', 'Statut', 'Créée le', 'Dernière utilisation', 'Action'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50 dark:hover:bg-navy-panel/30 transition-colors">
                    <td className="px-3 py-2 font-mono text-gray-900 dark:text-text-primary">{k.key_prefix}…</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-text-primary">{k.label}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
                        k.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-navy-panel dark:text-text-secondary',
                      )}>
                        {k.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-text-secondary whitespace-nowrap text-xs">{fmtDate(k.created_at)}</td>
                    <td className="px-3 py-2 text-gray-500 dark:text-text-secondary whitespace-nowrap text-xs">{fmtDate(k.last_used_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {k.is_active && (
                        <button
                          onClick={() => void handleRevoke(k.id)}
                          disabled={acting === k.id + ':revoke'}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800/50 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={12} /> Révoquer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Callback test */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary flex items-center gap-2">
          <Send size={16} className="text-blue-500" />
          Callback marchand
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-1.5">URL de webhook</label>
            {webhookEditing ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhooks/unipay"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-green-deep/30"
                />
                <button
                  onClick={handleSaveWebhookUrl}
                  disabled={webhookSaving}
                  className="px-3 py-2 rounded-lg bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-colors disabled:opacity-50"
                >
                  {webhookSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => { setWebhookEditing(false); setWebhookUrl(merchant?.webhook_url ?? ''); }}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 dark:bg-navy-panel/50 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 dark:text-text-primary break-all">
                  {merchant?.webhook_url ?? '—'}
                </code>
                <button
                  onClick={() => { setWebhookEditing(true); setWebhookUrl(merchant?.webhook_url ?? ''); }}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors whitespace-nowrap"
                >
                  Modifier
                </button>
              </div>
            )}
          </div>

          {merchant?.webhook_url ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestWebhook}
                disabled={webhookTesting}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                  {webhookTesting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Tester le webhook
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun webhook configuré. Cliquez sur « Modifier » pour en ajouter un.</p>
            )}

          {/* Test result */}
          {webhookError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{webhookError}</span>
            </div>
          )}
          {webhookResult && (
            <div className="bg-gray-50 dark:bg-navy-panel/50 border border-gray-200 dark:border-text-secondary/15 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className={clsx(
                  'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
                  webhookResult.ok
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                )}>
                  HTTP {webhookResult.http_status}
                </span>
                <span className="text-gray-500 dark:text-text-secondary">
                  Temps de réponse: <span className="font-medium text-gray-900 dark:text-text-primary">{webhookResult.elapsed_ms}ms</span>
                </span>
                {webhookResult.signed && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Signé HMAC
                  </span>
                )}
                {webhookResult.content_type && (
                  <span className="text-gray-500 dark:text-text-secondary">
                    Type: <span className="font-mono text-xs">{webhookResult.content_type}</span>
                  </span>
                )}
              </div>
              {webhookResult.body && (
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Corps de la réponse</div>
                  <pre className="text-xs font-mono text-gray-700 dark:text-text-primary bg-white dark:bg-navy-panel rounded-lg p-2 max-h-48 overflow-auto whitespace-pre-wrap break-all">
                    {webhookResult.body}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary flex items-center gap-2">
          <ArrowDownLeft size={16} className="text-green-deep" />
          Transactions récentes (20 dernières)
        </h2>
        {transactions.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">Aucune transaction.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                  {['Date', 'Type', 'Opérateur', 'Téléphone', 'Montant', 'Frais', 'Net', 'Statut'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-navy-panel/30 transition-colors">
                    <td className="px-3 py-2 text-gray-500 dark:text-text-secondary whitespace-nowrap text-xs">{fmtDate(tx.created_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        {tx.direction === 'collect' ? <ArrowDownLeft size={13} className="text-green-500" /> : <ArrowUpRight size={13} className="text-orange-500" />}
                        <span className="text-gray-700 dark:text-text-primary">{tx.direction}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-text-primary">{tx.operator}</td>
                    <td className="px-3 py-2 font-mono text-gray-700 dark:text-text-primary">{tx.phone}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-text-primary whitespace-nowrap">{fmt(tx.amount)} <span className="text-gray-400 text-xs font-normal">{tx.currency}</span></td>
                    <td className="px-3 py-2 text-gray-500 dark:text-text-secondary whitespace-nowrap">{fmt(tx.fee)} <span className="text-gray-400 text-xs">{tx.currency}</span></td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-text-primary whitespace-nowrap">{fmt(tx.net_amount)} <span className="text-gray-400 text-xs font-normal">{tx.currency}</span></td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_STYLES[tx.status] ?? 'bg-gray-100 text-gray-600')}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settlement history */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary flex items-center gap-2">
          <Banknote size={16} className="text-amber-500" />
          Historique des règlements
        </h2>
        {settlementRequests.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">Aucun règlement effectué.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                  {['Date', 'Montant', 'Devise', 'Téléphone', 'Statut', 'Référence provider', 'Motif rejet'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                {settlementRequests.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-navy-panel/30 transition-colors">
                    <td className="px-3 py-2 text-gray-500 dark:text-text-secondary whitespace-nowrap text-xs">{fmtDate(s.created_at)}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-text-primary">{fmt(s.amount)}</td>
                    <td className="px-3 py-2">
                      <span className={clsx(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold',
                        s.currency === 'CDF'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                      )}>
                        {s.currency}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-700 dark:text-text-primary text-xs">{s.phone}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_STYLES[s.status] ?? 'bg-gray-100 text-gray-600')}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-500 dark:text-text-secondary text-xs">{s.provider_ref ?? '—'}</td>
                    <td className="px-3 py-2 text-red-500 dark:text-red-400 text-xs">{s.reject_reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Support history */}
      <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-text-primary flex items-center gap-2">
            <Headset size={16} className="text-purple-500" />
            Historique support
          </h2>
          {supportConvs.length > 1 && (
            <select
              value={activeConvId ?? ''}
              onChange={(e) => setActiveConvId(e.target.value)}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-xs text-gray-700 dark:text-text-primary"
            >
              {supportConvs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.status} — {new Date(c.updated_at).toLocaleDateString('fr-CD')}
                </option>
              ))}
            </select>
          )}
        </div>

        {supportLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-purple-500" />
          </div>
        ) : supportMessages.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">
            Aucune conversation de support. Utilisez « Contacter par email » pour démarrer.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {supportMessages.map((m) => (
              <div
                key={m.id}
                className={clsx('flex', m.role === 'admin' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={clsx(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    m.role === 'admin'
                      ? m.channel === 'email'
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-purple-500 text-white rounded-br-sm'
                      : m.role === 'merchant'
                      ? 'bg-green-deep text-white rounded-bl-sm'
                      : 'bg-gray-100 text-gray-900 dark:bg-navy-panel dark:text-text-primary rounded-bl-sm',
                  )}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold mb-1 opacity-70">
                    {m.role === 'admin' && m.channel === 'email' && <><Mail size={10} /> Email admin</>}
                    {m.role === 'admin' && m.channel === 'chat' && <><Headset size={10} /> Admin (chat)</>}
                    {m.role === 'merchant' && 'Marchand'}
                    {m.role === 'bot' && 'Assistant IA'}
                  </div>
                  {m.channel === 'email' && m.subject && (
                    <div className="text-xs font-semibold mb-1 opacity-80">Objet: {m.subject}</div>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <div className={clsx('text-[10px] mt-1', m.role === 'admin' || m.role === 'merchant' ? 'text-white/60' : 'text-gray-400')}>
                    {new Date(m.created_at).toLocaleString('fr-CD', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEmailModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-navy-panel rounded-2xl shadow-2xl border border-gray-200 dark:border-text-secondary/15 max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-text-secondary/15">
              <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
                <Mail size={18} className="text-green-deep" />
                Contacter {merchant.email}
              </h3>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Template selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-1.5">
                Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => applyTemplate(e.target.value)}
                disabled={templatesLoading}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary disabled:opacity-50"
              >
                <option value="">
                  {templatesLoading ? 'Chargement des templates…' : '— Sélectionner un template —'}
                </option>
                {templates.map((t) => (
                  <option key={t.label} value={t.label}>{t.label}</option>
                ))}
              </select>
              {selectedTemplate && (() => {
                const hist = emailHistorySummary.find((h) => h.template_label === selectedTemplate);
                if (!hist || hist.count === 0) return null;
                const lastDate = new Date(hist.last_sent_at).toLocaleDateString('fr-CD', { day: '2-digit', month: '2-digit', year: 'numeric' });
                return (
                  <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      Ce template a déjà été envoyé <strong>{hist.count}</strong> fois
                      {hist.count > 1 ? 's' : ''}, la dernière fois le <strong>{lastDate}</strong>.
                    </span>
                  </div>
                );
              })()}
            </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-1.5">
                  Objet
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-green-deep/30"
                  placeholder="Objet de l'email"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-1.5">
                  Message
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-green-deep/30 resize-none"
                  placeholder="Votre message…"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-text-secondary/15">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailSubject.trim() || !emailBody.trim() || sendingEmail}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-colors disabled:opacity-50"
              >
                {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement modal */}
      {settleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSettleModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-panel rounded-2xl shadow-2xl border border-gray-200 dark:border-text-secondary/15 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-text-secondary/15">
              <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
                <Coins size={18} className="text-green-deep" />
                Régler le marchand
              </h3>
              <button onClick={() => setSettleModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-1.5">Devise</label>
                <select
                  value={settleCurrency}
                  onChange={(e) => setSettleCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary"
                >
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-1.5">Montant</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-green-deep/30"
                  placeholder="Montant du règlement"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-1.5">Téléphone de règlement</label>
                <input
                  type="tel"
                  value={settlePhone}
                  onChange={(e) => setSettlePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-green-deep/30"
                  placeholder="Ex: 0998338854"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-1.5">Opérateur</label>
                <select
                  value={settleOperator}
                  onChange={(e) => setSettleOperator(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary"
                >
                  <option value="orange">Orange Money</option>
                  <option value="airtel">Airtel Money</option>
                  <option value="afrimoney">Afrimoney</option>
                </select>
              </div>
              <p className="text-xs text-gray-400">
                Utilise le même flux que le règlement marchand (RPC process_merchant_settlement + payout Unipesa).
                Si le montant dépasse le seuil auto, le règlement passera en validation admin.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-text-secondary/15">
              <button onClick={() => setSettleModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors">
                Annuler
              </button>
              <button
                onClick={handleSettle}
                disabled={settling || !settleAmount || !settlePhone.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-colors disabled:opacity-50"
              >
                {settling ? <Loader2 size={14} className="animate-spin" /> : <Coins size={14} />}
                Régler maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
