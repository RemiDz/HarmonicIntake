import { describe, it, expect } from 'vitest';
import { calculateShimmer } from '@/lib/audio/shimmer';

describe('calculateShimmer', () => {
  it('returns zero for fewer than 3 amplitudes', () => {
    expect(calculateShimmer([0.1, 0.1])).toEqual({ db: 0, relative: 0, apq3: 0 });
    expect(calculateShimmer([])).toEqual({ db: 0, relative: 0, apq3: 0 });
  });

  it('returns zero shimmer for perfectly uniform amplitudes', () => {
    const amplitudes = Array(50).fill(0.1);
    const result = calculateShimmer(amplitudes);
    expect(result.db).toBeCloseTo(0, 10);
    expect(result.relative).toBeCloseTo(0, 10);
    expect(result.apq3).toBeCloseTo(0, 10);
  });

  it('calculates low shimmer for small amplitude variation (healthy voice)', () => {
    const amplitudes = Array(100)
      .fill(null)
      .map(() => 0.1 + (Math.random() - 0.5) * 0.005);
    const result = calculateShimmer(amplitudes);
    expect(result.db).toBeGreaterThan(0);
    expect(result.db).toBeLessThan(0.35); // Normal range
  });

  it('calculates higher shimmer for large amplitude variation', () => {
    // Alternating amplitudes — high shimmer
    const amplitudes = [0.1, 0.15, 0.08, 0.14, 0.07, 0.13, 0.09, 0.16];
    const result = calculateShimmer(amplitudes);
    expect(result.db).toBeGreaterThan(0.35); // Above normal
    expect(result.relative).toBeGreaterThan(10);
  });

  it('shimmer dB uses logarithmic scale', () => {
    // Doubling amplitude should give ~6 dB difference per step
    const amplitudes = [0.1, 0.2, 0.1, 0.2, 0.1, 0.2];
    const result = calculateShimmer(amplitudes);
    // 20 * log10(2) ≈ 6.02 dB per step
    expect(result.db).toBeCloseTo(6.02, 0);
  });

  it('APQ3 is typically lower than relative shimmer (smoothing effect)', () => {
    const amplitudes = [0.1, 0.105, 0.098, 0.103, 0.097, 0.102, 0.099];
    const result = calculateShimmer(amplitudes);
    expect(result.apq3).toBeLessThanOrEqual(result.relative);
  });
});
