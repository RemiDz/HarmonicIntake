'use client';

import { motion } from 'framer-motion';
import type { ChakraScore } from '@/lib/types';

interface ChakraBodyMapProps {
  scores: ChakraScore[];
}

// Chakra positions on the body silhouette (y-positions from top to bottom)
const POSITIONS = [
  { y: 280, label: 'Root' },
  { y: 245, label: 'Sacral' },
  { y: 210, label: 'Solar Plexus' },
  { y: 170, label: 'Heart' },
  { y: 135, label: 'Throat' },
  { y: 100, label: 'Third Eye' },
  { y: 70, label: 'Crown' },
];

export function ChakraBodyMap({ scores }: ChakraBodyMapProps) {
  // Scores are Root→Crown, positions are Root(bottom)→Crown(top)
  const orderedScores = [...scores].reverse();

  return (
    <div className="flex items-center justify-center" role="img" aria-label="Chakra body map">
      <svg width="280" height="340" viewBox="0 0 280 340">
        {/* Subtle body silhouette */}
        <defs>
          <linearGradient id="body-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-text-dim)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--color-text-dim)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Simple body outline — head + torso + center line */}
        <ellipse cx="140" cy="58" rx="22" ry="26" fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.4" />
        <path
          d="M 118 80 Q 100 100 95 140 Q 90 200 100 260 Q 110 300 140 310 Q 170 300 180 260 Q 190 200 185 140 Q 180 100 162 80"
          fill="url(#body-gradient)"
          stroke="var(--color-border)"
          strokeWidth="1"
          opacity="0.3"
        />
        {/* Center spine line */}
        <line x1="140" y1="75" x2="140" y2="295" stroke="var(--color-border)" strokeWidth="1" opacity="0.15" />

        {/* Chakra points */}
        {orderedScores.map((score, i) => {
          const pos = POSITIONS[i];
          if (!pos) return null;

          const radius = 8 + (score.score / 100) * 16; // 8-24px
          const opacity = 0.3 + (score.score / 100) * 0.7; // 0.3-1.0
          const glowRadius = radius * 2.5;

          return (
            <g key={score.name}>
              {/* Glow */}
              <motion.circle
                cx={140}
                cy={pos.y}
                r={glowRadius}
                fill={score.color}
                opacity={opacity * 0.15}
                initial={{ r: 0 }}
                animate={{ r: glowRadius }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              />
              {/* Main circle */}
              <motion.circle
                cx={140}
                cy={pos.y}
                r={radius}
                fill={score.color}
                opacity={opacity}
                initial={{ r: 0 }}
                animate={{ r: radius }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              />
              {/* Score text — left side */}
              <motion.text
                x={82}
                y={pos.y + 4}
                textAnchor="end"
                fill="var(--color-text-secondary)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                {score.score}%
              </motion.text>
              {/* Label — right side */}
              <motion.text
                x={198}
                y={pos.y + 4}
                fill="var(--color-text-muted)"
                fontSize="9"
                fontFamily="var(--font-mono)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                {pos.label}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
