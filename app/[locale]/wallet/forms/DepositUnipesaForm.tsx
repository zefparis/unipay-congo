'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Spinner from '../_components/Spinner';

const USD_OPERATORS = [
  { value: 'airtel', label: 'Airtel USD',  activeClass: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'mpesa',  label: 'Mpesa USD',   activeClass: 'border-green-500 bg-green-50 text-green-700' },
  { value: 'orange', label: 'Orange USD',  activeClass: 'border-orange-400 bg-orange-50 text-orange-700' },
];

export default function DepositUnipesaForm() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [phone, setPhone]       = useState('');
  const [operator, setOperator] = useState('airtel');
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
      .then((d) => { if (d) setUsdBalance(Number(d.usd_balance ?? 0)); })
      .catch(() => {});

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const num = Number(amount);
  const minAmt = 1;
  const fee = num > 0 ? Math.round(num * 0.03 * 100) / 100 : 0;
  const netAmt = num > 0 ? Math.round((num - fee) * 100) / 100 : 0;

  function startPolling(preBalance: number) {
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch('/api/wallet/balance');
        if (!r.ok) return;
        const d = await r.json();
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
    if (num < minAmt) { setError(`Montant minimum : ${minAmt} USD`); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/unipesa/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, operator, amount: num }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Dépôt USD échoué'); return; }
      setSuccess('Validez la demande sur votre téléphone. Vérification en cours…');
      startPolling(usdBalance);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  const submitting = loading || polling;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">
      <div className="bg-ink/5 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
        <span className="text-ink-muted">Solde USD actuel</span>
        <span className="font-bold text-signal-deep">{usdBalance.toFixed(2)} USD</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-heading font-semibold text-ink-muted">Opérateur</label>
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
        <label className="text-sm font-heading font-semibold text-ink-muted">Numéro Mobile Money</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="+243 XXX XXX XXX" required
          className="border border-ink/15 rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 focus:ring-signal" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-heading font-semibold text-ink-muted">Montant à déposer (USD)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="10.00" min={minAmt} step="0.01" required
          className="border border-ink/15 rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 focus:ring-signal" />
        {num >= minAmt && (
          <div className="bg-ink/5 rounded-lg px-3 py-2 flex justify-between text-xs text-ink-muted">
            <span>Frais (3 %) : <strong>{fee.toFixed(2)} USD</strong></span>
            <span>Reçu : <strong className="text-signal-deep">{netAmt.toFixed(2)} USD</strong></span>
          </div>
        )}
        <p className="text-xs text-ink-muted">Minimum {minAmt} USD</p>
      </div>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>}
      {success && (
        <div className="bg-signal/10 border border-signal/30 rounded-xl px-4 py-3 flex items-center gap-2">
          {polling && <Spinner size="md" />}
          <p className="text-sm text-signal-deep font-medium">{success}</p>
        </div>
      )}

      <button type="submit" disabled={submitting || !!success}
        className="w-full bg-signal hover:bg-signal-dark text-white font-heading font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2">
        {loading && <Spinner />}
        {loading ? 'Envoi…' : polling ? 'Vérification…' : 'Déposer'}
      </button>
    </form>
  );
}
