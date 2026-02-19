'use client';

import { motion } from 'framer-motion';
import VoiceWaveform from '@/components/viz/VoiceWaveform';

interface AnalysingScreenProps {
  frozenWaveform: Float32Array | null;
  chakraColor: string;
}

export function AnalysingScreen({ frozenWaveform, chakraColor }: AnalysingScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-[420px] space-y-8">
        {/* Frozen waveform with a gentle pulse */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <VoiceWaveform
            timeDomainData={frozenWaveform}
            rmsEnergy={0.3}
            chakraColor={chakraColor}
            mode="result"
            height={160}
          />
        </motion.div>

        {/* Shimmer text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p
            className="font-display text-xl font-light"
            style={{
              background: `linear-gradient(90deg, ${chakraColor}80, ${chakraColor}, ${chakraColor}80)`,
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer-text 2s ease-in-out infinite',
            }}
          >
            Analysing your voice&hellip;
          </p>
        </motion.div>
      </div>
    </div>
  );
}
