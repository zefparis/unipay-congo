'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Repeat2 } from 'lucide-react';
import Spinner from '../_components/Spinner';

type Currency = 'CDF' | 'USD' | 'USDT' | 'CGLT';

interface SwapFormProps {
  fromCurrency: Currency;
  toCurrency: Currency;
  balance: number | null;
}

const DIRECTION_MAP: Record<string, string> = {
  'CDF→USD':   'cdf_to_usd',
  'USD→CDF':   'usd_to_cdf',
  'CDF→CGLT':  'cdf_to_cglt',
  'CGLT→CDF':  'cglt_to_cdf',
  'CGLT→USDT': 'cglt_to_usdt',
  'USDT→CGLT': 'usdt_to_cglt',
  'USD→USDT':  'usd_to_usdt',
  'USDT→USD':  'usdt_to_usd',
};

const RATE_NOTES: Record<string, string> = {
  'CDF→USD':   '1 USD = 2 850 CDF',
  'USD→CDF':   '1 USD = 2 850 CDF',
  'CDF→CGLT':  'Parité 1:1',
  'CGLT→CDF':  'Parité 1:1',
  'CGLT→USDT': '1 USDT = 500 CGLT, frais 0.5%',
  'USDT→CGLT': '1 USDT = 500 CGLT, frais 0.5%',
  'USD→USDT':  'Parité 1:1, frais 0.5%',
  'USDT→USD':  'Parité 1:1, frais 0.5%',
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(n);
}

export default function SwapForm({ fromCurrency, toCurrency, balance }: SwapFormProps) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [amount, setAmount]   = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const direction = DIRECTION_MAP[`${fromCurrency}→${toCurrency}`];
  const note = RATE_NOTES[`${fromCurrency}→${toCurrency}`] ?? '';
  const num = Number(amount);
  const overBudget = balance !== null && num > 0 && num > balance;

  async function handleSwap(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!num || num <= 0) { setError('Montant invalide'); return; }
    if (overBudget) { setError(`Solde ${fromCurrency} insuffisant.`); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, amount: num }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Conversion échouée'); return; }

      setSuccess(`✓ Conversion ${fromCurrency} → ${toCurrency} effectuée avec succès.`);
      setAmount('');
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSwap} className="flex flex-col gap-5 px-4 py-5">
      <div className="bg-ink/5 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-ink-muted">{fromCurrency} → {toCurrency}</span>
        <span className="text-xs text-ink-muted">{note}</span>
      </div>

      {balance !== null && (
        <div className="bg-ink/5 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-ink-muted">Solde {fromCurrency} disponible</span>
          <span className="font-bold text-ink">
            {fromCurrency === 'CDF' || fromCurrency === 'CGLT'
              ? Math.floor(balance).toLocaleString('fr-FR')
              : balance.toFixed(2)
            } {fromCurrency}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-heading font-semibold text-ink-muted">Montant en {fromCurrency}</label>
        <div className="flex gap-2">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0" min={0} step="any" required
            className={`flex-1 border rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 ${overBudget ? 'border-danger focus:ring-danger/30' : 'border-ink/15 focus:ring-signal'}`} />
          {balance !== null && (
            <button type="button" onClick={() => setAmount(String(balance))}
              className="px-3 py-3 rounded-xl border border-ink/15 bg-bone text-xs font-bold text-signal-deep hover:bg-signal/8 transition">
              MAX
            </button>
          )}
        </div>
        {overBudget && (
          <p className="text-xs text-danger">Solde {fromCurrency} insuffisant.</p>
        )}
      </div>

      <div className="flex items-center gap-2 text-ink-muted text-sm -my-2">
        <div className="flex-1 border-t border-dashed border-ink/15" />
        <span>→ {toCurrency}</span>
        <div className="flex-1 border-t border-dashed border-ink/15" />
      </div>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>}
      {success && (
        <div className="bg-signal/10 border border-signal/30 rounded-xl px-4 py-3">
          <p className="text-sm text-signal-deep font-medium">{success}</p>
        </div>
      )}

      <button type="submit" disabled={loading || !num || num <= 0 || overBudget}
        className="w-full bg-signal hover:bg-signal-dark text-white font-heading font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base">
        {loading && <Spinner />}
        {loading ? 'Conversion…' : `Convertir ${fromCurrency} → ${toCurrency}`}
      </button>
    </form>
  );
}
