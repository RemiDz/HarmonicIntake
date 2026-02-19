/**
 * Multi-Biomarker Chakra Scoring (V2 Engine)
 *
 * Maps real voice biomarkers (jitter, shimmer, HNR, formants, spectral
 * features, F0 position) to 7 chakra scores using physiologically-meaningful
 * weighted composites.
 *
 * Each chakra has a unique weighting profile that reflects its energetic
 * quality — e.g. Root emphasises low F0 + stability, Throat emphasises
 * HNR + clarity, Crown emphasises upper frequency presence.
 */

import type { ChakraScore, VoiceProfile } from '@/lib/types';
import { clamp01, weightedScore } from './normalisation';

// ── Chakra Insights (4 tiers × 7 chakras) ──

function getChakraInsight(chakra: string, score: number): string {
  const insights: Record<string, Record<string, string>> = {
    Root: {
      strong:
        'Your voice carries deep grounding energy — a strong foundation and sense of safety resonates through your tone.',
      balanced:
        'Your Root centre is present and stable — you have a natural sense of groundedness.',
      gentle:
        'Your Root energy is quieter — grounding work with low tones may help strengthen your foundation.',
      quiet:
        'Your Root centre is resting — deep, sustained bass tones could help reconnect you with your ground.',
    },
    Sacral: {
      strong:
        'Your voice flows with creative, emotional energy — the Sacral centre is alive with expression and feeling.',
      balanced:
        'Your Sacral energy is flowing naturally — creativity and emotional expression are accessible to you.',
      gentle:
        'Your Sacral centre is quieter — gentle, rhythmic sounds may help awaken creativity and emotional flow.',
      quiet:
        'Your Sacral energy is resting — warm, flowing tones could help open this centre of feeling and creativity.',
    },
    'Solar Plexus': {
      strong:
        'Your voice projects with confidence and power — your Solar Plexus radiates strong personal energy.',
      balanced:
        'Your Solar Plexus is active — you carry a healthy sense of personal power and confidence.',
      gentle:
        'Your Solar Plexus is quieter — empowering, resonant tones may help strengthen your sense of personal power.',
      quiet:
        'Your Solar Plexus is resting — bright, energising sounds could help ignite your inner confidence and will.',
    },
    Heart: {
      strong:
        'Your voice resonates with warmth and openness — the Heart centre shines with compassion and connection.',
      balanced:
        'Your Heart energy is flowing — love and compassion are naturally present in your expression.',
      gentle:
        'Your Heart centre is quieter — gentle, open tones may help expand your capacity for connection.',
      quiet:
        'Your Heart energy is resting — soft, harmonious sounds could help open this centre of love and compassion.',
    },
    Throat: {
      strong:
        'Your voice is clear and expressive — the Throat centre is wide open, supporting authentic communication.',
      balanced:
        'Your Throat energy is flowing — self-expression and truth come naturally to your voice.',
      gentle:
        'Your Throat centre is quieter — humming and vocal toning may help free your authentic expression.',
      quiet:
        'Your Throat energy is resting — gentle vocal exercises and singing bowl work could help open your voice.',
    },
    'Third Eye': {
      strong:
        'Your voice carries bright, perceptive energy — the Third Eye is active with intuition and insight.',
      balanced:
        'Your Third Eye is present — intuition and inner vision are accessible in your current state.',
      gentle:
        'Your Third Eye is quieter — high, clear tones may help sharpen your intuition and inner clarity.',
      quiet:
        'Your Third Eye is resting — crystalline, bell-like sounds could help awaken your intuitive perception.',
    },
    Crown: {
      strong:
        'Your voice reaches into expansive, transcendent frequencies — the Crown centre is radiantly open.',
      balanced:
        'Your Crown energy is present — a natural connection to something larger than yourself.',
      gentle:
        'Your Crown centre is quieter — ethereal, high-harmonic sounds may help expand your spiritual connection.',
      quiet:
        'Your Crown energy is resting — delicate overtone singing or crystal bowls could help open this transcendent centre.',
    },
  };

  const level = score > 75 ? 'strong' : score > 50 ? 'balanced' : score > 30 ? 'gentle' : 'quiet';
  return insights[chakra]?.[level] || '';
}

