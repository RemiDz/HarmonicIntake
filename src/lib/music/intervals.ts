import type { IntervalInfo } from '@/lib/types';
import { frequencyToNote } from './note-mapping';

/**
 * Calculate the perfect 5th above a given frequency (×1.5).
 */
export function getPerfectFifth(hz: number): IntervalInfo {
  const freq = hz * 1.5;
  return {
    freq: Math.round(freq * 10) / 10,
    note: frequencyToNote(freq),
  };
}

/**
 * Calculate the minor 3rd above a given frequency (×1.2).
 */
export function getMinorThird(hz: number): IntervalInfo {
  const freq = hz * 1.2;
  return {
    freq: Math.round(freq * 10) / 10,
    note: frequencyToNote(freq),
  };
}
