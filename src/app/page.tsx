'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { ParticleField } from '@/components/ui/ParticleField';
import { IdleScreen } from '@/components/screens/IdleScreen';
import { CountdownScreen } from '@/components/screens/CountdownScreen';
import { LiveScreen } from '@/components/screens/LiveScreen';
import { ResultScreen } from '@/components/screens/ResultScreen';

// Transition variants per screen
const idleVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
};

const countdownVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const recordingVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3 } },
};

const resultVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function Home() {
  const { screen, realTimeData, profile, error, start, stop, reset, beginRecording } =
    useAudioAnalysis();

  // Accent colour for particles
  const particleAccent =
    screen === 'recording'
      ? realTimeData.currentChakra?.color
      : screen === 'complete'
        ? profile?.dominantChakra.color
        : undefined;

  return (
    <main className="relative min-h-screen">
      <ParticleField
        mode={screen}
        accentColor={particleAccent}
        rmsEnergy={realTimeData.rmsEnergy}
      />

      <AnimatePresence mode="wait">
        {screen === 'idle' && (
          <motion.div
            key="idle"
            variants={idleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <IdleScreen onStart={start} error={error} />
          </motion.div>
        )}

        {screen === 'countdown' && (
          <motion.div
            key="countdown"
            variants={countdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <CountdownScreen onComplete={beginRecording} />
          </motion.div>
        )}

        {screen === 'recording' && (
          <motion.div
            key="recording"
            variants={recordingVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <LiveScreen data={realTimeData} onStop={stop} />
          </motion.div>
        )}

        {screen === 'complete' && profile && (
          <motion.div
            key="complete"
            variants={resultVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ResultScreen profile={profile} onReset={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
