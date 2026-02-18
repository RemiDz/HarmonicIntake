import type { FrequencyProfile } from '@/lib/types';

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
 * Format the human-friendly email body with full chakra scan.
 */
export function formatHumanEmailBody(profile: FrequencyProfile): string {
  const { noteInfo, stability, richness, fifth, third, fundamental, chakraScores, dominantChakra } =
    profile;

  const date = profile.timestamp.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rangeDesc = getFrequencyRangeDescription(fundamental);

  // Build chakra scan section
  const chakraScanLines = chakraScores
    .map((cs) => `  ● ${cs.name} — ${cs.score}% ${cs.label}\n    ${cs.description}`)
    .join('\n\n');

  return `✦ HARMONIC INTAKE — Your Frequency Profile
${date}

Hello,

Here are the insights from your vocal frequency analysis — a complete scan of your seven energy centres.

YOUR NATURAL TONE
Your voice naturally rests at ${noteInfo.note}${noteInfo.octave} — a ${rangeDesc} tone at ${fundamental} Hz.

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

—
With resonance,
Harmonic Intake
harmonicintake.com`;
}
