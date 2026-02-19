'use client';

import { useState, useRef, useCallback } from 'react';
import type { AppScreen, FrequencyProfile, RealTimeData, Overtone } from '@/lib/types';
import { detectPitch } from '@/lib/audio/pitch-detection';
import { extractOvertones } from '@/lib/audio/overtone-analysis';
import { extractSpectrum } from '@/lib/audio/spectrum';
import { extractGlottalCycles, type GlottalCycle } from '@/lib/audio/glottal-cycles';
import { calculateJitter } from '@/lib/audio/jitter';
import { calculateHNR } from '@/lib/audio/hnr';
import { frequencyToNote } from '@/lib/music/note-mapping';
import { frequencyToChakra } from '@/lib/music/chakra-mapping';
import { calculateStability } from '@/lib/profile/build-profile';
import { buildProfile } from '@/lib/profile/build-profile';
import { startRecording, type AudioRecorderHandle } from '@/lib/audio/recorder';
import { getRMSEnergy } from '@/lib/audio/vocal-qualities';
import { calculateLiveChakraScores } from '@/lib/scoring/chakra-scoring';

const RECORDING_DURATION = 15;
const STABILITY_WINDOW = 30;

const EMPTY_REALTIME: RealTimeData = {
  currentHz: 0,
  currentNote: null,
  currentChakra: null,
  stability: 0,
  overtones: [],
  spectrumData: [],
  elapsed: 0,
  chakraScores: [],
  liveHnr: 0,
  liveJitterRelative: 0,
  timeDomainData: null,
  rmsEnergy: 0,
};

