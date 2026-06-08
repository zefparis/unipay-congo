'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Repeat2, ChevronDown } from 'lucide-react';
import Link from 'next/link';

type Direction =
  | 'usd_to_cdf'  | 'cdf_to_usd'
  | 'usd_to_usdt' | 'usdt_to_usd'
  | 'cdf_to_cglt' | 'cglt_to_cdf'
  | 'cglt_to_usdt'| 'usdt_to_cglt';

interface SwapOption {
  value: Direction;
  label: string;
  note:  string;
  from:  string;
  to:    string;
  color: string;
}

const USD_CDF_RATE = 2850;

const SWAP_OPTIONS: SwapOption[] = [
  { value: 'usd_to_cdf',   label: 'USD → CDF',   note: `1 USD = ${USD_CDF_RATE.toLocaleString('fr-FR')} CDF`, from: 'USD',  to: 'CDF',  color: 'text-emerald-700' },
  { value: 'cdf_to_usd',   label: 'CDF → USD',   note: `1 USD = ${USD_CDF_RATE.toLocaleString('fr-FR')} CDF`, from: 'CDF',  to: 'USD',  color: 'text-emerald-700' },
  { value: 'usd_to_usdt',  label: 'USD → USDT',  note: 'Parité 1:1',                                          from: 'USD',  to: 'USDT', color: 'text-teal-700'    },
  { value: 'usdt_to_usd',  label: 'USDT → USD',  note: 'Parité 1:1',                                          from: 'USDT', to: 'USD',  color: 'text-teal-700'    },
  { value: 'cdf_to_cglt',  label: 'CDF → CGLT',  note: 'Parité 1:1',                                          from: 'CDF',  to: 'CGLT', color: 'text-blue-700'    },
  { value: 'cglt_to_cdf',  label: 'CGLT → CDF',  note: 'Parité 1:1',                                          from: 'CGLT', to: 'CDF',  color: 'text-blue-700'    },
  { value: 'cglt_to_usdt', label: 'CGLT → USDT', note: 'Swap AMM on-chain',                                   from: 'CGLT', to: 'USDT', color: 'text-purple-700'  },
  { value: 'usdt_to_cglt', label: 'USDT → CGLT', note: 'Swap AMM on-chain',                                   from: 'USDT', to: 'CGLT', color: 'text-purple-700'  },
];

