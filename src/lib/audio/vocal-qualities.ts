import type { VocalQualities } from '@/lib/types';

/**
 * Spectral Centroid — the "brightness" of the voice.
 * Higher centroid = brighter, more upper-frequency presence.
 */
export function getSpectralCentroid(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
): number {
  const binRes = sampleRate / fftSize;
  let weightedSum = 0;
  let totalMag = 0;

  for (let i = 1; i < frequencyData.length; i++) {
    const mag = Math.pow(10, frequencyData[i] / 20);
    const freq = i * binRes;
    weightedSum += mag * freq;
    totalMag += mag;
  }

  return totalMag > 0 ? weightedSum / totalMag : 0;
}

/**
 * Spectral Spread — how wide the energy is distributed around the centroid.
 */
export function getSpectralSpread(
  frequencyData: Float32Array,
  centroid: number,
  sampleRate: number,
  fftSize: number,
): number {
  const binRes = sampleRate / fftSize;
  let weightedSum = 0;
  let totalMag = 0;

  for (let i = 1; i < frequencyData.length; i++) {
    const mag = Math.pow(10, frequencyData[i] / 20);
    const freq = i * binRes;
    weightedSum += mag * Math.pow(freq - centroid, 2);
    totalMag += mag;
  }

  return totalMag > 0 ? Math.sqrt(weightedSum / totalMag) : 0;
}

/**
 * RMS Energy — overall loudness/projection (from time domain).
 */
export function getRMSEnergy(timeDomainData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    sum += timeDomainData[i] * timeDomainData[i];
  }
  return Math.sqrt(sum / timeDomainData.length);
}

/**
 * Harmonic-to-Noise Ratio — clarity vs breathiness.
 * Ratio of energy at harmonic peaks vs total energy.
 */
export function getHarmonicToNoise(
  frequencyData: Float32Array,
  fundamental: number,
  sampleRate: number,
  fftSize: number,
): number {
  const binRes = sampleRate / fftSize;
  let harmonicEnergy = 0;
  let totalEnergy = 0;

  const maxBin = Math.min(frequencyData.length, Math.ceil(600 / binRes));

  for (let i = 1; i < maxBin; i++) {
    const power = Math.pow(10, frequencyData[i] / 10);
    totalEnergy += power;

    const freq = i * binRes;
    for (let h = 1; h <= 8; h++) {
      if (Math.abs(freq - fundamental * h) < binRes * 2) {
        harmonicEnergy += power;
        break;
      }
    }
  }

  return totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0;
}

/**
 * Dynamic Range — amplitude variation over the recording.
 */
export function getDynamicRange(rmsHistory: number[]): number {
  const valid = rmsHistory.filter((v) => v > 0.01);
  if (valid.length < 10) return 0;
  const max = Math.max(...valid);
  const min = Math.min(...valid);
  if (max <= 0) return 0;
  return Math.min(1, (max - min) / max);
}

/**
 * Extract all vocal qualities from a single frame of audio data.
 * Note: dynamicRange and stability require recording history, so they're
 * calculated separately and passed in when building the full VocalQualities.
 */
export function extractFrameQualities(
  timeDomainData: Float32Array,
  frequencyData: Float32Array,
  fundamental: number,
  sampleRate: number,
  fftSize: number,
): { rmsEnergy: number; spectralCentroid: number; spectralSpread: number; harmonicToNoise: number } {
  const rmsEnergy = getRMSEnergy(timeDomainData);
  const spectralCentroid = getSpectralCentroid(frequencyData, sampleRate, fftSize);
  const spectralSpread = getSpectralSpread(frequencyData, spectralCentroid, sampleRate, fftSize);
  const harmonicToNoise =
    fundamental > 0 ? getHarmonicToNoise(frequencyData, fundamental, sampleRate, fftSize) : 0;

  return { rmsEnergy, spectralCentroid, spectralSpread, harmonicToNoise };
}

/**
 * Average frame-level qualities over the full recording.
 */
export function averageVocalQualities(
  frames: { rmsEnergy: number; spectralCentroid: number; spectralSpread: number; harmonicToNoise: number }[],
  stability: number,
  rmsHistory: number[],
): VocalQualities {
  if (frames.length === 0) {
    return {
      rmsEnergy: 0,
      stability,
      spectralCentroid: 0,
      spectralSpread: 0,
      harmonicToNoise: 0,
      dynamicRange: 0,
    };
  }

  const avg = (key: keyof (typeof frames)[0]) =>
    frames.reduce((sum, f) => sum + f[key], 0) / frames.length;

  return {
    rmsEnergy: Math.min(1, avg('rmsEnergy') * 10), // Scale raw RMS to 0-1 range
    stability,
    spectralCentroid: avg('spectralCentroid'),
    spectralSpread: avg('spectralSpread'),
    harmonicToNoise: avg('harmonicToNoise'),
    dynamicRange: getDynamicRange(rmsHistory),
  };
}
