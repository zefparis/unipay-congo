'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Repeat2,
  Send,
  ExternalLink,
  Link2,
  ArrowLeft,
} from 'lucide-react';
import type { WalletBalance } from '../../../lib/wallet-types';
import BalanceCard from './_components/BalanceCard';
import ActionMenu from './_components/ActionMenu';
import ActionMenuItem from './_components/ActionMenuItem';
import Spinner from './_components/Spinner';
import DepositMMForm from './forms/DepositMMForm';
import DepositUnipesaForm from './forms/DepositUnipesaForm';
import WithdrawMMForm from './forms/WithdrawMMForm';
import WithdrawUnipesaForm from './forms/WithdrawUnipesaForm';
import CryptoWithdrawForm from './forms/CryptoWithdrawForm';
import BridgeExportForm from './forms/BridgeExportForm';
import SendForm from './forms/SendForm';
import SwapForm from './forms/SwapForm';

interface Tx {
  id: string;
  direction: 'collect' | 'payout' | 'p2p';
  operator: string;
  amount: number;
  net_amount: number;
  created_at: string;
  status: string;
}

type Currency = 'CDF' | 'USD' | 'USDT' | 'CGLT';

type ActiveForm =
  | { kind: 'deposit-mm' }
  | { kind: 'deposit-unipesa' }
  | { kind: 'withdraw-mm' }
  | { kind: 'withdraw-unipesa' }
  | { kind: 'crypto-withdraw' }
  | { kind: 'bridge-export' }
  | { kind: 'send'; currency: 'CDF' | 'USDT' }
  | { kind: 'swap'; from: Currency; to: Currency }
  | null;

