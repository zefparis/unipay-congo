'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Conformité KYC : tant que access_status ≠ 'active' (dossier incomplet
 * ou en attente de validation), le portail n'affiche QUE la page KYC.
 * Toute autre page dashboard redirige vers /dashboard/kyc.
 * L'API applique la même règle (403 { code: 'KYC_REQUIRED' }) — ceci
 * n'est que la couche UX.
 */
export default function KycAccessGuard({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'active' | 'blocked'>('loading');

  const isKycPage = pathname.endsWith('/dashboard/kyc');

  useEffect(() => {
    if (isAdmin) { setStatus('active'); return; }
    fetch('/api/merchant/kyc')
      .then(async (r) => {
        if (!r.ok) { setStatus('active'); return; } // session expirée → le flux normal gère
        const data = await r.json().catch(() => ({})) as { access_status?: string };
        setStatus((data.access_status ?? 'active') === 'active' ? 'active' : 'blocked');
      })
      .catch(() => setStatus('active'));
  }, [isAdmin]);

  useEffect(() => {
    if (status === 'blocked' && !isKycPage) {
      router.replace(pathname.startsWith('/en') ? '/en/dashboard/kyc' : '/fr/dashboard/kyc');
    }
  }, [status, isKycPage, pathname, router]);

  if (status === 'loading' && !isKycPage) {
    return <div className="flex items-center justify-center py-24 text-sm text-gray-400">Chargement…</div>;
  }
  if (status === 'blocked' && !isKycPage) {
    return null; // redirection en cours
  }
  return <>{children}</>;
}
