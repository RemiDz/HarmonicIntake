'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChakraScore } from '@/lib/types';

interface ChakraBodyMapProps {
  scores: ChakraScore[];
  dominantName?: string;
}

const STAGGER = 0.12;

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

/** Map score (0-100) to opacity */
function scoreToOpacity(score: number): number {
  return Math.max(0.3, 0.15 + (score / 100) * 0.85);
}

const CHAKRA_SUGGESTIONS: Record<string, string> = {
  Root: 'Deep humming, grounding breathwork, and low-frequency singing bowls.',
  Sacral: 'Flowing vocal exercises, rhythmic chanting, and warm percussion.',
  'Solar Plexus': 'Confident, projected toning and empowering mantras.',
  Heart: 'Open-hearted humming, gentle singing, and harmonious group toning.',
  Throat: 'Free vocal expression, humming, and crystal singing bowls.',
  'Third Eye': 'High-pitched toning, overtone singing, and meditation with bells.',
  Crown: 'Silence between tones, ethereal overtone work, and crystal bowls.',
};

export function ChakraBodyMap({ scores, dominantName }: ChakraBodyMapProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Display: Crown at top → Root at bottom
  // Animation: Root (bottom) first → Crown (top) last
  const reversed = [...scores].map((s, i) => ({ ...s, origIdx: i })).reverse();

  return (
    <div className="relative mx-auto w-full max-w-[340px]" role="img" aria-label="Chakra energy centres">
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

      <div className="flex flex-col gap-1 py-1">
        {reversed.map((score) => {
          const delay = score.origIdx * STAGGER;
          const opacity = scoreToOpacity(score.score);
          const isDominant = score.name === dominantName;
          const isExpanded = expanded === score.name;

          return (
            <motion.div
              key={score.name}
              className="relative z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay }}
            >
              {/* Clickable row */}
              <button
                className="flex w-full items-center rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-bg-mid/50"
                onClick={() => setExpanded(isExpanded ? null : score.name)}
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
                    boxShadow: isDominant
                      ? `0 0 8px ${score.color}, 0 0 16px ${score.color}40`
                      : `0 0 4px ${score.color}`,
                    animation: isDominant ? 'pulse-dot 2s ease-in-out infinite' : undefined,
                  }}
                />

                {/* Name + label — right */}
                <span className="flex-1 pl-3 font-mono text-[10px] text-text-muted">
                  {score.name}
                </span>
                <span className="pr-1 font-mono text-[9px] text-text-dim">
                  {score.label}
                </span>
              </button>

              {/* Expandable detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="ml-[3.5rem] mr-2 mt-1 mb-2 overflow-hidden rounded-lg border border-border/50 bg-bg-mid/40 px-3 py-2.5"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <p className="text-[11px] leading-relaxed text-text-secondary">
                      {score.description}
                    </p>
                    <p className="mt-2 text-[10px] text-text-dim">
                      <span className="text-text-muted">Suggestion:</span>{' '}
                      {CHAKRA_SUGGESTIONS[score.name] || ''}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
