'use client';

import { motion } from 'framer-motion';

interface StabilityMeterProps {
  value: number; // 0-1
}

function getLabel(value: number): string {
  if (value >= 0.85) return 'Locked';
  if (value >= 0.6) return 'Steady';
  if (value >= 0.3) return 'Variable';
  return 'Unstable';
}

function getColor(value: number): string {
  if (value >= 0.85) return 'var(--color-success)';
  if (value >= 0.6) return 'var(--color-accent-primary)';
  if (value >= 0.3) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export function StabilityMeter({ value }: StabilityMeterProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-text-muted">Stability</span>
        <span className="font-mono text-xs text-text-secondary">
          {Math.round(value * 100)}% · {getLabel(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-mid">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getColor(value) }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
