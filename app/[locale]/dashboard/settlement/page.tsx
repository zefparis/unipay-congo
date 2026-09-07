'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, RefreshCw, AlertCircle, CheckCircle2, Loader2,
  ArrowDownToLine, Clock, XCircle, Phone,
} from 'lucide-react';
import clsx from 'clsx';

interface CurrencyBalance {
  currency: string;
  balance: number;
  total_credits: number;
  total_settlements: number;
}

interface BalanceResponse {
  balance: number;  // deprecated — sum of all currencies (may mix)
  balances: CurrencyBalance[];
  settlement_phone: string | null;
  kyc_status: string;
  mode: string;
}

interface SettlementRequest {
  id: string;
  amount: number;
  currency?: string;
  phone: string;
  status: string;
  provider_ref: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface HistoryResponse {
  requests: SettlementRequest[];
  total: number;
  page: number;
  limit: number;
}

interface RequestResult {
  request_id: string;
  status: string;
  amount: number;
  currency?: string;
  provider_ref?: string;
  balance_after?: number;
  auto_payout: boolean;
  message?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  processing: { label: 'En cours', icon: Loader2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  pending_admin_review: { label: 'En revue', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  success: { label: 'Réussi', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  failed: { label: 'Échoué', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  rejected: { label: 'Rejeté', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SettlementPage() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [history, setHistory] = useState<SettlementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Phone form state
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneSaved, setPhoneSaved] = useState(false);

  // Request confirmation state
  const [showConfirm, setShowConfirm] = useState(false);
  const [requestResult, setRequestResult] = useState<RequestResult | null>(null);

  // Selected currency for settlement request
  const [selectedCurrency, setSelectedCurrency] = useState<string>('CDF');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [balRes, histRes] = await Promise.all([
        fetch('/api/merchant/settlement/balance', { cache: 'no-store' }),
        fetch('/api/merchant/settlement/history?limit=20', { cache: 'no-store' }),
      ]);

      if (!balRes.ok) throw new Error('Échec chargement solde');
      const balData = await balRes.json() as BalanceResponse;
      setBalance(balData);

      // Auto-select first currency with a positive balance, fallback to CDF
      // (CDF is always present in balances[] per backend guarantee).
      const positiveBalance = balData.balances?.find((b) => b.balance > 0);
      setSelectedCurrency(positiveBalance?.currency ?? 'CDF');

      if (histRes.ok) {
        const histData = await histRes.json() as HistoryResponse;
        setHistory(histData.requests ?? []);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleSavePhone = async () => {
    if (!phoneInput.trim() || acting) return;
    setActing('phone');
    setError('');
    try {
      const res = await fetch('/api/merchant/settlement/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Échec' }));
        throw new Error(err.error ?? err.message ?? 'Échec');
      }
      setToast({ msg: 'Numéro de règlement enregistré', type: 'success' });
      setPhoneSaved(true);
      setPhoneInput('');
      void load();
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally {
      setActing(null);
    }
  };

  const handleRequestSettlement = async () => {
    if (acting) return;
    setActing('request');
    setShowConfirm(false);
    setError('');
    try {
      const res = await fetch('/api/merchant/settlement/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: selectedCurrency }),  // full balance in selected currency
      });
      const data = await res.json() as RequestResult & { error?: string; message?: string };

      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`);
      }

      setRequestResult(data);
      setToast({
        msg: data.status === 'success' ? 'Règlement effectué' : 'Demande de règlement envoyée',
        type: 'success',
      });
      void load();
    } catch (e) {
      setToast({ msg: (e as Error).message, type: 'error' });
    } finally {
      setActing(null);
    }
  };

  const kycApproved = balance?.kyc_status === 'approved';
  const liveMode = balance?.mode === 'live';

  // Get the balance for the selected currency
  const selectedBalance = balance?.balances?.find((b) => b.currency === selectedCurrency);
  const canRequest = selectedBalance && selectedBalance.balance > 0 && balance?.settlement_phone;

  // All visible currencies (CDF + USD always, USDT if present).
  // Selector shows all visible currencies — those at 0 are greyed but selectable
  // so the merchant can see the service exists.
  const visibleCurrencies = balance?.balances ?? [];
  const hasMultipleCurrencies = visibleCurrencies.length > 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary">
            Règlement
          </h1>
          <p className="text-sm text-gray-500 dark:text-text-secondary mt-1">
            Solde disponible et demandes de versement Mobile Money
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {toast && (
        <div className={clsx(
          'flex items-center gap-2 p-4 rounded-lg text-sm',
          toast.type === 'success' && 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
          toast.type === 'error' && 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
          toast.type === 'info' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-auto text-current opacity-50 hover:opacity-100">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Balance cards — one per currency */}
      {loading && !balance ? (
        <div className="p-6 rounded-2xl bg-gray-100 dark:bg-navy-panel animate-pulse h-32" />
      ) : balance && balance.balances && balance.balances.length > 0 ? (
        <div className={clsx('space-y-4', balance.balances.length === 1 && 'space-y-0')}>
          {balance.balances.map((cur) => (
            <div
              key={cur.currency}
              className={clsx(
                'relative overflow-hidden rounded-2xl p-6 text-white shadow-lg',
                cur.currency === 'CDF'
                  ? 'bg-gradient-to-br from-signal to-[#0f6b4f] shadow-green-deep/20'
                  : 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-600/20',
              )}
            >
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -bottom-8 -right-2 w-24 h-24 bg-white/5 rounded-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet size={16} className="text-white/70" />
                  <span className="text-sm font-medium text-white/70">
                    Solde disponible {cur.currency === 'USD' ? '(USD)' : ''}
                  </span>
                </div>
                <div className="text-4xl font-serif font-bold tracking-tight">
                  {fmt(cur.balance)} <span className="text-lg text-white/60">{cur.currency}</span>
                </div>
                <div className="flex gap-6 mt-4 text-sm">
                  <div>
                    <span className="text-white/50">Total collecté : </span>
                    <span className="font-medium">{fmt(cur.total_credits)} {cur.currency}</span>
                  </div>
                  <div>
                    <span className="text-white/50">Total réglé : </span>
                    <span className="font-medium">{fmt(cur.total_settlements)} {cur.currency}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : balance ? (
        // Fallback for backward compat (no balances array)
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-signal to-[#0f6b4f] p-6 text-white shadow-lg shadow-green-deep/20">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} className="text-white/70" />
              <span className="text-sm font-medium text-white/70">Solde disponible</span>
            </div>
            <div className="text-4xl font-serif font-bold tracking-tight">
              {fmt(balance.balance)} <span className="text-lg text-white/60">CDF</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Requirements warnings */}
      {balance && (
        <>
          {!kycApproved && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle size={18} />
              Votre KYC doit être approuvé pour demander un règlement.
              Statut actuel : <strong>{balance.kyc_status}</strong>
            </div>
          )}
          {!liveMode && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle size={18} />
              Votre compte doit être en mode <strong>live</strong> pour demander un règlement.
              Mode actuel : <strong>{balance.mode}</strong>
            </div>
          )}
        </>
      )}

      {/* Settlement phone configuration */}
      {balance && !balance.settlement_phone && (
        <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-start gap-3 mb-4">
            <Phone size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">Numéro de règlement requis</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Configurez votre numéro Mobile Money pour recevoir vos versements.
                Format attendu : +243 suivi de 9 chiffres (ex: +243997174834).
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+243997174834"
              className="flex-1 px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
            <button
              onClick={() => void handleSavePhone()}
              disabled={!phoneInput.trim() || acting === 'phone'}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {acting === 'phone' ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
            </button>
          </div>
          {phoneSaved && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> Numéro enregistré avec succès
            </p>
          )}
        </div>
      )}

      {balance && balance.settlement_phone && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-text-secondary">
          <Phone size={14} />
          Numéro de règlement : <strong className="text-gray-700 dark:text-text-primary">{balance.settlement_phone}</strong>
        </div>
      )}

      {/* Request settlement — currency selector + button */}
      {balance && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Currency selector — always shows CDF + USD (greyed if 0) so the
              merchant sees the service exists. USDT only if present. */}
          {hasMultipleCurrencies && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-text-secondary">Devise :</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-sm text-gray-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-green-deep/30"
              >
                {visibleCurrencies.map((b) => (
                  <option
                    key={b.currency}
                    value={b.currency}
                    className={b.balance <= 0 ? 'text-gray-400' : ''}
                  >
                    {b.currency} ({fmt(b.balance)}){b.balance <= 0 ? ' — indisponible' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showConfirm ? (
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-text-secondary/20 bg-gray-50 dark:bg-navy-panel/50 w-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-text-primary">
                  Confirmer le règlement de{' '}
                  <strong>{fmt(selectedBalance?.balance ?? 0)} {selectedCurrency}</strong> ?
                </p>
                <p className="text-xs text-gray-500 dark:text-text-secondary mt-0.5">
                  Le montant sera versé sur votre numéro Mobile Money.
                </p>
              </div>
              <button
                onClick={() => void handleRequestSettlement()}
                disabled={!!acting}
                className="px-4 py-2 rounded-lg bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-colors disabled:opacity-50"
              >
                {acting === 'request' ? <Loader2 size={16} className="animate-spin" /> : 'Confirmer'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canRequest || !kycApproved || !liveMode}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-deep text-white text-sm font-medium hover:bg-green-deep/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownToLine size={16} />
              Demander un règlement {hasMultipleCurrencies && `(${selectedCurrency})`}
            </button>
          )}
          {!canRequest && (!selectedBalance || selectedBalance.balance === 0) && (
            <span className="text-xs text-gray-400">Solde insuffisant en {selectedCurrency}</span>
          )}
        </div>
      )}

      {/* Request result */}
      {requestResult && (
        <div className={clsx(
          'p-4 rounded-xl border text-sm',
          requestResult.status === 'success'
            ? 'border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400'
            : 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400',
        )}>
          <div className="flex items-start gap-2">
            {requestResult.status === 'success'
              ? <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
              : <Clock size={18} className="flex-shrink-0 mt-0.5" />
            }
            <div>
              {requestResult.status === 'success' ? (
                <p>Règlement en cours — vous recevrez le paiement sous peu sur votre Mobile Money.</p>
              ) : requestResult.status === 'pending_admin_review' ? (
                <p>Votre demande dépasse le plafond automatique, elle est en cours de revue par notre équipe. Vous serez notifié une fois traitée.</p>
              ) : (
                <p>Statut : <strong>{requestResult.status}</strong></p>
              )}
              {requestResult.amount && (
                <p className="text-xs mt-1 opacity-70">
                  Montant : {fmt(requestResult.amount)} {requestResult.currency ?? selectedCurrency}
                </p>
              )}
              {requestResult.provider_ref && (
                <p className="text-xs mt-0.5 opacity-70">Référence : {requestResult.provider_ref}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History table */}
      <div>
        <h2 className="text-lg font-serif font-semibold text-gray-900 dark:text-text-primary mb-4">
          Historique des règlements
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-text-secondary/15 bg-white dark:bg-navy-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-text-secondary/15 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Montant</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Référence</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    Aucun règlement pour le moment.
                  </td>
                </tr>
              ) : (
                history.map((req) => {
                  const cfg = STATUS_CONFIG[req.status] ?? { label: req.status, icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-100' };
                  const Icon = cfg.icon;
                  const cur = req.currency ?? 'CDF';
                  return (
                    <tr key={req.id} className="border-b border-gray-50 dark:border-text-secondary/15/50 hover:bg-gray-50 dark:hover:bg-navy-panel/30">
                      <td className="px-4 py-3 text-gray-600 dark:text-text-primary whitespace-nowrap">{fmtDate(req.created_at)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-text-primary whitespace-nowrap">{fmt(req.amount)} {cur}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
                          <Icon size={10} className={req.status === 'processing' ? 'animate-spin' : ''} />
                          {cfg.label}
                        </span>
                        {req.reject_reason && (
                          <p className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={req.reject_reason}>
                            {req.reject_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {req.provider_ref ?? '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
