'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Spinner from '../_components/Spinner';

const USD_OPERATORS = [
  { value: 'airtel', label: 'Airtel USD',  activeClass: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'mpesa',  label: 'Mpesa USD',   activeClass: 'border-green-500 bg-green-50 text-green-700' },
  { value: 'orange', label: 'Orange USD',  activeClass: 'border-orange-400 bg-orange-50 text-orange-700' },
];

export default function WithdrawUnipesaForm({ balance }: { balance: number | null }) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [phone, setPhone]       = useState('');
  const [operator, setOperator] = useState('airtel');
  const [amount, setAmount]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wallet_phone') ?? '' : '';
    if (saved) setPhone(saved);
  }, []);

  const num = Number(amount);
  const minAmt = 1;
  const fee = num > 0 ? Math.round(num * 0.03 * 100) / 100 : 0;
  const totalCost = num > 0 ? Math.round((num + fee) * 100) / 100 : 0;
  const overBudget = balance !== null && num > 0 && totalCost > balance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (num < minAmt) { setError(`Montant minimum : ${minAmt} USD`); return; }
    if (overBudget) { setError('Solde USD insuffisant.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/unipesa/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, operator, amount: num }),
      });
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">
      {balance !== null && (
        <div className="bg-rust/8 border border-rust/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-rust-deep">Solde USD disponible</span>
          <span className="text-sm font-bold text-rust-deep">{balance.toFixed(2)} USD</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-heading font-semibold text-ink-muted">Opérateur de destination</label>
        <div className="grid grid-cols-3 gap-2">
          {USD_OPERATORS.map((op) => (
            <button key={op.value} type="button" onClick={() => setOperator(op.value)}
              className={`py-3 rounded-xl border-2 text-sm font-semibold transition ${operator === op.value ? op.activeClass : 'border-ink/15 bg-bone text-ink-muted'}`}>
              {op.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-heading font-semibold text-ink-muted">Numéro de réception</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="+243 XXX XXX XXX"
          className="border border-ink/15 rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 focus:ring-rust" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-heading font-semibold text-ink-muted">Montant à retirer (USD)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="10" min={minAmt} step="0.01" required
          className={`border rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 ${overBudget ? 'border-danger focus:ring-danger/30' : 'border-ink/15 focus:ring-rust'}`} />
        {num >= minAmt && (
          <div className="bg-ink/5 rounded-lg px-3 py-2 flex justify-between text-xs text-ink-muted">
            <span>Frais (3 %) : <strong>{fee.toFixed(2)} USD</strong></span>
            <span className={overBudget ? 'text-danger font-bold' : ''}>
              Total débité : <strong>{totalCost.toFixed(2)} USD</strong>
            </span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>}
      {success && (
        <div className="bg-signal/10 border border-signal/30 rounded-xl px-4 py-3">
          <p className="text-sm text-signal-deep font-medium">✓ {success}</p>
        </div>
      )}

      <button type="submit" disabled={loading || !!success || overBudget}
        className="w-full bg-rust hover:bg-rust/90 text-white font-heading font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2">
        {loading && <Spinner />}
        {loading ? 'Traitement…' : 'Retirer'}
      </button>
    </form>
  );
}
