'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Spinner from '../_components/Spinner';
import BlockchainWarning from '../_components/BlockchainWarning';

const NETWORK_FEE = 0.5;
const MIN_NET = 5;

export default function CryptoWithdrawForm({ balance }: { balance: number | null }) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [address, setAddress] = useState('');
  const [amount, setAmount]   = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const num = Number(amount);
  const netAmount = num > 0 ? Math.round((num - NETWORK_FEE) * 1e6) / 1e6 : 0;
  const overBudget = balance !== null && num > 0 && num > balance;
  const tooSmall = num > 0 && netAmount < MIN_NET;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      setError('Adresse invalide (format 0x...)');
      return;
    }
    if (netAmount < MIN_NET) {
      setError(`Montant net insuffisant. Minimum ${MIN_NET} USDT après frais.`);
      return;
    }
    if (overBudget) {
      setError('Solde USDT insuffisant.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/crypto-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ network: 'BSC', destination_address: address, amount: num }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Envoi vers réseau externe échoué'); return; }
      setSuccess(`${netAmount} USDT envoyés vers le réseau externe. Transaction : ${data.tx_hash?.slice(0, 12)}...`);
      setTimeout(() => router.push(`/${locale}/wallet`), 5000);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">
      <BlockchainWarning network="Réseau BNB" estimatedDelay="1-5 minutes" irreversible />

      {balance !== null && (
        <div className="bg-rust/8 border border-rust/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-rust-deep">Solde USDT disponible</span>
          <span className="text-sm font-bold text-rust-deep">{balance.toFixed(2)} USDT</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-heading font-semibold text-ink-muted">Adresse de votre portefeuille externe</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="border border-ink/15 rounded-xl px-4 py-3 text-base bg-bone text-ink font-mono focus:outline-none focus:ring-2 focus:ring-rust transition-all"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-heading font-semibold text-ink-muted">Montant à retirer (USDT)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="10" min={MIN_NET + NETWORK_FEE} step="0.01" required
          className={`border rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 ${overBudget || tooSmall ? 'border-danger focus:ring-danger/30' : 'border-ink/15 focus:ring-rust'}`} />
        {num > 0 && (
          <div className="bg-ink/5 rounded-lg px-3 py-2 flex justify-between text-xs text-ink-muted">
            <span>Frais réseau : <strong>{NETWORK_FEE} USDT</strong></span>
            <span className={tooSmall ? 'text-danger font-bold' : ''}>
              Net reçu : <strong>{netAmount.toFixed(2)} USDT</strong>
            </span>
          </div>
        )}
        <p className="text-xs text-ink-muted">Minimum {MIN_NET} USDT net après frais de {NETWORK_FEE} USDT</p>
      </div>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>}
      {success && (
        <div className="bg-signal/10 border border-signal/30 rounded-xl px-4 py-3">
          <p className="text-sm text-signal-deep font-medium">✓ {success}</p>
        </div>
      )}

      <button type="submit" disabled={loading || !!success || overBudget || tooSmall}
        className="w-full bg-rust hover:bg-rust/90 text-white font-heading font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2">
        {loading && <Spinner />}
        {loading ? 'Envoi en cours…' : 'Envoyer vers réseau externe'}
      </button>
    </form>
  );
}
