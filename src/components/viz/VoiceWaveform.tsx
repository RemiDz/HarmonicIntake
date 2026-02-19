'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ChakraScore } from '@/lib/types';

// ── Constants ──

const MAX_WAVE_LINES = 12;
const POINTS_PER_LINE = 128;
const IDLE_COLOR = '#4FA8D6';
const COLOR_LERP_SPEED = 0.02; // ~2s full transition

// ── Props ──

export interface VoiceWaveformProps {
  // Real-time data from audio analysis
  timeDomainData: Float32Array | null;
  rmsEnergy: number;           // 0-1
  fundamental: number;         // Hz
  overtoneRichness: number;    // 0-1
  jitter: number;              // 0-1 normalised
  shimmer: number;             // 0-1 normalised
  chakraColor: string;         // Hex colour of dominant chakra
  chakraScores?: ChakraScore[];

  // State
  isRecording: boolean;
  isResult: boolean;

  // Layout
  height: number;
}

// ── Colour Utilities ──

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    clamp(r).toString(16).padStart(2, '0') +
    clamp(g).toString(16).padStart(2, '0') +
    clamp(b).toString(16).padStart(2, '0')
  );
}

function lerpColor(a: string, b: string, t: number): string {
  const [rA, gA, bA] = hexToRgb(a);
  const [rB, gB, bB] = hexToRgb(b);
  return rgbToHex(
    rA + (rB - rA) * t,
    gA + (gB - gA) * t,
    bA + (bB - bA) * t,
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Multi-colour: line → colour from top chakra scores ──

function getLineColor(
  lineIndex: number,
  totalLines: number,
  scores: ChakraScore[],
  fallback: string,
): string {
  if (scores.length < 2) return fallback;
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const seg = totalLines / top3.length;
  const idx = Math.min(Math.floor(lineIndex / seg), top3.length - 1);
  return top3[idx].color;
}

// ── Drawing ──

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  currentColor: string,
  props: VoiceWaveformProps,
  multiColorActive: boolean,
) {
  const {
    timeDomainData,
    rmsEnergy,
    fundamental,
    overtoneRichness,
    jitter,
    shimmer,
    isRecording,
    isResult,
    chakraScores,
  } = props;

  ctx.clearRect(0, 0, width, height);

  // How many lines based on overtone richness (4-12)
  const visibleLines = isRecording || isResult
    ? Math.round(4 + overtoneRichness * 8)
    : 6; // idle: moderate line count

  const centerY = height / 2;

  // Amplitude: scale with RMS energy during recording
  const amplitudeFactor = isRecording
    ? Math.max(0.15, rmsEnergy * 3)
    : isResult
      ? 0.35
      : 0.2; // idle: gentle
  const maxAmplitude = (height / 2) * 0.8 * amplitudeFactor;

  // Jitter → wobble amount (live recording only)
  const jitterOffset = isRecording ? jitter * 5 : 0;

  for (let line = 0; line < visibleLines; line++) {
    const lineProgress = line / (MAX_WAVE_LINES - 1); // 0-1 across the full 12

    // Base opacity: brighter in the centre of the ribbon
    const centreDistance = Math.abs(lineProgress - 0.5) * 2; // 0 at centre, 1 at edges
    const lineOpacity = 0.15 + (1 - centreDistance) * 0.55;

    // Shimmer: per-line opacity modulation
    const shimmerVar = shimmer * 0.2 * Math.sin(time * 2 + line * 0.7);
    const finalOpacity = Math.max(0.1, lineOpacity + shimmerVar);

    // Phase offset per line (creates the ribbon spread)
    const phaseOffset = (lineProgress - 0.5) * Math.PI * 0.6;

    // Vertical offset per line (creates depth)
    const yOffset = (lineProgress - 0.5) * maxAmplitude * 0.4;

    // Determine colour for this line
    let lineColor = currentColor;
    if (multiColorActive && chakraScores && chakraScores.length >= 2) {
      lineColor = getLineColor(line, visibleLines, chakraScores, currentColor);
    }

    // Start path
    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(lineColor, finalOpacity);
    ctx.lineWidth = 1.5;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 4 + (isRecording ? rmsEnergy * 8 : 2);

    let prevY = centerY;

    for (let i = 0; i <= POINTS_PER_LINE; i++) {
      const x = (i / POINTS_PER_LINE) * width;
      const progress = i / POINTS_PER_LINE;

      let y = centerY + yOffset;

      if (timeDomainData && timeDomainData.length > 0) {
        // Use real waveform data (live recording or frozen result)
        const dataIndex = Math.floor(progress * timeDomainData.length);
        const sample = timeDomainData[dataIndex] || 0;
        y += sample * maxAmplitude * (1 + lineProgress * 0.3);
      } else {
        // Idle: gentle breathing sine (no audio data)
        y += Math.sin(progress * Math.PI * 4 + time * 0.5 + phaseOffset) * maxAmplitude * 0.3;
      }

      if (!isResult) {
        // Flowing animation overlay (live + idle only, not result)
        y += Math.sin(progress * Math.PI * 2 + time * 1.5 + phaseOffset) * 8;
      }

      // Jitter wobble (live only)
      if (jitterOffset > 0) {
        y += Math.sin(progress * 20 + time * 3 + line) * jitterOffset;
      }

      // Envelope: fade amplitude at horizontal edges
      const envelope = Math.sin(progress * Math.PI);
      y = centerY + yOffset + (y - centerY - yOffset) * envelope;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Quadratic curve for smoothness
        const prevX = ((i - 1) / POINTS_PER_LINE) * width;
        const cpX = (prevX + x) / 2;
        const cpY = (prevY + y) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
      }

      prevY = y;
    }

    ctx.stroke();
  }

  // Reset shadow
  ctx.shadowBlur = 0;
}

