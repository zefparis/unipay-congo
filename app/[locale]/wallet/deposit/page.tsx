'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowDownCircle } from 'lucide-react';
import Link from 'next/link';

const OPERATORS = [
  { value: 'orange',     label: 'Orange Money',  activeClass: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'airtel',     label: 'Airtel Money',  activeClass: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'afrimoney',  label: 'Afrimoney',     activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
];

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletDepositPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [phoneMM, setPhoneMM] = useState('');
  const [operator, setOperator] = useState('orange');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wallet_phone') ?? '' : '';
    if (saved) setPhoneMM(saved);
  }, []);

  const fee     = amount ? Math.round(Number(amount) * 0.03 * 100) / 100 : 0;
  const netAmt  = amount ? Math.round((Number(amount) - fee) * 100) / 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Number(amount) < 500) { setError('Montant minimum : 500 CDF'); return; }

    setLoading(true);

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_mm: phoneMM, operator, amount: Number(amount) }),
      });

      const data = await res.json();

      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Dépôt échoué'); return; }

      setSuccess('Votre dépôt est en cours de traitement. Validez la demande sur votre téléphone.');
      setTimeout(() => router.push(`/${locale}/wallet`), 4000);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900">
          <ArrowDownCircle className="text-[#00A651]" size={20} />
          Dépôt Mobile Money
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">

        {/* Operator selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Opérateur</label>
          <div className="grid grid-cols-3 gap-2">
            {OPERATORS.map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => setOperator(op.value)}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition ${
                  operator === op.value
                    ? op.activeClass
                    : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone MM */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">Numéro Mobile Money</label>
          <input
            type="tel"
            value={phoneMM}
            onChange={(e) => setPhoneMM(e.target.value)}
            placeholder="+243 XXX XXX XXX"
            required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]"
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">Montant à déposer (CDF)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5 000"
            min={500}
            required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]"
          />
          {amount && Number(amount) >= 500 && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between text-xs text-gray-500">
              <span>Frais (3 %) : <strong>{fee.toLocaleString('fr-FR')} CDF</strong></span>
              <span>Reçu : <strong className="text-[#00A651]">{netAmt.toLocaleString('fr-FR')} CDF</strong></span>
            </div>
          )}
          <p className="text-xs text-gray-400">Minimum 500 CDF</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800 font-medium">✓ {success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!success}
          className="w-full bg-[#00A651] hover:bg-[#008f45] text-white font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2"
        >
          {loading && <Spinner />}
          {loading ? 'Traitement…' : 'Déposer'}
        </button>
      </form>
    </div>
  );
}
