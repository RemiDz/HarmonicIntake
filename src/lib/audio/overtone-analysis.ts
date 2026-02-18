import type { Overtone } from '@/lib/types';

/**
 * Extract overtone amplitudes for harmonics 2-8 from frequency-domain data.
 *
 * @param freqData - Float32Array from AnalyserNode.getFloatFrequencyData() (dB values)
 * @param fundamental - Detected fundamental frequency in Hz
 * @param sampleRate - AudioContext sample rate
 * @param fftSize - FFT size used by the AnalyserNode
 * @returns Array of Overtone objects for harmonics 2-8
 */
export function extractOvertones(
  freqData: Float32Array,
  fundamental: number,
  sampleRate: number,
  fftSize: number,
): Overtone[] {
  if (fundamental <= 0) return [];

  const binResolution = sampleRate / fftSize;
  const fundamentalBin = Math.round(fundamental / binResolution);
  const fundamentalDb = freqData[fundamentalBin] || -100;

  const overtones: Overtone[] = [];

  for (let h = 2; h <= 8; h++) {
    const harmonicFreq = fundamental * h;
    const bin = Math.round(harmonicFreq / binResolution);

    if (bin >= freqData.length) {
      overtones.push({ harmonic: h, freq: harmonicFreq, amplitude: 0, db: -100 });
      continue;
    }

    const db = freqData[bin];
    const relativeDb = db - fundamentalDb;
    // Convert relative dB to linear amplitude (0-1)
    const amplitude = Math.max(0, Math.min(1, Math.pow(10, relativeDb / 20)));

    overtones.push({
      harmonic: h,
      freq: Math.round(harmonicFreq * 10) / 10,
      amplitude: Math.round(amplitude * 1000) / 1000,
      db: Math.round(relativeDb * 10) / 10,
    });
  }

  return overtones;
}

/**
 * Calculate overtone richness as a percentage (0-100).
 * Average of all overtone amplitudes, scaled to 0-100.
 */
export function calculateRichness(overtones: Overtone[]): number {
  if (overtones.length === 0) return 0;
  const avg = overtones.reduce((sum, o) => sum + o.amplitude, 0) / overtones.length;
  return Math.round(avg * 100);
}
