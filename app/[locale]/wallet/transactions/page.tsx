'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Send, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Transaction {
  id: string;
  operator: string;
  direction: 'collect' | 'payout' | 'p2p';
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  phone: string;
  reference: string | null;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
  created_at: string;
}

function DirectionIcon({ direction }: { direction: Transaction['direction'] }) {
  if (direction === 'collect') return <ArrowDownCircle className="text-[#00A651]" size={20} />;
  if (direction === 'payout')  return <ArrowUpCircle className="text-orange-500" size={20} />;
  return <Send className="text-blue-500" size={20} />;
}

function StatusIcon({ status }: { status: Transaction['status'] }) {
  if (status === 'success')    return <CheckCircle className="text-[#00A651]" size={14} />;
  if (status === 'failed' || status === 'cancelled') return <XCircle className="text-red-500" size={14} />;
  return <Clock className="text-yellow-500" size={14} />;
}

function directionLabel(d: Transaction['direction']) {
  if (d === 'collect') return 'Dépôt';
  if (d === 'payout')  return 'Retrait';
  return 'Envoi';
}

export default function WalletTransactionsPage() {
  const { locale } = useParams<{ locale: string }>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/wallet/transactions')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setTransactions(d.data);
        else setError(d.error ?? 'Erreur de chargement');
      })
      .catch(() => setError('Erreur réseau'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex flex-col items-center px-4 py-8 max-w-md mx-auto w-full gap-6">
      <div className="flex items-center gap-3 w-full">
        <Link href={`/${locale}/wallet`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Historique</h1>
      </div>

      {loading && (
        <p className="text-sm text-gray-400 mt-8">Chargement…</p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 w-full">{error}</p>
      )}

      {!loading && transactions.length === 0 && !error && (
        <p className="text-sm text-gray-400 mt-8">Aucune transaction pour le moment.</p>
      )}

      <ul className="w-full flex flex-col gap-3">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3"
          >
            <div className="shrink-0">
              <DirectionIcon direction={tx.direction} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{directionLabel(tx.direction)}</span>
                <StatusIcon status={tx.status} />
              </div>
              <p className="text-xs text-gray-400 truncate">{tx.phone}</p>
              <p className="text-xs text-gray-300">{new Date(tx.created_at).toLocaleDateString('fr-CD')}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">
                {tx.direction === 'collect' ? '+' : '−'}
                {tx.direction === 'collect'
                  ? tx.net_amount.toLocaleString('fr-CD')
                  : tx.amount.toLocaleString('fr-CD')}
              </p>
              <p className="text-xs text-gray-400">{tx.currency}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
