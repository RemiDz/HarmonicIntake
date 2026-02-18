import { describe, it, expect } from 'vitest';
import { detectPitch } from '@/lib/audio/pitch-detection';

const SAMPLE_RATE = 44100;
const FFT_SIZE = 4096;

/**
 * Generate a synthetic sine wave buffer at a given frequency.
 */
function generateSineWave(freq: number, amplitude: number = 0.5): Float32Array {
  const buffer = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    buffer[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE);
  }
  return buffer;
}

describe('detectPitch', () => {
  it('detects A4 (440Hz) within ±2Hz', () => {
    const buffer = generateSineWave(440);
    const result = detectPitch(buffer, SAMPLE_RATE);
    expect(result).toBeGreaterThan(438);
    expect(result).toBeLessThan(442);
  });

  it('detects low frequency (100Hz) within ±2Hz', () => {
    const buffer = generateSineWave(100);
    const result = detectPitch(buffer, SAMPLE_RATE);
    expect(result).toBeGreaterThan(98);
    expect(result).toBeLessThan(102);
  });

  it('detects mid frequency (220Hz) within ±2Hz', () => {
    const buffer = generateSineWave(220);
    const result = detectPitch(buffer, SAMPLE_RATE);
    expect(result).toBeGreaterThan(218);
    expect(result).toBeLessThan(222);
  });

  it('detects higher frequency (500Hz) within ±3Hz', () => {
    const buffer = generateSineWave(500);
    const result = detectPitch(buffer, SAMPLE_RATE);
    expect(result).toBeGreaterThan(497);
    expect(result).toBeLessThan(503);
  });

  it('returns -1 for silence (all zeros)', () => {
    const buffer = new Float32Array(FFT_SIZE);
    const result = detectPitch(buffer, SAMPLE_RATE);
    expect(result).toBe(-1);
  });

  it('returns -1 for very quiet signal', () => {
    const buffer = generateSineWave(440, 0.001);
    const result = detectPitch(buffer, SAMPLE_RATE);
    expect(result).toBe(-1);
  });

  it('detects C3 (~130.81Hz) within ±2Hz', () => {
    const buffer = generateSineWave(130.81);
    const result = detectPitch(buffer, SAMPLE_RATE);
    expect(result).toBeGreaterThan(128.81);
    expect(result).toBeLessThan(132.81);
  });
});
