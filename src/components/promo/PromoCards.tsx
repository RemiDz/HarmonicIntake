'use client';

import { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Download, Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Format & Visual types                                              */
/* ------------------------------------------------------------------ */

type CardFormat = 'ig-post' | 'ig-story' | 'twitter' | 'tiktok';
type CardVisual = 'chakra-spectrum' | 'sound-wave' | 'mandala' | 'overtone';

interface FormatOption {
  id: CardFormat;
  label: string;
  w: number;
  h: number;
}

const FORMATS: FormatOption[] = [
  { id: 'ig-post', label: 'IG Post', w: 1080, h: 1080 },
  { id: 'ig-story', label: 'IG Story', w: 1080, h: 1920 },
  { id: 'twitter', label: 'Twitter/X', w: 1200, h: 675 },
  { id: 'tiktok', label: 'TikTok', w: 1080, h: 1920 },
];

const VISUALS: { id: CardVisual; label: string }[] = [
  { id: 'chakra-spectrum', label: 'Chakra Spectrum' },
  { id: 'sound-wave', label: 'Sound Wave' },
  { id: 'mandala', label: 'Mandala' },
  { id: 'overtone', label: 'Overtone Series' },
];

const CHAKRA_COLORS = [
  '#E24B4B', '#F0913A', '#F5D547', '#5ABF7B', '#4FA8D6', '#7B6DB5', '#C77DBA',
];

/* ------------------------------------------------------------------ */
/*  SVG visual builders (inline SVG strings)                           */
/* ------------------------------------------------------------------ */

function buildChakraSpectrum(w: number, h: number): string {
  const barW = Math.round(w * 0.08);
  const gap = Math.round(w * 0.03);
  const totalW = CHAKRA_COLORS.length * barW + (CHAKRA_COLORS.length - 1) * gap;
  const startX = Math.round((w - totalW) / 2);
  const maxH = Math.round(h * 0.35);
  const baseY = Math.round(h * 0.55);

  const bars = CHAKRA_COLORS.map((color, i) => {
    const bh = maxH * (0.5 + Math.sin((i / 6) * Math.PI) * 0.5);
    const x = startX + i * (barW + gap);
    const y = baseY - bh;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="${Math.round(barW / 4)}" fill="${color}" opacity="0.85"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bars}</svg>`;
}

function buildSoundWave(w: number, h: number): string {
  const cy = Math.round(h * 0.5);
  const amp1 = Math.round(h * 0.12);
  const amp2 = Math.round(h * 0.08);
  const amp3 = Math.round(h * 0.05);

  function wavePath(amplitude: number, freq: number, phase: number): string {
    const points: string[] = [];
    for (let x = 0; x <= w; x += 4) {
      const y = cy + Math.sin((x / w) * Math.PI * freq + phase) * amplitude;
      points.push(`${x},${Math.round(y)}`);
    }
    return `M${points.join(' L')}`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <path d="${wavePath(amp1, 4, 0)}" fill="none" stroke="#4FA8D6" stroke-width="3" opacity="0.7"/>
    <path d="${wavePath(amp2, 6, 1)}" fill="none" stroke="#7B6DB5" stroke-width="2" opacity="0.5"/>
    <path d="${wavePath(amp3, 8, 2)}" fill="none" stroke="#C77DBA" stroke-width="1.5" opacity="0.4"/>
  </svg>`;
}

function buildMandala(w: number, h: number): string {
  const cx = Math.round(w / 2);
  const cy = Math.round(h * 0.5);
  const maxR = Math.round(Math.min(w, h) * 0.28);

  const circles = [0.3, 0.5, 0.7, 0.9, 1.0].map((scale, i) => {
    const r = Math.round(maxR * scale);
    const color = CHAKRA_COLORS[i + 1] || '#4FA8D6';
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="1.5" opacity="${0.3 + i * 0.1}"/>`;
  }).join('');

  const petals: string[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const x2 = cx + Math.cos(angle) * maxR;
    const y2 = cy + Math.sin(angle) * maxR;
    petals.push(`<line x1="${cx}" y1="${cy}" x2="${Math.round(x2)}" y2="${Math.round(y2)}" stroke="#4FA8D6" stroke-width="1" opacity="0.25"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${circles}
    ${petals.join('')}
    <circle cx="${cx}" cy="${cy}" r="${Math.round(maxR * 0.12)}" fill="#4FA8D6" opacity="0.6"/>
  </svg>`;
}

function buildOvertone(w: number, h: number): string {
  const barH = Math.round(h * 0.03);
  const gap = Math.round(h * 0.015);
  const maxBarW = Math.round(w * 0.6);
  const startX = Math.round(w * 0.2);
  const totalH = 8 * barH + 7 * gap;
  const startY = Math.round((h - totalH) / 2);

  const bars = Array.from({ length: 8 }, (_, i) => {
    const amplitude = 1 / (i + 1);
    const bw = Math.round(maxBarW * amplitude);
    const y = startY + i * (barH + gap);
    const color = CHAKRA_COLORS[i % CHAKRA_COLORS.length];
    return `<rect x="${startX}" y="${y}" width="${bw}" height="${barH}" rx="${Math.round(barH / 2)}" fill="${color}" opacity="0.75"/>
      <text x="${startX - 10}" y="${y + barH * 0.75}" fill="#507090" font-family="monospace" font-size="${Math.round(barH * 0.8)}" text-anchor="end">H${i + 1}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bars}</svg>`;
}

function getVisualSVG(visual: CardVisual, w: number, h: number): string {
  switch (visual) {
    case 'chakra-spectrum': return buildChakraSpectrum(w, h);
    case 'sound-wave': return buildSoundWave(w, h);
    case 'mandala': return buildMandala(w, h);
    case 'overtone': return buildOvertone(w, h);
  }
}

/* ------------------------------------------------------------------ */
/*  Card HTML builder (inline styles, hardcoded hex — html2canvas)     */
/* ------------------------------------------------------------------ */

function buildPromoCardHTML(
  format: FormatOption,
  visual: CardVisual,
  headline: string,
): string {
  const { w, h } = format;
  const svgMarkup = getVisualSVG(visual, w, h);
  const isLandscape = w > h;
  const headlineSize = isLandscape ? 36 : 48;
  const subSize = isLandscape ? 16 : 20;
  const taglineSize = isLandscape ? 14 : 18;

  return `<div style="width:${w}px;height:${h}px;background:linear-gradient(180deg,#050c15 0%,#091623 40%,#0d1e30 100%);color:#d8e8f5;font-family:'Cormorant Garamond',Georgia,serif;position:relative;overflow:hidden;box-sizing:border-box;">

  <!-- Visual background -->
  <div style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.4;">
    ${svgMarkup}
  </div>

  <!-- Content overlay -->
  <div style="position:relative;z-index:1;display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:${isLandscape ? '48px 64px' : '80px 64px'};">

    <!-- Top: tagline -->
    <div style="text-align:center;">
      <div style="font-family:'DM Mono',monospace;font-size:${taglineSize}px;letter-spacing:4px;text-transform:uppercase;color:#4FA8D6;">Voice · Frequency · Insight</div>
    </div>

    <!-- Middle: headline -->
    <div style="text-align:center;padding:0 ${isLandscape ? '80px' : '20px'};">
      <div style="font-size:${headlineSize}px;font-weight:300;line-height:1.3;color:#d8e8f5;margin-bottom:${isLandscape ? '16px' : '24px'};">${headline.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</div>
      <div style="font-family:'DM Mono',monospace;font-size:${subSize}px;color:#8aa5bb;">Analyse your voice in 15 seconds</div>
    </div>

    <!-- Bottom: branding -->
    <div style="text-align:center;">
      <div style="font-size:${isLandscape ? '28px' : '36px'};font-weight:600;color:#d8e8f5;margin-bottom:8px;">Harmonic Intake</div>
      <div style="font-family:'DM Mono',monospace;font-size:${taglineSize}px;letter-spacing:3px;text-transform:uppercase;color:#3a5570;">Free · No sign-up · Browser only</div>
    </div>

  </div>
</div>`;
}

/* ------------------------------------------------------------------ */
/*  Download helper                                                    */
/* ------------------------------------------------------------------ */

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface PromoCardsProps {
  selectedHook: string | null;
}

export default function PromoCards({ selectedHook }: PromoCardsProps) {
  const [format, setFormat] = useState<CardFormat>('ig-post');
  const [visual, setVisual] = useState<CardVisual>('chakra-spectrum');
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const activeFormat = FORMATS.find((f) => f.id === format)!;
  const headline = selectedHook || 'Your voice contains frequencies that reveal your inner state.';

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { w, h } = activeFormat;
      const html = buildPromoCardHTML(activeFormat, visual, headline);

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        width: w,
        height: h,
        scale: 1,
        backgroundColor: '#050c15',
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(container);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });

      if (blob) {
        downloadBlob(blob, `harmonic-intake-${format}.png`);
      }
    } finally {
      setDownloading(false);
    }
  }, [activeFormat, visual, headline, format]);

  // Scale preview to fit container
  const previewMaxW = 600;
  const scale = Math.min(previewMaxW / activeFormat.w, 400 / activeFormat.h);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
        Image Cards
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Generate shareable promo images for social media.
      </p>

      {/* Format selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer border ${
              format === f.id
                ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                : 'bg-bg-surface border-border text-text-muted hover:text-text-secondary hover:border-border-hover'
            }`}
          >
            {f.label} ({f.w}x{f.h})
          </button>
        ))}
      </div>

      {/* Visual selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {VISUALS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVisual(v.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer border ${
              visual === v.id
                ? 'bg-accent-secondary/20 border-accent-secondary text-accent-secondary'
                : 'bg-bg-surface border-border text-text-muted hover:text-text-secondary hover:border-border-hover'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <Card className="mb-4 overflow-hidden">
        <div className="flex justify-center">
          <div
            ref={previewRef}
            style={{
              width: activeFormat.w * scale,
              height: activeFormat.h * scale,
              overflow: 'hidden',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: activeFormat.w,
                height: activeFormat.h,
              }}
              dangerouslySetInnerHTML={{
                __html: buildPromoCardHTML(activeFormat, visual, headline),
              }}
            />
          </div>
        </div>
      </Card>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center justify-center gap-2 w-full rounded-xl px-6 py-3 text-sm font-medium
          bg-gradient-to-r from-accent-primary to-accent-secondary text-white
          shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/30
          transition-shadow disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        {downloading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Rendering...
          </>
        ) : (
          <>
            <Download size={16} />
            Download {activeFormat.label} ({activeFormat.w}x{activeFormat.h})
          </>
        )}
      </button>
    </div>
  );
}
