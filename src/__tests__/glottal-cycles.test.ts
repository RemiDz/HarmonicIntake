import { describe, it, expect } from 'vitest';
import { extractGlottalCycles } from '@/lib/audio/glottal-cycles';

describe('extractGlottalCycles', () => {
  const sampleRate = 44100;

  function createSineWave(freq: number, length: number, amplitude: number = 0.5): Float32Array {
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      data[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }
    return data;
  }

  it('returns empty for fundamental <= 0', () => {
    const data = new Float32Array(4096);
    expect(extractGlottalCycles(data, sampleRate, 0)).toEqual([]);
    expect(extractGlottalCycles(data, sampleRate, -1)).toEqual([]);
  });

  it('detects cycles in a clean 130Hz sine wave (male voice)', () => {
    const data = createSineWave(130, 4096);
    const cycles = extractGlottalCycles(data, sampleRate, 130);

    expect(cycles.length).toBeGreaterThan(5);

    // Each cycle should be close to the expected period
    const expectedPeriod = 1 / 130;
    for (const cycle of cycles) {
      expect(cycle.periodSeconds).toBeCloseTo(expectedPeriod, 3);
      expect(cycle.peakAmplitude).toBeGreaterThan(0);
    }
  });

  it('detects cycles in a clean 220Hz sine wave (female voice)', () => {
    const data = createSineWave(220, 4096);
    const cycles = extractGlottalCycles(data, sampleRate, 220);

    expect(cycles.length).toBeGreaterThan(10);

    const expectedPeriod = 1 / 220;
    for (const cycle of cycles) {
      expect(cycle.periodSeconds).toBeCloseTo(expectedPeriod, 3);
    }
  });

  it('peak amplitude matches the sine wave amplitude', () => {
    const amplitude = 0.3;
    const data = createSineWave(200, 4096, amplitude);
    const cycles = extractGlottalCycles(data, sampleRate, 200);

    for (const cycle of cycles) {
      // Peak should be close to the sine amplitude.
      // The DC blocker's startup transient can cause slight overshoot (~6%),
      // so we allow up to 1.1× rather than a tight 1.01× bound.
      expect(cycle.peakAmplitude).toBeGreaterThan(amplitude * 0.8);
      expect(cycle.peakAmplitude).toBeLessThanOrEqual(amplitude * 1.1);
    }
  });

  it('rejects cycles that deviate too far from expected period', () => {
    // Create a signal at 200Hz but tell the extractor to expect 100Hz
    // The 200Hz zero crossings happen at half the expected period, so they
    // should be rejected (too short)
    const data = createSineWave(200, 4096);
    const cycles = extractGlottalCycles(data, sampleRate, 100);

    // 200Hz periods are outside the ±30% tolerance of 100Hz period
    // 100Hz period = 441 samples, min = 309, max = 617
    // 200Hz period = 220.5 samples — too short
    expect(cycles.length).toBe(0);
  });

  it('returns empty for silence', () => {
    const data = new Float32Array(4096); // All zeros
    const cycles = extractGlottalCycles(data, sampleRate, 200);
    expect(cycles.length).toBe(0);
  });
});
