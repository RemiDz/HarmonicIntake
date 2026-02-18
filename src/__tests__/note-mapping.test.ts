import { describe, it, expect } from 'vitest';
import { frequencyToNote, noteToFrequency } from '@/lib/music/note-mapping';

describe('frequencyToNote', () => {
  it('maps A4 (440Hz) correctly', () => {
    const result = frequencyToNote(440);
    expect(result.note).toBe('A');
    expect(result.octave).toBe(4);
    expect(result.cents).toBe(0);
  });

  it('maps C4 (261.63Hz) correctly', () => {
    const result = frequencyToNote(261.63);
    expect(result.note).toBe('C');
    expect(result.octave).toBe(4);
    expect(Math.abs(result.cents)).toBeLessThanOrEqual(2);
  });

  it('maps E2 (~82.41Hz) correctly', () => {
    const result = frequencyToNote(82.41);
    expect(result.note).toBe('E');
    expect(result.octave).toBe(2);
    expect(Math.abs(result.cents)).toBeLessThanOrEqual(2);
  });

  it('maps G#3 (~207.65Hz) correctly', () => {
    const result = frequencyToNote(207.65);
    expect(result.note).toBe('G#');
    expect(result.octave).toBe(3);
    expect(Math.abs(result.cents)).toBeLessThanOrEqual(2);
  });

  it('reports positive cents when sharp', () => {
    // Slightly above A4
    const result = frequencyToNote(445);
    expect(result.note).toBe('A');
    expect(result.octave).toBe(4);
    expect(result.cents).toBeGreaterThan(0);
  });

  it('reports negative cents when flat', () => {
    // Slightly below A4
    const result = frequencyToNote(435);
    expect(result.note).toBe('A');
    expect(result.octave).toBe(4);
    expect(result.cents).toBeLessThan(0);
  });

  it('handles zero frequency', () => {
    const result = frequencyToNote(0);
    expect(result.note).toBe('-');
  });

  it('handles very low frequencies', () => {
    const result = frequencyToNote(55);
    expect(result.note).toBe('A');
    expect(result.octave).toBe(1);
  });

  it('handles very high frequencies', () => {
    const result = frequencyToNote(880);
    expect(result.note).toBe('A');
    expect(result.octave).toBe(5);
    expect(result.cents).toBe(0);
  });
});

describe('noteToFrequency', () => {
  it('converts A4 back to 440Hz', () => {
    expect(noteToFrequency('A', 4)).toBeCloseTo(440, 1);
  });

  it('converts C4 correctly', () => {
    expect(noteToFrequency('C', 4)).toBeCloseTo(261.63, 0);
  });

  it('returns 0 for invalid note', () => {
    expect(noteToFrequency('X', 4)).toBe(0);
  });
});
