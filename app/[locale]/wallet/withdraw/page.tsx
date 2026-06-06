'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

const OPERATORS = [
  { value: 'orange', label: 'Orange Money' },
  { value: 'airtel', label: 'Airtel Money' },
  { value: 'afrimoney', label: 'Afrimoney' },
];

export default function WalletWithdrawPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [phoneMM, setPhoneMM] = useState('');
  const [operator, setOperator] = useState('orange');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_mm: phoneMM, operator, amount: Number(amount) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Retrait échoué');
        return;
      }

      setSuccess(`Retrait initié (réf: ${data.transaction_id?.slice(0, 8).toUpperCase()}). Fonds envoyés sur votre mobile.`);
      setTimeout(() => router.push(`/${locale}/wallet`), 3000);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center px-4 py-8 max-w-md mx-auto w-full gap-6">
      <div className="flex items-center gap-3 w-full">
        <Link href={`/${locale}/wallet`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ArrowUpCircle className="text-orange-500" size={22} />
          Retrait Mobile Money
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Opérateur</label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Numéro Mobile Money destinataire</label>
          <input
            type="tel"
            value={phoneMM}
            onChange={(e) => setPhoneMM(e.target.value)}
            placeholder="+243 XXX XXX XXX"
            required
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Montant (CDF)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5 000"
            min={100}
            required
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651]"
          />
          <p className="text-xs text-gray-400">Minimum 100 CDF · Frais 3% déduits de votre solde</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {loading ? 'Traitement…' : 'Retirer'}
        </button>
      </form>
    </main>
  );
}
