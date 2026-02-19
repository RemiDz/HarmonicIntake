'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface ToneConfig {
  frequency: number;
  duration: number;
  binaural?: boolean;
  waveType?: OscillatorType;
}

interface TonePlayerState {
  isPlaying: boolean;
  activeId: string | null;
  progress: number;
}

const FADE_IN = 1;
const FADE_OUT = 1;
const BINAURAL_OFFSET = 7.83; // Schumann Resonance

export function useTonePlayer() {
  const [state, setState] = useState<TonePlayerState>({
    isPlaying: false,
    activeId: null,
    progress: 0,
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ oscs: OscillatorNode[]; gains: GainNode[] }>({ oscs: [], gains: [] });
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const durationRef = useRef(0);

  const getContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const stopInternal = useCallback(() => {
    cancelAnimationFrame(rafRef.current);

    const ctx = ctxRef.current;
    const { oscs, gains } = nodesRef.current;

    if (ctx && gains.length > 0) {
      const now = ctx.currentTime;
      // Fade out
      for (const gain of gains) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + FADE_OUT);
      }
      // Stop oscillators after fade-out
      setTimeout(() => {
        for (const osc of oscs) {
          try { osc.stop(); } catch { /* already stopped */ }
        }
      }, FADE_OUT * 1000 + 50);
    }

    nodesRef.current = { oscs: [], gains: [] };
    setState({ isPlaying: false, activeId: null, progress: 0 });
  }, []);

  const progressLoop = useCallback(() => {
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const progress = Math.min(elapsed / durationRef.current, 1);

    if (progress >= 1) {
      stopInternal();
      return;
    }

    setState((prev) => ({ ...prev, progress }));
    rafRef.current = requestAnimationFrame(progressLoop);
  }, [stopInternal]);

  const play = useCallback(
    (id: string, config: ToneConfig) => {
      // Stop any currently playing tone
      stopInternal();

      const ctx = getContext();
      const now = ctx.currentTime;
      const { frequency, duration, binaural = false, waveType = 'sine' } = config;

      const oscs: OscillatorNode[] = [];
      const gains: GainNode[] = [];

      if (binaural) {
        // Two oscillators panned L/R for binaural beat
        const leftOsc = ctx.createOscillator();
        const rightOsc = ctx.createOscillator();
        const leftGain = ctx.createGain();
        const rightGain = ctx.createGain();
        const leftPan = ctx.createStereoPanner();
        const rightPan = ctx.createStereoPanner();

        leftOsc.type = waveType;
        leftOsc.frequency.setValueAtTime(frequency, now);
        rightOsc.type = waveType;
        rightOsc.frequency.setValueAtTime(frequency + BINAURAL_OFFSET, now);

        leftPan.pan.setValueAtTime(-1, now);
        rightPan.pan.setValueAtTime(1, now);

        // Fade in
        leftGain.gain.setValueAtTime(0, now);
        leftGain.gain.linearRampToValueAtTime(0.25, now + FADE_IN);
        rightGain.gain.setValueAtTime(0, now);
        rightGain.gain.linearRampToValueAtTime(0.25, now + FADE_IN);

        // Schedule fade out
        const fadeStart = now + duration - FADE_OUT;
        leftGain.gain.setValueAtTime(0.25, fadeStart);
        leftGain.gain.linearRampToValueAtTime(0, fadeStart + FADE_OUT);
        rightGain.gain.setValueAtTime(0.25, fadeStart);
        rightGain.gain.linearRampToValueAtTime(0, fadeStart + FADE_OUT);

        leftOsc.connect(leftGain).connect(leftPan).connect(ctx.destination);
        rightOsc.connect(rightGain).connect(rightPan).connect(ctx.destination);

        leftOsc.start(now);
        rightOsc.start(now);
        leftOsc.stop(now + duration + 0.1);
        rightOsc.stop(now + duration + 0.1);

        oscs.push(leftOsc, rightOsc);
        gains.push(leftGain, rightGain);
      } else {
        // Single oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = waveType;
        osc.frequency.setValueAtTime(frequency, now);

        // Fade in
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + FADE_IN);

        // Schedule fade out
        const fadeStart = now + duration - FADE_OUT;
        gain.gain.setValueAtTime(0.3, fadeStart);
        gain.gain.linearRampToValueAtTime(0, fadeStart + FADE_OUT);

        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.1);

        oscs.push(osc);
        gains.push(gain);
      }

      nodesRef.current = { oscs, gains };
      durationRef.current = duration;
      startTimeRef.current = performance.now();

      setState({ isPlaying: true, activeId: id, progress: 0 });
      rafRef.current = requestAnimationFrame(progressLoop);
    },
    [getContext, stopInternal, progressLoop],
  );

  const stop = useCallback(() => {
    stopInternal();
  }, [stopInternal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      const { oscs } = nodesRef.current;
      for (const osc of oscs) {
        try { osc.stop(); } catch { /* already stopped */ }
      }
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close();
      }
    };
  }, []);

  return { state, play, stop };
}
