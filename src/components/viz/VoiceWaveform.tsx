'use client';

import { useRef, useEffect, useCallback } from 'react';

interface VoiceWaveformProps {
  timeDomainData: Float32Array | null;
  rmsEnergy: number;
  chakraColor: string;
  secondaryColor?: string;
  mode: 'idle' | 'recording' | 'result';
  height?: number;
}

// Convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Interpolate between two hex colours
function lerpHex(colA: string, colB: string, t: number): string {
  const rA = parseInt(colA.slice(1, 3), 16), gA = parseInt(colA.slice(3, 5), 16), bA = parseInt(colA.slice(5, 7), 16);
  const rB = parseInt(colB.slice(1, 3), 16), gB = parseInt(colB.slice(3, 5), 16), bB = parseInt(colB.slice(5, 7), 16);
  const r = Math.round(rA + (rB - rA) * t);
  const g = Math.round(gA + (gB - gA) * t);
  const b = Math.round(bA + (bB - bA) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function VoiceWaveform({
  timeDomainData,
  rmsEnergy,
  chakraColor,
  secondaryColor,
  mode,
  height: propHeight,
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const widthRef = useRef<number>(400);
  const heightRef = useRef<number>(propHeight || 200);

  // Store latest props in refs for animation loop
  const propsRef = useRef({ timeDomainData, rmsEnergy, chakraColor, secondaryColor, mode });
  propsRef.current = { timeDomainData, rmsEnergy, chakraColor, secondaryColor, mode };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { timeDomainData, rmsEnergy, chakraColor, secondaryColor, mode } = propsRef.current;
    const W = widthRef.current;
    const H = heightRef.current;
    const time = (Date.now() - startTimeRef.current) / 1000;

    ctx.clearRect(0, 0, W, H);

    const centerY = H / 2;

    // ============================================================
    // CONFIGURATION PER MODE
    // ============================================================
    const LINE_COUNT = mode === 'idle' ? 16 : mode === 'recording' ? 24 : 20;
    const BASE_AMPLITUDE = mode === 'idle' ? H * 0.2 : H * 0.35;
    const SPEED = mode === 'idle' ? 0.3 : mode === 'result' ? 0.05 : 0.8;
    const GLOW = mode === 'idle' ? 6 : mode === 'recording' ? 12 : 8;

    // Audio-reactive amplitude boost
    const audioBoost = mode === 'recording' ? Math.max(0.5, rmsEnergy * 5) : 1.0;

    // Colour setup
    const color1 = chakraColor || '#4FA8D6';
    const color2 = secondaryColor || lerpHex(color1, '#ffffff', 0.3);

    for (let line = 0; line < LINE_COUNT; line++) {
      const lineT = line / (LINE_COUNT - 1); // 0 to 1

      // ============================================================
      // EACH LINE GETS A UNIQUE WAVE SHAPE
      // This is what makes them weave through each other!
      // ============================================================

      // Each line has a different frequency (1.5 to 4 full waves across the canvas)
      const frequency = 1.5 + lineT * 2.5;

      // Each line has a different phase offset
      const phaseOffset = lineT * Math.PI * 2;

      // Each line has slightly different amplitude
      const ampVariation = 0.6 + Math.sin(lineT * Math.PI) * 0.4; // Center lines bigger

      // Opacity: center lines brighter
      const distFromCenter = Math.abs(lineT - 0.5) * 2;
      const opacity = 0.08 + (1 - distFromCenter) * 0.25;

      // Colour: blend from color1 to color2 across lines
      const lineColor = lerpHex(color1, color2, lineT);

      ctx.beginPath();
      ctx.strokeStyle = hexToRgba(lineColor, opacity);
      ctx.lineWidth = 1.2;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = GLOW * (1 - distFromCenter * 0.5);

      const segments = 200; // Smooth curves need many points

      for (let i = 0; i <= segments; i++) {
        const t = i / segments; // 0 to 1 across width
        const x = t * W;

        // ============================================================
        // ENVELOPE: Amplitude tapers at edges (0 at edges, max at center)
        // This creates the "spindle" shape from the reference images
        // ============================================================
        const envelope = Math.pow(Math.sin(t * Math.PI), 1.5);

        // ============================================================
        // WAVE DISPLACEMENT
        // ============================================================
        let y = 0;

        // Primary wave for this line
        y += Math.sin(t * Math.PI * 2 * frequency + time * SPEED * 2 + phaseOffset);

        // Secondary harmonic (adds complexity)
        y += 0.3 * Math.sin(t * Math.PI * 2 * (frequency * 2.1) + time * SPEED * 1.3 + phaseOffset * 1.5);

        // Slow drift (makes lines move organically)
        y += 0.2 * Math.sin(t * Math.PI * 1.5 + time * SPEED * 0.7 + line * 0.5);

        // If we have real audio data during recording, modulate the amplitude
        if (timeDomainData && timeDomainData.length > 0 && mode === 'recording') {
          const dataIdx = Math.floor(t * (timeDomainData.length - 1));
          const sample = timeDomainData[dataIdx] || 0;
          // Mix audio data into the wave (adds real voice texture)
          y += sample * 2;
        }

        // Apply envelope and amplitude
        const finalY = centerY + y * BASE_AMPLITUDE * ampVariation * envelope * audioBoost;

        if (i === 0) {
          ctx.moveTo(x, finalY);
        } else {
          ctx.lineTo(x, finalY);
        }
      }

      ctx.stroke();
    }

    // Reset shadow between frames
    ctx.shadowBlur = 0;

    // Continue animation
    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Size the canvas
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      widthRef.current = rect.width;
      heightRef.current = propHeight || (mode === 'idle' ? 80 : mode === 'recording' ? 200 : 120);
      canvas.width = widthRef.current * dpr;
      canvas.height = heightRef.current * dpr;
      canvas.style.width = `${widthRef.current}px`;
      canvas.style.height = `${heightRef.current}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    // Start animation
    startTimeRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw, mode, propHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </div>
  );
}
