const NOISE_THRESHOLD = 0.003;
const MIN_FREQ = 50;
const MAX_FREQ = 600;

// Module-level reusable buffers — allocated once, reused every frame
// to avoid GC pressure from ~60 allocations/second
let _normalizedBuf: Float32Array | null = null;
let _autocorrBuf: Float32Array | null = null;

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

  // 2. Normalize the buffer (reuse allocated array)
  if (!_normalizedBuf || _normalizedBuf.length !== n) {
    _normalizedBuf = new Float32Array(n);
  }
  for (let i = 0; i < n; i++) {
    _normalizedBuf[i] = buffer[i] / rms;
  }

  // 3. Compute autocorrelation
  // Only search lags corresponding to MIN_FREQ–MAX_FREQ
  const minLag = Math.floor(sampleRate / MAX_FREQ);
  const maxLag = Math.ceil(sampleRate / MIN_FREQ);
  const searchEnd = Math.min(maxLag, Math.floor(n / 2));

  // Reuse autocorrelation buffer
  const acSize = searchEnd + 1;
  if (!_autocorrBuf || _autocorrBuf.length < acSize) {
    _autocorrBuf = new Float32Array(acSize);
  } else {
    _autocorrBuf.fill(0, 0, acSize);
  }
  for (let lag = minLag; lag <= searchEnd; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += _normalizedBuf[i] * _normalizedBuf[i + lag];
    }
    _autocorrBuf[lag] = sum;
  }

  // 4. Find the first dip, then the highest peak after it
  let foundDip = false;
  let bestLag = -1;
  let bestVal = -Infinity;

  for (let lag = minLag; lag <= searchEnd; lag++) {
    if (!foundDip) {
      // Look for the first point where autocorrelation starts increasing
      if (lag > minLag && _autocorrBuf[lag] > _autocorrBuf[lag - 1]) {
        foundDip = true;
      }
      continue;
    }

    if (_autocorrBuf[lag] > bestVal) {
      bestVal = _autocorrBuf[lag];
      bestLag = lag;
    }
  }

  if (bestLag === -1) return -1;

  // 5. Confidence check: compare peak autocorrelation to zero-lag energy
  // Zero-lag of normalized buffer = n, so confidence = bestVal / n
  const confidence = bestVal / n;
  if (confidence < 0.35) return -1;

  // 6. Parabolic interpolation around the peak for sub-sample accuracy
  const prev = _autocorrBuf[bestLag - 1] || 0;
  const curr = _autocorrBuf[bestLag];
  const next = _autocorrBuf[bestLag + 1] || 0;

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
