'use client';

import { useState, useRef, useCallback } from 'react';
import type { AppScreen, FrequencyProfile, RealTimeData, Overtone } from '@/lib/types';
import { detectPitch } from '@/lib/audio/pitch-detection';
import { extractOvertones } from '@/lib/audio/overtone-analysis';
import { extractSpectrum } from '@/lib/audio/spectrum';
import { frequencyToNote } from '@/lib/music/note-mapping';
import { frequencyToChakra } from '@/lib/music/chakra-mapping';
import { calculateStability } from '@/lib/profile/build-profile';
import { buildProfile } from '@/lib/profile/build-profile';
import { startRecording, type AudioRecorderHandle } from '@/lib/audio/recorder';

const RECORDING_DURATION = 15; // seconds
const STABILITY_WINDOW = 30;

const EMPTY_REALTIME: RealTimeData = {
  currentHz: 0,
  currentNote: null,
  currentChakra: null,
  stability: 0,
  overtones: [],
  spectrumData: [],
  elapsed: 0,
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
  const overtoneSnapshotsRef = useRef<Overtone[][]>([]);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }, []);

  const finishRecording = useCallback(() => {
    cleanup();
    const result = buildProfile(readingsRef.current, overtoneSnapshotsRef.current);
    setProfile(result);
    setScreen('complete');
  }, [cleanup]);

  const analysisLoop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;

    if (elapsed >= RECORDING_DURATION) {
      finishRecording();
      return;
    }

    // Extract audio data
    const timeDomain = recorder.getTimeDomainData();
    const freqDomain = recorder.getFrequencyData();

    // Pitch detection
    const hz = detectPitch(timeDomain, recorder.sampleRate);
    readingsRef.current.push(hz);

    // Overtones (only if we have a valid pitch)
    let overtones: Overtone[] = [];
    if (hz > 0) {
      overtones = extractOvertones(freqDomain, hz, recorder.sampleRate, recorder.analyser.fftSize);
      overtoneSnapshotsRef.current.push(overtones);
    }

    // Spectrum
    const spectrumData = extractSpectrum(freqDomain, recorder.analyser.fftSize);

    // Stability (rolling window)
    const recentReadings = readingsRef.current.slice(-STABILITY_WINDOW);
    const stability = calculateStability(recentReadings);

    // Update real-time state
    setRealTimeData({
      currentHz: hz > 0 ? Math.round(hz * 10) / 10 : 0,
      currentNote: hz > 0 ? frequencyToNote(hz) : null,
      currentChakra: hz > 0 ? frequencyToChakra(hz) : null,
      stability,
      overtones,
      spectrumData,
      elapsed,
    });

    rafRef.current = requestAnimationFrame(analysisLoop);
  }, [finishRecording]);

  const beginRecording = useCallback(async () => {
    try {
      setError(null);
      readingsRef.current = [];
      overtoneSnapshotsRef.current = [];

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
    finishRecording();
  }, [finishRecording]);

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
