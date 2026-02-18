# CLAUDE.md — Harmonic Intake

## Project Overview

Harmonic Intake is a **real-time vocal frequency analysis tool** for sound healers, psychotherapists, breathwork practitioners, voice coaches, and other wellness professionals. A client hums into the microphone for 15 seconds, and the app generates a **Frequency Profile** — a personalised report showing their fundamental frequency, musical note, chakra resonance, overtone richness, tonal stability, and session recommendations.

**Repository:** https://github.com/RemiDz/HarmonicIntake
**Local path:** `C:\Users\rdzingel\Desktop\MY_APPS\HarmonicIntake`

**Philosophy: Zero friction, zero infrastructure, zero cost.**
- No accounts, no login, no database, no backend
- No client names or personal data collected
- Runs entirely in the browser using Web Audio API
- Static site — deploy to Vercel/Netlify for free
- Value is immediate: open → hum → insight → share

**Target users:** Sound healers, psychotherapists, breathwork facilitators, voice coaches, music therapists — anyone working with clients who wants a non-verbal baseline assessment.

**Live URL target:** harmonicintake.com (or similar)

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router, static export)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + CSS custom properties for the design system
- **Audio:** Web Audio API (no external audio libraries)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Deployment:** Vercel (static export via `output: 'export'` in next.config)
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint + Prettier

### No backend dependencies
- No database
- No API routes
- No authentication
- No server-side rendering needed
- `next.config.js` should use `output: 'export'` for fully static build

---

## Design System

### Aesthetic Direction
**"Deep ocean instrument panel"** — refined, dark, atmospheric. Think: a high-end audio analyser meets a meditation app. The interface should feel like a precision instrument that also has soul.

### Typography
- **Display/Headings:** Cormorant Garamond (serif, elegant, spiritual without being cheesy)
- **Monospace/Data:** DM Mono (clean, technical, pairs well with Cormorant)
- **Body:** System sans-serif stack as fallback only
- Load via `next/font/google`

### Colour Palette (CSS Variables)

```css
:root {
  /* Base */
  --bg-deep: #050c15;
  --bg-mid: #091623;
  --bg-surface: #0d1e30;
  --bg-card: #0a1520;
  --border: #162535;
  --border-hover: #1a2e42;

  /* Text */
  --text-primary: #d8e8f5;
  --text-secondary: #8aa5bb;
  --text-muted: #507090;
  --text-dim: #3a5570;

  /* Chakra Colours (used as dynamic accents) */
  --chakra-root: #E24B4B;
  --chakra-sacral: #F0913A;
  --chakra-solar: #F5D547;
  --chakra-heart: #5ABF7B;
  --chakra-throat: #4FA8D6;
  --chakra-third-eye: #7B6DB5;
  --chakra-crown: #C77DBA;

  /* Functional */
  --accent-primary: #4FA8D6;
  --accent-secondary: #7B6DB5;
  --success: #5ABF7B;
  --warning: #F0913A;
  --error: #E24B4B;
}
```

