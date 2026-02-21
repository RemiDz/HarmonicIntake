'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { RotateCcw, Sparkles, FileText, Share2, Mail, GitCompareArrows } from 'lucide-react';
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
import { PlayableTone } from '@/components/ui/PlayableTone';
import { useTonePlayer } from '@/hooks/useTonePlayer';
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
  onCompare: () => void;
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
    projection: Math.max(0, Math.min(100, ((vp.rmsEnergy - 0.01) / 0.12) * 100)),
    clarity: Math.max(0, Math.min(100, ((vp.hnr - 5) / 40) * 100)),
    expressiveness: Math.max(0, Math.min(100, (vp.pitchRange.rangeSemitones / 12) * 100)),
    warmth: Math.max(0, Math.min(100, (Math.abs(vp.spectralSlope) / 0.01) * 100)),
  };
}

export function ResultScreen({ profile, onReset, onCompare }: ResultScreenProps) {
  const stabilityPct = Math.round(profile.stability * 100);
  const vp = profile.voiceProfile;
  const positions = getQualityPositions(profile);
  const [generatingCard, setGeneratingCard] = useState(false);
  const { state: toneState, play: playTone, stop: stopTone } = useTonePlayer();

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

        {/* ── Voice quality warning banner ── */}
        {profile.voiceValidation.status === 'warn' && (
          <motion.div variants={fadeInUp}>
            <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
              <p className="text-xs leading-relaxed text-warning/80">
                <span className="font-medium text-warning">Low voice clarity.</span>{' '}
                Only {Math.round(profile.voiceValidation.voiceRatio * 100)}% of this recording
                contained a clear vocal signal. For best results, sustain a steady hum in a quiet space.
              </p>
            </div>
          </motion.div>
        )}

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

        {/* ── Compare Sessions CTA ── */}
        <motion.div variants={fadeInUp}>
          <button
            onClick={onCompare}
            className="compare-cta group relative w-full cursor-pointer overflow-hidden rounded-xl px-6 py-4 text-left backdrop-blur-md transition-all hover:scale-[1.01]"
            style={{
              background: `linear-gradient(135deg, ${profile.dominantChakra.color}08, ${profile.dominantChakra.color}15)`,
              border: `1.5px solid ${profile.dominantChakra.color}50`,
              boxShadow: `0 0 20px ${profile.dominantChakra.color}10, inset 0 1px 0 ${profile.dominantChakra.color}15`,
            }}
          >
            {/* Animated pulsing glow border */}
            <span
              className="pointer-events-none absolute inset-[-1px] rounded-xl"
              style={{
                border: `1.5px solid ${profile.dominantChakra.color}`,
                animation: 'compare-pulse 2.5s ease-in-out infinite',
              }}
            />
            {/* Subtle background shimmer */}
            <span
              className="pointer-events-none absolute inset-0 rounded-xl opacity-30"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, ${profile.dominantChakra.color}20 0%, transparent 70%)`,
              }}
            />
            <p className="relative mb-2 text-[11px] tracking-wide text-text-secondary">
              Want to see how your voice changes after a session?
            </p>
            <div className="relative flex items-center gap-3">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${profile.dominantChakra.color}20` }}
              >
                <GitCompareArrows size={16} style={{ color: profile.dominantChakra.color }} />
              </div>
              <span className="text-sm font-medium text-text-primary group-hover:text-white">
                Record Again to Compare
              </span>
              <span
                className="ml-auto rounded-md px-2 py-0.5 font-mono text-[10px]"
                style={{
                  background: `${profile.dominantChakra.color}15`,
                  color: profile.dominantChakra.color,
                }}
              >
                Before &amp; After
              </span>
            </div>
          </button>
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

        {/* ── Session Guidance: Playable Tones ── */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <p className="mb-3 text-[10px] tracking-wider text-text-dim uppercase">
              Session Guidance
            </p>
            <div className="space-y-2">
              <PlayableTone
                id="grounding"
                label="Grounding Tone"
                note={`${profile.noteInfo.note}${profile.noteInfo.octave}`}
                frequency={profile.fundamental}
                description="Matches your natural resonance — for deep grounding"
                duration={10}
                accentColor={profile.dominantChakra.color}
                isPlaying={toneState.activeId === 'grounding'}
                progress={toneState.activeId === 'grounding' ? toneState.progress : 0}
                onPlay={() => playTone('grounding', { frequency: profile.fundamental, duration: 10 })}
                onStop={stopTone}
              />
              <PlayableTone
                id="expansion"
                label="Expansion Tone"
                note={`${profile.fifth.note.note}${profile.fifth.note.octave}`}
                frequency={profile.fifth.freq}
                description="A perfect fifth above — opens and lifts your energy"
                duration={10}
                accentColor={profile.dominantChakra.color}
                isPlaying={toneState.activeId === 'expansion'}
                progress={toneState.activeId === 'expansion' ? toneState.progress : 0}
                onPlay={() => playTone('expansion', { frequency: profile.fifth.freq, duration: 10 })}
                onStop={stopTone}
              />
              <PlayableTone
                id="release"
                label="Release Tone"
                note={`${profile.third.note.note}${profile.third.note.octave}`}
                frequency={profile.third.freq}
                description="A minor third — supports emotional softening and release"
                duration={10}
                accentColor={profile.dominantChakra.color}
                isPlaying={toneState.activeId === 'release'}
                progress={toneState.activeId === 'release' ? toneState.progress : 0}
                onPlay={() => playTone('release', { frequency: profile.third.freq, duration: 10 })}
                onStop={stopTone}
              />
              <PlayableTone
                id="binaural"
                label="Binaural Support"
                note="7.83 Hz"
                frequency={profile.fundamental}
                description="Schumann Resonance — Earth's natural pulse for deep calm"
                duration={30}
                binaural
                accentColor={profile.dominantChakra.color}
                isPlaying={toneState.activeId === 'binaural'}
                progress={toneState.activeId === 'binaural' ? toneState.progress : 0}
                onPlay={() => playTone('binaural', { frequency: profile.fundamental, duration: 30, binaural: true })}
                onStop={stopTone}
              />
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

        {/* ── Recording quality note ── */}
        {profile.voiceValidation.status === 'warn' && (
          <motion.p
            variants={fadeInUp}
            className="rounded-xl border border-warning/10 bg-warning/5 px-4 py-3 text-center text-[10px] leading-relaxed text-warning/60"
          >
            Recording conditions: {Math.round(profile.voiceValidation.voiceRatio * 100)}% voice
            clarity. Moderate background noise detected — results may be less precise.
          </motion.p>
        )}

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
          className="text-center text-[10px] tracking-wider text-text-dim uppercase"
        >
          Harmonic Intake · No data stored · Browser only
        </motion.p>

        <motion.p
          variants={fadeInUp}
          className="pb-8 pt-6 text-center font-mono text-[12px] text-text-primary opacity-40"
        >
          Built by Remigijus Dzingelevi&#269;ius
        </motion.p>
      </div>
    </motion.div>
  );
}
