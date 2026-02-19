/**
 * Formant Frequency Extraction (F1, F2, F3)
 *
 * Formants are the resonant frequencies of the vocal tract — the shapes
 * created by throat, mouth, and nasal cavities. They are THE primary
 * differentiator between individuals.
 *
 * Typical ranges:
 *   F1: Male 270-730 Hz, Female 310-850 Hz (jaw/throat openness)
 *   F2: Male 840-2290 Hz, Female 900-2790 Hz (tongue position/oral cavity)
 *   F3: Male 1690-3010 Hz, Female 1960-3310 Hz (lip rounding/nasal)
 *
 * Method: Simplified spectral peak finding on a smoothed spectral envelope.
 * Not as accurate as LPC analysis, but sufficient for a wellness tool and
 * runs efficiently in the browser.
 */

export interface FormantResult {
  f1: number; // Hz
  f2: number; // Hz
  f3: number; // Hz
}

/**
 * Find the strongest peak within a frequency range from a sorted (by amplitude) peak list.
 */
function findPeakInRange(
  peaks: { freq: number; amp: number }[],
  low: number,
  high: number,
): number {
  for (const p of peaks) {
    if (p.freq >= low && p.freq <= high) return p.freq;
  }
  return 0;
}

/**
 * Extract formant frequencies (F1, F2, F3) from FFT data.
 *
 * @param frequencyData - Float32Array from AnalyserNode.getFloatFrequencyData() (dB values)
 * @param sampleRate - AudioContext sample rate
 * @param fftSize - AnalyserNode FFT size
 * @param fundamental - Detected fundamental frequency (used for smoothing window)
 * @returns Formant frequencies in Hz (with sensible defaults if peaks not found)
 */
export function extractFormants(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
  fundamental: number,
): FormantResult {
  const binRes = sampleRate / fftSize;

  // Create smoothed spectral envelope (remove fine harmonic structure).
  // Use a moving average window wider than the fundamental period spacing.
  const windowBins = Math.max(5, Math.round(fundamental / binRes) * 2);
  const smoothed = new Float32Array(frequencyData.length);

  for (let i = 0; i < frequencyData.length; i++) {
    let sum = 0;
    let count = 0;
    const lo = Math.max(0, i - windowBins);
    const hi = Math.min(frequencyData.length - 1, i + windowBins);
    for (let j = lo; j <= hi; j++) {
      sum += frequencyData[j];
      count++;
    }
    smoothed[i] = sum / count;
  }

  // Find peaks in the smoothed envelope between 200-4000 Hz
  const peaks: { freq: number; amp: number }[] = [];
  const startBin = Math.ceil(200 / binRes);
  const endBin = Math.min(smoothed.length - 1, Math.floor(4000 / binRes));

  for (let i = startBin + 1; i < endBin; i++) {
    if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1]) {
      peaks.push({ freq: i * binRes, amp: smoothed[i] });
    }
  }

  // Sort by amplitude descending (strongest peaks are most likely formants)
  peaks.sort((a, b) => b.amp - a.amp);

  // Extract F1, F2, F3 from peaks in expected ranges (with defaults)
  const f1 = findPeakInRange(peaks, 200, 900) || 500;
  const f2 = findPeakInRange(peaks, 800, 2800) || 1500;
  const f3 = findPeakInRange(peaks, 1500, 3500) || 2500;

  return { f1, f2, f3 };
}
