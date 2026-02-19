'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ChakraScore } from '@/lib/types';

interface ChakraBodyMapProps {
  scores: ChakraScore[];
}

const STAGGER = 0.12; // 120ms between each chakra

/** Counts from 0 → value over 600ms with ease-out, starting after delay ms */
function CountingScore({ value, delay }: { value: number; delay: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 600;
    const timeout = setTimeout(() => {
      const start = performance.now();
      let raf: number;
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(value * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return <>{display}%</>;
}

/** Map score (0-100) to opacity (≈0.4 at 30% → 1.0 at 100%) */
function scoreToOpacity(score: number): number {
  return Math.max(0.3, 0.15 + (score / 100) * 0.85);
}

export function ChakraBodyMap({ scores }: ChakraBodyMapProps) {
  // Display: Crown at top → Root at bottom
  // Animation: Root (bottom) first → Crown (top) last
  const reversed = [...scores].map((s, i) => ({ ...s, origIdx: i })).reverse();

  return (
    <div className="relative mx-auto w-fit" role="img" aria-label="Chakra energy centres">
      {/* Spine line connecting circle centres */}
      <div
        className="absolute w-px"
        style={{
          left: 'calc(3.5rem + 10px)',
          top: '14px',
          bottom: '14px',
          backgroundColor: 'var(--color-border)',
          opacity: 0.3,
        }}
      />

      <div className="flex flex-col gap-3 py-1">
        {reversed.map((score) => {
          const delay = score.origIdx * STAGGER;
          const opacity = scoreToOpacity(score.score);

          return (
            <motion.div
              key={score.name}
              className="relative z-10 flex items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay }}
            >
              {/* Score — left */}
              <span className="w-14 pr-3 text-right font-mono text-[11px] text-text-secondary">
                <CountingScore value={score.score} delay={delay * 1000} />
              </span>

              {/* Circle */}
              <div
                className="h-5 w-5 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: score.color,
                  opacity,
                  boxShadow: `0 0 4px ${score.color}`,
                }}
              />

              {/* Name — right */}
              <span className="pl-3 font-mono text-[10px] text-text-muted">
                {score.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
