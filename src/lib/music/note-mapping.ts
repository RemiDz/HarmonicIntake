import type { NoteInfo } from '@/lib/types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQ = 440;
const A4_MIDI = 69;

/**
 * Convert a frequency in Hz to the nearest musical note with octave and cents deviation.
 * Uses A4 = 440Hz equal temperament tuning.
 */
export function frequencyToNote(hz: number): NoteInfo {
  if (hz <= 0) {
    return { note: '-', octave: 0, cents: 0 };
  }

  // Calculate the number of semitones from A4
  const semitones = 12 * Math.log2(hz / A4_FREQ);
  const midiNote = Math.round(semitones) + A4_MIDI;
  const cents = Math.round((semitones - Math.round(semitones)) * 100);

  const noteIndex = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
  };
}

/**
 * Convert a note name and octave back to a frequency in Hz.
 */
export function noteToFrequency(note: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) return 0;

  const midiNote = (octave + 1) * 12 + noteIndex;
  return A4_FREQ * Math.pow(2, (midiNote - A4_MIDI) / 12);
}
