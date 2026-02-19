'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ChakraScore } from '@/lib/types';

// ── Constants ──

const POINTS = 128;
const IDLE_COLOR = '#4FA8D6';
const COLOR_LERP_SPEED = 0.02;

// Mode-specific config
const CONFIG = {
  idle:      { lines: 4,  maxAmp: 15, baseOpacity: 0.2,  glowSize: 4,  spread: 0.3 },
  recording: { lines: 12, maxAmp: 70, baseOpacity: 0.5,  glowSize: 10, spread: 0.6 },
  result:    { lines: 8,  maxAmp: 50, baseOpacity: 0.4,  glowSize: 6,  spread: 0.5 },
} as const;

// ── Props ──

export interface VoiceWaveformProps {
  timeDomainData: Float32Array | null;
  rmsEnergy: number;
  fundamental: number;
  overtoneRichness: number;
  jitter: number;
  shimmer: number;
  chakraColor: string;
  chakraScores?: ChakraScore[];
  isRecording: boolean;
  isResult: boolean;
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
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + cl(r).toString(16).padStart(2, '0') +
    cl(g).toString(16).padStart(2, '0') + cl(b).toString(16).padStart(2, '0');
}

function lerpColor(a: string, b: string, t: number): string {
  const [rA, gA, bA] = hexToRgb(a);
  const [rB, gB, bB] = hexToRgb(b);
  return rgbToHex(rA + (rB - rA) * t, gA + (gB - gA) * t, bA + (bB - bA) * t);
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
  color: string,
  props: VoiceWaveformProps,
  multiColor: boolean,
) {
  const { timeDomainData, rmsEnergy, isRecording, isResult, chakraScores } = props;

  ctx.clearRect(0, 0, width, height);

  const mode = isRecording ? 'recording' : isResult ? 'result' : 'idle';
  const c = CONFIG[mode];
  const centerY = height / 2;

  // Scale amplitude with actual loudness during recording
  const ampScale = mode === 'recording' ? Math.max(0.3, rmsEnergy * 4) : 0.5;

  for (let line = 0; line < c.lines; line++) {
    // lineT: 0 to 1 spread evenly across THIS mode's line count
    const lineT = c.lines > 1 ? line / (c.lines - 1) : 0.5;

    // Vertical offset — spread lines across the height
    const verticalOffset = (lineT - 0.5) * height * c.spread;

    // Phase offset — each line slightly shifted in time
    const phase = lineT * Math.PI * 0.8;

    // Opacity — center lines brighter, outer lines dimmer
    const distFromCenter = Math.abs(lineT - 0.5) * 2; // 0 at center, 1 at edges
    const opacity = c.baseOpacity * (1 - distFromCenter * 0.6);

    // Amplitude variation per line — center lines taller
    const lineAmpScale = 1 - distFromCenter * 0.4;

    // Determine colour for this line
    let lineColor = color;
    if (multiColor && chakraScores && chakraScores.length >= 2) {
      lineColor = getLineColor(line, c.lines, chakraScores, color);
    }

    // Glow: result mode pulses gently, recording scales with RMS
    let glowSize = c.glowSize * (1 - distFromCenter * 0.5);
    if (mode === 'result') {
      glowSize = 4 + Math.sin(time * 0.8) * 2; // pulse 4-8px
    } else if (mode === 'recording') {
      glowSize += rmsEnergy * 6;
    }

    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(lineColor, opacity);
    ctx.lineWidth = 1.8;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = glowSize;

    let prevX = 0;
    let prevY = centerY;

    for (let i = 0; i <= POINTS; i++) {
      const x = (i / POINTS) * width;
      const t = i / POINTS;

      // Envelope — fade at horizontal edges
      const envelope = Math.sin(t * Math.PI);

      let displacement = 0;

      if (timeDomainData && timeDomainData.length > 0 && mode !== 'idle') {
        // Use real audio data
        const dataIdx = Math.floor(t * timeDomainData.length);
        const sample = timeDomainData[Math.min(dataIdx, timeDomainData.length - 1)] || 0;
        displacement = sample * c.maxAmp * ampScale * lineAmpScale;
      }

      // Add flowing animation (idle + recording, not result)
      if (mode !== 'result') {
        displacement += Math.sin(t * Math.PI * 3 + time * 1.2 + phase) * c.maxAmp * 0.15;
      }

      // Idle mode: pure sine waves
      if (mode === 'idle') {
        displacement = Math.sin(t * Math.PI * 2 + time * 0.4 + phase) * c.maxAmp * 0.8;
      }

      // Apply envelope
      displacement *= envelope;

      const y = centerY + verticalOffset + displacement;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Smooth quadratic curve
        const cpX = (prevX + x) / 2;
        const cpY = (prevY + y) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
      }

      prevX = x;
      prevY = y;
    }

    ctx.stroke();
  }

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
  const recordingStartRef = useRef<number>(0);

  useEffect(() => {
    if (props.isRecording) {
      recordingStartRef.current = performance.now();
    }
  }, [props.isRecording]);

  const propsRef = useRef(props);
  propsRef.current = props;

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p = propsRef.current;
    const time = (performance.now() - startTimeRef.current) / 1000;

    // Colour: immediate for result, smooth lerp for live/idle
    if (p.isResult) {
      currentColorRef.current = p.chakraColor;
    } else {
      const target = p.isRecording ? p.chakraColor : IDLE_COLOR;
      currentColorRef.current = lerpColor(currentColorRef.current, target, COLOR_LERP_SPEED);
    }

    // Multi-colour ribbon: after 5s of recording, or always on result
    const recSecs = p.isRecording
      ? (performance.now() - recordingStartRef.current) / 1000
      : 0;
    const multiColor = p.isResult || (p.isRecording && recSecs > 5);

    drawWaveform(ctx, widthRef.current, p.height, time, currentColorRef.current, p, multiColor);

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const setupSize = (w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          widthRef.current = w;
          setupSize(w, propsRef.current.height);
        }
      }
    });
    observer.observe(container);

    widthRef.current = container.clientWidth || 420;
    setupSize(widthRef.current, props.height);

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
        style={{ width: '100%', height: props.height, display: 'block' }}
      />
    </div>
  );
}
