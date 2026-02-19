/**
 * Jitter (Frequency Perturbation)
 *
 * Measures cycle-to-cycle variation in pitch period length — how irregular
 * the vocal fold vibration is. Lower jitter = relaxed, steady vocal fold
 * control. Higher jitter = tension, agitation, or vocal pathology.
 *
 * Normal range: 0.2% – 1.0% (relative jitter). Above 1.04% may indicate pathology.
 *
 * Reference: Teixeira et al. (2013)
 */

export interface JitterResult {
  absolute: number;  // Average absolute period difference (seconds)
  relative: number;  // Absolute jitter / mean period × 100 (percentage)
  rap: number;       // Relative Average Perturbation (3-point smoothed) (percentage)
}

/**
 * Calculate jitter from an array of glottal cycle periods.
 *
 * @param periods - Array of period durations in seconds
 * @returns Jitter metrics (absolute, relative %, RAP %)
 */
export function calculateJitter(periods: number[]): JitterResult {
  const N = periods.length;
  if (N < 3) return { absolute: 0, relative: 0, rap: 0 };

  // Mean period
  const meanPeriod = periods.reduce((a, b) => a + b, 0) / N;

  // Absolute jitter: average absolute difference between consecutive periods
  let sumDiff = 0;
  for (let i = 0; i < N - 1; i++) {
    sumDiff += Math.abs(periods[i] - periods[i + 1]);
  }
  const absolute = sumDiff / (N - 1);

  // Relative jitter: absolute jitter / mean period × 100
  const relative = meanPeriod > 0 ? (absolute / meanPeriod) * 100 : 0;

  // RAP (Relative Average Perturbation): 3-point moving average
  let rapSum = 0;
  for (let i = 1; i < N - 1; i++) {
    const localAvg = (periods[i - 1] + periods[i] + periods[i + 1]) / 3;
    rapSum += Math.abs(periods[i] - localAvg);
  }
  const rap = meanPeriod > 0 ? (rapSum / (N - 2)) / meanPeriod * 100 : 0;

  return { absolute, relative, rap };
}
