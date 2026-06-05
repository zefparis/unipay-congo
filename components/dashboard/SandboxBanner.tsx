'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FlaskConical, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function SandboxBanner() {
  const t = useTranslations('dashboard.sandbox');
  const [isSandbox, setIsSandbox] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/merchant/mode')
      .then((r) => r.ok ? r.json() : null)
      .then((d: { mode?: string } | null) => {
        if (d?.mode === 'sandbox') setIsSandbox(true);
      })
      .catch(() => {});
  }, []);

  if (!isSandbox || dismissed) return null;

  return (
    <div className="w-full bg-amber-400 dark:bg-amber-500/90 text-amber-900 dark:text-amber-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical size={14} className="flex-shrink-0" />
          <p className="text-xs font-semibold truncate">{t('banner_sandbox')}</p>
          <Link
            href="/dashboard/sandbox"
            className="hidden sm:inline text-xs underline underline-offset-2 hover:no-underline font-medium flex-shrink-0"
          >
            {t('switch_to_live')} →
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex-shrink-0 p-1 rounded hover:bg-amber-500/30 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
