'use client';

interface ConvergenceDiagramProps {
  className?: string;
  size?: number;
}

export default function ConvergenceDiagram({ className = '', size = 120 }: ConvergenceDiagramProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="4 réseaux convergent vers 1 API UniPay"
    >
      {/* 4 outer nodes — positioned at N, E, S, W */}
      {[
        { x: 60, y: 12 },
        { x: 108, y: 60 },
        { x: 60, y: 108 },
        { x: 12, y: 60 },
      ].map((node, i) => (
        <g key={i}>
          {/* Connection line to center */}
          <line
            x1={node.x}
            y1={node.y}
            x2={60}
            y2={60}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeOpacity={0.4}
            strokeDasharray="4 3"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-14"
              dur={`${2 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </line>
          {/* Node circle */}
          <circle cx={node.x} cy={node.y} r={7} fill="currentColor" fillOpacity={0.15} stroke="currentColor" strokeWidth={1.5} />
          <circle cx={node.x} cy={node.y} r={3} fill="currentColor" fillOpacity={0.6} />
        </g>
      ))}

      {/* Central node — UniPay API */}
      <circle cx={60} cy={60} r={14} fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={2} />
      <circle cx={60} cy={60} r={6} fill="currentColor" fillOpacity={0.7}>
        <animate attributeName="r" values="6;7.5;6" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
