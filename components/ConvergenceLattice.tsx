'use client';

import { useId } from 'react';

type LatticeVariant = 'hero' | 'header' | 'accent';

interface ConvergenceLatticeProps {
  opacity?: number;
  scale?: number;
  variant?: LatticeVariant;
  className?: string;
}

const VARIANT_CONFIG: Record<LatticeVariant, { tileSize: number; nodes: boolean; density: number }> = {
  hero: { tileSize: 120, nodes: true, density: 1 },
  header: { tileSize: 60, nodes: false, density: 0.5 },
  accent: { tileSize: 80, nodes: true, density: 0.7 },
};

export default function ConvergenceLattice({
  opacity = 0.08,
  scale = 1,
  variant = 'hero',
  className = '',
}: ConvergenceLatticeProps) {
  const gradId = useId();
  const cfg = VARIANT_CONFIG[variant];
  const s = cfg.tileSize;

  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox={`0 0 ${s * 4} ${s * 4}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity, transform: `scale(${scale})` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Repeating Kuba-inspired angular lattice tile */}
      <g>
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => {
            const x = col * s;
            const y = row * s;
            const cx = x + s / 2;
            const cy = y + s / 2;
            const isCenter = row === 2 && col === 2;

            return (
              <g key={`${row}-${col}`} transform={`translate(${x}, ${y})`}>
                {/* Angular chevron frame — Kuba-inspired */}
                <path
                  d={`M ${s * 0.15} ${s * 0.15} L ${s * 0.5} ${s * 0.35} L ${s * 0.85} ${s * 0.15} L ${s * 0.65} ${s * 0.5} L ${s * 0.85} ${s * 0.85} L ${s * 0.5} ${s * 0.65} L ${s * 0.15} ${s * 0.85} L ${s * 0.35} ${s * 0.5} Z`}
                  stroke={`url(#${gradId})`}
                  strokeWidth={isCenter ? 2 : 1}
                  strokeOpacity={cfg.density}
                  fill="none"
                />

                {/* Inner diamond */}
                <path
                  d={`M ${cx} ${s * 0.32} L ${s * 0.68} ${cy} L ${cx} ${s * 0.68} L ${s * 0.32} ${cy} Z`}
                  stroke={`url(#${gradId})`}
                  strokeWidth={0.8}
                  strokeOpacity={cfg.density * 0.7}
                  fill="none"
                />

                {/* Convergence lines from tile corners to center — only for hero/accent */}
                {cfg.nodes && (
                  <>
                    <line x1={s * 0.1} y1={s * 0.1} x2={cx} y2={cy} stroke={`url(#${gradId})`} strokeWidth={0.5} strokeOpacity={cfg.density * 0.4} />
                    <line x1={s * 0.9} y1={s * 0.1} x2={cx} y2={cy} stroke={`url(#${gradId})`} strokeWidth={0.5} strokeOpacity={cfg.density * 0.4} />
                    <line x1={s * 0.1} y1={s * 0.9} x2={cx} y2={cy} stroke={`url(#${gradId})`} strokeWidth={0.5} strokeOpacity={cfg.density * 0.4} />
                    <line x1={s * 0.9} y1={s * 0.9} x2={cx} y2={cy} stroke={`url(#${gradId})`} strokeWidth={0.5} strokeOpacity={cfg.density * 0.4} />
                  </>
                )}

                {/* Center node dot — emphasized at lattice center */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isCenter ? 3 : 1.2}
                  fill="currentColor"
                  fillOpacity={isCenter ? 0.8 : cfg.density * 0.5}
                />
              </g>
            );
          })
        )}
      </g>
    </svg>
  );
}
