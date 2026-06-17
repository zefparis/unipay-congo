'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, PlusCircle, CheckCircle2, XCircle,
  Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface CryptoReceipt {
  id:                string;
  invoice_id:        string | null;
  invoice_reference: string | null;
  payer_name:        string | null;
  asset:             string;
  network:           string;
  amount:            string;
  tx_hash:           string;
  status:            string;
  notes:             string | null;
  created_at:        string;
}

const RECEIPT_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: 'text-yellow-400' },
  received:  { label: 'Reçu',        color: 'text-blue-400'   },
  confirmed: { label: 'Confirmé',    color: 'text-green-400'  },
  converted: { label: 'Converti',    color: 'text-purple-400' },
  rejected:  { label: 'Rejeté',      color: 'text-red-400'    },
};

function fmtDate(s: string) {
  return new Date(s).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function truncateTx(hash: string) {
  if (!hash || hash.length < 12) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

/* ── Empty form state ───────────────────────────────────────────────── */
const EMPTY_FORM = {
  invoice_reference: '',
  invoice_id:        '',
  payer_name:        '',
  asset:             'USDC' as 'USDC' | 'USDT',
  network:           'BSC'  as 'BSC' | 'ERC20' | 'TRC20',
  amount:            '',
  tx_hash:           '',
  wallet_address:    '',
  notes:             '',
};

type FormState = typeof EMPTY_FORM;

/* ── Component ──────────────────────────────────────────────────────── */

export default function CryptoReceiptsSection() {
  const [receipts,    setReceipts]    = useState<CryptoReceipt[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [listError,   setListError]   = useState('');

  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitRes,   setSubmitRes]   = useState<{ ok: boolean; msg: string } | null>(null);

  /* ── Filters ────────────────────────────────────────────────────── */
  const [filterAsset,  setFilterAsset]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  /* ── Load list ──────────────────────────────────────────────────── */
  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const params = new URLSearchParams();
      if (filterAsset)  params.set('asset',  filterAsset);
      if (filterStatus) params.set('status', filterStatus);
      params.set('limit', '100');

      const res  = await fetch(`/api/admin/treasury/crypto-receipts?${params}`, { cache: 'no-store' });
      const data = await res.json() as { data?: CryptoReceipt[]; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setReceipts(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setListError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filterAsset, filterStatus]);

  useEffect(() => { void loadReceipts(); }, [loadReceipts]);

  /* ── Submit new receipt ─────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitRes(null);
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        asset:   form.asset,
        network: form.network,
        amount:  parseFloat(form.amount),
        tx_hash: form.tx_hash.trim(),
      };
      if (form.invoice_reference.trim()) payload.invoice_reference = form.invoice_reference.trim();
      if (form.invoice_id.trim())        payload.invoice_id        = form.invoice_id.trim();
      if (form.payer_name.trim())        payload.payer_name        = form.payer_name.trim();
      if (form.wallet_address.trim())    payload.wallet_address    = form.wallet_address.trim();
      if (form.notes.trim())             payload.notes             = form.notes.trim();

      const res  = await fetch('/api/admin/treasury/crypto-receipts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string; message?: string };

      if (!res.ok) {
        setSubmitRes({ ok: false, msg: data.message ?? data.error ?? `Erreur ${res.status}` });
        return;
      }

      setSubmitRes({ ok: true, msg: 'Paiement enregistré avec succès.' });
      setForm(EMPTY_FORM);
      setShowForm(false);
      void loadReceipts();
    } catch (e) {
      setSubmitRes({ ok: false, msg: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (k: keyof FormState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <section className="space-y-4">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <FileText size={14} className="text-purple-400" />
          Paiements factures crypto
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadReceipts()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <RefreshCw size={12} className={clsx(loading && 'animate-spin')} />
            Actualiser
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); setSubmitRes(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition"
          >
            <PlusCircle size={12} />
            {showForm ? 'Fermer' : 'Nouveau paiement'}
          </button>
        </div>
      </div>

      {/* ── Add form ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white dark:bg-[#0e1428] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Enregistrer un paiement reçu
          </h3>

          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">

            {/* Row 1 — invoice ref + invoice id */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Référence facture *
                </label>
                <input
                  type="text"
                  required
                  value={form.invoice_reference}
                  onChange={(e) => setField('invoice_reference', e.target.value)}
                  placeholder="FAC-2026-001"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  ID facture interne
                </label>
                <input
                  type="text"
                  value={form.invoice_id}
                  onChange={(e) => setField('invoice_id', e.target.value)}
                  placeholder="INV-123"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Row 2 — payer */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Payeur
              </label>
              <input
                type="text"
                value={form.payer_name}
                onChange={(e) => setField('payer_name', e.target.value)}
                placeholder="Acme Marketing Ltd"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Row 3 — asset + network + amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Asset *
                </label>
                <select
                  value={form.asset}
                  onChange={(e) => setField('asset', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Réseau *
                </label>
                <select
                  value={form.network}
                  onChange={(e) => setField('network', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="BSC">BSC (BEP-20)</option>
                  <option value="ERC20">ERC20 (Ethereum)</option>
                  <option value="TRC20">TRC20 (Tron)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Montant *
                </label>
                <input
                  type="number"
                  required
                  min="0.000001"
                  step="0.000001"
                  value={form.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Row 4 — tx_hash */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Hash de transaction (tx_hash) *
              </label>
              <input
                type="text"
                required
                value={form.tx_hash}
                onChange={(e) => setField('tx_hash', e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Row 5 — wallet_address (optional) */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Adresse wallet source (optionnel)
              </label>
              <input
                type="text"
                value={form.wallet_address}
                onChange={(e) => setField('wallet_address', e.target.value)}
                placeholder="0x... / T..."
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Row 6 — notes */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Ex : Paiement facture marketing campagne Q2 2026"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Result feedback */}
            {submitRes && (
              <div className={clsx(
                'flex items-start gap-2 p-3 rounded-xl text-sm',
                submitRes.ok
                  ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300',
              )}>
                {submitRes.ok
                  ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  : <XCircle size={15} className="mt-0.5 shrink-0" />}
                <span>{submitRes.msg}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Enregistrement…' : 'Enregistrer le paiement'}
            </button>
          </form>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterAsset}
          onChange={(e) => setFilterAsset(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Tous les assets</option>
          <option value="USDC">USDC</option>
          <option value="USDT">USDT</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Tous les statuts</option>
          <option value="received">Reçu</option>
          <option value="confirmed">Confirmé</option>
          <option value="pending">En attente</option>
          <option value="converted">Converti</option>
          <option value="rejected">Rejeté</option>
        </select>
        {total > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {total} paiement{total > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0e1428] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm p-5">
            <Loader2 size={14} className="animate-spin" /> Chargement…
          </div>
        ) : listError ? (
          <div className="flex items-center gap-2 text-red-400 text-sm p-5">
            <AlertCircle size={14} /> {listError}
          </div>
        ) : receipts.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Aucun paiement enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Date', 'Référence', 'Payeur', 'Asset', 'Réseau', 'Montant', 'Tx Hash', 'Statut'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipts.map((row) => {
                  const s = RECEIPT_STATUS[row.status] ?? { label: row.status, color: 'text-gray-400' };
                  return (
                    <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                        {fmtDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        <span className="font-medium">{row.invoice_reference ?? '—'}</span>
                        {row.invoice_id && (
                          <span className="block text-xs text-gray-400 dark:text-gray-500">{row.invoice_id}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {row.payer_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={clsx(
                          'px-2 py-0.5 rounded-md text-xs font-bold',
                          row.asset === 'USDC'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
                        )}>
                          {row.asset}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300">
                          {row.network}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {parseFloat(row.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        <span className="text-xs font-normal text-gray-400 ml-1">{row.asset}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap" title={row.tx_hash}>
                        {truncateTx(row.tx_hash)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={clsx('text-xs font-medium', s.color)}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
