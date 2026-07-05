'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Spinner from '../_components/Spinner';
import BlockchainWarning from '../_components/BlockchainWarning';

const CGLT_PER_WCGLT = 500;

export default function BridgeExportForm({ balance }: { balance: number | null }) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [bscAddress, setBscAddress] = useState('');
  const [amount, setAmount]         = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [loading, setLoading]       = useState(false);

  const num = Math.trunc(Number(amount));
  const minAmt = CGLT_PER_WCGLT;
  const notMultiple = num > 0 && num % CGLT_PER_WCGLT !== 0;
  const overBudget = balance !== null && num > 0 && num > balance;
  const wcgltReceived = num > 0 ? num / CGLT_PER_WCGLT : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^0x[0-9a-fA-F]{40}$/.test(bscAddress)) {
      setError('Adresse invalide (format 0x...)');
      return;
    }
    if (num < minAmt) {
      setError(`Montant minimum : ${minAmt} CGLT`);
      return;
    }
    if (notMultiple) {
      setError(`Le montant doit être un multiple de ${CGLT_PER_WCGLT} CGLT`);
      return;
    }
    if (overBudget) {
      setError('Solde CGLT insuffisant.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/cglt/withdraw-bsc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: num, bsc_address: bscAddress }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Envoi vers réseau externe échoué'); return; }
      setSuccess(`${wcgltReceived} CGLT (version réseau externe) envoyés. Transaction : ${data.bsc_tx_hash?.slice(0, 12)}...`);
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
          <span className="text-sm text-rust-deep">Solde CGLT disponible</span>
          <span className="text-sm font-bold text-rust-deep">{Math.floor(balance).toLocaleString('fr-FR')} CGLT</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-heading font-semibold text-ink-muted">Adresse de votre portefeuille externe</label>
        <input
          type="text"
          value={bscAddress}
          onChange={(e) => setBscAddress(e.target.value)}
          placeholder="0x..."
          className="border border-ink/15 rounded-xl px-4 py-3 text-base bg-bone text-ink font-mono focus:outline-none focus:ring-2 focus:ring-rust transition-all"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-heading font-semibold text-ink-muted">Montant à exporter (CGLT)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder={String(minAmt)} min={minAmt} step={String(minAmt)} required
          className={`border rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 ${overBudget || notMultiple ? 'border-danger focus:ring-danger/30' : 'border-ink/15 focus:ring-rust'}`} />
        {num > 0 && (
          <div className="bg-ink/5 rounded-lg px-3 py-2 flex justify-between text-xs text-ink-muted">
            <span>Taux : <strong>1 CGLT réseau = {CGLT_PER_WCGLT} CGLT</strong></span>
            <span>Vous recevez : <strong className="text-rust-deep">{wcgltReceived} CGLT (version réseau externe)</strong></span>
          </div>
        )}
        <p className="text-xs text-ink-muted">Minimum {minAmt} CGLT, multiple de {CGLT_PER_WCGLT}</p>
      </div>

      {error && <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>}
      {success && (
        <div className="bg-signal/10 border border-signal/30 rounded-xl px-4 py-3">
          <p className="text-sm text-signal-deep font-medium">✓ {success}</p>
        </div>
      )}

      <button type="submit" disabled={loading || !!success || overBudget || notMultiple}
        className="w-full bg-rust hover:bg-rust/90 text-white font-heading font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2">
        {loading && <Spinner />}
        {loading ? 'Envoi en cours…' : 'Envoyer vers réseau externe'}
      </button>
    </form>
  );
}
