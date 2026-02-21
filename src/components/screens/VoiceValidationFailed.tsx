'use client';

import { motion } from 'framer-motion';
import { MicOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface VoiceValidationFailedProps {
  voiceRatio: number;
  onRetry: () => void;
  onReset: () => void;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const tips = [
  'Find a quiet space away from background noise',
  'Hold your phone 15\u201320 cm from your mouth',
  'Hum a steady \u201Cahhh\u201D or \u201Commm\u201D for the full 15 seconds',
  'Try a lower, more sustained tone rather than speaking',
];

export function VoiceValidationFailed({ voiceRatio, onRetry, onReset }: VoiceValidationFailedProps) {
  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-[420px] space-y-6">
        {/* Icon */}
        <motion.div variants={fadeInUp} className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-warning/30 bg-bg-surface/80 backdrop-blur-sm">
            <MicOff size={28} className="text-warning" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={fadeInUp} className="text-center">
          <div className="mb-1 flex items-center justify-center gap-2 text-warning">
            <span className="font-mono text-xs tracking-wider uppercase">
              Not enough voice data
            </span>
          </div>
          <h2 className="font-display text-2xl font-light text-text-primary">
            We couldn&apos;t detect a clear voice in this recording
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Only {Math.round(voiceRatio * 100)}% of the recording contained a clear vocal signal.
            We need at least 20% for a meaningful analysis.
          </p>
        </motion.div>

        {/* Tips */}
        <motion.div variants={fadeInUp}>
          <Card>
            <p className="mb-3 text-[10px] tracking-wider text-text-dim uppercase">
              Tips for a better recording
            </p>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="mt-0.5 font-mono text-text-dim">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp} className="space-y-3">
          <Button onClick={onRetry} className="w-full py-4">
            <RotateCcw size={16} />
            Try Again
          </Button>
          <div className="flex justify-center">
            <Button variant="ghost" onClick={onReset}>
              Back to Start
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
