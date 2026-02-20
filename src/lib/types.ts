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

export interface ChakraScore {
  name: string;
  color: string;
  score: number;
  label: string;
  description: string;
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

// ── Voice Biomarker Types (V2 Engine) ──

export interface VoiceProfile {
  fundamental: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
  };
  jitter: {
    absolute: number;   // seconds
    relative: number;   // percentage
    rap: number;         // relative average perturbation %
  };
  shimmer: {
    db: number;          // dB
    relative: number;    // percentage
    apq3: number;        // 3-point amplitude perturbation %
  };
  hnr: number;           // dB
  formants: {
    f1: number;          // Hz
    f2: number;          // Hz
    f3: number;          // Hz
    confidence: number;  // 0-1, how many formants were detected vs defaulted
  };
  spectralCentroid: number; // Hz
  spectralSlope: number;    // dB/Hz
  rmsEnergy: number;        // 0-1
  dynamicRange: number;     // 0-1
  pitchRange: {
    rangeSemitones: number;
    rangeHz: number;
  };
  cycleCount: number;
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
  chakraScores: ChakraScore[];
  voiceProfile: VoiceProfile;
  dominantChakra: ChakraScore;
  frozenWaveform: Float32Array | null;
}

export type AppScreen = 'idle' | 'countdown' | 'recording' | 'analysing' | 'complete';

export interface RealTimeData {
  currentHz: number;
  currentNote: NoteInfo | null;
  currentChakra: ChakraInfo | null;
  stability: number;
  overtones: Overtone[];
  spectrumData: number[];
  elapsed: number;
  chakraScores: ChakraScore[];
  liveHnr: number;
  liveJitterRelative: number;
  timeDomainData: Float32Array | null;
  rmsEnergy: number;
}
