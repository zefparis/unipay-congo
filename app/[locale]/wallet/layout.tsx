import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import WalletNavGate from './_components/WalletNavGate';

export const metadata: Metadata = {
  title: 'UniPay Wallet — Votre portefeuille mobile',
  description: "Déposez, retirez et envoyez de l'argent avec UniPay Congo.",
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const isLoggedIn = !!cookieStore.get('wallet_token')?.value;

  // TODO(diagnostic): remove after ~1 week of production monitoring.
  // Traces the recurring "bottom nav visible on login page" bug — if this logs
  // isLoggedIn=true while a user reports seeing the nav on /wallet/login, the
  // cause is a lingering wallet_token (piste A); if the server never logs during
  // the incident, a stale SW/CDN cache served the page (piste B).
  console.log('[WalletLayout]', { isLoggedIn });

  return (
    <div className="min-h-screen bg-bone">
      <WalletNavGate isLoggedIn={isLoggedIn}>{children}</WalletNavGate>
    </div>
  );
}
