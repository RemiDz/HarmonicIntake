'use client';

import { Play, Square, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlayableToneProps {
  id: string;
  label: string;
  note: string;
  frequency: number;
  description: string;
  duration: number;
  binaural?: boolean;
  isPlaying: boolean;
  progress: number;
  accentColor: string;
  onPlay: () => void;
  onStop: () => void;
}

export function PlayableTone({
  label,
  note,
  frequency,
  description,
  duration,
  binaural = false,
  isPlaying,
  progress,
  accentColor,
  onPlay,
  onStop,
}: PlayableToneProps) {
  const remaining = Math.ceil(duration * (1 - progress));

  return (
    <div className="rounded-xl border border-border bg-bg-card/60 p-3">
      {/* Header row */}
      <div className="mb-1.5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-primary">{label}</p>
          <p className="font-mono text-sm text-text-secondary">
            {note} — {Math.round(frequency * 10) / 10} Hz
          </p>
        </div>
        {binaural && (
          <Headphones size={14} className="mt-0.5 text-text-dim" />
        )}
      </div>

      {/* Description */}
      <p className="mb-3 text-[11px] leading-relaxed text-text-muted">{description}</p>

      {/* Play button + progress */}
      <div className="flex items-center gap-3">
        <button
          onClick={isPlaying ? onStop : onPlay}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors"
          style={{
            backgroundColor: isPlaying ? `${accentColor}30` : `${accentColor}20`,
            color: accentColor,
          }}
          aria-label={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? <Square size={12} /> : <Play size={12} className="ml-0.5" />}
        </button>

        {/* Progress bar */}
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-bg-mid">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: accentColor }}
            animate={{ width: isPlaying ? `${progress * 100}%` : '0%' }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Duration / remaining */}
        <span className="w-8 text-right font-mono text-[10px] text-text-dim">
          {isPlaying ? `${remaining}s` : `${duration}s`}
        </span>
      </div>

      {/* Binaural headphones note */}
      {binaural && (
        <p className="mt-2 text-[9px] text-text-dim">
          Use headphones for the binaural effect
        </p>
      )}
    </div>
  );
}