// ── Component ──

export function VoiceWaveform(props: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());
  const currentColorRef = useRef<string>(IDLE_COLOR);
  const containerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<number>(420);

  // Track the elapsed recording time to know when multi-colour kicks in
  const recordingStartRef = useRef<number>(0);

  // Update recording start time
  useEffect(() => {
    if (props.isRecording) {
      recordingStartRef.current = performance.now();
    }
  }, [props.isRecording]);

  // Memoize the draw callback to avoid re-creating on every render
  // We use refs to access latest props without triggering effect re-runs
  const propsRef = useRef(props);
  propsRef.current = props;

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p = propsRef.current;
    const time = (performance.now() - startTimeRef.current) / 1000;

    // Colour: immediate for result screen, smooth lerp for live/idle
    if (p.isResult) {
      currentColorRef.current = p.chakraColor;
    } else {
      const targetColor = p.isRecording ? p.chakraColor : IDLE_COLOR;
      currentColorRef.current = lerpColor(
        currentColorRef.current,
        targetColor,
        COLOR_LERP_SPEED,
      );
    }

    // Multi-colour ribbon: after 5s of recording, or always on result
    const recordingSecs = p.isRecording
      ? (performance.now() - recordingStartRef.current) / 1000
      : 0;
    const multiColorActive = p.isResult || (p.isRecording && recordingSecs > 5);

    // Get actual canvas CSS width
    const w = widthRef.current;

    drawWaveform(ctx, w, p.height, time, currentColorRef.current, p, multiColorActive);

    // Result screen: render once then stop (frozen voice signature)
    if (p.isResult) return;

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Set up canvas sizing and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // ResizeObserver for responsive width
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          widthRef.current = w;
          const dpr = window.devicePixelRatio || 1;
          canvas.width = w * dpr;
          canvas.height = props.height * dpr;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.scale(dpr, dpr);
        }
      }
    });
    observer.observe(container);

    // Initial sizing
    const w = container.clientWidth || 420;
    widthRef.current = w;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = props.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      observer.disconnect();
    };
  }, [props.height, animate]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: props.height,
          display: 'block',
        }}
      />
    </div>
  );
}
