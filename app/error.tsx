'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-navy px-4">
      <div className="w-full max-w-md text-center bg-gray-50 dark:bg-navy-panel/60 border border-gray-200 dark:border-text-secondary/15 rounded-2xl p-8 shadow-xl">
        <h1 className="text-xl font-serif font-bold text-gray-900 dark:text-text-primary mb-2">
          Une erreur est survenue
        </h1>
        <p className="text-sm text-gray-500 dark:text-text-secondary mb-6">
          Quelque chose s’est mal passé lors de l’affichage de cette page.
          Vos données sont en sécurité — réessayez ou revenez plus tard.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-green-deep hover:bg-green-deep/85 text-white text-sm font-semibold transition-all"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
