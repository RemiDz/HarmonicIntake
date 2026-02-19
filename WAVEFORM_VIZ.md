# WAVEFORM VISUALISATION — Harmonic Intake

## Overview

Add a beautiful, futuristic, flowing voice waveform visualisation inspired by modern AI audio interfaces. This becomes the primary visual during recording — responsive to the client's voice in real-time, shifting colour with chakra detection, and encoding vocal biomarker information into the visual itself.

**Reference aesthetic:** Flowing sinusoidal mesh/ribbon — multiple layered wave lines creating a 3D-like effect. Neon glow, smooth gradients, dark background. Think: a living audio signature, not a clinical oscilloscope.

---

## Visual Design

### Core Elements
- **Multiple layered wave lines** (8-12 lines) flowing horizontally across the screen
- Lines are offset vertically with slight phase differences, creating a **ribbon/mesh** effect
- Each line has slight transparency (0.3-0.7 opacity) so overlapping creates depth
- Lines use **smooth cubic bezier curves**, not jagged point-to-point connections
- The entire waveform has a **glow effect** (CSS filter or canvas shadow blur)
- Background: the app's existing deep ocean dark (#050c15)

### Colour Behaviour
- **Idle/Countdown:** Cool blue gradient (cyan → deep blue) — neutral, calming
- **During recording:** Colour transitions smoothly to the **dominant chakra colour** as it's detected in real-time
  - Root: Red/coral gradient
  - Sacral: Orange/amber gradient
  - Solar Plexus: Yellow/gold gradient
  - Heart: Green/emerald gradient
  - Throat: Blue/cyan gradient (similar to idle but brighter)
  - Third Eye: Indigo/violet gradient
  - Crown: Purple/magenta gradient
- **Colour transition:** Use CSS/canvas interpolation over ~2 seconds — no sudden jumps
- **Multi-colour mode:** As the analysis matures (after ~5 seconds), the wave lines can split into multiple colours representing the top 2-3 chakras, creating a beautiful multi-hued ribbon

### Glow & Atmosphere
- Inner glow on each line: 2-4px blur, same colour as the line at 50% opacity
- Outer glow: larger 8-12px blur, softer, creates an atmospheric halo
- Optional: tiny particle sparkles along the wave peaks (very subtle, like star dust)
- The glow intensity should pulse gently with the audio amplitude

---

## Informative Features Encoded in the Waveform

The waveform isn't just pretty — it encodes real biomarker data visually:

### 1. Amplitude → Wave Height
- The vertical displacement of the wave directly maps to the RMS energy (loudness)
- Louder voice = taller waves, quieter = flatter
- This is the most intuitive mapping: you hum louder, the wave grows

### 2. Frequency → Wave Speed/Density
- Higher fundamental frequency = waves are more densely packed (shorter wavelength visually)
- Lower fundamental = wider, more expansive wave shapes
- This subtly shows the pitch without any numbers

### 3. Overtone Richness → Number of Visible Lines
- Rich overtone voice (high HNR, many harmonics): all 12 lines visible, creating a dense, complex ribbon
- Thinner voice (fewer overtones): only 4-6 lines visible, creating a cleaner, simpler wave
- Lines fade in/out based on overtone presence

### 4. Stability (Jitter) → Wave Smoothness
- Low jitter (stable voice): very smooth, flowing curves with consistent spacing
- Higher jitter (unstable/expressive): more variation in the curve amplitude and spacing, slight wobble
- This is a subtle effect — not jagged, just less perfectly uniform

### 5. Shimmer → Line Opacity Variation
- Low shimmer (consistent amplitude): all lines maintain steady opacity
- Higher shimmer: gentle opacity pulsing on individual lines, creating a "breathing" effect

### 6. Spectral Centroid → Colour Temperature
- Lower centroid (warm voice): warmer colour tones within the chakra palette
- Higher centroid (bright voice): cooler/brighter tones
- This is a subtle shift within the primary chakra colour

---

## Implementation: HTML Canvas

Use the HTML Canvas API for performance — this needs to run at 60fps alongside the audio analysis.

### Component: `src/components/viz/VoiceWaveform.tsx`

```typescript
interface WaveformProps {
  // Real-time data from audio analysis
  timeDomainData: Float32Array | null;  // Raw waveform data
  rmsEnergy: number;                     // 0-1 loudness
  fundamental: number;                   // Hz
  overtoneRichness: number;              // 0-1
  jitter: number;                        // 0-1 normalised
  shimmer: number;                       // 0-1 normalised
  chakraColor: string;                   // Hex colour of dominant chakra
  secondaryColor?: string;               // Hex colour of secondary chakra

  // State
  isRecording: boolean;
  isResult: boolean;                     // Static mode for result screen

  // Layout
  width: number;
  height: number;
}
```

### Core Drawing Algorithm

