'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[unipay] dashboard client error:', error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto mt-16 text-center bg-white dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-8 shadow-sm">
      <h1 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-2">
        Une erreur est survenue
      </h1>
      <p className="text-sm text-gray-500 dark:text-text-secondary mb-6">
        Cette section du dashboard n’a pas pu s’afficher.
        Vos données sont en sécurité — vous pouvez réessayer ou recharger la page.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-green-deep hover:bg-green-deep/85 text-white text-sm font-semibold transition-all"
        >
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all"
        >
          Vue d’ensemble
        </Link>
      </div>
    </div>
  );
}
