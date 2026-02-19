'use client';

import { useRef, useEffect, useCallback } from 'react';

interface ParticleFieldProps {
  /** 'idle' | 'countdown' | 'recording' | 'complete' */
  mode: string;
  /** Hex colour for particles during recording/result */
  accentColor?: string;
  /** RMS energy (0-1) to drive audio reactivity during recording */
  rmsEnergy?: number;
}

const PARTICLE_COUNT = 180;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseOpacity: number;
  /** phase offset for per-particle shimmer */
  phase: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function createParticles(w: number, h: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 1 + Math.random() * 1.5,
      baseOpacity: 0.08 + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return particles;
}

export function ParticleField({ mode, accentColor, rmsEnergy = 0 }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const propsRef = useRef({ mode, accentColor, rmsEnergy });
  propsRef.current = { mode, accentColor, rmsEnergy };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { mode, accentColor, rmsEnergy } = propsRef.current;
    const { w, h } = sizeRef.current;
    const time = performance.now() / 1000;

    ctx.clearRect(0, 0, w, h);

    // Determine colour
    let rgb: [number, number, number];
    if ((mode === 'recording' || mode === 'complete') && accentColor) {
      rgb = hexToRgb(accentColor);
    } else {
      // Warm white/cyan default
      rgb = [160, 210, 230];
    }

    const particles = particlesRef.current;
    const isRecording = mode === 'recording';
    const isResult = mode === 'complete';

    // Waveform attractor zone (center-ish of screen, where waveform lives)
    const attractY = h * 0.35;
    const attractStrength = isRecording ? Math.min(rmsEnergy * 3, 0.8) : 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Update velocity
      if (isRecording && attractStrength > 0) {
        // Pull toward waveform zone
        const dy = attractY - p.y;
        const dx = w * 0.5 - p.x;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        p.vx += (dx / dist) * attractStrength * 0.02;
        p.vy += (dy / dist) * attractStrength * 0.02;
      } else if (isResult) {
        // Gentle upward drift
        p.vy -= 0.003;
      }

      // Damping
      p.vx *= 0.995;
      p.vy *= 0.995;

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      // Shimmer opacity
      const shimmer = 0.5 + 0.5 * Math.sin(time * 0.8 + p.phase);
      let opacity = p.baseOpacity * (0.7 + shimmer * 0.3);

      // Boost opacity during recording based on RMS
      if (isRecording) {
        opacity *= 1 + rmsEnergy * 2;
      }

      opacity = Math.min(opacity, 0.5);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      // Reinitialise particles if none exist
      if (particlesRef.current.length === 0) {
        particlesRef.current = createParticles(w, h);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    particlesRef.current = createParticles(sizeRef.current.w, sizeRef.current.h);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
