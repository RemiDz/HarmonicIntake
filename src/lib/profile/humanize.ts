import type { FrequencyProfile, VoiceProfile } from '@/lib/types';

/**
 * Translate a frequency to a human-friendly range description.
 */
export function getFrequencyRangeDescription(hz: number): string {
  if (hz < 150) return 'deep, grounding';
  if (hz < 250) return 'warm, centred';
  if (hz < 350) return 'clear, expressive';
  if (hz < 450) return 'bright, elevated';
  return 'light, expansive';
}

/**
 * Poetic one-line tone description for the hero section.
 */
export function getToneDescription(hz: number): string {
  if (hz < 130) return 'A deep, grounding resonance \u2014 earthy and rooted';
  if (hz < 180) return 'A warm, steady tone \u2014 naturally anchored';
  if (hz < 230) return 'A resonant, mid-range voice \u2014 balanced and centred';
  if (hz < 280) return 'A bright, clear tone \u2014 naturally expressive';
  return 'A light, luminous frequency \u2014 airy and open';
}

/**
 * Translate stability (0-1) to a human-friendly description.
 */
export function getStabilityDescription(stability: number): string {
  const pct = stability * 100;
  if (pct > 80) {
    return 'Your tone was very steady and centred — reflecting a calm, grounded presence.';
  }
  if (pct > 60) {
    return 'Your tone was mostly steady with natural variation — reflecting an open, adaptive state.';
  }
  if (pct > 40) {
    return 'Your tone had moderate movement — this can reflect emotional processing or energetic shifting.';
  }
  return 'Your tone was quite fluid and shifting — this often reflects a period of change or emotional movement.';
}

/**
 * Translate overtone richness (0-100) to a human-friendly description.
 */
export function getRichnessDescription(richness: number): string {
  if (richness > 60) {
    return 'Your voice carries rich, layered harmonics — a naturally resonant and expressive quality.';
  }
  if (richness > 35) {
    return 'Your voice has a balanced harmonic presence — clear and centred.';
  }
  return 'Your voice has a pure, focused quality — like a clear bell. Instruments with rich harmonics can beautifully complement this.';
}

// ── Voice Biomarker Human Translations ──

/**
 * Translate jitter (relative %) to a human-friendly description.
 */
export function getJitterDescription(relativePercent: number): string {
  if (relativePercent < 0.5) {
    return 'Your voice is very steady — a sign of inner calm and groundedness.';
  }
  if (relativePercent < 1.0) {
    return 'Your voice carries natural movement — openness and emotional presence.';
  }
  return 'Your voice has noticeable fluidity — this can reflect a period of change or processing.';
}

/**
 * Translate shimmer (dB) to a human-friendly description.
 */
export function getShimmerDescription(db: number): string {
  if (db < 0.2) {
    return 'Your voice projects with consistent, confident energy.';
  }
  if (db < 0.4) {
    return 'Your voice has a gentle, natural breath quality.';
  }
  return 'Your voice carries a soft, diffused quality — breathwork may help strengthen projection.';
}

/**
 * Translate HNR (dB) to a human-friendly description.
 */
export function getHnrDescription(hnr: number): string {
  if (hnr >= 28) {
    return 'Your voice is clear and richly harmonic — a naturally resonant quality.';
  }
  if (hnr >= 20) {
    return 'Your voice has a balanced clarity with natural warmth.';
  }
  return 'Your voice has a softer, more diffused quality — singing bowls can help brighten your resonance.';
}

/**
 * Translate pitch range (semitones) to a human-friendly description.
 */
export function getPitchRangeDescription(semitones: number): string {
  if (semitones >= 6) {
    return 'Your voice is expressive and dynamic — emotionally open and communicative.';
  }
  if (semitones >= 3) {
    return 'Your voice is balanced between focus and expression.';
  }
  return 'Your voice is focused and centred — steady and meditative.';
}

/**
 * Get the expanded chakra description for email/sharing.
 */
