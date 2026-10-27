'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Handshake, Copy, Check, Share2, RefreshCw, Loader2,
  AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
} from 'lucide-react';
import clsx from 'clsx';

interface PartnerInfo {
  is_partner: boolean;
  partner_code: string | null;
  referral_url: string | null;
  partner_rate: number;
  referred_by: { merchant_id: string; name: string } | null;
}

interface ClientRow {
  id: string;
  name: string;
  registered_at: string;
  kyc_status: string;
  status: string;
  success_volume: Record<string, number>;
}

interface CommissionRow {
  id: string;
  sub_merchant_id: string;
  sub_merchant_name: string | null;
  transaction_id: string;
  currency: string;
  transaction_amount: number;
  rate: number;
  commission_amount: number;
  status: 'credited' | 'reversed';
  created_at: string;
  reversed_at: string | null;
  reverse_reason: string | null;
}

interface Pagination { page: number; limit: number; total: number; pages: number }

const KYC_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function fmt(n: number | undefined | null) {
  const num = Number(n ?? NaN);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PartnerPage() {
  const [info, setInfo] = useState<PartnerInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [copied, setCopied] = useState(false);

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientsPage, setClientsPage] = useState<Pagination | null>(null);
  const [clientsPageNum, setClientsPageNum] = useState(1);

  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [commPage, setCommPage] = useState<Pagination | null>(null);
  const [commPageNum, setCommPageNum] = useState(1);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [loading, setLoading] = useState(true);

  const loadInfo = useCallback(async () => {
    const res = await fetch('/api/merchant/partner', { cache: 'no-store' });
    if (!res.ok) throw new Error('partner-info');
    const d = (await res.json()) as PartnerInfo;
    setInfo(d);
    return d;
  }, []);

  const loadClients = useCallback(async (page: number) => {
    const res = await fetch(`/api/merchant/partner/clients?page=${page}&limit=10`, { cache: 'no-store' });
    if (!res.ok) return;
    const d = (await res.json()) as { data?: ClientRow[]; pagination?: Pagination };
    setClients(d.data ?? []);
    setClientsPage(d.pagination ?? null);
  }, []);

  const loadCommissions = useCallback(async (page: number, from: string, to: string) => {
    const p = new URLSearchParams({ page: String(page), limit: '10' });
    if (from) p.set('date_from', new Date(from).toISOString());
    if (to) p.set('date_to', new Date(`${to}T23:59:59`).toISOString());
    const res = await fetch(`/api/merchant/partner/commissions?${p}`, { cache: 'no-store' });
    if (!res.ok) return;
    const d = (await res.json()) as { data?: CommissionRow[]; totals?: Record<string, number>; pagination?: Pagination };
    setCommissions(d.data ?? []);
    setTotals(d.totals ?? {});
    setCommPage(d.pagination ?? null);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const d = await loadInfo();
      if (d.is_partner) {
        await Promise.all([loadClients(clientsPageNum), loadCommissions(commPageNum, dateFrom, dateTo)]);
      }
    } catch {
      setLoadError("Impossible de charger le programme partenaire.");
    } finally {
      setLoading(false);
    }
  }, [loadInfo, loadClients, loadCommissions, clientsPageNum, commPageNum, dateFrom, dateTo]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const copyLink = async () => {
    if (!info?.referral_url) return;
    try {
      await navigator.clipboard.writeText(info.referral_url);
    } catch {
      // Clipboard unavailable (non-secure context) — fallback prompt is
      // unnecessary noise; the link stays visible and selectable.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappUrl = info?.referral_url
    ? `https://wa.me/?text=${encodeURIComponent(`Rejoignez UniPay Congo via mon lien de parrainage : ${info.referral_url}`)}`
    : null;

  const applyPeriod = () => {
    setCommPageNum(1);
    void loadCommissions(1, dateFrom, dateTo);
  };

  if (loading && !info) {
    return <div className="max-w-5xl mx-auto"><div className="p-6 rounded-2xl bg-gray-100 dark:bg-navy-panel animate-pulse h-40" /></div>;
  }

  if (loadError) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={18} /> {loadError}
          <button onClick={() => void loadAll()} className="ml-auto underline">Réessayer</button>
        </div>
      </div>
    );
  }

  if (info && !info.is_partner) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary mb-4">Programme partenaire</h1>
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 text-sm text-gray-500 dark:text-text-secondary">
          Votre compte n’est pas encore activé comme partenaire. Contactez le support UniPay pour rejoindre le programme et obtenir votre lien de parrainage.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
            <Handshake size={22} className="text-green-deep" /> Programme partenaire
          </h1>
          <p className="text-sm text-gray-500 dark:text-text-secondary mt-1">
            Parrainez des marchands et touchez une commission sur leurs transactions réussies.
          </p>
        </div>
        <button
          onClick={() => void loadAll()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* Referral link + rate */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15">
          <p className="text-xs font-semibold text-gray-500 dark:text-text-secondary uppercase tracking-wider mb-2">Votre lien de parrainage</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-800 dark:text-text-primary bg-gray-50 dark:bg-navy border border-gray-200 dark:border-text-secondary/20 rounded-xl px-4 py-2.5 break-all select-all">
              {info?.referral_url ?? '—'}
            </code>
            <button
              onClick={() => void copyLink()}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-text-secondary/20 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-panel transition-colors"
              title="Copier le lien"
            >
              {copied ? <Check size={16} className="text-green-deep" /> : <Copy size={16} />}
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-green-deep/10 text-green-deep hover:bg-green-deep/20 transition-colors"
                title="Partager sur WhatsApp"
              >
                <Share2 size={16} />
              </a>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-text-secondary/60 mt-3">
            Les commissions sont créditées sur votre solde UniPay et se retirent via le règlement habituel.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-signal to-[#0f6b4f] text-white shadow-lg min-w-[180px]">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">Taux de commission</p>
          <p className="text-3xl font-serif font-bold">{((info?.partner_rate ?? 0) * 100).toFixed(1).replace('.', ',')} %</p>
          <p className="text-xs text-white/60 mt-1">par transaction réussie</p>
        </div>
      </div>

      {/* Clients */}
      <div>
        <h2 className="text-lg font-serif font-semibold text-gray-900 dark:text-text-primary mb-4">Vos clients</h2>
        <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl overflow-hidden shadow-sm">
          {clients.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 dark:text-text-secondary/50">
              Aucun client parrainé pour le moment. Partagez votre lien pour commencer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                    {['Marchand', 'Inscription', 'KYC', 'Volume réussi'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-text-primary">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-text-secondary whitespace-nowrap">{fmtDate(c.registered_at)}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', KYC_STYLES[c.kyc_status] ?? 'bg-gray-100 text-gray-600')}>
                          {c.kyc_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-text-primary whitespace-nowrap">
                        {Object.keys(c.success_volume ?? {}).length === 0 ? '—' : (
                          <span className="space-x-3">
                            {Object.entries(c.success_volume).map(([cur, amt]) => (
                              <span key={cur}>{fmt(amt)} <span className="text-xs text-gray-400">{cur}</span></span>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {clientsPage && clientsPage.pages > 1 && (
          <div className="flex items-center justify-between mt-3 text-xs sm:text-sm text-gray-600 dark:text-text-secondary">
            <span>Page {clientsPage.page} / {clientsPage.pages} — {clientsPage.total} clients</span>
            <div className="flex gap-2">
              <button disabled={clientsPageNum <= 1} onClick={() => { const p = clientsPageNum - 1; setClientsPageNum(p); void loadClients(p); }} className="p-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button disabled={clientsPageNum >= clientsPage.pages} onClick={() => { const p = clientsPageNum + 1; setClientsPageNum(p); void loadClients(p); }} className="p-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Commissions */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-serif font-semibold text-gray-900 dark:text-text-primary">Vos commissions</h2>
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-gray-900 dark:text-text-primary" />
            <span className="text-gray-400">→</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 bg-white dark:bg-navy-panel text-gray-900 dark:text-text-primary" />
            <button onClick={applyPeriod} className="px-3 py-1.5 rounded-lg bg-green-deep text-white text-xs font-semibold hover:bg-green-deep/85 transition-colors">Filtrer</button>
          </div>
        </div>

        {/* Totals per currency */}
        <div className="flex flex-wrap gap-3 mb-4">
          {['CDF', 'USD', 'USDT'].map((cur) => (
            <div key={cur} className="px-4 py-3 rounded-xl bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15">
              <p className="text-xs text-gray-400 dark:text-text-secondary/60 uppercase tracking-wider">{cur}</p>
              <p className={clsx('text-lg font-serif font-bold', (totals[cur] ?? 0) < 0 ? 'text-red-500' : 'text-gray-900 dark:text-text-primary')}>
                {fmt(totals[cur] ?? 0)}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl overflow-hidden shadow-sm">
          {commissions.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 dark:text-text-secondary/50">
              Aucune commission sur cette période.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-text-secondary/15">
                    {['Date', 'Client', 'Montant tx', 'Taux', 'Commission', 'Statut'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-text-secondary/70 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-text-secondary/15/60">
                  {commissions.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 text-gray-500 dark:text-text-secondary whitespace-nowrap">{fmtDate(c.created_at)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-text-primary">{c.sub_merchant_name ?? c.sub_merchant_id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-text-primary whitespace-nowrap">{fmt(c.transaction_amount)} <span className="text-xs text-gray-400">{c.currency}</span></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-text-secondary">{(Number(c.rate) * 100).toFixed(2)} %</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-text-primary whitespace-nowrap">{fmt(c.commission_amount)} <span className="text-xs text-gray-400">{c.currency}</span></td>
                      <td className="px-4 py-3">
                        {c.status === 'credited' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 size={12} /> Créditée</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" title={c.reverse_reason ?? ''}><XCircle size={12} /> Contrepassée</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {commPage && commPage.pages > 1 && (
          <div className="flex items-center justify-between mt-3 text-xs sm:text-sm text-gray-600 dark:text-text-secondary">
            <span>Page {commPage.page} / {commPage.pages} — {commPage.total} commissions</span>
            <div className="flex gap-2">
              <button disabled={commPageNum <= 1} onClick={() => { const p = commPageNum - 1; setCommPageNum(p); void loadCommissions(p, dateFrom, dateTo); }} className="p-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button disabled={commPageNum >= commPage.pages} onClick={() => { const p = commPageNum + 1; setCommPageNum(p); void loadCommissions(p, dateFrom, dateTo); }} className="p-1.5 rounded-lg border border-gray-200 dark:border-text-secondary/20 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
