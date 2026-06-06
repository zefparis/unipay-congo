import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UniPay Wallet — Votre portefeuille mobile',
  description: 'Déposez, retirez et envoyez de l\'argent avec UniPay Congo.',
};

interface WalletLayoutProps {
  children: React.ReactNode;
}

export default function WalletLayout({ children }: WalletLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {children}
    </div>
  );
}
