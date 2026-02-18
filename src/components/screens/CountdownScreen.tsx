'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCountdown } from '@/hooks/useCountdown';
import { useEffect } from 'react';

interface CountdownScreenProps {
  onComplete: () => void;
}

export function CountdownScreen({ onComplete }: CountdownScreenProps) {
  const { count, start } = useCountdown(3, onComplete);

  useEffect(() => {
    start();
  }, [start]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-deep/95 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4"
        >
          {count > 0 ? (
            <span className="font-display text-9xl font-light text-accent-primary">{count}</span>
          ) : (
            <span className="font-display text-6xl font-light text-accent-primary">Go</span>
          )}
        </motion.div>
      </AnimatePresence>
      <p className="mt-8 text-sm text-text-muted">Get ready to hum</p>
    </div>
  );
}
