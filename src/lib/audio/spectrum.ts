const NUM_BANDS = 64;

/**
 * Extract spectrum band data from frequency-domain data for visualization.
 * Uses logarithmic binning so low frequencies get more visual space.
 *
 * @param freqData - Float32Array from AnalyserNode.getFloatFrequencyData() (dB values)
 * @param fftSize - FFT size used by AnalyserNode
 * @returns Array of NUM_BANDS normalized values (0-1) for visualization
 */
export function extractSpectrum(freqData: Float32Array, fftSize: number): number[] {
  const numBins = fftSize / 2;
  const bands: number[] = new Array(NUM_BANDS);

  // Map bands logarithmically across the frequency bins
  for (let i = 0; i < NUM_BANDS; i++) {
    const t = i / NUM_BANDS;
    // Logarithmic mapping: more resolution at low frequencies
    const startBin = Math.floor(Math.pow(t, 2) * numBins);
    const endBin = Math.floor(Math.pow((i + 1) / NUM_BANDS, 2) * numBins);

    let sum = 0;
    let count = 0;
    for (let bin = startBin; bin <= Math.min(endBin, numBins - 1); bin++) {
      // freqData is in dB (typically -100 to 0)
      // Normalize to 0-1 range
      const normalized = (freqData[bin] + 100) / 100;
      sum += Math.max(0, Math.min(1, normalized));
      count++;
    }

    bands[i] = count > 0 ? sum / count : 0;
  }

  return bands;
}
