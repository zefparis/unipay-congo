'use client';

import { AlertTriangle } from 'lucide-react';

interface Props {
  onResolve: () => void;
}

export default function MigrationReviewBanner({ onResolve }: Props) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Cette ancienne facture doit être vérifiée avant de poursuivre.
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          Les informations de paiement historiques ne permettent pas de savoir automatiquement qui a payé ou si un remboursement a été reçu.
        </p>
        <button
          onClick={onResolve}
          className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium"
        >
          Vérifier les informations
        </button>
      </div>
    </div>
  );
}
