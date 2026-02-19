/**
 * Glottal Cycle Extraction
 *
 * Detects individual vocal fold vibration cycles from the time-domain signal.
 * This is the foundation for jitter (period perturbation) and shimmer
 * (amplitude perturbation) measurements.
 *
 * Method: Find positive-going zero crossings, then validate that the distance
 * between consecutive crossings matches the expected fundamental period
 * (within ±30% tolerance to handle natural variation without accepting noise).
 */

export interface GlottalCycle {
  periodSamples: number;
  periodSeconds: number;
  peakAmplitude: number;
}

/**
 * Extract glottal cycles from time-domain audio data.
 *
 * @param timeDomainData - Raw audio samples from AnalyserNode
 * @param sampleRate - AudioContext sample rate (typically 44100 or 48000)
 * @param fundamental - Detected F0 in Hz (used to set expected period range)
 * @returns Array of detected glottal cycles with period and amplitude info
 */
export function extractGlottalCycles(
  timeDomainData: Float32Array,
  sampleRate: number,
  fundamental: number,
): GlottalCycle[] {
  if (fundamental <= 0) return [];

  const expectedPeriod = sampleRate / fundamental;
  const minPeriod = expectedPeriod * 0.7;
  const maxPeriod = expectedPeriod * 1.4;

  const cycles: GlottalCycle[] = [];

  // Find positive-going zero crossings
  const crossings: number[] = [];
  for (let i = 1; i < timeDomainData.length; i++) {
    if (timeDomainData[i - 1] <= 0 && timeDomainData[i] > 0) {
      crossings.push(i);
    }
  }

  // Extract cycles between consecutive zero crossings that match expected period
  for (let i = 0; i < crossings.length - 1; i++) {
    const periodSamples = crossings[i + 1] - crossings[i];

    if (periodSamples >= minPeriod && periodSamples <= maxPeriod) {
      // Find peak absolute amplitude within this cycle
      let peak = 0;
      for (let j = crossings[i]; j < crossings[i + 1]; j++) {
        peak = Math.max(peak, Math.abs(timeDomainData[j]));
      }

      cycles.push({
        periodSamples,
        periodSeconds: periodSamples / sampleRate,
        peakAmplitude: peak,
      });
    }
  }

  return cycles;
}
