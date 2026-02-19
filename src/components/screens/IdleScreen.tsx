'use client';

import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VoiceWaveform } from '@/components/viz/VoiceWaveform';

interface IdleScreenProps {
  onStart: () => void;
  error?: string | null;
}

const steps = [
  { num: '01', text: 'Hum a comfortable, sustained tone into your device' },
  { num: '02', text: 'Hold for 15 seconds while we analyse the frequency' },
  { num: '03', text: 'Receive your personalised Frequency Profile' },
];

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function IdleScreen({ onStart, error }: IdleScreenProps) {
  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-[420px] space-y-8 text-center">
        {/* Tagline */}
        <motion.p
          variants={fadeInUp}
          className="font-mono text-xs tracking-[0.3em] text-text-muted uppercase"
        >
          Voice · Frequency · Insight
        </motion.p>

        {/* Title */}
        <motion.h1
          variants={fadeInUp}
          className="text-shimmer font-display text-5xl font-light leading-tight"
        >
          Harmonic
          <br />
          Intake
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={fadeInUp} className="text-sm text-text-secondary">
          Real-time vocal frequency analysis for practitioners
        </motion.p>

        {/* Ambient waveform */}
        <motion.div variants={fadeInUp}>
          <VoiceWaveform
            timeDomainData={null}
            rmsEnergy={0}
            fundamental={0}
            overtoneRichness={0}
            jitter={0}
            shimmer={0}
            chakraColor="#4FA8D6"
            isRecording={false}
            isResult={false}
            height={120}
          />
        </motion.div>

        {/* Steps card */}
        <motion.div variants={fadeInUp}>
          <Card>
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.num} className="flex items-start gap-3 text-left">
                  <span className="font-mono text-xs text-accent-primary">{step.num}</span>
                  <p className="text-sm text-text-secondary">{step.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            variants={fadeInUp}
            className="rounded-xl border border-error/20 bg-error/5 p-3 text-sm text-error"
          >
            {error}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div variants={fadeInUp}>
          <Button onClick={onStart} className="w-full py-4 text-base">
            <Mic size={18} />
            Begin Analysis
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p variants={fadeInUp} className="text-xs text-text-dim">
          No data stored · Works entirely in your browser
        </motion.p>
      </div>
    </motion.div>
  );
}
