import type { FrequencyProfile, Overtone, VoiceProfile } from '@/lib/types';
import type { GlottalCycle } from '@/lib/audio/glottal-cycles';
import { frequencyToNote } from '@/lib/music/note-mapping';
import { frequencyToChakra } from '@/lib/music/chakra-mapping';
import { getPerfectFifth, getMinorThird } from '@/lib/music/intervals';
import { calculateRichness } from '@/lib/audio/overtone-analysis';
import { calculateJitter } from '@/lib/audio/jitter';
import { calculateShimmer } from '@/lib/audio/shimmer';
import { calculateHNR } from '@/lib/audio/hnr';
import { extractFormants } from '@/lib/audio/formants';
import { getSpectralCentroid, getSpectralSlope } from '@/lib/audio/spectral-features';
import { calculateChakraScores } from '@/lib/scoring/chakra-scoring';

/**
 * Calculate tonal stability from a buffer of frequency readings.
 * Uses coefficient of variation (CV = stddev / mean).
 * Stability = clamp(1 - CV * 5, 0, 1).
 */
export function calculateStability(readings: number[]): number {
  const valid = readings.filter((r) => r > 0);
  if (valid.length < 2) return 0;

  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  if (mean === 0) return 0;

  const variance = valid.reduce((sum, r) => sum + (r - mean) ** 2, 0) / valid.length;
  const stddev = Math.sqrt(variance);
  const cv = stddev / mean;

  return Math.max(0, Math.min(1, 1 - cv * 5));
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
 * Average frequency data snapshots for spectral analysis.
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

/**
 * Calculate dynamic range from RMS history.
 */
function getDynamicRange(rmsHistory: number[]): number {
  const valid = rmsHistory.filter((v) => v > 0.01);
  if (valid.length < 10) return 0;
  const max = Math.max(...valid);
  const min = Math.min(...valid);
  if (max <= 0) return 0;
  return Math.min(1, (max - min) / max);
}

/**
 * Calculate pitch range in semitones and Hz.
 */
function getPitchRange(f0History: number[]): { rangeSemitones: number; rangeHz: number } {
  const valid = f0History.filter((f) => f > 50 && f < 600);
  if (valid.length < 10) return { rangeSemitones: 0, rangeHz: 0 };

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const rangeHz = max - min;
  const rangeSemitones = 12 * Math.log2(max / min);

  return { rangeSemitones, rangeHz };
}

/**
 * Calculate standard deviation.
 */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate RMS energy from time-domain data.
 */
function getRMSEnergy(timeDomainData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    sum += timeDomainData[i] * timeDomainData[i];
  }
  return Math.sqrt(sum / timeDomainData.length);
}

export interface RecordingData {
  readings: number[];
  overtoneSnapshots: Overtone[][];
  frequencyDataSnapshots: Float32Array[];
  allCycles: GlottalCycle[];
  rmsHistory: number[];
  sampleRate: number;
  fftSize: number;
  frozenWaveform: Float32Array | null;
}

/**
 * Build a VoiceProfile from accumulated recording data.
 */
function buildVoiceProfile(data: RecordingData): VoiceProfile {
  const { readings, allCycles, rmsHistory, frequencyDataSnapshots, sampleRate, fftSize } = data;

  const validReadings = readings.filter((r) => r > 0);
  const meanF0 =
    validReadings.length > 0
      ? validReadings.reduce((a, b) => a + b, 0) / validReadings.length
      : 0;
  const f0StdDev = stdDev(validReadings);

  // Extract periods and amplitudes from glottal cycles
  const periods = allCycles.map((c) => c.periodSeconds);
  const amplitudes = allCycles.map((c) => c.peakAmplitude);

  // Core biomarkers
  const jitter = calculateJitter(periods);
  const shimmer = calculateShimmer(amplitudes);

  // Use averaged FFT data for spectral analysis
  const avgFreqData = averageFrequencyData(frequencyDataSnapshots);

  const hnr = avgFreqData.length > 0 ? calculateHNR(avgFreqData, meanF0, sampleRate, fftSize) : 0;
  const formants =
    avgFreqData.length > 0 && meanF0 > 0
      ? extractFormants(avgFreqData, sampleRate, fftSize, meanF0)
      : { f1: 500, f2: 1500, f3: 2500, confidence: 0 };
  const spectralCentroid =
    avgFreqData.length > 0 ? getSpectralCentroid(avgFreqData, sampleRate, fftSize) : 0;
  const spectralSlope =
    avgFreqData.length > 0 ? getSpectralSlope(avgFreqData, sampleRate, fftSize) : 0;

  const rmsEnergy =
    rmsHistory.length > 0
      ? Math.min(1, rmsHistory.reduce((a, b) => a + b, 0) / rmsHistory.length)
      : 0;

  const dynamicRange = getDynamicRange(rmsHistory);
  const pitchRange = getPitchRange(validReadings);

  return {
    fundamental: {
      mean: Math.round(meanF0 * 10) / 10,
      stdDev: Math.round(f0StdDev * 100) / 100,
      min: validReadings.length > 0 ? Math.round(Math.min(...validReadings) * 10) / 10 : 0,
      max: validReadings.length > 0 ? Math.round(Math.max(...validReadings) * 10) / 10 : 0,
    },
    jitter,
    shimmer,
    hnr: Math.round(hnr * 10) / 10,
    formants: {
      f1: Math.round(formants.f1),
      f2: Math.round(formants.f2),
      f3: Math.round(formants.f3),
      confidence: Math.round(formants.confidence * 100) / 100,
    },
    spectralCentroid: Math.round(spectralCentroid),
    spectralSlope: Math.round(spectralSlope * 10000) / 10000,
    rmsEnergy: Math.round(rmsEnergy * 1000) / 1000,
    dynamicRange: Math.round(dynamicRange * 1000) / 1000,
    pitchRange: {
      rangeSemitones: Math.round(pitchRange.rangeSemitones * 10) / 10,
      rangeHz: Math.round(pitchRange.rangeHz * 10) / 10,
    },
    cycleCount: allCycles.length,
  };
}

/**
 * Build a complete FrequencyProfile from raw recording data.
 */
export function buildProfile(data: RecordingData): FrequencyProfile {
  const { readings, overtoneSnapshots } = data;

  // Build the voice profile with all biomarkers
  const voiceProfile = buildVoiceProfile(data);

  const fundamental = voiceProfile.fundamental.mean;
  const noteInfo = frequencyToNote(fundamental);
  const chakra = frequencyToChakra(fundamental);
  const stability = calculateStability(readings);
  const overtones = averageOvertones(overtoneSnapshots);
  const richness = calculateRichness(overtones);
  const fifth = getPerfectFifth(fundamental);
  const third = getMinorThird(fundamental);

  // Multi-biomarker chakra scoring
  const chakraScores = calculateChakraScores(voiceProfile);

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
    voiceProfile,
    dominantChakra,
    frozenWaveform: data.frozenWaveform,
  };
}
