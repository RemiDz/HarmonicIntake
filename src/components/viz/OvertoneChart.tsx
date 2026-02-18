'use client';

import { motion } from 'framer-motion';
import type { Overtone } from '@/lib/types';

interface OvertoneChartProps {
  overtones: Overtone[];
  animate?: boolean;
}

export function OvertoneChart({ overtones, animate = true }: OvertoneChartProps) {
  if (overtones.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center text-text-dim text-xs">
        No overtone data
      </div>
    );
  }

  return (
    <div className="space-y-1.5" role="img" aria-label="Overtone harmonics chart">
      {overtones.map((o) => (
        <div key={o.harmonic} className="flex items-center gap-2">
          <span className="w-6 text-right font-mono text-[10px] text-text-dim">H{o.harmonic}</span>
          <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-bg-mid">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(to right, var(--color-accent-primary), var(--color-accent-secondary))`,
              }}
              initial={animate ? { width: 0 } : false}
              animate={{ width: `${Math.max(1, o.amplitude * 100)}%` }}
              transition={{ duration: animate ? 0.3 : 0, ease: 'easeOut' }}
            />
          </div>
          <span className="w-8 text-right font-mono text-[10px] text-text-muted">
            {Math.round(o.amplitude * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
