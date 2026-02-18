import type { ChakraScore, Overtone, VocalQualities } from '@/lib/types';

const CHAKRA_BANDS = [
  { name: 'Root', color: '#E24B4B', low: 60, high: 130 },
  { name: 'Sacral', color: '#F0913A', low: 130, high: 175 },
  { name: 'Solar Plexus', color: '#F5D547', low: 175, high: 225 },
  { name: 'Heart', color: '#5ABF7B', low: 225, high: 280 },
  { name: 'Throat', color: '#4FA8D6', low: 280, high: 350 },
  { name: 'Third Eye', color: '#7B6DB5', low: 350, high: 450 },
  { name: 'Crown', color: '#C77DBA', low: 450, high: 600 },
];

const WEIGHTS = {
  spectralBand: 0.35,
  harmonicResonance: 0.25,
  vocalQuality: 0.25,
  resonanceDepth: 0.15,
};

// ── Variable 1: Spectral Band Energy ──

function getSpectralBandEnergy(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
): number[] {
  const binResolution = sampleRate / fftSize;
  const startBin = Math.floor(60 / binResolution);
  const endBin = Math.ceil(600 / binResolution);

  const linearPower: number[] = [];
  let totalEnergy = 0;

  for (let i = startBin; i <= endBin && i < frequencyData.length; i++) {
    const power = Math.pow(10, frequencyData[i] / 10);
    linearPower.push(power);
    totalEnergy += power;
  }

  return CHAKRA_BANDS.map((band) => {
    const lowBin = Math.floor(band.low / binResolution) - startBin;
    const highBin = Math.ceil(band.high / binResolution) - startBin;

    let bandEnergy = 0;
    for (let i = Math.max(0, lowBin); i <= Math.min(linearPower.length - 1, highBin); i++) {
      bandEnergy += linearPower[i];
    }

    return totalEnergy > 0 ? bandEnergy / totalEnergy : 0;
  });
}

// ── Variable 2: Harmonic Resonance ──

function getHarmonicResonance(fundamental: number, overtones: Overtone[]): number[] {
  return CHAKRA_BANDS.map((band) => {
    let resonance = 0;

    if (fundamental >= band.low && fundamental < band.high) {
      resonance += 0.5;
    }

    for (const ot of overtones) {
      if (ot.freq >= band.low && ot.freq < band.high) {
        resonance += ot.amplitude * 0.3;
      }
    }

    return Math.min(1, resonance);
  });
}

// ── Variable 3: Vocal Quality Scores ──

function getVocalQualityScores(qualities: VocalQualities, richness: number): number[] {
  return [
    qualities.stability,
    qualities.dynamicRange,
    qualities.rmsEnergy,
    Math.min(1, qualities.spectralSpread / 200),
    qualities.harmonicToNoise,
    Math.min(1, qualities.spectralCentroid / 500),
    richness / 100,
  ];
}

// ── Variable 4: Subharmonic & Resonance Depth ──

function getResonanceDepth(
  frequencyData: Float32Array,
  fundamental: number,
  sampleRate: number,
  fftSize: number,
): number[] {
  const binRes = sampleRate / fftSize;

  const subBins = Math.floor(fundamental / binRes);
  let subEnergy = 0;
  for (let i = 1; i < subBins && i < frequencyData.length; i++) {
    subEnergy += Math.pow(10, frequencyData[i] / 10);
  }

  const upperStart = Math.floor((fundamental * 2) / binRes);
  const upperEnd = Math.min(Math.ceil(600 / binRes), frequencyData.length - 1);
  let upperEnergy = 0;
  for (let i = upperStart; i <= upperEnd; i++) {
    upperEnergy += Math.pow(10, frequencyData[i] / 10);
  }

  let totalEnergy = 0;
  for (let i = 1; i <= upperEnd && i < frequencyData.length; i++) {
    totalEnergy += Math.pow(10, frequencyData[i] / 10);
  }

  const subRatio = totalEnergy > 0 ? subEnergy / totalEnergy : 0;
  const upperRatio = totalEnergy > 0 ? upperEnergy / totalEnergy : 0;
  const midRatio = Math.max(0, 1 - subRatio - upperRatio);

  return [
    Math.min(1, subRatio * 3),
    Math.min(1, subRatio * 2),
    Math.min(1, midRatio * 1.5),
    midRatio,
    Math.min(1, (midRatio + upperRatio) / 2),
    Math.min(1, upperRatio * 2),
    Math.min(1, upperRatio * 3),
  ];
}

// ── Chakra Insights ──

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

// ── Composite Score ──

/**
 * Calculate full 7-chakra scores from all audio analysis variables.
 * Used for the final profile after recording.
 */
export function calculateChakraScores(
  frequencyData: Float32Array,
  fundamental: number,
  overtones: Overtone[],
  qualities: VocalQualities,
  richness: number,
  sampleRate: number,
  fftSize: number,
): ChakraScore[] {
  const bandEnergy = getSpectralBandEnergy(frequencyData, sampleRate, fftSize);
  const harmonicRes = getHarmonicResonance(fundamental, overtones);
  const vocalScores = getVocalQualityScores(qualities, richness);
  const depthScores = getResonanceDepth(frequencyData, fundamental, sampleRate, fftSize);

  return CHAKRA_BANDS.map((chakra, i) => {
    const raw =
      bandEnergy[i] * WEIGHTS.spectralBand +
      harmonicRes[i] * WEIGHTS.harmonicResonance +
      vocalScores[i] * WEIGHTS.vocalQuality +
      depthScores[i] * WEIGHTS.resonanceDepth;

    const score = Math.round(Math.min(100, raw * 150));

    return {
      name: chakra.name,
      color: chakra.color,
      score,
      label: score > 75 ? 'Strong' : score > 50 ? 'Balanced' : score > 30 ? 'Gentle' : 'Quiet',
      description: getChakraInsight(chakra.name, score),
    };
  });
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
  const bandEnergy = getSpectralBandEnergy(frequencyData, sampleRate, fftSize);

  return CHAKRA_BANDS.map((chakra, i) => {
    const score = Math.round(Math.min(100, bandEnergy[i] * 300));
    return {
      name: chakra.name,
      color: chakra.color,
      score,
      label: score > 75 ? 'Strong' : score > 50 ? 'Balanced' : score > 30 ? 'Gentle' : 'Quiet',
      description: '',
    };
  });
}