export function useAudioAnalysis() {
  const [screen, setScreen] = useState<AppScreen>('idle');
  const [realTimeData, setRealTimeData] = useState<RealTimeData>(EMPTY_REALTIME);
  const [profile, setProfile] = useState<FrequencyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorderHandle | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const readingsRef = useRef<number[]>([]);
  // Last valid values — persist across frames where pitch detection fails
  const lastValidHzRef = useRef<number>(0);
  const lastValidNoteRef = useRef<RealTimeData['currentNote']>(null);
  const lastValidChakraRef = useRef<RealTimeData['currentChakra']>(null);
  const lastValidOvertonesRef = useRef<Overtone[]>([]);
  const overtoneSnapshotsRef = useRef<Overtone[][]>([]);
  const frequencyDataSnapshotsRef = useRef<Float32Array[]>([]);
  const allCyclesRef = useRef<GlottalCycle[]>([]);
  const rmsHistoryRef = useRef<number[]>([]);
  const frozenWaveformRef = useRef<Float32Array | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }, []);

  const doFinish = useCallback(
    (sampleRate: number, fftSize: number) => {
      const result = buildProfile({
        readings: readingsRef.current,
        overtoneSnapshots: overtoneSnapshotsRef.current,
        frequencyDataSnapshots: frequencyDataSnapshotsRef.current,
        allCycles: allCyclesRef.current,
        rmsHistory: rmsHistoryRef.current,
        sampleRate,
        fftSize,
        frozenWaveform: frozenWaveformRef.current,
      });

      setProfile(result);
      setScreen('complete');
    },
    [],
  );

  const analysisLoop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;

    if (elapsed >= RECORDING_DURATION) {
      const sampleRate = recorder.sampleRate;
      const fftSize = recorder.analyser.fftSize;
      cleanup();
      doFinish(sampleRate, fftSize);
      return;
    }

    // Extract audio data
    const timeDomain = recorder.getTimeDomainData();
    const freqDomain = recorder.getFrequencyData();

    // Pitch detection
    const hz = detectPitch(timeDomain, recorder.sampleRate);
    readingsRef.current.push(hz);

    // Store frequency data snapshot (copy since the buffer is reused)
    const freqCopy = new Float32Array(freqDomain);
    frequencyDataSnapshotsRef.current.push(freqCopy);

    // RMS energy
    const rms = getRMSEnergy(timeDomain);
    rmsHistoryRef.current.push(rms);

    // Overtones and glottal cycles (only if we have a valid pitch)
    let overtones: Overtone[] = [];
    let liveHnr = 0;
    let liveJitterRelative = 0;

    if (hz > 0) {
      overtones = extractOvertones(freqDomain, hz, recorder.sampleRate, recorder.analyser.fftSize);
      overtoneSnapshotsRef.current.push(overtones);

      // Extract glottal cycles for jitter/shimmer
      const cycles = extractGlottalCycles(timeDomain, recorder.sampleRate, hz);
      allCyclesRef.current.push(...cycles);

      // Live HNR
      liveHnr = calculateHNR(freqDomain, hz, recorder.sampleRate, recorder.analyser.fftSize);

      // Live jitter from accumulated cycles (becomes more accurate over time)
      if (allCyclesRef.current.length >= 3) {
        const recentCycles = allCyclesRef.current.slice(-50);
        const periods = recentCycles.map((c) => c.periodSeconds);
        const jitterResult = calculateJitter(periods);
        liveJitterRelative = jitterResult.relative;
      }

      // Store last valid values so we can hold them when pitch drops out
      lastValidHzRef.current = Math.round(hz * 10) / 10;
      lastValidNoteRef.current = frequencyToNote(hz);
      lastValidChakraRef.current = frequencyToChakra(hz);
      lastValidOvertonesRef.current = overtones;
    }

    // Spectrum
    const spectrumData = extractSpectrum(freqDomain, recorder.analyser.fftSize);

    // Stability (rolling window)
    const recentReadings = readingsRef.current.slice(-STABILITY_WINDOW);
    const stability = calculateStability(recentReadings);

    // Always capture the latest waveform frame with valid pitch.
    // The last captured frame becomes the frozen "voice signature".
    if (hz > 0 && rms > 0.01) {
      frozenWaveformRef.current = new Float32Array(timeDomain);
    }

    // Live chakra scores (lightweight, spectral-only)
    const chakraScores = calculateLiveChakraScores(
      freqDomain,
      recorder.sampleRate,
      recorder.analyser.fftSize,
    );

    // When pitch drops out (hz <= 0), hold the last valid values
    // so the UI never flashes "—" or "No overtone data".
    // The refs were already updated in the hz > 0 block above.
    setRealTimeData({
      currentHz: lastValidHzRef.current,
      currentNote: lastValidNoteRef.current,
      currentChakra: lastValidChakraRef.current,
      stability,
      overtones: hz > 0 ? overtones : lastValidOvertonesRef.current,
      spectrumData,
      elapsed,
      chakraScores,
      liveHnr: Math.round(liveHnr * 10) / 10,
      liveJitterRelative: Math.round(liveJitterRelative * 100) / 100,
      timeDomainData: new Float32Array(timeDomain),
      rmsEnergy: rms,
    });

    rafRef.current = requestAnimationFrame(analysisLoop);
  }, [cleanup, doFinish]);

  const beginRecording = useCallback(async () => {
    try {
      setError(null);
      readingsRef.current = [];
      overtoneSnapshotsRef.current = [];
      frequencyDataSnapshotsRef.current = [];
      allCyclesRef.current = [];
      rmsHistoryRef.current = [];
      frozenWaveformRef.current = null;
      lastValidHzRef.current = 0;
      lastValidNoteRef.current = null;
      lastValidChakraRef.current = null;
      lastValidOvertonesRef.current = [];

      const recorder = await startRecording();
      recorderRef.current = recorder;

      setScreen('recording');
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(analysisLoop);
    } catch (err) {
      cleanup();
      setScreen('idle');
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access was denied. Please allow microphone access and try again.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Could not access microphone. Please check your browser settings.');
      }
    }
  }, [analysisLoop, cleanup]);

  const start = useCallback(() => {
    setProfile(null);
    setRealTimeData(EMPTY_REALTIME);
    setScreen('countdown');
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    const sampleRate = recorder?.sampleRate || 44100;
    const fftSize = recorder?.analyser.fftSize || 4096;
    cleanup();
    doFinish(sampleRate, fftSize);
  }, [cleanup, doFinish]);

  const reset = useCallback(() => {
    cleanup();
    setProfile(null);
    setRealTimeData(EMPTY_REALTIME);
    setError(null);
    setScreen('idle');
  }, [cleanup]);

  return {
    screen,
    realTimeData,
    profile,
    error,
    start,
    stop,
    reset,
    beginRecording,
  };
}
