/**
 * Harmonic-to-Noise Ratio (HNR)
 *
 * Ratio of periodic (harmonic) energy to aperiodic (noise) energy in the voice.
 * Higher HNR = clear, resonant, healthy voice. Lower HNR = breathy, strained.
 * Women typically have higher HNR than men. Stress can reduce HNR.
 *
 * Normal range: 20-40 dB (healthy), below 20 dB may indicate pathology or strain.
 *
 * Method: Compare harmonic energy at fundamental and overtone bins vs total energy
 * in the FFT, scanning up to 4000 Hz with ±1 bin tolerance for harmonics 1-12.
 */

/**
 * Calculate Harmonic-to-Noise Ratio in dB.
 *
 * @param frequencyData - Float32Array from AnalyserNode.getFloatFrequencyData() (dB values)
 * @param fundamental - Detected fundamental frequency in Hz
 * @param sampleRate - AudioContext sample rate
 * @param fftSize - AnalyserNode FFT size
 * @returns HNR in dB (capped at 50 dB)
 */
export function calculateHNR(
  frequencyData: Float32Array,
  fundamental: number,
  sampleRate: number,
  fftSize: number,
): number {
  if (fundamental <= 0) return 0;

  const binRes = sampleRate / fftSize;
  const maxBin = Math.min(frequencyData.length, Math.ceil(4000 / binRes));

  let harmonicPower = 0;
  let totalPower = 0;

  for (let i = 1; i < maxBin; i++) {
    const power = Math.pow(10, frequencyData[i] / 10);
    totalPower += power;

    // Check if this bin is near a harmonic (tolerance scales with harmonic number)
    const freq = i * binRes;
    for (let h = 1; h <= 12; h++) {
      const harmonicFreq = fundamental * h;
      if (harmonicFreq > 4000) break;
      const tolerance = Math.max(1, Math.round(h * 0.5));
      if (Math.abs(freq - harmonicFreq) <= binRes * tolerance) {
        harmonicPower += power;
        break;
      }
    }
  }

  const noisePower = totalPower - harmonicPower;
  if (noisePower <= 0) return 50; // Cap at 50 dB
  return Math.min(50, 10 * Math.log10(harmonicPower / noisePower));
}
