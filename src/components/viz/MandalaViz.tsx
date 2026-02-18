'use client';

import type { Overtone } from '@/lib/types';

interface MandalaVizProps {
  overtones: Overtone[];
  fundamental: number;
  chakraColor: string;
  isAnimating: boolean;
}

const NUM_PETALS = 12;
const CENTER_RADIUS = 32;
const RING_GAP = 8;
const BASE_RING_RADIUS = 48;

export function MandalaViz({ overtones, fundamental, chakraColor, isAnimating }: MandalaVizProps) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex items-center justify-center" role="img" aria-label="Mandala visualization">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
      >
        {/* Background glow */}
        <defs>
          <radialGradient id="mandala-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={chakraColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={chakraColor} stopOpacity="0" />
          </radialGradient>
          <filter id="mandala-blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={size / 2 - 10} fill="url(#mandala-glow)" />

        {/* Overtone rings */}
        {overtones.map((o, i) => {
          const radius = BASE_RING_RADIUS + i * RING_GAP;
          const amplitude = isAnimating ? o.amplitude : o.amplitude * 0.7;
          const strokeWidth = 1 + amplitude * 2;
          const opacity = 0.15 + amplitude * 0.5;

          return (
            <circle
              key={o.harmonic}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={chakraColor}
              strokeWidth={strokeWidth}
              opacity={opacity}
              style={
                isAnimating
                  ? {
                      animation: `breathe ${3 + i * 0.4}s ease-in-out infinite`,
                      transformOrigin: `${cx}px ${cy}px`,
                    }
                  : undefined
              }
            />
          );
        })}

        {/* Radial petals */}
        {Array.from({ length: NUM_PETALS }).map((_, i) => {
          const angle = (i * 360) / NUM_PETALS - 90;
          const rad = (angle * Math.PI) / 180;
          const overtoneAmp = overtones[i % overtones.length]?.amplitude || 0;
          const petalLength = isAnimating
            ? 20 + overtoneAmp * 40
            : 15 + overtoneAmp * 25;
          const innerR = BASE_RING_RADIUS - 6;
          const outerR = innerR + petalLength;

          const x1 = cx + innerR * Math.cos(rad);
          const y1 = cy + innerR * Math.sin(rad);
          const x2 = cx + outerR * Math.cos(rad);
          const y2 = cy + outerR * Math.sin(rad);

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={chakraColor}
              strokeWidth={1.5}
              opacity={0.3 + overtoneAmp * 0.5}
              strokeLinecap="round"
              style={
                isAnimating
                  ? {
                      animation: `breathe ${4 + (i % 3) * 0.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`,
                      transformOrigin: `${cx}px ${cy}px`,
                    }
                  : undefined
              }
            />
          );
        })}

        {/* Centre circle */}
        <circle
          cx={cx}
          cy={cy}
          r={CENTER_RADIUS}
          fill="var(--color-bg-card)"
          stroke={chakraColor}
          strokeWidth={1.5}
          opacity={0.9}
        />

        {/* Frequency text in centre */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="var(--color-text-primary)"
          fontSize="14"
          fontFamily="var(--font-mono)"
          fontWeight="500"
        >
          {fundamental > 0 ? fundamental.toFixed(1) : '—'}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize="8"
          fontFamily="var(--font-mono)"
        >
          Hz
        </text>
      </svg>
    </div>
  );
}
