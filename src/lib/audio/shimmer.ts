/**
 * Shimmer (Amplitude Perturbation)
 *
 * Measures cycle-to-cycle variation in peak amplitude — how irregular the
 * loudness is between consecutive vocal fold cycles. Higher shimmer = breathier,
 * less controlled voice. Lower shimmer = clear, steady projection.
 *
 * Normal range: 0.1 – 0.35 dB (Shimmer dB). Above 0.35 dB may indicate vocal strain.
 *
 * Reference: Teixeira et al. (2013)
 */

export interface ShimmerResult {
  db: number;        // Average absolute log amplitude difference (dB)
  relative: number;  // Average absolute amplitude difference / mean amplitude × 100 (%)
  apq3: number;      // 3-point Amplitude Perturbation Quotient (%)
}

/**
 * Calculate shimmer from an array of glottal cycle peak amplitudes.
 *
 * @param amplitudes - Array of peak amplitudes (one per cycle)
 * @returns Shimmer metrics (dB, relative %, APQ3 %)
 */
export function calculateShimmer(amplitudes: number[]): ShimmerResult {
  const N = amplitudes.length;
  if (N < 3) return { db: 0, relative: 0, apq3: 0 };

  const meanAmp = amplitudes.reduce((a, b) => a + b, 0) / N;

  // Shimmer (dB): average absolute log difference between consecutive amplitudes
  let sumLogDiff = 0;
  for (let i = 0; i < N - 1; i++) {
    if (amplitudes[i] > 0 && amplitudes[i + 1] > 0) {
      sumLogDiff += Math.abs(20 * Math.log10(amplitudes[i + 1] / amplitudes[i]));
    }
  }
  const db = sumLogDiff / (N - 1);

  // Relative shimmer: average absolute amplitude difference / mean amplitude
  let sumAbsDiff = 0;
  for (let i = 0; i < N - 1; i++) {
    sumAbsDiff += Math.abs(amplitudes[i] - amplitudes[i + 1]);
  }
  const relative = meanAmp > 0 ? (sumAbsDiff / (N - 1)) / meanAmp * 100 : 0;

  // APQ3: 3-point amplitude perturbation quotient
  let apq3Sum = 0;
  for (let i = 1; i < N - 1; i++) {
    const localAvg = (amplitudes[i - 1] + amplitudes[i] + amplitudes[i + 1]) / 3;
    apq3Sum += Math.abs(amplitudes[i] - localAvg);
  }
  const apq3 = meanAmp > 0 ? (apq3Sum / (N - 2)) / meanAmp * 100 : 0;

  return { db, relative, apq3 };
}
