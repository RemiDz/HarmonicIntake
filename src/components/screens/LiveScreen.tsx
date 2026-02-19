'use client';

import { motion } from 'framer-motion';
import type { RealTimeData } from '@/lib/types';
import { VoiceWaveform } from '@/components/viz/VoiceWaveform';
import { MandalaViz } from '@/components/viz/MandalaViz';
import { SpectrumBar } from '@/components/viz/SpectrumBar';
import { OvertoneChart } from '@/components/viz/OvertoneChart';
import { StabilityMeter } from '@/components/viz/StabilityMeter';
import { ChakraLiveDots } from '@/components/viz/ChakraLiveDots';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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

          {/* Circular timer */}
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
                stroke="var(--color-accent-primary)"
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
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
          fundamental={data.currentHz}
          overtoneRichness={data.overtones.length > 0
            ? data.overtones.reduce((sum, o) => sum + o.amplitude, 0) / data.overtones.length
            : 0}
          jitter={Math.min(data.liveJitterRelative / 2, 1)}
          shimmer={0}
          chakraColor={data.currentChakra?.color || '#4FA8D6'}
          chakraScores={data.chakraScores}
          isRecording={true}
          isResult={false}
          height={200}
        />

        {/* Mandala with live chakra dots */}
        <div className="relative">
          <MandalaViz
            overtones={data.overtones}
            fundamental={data.currentHz}
            chakraColor={data.currentChakra?.color || 'var(--color-accent-primary)'}
            isAnimating={true}
          />
          {/* Live chakra dots on the right side */}
          {data.chakraScores.length > 0 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <ChakraLiveDots scores={data.chakraScores} />
            </div>
          )}
        </div>

        {/* Frequency + Note */}
        <div className="text-center">
          <p className="font-mono text-4xl font-medium text-text-primary">
            {data.currentHz > 0 ? `${data.currentHz}` : '—'}
            <span className="ml-1 text-lg text-text-muted">Hz</span>
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

        {/* Spectrum */}
        <Card className="p-4">
          <p className="mb-2 text-[10px] tracking-wider text-text-dim uppercase">Spectrum</p>
          <SpectrumBar data={data.spectrumData} />
        </Card>

        {/* Overtones */}
        <Card className="p-4">
          <p className="mb-2 text-[10px] tracking-wider text-text-dim uppercase">Overtones</p>
          <OvertoneChart overtones={data.overtones} />
        </Card>

        {/* Stability + Live Biomarkers */}
        <Card className="p-4">
          <StabilityMeter value={data.stability} />
          {(data.liveHnr > 0 || data.liveJitterRelative > 0) && (
            <div className="mt-3 flex gap-4 border-t border-border pt-3">
              {data.liveHnr > 0 && (
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-text-dim">Clarity</p>
                  <p className="mt-0.5 font-mono text-sm text-text-primary">
                    {data.liveHnr} dB
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {data.liveHnr >= 28 ? 'Clear' : data.liveHnr >= 20 ? 'Warm' : 'Soft'}
                  </p>
                </div>
              )}
              {data.liveJitterRelative > 0 && (
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-text-dim">Steadiness</p>
                  <p className="mt-0.5 font-mono text-sm text-text-primary">
                    {data.liveJitterRelative}%
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {data.liveJitterRelative < 0.5 ? 'Calm' : data.liveJitterRelative < 1.0 ? 'Natural' : 'Fluid'}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

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
