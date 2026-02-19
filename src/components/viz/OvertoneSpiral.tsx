'use client';

import { motion } from 'framer-motion';
import type { Overtone } from '@/lib/types';

interface OvertoneSpirallProps {
  overtones: Overtone[];
  fundamental: number;
}

const CX = 140;
const CY = 140;
const MAX_R = 110;
const MIN_R = 20;
const NUM_HARMONICS = 8;

const HARMONIC_COLORS = [
  '#d8e8f5', // H1 — fundamental (white)
  '#F5D547', // H2 — octave (gold)
  '#4FA8D6', // H3 — fifth (blue)
  '#F5D547', // H4 — 2nd octave (gold)
  '#5ABF7B', // H5 — major third (green)
  '#4FA8D6', // H6 — fifth (blue)
  '#7B6DB5', // H7 — minor seventh (purple)
  '#F5D547', // H8 — 3rd octave (gold)
];

const HARMONIC_LABELS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'];

function getAngle(index: number): number {
  return (index / NUM_HARMONICS) * Math.PI * 2 - Math.PI / 2;
}

function polarToXY(angle: number, radius: number): { x: number; y: number } {
  return {
    x: CX + Math.cos(angle) * radius,
    y: CY + Math.sin(angle) * radius,
  };
}

export function OvertoneSpiral({ overtones, fundamental }: OvertoneSpirallProps) {
  // Build amplitudes array: H1=1.0 (fundamental), H2-H8 from overtones
  const amplitudes: number[] = [1.0];
  for (let h = 2; h <= 8; h++) {
    const ot = overtones.find((o) => o.harmonic === h);
    amplitudes.push(ot ? ot.amplitude : 0);
  }

  // Calculate polygon points and line endpoints
  const points = amplitudes.map((amp, i) => {
    const angle = getAngle(i);
    const radius = MIN_R + amp * (MAX_R - MIN_R);
    return polarToXY(angle, radius);
  });

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center">
      <svg width="280" height="280" viewBox="0 0 280 280" className="overflow-visible">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1.0].map((frac) => (
          <circle
            key={frac}
            cx={CX}
            cy={CY}
            r={MIN_R + frac * (MAX_R - MIN_R)}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* Radial guide lines */}
        {Array.from({ length: NUM_HARMONICS }).map((_, i) => {
          const angle = getAngle(i);
          const outer = polarToXY(angle, MAX_R + 4);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--color-border)"
              strokeWidth="0.5"
              opacity="0.2"
            />
          );
        })}

        {/* Filled polygon (fingerprint shape) */}
        <motion.path
          d={polygonPath}
          fill="none"
          stroke="var(--color-accent-primary)"
          strokeWidth="1.5"
          opacity="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
        <motion.path
          d={polygonPath}
          fill="var(--color-accent-primary)"
          opacity="0.08"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        />

        {/* Harmonic lines and dots */}
        {amplitudes.map((amp, i) => {
          const angle = getAngle(i);
          const radius = MIN_R + amp * (MAX_R - MIN_R);
          const end = polarToXY(angle, radius);
          const labelPos = polarToXY(angle, MAX_R + 18);

          return (
            <g key={i}>
              {/* Line from center */}
              <motion.line
                x1={CX}
                y1={CY}
                x2={end.x}
                y2={end.y}
                stroke={HARMONIC_COLORS[i]}
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ x2: CX, y2: CY }}
                animate={{ x2: end.x, y2: end.y }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.08 }}
              />

              {/* Dot at tip */}
              <motion.circle
                cx={end.x}
                cy={end.y}
                r="4"
                fill={HARMONIC_COLORS[i]}
                initial={{ r: 0, opacity: 0 }}
                animate={{ r: 4, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              />
              <motion.circle
                cx={end.x}
                cy={end.y}
                r="8"
                fill={HARMONIC_COLORS[i]}
                opacity="0.2"
                initial={{ r: 0, opacity: 0 }}
                animate={{ r: 8, opacity: 0.2 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              />

              {/* Label */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-text-dim font-mono text-[9px]"
              >
                {HARMONIC_LABELS[i]}
              </text>
            </g>
          );
        })}

        {/* Center circle */}
        <circle cx={CX} cy={CY} r={MIN_R - 2} fill="var(--color-bg-card)" stroke="var(--color-border)" strokeWidth="1" />
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          className="fill-text-secondary font-mono text-[10px]"
        >
          {Math.round(fundamental)}
        </text>
        <text
          x={CX}
          y={CY + 8}
          textAnchor="middle"
          className="fill-text-dim font-mono text-[8px]"
        >
          Hz
        </text>
      </svg>
    </div>
  );
}
