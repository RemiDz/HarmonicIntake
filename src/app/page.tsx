'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { AmbientOrbs } from '@/components/ui/AmbientOrbs';
import { IdleScreen } from '@/components/screens/IdleScreen';
import { CountdownScreen } from '@/components/screens/CountdownScreen';
import { LiveScreen } from '@/components/screens/LiveScreen';
import { ResultScreen } from '@/components/screens/ResultScreen';

export default function Home() {
  const { screen, realTimeData, profile, error, start, stop, reset, beginRecording } =
    useAudioAnalysis();

  // Only use accent colour on the result screen (fixed, not flickering)
  const accentColor = screen === 'complete' ? profile?.dominantChakra.color : undefined;

  return (
    <main className="relative min-h-screen">
      <AmbientOrbs accentColor={accentColor} />

      <AnimatePresence mode="wait">
        {screen === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <IdleScreen onStart={start} error={error} />
          </motion.div>
        )}

        {screen === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CountdownScreen onComplete={beginRecording} />
          </motion.div>
        )}

        {screen === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LiveScreen data={realTimeData} onStop={stop} />
          </motion.div>
        )}

        {screen === 'complete' && profile && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ResultScreen profile={profile} onReset={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