### Spacing & Layout
- Max content width: 420px (mobile-first, works on practitioner's phone/tablet during sessions)
- Generous padding: 24px horizontal, 36-72px vertical
- Card border-radius: 12-16px
- Subtle backdrop blur on cards: `backdrop-filter: blur(8px)`

### Motion Principles
- Entry animations: fade-in + translateY (staggered)
- Live data: smooth transitions (0.3s ease)
- Mandala: CSS keyframe animations during recording, static on profile
- Countdown: scale pop animation
- Keep it smooth and calming — this is used in healing spaces

### Ambient Effects
- Large, blurred radial gradient orbs in background (breathing animation)
- Colour shifts based on detected chakra
- Subtle grain/noise texture overlay (optional, very subtle)

---

## Application Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── page.tsx            # Main (only) page
│   └── globals.css         # CSS variables, base styles, keyframes
├── components/
│   ├── screens/
│   │   ├── IdleScreen.tsx      # Welcome / start screen
│   │   ├── CountdownScreen.tsx # 3-2-1 countdown overlay
│   │   ├── LiveScreen.tsx      # Active recording with real-time viz
│   │   └── ResultScreen.tsx    # Final frequency profile
│   ├── viz/
│   │   ├── MandalaViz.tsx      # SVG mandala visualisation
│   │   ├── SpectrumBar.tsx     # Frequency spectrum bar chart
│   │   ├── OvertoneChart.tsx   # Harmonic overtone bar chart
│   │   └── StabilityMeter.tsx  # Tonal stability progress bar
│   ├── ui/
│   │   ├── Button.tsx          # Reusable button variants
│   │   ├── Card.tsx            # Styled card wrapper
│   │   ├── Badge.tsx           # Chakra badge component
│   │   └── AmbientOrbs.tsx     # Background atmospheric effects
│   └── share/
│       ├── EmailProfile.tsx    # Email composition logic
│       └── CopyProfile.tsx     # Clipboard copy with toast
├── lib/
│   ├── audio/
│   │   ├── pitch-detection.ts  # Autocorrelation algorithm
│   │   ├── overtone-analysis.ts# FFT overtone extraction
│   │   ├── spectrum.ts         # Spectrum band data extraction
│   │   └── recorder.ts        # Mic stream + AudioContext management
│   ├── music/
│   │   ├── note-mapping.ts     # Frequency → note/octave/cents
│   │   ├── chakra-mapping.ts   # Frequency → chakra data
│   │   └── intervals.ts       # Perfect 5th, minor 3rd calculations
│   ├── profile/
│   │   ├── build-profile.ts   # Aggregate recording → FrequencyProfile
│   │   └── recommendations.ts # Generate session recommendations
│   └── types.ts               # All TypeScript interfaces
├── hooks/
│   ├── useAudioAnalysis.ts    # Main audio recording + analysis hook
│   ├── useCountdown.ts        # Countdown timer hook
│   └── useClipboard.ts        # Copy to clipboard with feedback
└── __tests__/
    ├── pitch-detection.test.ts
    ├── note-mapping.test.ts
    ├── chakra-mapping.test.ts
    └── build-profile.test.ts
```

---

## Core Data Types

```typescript
interface FrequencyProfile {
  fundamental: number;        // Hz (averaged over recording)
  noteInfo: NoteInfo;          // { note: "G#", octave: 3, cents: -12 }
  chakra: ChakraInfo;          // { name: "Throat", color: "#4FA8D6", ... }
  stability: number;           // 0-1 (coefficient of variation inverted)
  overtones: Overtone[];       // Harmonics 2-8 with relative amplitude
  richness: number;            // 0-100 (average overtone presence)
  fifth: IntervalInfo;         // Perfect 5th recommendation
  third: IntervalInfo;         // Minor 3rd recommendation
  timestamp: Date;
}

interface NoteInfo {
  note: string;     // "C", "C#", "D", etc.
  octave: number;   // 2-5 typically
  cents: number;    // -50 to +50 deviation from perfect pitch
}

interface ChakraInfo {
  name: string;           // "Root", "Sacral", etc.
  note: string;           // Traditional associated note
  freq: number;           // Traditional frequency
  color: string;          // Hex colour
  range: [number, number]; // Frequency range boundaries
  intention: string;      // Session focus suggestion
}

interface Overtone {
  harmonic: number;   // 2-8
  freq: number;       // Hz
  amplitude: number;  // 0-1 (relative to fundamental)
  db: number;         // dB relative to fundamental
}

interface IntervalInfo {
  freq: number;
  note: NoteInfo;
}
```

---

## Audio Engine Specifications

### Pitch Detection
- **Algorithm:** Autocorrelation (time-domain)
- **FFT size:** 4096
- **Smoothing:** 0.85
- **Valid range:** 50 Hz – 600 Hz (covers typical male and female vocal range)
- **Noise gate:** RMS < 0.01 = silence (return -1)
- **Parabolic interpolation** on autocorrelation peak for sub-bin accuracy

### Overtone Extraction
- Use `getFloatFrequencyData()` from AnalyserNode
- For each harmonic h (2 through 8), find the FFT bin at `fundamental * h`
- Calculate amplitude relative to fundamental's bin amplitude
- Normalise to 0-1 range

### Stability Calculation
- Maintain rolling buffer of last 30 frequency readings
- Calculate coefficient of variation (CV = stddev / mean)
- Stability = clamp(1 - CV * 10, 0, 1)
- Higher = more stable pitch (client sustaining well)

### Recording Flow
1. Request microphone permission via `getUserMedia({ audio: true })`
2. Create AudioContext → MediaStreamSource → AnalyserNode
3. Run `requestAnimationFrame` loop for 15 seconds
4. Each frame: extract pitch, overtones, spectrum, update stability
5. On completion: aggregate all frequency readings into FrequencyProfile
6. Clean up: stop tracks, close AudioContext

---

## Screen Specifications

### 1. Idle Screen (Welcome)
- App title "Harmonic Intake" with gradient shimmer animation
- Subtitle: "Real-time vocal frequency analysis for practitioners"
- Tagline above title: "Voice · Frequency · Insight"
- Card with 3 numbered steps (01, 02, 03) explaining the process
- Large "Begin Analysis" CTA button (gradient background)
- Footer: "No data stored · Works entirely in your browser"
- Ambient background orbs (breathing animation)

### 2. Countdown Screen
- Full-screen overlay, dark background
- Large number (3, 2, 1) with scale-pop animation
- Text: "Get ready to hum"
- Each number gets its own pop animation (use key prop for re-trigger)

### 3. Live Screen (Recording)
- Header: "● Listening" (red dot, pulsing)
- Circular timer ring (SVG) showing progress through 15 seconds
- **MandalaViz** — animated SVG with concentric rings (one per overtone), 12 radial petals, centre circle with frequency number. Rings and petals animate based on overtone amplitudes
- Large frequency display: "127.3 Hz" in monospace
- Note display: "B2" with cents deviation (+/- coloured)
- Chakra badge: coloured dot + name
- Spectrum bar chart (64 bands)
- Overtone chart (H2-H8 bars)
- Stability meter (progress bar with label)
- "End Early" button (subtle, bottom)

### 4. Result Screen (Frequency Profile)
- Header: "✦ Analysis Complete" + "Frequency Profile" + timestamp
- Static MandalaViz (same as live but not animating)
- 3-column metric grid: Fundamental (Hz), Note, Stability (%)
- Chakra resonance card with coloured dot, chakra name, and session intention
- Overtone presence chart with richness percentage
- **Session Recommendations panel:**
  - 2×2 grid: Drone Note, Overtone Richness, Perfect 5th, Minor 3rd
  - Instruments section with personalised suggestions based on richness
- **Share actions:**
  - "✉ Email Profile" — opens mailto: with formatted plain text summary
  - "Copy Text" — copies profile summary to clipboard, shows toast
- "New Analysis" button to reset
- Footer: "HARMONIC INTAKE · No data stored · Browser only"

---

## Chakra Mapping

| Chakra | Note | Freq (Hz) | Colour | Range (Hz) | Session Intention |
|--------|------|-----------|--------|------------|-------------------|
| Root | C | 256 | #E24B4B | 60–130 | Grounding, safety & stability |
| Sacral | D | 288 | #F0913A | 130–175 | Creativity, emotion & flow |
| Solar Plexus | E | 320 | #F5D547 | 175–225 | Confidence, will & personal power |
| Heart | F | 341 | #5ABF7B | 225–280 | Love, compassion & connection |
| Throat | G | 384 | #4FA8D6 | 280–350 | Expression, truth & communication |
| Third Eye | A | 426 | #7B6DB5 | 350–450 | Intuition, insight & awareness |
| Crown | B | 480 | #C77DBA | 450–600 | Transcendence, unity & spirit |

---

## Session Recommendations Logic

Given a detected fundamental frequency:

1. **Drone Note:** Match the client's note/octave — "for deep resonance"
2. **Perfect 5th:** fundamental × 1.5 — "for expansion & openness"
3. **Minor 3rd:** fundamental × 1.2 — "for emotional release"
4. **Instrument suggestions:**
   - If richness > 50%: "Rich overtone voice — warm, sustained tones. Monochord and singing bowls."
   - If richness ≤ 50%: "Thinner profile — complement with harmonically rich instruments. Gongs and didgeridoo."
5. **Chakra intention:** Map from chakra data

---

## Email Format

When user taps "Email Profile", open `mailto:` with this format:

```
Subject: Frequency Profile — {Note}{Octave} {Freq}Hz — {Chakra} Chakra

Body:
HARMONIC INTAKE — Frequency Profile
{date} {time}

FUNDAMENTAL
Frequency: {freq} Hz
Note: {note}{octave} ({cents} cents)
Chakra: {chakra} — {intention}
Stability: {stability}% ({label})
Overtone Richness: {richness}% ({label})

SESSION RECOMMENDATIONS
Drone note: {note}{octave}
Perfect 5th: {fifth_note}{fifth_octave} ({fifth_freq} Hz) — for expansion
Minor 3rd: {third_note}{third_octave} ({third_freq} Hz) — for emotional release

{instrument suggestion text}

Focus intention: {chakra intention}

— Generated by Harmonic Intake
```

---

## Clipboard Copy Format

Shorter format for quick sharing:

```
HARMONIC INTAKE — Frequency Profile

Fundamental: {freq} Hz ({note}{octave})
Chakra: {chakra} — {intention}
Stability: {stability}%
Overtone Richness: {richness}%

Drone: {note}{octave} | 5th: {fifth} | m3: {third}
```

---

## SEO & Metadata

```typescript
// app/layout.tsx metadata
export const metadata = {
  title: 'Harmonic Intake — Vocal Frequency Analysis for Practitioners',
  description: 'Real-time vocal frequency profiling tool for sound healers, psychotherapists, and wellness practitioners. Analyse fundamental frequency, overtones, chakra resonance, and get personalised session recommendations. Free, no sign-up, runs in your browser.',
  keywords: ['sound healing', 'frequency analysis', 'vocal profiling', 'chakra', 'overtones', 'sound therapy', 'wellness tool'],
  openGraph: {
    title: 'Harmonic Intake',
    description: 'Discover your client\'s frequency fingerprint',
    type: 'website',
  },
};
```

---

## Performance Requirements

- **Lighthouse score:** 95+ across all categories
- **First Contentful Paint:** < 1.5s
- **Bundle size:** Keep minimal — no heavy dependencies
- **Audio latency:** Analysis loop should run at 60fps via requestAnimationFrame
- **Mobile-first:** Must work flawlessly on phones and tablets (practitioners use these in sessions)
- **Offline capable:** Consider adding a service worker for PWA support (nice-to-have)

---

## Browser Support

- Chrome 80+ (primary — best Web Audio API support)
- Safari 14+ (iOS — important for practitioners with iPads)
- Firefox 78+
- Edge 80+
- Must handle microphone permission denial gracefully

---

## Build & Deploy

```bash
# Local project path
cd C:\Users\rdzingel\Desktop\MY_APPS\HarmonicIntake

# Development
npm run dev

# Build (static export)
npm run build
# Output goes to /out directory

# Deploy
# Push to GitHub → Vercel auto-deploys from main branch
git add .
git commit -m "your message"
git push origin main
```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
};
module.exports = nextConfig;
```

---

## Future Enhancements (NOT for MVP)

These are noted for future reference but should NOT be built now:

- [ ] PDF export of profile (with mandala visualisation)
- [ ] Before/after comparison mode (two recordings side by side)
- [ ] Session notes field (practitioner adds free text)
- [ ] PWA with offline support
- [ ] Multi-language support
- [ ] Waveform timeline visualisation
- [ ] Audio playback of the recording
- [ ] QR code to share profile
- [ ] Premium tier with advanced analysis
- [ ] Client portal for practitioners

---

## Important Notes for Claude Code

1. **This is a STATIC site.** No API routes, no server components that fetch data, no database. Everything runs client-side.
2. **Mobile-first.** The primary use case is a practitioner holding their phone near a client during a session. Touch targets should be large, text should be readable.
3. **The audio engine is the core IP.** The pitch detection, overtone analysis, and profile generation must be accurate and performant. Test with real microphone input.
4. **The design must feel premium.** This is a professional tool — it should look like it costs money even though it's free. Avoid anything that looks like a generic template.
5. **Accessibility matters.** Colour is not the only indicator — use text labels alongside colours. Ensure sufficient contrast ratios.
6. **The mandala visualisation is the hero moment.** It should be beautiful, responsive to audio input, and memorable. This is what makes the app feel magical.
7. **Share functionality is critical.** The email and copy features are how practitioners integrate this into their workflow. The text format must be clean and professional.
