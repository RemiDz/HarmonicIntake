export interface NoteInfo {
  note: string;
  octave: number;
  cents: number;
}

export interface ChakraInfo {
  name: string;
  note: string;
  freq: number;
  color: string;
  range: [number, number];
  intention: string;
}

export interface Overtone {
  harmonic: number;
  freq: number;
  amplitude: number;
  db: number;
}

export interface IntervalInfo {
  freq: number;
  note: NoteInfo;
}

export interface FrequencyProfile {
  fundamental: number;
  noteInfo: NoteInfo;
  chakra: ChakraInfo;
  stability: number;
  overtones: Overtone[];
  richness: number;
  fifth: IntervalInfo;
  third: IntervalInfo;
  timestamp: Date;
}

export type AppScreen = 'idle' | 'countdown' | 'recording' | 'complete';

export interface RealTimeData {
  currentHz: number;
  currentNote: NoteInfo | null;
  currentChakra: ChakraInfo | null;
  stability: number;
  overtones: Overtone[];
  spectrumData: number[];
  elapsed: number;
}
