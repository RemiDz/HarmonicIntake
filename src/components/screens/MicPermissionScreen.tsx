'use client';

import { motion } from 'framer-motion';
import { Mic, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MicPermissionScreenProps {
  onConfirm: () => void;
  error: string | null;
}

export function MicPermissionScreen({ onConfirm, error }: MicPermissionScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-[420px] text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Mic icon with pulse */}
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
          {/* Pulse rings */}
          <span className="animate-mic-pulse absolute inset-0 rounded-full border border-accent-primary/20" />
          <span className="animate-mic-pulse-delayed absolute inset-2 rounded-full border border-accent-primary/15" />
          {/* Icon container */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-border bg-bg-surface/80 backdrop-blur-sm">
            <Mic size={28} className={error ? 'text-error' : 'text-accent-primary'} />
          </div>
        </div>

        {error ? (
          <>
            {/* Denied state */}
            <div className="mb-3 flex items-center justify-center gap-2 text-error">
              <AlertCircle size={16} />
              <span className="font-mono text-xs tracking-wider uppercase">Access Denied</span>
            </div>
            <h2 className="font-display mb-4 text-2xl font-light text-text-primary">
              Microphone access was denied
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-text-secondary">
              Open your browser settings to allow microphone access, then try again.
            </p>
            <Button onClick={onConfirm} className="w-full">
              Try Again
            </Button>
          </>
        ) : (
          <>
            {/* Normal state */}
            <h2 className="font-display mb-4 text-2xl font-light text-text-primary">
              Microphone Access
            </h2>
            <p className="mb-2 text-sm leading-relaxed text-text-secondary">
              Harmonic Intake needs your microphone to analyse your voice.
            </p>
            <p className="mb-8 text-xs text-text-muted">
              Your voice is processed locally — nothing is recorded or sent anywhere.
            </p>
            <Button onClick={onConfirm} className="w-full">
              Enable Microphone
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
