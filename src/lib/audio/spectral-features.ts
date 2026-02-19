/**
 * Spectral Features — Centroid and Slope
 *
 * Spectral Centroid: "Centre of mass" of the frequency spectrum — perceived brightness.
 * Higher centroid = brighter, more energised voice. Lower = warmer, heavier.
 *
 * Spectral Slope / Tilt: Rate at which energy drops off from low to high frequencies.
 * Steep slope = more energy in lows (relaxed, grounded).
 * Flat/gentle slope = energy spread across highs (alert, activated, stressed).
 */

/**
 * Calculate the spectral centroid (perceived brightness) in Hz.
 *
 * @param frequencyData - Float32Array from getFloatFrequencyData() (dB values)
 * @param sampleRate - AudioContext sample rate
 * @param fftSize - AnalyserNode FFT size
 * @returns Spectral centroid in Hz
 */
export function getSpectralCentroid(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
): number {
  const binRes = sampleRate / fftSize;
  let weightedSum = 0;
  let totalMag = 0;

  for (let i = 1; i < frequencyData.length; i++) {
    const mag = Math.pow(10, frequencyData[i] / 20);
    const freq = i * binRes;
    weightedSum += mag * freq;
    totalMag += mag;
  }

  return totalMag > 0 ? weightedSum / totalMag : 0;
}

/**
 * Calculate the spectral slope (dB/Hz) via linear regression over 60-4000 Hz.
 * Negative = steep rolloff (warm). Closer to 0 = flat (bright).
 *
 * @param frequencyData - Float32Array from getFloatFrequencyData() (dB values)
 * @param sampleRate - AudioContext sample rate
 * @param fftSize - AnalyserNode FFT size
 * @returns Spectral slope in dB/Hz
 */
export function getSpectralSlope(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
): number {
  const binRes = sampleRate / fftSize;
  const startBin = Math.ceil(60 / binRes);
  const endBin = Math.min(frequencyData.length, Math.ceil(4000 / binRes));

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let n = 0;

  for (let i = startBin; i < endBin; i++) {
    const freq = i * binRes;
    const db = frequencyData[i];
    sumX += freq;
    sumY += db;
    sumXY += freq * db;
    sumX2 += freq * freq;
    n++;
  }

  if (n === 0) return 0;

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}
