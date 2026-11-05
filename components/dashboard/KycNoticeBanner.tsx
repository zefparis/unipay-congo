'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Bandeau préavis (cas c) : affiché en permanence sur toutes les pages
 * tant que kyc_deadline est dans le futur et access_status='active'.
 * Disparaît dès que le dossier est complet/validé (API renvoie null).
 */
export default function KycNoticeBanner({ isAdmin }: { isAdmin: boolean }) {
  const [deadline, setDeadline] = useState<string | null>(null);
  const pathname = usePathname();
  const locale = pathname.startsWith('/en') ? 'en' : 'fr';

  useEffect(() => {
    if (isAdmin) return;
    fetch('/api/merchant/kyc')
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json().catch(() => ({})) as { access_status?: string; kyc_deadline?: string | null };
        if (d.access_status === 'active' && d.kyc_deadline && new Date(d.kyc_deadline).getTime() > Date.now()) {
          setDeadline(d.kyc_deadline);
        } else {
          setDeadline(null);
        }
      })
      .catch(() => {});
  }, [isAdmin, pathname]);

  if (!deadline) return null;
  const dateFr = new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40 px-4 py-2.5 text-sm text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 flex-wrap text-center">
      <span>
        ⚠️ Dossier de vérification à compléter avant le <strong>{dateFr}</strong>.
        Votre compte sera suspendu à cette date sans les documents.
      </span>
      <Link href={`/${locale}/dashboard/kyc`} className="font-semibold underline underline-offset-2 hover:text-amber-700">
        Envoyer les documents →
      </Link>
    </div>
  );
}
