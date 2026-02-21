'use client';

import { useState, useRef, useCallback } from 'react';
import type { AppScreen, FrequencyProfile, RealTimeData, Overtone, LiveVoiceStatus } from '@/lib/types';
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
import { getSpectralFlatness } from '@/lib/audio/spectral-features';
import { playTing, playChord, hapticBuzz, hapticDoubleBuzz } from '@/lib/audio/ui-sounds';

const RECORDING_DURATION = 15;
const STABILITY_WINDOW = 30;

/** Get median from array of numbers */
function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

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
  liveVoiceStatus: 'silence',
  voiceClarity: 0,
};

export function useAudioAnalysis() {
  const [screen, setScreen] = useState<AppScreen>('idle');
  const [realTimeData, setRealTimeData] = useState<RealTimeData>(EMPTY_REALTIME);
  const [profile, setProfile] = useState<FrequencyProfile | null>(null);
  const [previousProfile, setPreviousProfile] = useState<FrequencyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const micGrantedRef = useRef(false);
  const micDeniedRef = useRef(false);

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
  const recentF0sRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const lastHzRef = useRef(-1);
  const voiceFramesRef = useRef(0);
  const totalFramesRef = useRef(0);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (analysingTimerRef.current) {
      clearTimeout(analysingTimerRef.current);
      analysingTimerRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }, []);

  const analysingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        voiceFrames: voiceFramesRef.current,
        totalFrames: totalFramesRef.current,
      });

      setProfile(result);
      setScreen('analysing');
      hapticDoubleBuzz();

      // Transition to complete after 1.8s "analysing" moment
      analysingTimerRef.current = setTimeout(() => {
        setScreen('complete');
        playChord();
      }, 1800);
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
    frameCountRef.current++;

    // RMS energy (cheap — every frame)
    const rms = getRMSEnergy(timeDomain);
    rmsHistoryRef.current.push(rms);

    // Pitch detection + glottal cycles — every 2nd frame (~30Hz) to reduce CPU load.
    // Autocorrelation is ~200M multiply-add ops/sec at 60fps; halving saves ~50% CPU.
    // 450 readings over 15s at 30Hz is more than sufficient for accurate results.
    let hz = lastHzRef.current;
    let flatness = 0;
    const runPitchFrame = frameCountRef.current % 2 === 0;

    if (runPitchFrame) {
      hz = detectPitch(timeDomain, recorder.sampleRate);

      // Reject noise-like signals via spectral flatness (white noise ≈ 1, tonal ≈ 0)
      if (hz > 0) {
        flatness = getSpectralFlatness(freqDomain, recorder.sampleRate, recorder.analyser.fftSize);
        if (flatness > 0.5) hz = -1;
      }

      // Reject octave errors: if hz suddenly jumps to ~2× or ~0.5× the running median, discard it
      if (hz > 0 && recentF0sRef.current.length >= 5) {
        const median = getMedian(recentF0sRef.current);
        if (median > 0) {
          const ratio = hz / median;
          if (ratio > 1.8 && ratio < 2.2) hz = -1; // likely octave-up error
          if (ratio > 0.4 && ratio < 0.6) hz = -1; // likely octave-down error
        }
      }
      if (hz > 0) {
        recentF0sRef.current.push(hz);
        if (recentF0sRef.current.length > 10) recentF0sRef.current.shift();
      }

      lastHzRef.current = hz;
      readingsRef.current.push(hz);

      // Glottal cycles for jitter/shimmer (depends on pitch, so also every 2nd frame)
      if (hz > 0) {
        const cycles = extractGlottalCycles(timeDomain, recorder.sampleRate, hz);
        allCyclesRef.current.push(...cycles);
      }
    }

    // ── Voice validation tracking ──
    totalFramesRef.current++;
    let liveVoiceStatus: LiveVoiceStatus;

    if (rms < 0.01) {
      liveVoiceStatus = 'silence';
    } else if (runPitchFrame && flatness > 0.5) {
      liveVoiceStatus = 'noise';
    } else if (hz > 0) {
      liveVoiceStatus = 'voice-detected';
      voiceFramesRef.current++;
    } else {
      liveVoiceStatus = 'low-volume';
    }

    const voiceClarity = totalFramesRef.current > 0
      ? Math.round((voiceFramesRef.current / totalFramesRef.current) * 100)
      : 0;

    // Store frequency data snapshot (copy since the buffer is reused)
    const freqCopy = new Float32Array(freqDomain);
    frequencyDataSnapshotsRef.current.push(freqCopy);

    // FFT-based features — every frame (cheap, just array lookups)
    let overtones: Overtone[] = [];
    let liveHnr = 0;
    let liveJitterRelative = 0;

    if (hz > 0) {
      overtones = extractOvertones(freqDomain, hz, recorder.sampleRate, recorder.analyser.fftSize);
      overtoneSnapshotsRef.current.push(overtones);

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
      liveVoiceStatus,
      voiceClarity,
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
      recentF0sRef.current = [];
      frameCountRef.current = 0;
      lastHzRef.current = -1;
      voiceFramesRef.current = 0;
      totalFramesRef.current = 0;

      const recorder = await startRecording();
      recorderRef.current = recorder;
      micGrantedRef.current = true;
      micDeniedRef.current = false;

      setScreen('recording');
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(analysisLoop);
      hapticBuzz();
      playTing();
    } catch (err) {
      cleanup();
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        micGrantedRef.current = false;
        micDeniedRef.current = true;
        setError('Microphone access was denied. Please allow microphone access and try again.');
        setScreen('mic-permission');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
        setScreen('idle');
      } else {
        setError('Could not access microphone. Please check your browser settings.');
        setScreen('idle');
      }
    }
  }, [analysisLoop, cleanup]);

  const start = useCallback(() => {
    setProfile(null);
    setRealTimeData(EMPTY_REALTIME);
    if (micGrantedRef.current) {
      setScreen('countdown');
    } else {
      setError(null);
      setScreen('mic-permission');
    }
  }, []);

  const confirmMicPermission = useCallback(() => {
    setError(null);
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
    setPreviousProfile(null);
    setRealTimeData(EMPTY_REALTIME);
    setError(null);
    setScreen('idle');
  }, [cleanup]);

  /** Retry recording (skip idle — mic already granted) */
  const retry = useCallback(() => {
    setProfile(null);
    setRealTimeData(EMPTY_REALTIME);
    setScreen('countdown');
  }, []);

  /** Save current profile as "before" and start a new recording for comparison */
  const startComparison = useCallback(() => {
    if (profile) {
      setPreviousProfile(profile);
    }
    setProfile(null);
    setRealTimeData(EMPTY_REALTIME);
    // Mic already granted from the first recording — skip pre-screen
    setScreen('countdown');
  }, [profile]);

  /** Return from comparison view to the original (first) recording's results */
  const backToOriginalResults = useCallback(() => {
    if (previousProfile) {
      setProfile(previousProfile);
      setPreviousProfile(null);
    }
  }, [previousProfile]);

  return {
    screen,
    realTimeData,
    profile,
    previousProfile,
    error,
    start,
    stop,
    reset,
    retry,
    beginRecording,
    confirmMicPermission,
    startComparison,
    backToOriginalResults,
  };
}
