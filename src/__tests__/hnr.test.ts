import { describe, it, expect } from 'vitest';
import { calculateHNR } from '@/lib/audio/hnr';

describe('calculateHNR', () => {
  const sampleRate = 44100;
  const fftSize = 4096;
  const binCount = fftSize / 2;
  const binRes = sampleRate / fftSize;

  function createFrequencyData(fundamental: number, harmonicLevel: number, noiseLevel: number): Float32Array {
    // Create synthetic FFT data with harmonics at specified level and noise floor
    const data = new Float32Array(binCount);
    data.fill(noiseLevel); // Noise floor in dB

    // Add harmonics
    for (let h = 1; h <= 12; h++) {
      const freq = fundamental * h;
      if (freq > 4000) break;
      const bin = Math.round(freq / binRes);
      if (bin < data.length) {
        data[bin] = harmonicLevel; // Harmonic peaks in dB
      }
    }

    return data;
  }

  it('returns 0 when fundamental is 0 or negative', () => {
    const data = new Float32Array(binCount);
    expect(calculateHNR(data, 0, sampleRate, fftSize)).toBe(0);
    expect(calculateHNR(data, -1, sampleRate, fftSize)).toBe(0);
  });

  it('returns high HNR for strong harmonics with low noise', () => {
    const data = createFrequencyData(220, -10, -80);
    const hnr = calculateHNR(data, 220, sampleRate, fftSize);
    expect(hnr).toBeGreaterThan(20); // Healthy range
  });

  it('returns lower HNR for weaker harmonics with higher noise', () => {
    const data = createFrequencyData(220, -30, -40);
    const hnr = calculateHNR(data, 220, sampleRate, fftSize);
    expect(hnr).toBeLessThan(20);
  });

  it('caps at 40 dB maximum', () => {
    // Create extremely harmonic signal with zero noise
    const data = new Float32Array(binCount).fill(-200);
    const bin = Math.round(220 / binRes);
    data[bin] = 0;
    const hnr = calculateHNR(data, 220, sampleRate, fftSize);
    expect(hnr).toBeLessThanOrEqual(40);
  });

  it('works for typical male voice (130 Hz)', () => {
    const data = createFrequencyData(130, -15, -60);
    const hnr = calculateHNR(data, 130, sampleRate, fftSize);
    expect(hnr).toBeGreaterThan(10);
    expect(hnr).toBeLessThanOrEqual(40);
  });

  it('works for typical female voice (220 Hz)', () => {
    const data = createFrequencyData(220, -15, -60);
    const hnr = calculateHNR(data, 220, sampleRate, fftSize);
    expect(hnr).toBeGreaterThan(10);
    expect(hnr).toBeLessThanOrEqual(40);
  });
});