interface Balances {
  balance_cdf:  number;
  usd_balance:  number;
  cglt_balance: number;
  usdt_balance: number;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function balanceFor(bal: Balances, currency: string): number {
  if (currency === 'USD')  return bal.usd_balance;
  if (currency === 'CDF')  return bal.balance_cdf;
  if (currency === 'CGLT') return bal.cglt_balance;
  if (currency === 'USDT') return bal.usdt_balance;
  return 0;
}

export default function WalletSwapPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [balances, setBalances]       = useState<Balances | null>(null);
  const [direction, setDirection]     = useState<Direction>('usd_to_cdf');
  const [amount, setAmount]           = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPicker, setShowPicker]   = useState(false);

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d) => { if (d) setBalances({ balance_cdf: Number(d.balance_cdf ?? 0), usd_balance: Number(d.usd_balance ?? 0), cglt_balance: Number(d.cglt_balance ?? 0), usdt_balance: Number(d.usdt_balance ?? 0) }); })
      .catch(() => {});
  }, []);

  const opt = SWAP_OPTIONS.find((o) => o.value === direction)!;
  const fromBal = balances ? balanceFor(balances, opt.from) : null;
  const num     = Number(amount);
  const overBudget = fromBal !== null && num > 0 && num > fromBal;

  async function handleSwap(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!num || num <= 0) { setError('Montant invalide'); return; }
    if (overBudget)       { setError(`Solde ${opt.from} insuffisant.`); return; }

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

      setSuccess(`✓ Conversion effectuée avec succès.`);
      setAmount('');
      // Refresh balances
      fetch('/api/wallet/balance')
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setBalances({ balance_cdf: Number(d.balance_cdf ?? 0), usd_balance: Number(d.usd_balance ?? 0), cglt_balance: Number(d.cglt_balance ?? 0), usdt_balance: Number(d.usdt_balance ?? 0) }); })
        .catch(() => {});
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900">
          <Repeat2 className="text-purple-600" size={20} />
          Convertir
        </h1>
      </div>

      {/* Balances summary */}
      {balances && (
        <div className="mx-4 mt-4 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 grid grid-cols-2 gap-y-1.5 text-xs">
          <span className="text-gray-500">CDF</span>
          <span className="font-semibold text-right">{balances.balance_cdf.toLocaleString('fr-FR')} CDF</span>
          <span className="text-gray-500">USD</span>
          <span className="font-semibold text-right text-emerald-700">{balances.usd_balance.toFixed(2)} USD</span>
          <span className="text-gray-500">CGLT</span>
          <span className="font-semibold text-right text-blue-700">{Math.floor(balances.cglt_balance).toLocaleString('fr-FR')} CGLT</span>
          <span className="text-gray-500">USDT</span>
          <span className="font-semibold text-right text-teal-700">{balances.usdt_balance.toFixed(2)} USDT</span>
        </div>
      )}

      <form onSubmit={handleSwap} className="flex flex-col gap-5 px-4 py-5">

        {/* Direction picker */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Type de conversion</label>
          <button type="button" onClick={() => setShowPicker(!showPicker)}
            className="flex items-center justify-between border-2 border-purple-200 bg-purple-50 rounded-xl px-4 py-3 text-sm font-bold text-purple-800 transition">
            <span>{opt.label}</span>
            <ChevronDown size={16} className={`transition-transform ${showPicker ? 'rotate-180' : ''}`} />
          </button>
          <p className="text-xs text-gray-400 -mt-1">{opt.note}</p>

          {showPicker && (
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
              {SWAP_OPTIONS.map((o) => (
                <button key={o.value} type="button"
                  onClick={() => { setDirection(o.value); setShowPicker(false); setAmount(''); setError(''); setSuccess(''); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition hover:bg-gray-50 ${direction === o.value ? 'bg-purple-50' : 'bg-white'}`}>
                  <span className={o.color}>{o.label}</span>
                  <span className="text-xs text-gray-400">{o.note}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Source balance */}
        {fromBal !== null && (
          <div className="bg-gray-50 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">Solde {opt.from} disponible</span>
            <span className="font-bold text-gray-700">
              {opt.from === 'CDF' || opt.from === 'CGLT'
                ? Math.floor(fromBal).toLocaleString('fr-FR')
                : fromBal.toFixed(2)
              } {opt.from}
            </span>
          </div>
        )}

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">
            Montant en {opt.from}
          </label>
          <div className="flex gap-2">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0" min={0} step="any" required
              className={`flex-1 border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 ${overBudget ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-purple-300'}`} />
            {fromBal !== null && (
              <button type="button" onClick={() => setAmount(String(fromBal))}
                className="px-3 py-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-purple-700 hover:bg-purple-50 transition">
                MAX
              </button>
            )}
          </div>
          {overBudget && (
            <p className="text-xs text-red-600">Solde {opt.from} insuffisant.</p>
          )}
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-2 text-gray-400 text-sm -my-2">
          <div className="flex-1 border-t border-dashed border-gray-200" />
          <span>→ {opt.to}</span>
          <div className="flex-1 border-t border-dashed border-gray-200" />
        </div>

        {error   && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}

        <button type="submit" disabled={loading || !num || num <= 0 || overBudget}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base">
          {loading && <Spinner />}
          {loading ? 'Conversion…' : `Convertir ${opt.from} → ${opt.to}`}
        </button>
      </form>
    </div>
  );
}
