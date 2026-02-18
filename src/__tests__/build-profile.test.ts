import { describe, it, expect } from 'vitest';
import { buildProfile, calculateStability } from '@/lib/profile/build-profile';
import type { Overtone, VocalQualities } from '@/lib/types';

describe('calculateStability', () => {
  it('returns high stability for consistent readings', () => {
    const readings = Array(30).fill(440);
    expect(calculateStability(readings)).toBeCloseTo(1, 1);
  });

  it('returns low stability for wildly varying readings', () => {
    const readings = [100, 500, 100, 500, 100, 500, 100, 500];
    expect(calculateStability(readings)).toBeLessThan(0.3);
  });

  it('returns 0 for empty array', () => {
    expect(calculateStability([])).toBe(0);
  });

  it('returns 0 for all silence readings', () => {
    expect(calculateStability([-1, -1, -1])).toBe(0);
  });

  it('filters out silence markers', () => {
    const readings = [440, -1, 440, -1, 440];
    expect(calculateStability(readings)).toBeCloseTo(1, 1);
  });

  it('returns moderate stability for slight variation', () => {
    const readings = [440, 445, 438, 442, 440, 443, 437, 441];
    const stability = calculateStability(readings);
    expect(stability).toBeGreaterThan(0.8);
    expect(stability).toBeLessThanOrEqual(1);
  });
});

const mockVocalQualities: VocalQualities = {
  rmsEnergy: 0.5,
  stability: 0.9,
  spectralCentroid: 300,
  spectralSpread: 100,
  harmonicToNoise: 0.6,
  dynamicRange: 0.3,
};

describe('buildProfile', () => {
  const mockOvertones: Overtone[] = [
    { harmonic: 2, freq: 880, amplitude: 0.5, db: -6 },
    { harmonic: 3, freq: 1320, amplitude: 0.3, db: -10 },
    { harmonic: 4, freq: 1760, amplitude: 0.2, db: -14 },
    { harmonic: 5, freq: 2200, amplitude: 0.1, db: -20 },
    { harmonic: 6, freq: 2640, amplitude: 0.05, db: -26 },
    { harmonic: 7, freq: 3080, amplitude: 0.02, db: -34 },
    { harmonic: 8, freq: 3520, amplitude: 0.01, db: -40 },
  ];

  it('builds a complete profile from consistent 440Hz readings', () => {
    const readings = Array(60).fill(440);
    const snapshots = Array(60).fill(mockOvertones);

    const profile = buildProfile({
      readings,
      overtoneSnapshots: snapshots,
      frequencyDataSnapshots: [],
      vocalQualities: mockVocalQualities,
      sampleRate: 44100,
      fftSize: 4096,
    });

    expect(profile.fundamental).toBe(440);
    expect(profile.noteInfo.note).toBe('A');
    expect(profile.noteInfo.octave).toBe(4);
    expect(profile.chakra.name).toBe('Third Eye');
    expect(profile.stability).toBeCloseTo(1, 1);
    expect(profile.overtones).toHaveLength(7);
    expect(profile.richness).toBeGreaterThan(0);
    expect(profile.fifth.freq).toBeCloseTo(660, 0);
    expect(profile.third.freq).toBeCloseTo(528, 0);
    expect(profile.timestamp).toBeInstanceOf(Date);
    expect(profile.vocalQualities).toEqual(mockVocalQualities);
    expect(profile.dominantChakra).toBeDefined();
  });

  it('handles readings with silence mixed in', () => {
    const readings = [440, -1, 440, -1, 440];
    const snapshots = [mockOvertones, mockOvertones, mockOvertones];

    const profile = buildProfile({
      readings,
      overtoneSnapshots: snapshots,
      frequencyDataSnapshots: [],
      vocalQualities: mockVocalQualities,
      sampleRate: 44100,
      fftSize: 4096,
    });

    expect(profile.fundamental).toBe(440);
    expect(profile.stability).toBeGreaterThan(0.9);
  });

  it('handles all silence readings', () => {
    const readings = [-1, -1, -1];
    const profile = buildProfile({
      readings,
      overtoneSnapshots: [],
      frequencyDataSnapshots: [],
      vocalQualities: mockVocalQualities,
      sampleRate: 44100,
      fftSize: 4096,
    });

    expect(profile.fundamental).toBe(0);
    expect(profile.stability).toBe(0);
  });
});
