'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function WalletLoginPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (pin.length !== 6) { setError('Le PIN doit contenir 6 chiffres.'); return; }
    setLoading(true);

    const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '');

    try {
      const res = await fetch('/api/wallet/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Numéro ou PIN incorrect');
        return;
      }

      localStorage.setItem('wallet_phone', phone);
      router.push(`/${locale}/wallet`);
      router.refresh();
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm bg-bone rounded-2xl shadow-md p-8 flex flex-col gap-6">

        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold text-signal">UniPay Wallet</h1>
          <p className="text-sm text-gray-500">Connectez-vous avec votre téléphone et PIN</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink/70">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+243 XXX XXX XXX"
              required
              className="border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-bone text-ink focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink/70">
              Code PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              maxLength={6}
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              className="border border-gray-300 rounded-lg px-3 py-3 text-lg tracking-[0.5em] text-center bg-white focus:outline-none focus:ring-2 focus:ring-signal"
            />
            <p className="text-xs text-gray-400 text-center">{pin.length}/6 chiffres</p>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal hover:bg-signal/85 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <Link href={`/${locale}/wallet/register`} className="text-signal-dark font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
