'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowDownCircle } from 'lucide-react';
import Spinner from '../_components/Spinner';

const CDF_OPERATORS = [
  { value: 'orange',    label: 'Orange Money', activeClass: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'airtel',    label: 'Airtel Money',  activeClass: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'afrimoney', label: 'Afrimoney',     activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
];

export default function DepositMMForm() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [phone, setPhone]       = useState('');
  const [operator, setOperator] = useState('orange');
  const [amount, setAmount]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wallet_phone') ?? '' : '';
    if (saved) setPhone(saved);
  }, []);

  const num = Number(amount);
  const minAmt = 500;
  const fee = num > 0 ? Math.round(num * 0.03 * 100) / 100 : 0;
  const netAmt = num > 0 ? Math.round((num - fee) * 100) / 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (num < minAmt) { setError(`Montant minimum : ${minAmt} CDF`); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_mm: phone, operator, amount: num }),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-heading font-semibold text-ink-muted">Opérateur</label>
        <div className="grid grid-cols-3 gap-2">
          {CDF_OPERATORS.map((op) => (
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
        <label className="text-sm font-heading font-semibold text-ink-muted">Montant à déposer (CDF)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="5 000" min={minAmt} step="1" required
          className="border border-ink/15 rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 focus:ring-signal" />
        {num >= minAmt && (
          <div className="bg-ink/5 rounded-lg px-3 py-2 flex justify-between text-xs text-ink-muted">
            <span>Frais (3 %) : <strong>{fee.toLocaleString('fr-FR')} CDF</strong></span>
            <span>Reçu : <strong className="text-signal-deep">{netAmt.toLocaleString('fr-FR')} CDF</strong></span>
          </div>
        )}
        <p className="text-xs text-ink-muted">Minimum {minAmt} CDF</p>
      </div>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>}
      {success && (
        <div className="bg-signal/10 border border-signal/30 rounded-xl px-4 py-3">
          <p className="text-sm text-signal-deep font-medium">✓ {success}</p>
        </div>
      )}

      <button type="submit" disabled={loading || !!success}
        className="w-full bg-signal hover:bg-signal-dark text-white font-heading font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2">
        {loading && <Spinner />}
        {loading ? 'Envoi…' : 'Déposer'}
      </button>
    </form>
  );
}
