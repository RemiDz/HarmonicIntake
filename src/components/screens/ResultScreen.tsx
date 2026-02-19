'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { RotateCcw, Sparkles, FileText, Share2, Mail } from 'lucide-react';
import type { FrequencyProfile } from '@/lib/types';
import VoiceWaveform from '@/components/viz/VoiceWaveform';
import { OvertoneSpiral } from '@/components/viz/OvertoneSpiral';
import { OvertoneChart } from '@/components/viz/OvertoneChart';
import { ChakraBodyMap } from '@/components/viz/ChakraBodyMap';
import { VoiceQualityBar } from '@/components/viz/VoiceQualityBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CountingNumber } from '@/components/ui/CountingNumber';
import { generateHTMLReport } from '@/lib/share/generate-report';
import { generateShareCard } from '@/lib/share/generate-card';
import { formatHumanEmailSubject, formatHumanEmailBody } from '@/lib/profile/humanize';
import { getToneDescription } from '@/lib/profile/humanize';
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

/** Map biomarkers to 0-100 bar positions */
function getQualityPositions(profile: FrequencyProfile) {
  const vp = profile.voiceProfile;
  return {
    steadiness: Math.max(0, Math.min(100, (1 - vp.jitter.relative / 2) * 100)),
    projection: Math.max(0, Math.min(100, (vp.rmsEnergy / 0.15) * 100)),
    clarity: Math.max(0, Math.min(100, ((vp.hnr - 5) / 30) * 100)),
    expressiveness: Math.max(0, Math.min(100, (vp.pitchRange.rangeSemitones / 12) * 100)),
    warmth: Math.max(0, Math.min(100, (Math.abs(vp.spectralSlope) / 0.01) * 100)),
  };
}

