'use client';

import { useRef, useEffect, useCallback } from 'react';

interface VoiceWaveformProps {
  timeDomainData: Float32Array | null;
  rmsEnergy: number;
  chakraColor: string;
  mode: 'idle' | 'recording' | 'result';
  height?: number;
}

const LINE_COUNT = 20;
const SEGMENTS = 200;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function VoiceWaveform({
  timeDomainData,
  rmsEnergy,
  chakraColor,
  mode,
  height: propHeight,
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const t0 = useRef<number>(Date.now());
  const wRef = useRef<number>(400);
  const hRef = useRef<number>(propHeight || 200);

  const propsRef = useRef({ timeDomainData, rmsEnergy, chakraColor, mode });
  propsRef.current = { timeDomainData, rmsEnergy, chakraColor, mode };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { timeDomainData, rmsEnergy, chakraColor, mode } = propsRef.current;
    const W = wRef.current;
    const H = hRef.current;
    const time = (Date.now() - t0.current) / 1000;
    const centerY = H / 2;
    const color = chakraColor || '#4FA8D6';

    // Max amplitude = 80% of canvas height (40% each side of center)
    const maxAmp = H * 0.4;

    // Animation speed per mode
    const speed = mode === 'idle' ? 0.3 : mode === 'result' ? 0.05 : 0.8;

    // Audio-reactive boost during recording
    const boost = mode === 'recording' ? Math.max(0.5, rmsEnergy * 5) : 1.0;

    ctx.clearRect(0, 0, W, H);

    for (let line = 0; line < LINE_COUNT; line++) {
      const lineT = line / (LINE_COUNT - 1); // 0 to 1

      // Rule 3: frequency from 1.5 to 4 cycles
      const freq = 1.5 + lineT * 2.5;

      // Rule 4: phase offset = line index * 0.3
      const phase = line * 0.3;

      // Rule 7: opacity 0.08 at edges, 0.3 at center
      const distFromCenter = Math.abs(lineT - 0.5) * 2;
      const opacity = 0.08 + (1 - distFromCenter) * 0.22;

      // Rule 2 + 8: ONE colour, 1.2px, 8px glow
      ctx.beginPath();
      ctx.strokeStyle = hexToRgba(color, opacity);
      ctx.lineWidth = 1.2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const x = t * W;

        // Flat envelope across 80% of width, taper only in first/last 10%
        let envelope = 1;
        if (t < 0.1) envelope = t / 0.1;
        else if (t > 0.9) envelope = (1 - t) / 0.1;

        // Primary sine wave
        let y = Math.sin(t * Math.PI * 2 * freq + time * speed * 2 + phase);

        // Secondary harmonic for complexity
        y += 0.3 * Math.sin(t * Math.PI * 2 * freq * 2.1 + time * speed * 1.3 + phase * 1.5);

        // Slow organic drift
        y += 0.2 * Math.sin(t * Math.PI * 1.5 + time * speed * 0.7 + line * 0.5);

        // Mix in real audio data during recording
        if (timeDomainData && timeDomainData.length > 0 && mode === 'recording') {
          const idx = Math.floor(t * (timeDomainData.length - 1));
          y += (timeDomainData[idx] || 0) * 2;
        }

        // Rule 5 + 6: apply envelope and max amplitude
        const finalY = centerY + y * maxAmp * envelope * boost;

        if (i === 0) {
          ctx.moveTo(x, finalY);
        } else {
          ctx.lineTo(x, finalY);
        }
      }

      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      wRef.current = rect.width;
      hRef.current = propHeight || (mode === 'idle' ? 80 : mode === 'recording' ? 200 : 120);
      canvas.width = wRef.current * dpr;
      canvas.height = hRef.current * dpr;
      canvas.style.width = `${wRef.current}px`;
      canvas.style.height = `${hRef.current}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    t0.current = Date.now();
    animRef.current = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animRef.current);
    };
  }, [draw, mode, propHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
    </div>
  );
}
