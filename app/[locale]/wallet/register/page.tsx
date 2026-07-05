'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function WalletRegisterPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!/^\+?[0-9]{8,15}$/.test(phone)) {
      setError('Numéro de téléphone invalide. Format attendu : +243XXXXXXXXX');
      return;
    }
    if (pin.length !== 6) {
      setError('Le PIN doit contenir exactement 6 chiffres.');
      return;
    }
    if (pin !== pinConfirm) {
      setError('Les codes PIN ne correspondent pas.');
      return;
    }

    setLoading(true);

    const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '');

    try {
      const res = await fetch('/api/wallet/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, full_name: fullName || undefined, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Inscription échouée');
        return;
      }

      localStorage.setItem('wallet_phone', phone);
      router.push(`/${locale}/wallet/login`);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-10">
      <div className="w-full max-w-sm bg-bone rounded-2xl shadow-md p-8 flex flex-col gap-6">

        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold text-signal">Créer un compte</h1>
          <p className="text-sm text-gray-500">Ouvrez votre wallet UniPay gratuitement</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink/70">
              Nom complet <span className="text-ink/40">(optionnel)</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jean Mutombo"
              className="border border-ink/15 rounded-lg px-3 py-2.5 text-sm bg-bone text-ink focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

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
              Code PIN (6 chiffres)
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink/70">
              Confirmer le PIN
            </label>
            <input
              type="password"
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              maxLength={6}
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              className="border border-gray-300 rounded-lg px-3 py-3 text-lg tracking-[0.5em] text-center bg-white focus:outline-none focus:ring-2 focus:ring-signal"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal hover:bg-signal/85 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Création…' : 'Créer mon wallet'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link href={`/${locale}/wallet/login`} className="text-signal-dark font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