export function ResultScreen({ profile, onReset }: ResultScreenProps) {
  const stabilityPct = Math.round(profile.stability * 100);
  const vp = profile.voiceProfile;
  const positions = getQualityPositions(profile);
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

  // Format note with proper sharp symbol
  const noteDisplay = profile.noteInfo.note.replace('#', '\u266F');

  return (
    <motion.div
      className="flex min-h-screen flex-col items-center px-6 py-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-[420px] space-y-6">
        {/* ── Header ── */}
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

        {/* ── Voice Signature waveform ── */}
        <motion.div variants={fadeInUp}>
          <VoiceWaveform
            timeDomainData={profile.frozenWaveform}
            rmsEnergy={profile.voiceProfile.rmsEnergy}
            chakraColor={profile.dominantChakra.color}
            mode="result"
            height={120}
          />
        </motion.div>

        {/* ── Hero Note Display ── */}
        <motion.div variants={fadeInUp} className="text-center">
          <p
            className="font-display text-[72px] font-light leading-none"
            style={{
              color: profile.dominantChakra.color,
              textShadow: `0 0 30px ${profile.dominantChakra.color}40`,
            }}
          >
            {noteDisplay}
            <span className="text-4xl">{profile.noteInfo.octave}</span>
          </p>
          <p className="mt-2 font-mono text-lg text-text-secondary">
            <CountingNumber value={profile.fundamental} decimals={1} duration={1000} />{' '}
            <span className="text-sm text-text-muted">Hz</span>
          </p>
          <p className="mt-2 text-sm italic text-text-muted">
            {getToneDescription(profile.fundamental)}
          </p>
        </motion.div>

        {/* ── 3-column key metrics ── */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] tracking-wider text-text-dim uppercase">Stability</p>
                <p className="mt-1 font-mono text-lg font-medium text-text-primary">
                  <CountingNumber value={stabilityPct} suffix="%" duration={1000} />
                </p>
                <p className="text-[10px] text-text-muted">
                  {getStabilityLabel(profile.stability)}
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-wider text-text-dim uppercase">Clarity</p>
                <p className="mt-1 font-mono text-lg font-medium text-text-primary">
                  {vp.hnr >= 28 ? 'Clear' : vp.hnr >= 20 ? 'Warm' : 'Soft'}
                </p>
                <p className="text-[10px] text-text-muted">
                  {Math.round(vp.hnr)} dB HNR
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-wider text-text-dim uppercase">Richness</p>
                <p className="mt-1 font-mono text-lg font-medium text-text-primary">
                  <CountingNumber value={profile.richness} suffix="%" duration={1000} />
                </p>
                <p className="text-[10px] text-text-muted">
                  {getRichnessLabel(profile.richness)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Voice Quality Bars ── */}
        <motion.div variants={fadeInUp}>
          <p className="mb-3 text-[10px] tracking-wider text-text-dim uppercase">
            Voice Qualities
          </p>
          <div className="space-y-2">
            <VoiceQualityBar
              label="Vocal Steadiness"
              leftLabel="Fluid"
              rightLabel="Steady"
              position={positions.steadiness}
              description={getJitterDescription(vp.jitter.relative)}
              color={profile.dominantChakra.color}
              delay={0}
            />
            <VoiceQualityBar
              label="Projection"
              leftLabel="Gentle"
              rightLabel="Powerful"
              position={positions.projection}
              description={getShimmerDescription(vp.shimmer.db)}
              color={profile.dominantChakra.color}
              delay={0.08}
            />
            <VoiceQualityBar
              label="Clarity"
              leftLabel="Breathy"
              rightLabel="Crystal"
              position={positions.clarity}
              description={getHnrDescription(vp.hnr)}
              color={profile.dominantChakra.color}
              delay={0.16}
            />
            <VoiceQualityBar
              label="Expressiveness"
              leftLabel="Contained"
              rightLabel="Dynamic"
              position={positions.expressiveness}
              description={getPitchRangeDescription(vp.pitchRange.rangeSemitones)}
              color={profile.dominantChakra.color}
              delay={0.24}
            />
            <VoiceQualityBar
              label="Warmth"
              leftLabel="Bright"
              rightLabel="Warm"
              position={positions.warmth}
              description={
                positions.warmth > 65
                  ? 'Your voice has a rich, warm tonal quality \u2014 naturally soothing and grounding.'
                  : positions.warmth > 35
                    ? 'Your voice carries a balanced tonal quality \u2014 neither too bright nor too warm.'
                    : 'Your voice has a bright, clear tonal quality \u2014 naturally energising and uplifting.'
              }
              color={profile.dominantChakra.color}
              delay={0.32}
            />
          </div>
        </motion.div>

        {/* ── Harmonic Fingerprint (Overtone Spiral) ── */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <p className="mb-1 text-center text-[10px] tracking-wider text-text-dim uppercase">
              Your Harmonic Fingerprint
            </p>
            <p className="mb-4 text-center text-[10px] text-text-dim">
              The unique overtone pattern of your voice
            </p>
            <OvertoneSpiral
              overtones={profile.overtones}
              fundamental={profile.fundamental}
            />
          </Card>
        </motion.div>

        {/* ── Chakra Energy Map ── */}
        {profile.chakraScores.length > 0 && (
          <motion.div variants={fadeInUp}>
            <Card className="p-4">
              <p className="mb-2 text-center text-[10px] tracking-wider text-text-dim uppercase">
                Your Energy Centres
              </p>
              <p className="mb-3 text-center text-[10px] text-text-dim">
                Tap a chakra to learn more
              </p>
              <ChakraBodyMap
                scores={profile.chakraScores}
                dominantName={profile.dominantChakra.name}
              />
            </Card>
          </motion.div>
        )}

        {/* ── Dominant Chakra Insight ── */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: profile.dominantChakra.color,
                  boxShadow: `0 0 8px ${profile.dominantChakra.color}`,
                }}
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

        {/* ── Overtone Presence (bar breakdown) ── */}
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

        {/* ── Session Guidance ── */}
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

        {/* ── Share actions — primary row ── */}
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

        {/* ── Share actions — secondary ── */}
        <motion.div variants={fadeInUp} className="flex justify-center">
          <Button variant="ghost" onClick={handleEmail}>
            <Mail size={16} />
            Email Summary
          </Button>
        </motion.div>

        {/* ── New Analysis ── */}
        <motion.div variants={fadeInUp} className="flex justify-center">
          <Button variant="ghost" onClick={onReset}>
            <RotateCcw size={16} />
            New Analysis
          </Button>
        </motion.div>

        {/* ── Disclaimer ── */}
        <motion.p
          variants={fadeInUp}
          className="px-4 text-center text-[9px] leading-relaxed text-text-dim"
        >
          This analysis explores the acoustic qualities of your voice through a wellness lens. It is
          not a medical, diagnostic, or clinical assessment. For voice health concerns, please
          consult a qualified healthcare professional.
        </motion.p>

        {/* ── Footer ── */}
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
