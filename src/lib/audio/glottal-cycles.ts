/**
 * Glottal Cycle Extraction
 *
 * Detects individual vocal fold vibration cycles from the time-domain signal.
 * This is the foundation for jitter (period perturbation) and shimmer
 * (amplitude perturbation) measurements.
 *
 * Method: Apply a DC blocking filter, then find positive-going zero crossings,
 * then validate that the distance between consecutive crossings matches the
 * expected fundamental period (within ±30% tolerance to handle natural
 * variation without accepting noise).
 */

export interface GlottalCycle {
  periodSamples: number;
  periodSeconds: number;
  peakAmplitude: number;
}

// Module-level reusable buffer for DC-blocked signal — allocated once, reused every frame
let _dcBlockedBuf: Float32Array | null = null;

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

  const n = timeDomainData.length;

  // DC blocker: y[n] = x[n] - x[n-1] + R * y[n-1]
  // R = 0.995 gives a high-pass corner around 35 Hz at 44100 Hz.
  // This removes DC offset and sub-bass rumble without affecting vocal frequencies.
  // Microphones, especially on mobile, commonly introduce small DC offsets
  // that shift ALL zero-crossing positions, corrupting jitter and shimmer.
  const R = 0.995;
  if (!_dcBlockedBuf || _dcBlockedBuf.length !== n) {
    _dcBlockedBuf = new Float32Array(n);
  }
  let xPrev = 0;
  let yPrev = 0;
  for (let i = 0; i < n; i++) {
    _dcBlockedBuf[i] = timeDomainData[i] - xPrev + R * yPrev;
    xPrev = timeDomainData[i];
    yPrev = _dcBlockedBuf[i];
  }

  const expectedPeriod = sampleRate / fundamental;
  const minPeriod = expectedPeriod * 0.7;
  const maxPeriod = expectedPeriod * 1.4;

  const cycles: GlottalCycle[] = [];

  // Find positive-going zero crossings on DC-blocked signal
  const crossings: number[] = [];
  for (let i = 1; i < n; i++) {
    if (_dcBlockedBuf[i - 1] <= 0 && _dcBlockedBuf[i] > 0) {
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
        peak = Math.max(peak, Math.abs(_dcBlockedBuf[j]));
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