/**
 * Calculate 7-chakra scores from a VoiceProfile using multi-biomarker
 * weighted composites.
 */
export function calculateChakraScores(profile: VoiceProfile): ChakraScore[] {
  // Normalise each biomarker to 0-1 range based on known human ranges
  const n = {
    // Stability metrics (inverted — lower jitter = more stable)
    jitterNorm: clamp01(1 - profile.jitter.relative / 2),       // 0% = 1.0, 2% = 0.0
    shimmerNorm: clamp01(1 - profile.shimmer.db / 0.8),          // 0dB = 1.0, 0.8dB = 0.0
    hnrNorm: clamp01((profile.hnr - 5) / 30),                    // 5dB = 0.0, 35dB = 1.0

    // Energy & projection
    rmsNorm: clamp01(profile.rmsEnergy / 0.15),                  // Scale to typical hum range
    dynamicNorm: clamp01(profile.dynamicRange),

    // Spectral character
    centroidNorm: clamp01((profile.spectralCentroid - 100) / 800), // 100Hz = 0, 900Hz = 1
    slopeNorm: clamp01(1 - Math.abs(profile.spectralSlope) / 0.05), // Flat = 1, steep = 0

    // Formant presence (higher formants = more upper chakra energy)
    f1Norm: clamp01((profile.formants.f1 - 200) / 700),
    f2Norm: clamp01((profile.formants.f2 - 800) / 2000),
    f3Norm: clamp01((profile.formants.f3 - 1500) / 2000),

    // Expressiveness
    pitchRangeNorm: clamp01(profile.pitchRange.rangeSemitones / 12), // 0 semitones = 0, 12 = 1

    // Fundamental frequency position (where in the spectrum the voice sits)
    f0Low: clamp01(1 - (profile.fundamental.mean - 60) / 200),   // Lower F0 = higher score
    f0Mid: clamp01(1 - Math.abs(profile.fundamental.mean - 250) / 200), // Peak at ~250Hz
    f0High: clamp01((profile.fundamental.mean - 200) / 400),     // Higher F0 = higher score
  };

  const scores: ChakraScore[] = [
    {
      name: 'Root',
      color: '#E24B4B',
      // Root = grounding, stability, deep tone
      score: weightedScore([
        [n.jitterNorm, 0.25],     // Vocal stability → grounding
        [n.shimmerNorm, 0.15],    // Amplitude steadiness
        [n.f0Low, 0.25],          // Deep tone presence
        [n.rmsNorm, 0.20],        // Physical presence/projection
        [n.hnrNorm, 0.15],        // Clear, not breathy
      ]),
      label: '',
      description: '',
    },
    {
      name: 'Sacral',
      color: '#F0913A',
      // Sacral = flow, emotion, expressiveness
      score: weightedScore([
        [n.dynamicNorm, 0.30],    // Amplitude expressiveness
        [n.pitchRangeNorm, 0.25], // Pitch expressiveness
        [n.f1Norm, 0.15],         // Open jaw/throat (F1)
        [1 - n.jitterNorm, 0.15], // Some natural variation (not rigid)
        [n.rmsNorm, 0.15],        // Not withdrawn
      ]),
      label: '',
      description: '',
    },
    {
      name: 'Solar Plexus',
      color: '#F5D547',
      // Solar Plexus = confidence, power, projection
      score: weightedScore([
        [n.rmsNorm, 0.30],        // Loudness/projection
        [n.hnrNorm, 0.25],        // Voice clarity (not breathy)
        [n.shimmerNorm, 0.20],    // Steady amplitude
        [n.jitterNorm, 0.15],     // Controlled pitch
        [n.f0Mid, 0.10],          // Mid-range presence
      ]),
      label: '',
      description: '',
    },
    {
      name: 'Heart',
      color: '#5ABF7B',
      // Heart = openness, warmth, expansiveness
      score: weightedScore([
        [n.slopeNorm, 0.20],      // Balanced spectrum
        [n.f1Norm, 0.20],         // Open throat (F1 height = jaw openness)
        [n.hnrNorm, 0.20],        // Harmonic richness
        [n.dynamicNorm, 0.15],    // Emotional range
        [n.pitchRangeNorm, 0.15], // Vocal warmth & expression
        [n.shimmerNorm, 0.10],    // Steadiness
      ]),
      label: '',
      description: '',
    },
    {
      name: 'Throat',
      color: '#4FA8D6',
      // Throat = expression, clarity, truth
      score: weightedScore([
        [n.hnrNorm, 0.30],        // Voice clarity (primary indicator)
        [n.jitterNorm, 0.20],     // Pitch control
        [n.shimmerNorm, 0.15],    // Amplitude control
        [n.f2Norm, 0.15],         // Oral cavity resonance (articulation)
        [n.rmsNorm, 0.10],        // Projection
        [n.centroidNorm, 0.10],   // Brightness
      ]),
      label: '',
      description: '',
    },
    {
      name: 'Third Eye',
      color: '#7B6DB5',
      // Third Eye = brightness, perception, upper frequencies
      score: weightedScore([
        [n.centroidNorm, 0.30],   // Spectral brightness
        [n.f3Norm, 0.20],         // Upper formant presence
        [n.f0High, 0.15],         // Higher fundamental
        [n.hnrNorm, 0.15],        // Harmonic clarity
        [n.slopeNorm, 0.10],     // Gentle slope (energy in highs)
        [n.jitterNorm, 0.10],     // Precision/control
      ]),
      label: '',
      description: '',
    },
    {
      name: 'Crown',
      color: '#C77DBA',
      // Crown = transcendence, overtone richness, harmonic complexity
      score: weightedScore([
        [n.hnrNorm, 0.25],        // Harmonic richness
        [n.centroidNorm, 0.20],   // Upper frequency energy
        [n.f3Norm, 0.15],         // Highest formant
        [n.slopeNorm, 0.15],     // Gentle slope (energy spreads high)
        [n.f0High, 0.15],         // Higher fundamental
        [n.pitchRangeNorm, 0.10], // Expansive range
      ]),
      label: '',
      description: '',
    },
  ];

  // Add labels and descriptions
  for (const s of scores) {
    s.label = s.score > 75 ? 'Strong' : s.score > 50 ? 'Balanced' : s.score > 30 ? 'Gentle' : 'Quiet';
    s.description = getChakraInsight(s.name, s.score);
  }

  return scores;
}

