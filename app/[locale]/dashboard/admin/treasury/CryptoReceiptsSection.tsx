'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, PlusCircle, CheckCircle2, XCircle,
  Loader2, RefreshCw, AlertCircle, Copy, Check,
  ChevronDown, ChevronUp, ShieldCheck, Zap,
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
  expected_amount:   string | null;
  received_amount:   string | null;
  receiving_address: string | null;
  tx_hash:           string | null;
  status:            string;
  receipt_kind:      string | null;
  notes:             string | null;
  created_by:        string | null;
  received_at:       string | null;
  confirmed_at:      string | null;
  created_at:        string;
  updated_at:        string;
}

/* ── Status config ──────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  received:  { label: 'Reçu',       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30'    },
  confirmed: { label: 'Confirmé',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30'  },
  converted: { label: 'Converti',   color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30'},
  rejected:  { label: 'Rejeté',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30'      },
  cancelled: { label: 'Annulé',     color: 'text-gray-400',   bg: 'bg-gray-500/10 border-gray-500/30'    },
};

const NETWORK_OPTS = ['BSC', 'ERC20', 'TRC20', 'Polygon', 'Base', 'Arbitrum'];
const ASSET_OPTS   = ['USDC', 'USDT'];

/* ── Helpers ────────────────────────────────────────────────────────── */
function fmtDate(s: string) {
  return new Date(s).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
function fmtAmt(v: string | null | undefined): string {
  if (!v) return '—';
  const n = parseFloat(v);
  return isNaN(n) ? '—' : n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function truncate(s: string | null, head = 10, tail = 6): string {
  if (!s) return '—';
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

/* ── CopyBtn ─────────────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={() => void copy()} className="ml-1 inline-flex items-center text-gray-400 hover:text-purple-400 transition" title="Copier">
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  );
}

/* ── Feedback banner ─────────────────────────────────────────────────── */
function Feedback({ res }: { res: { ok: boolean; msg: string } | null }) {
  if (!res) return null;
  return (
    <div className={clsx('flex items-start gap-2 p-3 rounded-xl text-sm border', res.ok
      ? 'bg-green-500/10 border-green-500/30 text-green-300'
      : 'bg-red-500/10 border-red-500/30 text-red-300',
    )}>
      {res.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <XCircle size={14} className="mt-0.5 shrink-0" />}
      <span>{res.msg}</span>
    </div>
  );
}

/* ── Input / select helpers ──────────────────────────────────────────── */
const inputCls = 'w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500';
const selCls   = inputCls;

/* ── Create form state ───────────────────────────────────────────────── */
const EMPTY_CREATE = {
  invoice_reference: '',
  invoice_id:        '',
  payer_name:        '',
  asset:             'USDC',
  network:           'BSC',
  expected_amount:   '',
  receiving_address: '',
  notes:             '',
  receipt_kind:      'invoice_payment',
};

type CreateForm = typeof EMPTY_CREATE;

/* ── Treasury wallet (for auto-fill selector) ───────────────────────── */
interface TreasuryWallet {
  id:        string;
  label:     string;
  asset:     string;
  network:   string;
  address:   string;
  is_active: boolean;
}

const PREDICTSTREET: Partial<CreateForm> = {
  invoice_reference: 'FAC-2026-001',
  payer_name:        'PredictStreet / ADI Foundation',
  asset:             'USDC',
  network:           'BSC',
  expected_amount:   '116000',
  notes:             'PredictStreet x Congo Gaming DRC Market Launch payment',
};

/* ═══════════════════════════════════════════════════════════════════════
 * Main component
 * ═══════════════════════════════════════════════════════════════════════ */
export default function CryptoReceiptsSection() {
  /* ── List state ─────────────────────────────────────────────────── */
  const [receipts,  setReceipts]  = useState<CryptoReceipt[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [listError, setListError] = useState('');

  /* ── Filters ────────────────────────────────────────────────────── */
  const [fAsset,   setFAsset]   = useState('');
  const [fNetwork, setFNetwork] = useState('');
  const [fStatus,  setFStatus]  = useState('');
  const [fPayer,   setFPayer]   = useState('');
  const [fRef,     setFRef]     = useState('');

  /* ── Create form ────────────────────────────────────────────────── */
  const [showCreate,      setShowCreate]      = useState(false);
  const [cForm,           setCForm]           = useState<CreateForm>(EMPTY_CREATE);
  const [creating,        setCreating]        = useState(false);
  const [createRes,       setCreateRes]       = useState<{ ok: boolean; msg: string } | null>(null);
  const [treasuryWallets, setTreasuryWallets] = useState<TreasuryWallet[]>([]);
  const [selectedWallet,  setSelectedWallet]  = useState('');

  /* ── Row edit ────────────────────────────────────────────────────── */
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [editTxHash,  setEditTxHash]  = useState('');
  const [editRecvAmt, setEditRecvAmt] = useState('');
  const [actionBusy,    setActionBusy]    = useState(false);
  const [actionRes,     setActionRes]     = useState<{ ok: boolean; msg: string } | null>(null);
  const [verifyRes,     setVerifyRes]     = useState<Record<string, unknown> | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  /* ── Load list ──────────────────────────────────────────────────── */
  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (fAsset)   p.set('asset',             fAsset);
      if (fNetwork) p.set('network',           fNetwork);
      if (fStatus)  p.set('status',            fStatus);
      if (fPayer)   p.set('payer_name',        fPayer);
      if (fRef)     p.set('invoice_reference', fRef);

      const res  = await fetch(`/api/admin/treasury/crypto-receipts?${p}`, { cache: 'no-store' });
      const data = await res.json() as { data?: CryptoReceipt[]; total?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setReceipts(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setListError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fAsset, fNetwork, fStatus, fPayer, fRef]);

  useEffect(() => { void loadReceipts(); }, [loadReceipts]);

  useEffect(() => {
    if (!showCreate) return;
    fetch('/api/admin/treasury/crypto-wallets', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: { data?: TreasuryWallet[] }) => setTreasuryWallets(j.data ?? []))
      .catch(() => {});
  }, [showCreate]);

  /* ── Expand row ─────────────────────────────────────────────────── */
  const expand = (row: CryptoReceipt) => {
    if (expandedId === row.id) { setExpandedId(null); return; }
    setExpandedId(row.id);
    setEditTxHash(row.tx_hash ?? '');
    setEditRecvAmt(row.received_amount ? parseFloat(row.received_amount).toString() : '');
    setActionRes(null);
    setVerifyRes(null);
    setOverrideReason('');
  };

  /* ── Create pending receipt ─────────────────────────────────────── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateRes(null);
    setCreating(true);
    try {
      const isReg = cForm.receipt_kind === 'internal_regularization';

      if (isReg && cForm.notes.trim().length < 20) {
        setCreateRes({ ok: false, msg: 'Les notes doivent faire au moins 20 caractères pour une régularisation.' });
        return;
      }

      const body: Record<string, unknown> = {
        asset:             cForm.asset,
        network:           cForm.network,
        expected_amount:   parseFloat(cForm.expected_amount),
        receiving_address: cForm.receiving_address.trim(),
        receipt_kind:      cForm.receipt_kind,
      };
      if (cForm.invoice_reference.trim()) body.invoice_reference = cForm.invoice_reference.trim();
      if (cForm.invoice_id.trim())        body.invoice_id        = cForm.invoice_id.trim();
      if (cForm.payer_name.trim())        body.payer_name        = cForm.payer_name.trim();
      if (cForm.notes.trim())             body.notes             = cForm.notes.trim();
      if (isReg) {
        body.status          = 'confirmed';
        body.received_amount = parseFloat(cForm.expected_amount);
      }

      const res  = await fetch('/api/admin/treasury/crypto-receipts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: string; message?: string };
      if (!res.ok) { setCreateRes({ ok: false, msg: data.message ?? data.error ?? `Erreur ${res.status}` }); return; }
      setCreateRes({ ok: true, msg: isReg ? 'Régularisation confirmée créée.' : 'Reçu en attente créé.' });
      setCForm(EMPTY_CREATE);
      setShowCreate(false);
      void loadReceipts();
    } catch (e) {
      setCreateRes({ ok: false, msg: (e as Error).message });
    } finally {
      setCreating(false);
    }
  };

  /* ── PATCH helper ───────────────────────────────────────────────── */
  const patch = async (id: string, body: Record<string, unknown>): Promise<boolean> => {
    const res  = await fetch(`/api/admin/treasury/crypto-receipts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json() as { error?: string; message?: string; success?: boolean };
    if (!res.ok) { setActionRes({ ok: false, msg: data.message ?? data.error ?? `Erreur ${res.status}` }); return false; }
    return true;
  };

  /* ── Save tx_hash + received_amount ─────────────────────────────── */
  const handleSaveEdit = async (row: CryptoReceipt) => {
    setActionBusy(true); setActionRes(null);
    try {
      const body: Record<string, unknown> = {};
      if (editTxHash.trim()  && editTxHash.trim()  !== (row.tx_hash ?? ''))                     body.tx_hash        = editTxHash.trim();
      if (editRecvAmt.trim() && editRecvAmt.trim()  !== (row.received_amount ? parseFloat(row.received_amount).toString() : '')) body.received_amount = parseFloat(editRecvAmt);
      if (Object.keys(body).length === 0) { setActionRes({ ok: false, msg: 'Aucune modification.' }); return; }
      const ok = await patch(row.id, body);
      if (ok) { setActionRes({ ok: true, msg: 'Sauvegardé.' }); void loadReceipts(); }
    } finally { setActionBusy(false); }
  };

  /* ── Status action ───────────────────────────────────────────────── */
  const handleStatus = async (row: CryptoReceipt, newStatus: string) => {
    setActionBusy(true); setActionRes(null);
    try {
      const isReg = row.receipt_kind === 'internal_regularization';
      const body: Record<string, unknown> = { status: newStatus };
      if (!isReg && editTxHash.trim()) body.tx_hash        = editTxHash.trim();
      if (editRecvAmt.trim())          body.received_amount = parseFloat(editRecvAmt);
      if (overrideReason.trim())       body.override_reason = overrideReason.trim();
      const ok = await patch(row.id, body);
      if (ok) {
        setActionRes({ ok: true, msg: `Statut → ${newStatus}` });
        setOverrideReason('');
        setVerifyRes(null);
        void loadReceipts();
      }
    } finally { setActionBusy(false); }
  };

  /* ── Cancel ──────────────────────────────────────────────────────── */
  const handleCancel = async (id: string) => {
    setActionBusy(true); setActionRes(null);
    try {
      const res  = await fetch(`/api/admin/treasury/crypto-receipts/${id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      });
      const data = await res.json() as { error?: string; message?: string };
      if (!res.ok) { setActionRes({ ok: false, msg: data.message ?? data.error ?? `Erreur ${res.status}` }); return; }
      setActionRes({ ok: true, msg: 'Reçu annulé.' });
      setExpandedId(null);
      void loadReceipts();
    } finally { setActionBusy(false); }
  };

  /* ── Verify on BSCScan ───────────────────────────────────────────── */
  const handleVerify = async (id: string) => {
    setActionBusy(true); setVerifyRes(null); setActionRes(null);
    try {
      const res  = await fetch(`/api/admin/treasury/crypto-receipts/${id}/verify`, { method: 'POST' });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setActionRes({ ok: false, msg: (data.message as string) ?? `Erreur ${res.status}` }); return; }
      setVerifyRes(data);
    } finally { setActionBusy(false); }
  };

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <section className="space-y-4">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <FileText size={14} className="text-purple-400" />
          Reçus crypto — factures
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => void loadReceipts()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <RefreshCw size={12} className={clsx(loading && 'animate-spin')} /> Actualiser
          </button>
          <button onClick={() => { setShowCreate((v) => !v); setCreateRes(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition">
            <PlusCircle size={12} />
            {showCreate ? 'Fermer' : 'Nouveau reçu en attente'}
          </button>
        </div>
      </div>

      {/* ── Create form ────────────────────────────────────────────── */}
      {showCreate && (
        <div className="bg-white dark:bg-[#0e1428] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Créer un reçu en attente</h3>
            <button
              type="button"
              onClick={() => setCForm({ ...EMPTY_CREATE, ...PREDICTSTREET } as CreateForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold border border-yellow-500/30 transition"
            >
              <Zap size={11} /> Préfill PredictStreet 116k
            </button>
          </div>

          <form onSubmit={(e) => { void handleCreate(e); }} className="space-y-4">
            {/* Receipt kind selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type d&apos;entrée *</label>
              <select value={cForm.receipt_kind} onChange={(e) => setCForm(f => ({ ...f, receipt_kind: e.target.value }))} className={selCls}>
                <option value="invoice_payment">Paiement facture</option>
                <option value="test_payment">Paiement test</option>
                <option value="internal_regularization">Régularisation interne</option>
              </select>
            </div>

            {/* Regularization warning */}
            {cForm.receipt_kind === 'internal_regularization' && (
              <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Régularisation comptable uniquement.</strong> Cette opération ne correspond pas à une nouvelle transaction blockchain.
                  Elle sert uniquement à rapprocher le solde on-chain et le solde comptable UniPay.
                  Les notes doivent décrire précisément le motif (minimum 20 caractères).
                </span>
              </div>
            )}

            {/* Wallet selector */}
            {treasuryWallets.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Wallet treasury (optionnel — auto-remplit adresse/asset/réseau)
                </label>
                <select
                  value={selectedWallet}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedWallet(id);
                    if (!id) return;
                    const w = treasuryWallets.find((x) => x.id === id);
                    if (w) setCForm((f) => ({ ...f, receiving_address: w.address, asset: w.asset, network: w.network }));
                  }}
                  className={selCls}
                >
                  <option value="">— Sélectionner un wallet treasury —</option>
                  {treasuryWallets.filter((w) => w.is_active).map((w) => (
                    <option key={w.id} value={w.id}>{w.label} ({w.asset}/{w.network})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Référence facture *</label>
                <input type="text" required value={cForm.invoice_reference} onChange={(e) => setCForm(f => ({ ...f, invoice_reference: e.target.value }))}
                  placeholder="FAC-2026-001" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Payeur *</label>
                <input type="text" required value={cForm.payer_name} onChange={(e) => setCForm(f => ({ ...f, payer_name: e.target.value }))}
                  placeholder="PredictStreet / ADI Foundation" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Asset *</label>
                <select value={cForm.asset} onChange={(e) => setCForm(f => ({ ...f, asset: e.target.value }))} className={selCls}>
                  {ASSET_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Réseau *</label>
                <select value={cForm.network} onChange={(e) => setCForm(f => ({ ...f, network: e.target.value }))} className={selCls}>
                  {NETWORK_OPTS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{cForm.receipt_kind === 'internal_regularization' ? 'Montant à régulariser *' : 'Montant attendu *'}</label>
                <input type="number" required min="0.01" step="0.01" value={cForm.expected_amount}
                  onChange={(e) => setCForm(f => ({ ...f, expected_amount: e.target.value }))}
                  placeholder="116000" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Adresse de réception * <span className="text-gray-400 font-normal">(votre adresse treasury)</span></label>
              <input type="text" required value={cForm.receiving_address} onChange={(e) => setCForm(f => ({ ...f, receiving_address: e.target.value }))}
                placeholder="0x... (EVM) ou Txxx... (TRC20)" className={clsx(inputCls, 'font-mono')} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
              <textarea rows={2} value={cForm.notes} onChange={(e) => setCForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={cForm.receipt_kind === 'internal_regularization'
                  ? 'Motif de régularisation (obligatoire, min. 20 caractères)…'
                  : 'Ex : PredictStreet x Congo Gaming DRC Market Launch payment'}
                className={clsx(inputCls, 'resize-none')} />
              {cForm.receipt_kind === 'internal_regularization' && cForm.notes.trim().length > 0 && cForm.notes.trim().length < 20 && (
                <p className="text-xs text-red-400 mt-0.5">{cForm.notes.trim().length}/20 caractères minimum</p>
              )}
            </div>

            <Feedback res={createRes} />

            <button type="submit" disabled={creating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition disabled:opacity-50">
              {creating && <Loader2 size={14} className="animate-spin" />}
              {creating
                ? 'Création…'
                : cForm.receipt_kind === 'internal_regularization'
                  ? 'Créer la régularisation confirmée'
                  : 'Créer le reçu en attente'}
            </button>
          </form>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={fAsset}   onChange={(e) => setFAsset(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500">
          <option value="">Tous les assets</option>
          {ASSET_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={fNetwork} onChange={(e) => setFNetwork(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500">
          <option value="">Tous les réseaux</option>
          {NETWORK_OPTS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={fStatus}  onChange={(e) => setFStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input value={fPayer} onChange={(e) => setFPayer(e.target.value)} placeholder="Payeur…"
          className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 w-36" />
        <input value={fRef}   onChange={(e) => setFRef(e.target.value)}   placeholder="Référence…"
          className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 w-36" />
        {total > 0 && (
          <span className="text-xs text-gray-400 ml-auto">{total} reçu{total > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0e1428] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm p-5"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
        ) : listError ? (
          <div className="flex items-center gap-2 text-red-400 text-sm p-5"><AlertCircle size={14} /> {listError}</div>
        ) : receipts.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">Aucun reçu enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['', 'Date', 'Référence / Payeur', 'Asset', 'Attendu', 'Reçu', 'Adresse réception', 'Tx Hash', 'Statut'].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receipts.map((row) => {
                  const s        = STATUS_CFG[row.status] ?? { label: row.status, color: 'text-gray-400', bg: '' };
                  const isOpen   = expandedId === row.id;
                  const expected = parseFloat(row.expected_amount ?? row.amount ?? '0');
                  return (
                    <>
                      <tr key={row.id}
                        onClick={() => expand(row)}
                        className="border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition cursor-pointer">
                        <td className="pl-3 pr-1 py-3 text-gray-400">
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{fmtDate(row.created_at)}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <p className="font-medium text-gray-800 dark:text-gray-200">{row.invoice_reference ?? '—'}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{row.payer_name ?? '—'}</p>
                          {row.receipt_kind === 'internal_regularization' && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 text-[10px] font-semibold">
                              Régularisation
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={clsx('px-2 py-0.5 rounded-md text-xs font-bold',
                            row.asset === 'USDC'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
                          )}>
                            {row.asset} <span className="font-normal opacity-70">{row.network}</span>
                          </span>
                        </td>
                        <td className="px-3 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {isNaN(expected) ? '—' : expected.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {fmtAmt(row.received_amount)}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {row.receiving_address
                            ? <span title={row.receiving_address}>{truncate(row.receiving_address)}</span>
                            : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {row.tx_hash
                            ? <span title={row.tx_hash}>{truncate(row.tx_hash)}</span>
                            : <span className="text-gray-300 dark:text-gray-600 italic">en attente</span>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', s.bg, s.color)}>
                            {s.label}
                          </span>
                        </td>
                      </tr>

                      {/* ── Edit panel ───────────────────────────────── */}
                      {isOpen && (
                        <tr key={`${row.id}-edit`} className="bg-gray-50/70 dark:bg-gray-900/40 border-b border-purple-200 dark:border-purple-800/50">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="space-y-4">

                              {/* Info row */}
                              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {row.receiving_address && (
                                  <span className="flex items-center gap-1 font-mono">
                                    Adresse : <span className="text-gray-700 dark:text-gray-200">{row.receiving_address}</span>
                                    <CopyBtn text={row.receiving_address} />
                                  </span>
                                )}
                                {row.tx_hash && (
                                  <span className="flex items-center gap-1 font-mono">
                                    Tx : <span className="text-gray-700 dark:text-gray-200">{row.tx_hash}</span>
                                    <CopyBtn text={row.tx_hash} />
                                  </span>
                                )}
                                {row.notes && <span>Notes : {row.notes}</span>}
                              </div>

                              {/* Edit fields (tx_hash + received_amount) */}
                              {!['confirmed', 'cancelled'].includes(row.status) && (
                                <div className="flex flex-wrap gap-3 items-end">
                                  {row.receipt_kind !== 'internal_regularization' && (
                                    <div className="flex-1 min-w-48">
                                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tx Hash</label>
                                      <input type="text" value={editTxHash} onChange={(e) => setEditTxHash(e.target.value)}
                                        placeholder="0x… (66 chars)" className={clsx(inputCls, 'font-mono text-xs')} />
                                    </div>
                                  )}
                                  <div className="w-40">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Montant reçu</label>
                                    <input type="number" min="0" step="0.01" value={editRecvAmt} onChange={(e) => setEditRecvAmt(e.target.value)}
                                      placeholder={fmtAmt(row.expected_amount)} className={inputCls} />
                                  </div>
                                  <button onClick={() => void handleSaveEdit(row)} disabled={actionBusy}
                                    className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-200 transition disabled:opacity-50">
                                    {actionBusy ? <Loader2 size={12} className="animate-spin" /> : 'Sauvegarder'}
                                  </button>
                                </div>
                              )}

                              {/* ── Verify failure warning + override input ─── */}
                              {verifyRes && !(verifyRes.verified as boolean) && (
                                <div className="p-3 rounded-xl text-xs border bg-red-500/10 border-red-500/30 text-red-300 space-y-2">
                                  <p className="font-semibold flex items-center gap-1">
                                    <XCircle size={13} className="shrink-0" />
                                    Vérification échouée — Confirmation bloquée
                                  </p>
                                  <p>Raison : {verifyRes.reason as string}</p>
                                  {(verifyRes.blocking_reasons as string[])?.map((r) => (
                                    <span key={r} className="inline-block mr-1 px-1.5 py-0.5 rounded bg-red-900/40 border border-red-700/40 font-mono">{r}</span>
                                  ))}
                                  <div className="pt-1">
                                    <label className="block text-xs font-medium text-red-300/80 mb-1">
                                      Motif de dérogation (obligatoire pour forcer la confirmation)
                                    </label>
                                    <input
                                      type="text"
                                      value={overrideReason}
                                      onChange={(e) => setOverrideReason(e.target.value)}
                                      placeholder="Ex : Virement partiel accepté par direction"
                                      className="w-full px-3 py-1.5 rounded-xl bg-gray-900 border border-red-700/40 text-xs text-white placeholder-red-300/40 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Status action buttons */}
                              <div className="flex flex-wrap gap-2">
                                {row.status === 'pending' && row.receipt_kind !== 'internal_regularization' && (
                                  <button onClick={() => void handleStatus(row, 'received')} disabled={actionBusy || !editTxHash.trim()}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed">
                                    ✓ Marquer reçu
                                  </button>
                                )}
                                {(row.status === 'pending' || row.status === 'received') && (() => {
                                  const verifyBlocking = !!verifyRes && !(verifyRes.verified as boolean);
                                  const needsOverride  = verifyBlocking && !overrideReason.trim();
                                  return (
                                    <button
                                      onClick={() => void handleStatus(row, 'confirmed')}
                                      disabled={actionBusy || (row.receipt_kind !== 'internal_regularization' && !editTxHash.trim()) || needsOverride}
                                      title={needsOverride ? 'Vérification échouée — saisir un motif de dérogation' : undefined}
                                      className={clsx(
                                        'px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed',
                                        verifyBlocking && overrideReason.trim()
                                          ? 'bg-orange-600 hover:bg-orange-500'
                                          : 'bg-green-600 hover:bg-green-500',
                                      )}
                                    >
                                      <CheckCircle2 size={12} className="inline mr-1" />
                                      {verifyBlocking && overrideReason.trim() ? 'Confirmer (dérogation)' : 'Confirmer'}
                                    </button>
                                  );
                                })()}
                              
                                {(row.status === 'pending' || row.status === 'received') && (
                                  <button onClick={() => void handleStatus(row, 'rejected')} disabled={actionBusy}
                                    className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-300 text-xs font-semibold border border-red-700/40 transition disabled:opacity-40">
                                    Rejeter
                                  </button>
                                )}
                                {!['confirmed', 'cancelled'].includes(row.status) && (
                                  <button onClick={() => void handleCancel(row.id)} disabled={actionBusy}
                                    className="px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-gray-600/40 transition disabled:opacity-40">
                                    <XCircle size={12} className="inline mr-1" />Annuler
                                  </button>
                                )}
                                {row.tx_hash && row.network === 'BSC' && row.receipt_kind !== 'internal_regularization' && (
                                  <button onClick={() => void handleVerify(row.id)} disabled={actionBusy}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 text-xs font-semibold border border-purple-700/40 transition disabled:opacity-40">
                                    <ShieldCheck size={12} />Vérifier BSC
                                  </button>
                                )}
                              </div>

                              {/* Verify result — OK panel only (fail panel is shown above action buttons) */}
                              {verifyRes && (verifyRes.verified as boolean) && (
                                <div className="p-3 rounded-xl text-xs border bg-green-500/10 border-green-500/30 text-green-300 space-y-1">
                                  <p className="font-semibold flex items-center gap-1">
                                    <CheckCircle2 size={13} className="shrink-0" /> Vérification BSC OK
                                  </p>
                                  <p>Montant on-chain : <strong>{String(verifyRes.transferred_amount)} {verifyRes.asset as string}</strong> — Attendu : {String(verifyRes.expected_amount)}</p>
                                  <p>Destinataire : ✓ — Contrat {verifyRes.asset as string} : ✓ — Tx réussie : ✓</p>
                                </div>
                              )}

                              <Feedback res={actionRes} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
