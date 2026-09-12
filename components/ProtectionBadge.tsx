'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Fixed bottom-right pill badge showing that the site is protected by
 * Cloudflare Edge Workers + HCS-U7 network filtering.
 *
 * Replaces the default HCS-U7 widget badge (hidden via data-badge="false")
 * with more prudent wording — "Cognitive Firewall" over-promised a
 * behavioral scoring layer that is not yet reliable. The network
 * protection (Cloudflare + HCS-U7 Edge) is real and worth displaying.
 *
 * Responsive behavior:
 *   - Desktop (≥640px): full badge always visible (icon + text).
 *   - Mobile (<640px): collapsed to icon-only by default to avoid
 *     overlapping content/buttons. Expands on tap to reveal the text,
 *     auto-collapses after 3s. Positioned 16px from edges (avoids
 *     iOS safe-area gesture zone).
 */
export default function ProtectionBadge() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mqDark.matches);
    const darkHandler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mqDark.addEventListener('change', darkHandler);

    const mqMobile = window.matchMedia('(max-width: 639px)');
    setIsMobile(mqMobile.matches);
    const mobileHandler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setExpanded(false);
    };
    mqMobile.addEventListener('change', mobileHandler);

    return () => {
      mqDark.removeEventListener('change', darkHandler);
      mqMobile.removeEventListener('change', mobileHandler);
    };
  }, []);

  // Auto-collapse after 3s on mobile when expanded
  useEffect(() => {
    if (!isMobile || !expanded) return;
    const timer = setTimeout(() => setExpanded(false), 3000);
    return () => clearTimeout(timer);
  }, [isMobile, expanded]);

  const handleClick = useCallback(() => {
    if (isMobile) setExpanded((prev) => !prev);
  }, [isMobile]);

  if (!mounted) return null;

  const dark = isDark;
  const showText = !isMobile || expanded;

  return (
    <div
      aria-label="Site protégé — Infrastructure sécurisée"
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: showText ? '8px' : '0',
        padding: showText ? '8px 14px' : '8px',
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
        cursor: isMobile ? 'pointer' : 'default',
        fontFamily: "-apple-system, system-ui, 'Segoe UI', sans-serif",
        maxWidth: 'calc(100vw - 32px)',
        transition: 'gap 0.2s ease, padding 0.2s ease',
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>
        🛡️
      </span>
      {showText && (
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
      )}
    </div>
  );
}
