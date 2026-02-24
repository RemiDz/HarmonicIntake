'use client';

import { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Copy, Check } from 'lucide-react';

interface HashtagSet {
  id: string;
  label: string;
  tags: string;
}

const HASHTAG_SETS: HashtagSet[] = [
  {
    id: 'core',
    label: 'Core',
    tags: '#HarmonicIntake #FrequencyProfile #VocalAnalysis #SoundHealing #FrequencyHealing #VoiceFrequency #HealingFrequencies',
  },
  {
    id: 'healing',
    label: 'Extended Healing',
    tags: '#SoundTherapy #SoundBath #SoundMedicine #VibrationalHealing #FrequencyMedicine #HealingVibrations #SonicWellness #ResonanceHealing',
  },
  {
    id: 'chakra',
    label: 'Chakra',
    tags: '#ChakraHealing #ChakraBalance #ChakraResonance #EnergyHealing #EnergyWork #ChakraAlignment #RootChakra #ThroatChakra #HeartChakra',
  },
  {
    id: 'science',
    label: 'Science',
    tags: '#Cymatics #BioAcoustics #VocalBiomarkers #FrequencyScience #SoundScience #Psychoacoustics #HarmonicOvertones #Resonance',
  },
  {
    id: 'practitioner',
    label: 'Practitioner',
    tags: '#SoundHealer #SoundPractitioner #HolisticPractitioner #WellnessTools #PractitionerTools #ClientAssessment #IntakeProcess #SessionPlanning',
  },
  {
    id: 'instruments',
    label: 'Instruments',
    tags: '#SingingBowls #TuningForks #Gongs #Didgeridoo #Monochord #CrystalBowls #DroneMusic #OvertoneChanting',
  },
  {
    id: 'trending',
    label: 'Trending / Discovery',
    tags: '#WellnessTech #HolisticHealth #MindBodySpirit #EnergyMedicine #AlternativeHealing #ConsciousLiving #SpiritualTools #NewEarthTools',
  },
];

export default function PromoHashtags() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
        Hashtag Sets
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Pre-built hashtag groups — copy and paste into your posts.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {HASHTAG_SETS.map((set) => (
          <Card key={set.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest uppercase text-accent-primary">
                {set.label}
              </span>
              <button
                onClick={() => handleCopy(set.id, set.tags)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono
                  bg-bg-surface border border-border hover:border-border-hover
                  text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                {copiedId === set.id ? (
                  <>
                    <Check size={12} className="text-success" />
                    <span className="text-success">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed break-words">
              {set.tags}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