```typescript
const WAVE_LINES = 12;
const POINTS_PER_LINE = 128;

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  props: WaveformProps,
  time: number  // Animation time in seconds
) {
  const { width, height, timeDomainData, rmsEnergy, fundamental, overtoneRichness, jitter, chakraColor } = props;

  ctx.clearRect(0, 0, width, height);

  // Determine how many lines to show based on overtone richness
  const visibleLines = Math.round(4 + overtoneRichness * 8); // 4-12 lines

  // Base wave parameters
  const centerY = height / 2;
  const maxAmplitude = (height / 2) * 0.8 * Math.max(0.1, rmsEnergy * 3); // Scale with loudness
  const waveLength = fundamental > 0 ? Math.max(60, 300 - fundamental) : 200; // Higher pitch = denser

  // Jitter creates variation in the wave
  const jitterOffset = jitter * 5;

  for (let line = 0; line < visibleLines; line++) {
    const lineProgress = line / (WAVE_LINES - 1); // 0 to 1
    const lineOpacity = 0.15 + (1 - Math.abs(lineProgress - 0.5) * 2) * 0.55; // Brighter in center

    // Shimmer: vary opacity per line
    const shimmerVar = props.shimmer * 0.2 * Math.sin(time * 2 + line * 0.7);
    const finalOpacity = Math.max(0.1, lineOpacity + shimmerVar);

    // Phase offset per line (creates the ribbon spread)
    const phaseOffset = (lineProgress - 0.5) * Math.PI * 0.6;

    // Vertical offset per line (creates depth)
    const yOffset = (lineProgress - 0.5) * maxAmplitude * 0.4;

    // Draw the wave line
    ctx.beginPath();
    ctx.strokeStyle = hexToRgba(chakraColor, finalOpacity);
    ctx.lineWidth = 1.5;
    ctx.shadowColor = chakraColor;
    ctx.shadowBlur = 4 + rmsEnergy * 8;

    for (let i = 0; i <= POINTS_PER_LINE; i++) {
      const x = (i / POINTS_PER_LINE) * width;
      const progress = i / POINTS_PER_LINE;

      // Base sine wave
      let y = centerY + yOffset;

      // Add waveform data if available
      if (timeDomainData && timeDomainData.length > 0) {
        const dataIndex = Math.floor(progress * timeDomainData.length);
        const sample = timeDomainData[dataIndex] || 0;
        y += sample * maxAmplitude * (1 + lineProgress * 0.3);
      } else {
        // Idle animation: gentle breathing sine
        y += Math.sin(progress * Math.PI * 4 + time * 0.5 + phaseOffset) * maxAmplitude * 0.3;
      }

      // Add flowing animation
      y += Math.sin(progress * Math.PI * 2 + time * 1.5 + phaseOffset) * 8;

      // Add jitter wobble
      y += Math.sin(progress * 20 + time * 3 + line) * jitterOffset;

      // Envelope: fade out at edges
      const envelope = Math.sin(progress * Math.PI);
      y = centerY + yOffset + (y - centerY - yOffset) * envelope;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Use quadratic curves for smoothness
        const prevX = ((i - 1) / POINTS_PER_LINE) * width;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }

    ctx.stroke();
  }

  // Reset shadow for performance
  ctx.shadowBlur = 0;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

### Animation Loop

```typescript
function WaveformCanvas({ ...props }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = props.width * dpr;
    canvas.height = props.height * dpr;
    ctx.scale(dpr, dpr);

    function animate() {
      const time = (Date.now() - startTimeRef.current) / 1000;
      drawWaveform(ctx!, props, time);
      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [props]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: props.width,
        height: props.height,
        display: 'block',
      }}
    />
  );
}
```

---

## Placement in the App

### During Recording (Live Screen)
- **Position:** Full width of the app container, 200-250px tall
- **Location:** Above the frequency display and below the "Listening" header
- **Replaces or sits above:** The current spectrum bar visualisation
- The mandala can remain as a smaller element, or be replaced by the waveform as the primary visual — test both and decide which feels more impactful
- The waveform should be the FIRST thing people see and react to

### On Result Screen (Static)
- **Position:** Full width, 150px tall
- **Location:** Below the "Analysis Complete" header, above the metrics
- **Behaviour:** Static/frozen — shows the "average" waveform shape from the recording
- **Colour:** Set to the dominant chakra colour
- This acts as a visual "voice signature"

### On Shareable Card (Save as Image)
- Include a simplified version (fewer lines, 100px tall) as a beautiful accent on the profile card
- Rendered directly onto the canvas when generating the card image

### Idle Screen
- A very gentle, ambient version of the waveform (no audio data, just a slowly breathing sine wave in neutral blue)
- Low amplitude, slow movement — meditative, inviting
- This gives the idle screen a sense of life without being distracting

---

## Colour Transition System

```typescript
interface WaveformColors {
  primary: string;
  secondary: string;
  glow: string;
}

