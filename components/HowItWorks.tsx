'use client';

import { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

export default function HowItWorks() {
  const t = useTranslations('howitworks');
  const { resolvedTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only switch video after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lazy-load via IntersectionObserver — don't load video until section is near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // When theme changes, swap <source> cleanly without full reload flash
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !mounted || !visible) return;
    // Preserve playback position across the swap
    const time = v.currentTime;
    const wasPlaying = !v.paused;
    v.load(); // reload with new sources
    v.currentTime = time;
    if (wasPlaying) v.play().catch(() => {});
  }, [resolvedTheme, mounted, visible]);

  const isDark = mounted && resolvedTheme === 'dark';
  const variant = isDark ? 'dark' : 'light';

  return (
    <section
      ref={containerRef}
      className="py-20 bg-[#F5F7FA] dark:bg-navy border-t border-text-secondary/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy dark:text-text-primary mb-3 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-base text-navy/70 dark:text-text-secondary max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Video — centered, max-width ~960px, 16:9 ratio */}
        <div className="flex justify-center">
          <div className="w-full max-w-[960px]">
            {visible ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full rounded-xl border border-text-secondary/15 shadow-2xl shadow-black/30"
                aria-label={t('title')}
              >
                {/* webm first — lighter format */}
                <source src={`/videos/hero-${variant}.webm`} type="video/webm" />
                {/* mp4 fallback */}
                <source src={`/videos/hero-${variant}.mp4`} type="video/mp4" />
              </video>
            ) : (
              // Placeholder before lazy-load — maintains 16:9 ratio
              <div className="w-full aspect-video rounded-xl border border-text-secondary/15 bg-navy-panel/40 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
