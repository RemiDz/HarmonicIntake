'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { ParticleField } from '@/components/ui/ParticleField';
import { IdleScreen } from '@/components/screens/IdleScreen';
import { CountdownScreen } from '@/components/screens/CountdownScreen';
import { LiveScreen } from '@/components/screens/LiveScreen';
import { AnalysingScreen } from '@/components/screens/AnalysingScreen';
import { ResultScreen } from '@/components/screens/ResultScreen';
import { ComparisonScreen } from '@/components/screens/ComparisonScreen';
import { MicPermissionScreen } from '@/components/screens/MicPermissionScreen';

// Transition variants per screen
const idleVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
};

const micPermissionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const countdownVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const recordingVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.4 } },
};

const analysingVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.4 } },
};

const resultVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function Home() {
  const {
    screen,
    realTimeData,
    profile,
    previousProfile,
    error,
    start,
    stop,
    reset,
    beginRecording,
    confirmMicPermission,
    startComparison,
    backToOriginalResults,
  } = useAudioAnalysis();

  // Accent colour for particles
  const particleAccent =
    screen === 'recording'
      ? realTimeData.currentChakra?.color
      : screen === 'analysing' || screen === 'complete'
        ? profile?.dominantChakra.color
        : undefined;

  // Show comparison screen when both profiles exist on the complete screen
  const showComparison = screen === 'complete' && profile && previousProfile;

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

        {screen === 'mic-permission' && (
          <motion.div
            key="mic-permission"
            variants={micPermissionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <MicPermissionScreen onConfirm={confirmMicPermission} error={error} />
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

        {screen === 'analysing' && profile && (
          <motion.div
            key="analysing"
            variants={analysingVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <AnalysingScreen
              frozenWaveform={profile.frozenWaveform}
              chakraColor={profile.dominantChakra.color}
            />
          </motion.div>
        )}

        {screen === 'complete' && profile && !showComparison && (
          <motion.div
            key="complete"
            variants={resultVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ResultScreen
              profile={profile}
              onReset={reset}
              onCompare={startComparison}
            />
          </motion.div>
        )}

        {showComparison && (
          <motion.div
            key="comparison"
            variants={resultVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ComparisonScreen
              before={previousProfile}
              after={profile}
              onReset={reset}
              onBackToResults={backToOriginalResults}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
