const NOISE_THRESHOLD = 0.01;
const MIN_FREQ = 50;
const MAX_FREQ = 600;

/**
 * Detect the fundamental frequency from a time-domain audio buffer
 * using autocorrelation with parabolic interpolation.
 *
 * @param buffer - Float32Array from AnalyserNode.getFloatTimeDomainData()
 * @param sampleRate - AudioContext sample rate (typically 44100 or 48000)
 * @returns Detected frequency in Hz, or -1 if silence/no pitch detected
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const n = buffer.length;

  // 1. Noise gate: compute RMS, reject if too quiet
  let rms = 0;
  for (let i = 0; i < n; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / n);
  if (rms < NOISE_THRESHOLD) return -1;

  // 2. Normalize the buffer
  const normalized = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    normalized[i] = buffer[i] / rms;
  }

  // 3. Compute autocorrelation
  // Only search lags corresponding to MIN_FREQ–MAX_FREQ
  const minLag = Math.floor(sampleRate / MAX_FREQ);
  const maxLag = Math.ceil(sampleRate / MIN_FREQ);
  const searchEnd = Math.min(maxLag, Math.floor(n / 2));

  const autocorrelation = new Float32Array(searchEnd + 1);
  for (let lag = minLag; lag <= searchEnd; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += normalized[i] * normalized[i + lag];
    }
    autocorrelation[lag] = sum;
  }

  // 4. Find the first dip, then the highest peak after it
  let foundDip = false;
  let bestLag = -1;
  let bestVal = -Infinity;

  for (let lag = minLag; lag <= searchEnd; lag++) {
    if (!foundDip) {
      // Look for the first point where autocorrelation starts increasing
      if (lag > minLag && autocorrelation[lag] > autocorrelation[lag - 1]) {
        foundDip = true;
      }
      continue;
    }

    if (autocorrelation[lag] > bestVal) {
      bestVal = autocorrelation[lag];
      bestLag = lag;
    }
  }

  if (bestLag === -1) return -1;

  // 5. Confidence check: compare peak autocorrelation to zero-lag energy
  // Zero-lag of normalized buffer = n, so confidence = bestVal / n
  const confidence = bestVal / n;
  if (confidence < 0.5) return -1;

  // 6. Parabolic interpolation around the peak for sub-sample accuracy
  const prev = autocorrelation[bestLag - 1] || 0;
  const curr = autocorrelation[bestLag];
  const next = autocorrelation[bestLag + 1] || 0;

  const denominator = 2 * (2 * curr - prev - next);
  let interpolatedLag = bestLag;
  if (denominator !== 0) {
    interpolatedLag = bestLag + (prev - next) / denominator;
  }

  // 7. Convert lag to frequency
  const freq = sampleRate / interpolatedLag;

  // 8. Final range check
  if (freq < MIN_FREQ || freq > MAX_FREQ) return -1;

  return freq;
}
