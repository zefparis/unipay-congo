'use client';

import { useEffect, useState } from 'react';

/**
 * Fixed bottom-right pill badge showing that the site is protected by
 * Cloudflare Edge Workers + HCS-U7 network filtering.
 *
 * Replaces the default HCS-U7 widget badge (hidden via data-badge="false")
 * with more prudent wording — "Cognitive Firewall" over-promised a
 * behavioral scoring layer that is not yet reliable. The network
 * protection (Cloudflare + HCS-U7 Edge) is real and worth displaying.
 */
export default function ProtectionBadge() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!mounted) return null;

  const dark = isDark;

  return (
    <div
      aria-label="Site protégé — Infrastructure sécurisée"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '20px',
        background: dark ? 'rgba(6,14,26,0.92)' : 'rgba(255,255,255,0.95)',
        border: dark
          ? '1px solid rgba(14,165,233,0.4)'
          : '1px solid rgba(27,61,111,0.2)',
        boxShadow: dark
          ? '0 4px 20px rgba(14,165,233,0.2)'
          : '0 4px 20px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        userSelect: 'none',
        fontFamily:
          "-apple-system, system-ui, 'Segoe UI', sans-serif",
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>
        🛡️
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontSize: '11px',
            fontWeight: 600,
            color: '#10B981',
            letterSpacing: '0.08em',
            lineHeight: '1.3',
          }}
        >
          PROTÉGÉ
        </span>
        <span
          style={{
            fontSize: '10px',
            color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(13,27,42,0.5)',
            letterSpacing: '0.02em',
            lineHeight: '1.3',
          }}
        >
          Cloudflare + HCS-U7
        </span>
      </div>
    </div>
  );
}
