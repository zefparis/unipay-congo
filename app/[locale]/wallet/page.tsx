'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowDownCircle, ArrowUpCircle, Send, List } from 'lucide-react';

export default function WalletHomePage() {
  const { locale } = useParams<{ locale: string }>();
  const base = `/${locale}/wallet`;

  return (
    <main className="flex flex-col items-center px-4 py-10 gap-8 max-w-md mx-auto w-full">

      {/* Balance card */}
      <section className="w-full rounded-2xl bg-[#00A651] text-white p-6 shadow-lg flex flex-col gap-2">
        <p className="text-sm opacity-80">Solde disponible</p>
        <p className="text-4xl font-bold tracking-tight">— CDF</p>
        <p className="text-xs opacity-60 mt-1">UniPay Wallet · RDC</p>
      </section>

      {/* Action buttons */}
      <section className="w-full grid grid-cols-2 gap-4">
        <Link
          href={`${base}/deposit`}
          className="flex flex-col items-center gap-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition"
        >
          <ArrowDownCircle className="text-[#00A651]" size={32} />
          <span className="text-sm font-medium">Dépôt</span>
        </Link>

        <Link
          href={`${base}/withdraw`}
          className="flex flex-col items-center gap-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition"
        >
          <ArrowUpCircle className="text-orange-500" size={32} />
          <span className="text-sm font-medium">Retrait</span>
        </Link>

        <Link
          href={`${base}/send`}
          className="flex flex-col items-center gap-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition"
        >
          <Send className="text-blue-500" size={32} />
          <span className="text-sm font-medium">Envoyer</span>
        </Link>

        <Link
          href={`${base}/transactions`}
          className="flex flex-col items-center gap-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition"
        >
          <List className="text-gray-500" size={32} />
          <span className="text-sm font-medium">Historique</span>
        </Link>
      </section>
    </main>
  );
}
