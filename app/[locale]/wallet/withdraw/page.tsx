'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

const OPERATORS = [
  { value: 'orange',    label: 'Orange Money', activeClass: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'airtel',    label: 'Airtel Money',  activeClass: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'afrimoney', label: 'Afrimoney',     activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
];

function fmtNum(n: number) { return new Intl.NumberFormat('fr-FR').format(n); }

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletWithdrawPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [tab, setTab]           = useState<'cdf' | 'usd'>('cdf');
  const [balance, setBalance]   = useState<number | null>(null);
  const [usdBalance, setUsdBal] = useState<number | null>(null);
  const [phoneMM, setPhoneMM]   = useState('');
  const [operator, setOperator] = useState('orange');
  const [amount, setAmount]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d) => { if (d) { setBalance(Number(d.balance_cdf ?? 0)); setUsdBal(Number(d.usd_balance ?? 0)); } })
      .catch(() => {});

    const saved = typeof window !== 'undefined' ? localStorage.getItem('wallet_phone') ?? '' : '';
    if (saved) setPhoneMM(saved);
  }, []);

  const isCdf      = tab === 'cdf';
  const minAmt     = isCdf ? 100 : 1;
  const activeBalance = isCdf ? balance : usdBalance;
  const fee        = amount ? Math.round(Number(amount) * 0.03 * 100) / 100 : 0;
  const totalCost  = amount ? Math.round((Number(amount) + fee) * 100) / 100 : 0;
  const overBudget = activeBalance !== null && Number(amount) > 0 && totalCost > activeBalance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const num = Number(amount);
    if (num < minAmt) { setError(`Montant minimum : ${minAmt} ${isCdf ? 'CDF' : 'USD'}`); return; }
    if (overBudget) { setError(`Solde ${isCdf ? 'CDF' : 'USD'} insuffisant.`); return; }

    setLoading(true);
    try {
      let res: Response;
      if (isCdf) {
        res = await fetch('/api/wallet/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_mm: phoneMM, operator, amount: num }),
        });
      } else {
        res = await fetch('/api/wallet/unipesa/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_mm: phoneMM, operator, amount_usd: num }),
        });
      }
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Retrait échoué'); return; }

      setSuccess('Votre retrait est en cours. Les fonds seront envoyés sur votre mobile dans quelques instants.');
      setTimeout(() => router.push(`/${locale}/wallet`), 4000);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  const currency = isCdf ? 'CDF' : 'USD';

  return (
    <div className="flex flex-col min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900">
          <ArrowUpCircle className="text-orange-500" size={20} />
          Retrait Mobile Money
        </h1>
      </div>

      {/* Currency tab */}
      <div className="flex gap-2 px-4 pt-4">
        <button type="button" onClick={() => { setTab('cdf'); setAmount(''); setError(''); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'cdf' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-500'}`}>
          CDF
        </button>
        <button type="button" onClick={() => { setTab('usd'); setAmount(''); setError(''); }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'usd' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500'}`}>
          USD via Unipesa
        </button>
      </div>

      {/* Balance banner */}
      {activeBalance !== null && (
        <div className="mx-4 mt-4 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-orange-700">Solde {currency} disponible</span>
          <span className="text-sm font-bold text-orange-700">
            {isCdf ? fmtNum(activeBalance) : activeBalance.toFixed(2)} {currency}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">

        {/* Operator */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Opérateur de destination</label>
          <div className="grid grid-cols-3 gap-2">
            {OPERATORS.map((op) => (
              <button key={op.value} type="button" onClick={() => setOperator(op.value)}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition ${operator === op.value ? op.activeClass : 'border-gray-200 bg-white text-gray-500'}`}>
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone MM */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">Numéro de réception</label>
          <input type="tel" value={phoneMM} onChange={(e) => setPhoneMM(e.target.value)}
            placeholder="+243 XXX XXX XXX" required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">Montant à retirer ({currency})</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder={isCdf ? '5 000' : '10'} min={minAmt} required
            className={`border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 ${overBudget ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-orange-400'}`} />
          {amount && Number(amount) >= minAmt && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between text-xs text-gray-500">
              <span>Frais (3 %) : <strong>{isCdf ? fmtNum(fee) : fee.toFixed(2)} {currency}</strong></span>
              <span className={overBudget ? 'text-red-600 font-bold' : ''}>
                Total débité : <strong>{isCdf ? fmtNum(totalCost) : totalCost.toFixed(2)} {currency}</strong>
              </span>
            </div>
          )}
        </div>

        {error   && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800 font-medium">✓ {success}</p>
          </div>
        )}

        <button type="submit" disabled={loading || !!success || overBudget}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2">
          {loading && <Spinner />}
          {loading ? 'Traitement…' : 'Retirer'}
        </button>
      </form>
    </div>
  );
}
