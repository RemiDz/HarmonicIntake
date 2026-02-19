'use client';

import { motion } from 'framer-motion';

interface VoiceQualityBarProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  /** 0-100 position on the spectrum (0 = left label, 100 = right label) */
  position: number;
  description: string;
  color: string;
  delay?: number;
}

export function VoiceQualityBar({
  label,
  leftLabel,
  rightLabel,
  position,
  description,
  color,
  delay = 0,
}: VoiceQualityBarProps) {
  const clamped = Math.max(0, Math.min(100, position));

  return (
    <motion.div
      className="rounded-xl border border-border bg-bg-card/60 p-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-text-primary">{label}</p>
        <p className="font-mono text-[10px] text-text-muted">
          {clamped < 35 ? leftLabel : clamped > 65 ? rightLabel : 'Balanced'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative mb-1.5 h-2 overflow-hidden rounded-full bg-bg-mid">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(to right, ${color}40, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.2 }}
        />
      </div>

      {/* Spectrum labels */}
      <div className="mb-2 flex justify-between">
        <span className="text-[9px] text-text-dim">{leftLabel}</span>
        <span className="text-[9px] text-text-dim">{rightLabel}</span>
      </div>

      {/* Description */}
      <p className="text-[11px] leading-relaxed text-text-secondary">{description}</p>
    </motion.div>
  );
}