function relativeDate(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

const FORM_TITLES: Record<string, string> = {
  'deposit-mm':        'Déposer CDF (Mobile Money)',
  'deposit-unipesa':   'Déposer USD (Unipesa)',
  'withdraw-mm':       'Retirer CDF (Mobile Money)',
  'withdraw-unipesa':  'Retirer USD (Unipesa)',
  'crypto-withdraw':   'Retrait Crypto (BSC)',
  'bridge-export':     'Exporter CGLT vers BSC',
  'send':              'Envoyer',
  'swap':              'Convertir',
};

export default function WalletHomePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const base = `/${locale}/wallet`;

  const [balances, setBalances]         = useState<WalletBalance | null>(null);
  const [txList, setTxList]             = useState<Tx[]>([]);
  const [loadingBal, setLoadingBal]     = useState(true);
  const [activeMenu, setActiveMenu]     = useState<Currency | null>(null);
  const [activeForm, setActiveForm]     = useState<ActiveForm>(null);

  const loadBalances = useCallback(() => {
    fetch('/api/wallet/balance')
      .then((r) => {
        if (r.status === 401) { router.replace(`${base}/login`); return null; }
        return r.json();
      })
      .then((d: WalletBalance | null) => { if (d) setBalances(d); })
      .catch(() => {})
      .finally(() => setLoadingBal(false));
  }, [base, router]);

  useEffect(() => {
    loadBalances();
    fetch('/api/wallet/transactions?limit=3')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.data) setTxList(d.data); })
      .catch(() => {});
  }, [loadBalances]);

  const cdfBalance  = balances ? Number(balances.balance_cdf ?? 0)  : null;
  const usdBalance  = balances ? Number(balances.usd_balance ?? 0)  : null;
  const usdtBalance = balances ? Number(balances.usdt_balance ?? 0) : null;
  const cgltBalance = balances ? Number(balances.cglt_balance ?? 0) : null;

  function openForm(form: ActiveForm) {
    setActiveMenu(null);
    setActiveForm(form);
  }

  function closeForm() {
    setActiveForm(null);
    loadBalances();
  }

  function renderForm() {
    if (!activeForm) return null;
    const title = activeForm.kind === 'send'
      ? `Envoyer ${activeForm.currency}`
      : activeForm.kind === 'swap'
        ? `Convertir ${activeForm.from} → ${activeForm.to}`
        : FORM_TITLES[activeForm.kind];

    return (
      <div className="fixed inset-0 z-50 bg-bone flex flex-col">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-ink/10">
          <button onClick={closeForm} className="p-2 rounded-full hover:bg-ink/5 transition">
            <ArrowLeft size={20} className="text-ink/60" />
          </button>
          <h1 className="text-lg font-heading font-bold text-ink">{title}</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeForm.kind === 'deposit-mm'       && <DepositMMForm />}
          {activeForm.kind === 'deposit-unipesa'  && <DepositUnipesaForm />}
          {activeForm.kind === 'withdraw-mm'      && <WithdrawMMForm balance={cdfBalance} />}
          {activeForm.kind === 'withdraw-unipesa' && <WithdrawUnipesaForm balance={usdBalance} />}
          {activeForm.kind === 'crypto-withdraw'  && <CryptoWithdrawForm balance={usdtBalance} />}
          {activeForm.kind === 'bridge-export'    && <BridgeExportForm balance={cgltBalance} />}
          {activeForm.kind === 'send'             && <SendForm currency={activeForm.currency} balance={activeForm.currency === 'CDF' ? cdfBalance : usdtBalance} />}
          {activeForm.kind === 'swap'             && (
            <SwapForm
              fromCurrency={activeForm.from}
              toCurrency={activeForm.to}
              balance={
                activeForm.from === 'CDF'  ? cdfBalance :
                activeForm.from === 'USD'  ? usdBalance :
                activeForm.from === 'USDT' ? usdtBalance :
                cgltBalance
              }
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-bone min-h-screen">
      {/* Header */}
      <div className="bg-ink px-6 pt-12 pb-6 flex flex-col gap-1 text-bone">
        <p className="text-sm opacity-60 tracking-wide font-body">UniPay Wallet · RDC</p>
        {loadingBal ? (
          <div className="h-11 mt-1"><Spinner size="lg" className="text-bone/60 mx-auto" /></div>
        ) : (
          <p className="text-2xl font-heading font-bold leading-tight">
            Mes soldes
          </p>
        )}
      </div>

      {/* Balance cards grid 2×2 */}
      <div className="grid grid-cols-2 gap-3 px-4 -mt-4 relative z-10">
        <BalanceCard currency="CDF"  amount={cdfBalance}  badge="instant"   onClick={() => setActiveMenu('CDF')} />
        <BalanceCard currency="USD"  amount={usdBalance}  badge="instant"   onClick={() => setActiveMenu('USD')} />
        <BalanceCard currency="USDT" amount={usdtBalance} badge="mixed"     onClick={() => setActiveMenu('USDT')} />
        <BalanceCard currency="CGLT" amount={cgltBalance} badge="mixed"     onClick={() => setActiveMenu('CGLT')} />
      </div>

      {/* Recent transactions */}
      <div className="px-4 pb-6 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-heading font-semibold text-ink/40 uppercase tracking-widest">Dernières opérations</h2>
          <Link href={`${base}/transactions`} className="text-xs text-signal font-semibold">Voir tout</Link>
        </div>

        {txList.length === 0 && !loadingBal && (
          <p className="text-sm text-ink/40 text-center py-8">Aucune transaction pour le moment.</p>
        )}

        <div className="flex flex-col divide-y divide-ink/5">
          {txList.map((tx) => {
            const isCredit = tx.direction === 'collect';
            const isP2P    = tx.direction === 'p2p';
            return (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCredit ? 'bg-signal/12' : isP2P ? 'bg-signal/12' : 'bg-rust/12'
                }`}>
                  {isCredit && <ArrowDownCircle className="text-signal" size={20} />}
                  {tx.direction === 'payout' && <ArrowUpCircle className="text-rust" size={20} />}
                  {isP2P && <ArrowLeftRight className="text-signal" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink capitalize">{tx.operator}</p>
                  <p className="text-xs text-ink/40">{relativeDate(tx.created_at)}</p>
                </div>
                <p className={`text-sm font-bold shrink-0 ${
                  isCredit ? 'text-signal' : isP2P ? 'text-signal' : 'text-rust'
                }`}>
                  {isCredit ? '+' : '−'}{fmt(isCredit ? tx.net_amount : tx.amount)} CDF
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action menus per currency */}
      <ActionMenu open={activeMenu === 'CDF'} onClose={() => setActiveMenu(null)} title="Actions CDF">
        <ActionMenuItem icon={ArrowDownCircle} label="Déposer" subtext="Mobile Money (Orange, Airtel, Afrimoney)" onClick={() => openForm({ kind: 'deposit-mm' })} />
        <ActionMenuItem icon={ArrowUpCircle}   label="Retirer" subtext="Mobile Money" onClick={() => openForm({ kind: 'withdraw-mm' })} />
        <ActionMenuItem icon={Send}            label="Envoyer" subtext="Vers un autre wallet UniPay" onClick={() => openForm({ kind: 'send', currency: 'CDF' })} />
        <ActionMenuItem icon={Repeat2}         label="Convertir vers USD" subtext="1 USD = 2 850 CDF, frais 0.5%" onClick={() => openForm({ kind: 'swap', from: 'CDF', to: 'USD' })} />
        <ActionMenuItem icon={Repeat2}         label="Convertir vers CGLT" subtext="Parité 1:1, sans frais" onClick={() => openForm({ kind: 'swap', from: 'CDF', to: 'CGLT' })} />
      </ActionMenu>

      <ActionMenu open={activeMenu === 'USD'} onClose={() => setActiveMenu(null)} title="Actions USD">
        <ActionMenuItem icon={ArrowDownCircle} label="Déposer" subtext="Unipesa (Airtel, Mpesa, Orange)" onClick={() => openForm({ kind: 'deposit-unipesa' })} />
        <ActionMenuItem icon={ArrowUpCircle}   label="Retirer" subtext="Unipesa" onClick={() => openForm({ kind: 'withdraw-unipesa' })} />
        <ActionMenuItem icon={Repeat2}         label="Convertir vers CDF" subtext="1 USD = 2 850 CDF, frais 0.5%" onClick={() => openForm({ kind: 'swap', from: 'USD', to: 'CDF' })} />
        <ActionMenuItem icon={Repeat2}         label="Convertir vers USDT" subtext="Parité 1:1, frais 0.5%" onClick={() => openForm({ kind: 'swap', from: 'USD', to: 'USDT' })} />
      </ActionMenu>

      <ActionMenu open={activeMenu === 'USDT'} onClose={() => setActiveMenu(null)} title="Actions USDT">
        <ActionMenuItem icon={Send}            label="Envoyer" subtext="Vers un autre wallet UniPay" onClick={() => openForm({ kind: 'send', currency: 'USDT' })} />
        <ActionMenuItem icon={ExternalLink}    label="Retrait Crypto (BSC)" subtext="Réseau Binance Smart Chain" isBlockchain onClick={() => openForm({ kind: 'crypto-withdraw' })} />
        <ActionMenuItem icon={Repeat2}         label="Convertir vers CGLT" subtext="1 USDT = 500 CGLT, frais 0.5%" onClick={() => openForm({ kind: 'swap', from: 'USDT', to: 'CGLT' })} />
      </ActionMenu>

      <ActionMenu open={activeMenu === 'CGLT'} onClose={() => setActiveMenu(null)} title="Actions CGLT">
        <ActionMenuItem icon={Repeat2}         label="Convertir vers USDT" subtext="1 USDT = 500 CGLT, frais 0.5%" onClick={() => openForm({ kind: 'swap', from: 'CGLT', to: 'USDT' })} />
        <ActionMenuItem icon={Link2}           label="Exporter vers BSC" subtext="Bridge CGLT → wCGLT (blockchain)" isBlockchain onClick={() => openForm({ kind: 'bridge-export' })} />
      </ActionMenu>

      {/* Full-screen form overlay */}
      {renderForm()}
    </div>
  );
}
