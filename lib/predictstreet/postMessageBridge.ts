'use client';

import type { RefObject } from 'react';

/**
 * PredictStreet postMessage bridge — client-side only.
 *
 * Listens for PREDICTSTREET_SSO_TOKEN_REQUEST messages from the PredictStreet
 * iframe, fetches a signed JWT from /api/predictstreet/token, and posts it
 * back to the iframe using a strict targetOrigin.
 *
 * Security guarantees:
 *  - event.origin is validated against allowedOrigin before any action
 *  - token is never posted to '*' (always exact allowedOrigin)
 *  - nonce is echoed back so the iframe can correlate the response
 *  - fetch uses credentials:include so the httpOnly wallet_token is sent
 *  - cleanup function removes the event listener on unmount
 */

export interface PredictStreetBridgeOptions {
  /** Ref to the PredictStreet <iframe> element. */
  iframeRef: RefObject<HTMLIFrameElement>;
  /** Exact origin of the PredictStreet iframe, e.g. "https://app.predictstreet.com". */
  allowedOrigin: string;
  /** Called when a token fetch error occurs (optional, for UI feedback). */
  onError?: (message: string) => void;
}

/**
 * Initialise the bridge and return a cleanup function.
 *
 * Usage:
 *   useEffect(() => {
 *     return initPredictStreetBridge({ iframeRef, allowedOrigin });
 *   }, []);
 */
export function initPredictStreetBridge(
  options: PredictStreetBridgeOptions,
): () => void {
  const { iframeRef, allowedOrigin, onError } = options;

  const handler = async (event: MessageEvent) => {
    // ── Security: reject any message not from the known iframe origin ──
    if (event.origin !== allowedOrigin) return;

    // ── Only handle SSO token requests ────────────────────────────────
    const msg = event.data as { type?: string; nonce?: string } | null;
    if (!msg || msg.type !== 'PREDICTSTREET_SSO_TOKEN_REQUEST') return;

    const { nonce } = msg;

    try {
      const res = await fetch('/api/predictstreet/token', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include', // sends httpOnly wallet_token cookie
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        const errMsg = body.error ?? `Token endpoint returned ${res.status}`;
        onError?.(errMsg);
        return;
      }

      const { token } = await res.json() as { token: string };

      // ── Post token back — NEVER to '*' ──────────────────────────────
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) {
        onError?.('Iframe not ready');
        return;
      }

      iframe.contentWindow.postMessage(
        { type: 'PREDICTSTREET_SSO_TOKEN_RESPONSE', token, nonce },
        allowedOrigin, // strict targetOrigin
      );
    } catch (err) {
      onError?.((err as Error).message ?? 'Bridge error');
    }
  };

  window.addEventListener('message', handler);

  // Return cleanup function — call on component unmount
  return () => window.removeEventListener('message', handler);
}
