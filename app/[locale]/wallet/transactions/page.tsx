'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react';

interface Transaction {
  id: string;
  operator: string;
  direction: 'collect' | 'payout' | 'p2p';
  amount: number;
  net_amount: number;
  currency: string;
  phone: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  created_at: string;
}

type Filter = 'all' | 'collect' | 'payout' | 'p2p';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'Tous' },
  { key: 'collect', label: 'Dépôts' },
  { key: 'payout',  label: 'Retraits' },
  { key: 'p2p',     label: 'P2P' },
];

const STATUS_STYLES: Record<Transaction['status'], string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-yellow-100 text-yellow-700',
  success:    'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-600',
  cancelled:  'bg-red-100 text-red-600',
};
const STATUS_LABELS: Record<Transaction['status'], string> = {
  pending:    'En attente',
  processing: 'En cours',
  success:    'Succès',
  failed:     'Échoué',
  cancelled:  'Annulé',
};

function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(n); }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PAGE_SIZE = 20;

export default function WalletTransactionsPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();

  const [filter, setFilter]       = useState<Filter>('all');
  const [page, setPage]           = useState(1);
  const [txList, setTxList]       = useState<Transaction[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const load = useCallback((f: Filter, p: number) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(p) });
    if (f !== 'all') params.set('direction', f);

    fetch(`/api/wallet/transactions?${params}`)
      .then((r) => {
        if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.data) { setTxList(d.data); setTotal(d.total ?? d.data.length); }
        else setError(d.error ?? 'Erreur de chargement');
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(filter, page); }, [filter, page]);

  function changeFilter(f: Filter) { setFilter(f); setPage(1); }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Historique</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto scrollbar-none">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              filter === key
                ? 'bg-signal text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4">
        {loading && (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-signal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mt-4">{error}</p>
        )}

        {!loading && txList.length === 0 && !error && (
          <p className="text-sm text-gray-400 text-center py-12">Aucune transaction pour le moment.</p>
        )}

        <div className="flex flex-col divide-y divide-gray-50 mt-2">
          {txList.map((tx) => {
            const isCredit = tx.direction === 'collect';
            const isP2P    = tx.direction === 'p2p';
            return (
              <div key={tx.id} className="flex items-center gap-3 py-3.5">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCredit ? 'bg-green-50' : isP2P ? 'bg-blue-50' : 'bg-orange-50'
                }`}>
                  {isCredit && <ArrowDownCircle className="text-signal" size={20} />}
                  {tx.direction === 'payout' && <ArrowUpCircle className="text-orange-500" size={20} />}
                  {isP2P && <ArrowLeftRight className="text-blue-500" size={20} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800 capitalize">{tx.operator}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[tx.status]}`}>
                      {STATUS_LABELS[tx.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{tx.phone}</p>
                  <p className="text-xs text-gray-300">{fmtDate(tx.created_at)}</p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${isCredit ? 'text-signal-dark' : isP2P ? 'text-blue-600' : 'text-orange-500'}`}>
                    {isCredit ? '+' : '−'}{fmt(isCredit ? tx.net_amount : tx.amount)}
                  </p>
                  <p className="text-xs text-gray-400">{tx.currency}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 pb-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              ← Précédent
            </button>
            <span className="text-xs text-gray-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
