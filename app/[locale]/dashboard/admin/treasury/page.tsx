'use client';

import CryptoReceiptsSection from './CryptoReceiptsSection';
import CryptoAssetsSection    from './CryptoAssetsSection';
import { Landmark } from 'lucide-react';

/* ── Main page ───────────────────────────────────────────────── */

export default function TreasuryPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-text-primary flex items-center gap-2">
          <Landmark size={22} className="text-purple-400" />
          Trésorerie Crypto
        </h1>
        <p className="text-sm text-gray-500 dark:text-text-secondary mt-1">
          Gestion des actifs crypto et paiements on-chain
        </p>
      </div>

      {/* ── 1. Actifs crypto treasury ─────────────────────────────── */}
      <CryptoAssetsSection />

      {/* ── 2. Paiements factures crypto ────────────────────────────── */}
      <CryptoReceiptsSection />

    </div>
  );
}
