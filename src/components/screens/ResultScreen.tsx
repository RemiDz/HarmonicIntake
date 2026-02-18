'use client';

import { motion } from 'framer-motion';
import { RotateCcw, Sparkles } from 'lucide-react';
import type { FrequencyProfile } from '@/lib/types';
import { MandalaViz } from '@/components/viz/MandalaViz';
import { OvertoneChart } from '@/components/viz/OvertoneChart';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmailProfile } from '@/components/share/EmailProfile';
import { CopyProfile } from '@/components/share/CopyProfile';
import {
  getStabilityLabel,
  getRichnessLabel,
  getInstrumentSuggestion,
} from '@/lib/profile/recommendations';

interface ResultScreenProps {
  profile: FrequencyProfile;
  onReset: () => void;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export function ResultScreen({ profile, onReset }: ResultScreenProps) {
  const stabilityPct = Math.round(profile.stability * 100);

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

        {/* Mandala (static) */}
        <motion.div variants={fadeInUp}>
          <MandalaViz
            overtones={profile.overtones}
            fundamental={profile.fundamental}
            chakraColor={profile.chakra.color}
            isAnimating={false}
          />
        </motion.div>

        {/* 3-column metrics */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] tracking-wider text-text-dim uppercase">Fundamental</p>
                <p className="mt-1 font-mono text-lg font-medium text-text-primary">
                  {profile.fundamental}
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
                  {stabilityPct}%
                </p>
                <p className="text-[10px] text-text-muted">{getStabilityLabel(profile.stability)}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Chakra card */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: profile.chakra.color }}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {profile.chakra.name} Chakra
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">{profile.chakra.intention}</p>
              </div>
            </div>
          </Card>
        </motion.div>

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
              Session Recommendations
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-bg-mid p-3">
                <p className="text-[10px] text-text-dim">Drone Note</p>
                <p className="mt-0.5 font-mono text-sm text-text-primary">
                  {profile.noteInfo.note}
                  {profile.noteInfo.octave}
                </p>
                <p className="text-[10px] text-text-muted">for deep resonance</p>
              </div>
              <div className="rounded-xl bg-bg-mid p-3">
                <p className="text-[10px] text-text-dim">Overtone Richness</p>
                <p className="mt-0.5 font-mono text-sm text-text-primary">{profile.richness}%</p>
                <p className="text-[10px] text-text-muted">{getRichnessLabel(profile.richness)}</p>
              </div>
              <div className="rounded-xl bg-bg-mid p-3">
                <p className="text-[10px] text-text-dim">Perfect 5th</p>
                <p className="mt-0.5 font-mono text-sm text-text-primary">
                  {profile.fifth.note.note}
                  {profile.fifth.note.octave}
                </p>
                <p className="text-[10px] text-text-muted">for expansion</p>
              </div>
              <div className="rounded-xl bg-bg-mid p-3">
                <p className="text-[10px] text-text-dim">Minor 3rd</p>
                <p className="mt-0.5 font-mono text-sm text-text-primary">
                  {profile.third.note.note}
                  {profile.third.note.octave}
                </p>
                <p className="text-[10px] text-text-muted">for emotional release</p>
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

        {/* Share actions */}
        <motion.div variants={fadeInUp} className="flex gap-3">
          <div className="flex-1">
            <EmailProfile profile={profile} />
          </div>
          <div className="flex-1">
            <CopyProfile profile={profile} />
          </div>
        </motion.div>

        {/* New Analysis */}
        <motion.div variants={fadeInUp} className="flex justify-center">
          <Button variant="secondary" onClick={onReset}>
            <RotateCcw size={16} />
            New Analysis
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p variants={fadeInUp} className="pb-8 text-center text-[10px] tracking-wider text-text-dim uppercase">
          Harmonic Intake · No data stored · Browser only
        </motion.p>
      </div>
    </motion.div>
  );
}
