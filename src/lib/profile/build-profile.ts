import type { FrequencyProfile, Overtone } from '@/lib/types';
import { frequencyToNote } from '@/lib/music/note-mapping';
import { frequencyToChakra } from '@/lib/music/chakra-mapping';
import { getPerfectFifth, getMinorThird } from '@/lib/music/intervals';
import { calculateRichness } from '@/lib/audio/overtone-analysis';

/**
 * Calculate tonal stability from a buffer of frequency readings.
 * Uses coefficient of variation (CV = stddev / mean).
 * Stability = clamp(1 - CV * 10, 0, 1).
 */
export function calculateStability(readings: number[]): number {
  // Filter out silence markers (-1)
  const valid = readings.filter((r) => r > 0);
  if (valid.length < 2) return 0;

  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  if (mean === 0) return 0;

  const variance = valid.reduce((sum, r) => sum + (r - mean) ** 2, 0) / valid.length;
  const stddev = Math.sqrt(variance);
  const cv = stddev / mean;

  return Math.max(0, Math.min(1, 1 - cv * 10));
}

/**
 * Average overtone snapshots across the recording.
 */
function averageOvertones(snapshots: Overtone[][]): Overtone[] {
  if (snapshots.length === 0) return [];

  const harmonicCount = snapshots[0]?.length || 0;
  const averaged: Overtone[] = [];

  for (let h = 0; h < harmonicCount; h++) {
    let ampSum = 0;
    let dbSum = 0;
    let freqSum = 0;
    let count = 0;

    for (const snapshot of snapshots) {
      if (snapshot[h]) {
        ampSum += snapshot[h].amplitude;
        dbSum += snapshot[h].db;
        freqSum += snapshot[h].freq;
        count++;
      }
    }

    if (count > 0) {
      averaged.push({
        harmonic: h + 2,
        freq: Math.round((freqSum / count) * 10) / 10,
        amplitude: Math.round((ampSum / count) * 1000) / 1000,
        db: Math.round((dbSum / count) * 10) / 10,
      });
    }
  }

  return averaged;
}

/**
 * Build a complete FrequencyProfile from raw recording data.
 */
export function buildProfile(
  readings: number[],
  overtoneSnapshots: Overtone[][],
): FrequencyProfile {
  // Filter out silence readings
  const validReadings = readings.filter((r) => r > 0);

  // Average fundamental frequency
  const fundamental =
    validReadings.length > 0
      ? Math.round((validReadings.reduce((a, b) => a + b, 0) / validReadings.length) * 10) / 10
      : 0;

  const noteInfo = frequencyToNote(fundamental);
  const chakra = frequencyToChakra(fundamental);
  const stability = calculateStability(readings);
  const overtones = averageOvertones(overtoneSnapshots);
  const richness = calculateRichness(overtones);
  const fifth = getPerfectFifth(fundamental);
  const third = getMinorThird(fundamental);

  return {
    fundamental,
    noteInfo,
    chakra,
    stability,
    overtones,
    richness,
    fifth,
    third,
    timestamp: new Date(),
  };
}