function getChakraGradient(chakraName: string): WaveformColors {
  const gradients: Record<string, WaveformColors> = {
    "Root":         { primary: "#E24B4B", secondary: "#FF6B6B", glow: "#E24B4B" },
    "Sacral":       { primary: "#F0913A", secondary: "#FFB366", glow: "#F0913A" },
    "Solar Plexus": { primary: "#F5D547", secondary: "#FFE680", glow: "#F5D547" },
    "Heart":        { primary: "#5ABF7B", secondary: "#7DDFAA", glow: "#5ABF7B" },
    "Throat":       { primary: "#4FA8D6", secondary: "#7CC4E8", glow: "#4FA8D6" },
    "Third Eye":    { primary: "#7B6DB5", secondary: "#9B8DD5", glow: "#7B6DB5" },
    "Crown":        { primary: "#C77DBA", secondary: "#E0A0D5", glow: "#C77DBA" },
  };
  return gradients[chakraName] || gradients["Throat"]; // Default to Throat (blue)
}

// Smoothly interpolate between two hex colours
function lerpColor(colorA: string, colorB: string, t: number): string {
  const rA = parseInt(colorA.slice(1, 3), 16);
  const gA = parseInt(colorA.slice(3, 5), 16);
  const bA = parseInt(colorA.slice(5, 7), 16);
  const rB = parseInt(colorB.slice(1, 3), 16);
  const gB = parseInt(colorB.slice(3, 5), 16);
  const bB = parseInt(colorB.slice(5, 7), 16);

  const r = Math.round(rA + (rB - rA) * t);
  const g = Math.round(gA + (gB - gA) * t);
  const b = Math.round(bA + (bB - bA) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

### Colour Transition During Recording

The waveform should smoothly transition colour as the dominant chakra changes. Use a lerp with a slow interpolation speed (~2 seconds) so the colour never snaps:

```typescript
// In the recording hook, track colour transition
const [currentColor, setCurrentColor] = useState("#4FA8D6"); // Start blue
const targetColorRef = useRef("#4FA8D6");

useEffect(() => {
  if (dominantChakra) {
    targetColorRef.current = getChakraGradient(dominantChakra.name).primary;
  }
}, [dominantChakra]);

// On each animation frame, lerp towards target
const transitionSpeed = 0.02; // ~2 seconds full transition
setCurrentColor(prev => lerpColor(prev, targetColorRef.current, transitionSpeed));
```

---

## Multi-Colour Ribbon (Advanced)

After 5+ seconds of recording, once the chakra analysis has enough data, the individual wave lines can be coloured by different chakras to create a rainbow ribbon effect:

```typescript
function getLineColor(
  lineIndex: number,
  totalLines: number,
  chakraScores: ChakraScore[]
): string {
  // Sort chakras by score, take top 3
  const sorted = [...chakraScores].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);

  // Distribute lines across top 3 chakras
  const segment = totalLines / 3;
  if (lineIndex < segment) return top3[0].color;
  if (lineIndex < segment * 2) return top3[1]?.color || top3[0].color;
  return top3[2]?.color || top3[0].color;
}
```

This creates a gorgeous multi-hued flowing ribbon where you can literally SEE the different energy centres in the waveform.

---

## Performance Notes

- Use `requestAnimationFrame` for the render loop
- The canvas should be the exact pixel size needed (use devicePixelRatio for retina)
- Limit shadow blur calculations — only apply glow to every 2nd or 3rd line if frame rate drops
- On low-end mobile devices, reduce to 6 lines and 64 points per line
- The timeDomainData buffer from the AnalyserNode is already available — no extra audio processing needed for the visual

---

## Responsive Sizing

```typescript
// Width: full container width (max 420px as per app design)
// Height varies by screen:
const WAVEFORM_HEIGHTS = {
  idle: 120,      // Gentle ambient animation
  recording: 220, // Full-size hero visual
  result: 150,    // Static voice signature
  card: 100,      // Shareable card accent
};
```

---

## Implementation Priority

1. Build the basic `VoiceWaveform` canvas component with sine wave animation (idle state)
2. Connect to real `timeDomainData` from the audio analyser
3. Add amplitude (RMS) → wave height mapping
4. Add chakra colour transitions
5. Add overtone richness → line count
6. Add jitter → smoothness variation
7. Add shimmer → opacity variation
8. Add glow effects
9. Add multi-colour ribbon mode
10. Create static version for result screen
11. Integrate into shareable profile card

---

## Important Notes for Claude Code

1. **Canvas, not SVG** — SVG would be too slow for 12 lines at 60fps with blur effects. Canvas is the right choice here.
2. **The waveform uses the SAME timeDomainData** already being captured by the AnalyserNode — no additional audio processing is needed for the visual.
3. **Smooth curves are essential** — use quadratic or cubic bezier curves between points, never straight line segments. The reference images show flowing, organic shapes.
4. **The glow makes it** — without the glow/bloom effect, it'll look like a basic oscilloscope. The CSS `shadowBlur` on the canvas context creates the neon effect.
5. **Colour transitions must be smooth** — jarring colour changes will feel broken. Always lerp over 1-2 seconds.
6. **Mobile performance matters** — test on a real phone. If frame rate drops below 30fps, reduce line count and point density.
7. **The idle animation should feel alive but calm** — like watching waves on a still lake. It sets the meditative tone before the recording begins.
