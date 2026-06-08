'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowDownCircle } from 'lucide-react';
import Link from 'next/link';
import type { WalletBalance } from '../../../../lib/wallet-types';

const CDF_OPERATORS = [
  { value: 'orange',    label: 'Orange Money', activeClass: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'airtel',    label: 'Airtel Money',  activeClass: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'afrimoney', label: 'Afrimoney',     activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
];

const USD_OPERATORS = [
  { value: 'airtel', label: 'Airtel USD',  activeClass: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'mpesa',  label: 'Mpesa USD',   activeClass: 'border-green-500 bg-green-50 text-green-700' },
  { value: 'orange', label: 'Orange USD',  activeClass: 'border-orange-400 bg-orange-50 text-orange-700' },
];

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <svg className={`animate-spin ${cls}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletDepositPage() {
  const router   = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [tab, setTab]           = useState<'cdf' | 'usd'>('cdf');
  const [phone, setPhone]       = useState('');
  const [operator, setOperator] = useState('orange');
  const [amount, setAmount]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [polling, setPolling]   = useState(false);
  const [usdBalance, setUsdBalance] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wallet_phone') ?? '' : '';
    if (saved) setPhone(saved);

    fetch('/api/wallet/balance')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: WalletBalance | null) => { if (d) setUsdBalance(Number(d.usd_balance ?? 0)); })
      .catch(() => {});

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const isCdf      = tab === 'cdf';
  const operators  = isCdf ? CDF_OPERATORS : USD_OPERATORS;
  const minAmt     = isCdf ? 500 : 1;
  const num        = Number(amount);
  const fee        = num > 0 ? Math.round(num * 0.03 * 100) / 100 : 0;
  const netAmt     = num > 0 ? Math.round((num - fee) * 100) / 100 : 0;

  function switchTab(t: 'cdf' | 'usd') {
    setTab(t);
    setAmount('');
    setError('');
    setSuccess('');
    setOperator(t === 'cdf' ? 'orange' : 'airtel');
  }

  function startPolling(preBalance: number) {
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch('/api/wallet/balance');
        if (!r.ok) return;
        const d: WalletBalance = await r.json();
        const newBal = Number(d.usd_balance ?? 0);
        if (newBal > preBalance) {
          clearInterval(pollRef.current!);
          setPolling(false);
          setSuccess(`✓ Dépôt confirmé ! Solde USD : ${newBal.toFixed(2)} USD`);
          setUsdBalance(newBal);
          setTimeout(() => router.push(`/${locale}/wallet`), 3000);
          return;
        }
      } catch { /* ignore */ }
      if (attempts >= 20) {
        clearInterval(pollRef.current!);
        setPolling(false);
        setSuccess('Votre dépôt est en cours de traitement. Le solde sera mis à jour automatiquement.');
        setTimeout(() => router.push(`/${locale}/wallet`), 4000);
      }
    }, 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (num < minAmt) { setError(`Montant minimum : ${minAmt} ${isCdf ? 'CDF' : 'USD'}`); return; }

    setLoading(true);
    try {
      let res: Response;
      if (isCdf) {
        res = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_mm: phone, operator, amount: num }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? 'Dépôt échoué'); return; }
        setSuccess('Votre dépôt est en cours de traitement. Validez la demande sur votre téléphone.');
        setTimeout(() => router.push(`/${locale}/wallet`), 4000);
      } else {
        res = await fetch('/api/wallet/unipesa/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, operator, amount: num }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? 'Dépôt USD échoué'); return; }
        setSuccess('Validez la demande sur votre téléphone. Vérification en cours…');
        startPolling(usdBalance);
      }
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  const submitting = loading || polling;

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

      {/* Currency tab */}
      <div className="flex gap-2 px-4 pt-4">
        <button type="button" onClick={() => switchTab('cdf')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'cdf' ? 'border-[#00A651] bg-green-50 text-[#00A651]' : 'border-gray-200 bg-white text-gray-500'}`}>
          CDF
        </button>
        <button type="button" onClick={() => switchTab('usd')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'usd' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500'}`}>
          USD via Unipesa
        </button>
      </div>

      {tab === 'usd' && (
        <div className="mx-4 mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-emerald-700">Solde USD actuel</span>
          <span className="font-bold text-emerald-700">{usdBalance.toFixed(2)} USD</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">

        {/* Operator */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Opérateur</label>
          <div className="grid grid-cols-3 gap-2">
            {operators.map((op) => (
              <button key={op.value} type="button" onClick={() => setOperator(op.value)}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition ${operator === op.value ? op.activeClass : 'border-gray-200 bg-white text-gray-500'}`}>
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">Numéro Mobile Money</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+243 XXX XXX XXX" required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]" />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">
            Montant à déposer ({isCdf ? 'CDF' : 'USD'})
          </label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder={isCdf ? '5 000' : '10.00'} min={minAmt} step={isCdf ? '1' : '0.01'} required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]" />
          {num >= minAmt && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between text-xs text-gray-500">
              <span>Frais (3 %) : <strong>{isCdf ? fee.toLocaleString('fr-FR') : fee.toFixed(2)} {isCdf ? 'CDF' : 'USD'}</strong></span>
              <span>Reçu : <strong className="text-[#00A651]">{isCdf ? netAmt.toLocaleString('fr-FR') : netAmt.toFixed(2)} {isCdf ? 'CDF' : 'USD'}</strong></span>
            </div>
          )}
          <p className="text-xs text-gray-400">Minimum {minAmt} {isCdf ? 'CDF' : 'USD'}</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
            {polling && <Spinner size="md" />}
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}

        <button type="submit" disabled={submitting || !!success}
          className="w-full bg-[#00A651] hover:bg-[#008f45] text-white font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2">
          {loading && <Spinner />}
          {loading ? 'Envoi…' : polling ? 'Vérification…' : 'Déposer'}
        </button>
      </form>
    </div>
  );
}
