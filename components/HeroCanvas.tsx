'use client';

import { useEffect, useRef } from 'react';

/**
 * Animated particle network background for the Hero section.
 *
 * - Canvas + requestAnimationFrame (vanilla, no external lib)
 * - N particles drifting slowly, connected by lines when close
 * - Horizontal mask: 0% opacity on left third (text zone), full on right third
 * - Pauses when: tab hidden, hero out of viewport, or prefers-reduced-motion
 * - Resizes with window, no particles stuck off-frame
 * - Theme-aware: gold/green in dark, navy/blue-gray in light
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const CONNECT_DISTANCE = 200; // px — max distance for line between particles
const PARTICLE_RADIUS = 2;    // px

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── State ──────────────────────────────────────────────────
    let particles: Particle[] = [];
    let rafId: number | null = null;
    let isVisible = true;
    let isTabVisible = true;
    let isReducedMotion = false;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // ── Theme detection ────────────────────────────────────────
    const getIsDark = () => {
      return document.documentElement.classList.contains('dark');
    };
    let isDark = getIsDark();

    // ── Particle count based on viewport ───────────────────────
    const getParticleCount = () => {
      return width > 1024 ? 70 : 35;
    };

    // ── Init particles ─────────────────────────────────────────
    const initParticles = () => {
      const count = getParticleCount();
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6, // ~0.3 px/frame at 60fps ≈ 18px/s
          vy: (Math.random() - 0.5) * 0.6,
        });
      }
    };

    // ── Resize ─────────────────────────────────────────────────
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for perf
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Keep particles in bounds after resize
      for (const p of particles) {
        if (p.x > width) p.x = Math.random() * width;
        if (p.y > height) p.y = Math.random() * height;
      }

      // Re-init if count changed
      if (particles.length !== getParticleCount()) {
        initParticles();
      }
    };

    // ── Draw ───────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Theme colors
      // Dark: #F59E0B (amber/orange) points — warm, vivid, visible on navy
      // Light: #0A1930 (navy) points — visible on light bg
      const pointColor = isDark ? 'rgba(245,158,11,' : 'rgba(10,25,48,';  // #F59E0B or #0A1930
      const pointAlpha = isDark ? 0.60 : 0.38;   // +50% from 0.40/0.25
      const lineColor = isDark ? 'rgba(15,110,86,' : 'rgba(124,147,172,';  // #0F6E56 or #7C93AC
      const lineMaxAlpha = isDark ? 0.38 : 0.23; // +50% from 0.25/0.15

      // ── Update particle positions (if animating) ──────────────
      if (!isReducedMotion) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          // Bounce off edges
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          // Clamp to bounds
          p.x = Math.max(0, Math.min(width, p.x));
          p.y = Math.max(0, Math.min(height, p.y));
        }
      }

      // ── Draw connecting lines ─────────────────────────────────
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            // Opacity fades from lineMaxAlpha at dist=0 to 0 at dist=CONNECT_DISTANCE
            const alpha = lineMaxAlpha * (1 - dist / CONNECT_DISTANCE);

            // Horizontal mask: 0% on left third, ramp to full at right third
            const midX = (particles[i].x + particles[j].x) / 2;
            const maskStart = width / 3;       // 33% — text zone ends
            const maskEnd = (width * 2) / 3;   // 66% — full intensity starts
            let maskOpacity = 1;
            if (midX < maskStart) {
              maskOpacity = 0;
            } else if (midX < maskEnd) {
              maskOpacity = (midX - maskStart) / (maskEnd - maskStart);
            }

            if (maskOpacity > 0) {
              ctx.strokeStyle = lineColor + (alpha * maskOpacity).toFixed(3) + ')';
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // ── Draw particles ────────────────────────────────────────
      for (const p of particles) {
        // Horizontal mask for points too
        const maskStart = width / 3;
        const maskEnd = (width * 2) / 3;
        let maskOpacity = 1;
        if (p.x < maskStart) {
          maskOpacity = 0;
        } else if (p.x < maskEnd) {
          maskOpacity = (p.x - maskStart) / (maskEnd - maskStart);
        }

        if (maskOpacity > 0) {
          ctx.fillStyle = pointColor + (pointAlpha * maskOpacity).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // ── Animation loop ─────────────────────────────────────────
    const animate = () => {
      draw();
      if (!isReducedMotion && isVisible && isTabVisible) {
        rafId = requestAnimationFrame(animate);
      }
    };

    const startAnimation = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // ── Reduced motion: draw one static frame, no loop ─────────
    const handleReducedMotion = () => {
      isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (isReducedMotion) {
        stopAnimation();
        draw(); // single static frame
      } else if (isVisible && isTabVisible) {
        startAnimation();
      }
    };

    // ── Visibility (IntersectionObserver) ──────────────────────
    const section = canvas.parentElement;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
        if (isVisible && isTabVisible && !isReducedMotion) {
          startAnimation();
        } else {
          stopAnimation();
        }
      },
      { threshold: 0 },
    );
    if (section) visibilityObserver.observe(section);

    // ── Tab visibility ─────────────────────────────────────────
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && isVisible && !isReducedMotion) {
        startAnimation();
      } else {
        stopAnimation();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Reduced motion listener ────────────────────────────────
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', handleReducedMotion);

    // ── Theme change listener ──────────────────────────────────
    const themeObserver = new MutationObserver(() => {
      const newIsDark = getIsDark();
      if (newIsDark !== isDark) {
        isDark = newIsDark;
        draw(); // redraw with new colors
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // ── Resize listener ────────────────────────────────────────
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        draw();
      }, 150);
    };
    window.addEventListener('resize', handleResize);

    // ── Initialize ─────────────────────────────────────────────
    isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resize();
    initParticles();
    if (!isReducedMotion) {
      startAnimation();
    } else {
      draw(); // static frame
    }

    // ── Cleanup ────────────────────────────────────────────────
    return () => {
      stopAnimation();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotion);
      themeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
