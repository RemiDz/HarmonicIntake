'use client';

import { motion } from 'framer-motion';
import { RotateCcw, ArrowRight } from 'lucide-react';
import type { FrequencyProfile } from '@/lib/types';
import VoiceWaveform from '@/components/viz/VoiceWaveform';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ComparisonScreenProps {
  before: FrequencyProfile;
  after: FrequencyProfile;
  onReset: () => void;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function delta(a: number, b: number): string {
  const diff = b - a;
  if (diff > 0) return `+${Math.round(diff)}`;
  return `${Math.round(diff)}`;
}

function directionWord(a: number, b: number): string {
  if (b > a + 1) return 'increased';
  if (b < a - 1) return 'decreased';
  return 'stayed steady';
}

function generateChangeSummary(before: FrequencyProfile, after: FrequencyProfile): string[] {
  const lines: string[] = [];

  const stabBefore = Math.round(before.stability * 100);
  const stabAfter = Math.round(after.stability * 100);
  if (Math.abs(stabAfter - stabBefore) > 2) {
    lines.push(`Stability ${directionWord(stabBefore, stabAfter)} from ${stabBefore}% to ${stabAfter}%.`);
  }

  if (Math.abs(after.richness - before.richness) > 3) {
    lines.push(`Overtone richness ${directionWord(before.richness, after.richness)} from ${before.richness}% to ${after.richness}%.`);
  }

  const hnrBefore = Math.round(before.voiceProfile.hnr);
  const hnrAfter = Math.round(after.voiceProfile.hnr);
  if (Math.abs(hnrAfter - hnrBefore) > 2) {
    lines.push(`Vocal clarity ${directionWord(hnrBefore, hnrAfter)} from ${hnrBefore} dB to ${hnrAfter} dB.`);
  }

  if (before.dominantChakra.name !== after.dominantChakra.name) {
    lines.push(`Dominant chakra shifted from ${before.dominantChakra.name} to ${after.dominantChakra.name}.`);
  }

  const freqDiff = Math.abs(after.fundamental - before.fundamental);
  if (freqDiff > 5) {
    lines.push(`Fundamental frequency moved from ${before.fundamental} Hz to ${after.fundamental} Hz.`);
  }

  if (lines.length === 0) {
    lines.push('Your voice profile remained consistent between recordings.');
  }

  return lines;
}

export function ComparisonScreen({ before, after, onReset }: ComparisonScreenProps) {
  const changes = generateChangeSummary(before, after);

  // Merge chakra scores for comparison (both arrays have same order)
  const chakraPairs = before.chakraScores.map((bs, i) => ({
    name: bs.name,
    color: bs.color,
    before: bs.score,
    after: after.chakraScores[i]?.score ?? 0,
  }));
  // Display Crown → Root
  const chakraPairsReversed = [...chakraPairs].reverse();

  return (
    <motion.div
      className="flex min-h-screen flex-col items-center px-6 py-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-[420px] space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center">
          <div className="mb-1 flex items-center justify-center gap-2 text-accent-primary">
            <ArrowRight size={16} />
            <span className="font-mono text-xs tracking-wider uppercase">Before &amp; After</span>
          </div>
          <h2 className="font-display text-3xl font-light text-text-primary">
            Voice Comparison
          </h2>
        </motion.div>

        {/* Waveforms side by side */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="space-y-3">
              <div>
                <p className="mb-1 font-mono text-[10px] text-text-dim">Before</p>
                <VoiceWaveform
                  timeDomainData={before.frozenWaveform}
                  rmsEnergy={before.voiceProfile.rmsEnergy}
                  chakraColor={before.dominantChakra.color}
                  mode="result"
                  height={80}
                />
              </div>
              <div>
                <p className="mb-1 font-mono text-[10px] text-text-dim">After</p>
                <VoiceWaveform
                  timeDomainData={after.frozenWaveform}
                  rmsEnergy={after.voiceProfile.rmsEnergy}
                  chakraColor={after.dominantChakra.color}
                  mode="result"
                  height={80}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Key metrics comparison */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <p className="mb-3 text-[10px] tracking-wider text-text-dim uppercase">Key Metrics</p>
            <div className="space-y-3">
              <MetricRow
                label="Fundamental"
                before={`${before.fundamental} Hz`}
                after={`${after.fundamental} Hz`}
                change={delta(before.fundamental, after.fundamental)}
                improved={after.fundamental > 0}
              />
              <MetricRow
                label="Stability"
                before={`${Math.round(before.stability * 100)}%`}
                after={`${Math.round(after.stability * 100)}%`}
                change={delta(before.stability * 100, after.stability * 100)}
                improved={after.stability >= before.stability}
              />
              <MetricRow
                label="Clarity (HNR)"
                before={`${Math.round(before.voiceProfile.hnr)} dB`}
                after={`${Math.round(after.voiceProfile.hnr)} dB`}
                change={delta(before.voiceProfile.hnr, after.voiceProfile.hnr)}
                improved={after.voiceProfile.hnr >= before.voiceProfile.hnr}
              />
              <MetricRow
                label="Richness"
                before={`${before.richness}%`}
                after={`${after.richness}%`}
                change={delta(before.richness, after.richness)}
                improved={after.richness >= before.richness}
              />
            </div>
          </Card>
        </motion.div>

        {/* Chakra comparison */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <p className="mb-3 text-[10px] tracking-wider text-text-dim uppercase">
              Chakra Comparison
            </p>
            <div className="space-y-2.5">
              {chakraPairsReversed.map((pair) => (
                <div key={pair.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: pair.color }}
                      />
                      <span className="font-mono text-[10px] text-text-muted">{pair.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-text-dim">
                      {pair.before}% → {pair.after}%
                    </span>
                  </div>
                  {/* Overlaid bars */}
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-bg-mid">
                    {/* Before bar (dimmer) */}
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: pair.color, opacity: 0.3 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, pair.before)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                    {/* After bar (brighter, narrower to show overlay) */}
                    <motion.div
                      className="absolute left-0 top-[2px] bottom-[2px] rounded-full"
                      style={{ backgroundColor: pair.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(2, pair.after)}%` }}
                      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-2 flex items-center gap-4 pt-1 text-[9px] text-text-dim">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-4 rounded-full bg-text-dim opacity-40" /> Before
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1 w-4 rounded-full bg-text-dim" /> After
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Change Summary */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <p className="mb-3 text-[10px] tracking-wider text-text-dim uppercase">
              Change Summary
            </p>
            <div className="space-y-2">
              {changes.map((line, i) => (
                <p key={i} className="text-xs leading-relaxed text-text-secondary">
                  {line}
                </p>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Dominant chakra shift */}
        {before.dominantChakra.name !== after.dominantChakra.name && (
          <motion.div variants={fadeInUp}>
            <Card className="p-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-1 h-4 w-4 rounded-full"
                    style={{ backgroundColor: before.dominantChakra.color }}
                  />
                  <p className="font-mono text-[10px] text-text-muted">{before.dominantChakra.name}</p>
                  <p className="text-[9px] text-text-dim">Before</p>
                </div>
                <ArrowRight size={14} className="text-text-dim" />
                <div className="text-center">
                  <div
                    className="mx-auto mb-1 h-4 w-4 rounded-full"
                    style={{
                      backgroundColor: after.dominantChakra.color,
                      boxShadow: `0 0 8px ${after.dominantChakra.color}`,
                    }}
                  />
                  <p className="font-mono text-[10px] text-text-muted">{after.dominantChakra.name}</p>
                  <p className="text-[9px] text-text-dim">After</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div variants={fadeInUp} className="flex justify-center">
          <Button variant="ghost" onClick={onReset}>
            <RotateCcw size={16} />
            New Analysis
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={fadeInUp}
          className="pb-8 text-center text-[10px] tracking-wider text-text-dim uppercase"
        >
          Harmonic Intake · No data stored · Browser only
        </motion.p>
      </div>
    </motion.div>
  );
}

/** Comparison metric row */
function MetricRow({
  label,
  before,
  after,
  change,
  improved,
}: {
  label: string;
  before: string;
  after: string;
  change: string;
  improved: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-text-dim">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-text-muted">{before}</span>
        <ArrowRight size={10} className="text-text-dim" />
        <span className="font-mono text-[10px] text-text-secondary">{after}</span>
        <span
          className={`font-mono text-[9px] ${
            change.startsWith('+') ? 'text-success' : change.startsWith('-') ? 'text-warning' : 'text-text-dim'
          }`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}
