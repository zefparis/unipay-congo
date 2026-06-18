'use client';

/**
 * /[locale]/wallet/gaming — PredictStreet gaming page.
 *
 * Renders the PredictStreet iframe and initialises the postMessage bridge
 * so the iframe can request a signed SSO JWT without the user doing anything.
 *
 * Protected by middleware (wallet_token cookie required).
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, AlertCircle, Loader2, Info } from 'lucide-react';
import { initPredictStreetBridge } from '../../../../lib/predictstreet/postMessageBridge';

const IFRAME_URL    = process.env.NEXT_PUBLIC_PREDICTSTREET_IFRAME_URL    ?? '';
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_PREDICTSTREET_ALLOWED_ORIGIN ?? '';

type PageState = 'loading' | 'ready' | 'error';

export default function GamingPage() {
  const { locale } = useParams<{ locale: string }>();
  const router     = useRouter();
  const iframeRef  = useRef<HTMLIFrameElement>(null);

  const [state,    setState]    = useState<PageState>('loading');
  const [errMsg,   setErrMsg]   = useState('');
  const [iframeOk, setIframeOk] = useState(false);

  // ── Auth guard: redirect to login if wallet_token cookie is absent ────
  // (middleware already does this server-side; this is a belt-and-suspenders
  //  client-side check for edge cases like an expired token.)
  useEffect(() => {
    fetch('/api/wallet/balance', { cache: 'no-store' }).then((r) => {
      if (r.status === 401) {
        router.replace(`/${locale}/wallet/login`);
      } else {
        setState('ready');
      }
    }).catch(() => {
      setErrMsg('Impossible de vérifier la session.');
      setState('error');
    });
  }, [locale, router]);

  // ── postMessage bridge ────────────────────────────────────────────────
  useEffect(() => {
    if (state !== 'ready' || !ALLOWED_ORIGIN) return;

    const cleanup = initPredictStreetBridge({
      iframeRef,
      allowedOrigin: ALLOWED_ORIGIN,
      onError: (msg) => {
        console.warn('[gaming] bridge error:', msg);
        setErrMsg(`Erreur d'authentification gaming : ${msg}`);
      },
    });

    return cleanup;
  }, [state]);

  // ── Config guard ──────────────────────────────────────────────────────
  if (!IFRAME_URL || !ALLOWED_ORIGIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-700 font-semibold">Service gaming non configuré.</p>
        <p className="text-sm text-gray-500">NEXT_PUBLIC_PREDICTSTREET_IFRAME_URL ou NEXT_PUBLIC_PREDICTSTREET_ALLOWED_ORIGIN manquant.</p>
        <Link href={`/${locale}/wallet`} className="text-green-600 text-sm underline">← Retour au wallet</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <Link href={`/${locale}/wallet`} className="p-1 text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft size={20} />
        </Link>
        <Gamepad2 size={20} className="text-[#00A651]" />
        <span className="font-semibold text-gray-800 text-sm">Gaming — PredictStreet</span>
      </header>

      {/* ── Info banner ───────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 mx-4 mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs">
        <Info size={14} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold mb-0.5">Dépôts & Retraits</p>
          <p>Vos gains sont crédités sur votre solde UniPay Wallet. Pour déposer ou retirer, utilisez la section&nbsp;
            <Link href={`/${locale}/wallet/deposit`} className="underline font-semibold">Dépôt</Link>
            &nbsp;ou&nbsp;
            <Link href={`/${locale}/wallet/withdraw`} className="underline font-semibold">Retrait</Link>
            &nbsp;de votre wallet.
          </p>
        </div>
      </div>

      {/* ── Iframe container ──────────────────────────────────────────── */}
      <div className="relative flex-1 mx-4 my-3 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm min-h-[520px]">

        {/* Loading overlay */}
        {(state === 'loading' || !iframeOk) && state !== 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white z-10">
            <Loader2 size={32} className="animate-spin text-[#00A651]" />
            <p className="text-sm text-gray-500">Chargement de l&apos;espace gaming…</p>
          </div>
        )}

        {/* Error overlay */}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white z-10 px-6 text-center">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm text-gray-700 font-semibold">Une erreur est survenue</p>
            {errMsg && <p className="text-xs text-gray-500">{errMsg}</p>}
            <button
              onClick={() => { setState('loading'); setIframeOk(false); setErrMsg(''); window.location.reload(); }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#00A651] text-white text-sm font-semibold hover:bg-[#009040] transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* PredictStreet iframe — rendered only when session is verified */}
        {state === 'ready' && (
          <iframe
            ref={iframeRef}
            src={IFRAME_URL}
            title="PredictStreet Gaming"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="w-full h-full min-h-[520px] border-0"
            onLoad={() => setIframeOk(true)}
            onError={() => {
              setErrMsg('Impossible de charger la plateforme gaming.');
              setState('error');
            }}
          />
        )}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-gray-400 pb-4 px-4">
        Powered by PredictStreet · Les paris impliquent un risque de perte · Jouez de manière responsable.
      </p>

    </div>
  );
}
