import type { FrequencyProfile, Overtone, VocalQualities } from '@/lib/types';
import { frequencyToNote } from '@/lib/music/note-mapping';
import { frequencyToChakra } from '@/lib/music/chakra-mapping';
import { getPerfectFifth, getMinorThird } from '@/lib/music/intervals';
import { calculateRichness } from '@/lib/audio/overtone-analysis';
import { calculateChakraScores } from '@/lib/audio/chakra-analysis';

/**
 * Calculate tonal stability from a buffer of frequency readings.
 * Uses coefficient of variation (CV = stddev / mean).
 * Stability = clamp(1 - CV * 10, 0, 1).
 */
export function calculateStability(readings: number[]): number {
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
 * Average frequency data snapshots for final chakra scoring.
 */
function averageFrequencyData(snapshots: Float32Array[]): Float32Array {
  if (snapshots.length === 0) return new Float32Array(0);
  const length = snapshots[0].length;
  const averaged = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (const snapshot of snapshots) {
      sum += snapshot[i];
    }
    averaged[i] = sum / snapshots.length;
  }

  return averaged;
}

export interface RecordingData {
  readings: number[];
  overtoneSnapshots: Overtone[][];
  frequencyDataSnapshots: Float32Array[];
  vocalQualities: VocalQualities;
  sampleRate: number;
  fftSize: number;
}

/**
 * Build a complete FrequencyProfile from raw recording data.
 */
export function buildProfile(data: RecordingData): FrequencyProfile {
  const { readings, overtoneSnapshots, frequencyDataSnapshots, vocalQualities, sampleRate, fftSize } = data;

  const validReadings = readings.filter((r) => r > 0);

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

  // Full 7-chakra scoring using averaged frequency data
  const avgFreqData = averageFrequencyData(frequencyDataSnapshots);
  const chakraScores =
    avgFreqData.length > 0
      ? calculateChakraScores(avgFreqData, fundamental, overtones, vocalQualities, richness, sampleRate, fftSize)
      : [];

  const dominantChakra =
    chakraScores.length > 0
      ? chakraScores.reduce((a, b) => (b.score > a.score ? b : a))
      : { name: chakra.name, color: chakra.color, score: 0, label: 'Quiet', description: '' };

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
    chakraScores,
    vocalQualities,
    dominantChakra,
  };
}
