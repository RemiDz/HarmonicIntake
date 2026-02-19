'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { RotateCcw, Sparkles, FileText, Share2, Mail } from 'lucide-react';
import type { FrequencyProfile } from '@/lib/types';
import VoiceWaveform from '@/components/viz/VoiceWaveform';
import { OvertoneChart } from '@/components/viz/OvertoneChart';
import { ChakraBodyMap } from '@/components/viz/ChakraBodyMap';
import { ChakraBarChart } from '@/components/viz/ChakraBarChart';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CountingNumber } from '@/components/ui/CountingNumber';
import { generateHTMLReport } from '@/lib/share/generate-report';
import { generateShareCard } from '@/lib/share/generate-card';
import { formatHumanEmailSubject, formatHumanEmailBody } from '@/lib/profile/humanize';
import {
  getStabilityLabel,
  getRichnessLabel,
  getInstrumentSuggestion,
} from '@/lib/profile/recommendations';
import {
  getJitterDescription,
  getShimmerDescription,
  getHnrDescription,
  getPitchRangeDescription,
} from '@/lib/profile/humanize';

interface ResultScreenProps {
  profile: FrequencyProfile;
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

export function ResultScreen({ profile, onReset }: ResultScreenProps) {
  const stabilityPct = Math.round(profile.stability * 100);
  const vp = profile.voiceProfile;
  const [generatingCard, setGeneratingCard] = useState(false);

  const handleViewReport = () => generateHTMLReport(profile);

  const handleShareCard = async () => {
    if (generatingCard) return;
    setGeneratingCard(true);
    try {
      await generateShareCard(profile);
    } finally {
      setGeneratingCard(false);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(formatHumanEmailSubject(profile));
    const body = encodeURIComponent(formatHumanEmailBody(profile));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

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
            <Sparkles size={16} />
            <span className="font-mono text-xs tracking-wider uppercase">Analysis Complete</span>
          </div>
          <h2 className="font-display text-3xl font-light text-text-primary">
            Frequency Profile
          </h2>
          <p className="mt-1 font-mono text-[10px] text-text-dim">
            {profile.timestamp.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            ·{' '}
            {profile.timestamp.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </motion.div>

        {/* Voice Signature waveform (frozen snapshot) */}
        <motion.div variants={fadeInUp}>
          <VoiceWaveform
            timeDomainData={profile.frozenWaveform}
            rmsEnergy={profile.voiceProfile.rmsEnergy}
            chakraColor={profile.dominantChakra.color}
            mode="result"
            height={120}
          />
        </motion.div>

        {/* 3-column metrics with counting numbers */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] tracking-wider text-text-dim uppercase">Fundamental</p>
                <p className="mt-1 font-mono text-lg font-medium text-text-primary">
                  <CountingNumber value={profile.fundamental} decimals={1} duration={1000} />
                </p>
                <p className="text-[10px] text-text-muted">Hz</p>
              </div>
              <div>
                <p className="text-[10px] tracking-wider text-text-dim uppercase">Note</p>
                <p className="mt-1 font-mono text-lg font-medium text-text-primary">
                  {profile.noteInfo.note}
                  {profile.noteInfo.octave}
                </p>
                <p className="text-[10px] text-text-muted">
                  {profile.noteInfo.cents > 0 ? '+' : ''}
                  {profile.noteInfo.cents}¢
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-wider text-text-dim uppercase">Stability</p>
                <p className="mt-1 font-mono text-lg font-medium text-text-primary">
                  <CountingNumber value={stabilityPct} suffix="%" duration={1000} />
                </p>
                <p className="text-[10px] text-text-muted">
                  {getStabilityLabel(profile.stability)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Voice Quality Insights */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <p className="mb-3 text-[10px] tracking-wider text-text-dim uppercase">
              Voice Qualities
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-text-dim">Vocal Steadiness</p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {vp.jitter.relative < 0.5 ? 'Calm' : vp.jitter.relative < 1.0 ? 'Natural' : 'Fluid'}
                  </p>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                  {getJitterDescription(vp.jitter.relative)}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-text-dim">Projection</p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {vp.shimmer.db < 0.2 ? 'Strong' : vp.shimmer.db < 0.4 ? 'Gentle' : 'Soft'}
                  </p>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                  {getShimmerDescription(vp.shimmer.db)}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-text-dim">Clarity</p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {vp.hnr >= 28 ? 'Clear' : vp.hnr >= 20 ? 'Warm' : 'Soft'}
                  </p>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                  {getHnrDescription(vp.hnr)}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-text-dim">Expressiveness</p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {vp.pitchRange.rangeSemitones >= 6
                      ? 'Dynamic'
                      : vp.pitchRange.rangeSemitones >= 3
                        ? 'Balanced'
                        : 'Focused'}
                  </p>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                  {getPitchRangeDescription(vp.pitchRange.rangeSemitones)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Chakra Body Map */}
        {profile.chakraScores.length > 0 && (
          <motion.div variants={fadeInUp}>
            <Card className="p-4">
              <p className="mb-2 text-center text-[10px] tracking-wider text-text-dim uppercase">
                Your Energy Centres
              </p>
              <ChakraBodyMap scores={profile.chakraScores} />
            </Card>
          </motion.div>
        )}

        {/* Dominant chakra insight */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: profile.dominantChakra.color }}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {profile.dominantChakra.name} Chakra
                  <span className="ml-2 font-mono text-xs text-text-muted">
                    <CountingNumber value={profile.dominantChakra.score} suffix="%" duration={800} />{' '}
                    {profile.dominantChakra.label}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {profile.dominantChakra.description}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Chakra Bar Chart breakdown */}
        {profile.chakraScores.length > 0 && (
          <motion.div variants={fadeInUp}>
            <Card className="p-4">
              <p className="mb-3 text-[10px] tracking-wider text-text-dim uppercase">
                Chakra Breakdown
              </p>
              <ChakraBarChart scores={profile.chakraScores} />
            </Card>
          </motion.div>
        )}

        {/* Overtones + Richness */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] tracking-wider text-text-dim uppercase">
                Overtone Presence
              </p>
              <Badge
                label={`${profile.richness}% ${getRichnessLabel(profile.richness)}`}
                color="var(--color-accent-secondary)"
              />
            </div>
            <OvertoneChart overtones={profile.overtones} animate={false} />
          </Card>
        </motion.div>

        {/* Session Recommendations */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <p className="mb-3 text-[10px] tracking-wider text-text-dim uppercase">
              Session Guidance
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-bg-mid p-3">
                <p className="text-[10px] text-text-dim">Grounding Tone</p>
                <p className="mt-0.5 font-mono text-sm text-text-primary">
                  {profile.noteInfo.note}
                  {profile.noteInfo.octave}
                </p>
                <p className="text-[10px] text-text-muted">for deep resonance</p>
              </div>
              <div className="rounded-xl bg-bg-mid p-3">
                <p className="text-[10px] text-text-dim">Overtone Richness</p>
                <p className="mt-0.5 font-mono text-sm text-text-primary">
                  <CountingNumber value={profile.richness} suffix="%" duration={800} />
                </p>
                <p className="text-[10px] text-text-muted">{getRichnessLabel(profile.richness)}</p>
              </div>
              <div className="rounded-xl bg-bg-mid p-3">
                <p className="text-[10px] text-text-dim">Expansion Tone</p>
                <p className="mt-0.5 font-mono text-sm text-text-primary">
                  {profile.fifth.note.note}
                  {profile.fifth.note.octave}
                </p>
                <p className="text-[10px] text-text-muted">perfect 5th</p>
              </div>
              <div className="rounded-xl bg-bg-mid p-3">
                <p className="text-[10px] text-text-dim">Release Tone</p>
                <p className="mt-0.5 font-mono text-sm text-text-primary">
                  {profile.third.note.note}
                  {profile.third.note.octave}
                </p>
                <p className="text-[10px] text-text-muted">minor 3rd</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-bg-mid p-3">
              <p className="text-[10px] text-text-dim">Instruments</p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {getInstrumentSuggestion(profile.richness)}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Share actions — primary row */}
        <motion.div variants={fadeInUp} className="flex gap-3">
          <Button
            onClick={handleViewReport}
            className="flex-1 py-3"
            style={{ background: profile.dominantChakra.color, color: '#fff' }}
          >
            <FileText size={16} />
            View Report
          </Button>
          <Button
            variant="secondary"
            onClick={handleShareCard}
            disabled={generatingCard}
            className="flex-1 py-3"
            style={{ borderColor: `${profile.dominantChakra.color}60` }}
          >
            <Share2 size={16} />
            {generatingCard ? 'Generating...' : 'Share Card'}
          </Button>
        </motion.div>

        {/* Share actions — secondary */}
        <motion.div variants={fadeInUp} className="flex justify-center">
          <Button variant="ghost" onClick={handleEmail}>
            <Mail size={16} />
            Email Summary
          </Button>
        </motion.div>

        {/* New Analysis */}
        <motion.div variants={fadeInUp} className="flex justify-center">
          <Button variant="ghost" onClick={onReset}>
            <RotateCcw size={16} />
            New Analysis
          </Button>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          variants={fadeInUp}
          className="px-4 text-center text-[9px] leading-relaxed text-text-dim"
        >
          This analysis explores the acoustic qualities of your voice through a wellness lens. It is
          not a medical, diagnostic, or clinical assessment. For voice health concerns, please
          consult a qualified healthcare professional.
        </motion.p>

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
