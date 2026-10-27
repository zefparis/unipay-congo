'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[unipay] unhandled client error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center bg-gray-50 dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-2">
          Une erreur est survenue
        </h1>
        <p className="text-sm text-gray-500 dark:text-text-secondary mb-6">
          L’affichage de cette page a échoué. Vos données sont en sécurité.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-green-deep hover:bg-green-deep/85 text-white text-sm font-semibold transition-all"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-text-secondary/20 text-sm text-gray-600 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-navy-panel transition-all"
          >
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
