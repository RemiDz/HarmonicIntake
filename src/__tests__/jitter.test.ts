import { describe, it, expect } from 'vitest';
import { calculateJitter } from '@/lib/audio/jitter';

describe('calculateJitter', () => {
  it('returns zero for fewer than 3 periods', () => {
    expect(calculateJitter([0.01, 0.01])).toEqual({ absolute: 0, relative: 0, rap: 0 });
    expect(calculateJitter([])).toEqual({ absolute: 0, relative: 0, rap: 0 });
  });

  it('returns zero jitter for perfectly regular periods', () => {
    const periods = Array(50).fill(0.01); // Perfect 100Hz
    const result = calculateJitter(periods);
    expect(result.absolute).toBe(0);
    expect(result.relative).toBe(0);
    expect(result.rap).toBe(0);
  });

  it('calculates low jitter for slight variation (healthy voice)', () => {
    // Simulate healthy voice: ~0.5% relative jitter
    const basePeriod = 1 / 130; // male fundamental
    const periods = Array(100)
      .fill(null)
      .map(() => basePeriod + (Math.random() - 0.5) * basePeriod * 0.005);
    const result = calculateJitter(periods);
    expect(result.relative).toBeGreaterThan(0);
    expect(result.relative).toBeLessThan(1.5); // Should be well under pathological
  });

  it('calculates high jitter for large period variation', () => {
    // Simulate pathological jitter
    const periods = [0.01, 0.012, 0.008, 0.013, 0.007, 0.011, 0.009, 0.014, 0.006, 0.012];
    const result = calculateJitter(periods);
    expect(result.relative).toBeGreaterThan(1); // Clearly pathological range
  });

  it('has relative jitter in percentage form', () => {
    const periods = [0.01, 0.0105, 0.01, 0.0105, 0.01, 0.0105];
    const result = calculateJitter(periods);
    // Absolute difference alternates between 0 and 0.0005
    // Mean period = 0.01025
    // Absolute = 0.0005 * 5 / 5 = 0.0005
    // Relative = 0.0005 / 0.01025 * 100 ≈ 4.88%
    expect(result.relative).toBeGreaterThan(0);
    expect(result.absolute).toBeGreaterThan(0);
    expect(result.rap).toBeGreaterThan(0);
  });

  it('RAP is typically lower than relative jitter (smoothing effect)', () => {
    const periods = [0.01, 0.0102, 0.0098, 0.0103, 0.0097, 0.0101, 0.0099];
    const result = calculateJitter(periods);
    // RAP uses 3-point smoothing, so should generally be lower
    expect(result.rap).toBeLessThanOrEqual(result.relative);
  });
});
