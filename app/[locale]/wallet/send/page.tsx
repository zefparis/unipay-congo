'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function WalletSendPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_phone: recipientPhone,
          amount: Number(amount),
          note: note || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Envoi échoué');
        return;
      }

      const recipientName = data.recipient_name ?? recipientPhone;
      setSuccess(`${Number(amount).toLocaleString('fr-CD')} CDF envoyés à ${recipientName} avec succès.`);
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
          <Send className="text-blue-500" size={22} />
          Envoyer de l&apos;argent
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Téléphone du destinataire
          </label>
          <input
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="+243 XXX XXX XXX"
            required
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400">Le destinataire doit avoir un compte UniPay Wallet</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Montant (CDF)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1 000"
            min={1}
            required
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Note <span className="text-gray-400">(optionnel)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Remboursement, loyer…"
            maxLength={255}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {loading ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>
    </main>
  );
}