export function getChakraDescription(chakraName: string): string {
  const descriptions: Record<string, string> = {
    Root: 'Your voice connects deeply with the Root — the foundation of safety, grounding, and physical presence. This suggests your body is calling for stability and connection to the earth.',
    Sacral:
      'Your voice resonates with the Sacral centre — the seat of creativity, emotion, and sensual flow. This suggests an openness to feeling and creative expression.',
    'Solar Plexus':
      'Your voice aligns with the Solar Plexus — your centre of confidence, personal power, and will. This reflects strength and determination in your energy.',
    Heart:
      'Your voice resonates with the Heart centre — the space of love, compassion, and deep connection. This suggests openness and emotional warmth.',
    Throat:
      'Your voice connects with the Throat centre — the gateway of expression, truth, and authentic communication. Your voice is naturally aligned with its own home.',
    'Third Eye':
      'Your voice resonates with the Third Eye — the seat of intuition, insight, and inner vision. This suggests a naturally contemplative and perceptive energy.',
    Crown:
      'Your voice reaches toward the Crown — the centre of transcendence, unity, and spiritual connection. This reflects an elevated, expansive quality in your energy.',
  };
  return descriptions[chakraName] || '';
}

/**
 * Human-friendly instrument suggestion.
 */
export function getHumanInstrumentSuggestion(richness: number): string {
  if (richness > 50) {
    return 'Your voice has natural warmth — singing bowls, monochord, and sustained tones will resonate beautifully with your frequency.';
  }
  return 'Instruments with rich overtones like gongs, didgeridoo, and Tibetan bowls will complement and enrich your natural tone.';
}

/**
 * Format the human-friendly email subject.
 */
export function formatHumanEmailSubject(profile: FrequencyProfile): string {
  return `Your Frequency Profile — ${profile.dominantChakra.name} Chakra`;
}

/**
 * Build a voice quality summary from the VoiceProfile biomarkers.
 */
function getVoiceQualitySummary(vp: VoiceProfile): string {
  const lines: string[] = [];
  lines.push(getJitterDescription(vp.jitter.relative));
  lines.push(getShimmerDescription(vp.shimmer.db));
  lines.push(getHnrDescription(vp.hnr));
  lines.push(getPitchRangeDescription(vp.pitchRange.rangeSemitones));
  return lines.join('\n');
}

/**
 * Format the human-friendly email body with full chakra scan and voice biomarkers.
 */
export function formatHumanEmailBody(profile: FrequencyProfile): string {
  const { noteInfo, stability, richness, fifth, third, fundamental, chakraScores, dominantChakra, voiceProfile } =
    profile;

  const date = profile.timestamp.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rangeDesc = getFrequencyRangeDescription(fundamental);

  const chakraScanLines = chakraScores
    .map((cs) => `  ● ${cs.name} — ${cs.score}% ${cs.label}\n    ${cs.description}`)
    .join('\n\n');

  return `✦ HARMONIC INTAKE — Your Frequency Profile
${date}

Hello,

Here are the insights from your vocal frequency analysis — a complete scan of your seven energy centres.

YOUR NATURAL TONE
Your voice naturally rests at ${noteInfo.note}${noteInfo.octave} — a ${rangeDesc} tone at ${fundamental} Hz.

YOUR VOICE QUALITIES
${getVoiceQualitySummary(voiceProfile)}

YOUR ENERGY CENTRES

${chakraScanLines}

YOUR STRONGEST CENTRE
${dominantChakra.name} — ${dominantChakra.description}

YOUR VOICE QUALITY
${getStabilityDescription(stability)}
${getRichnessDescription(richness)}

SESSION GUIDANCE
  ◆ Grounding tone: ${noteInfo.note}${noteInfo.octave} — matches your natural frequency for deep resonance
  ◆ Expansion tone: ${fifth.note.note}${fifth.note.octave} — opens and uplifts
  ◆ Release tone: ${third.note.note}${third.note.octave} — supports emotional letting go

${getHumanInstrumentSuggestion(richness)}

${profile.voiceValidation?.status === 'warn' ? `RECORDING NOTE
This recording had ${Math.round(profile.voiceValidation.voiceRatio * 100)}% voice clarity. For best results, sustain a steady hum in a quiet space.

` : ''}This analysis explores the acoustic qualities of your voice through a wellness lens. It is not a medical, diagnostic, or clinical assessment.

—
With resonance,
Harmonic Intake
sonarus.app`;
}
