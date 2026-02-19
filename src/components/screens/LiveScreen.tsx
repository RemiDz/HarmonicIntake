'use client';

import { motion } from 'framer-motion';
import type { RealTimeData } from '@/lib/types';
import VoiceWaveform from '@/components/viz/VoiceWaveform';
import { ChakraLiveDots } from '@/components/viz/ChakraLiveDots';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface LiveScreenProps {
  data: RealTimeData;
  onStop: () => void;
  duration?: number;
}

export function LiveScreen({ data, onStop, duration = 15 }: LiveScreenProps) {
  const progress = Math.min(data.elapsed / duration, 1);
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference * (1 - progress);
  const timerColor = data.currentChakra?.color || 'var(--color-accent-primary)';

  return (
    <motion.div
      className="flex min-h-screen flex-col items-center px-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-[420px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="animate-pulse-dot h-2.5 w-2.5 rounded-full bg-error" />
            <span className="font-mono text-xs text-text-secondary">Listening</span>
          </div>

          {/* Circular timer — colour matches dominant chakra */}
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg className="absolute -rotate-90" width="60" height="60" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r="28"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="2"
              />
              <circle
                cx="30"
                cy="30"
                r="28"
                fill="none"
                stroke={timerColor}
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease' }}
              />
            </svg>
            <span className="font-mono text-xs text-text-secondary">
              {Math.ceil(duration - data.elapsed)}s
            </span>
          </div>
        </div>

        {/* Voice Waveform — hero visual */}
        <VoiceWaveform
          timeDomainData={data.timeDomainData}
          rmsEnergy={data.rmsEnergy}
          chakraColor={data.currentChakra?.color || '#4FA8D6'}
          mode="recording"
          height={220}
        />

        {/* Frequency + Note */}
        <div className="text-center">
          <p className="font-mono text-5xl font-medium text-text-primary">
            {data.currentHz > 0 ? `${data.currentHz}` : '\u2014'}
            <span className="ml-1 text-xl text-text-muted">Hz</span>
          </p>
          {data.currentNote && (
            <p className="mt-1 font-mono text-sm text-text-secondary">
              {data.currentNote.note}
              {data.currentNote.octave}
              <span
                className={`ml-2 ${
                  data.currentNote.cents > 0
                    ? 'text-success'
                    : data.currentNote.cents < 0
                      ? 'text-warning'
                      : 'text-text-muted'
                }`}
              >
                {data.currentNote.cents > 0 ? '+' : ''}
                {data.currentNote.cents}¢
              </span>
            </p>
          )}
        </div>

        {/* Chakra badge */}
        {data.currentChakra && (
          <div className="flex justify-center">
            <Badge label={`${data.currentChakra.name} Chakra`} color={data.currentChakra.color} />
          </div>
        )}

        {/* Live chakra dots */}
        {data.chakraScores.length > 0 && (
          <div className="flex justify-center">
            <ChakraLiveDots scores={data.chakraScores} />
          </div>
        )}

        {/* End early */}
        <div className="flex justify-center pt-2">
          <Button variant="ghost" onClick={onStop}>
            End Early
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
