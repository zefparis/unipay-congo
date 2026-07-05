'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftRight } from 'lucide-react';
import Spinner from '../_components/Spinner';
import ConfirmModal from '../_components/ConfirmModal';

function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(n); }

export default function SendForm({ currency, balance }: { currency: 'CDF' | 'USDT'; balance: number | null }) {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount]                 = useState('');
  const [note, setNote]                     = useState('');
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [loading, setLoading]               = useState(false);
  const [showModal, setShowModal]           = useState(false);

  const amountNum = Number(amount);
  const overBudget = balance !== null && amountNum > 0 && amountNum > balance;
  const minAmt = currency === 'CDF' ? 1 : 0.01;

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (amountNum < minAmt) { setError(`Montant invalide (min ${minAmt} ${currency}).`); return; }
    if (overBudget) { setError(`Solde insuffisant (${fmt(balance!)} ${currency} disponibles).`); return; }
    setShowModal(true);
  }

  async function confirmSend() {
    setShowModal(false);
    setLoading(true);
    try {
      const endpoint = currency === 'CDF' ? '/api/wallet/send' : '/api/wallet/send-usdt';
      const bodyKey = currency === 'CDF' ? 'recipient_phone' : 'recipient_phone';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: recipientPhone, amount: amountNum, note: note || undefined }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Envoi échoué'); return; }

      const name = data.recipient_name ?? recipientPhone;
      setSuccess(`${fmt(amountNum)} ${currency} envoyés à ${name} avec succès.`);
      setTimeout(() => router.push(`/${locale}/wallet`), 3500);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  const accentColor = currency === 'CDF' ? 'signal' : 'rust';
  const accentBg = currency === 'CDF' ? 'bg-signal hover:bg-signal-dark' : 'bg-rust hover:bg-rust/90';
  const accentRing = currency === 'CDF' ? 'focus:ring-signal' : 'focus:ring-rust';
  const accentText = currency === 'CDF' ? 'text-signal' : 'text-rust';
  const accentBgLight = currency === 'CDF' ? 'bg-signal/8 border-signal/20' : 'bg-rust/8 border-rust/20';

  return (
    <div className="flex flex-col">
      {balance !== null && (
        <div className={`mx-4 mt-4 ${accentBgLight} border rounded-xl px-4 py-3 flex items-center justify-between`}>
          <span className={`text-sm ${accentText}`}>Solde disponible</span>
          <span className={`text-sm font-bold ${accentText}`}>
            {currency === 'CDF' ? fmt(balance) : balance.toFixed(2)} {currency}
          </span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="flex flex-col gap-5 px-4 py-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-heading font-semibold text-ink/70">Téléphone du destinataire</label>
          <input
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="+243 XXX XXX XXX"
            required
            className={`border border-ink/15 rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 ${accentRing}`}
          />
          <p className="text-xs text-ink/40">Le destinataire doit avoir un compte UniPay Wallet</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-heading font-semibold text-ink/70">Montant ({currency})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={currency === 'CDF' ? '1 000' : '10.00'}
            min={minAmt}
            step={currency === 'CDF' ? '1' : '0.01'}
            required
            className={`border rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 ${overBudget ? 'border-danger focus:ring-danger/30' : `border-ink/15 ${accentRing}`}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-heading font-semibold text-ink/70">
            Note <span className="font-normal text-ink/40">(optionnel)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Remboursement, loyer…"
            maxLength={255}
            className={`border border-ink/15 rounded-xl px-4 py-3 text-sm bg-bone text-ink focus:outline-none focus:ring-2 ${accentRing}`}
          />
        </div>

        {error && <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-signal/10 border border-signal/30 rounded-xl px-4 py-3">
            <p className="text-sm text-signal font-medium">✓ {success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!success || overBudget}
          className={`w-full ${accentBg} text-white font-heading font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2`}
        >
          {loading && <Spinner />}
          {loading ? 'Envoi…' : `Envoyer ${currency}`}
        </button>
      </form>

      <ConfirmModal
        open={showModal}
        title="Confirmer l'envoi"
        message="Vérifiez les détails avant de confirmer"
        details={[
          { label: 'Destinataire', value: recipientPhone },
          { label: 'Montant', value: `${fmt(amountNum)} ${currency}` },
          ...(note ? [{ label: 'Note', value: note }] : []),
        ]}
        confirmLabel="Confirmer"
        confirmClassName={currency === 'CDF' ? 'bg-signal text-white hover:bg-signal-dark' : 'bg-rust text-white hover:bg-rust/90'}
        onConfirm={confirmSend}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
}
