'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface CountdownScreenProps {
  onComplete: () => void;
}

/**
 * Breathing guide that replaces the old 3-2-1 countdown.
 * Flow: inhale (3s) → exhale (2s) → "Now hum..." (1.2s) → auto-start recording.
 */
export function CountdownScreen({ onComplete }: CountdownScreenProps) {
  const [phase, setPhase] = useState<'inhale' | 'exhale' | 'hum'>('inhale');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Inhale 3s → Exhale 2s → Hum prompt 1.2s → start
    const t1 = setTimeout(() => setPhase('exhale'), 3000);
    const t2 = setTimeout(() => setPhase('hum'), 5000);
    const t3 = setTimeout(() => onCompleteRef.current(), 6200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const circleScale = phase === 'inhale' ? 1.6 : phase === 'exhale' ? 0.9 : 1.0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-deep/95 backdrop-blur-sm">
      {/* Breathing circle */}
      <motion.div
        className="mb-10 flex items-center justify-center rounded-full"
        style={{
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(79,168,214,0.25) 0%, rgba(79,168,214,0.05) 70%, transparent 100%)',
          border: '1px solid rgba(79,168,214,0.3)',
        }}
        animate={{
          scale: circleScale,
          borderColor:
            phase === 'hum'
              ? 'rgba(90,191,123,0.5)'
              : 'rgba(79,168,214,0.3)',
        }}
        transition={{
          scale: {
            duration: phase === 'inhale' ? 3 : phase === 'exhale' ? 2 : 0.4,
            ease: 'easeInOut',
          },
          borderColor: { duration: 0.4 },
        }}
      >
        <motion.div
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: 'rgba(79,168,214,0.6)',
          }}
          animate={{
            scale: phase === 'inhale' ? 2.5 : phase === 'exhale' ? 0.8 : 1.2,
            opacity: phase === 'hum' ? 0.8 : 0.5,
          }}
          transition={{
            duration: phase === 'inhale' ? 3 : phase === 'exhale' ? 2 : 0.4,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Text guidance */}
      <AnimatePresence mode="wait">
        {phase !== 'hum' ? (
          <motion.p
            key="breathe"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="font-display text-xl font-light text-text-secondary"
          >
            Take a deep breath&hellip;
          </motion.p>
        ) : (
          <motion.p
            key="hum"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="font-display text-xl font-light text-success"
          >
            Now hum your most natural tone&hellip;
          </motion.p>
        )}
      </AnimatePresence>

      {/* Subtle phase indicator */}
      <motion.p
        className="mt-4 font-mono text-[10px] tracking-wider text-text-dim uppercase"
        animate={{ opacity: phase === 'hum' ? 0 : 0.6 }}
        transition={{ duration: 0.3 }}
      >
        {phase === 'inhale' ? 'Breathe in' : phase === 'exhale' ? 'Breathe out' : ''}
      </motion.p>
    </div>
  );
}