/**
 * Quick real-time chakra scores based on spectral band energy only.
 * Lightweight for use in the animation loop during recording.
 */
export function calculateLiveChakraScores(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
): ChakraScore[] {
  const CHAKRA_BANDS = [
    { name: 'Root', color: '#E24B4B', low: 60, high: 130 },
    { name: 'Sacral', color: '#F0913A', low: 130, high: 175 },
    { name: 'Solar Plexus', color: '#F5D547', low: 175, high: 225 },
    { name: 'Heart', color: '#5ABF7B', low: 225, high: 280 },
    { name: 'Throat', color: '#4FA8D6', low: 280, high: 350 },
    { name: 'Third Eye', color: '#7B6DB5', low: 350, high: 450 },
    { name: 'Crown', color: '#C77DBA', low: 450, high: 600 },
  ];

  const binRes = sampleRate / fftSize;
  const startBin = Math.floor(60 / binRes);
  const endBin = Math.ceil(600 / binRes);

  const linearPower: number[] = [];
  let totalEnergy = 0;

  for (let i = startBin; i <= endBin && i < frequencyData.length; i++) {
    const power = Math.pow(10, frequencyData[i] / 10);
    linearPower.push(power);
    totalEnergy += power;
  }

  return CHAKRA_BANDS.map((chakra) => {
    const lowBin = Math.floor(chakra.low / binRes) - startBin;
    const highBin = Math.ceil(chakra.high / binRes) - startBin;

    let bandEnergy = 0;
    for (let i = Math.max(0, lowBin); i <= Math.min(linearPower.length - 1, highBin); i++) {
      bandEnergy += linearPower[i];
    }

    const score = Math.round(Math.min(100, (totalEnergy > 0 ? bandEnergy / totalEnergy : 0) * 300));
    return {
      name: chakra.name,
      color: chakra.color,
      score,
      label: score > 75 ? 'Strong' : score > 50 ? 'Balanced' : score > 30 ? 'Gentle' : 'Quiet',
      description: '',
    };
  });
}
