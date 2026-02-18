# CHAKRA SCAN UPDATE — Harmonic Intake

## Overview

Upgrade from single-chakra detection to a **full 7-chakra energy scan**. Instead of mapping only the fundamental frequency to one chakra, the app now analyses multiple audio variables to generate an activation percentage for ALL seven chakras simultaneously. The result is a complete energetic profile — a full-body frequency map.

This is the core differentiator. No other tool does this.

---

## Multi-Variable Chakra Analysis

The app analyses these audio dimensions and combines them into a composite score per chakra:

### Variable 1: Spectral Band Energy (Weight: 35%)
Each chakra has a frequency band. Measure the total spectral power (RMS energy) within each band from the FFT data.

```typescript
const CHAKRA_BANDS = [
  { chakra: "Root",        low: 60,  high: 130 },
  { chakra: "Sacral",      low: 130, high: 175 },
  { chakra: "Solar Plexus", low: 175, high: 225 },
  { chakra: "Heart",       low: 225, high: 280 },
  { chakra: "Throat",      low: 280, high: 350 },
  { chakra: "Third Eye",   low: 350, high: 450 },
  { chakra: "Crown",       low: 450, high: 600 },
];
```

For each band, sum the FFT magnitude bins that fall within the range, then normalise relative to the total spectral energy. This gives a percentage of total vocal energy sitting in each chakra's zone.

```typescript
function getSpectralBandEnergy(
  frequencyData: Float32Array, 
  sampleRate: number, 
  fftSize: number
): ChakraBandEnergy[] {
  const binResolution = sampleRate / fftSize;
  const results: ChakraBandEnergy[] = [];
  
  let totalEnergy = 0;
  
  // Convert dB to linear power for each bin in our range (60-600 Hz)
  const startBin = Math.floor(60 / binResolution);
  const endBin = Math.ceil(600 / binResolution);
  
  const linearPower: number[] = [];
  for (let i = startBin; i <= endBin; i++) {
    const power = Math.pow(10, frequencyData[i] / 10); // dB to linear
    linearPower.push(power);
    totalEnergy += power;
  }
  
  for (const band of CHAKRA_BANDS) {
    const lowBin = Math.floor(band.low / binResolution) - startBin;
    const highBin = Math.ceil(band.high / binResolution) - startBin;
    
    let bandEnergy = 0;
    for (let i = Math.max(0, lowBin); i <= Math.min(linearPower.length - 1, highBin); i++) {
      bandEnergy += linearPower[i];
    }
    
    results.push({
      chakra: band.chakra,
      energy: totalEnergy > 0 ? bandEnergy / totalEnergy : 0,
    });
  }
  
  return results;
}
```

### Variable 2: Harmonic Resonance (Weight: 25%)
Check if any of the voice's overtones (harmonics 2-8) land within each chakra's frequency band. If a strong overtone sits in the Heart range, that chakra gets a boost.

```typescript
function getHarmonicResonance(
  fundamental: number,
  overtones: Overtone[],
): ChakraResonance[] {
  const results: ChakraResonance[] = [];
  
  for (const band of CHAKRA_BANDS) {
    let resonance = 0;
    
    // Check if fundamental is in this band
    if (fundamental >= band.low && fundamental < band.high) {
      resonance += 0.5; // Strong boost for fundamental
    }
    
    // Check each overtone
    for (const ot of overtones) {
      if (ot.freq >= band.low && ot.freq < band.high) {
        resonance += ot.amplitude * 0.3; // Weighted by overtone strength
      }
    }
    
    results.push({
      chakra: band.chakra,
      resonance: Math.min(1, resonance), // Cap at 1
    });
  }
  
  return results;
}
```

### Variable 3: Vocal Qualities (Weight: 25%)
Map specific vocal characteristics to chakras:

```typescript
interface VocalQualities {
  rmsEnergy: number;        // 0-1: overall loudness/projection
  stability: number;        // 0-1: pitch consistency  
  spectralCentroid: number; // Hz: brightness of voice
  spectralSpread: number;   // Hz: width of spectral distribution
  harmonicToNoise: number;  // 0-1: clarity vs breathiness
  dynamicRange: number;     // 0-1: variation in amplitude
}
```

**Mapping vocal qualities to chakras:**

| Quality | Primary Chakra | Logic |
|---------|---------------|-------|
| `stability` (high) | Root | Grounded, steady = strong Root |
| `dynamicRange` (high) | Sacral | Emotional expressiveness, flow |
| `rmsEnergy` (high) | Solar Plexus | Projection, confidence, power |
| `spectralSpread` (wide) | Heart | Openness, expansiveness |
| `harmonicToNoise` (clear) | Throat | Clear expression, vocal health |
| `spectralCentroid` (high) | Third Eye | Brightness, upper frequency presence |
| Overtone richness (high) | Crown | Harmonic complexity, transcendence |

```typescript
function getVocalQualityScores(qualities: VocalQualities, richness: number): ChakraQualityScore[] {
  return [
    { chakra: "Root",         score: qualities.stability },
    { chakra: "Sacral",       score: qualities.dynamicRange },
    { chakra: "Solar Plexus", score: qualities.rmsEnergy },
    { chakra: "Heart",        score: Math.min(1, qualities.spectralSpread / 200) },
    { chakra: "Throat",       score: qualities.harmonicToNoise },
    { chakra: "Third Eye",    score: Math.min(1, qualities.spectralCentroid / 500) },
    { chakra: "Crown",        score: richness / 100 },
  ];
}
```

### Variable 4: Subharmonic & Resonance Depth (Weight: 15%)
Analyse the lower spectral region for subharmonic presence (energy below the fundamental) and resonance characteristics.

```typescript
function getResonanceDepth(
  frequencyData: Float32Array,
  fundamental: number,
  sampleRate: number,
  fftSize: number
): ChakraDepthScore[] {
  const binRes = sampleRate / fftSize;
  
  // Energy below fundamental (subharmonic presence) → Root & Sacral
  const subBins = Math.floor(fundamental / binRes);
  let subEnergy = 0;
  for (let i = 1; i < subBins; i++) {
    subEnergy += Math.pow(10, frequencyData[i] / 10);
  }
  
  // Energy above 2x fundamental (upper harmonic brightness) → Third Eye & Crown
  const upperStart = Math.floor((fundamental * 2) / binRes);
  const upperEnd = Math.ceil(600 / binRes);
  let upperEnergy = 0;
  for (let i = upperStart; i <= upperEnd; i++) {
    upperEnergy += Math.pow(10, frequencyData[i] / 10);
  }
  
  // Total energy for normalisation
  let totalEnergy = 0;
  for (let i = 1; i <= upperEnd; i++) {
    totalEnergy += Math.pow(10, frequencyData[i] / 10);
  }
  
  const subRatio = totalEnergy > 0 ? subEnergy / totalEnergy : 0;
  const upperRatio = totalEnergy > 0 ? upperEnergy / totalEnergy : 0;
  const midRatio = 1 - subRatio - upperRatio;
  
  return [
    { chakra: "Root",         score: Math.min(1, subRatio * 3) },
    { chakra: "Sacral",       score: Math.min(1, subRatio * 2) },
    { chakra: "Solar Plexus", score: Math.min(1, midRatio * 1.5) },
    { chakra: "Heart",        score: midRatio },
    { chakra: "Throat",       score: Math.min(1, (midRatio + upperRatio) / 2) },
    { chakra: "Third Eye",    score: Math.min(1, upperRatio * 2) },
    { chakra: "Crown",        score: Math.min(1, upperRatio * 3) },
  ];
}
```

---

## Composite Score Calculation

Combine all four variables with their weights:

```typescript
interface ChakraScore {
  name: string;
  color: string;
  score: number;       // 0-100 percentage
  label: string;       // "Strong", "Balanced", "Gentle", "Quiet"
  description: string; // Human-friendly insight
}

function calculateChakraScores(
  bandEnergy: ChakraBandEnergy[],
  harmonicRes: ChakraResonance[],
  vocalScores: ChakraQualityScore[],
  depthScores: ChakraDepthScore[],
): ChakraScore[] {
  const WEIGHTS = {
    spectralBand: 0.35,
    harmonicResonance: 0.25,
    vocalQuality: 0.25,
    resonanceDepth: 0.15,
  };
  
  const CHAKRAS = [
    { name: "Root", color: "#E24B4B" },
    { name: "Sacral", color: "#F0913A" },
    { name: "Solar Plexus", color: "#F5D547" },
    { name: "Heart", color: "#5ABF7B" },
    { name: "Throat", color: "#4FA8D6" },
    { name: "Third Eye", color: "#7B6DB5" },
    { name: "Crown", color: "#C77DBA" },
  ];
  
  return CHAKRAS.map((chakra, i) => {
    const raw = 
      bandEnergy[i].energy * WEIGHTS.spectralBand +
      harmonicRes[i].resonance * WEIGHTS.harmonicResonance +
      vocalScores[i].score * WEIGHTS.vocalQuality +
      depthScores[i].score * WEIGHTS.resonanceDepth;
    
    // Normalise to 0-100, with some scaling to make scores feel meaningful
    // (raw scores tend to cluster — spread them out)
    const score = Math.round(Math.min(100, raw * 150));
    
    return {
      name: chakra.name,
      color: chakra.color,
      score,
      label: score > 75 ? "Strong" : score > 50 ? "Balanced" : score > 30 ? "Gentle" : "Quiet",
      description: getChakraInsight(chakra.name, score),
    };
  });
}
```

### Score Labels & Meanings
- **Strong (75-100%):** This centre is very active and resonant in your voice
- **Balanced (50-75%):** This centre is present and flowing naturally  
- **Gentle (30-50%):** This centre is quieter — may benefit from focused attention
- **Quiet (0-30%):** This centre is resting — sound work here may be especially nourishing

---

## Vocal Quality Extraction

Add these analysis functions to the audio engine:

```typescript
// Spectral Centroid — the "brightness" of the voice
function getSpectralCentroid(frequencyData: Float32Array, sampleRate: number, fftSize: number): number {
  const binRes = sampleRate / fftSize;
  let weightedSum = 0;
  let totalMag = 0;
  
  for (let i = 1; i < frequencyData.length; i++) {
    const mag = Math.pow(10, frequencyData[i] / 20); // dB to linear magnitude
    const freq = i * binRes;
    weightedSum += mag * freq;
    totalMag += mag;
  }
  
  return totalMag > 0 ? weightedSum / totalMag : 0;
}

// Spectral Spread — how wide the energy is distributed
function getSpectralSpread(frequencyData: Float32Array, centroid: number, sampleRate: number, fftSize: number): number {
  const binRes = sampleRate / fftSize;
  let weightedSum = 0;
  let totalMag = 0;
  
  for (let i = 1; i < frequencyData.length; i++) {
    const mag = Math.pow(10, frequencyData[i] / 20);
    const freq = i * binRes;
    weightedSum += mag * Math.pow(freq - centroid, 2);
    totalMag += mag;
  }
  
  return totalMag > 0 ? Math.sqrt(weightedSum / totalMag) : 0;
}

// RMS Energy — overall loudness/projection (from time domain)
function getRMSEnergy(timeDomainData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    sum += timeDomainData[i] * timeDomainData[i];
  }
  return Math.sqrt(sum / timeDomainData.length);
}

// Harmonic-to-Noise Ratio — clarity vs breathiness
// Approximation: ratio of energy at harmonic peaks vs total energy
function getHarmonicToNoise(
  frequencyData: Float32Array, 
  fundamental: number, 
  sampleRate: number, 
  fftSize: number
): number {
  const binRes = sampleRate / fftSize;
  let harmonicEnergy = 0;
  let totalEnergy = 0;
  
  const maxBin = Math.min(frequencyData.length, Math.ceil(600 / binRes));
  
  for (let i = 1; i < maxBin; i++) {
    const power = Math.pow(10, frequencyData[i] / 10);
    totalEnergy += power;
    
    // Check if this bin is near a harmonic
    const freq = i * binRes;
    for (let h = 1; h <= 8; h++) {
      if (Math.abs(freq - fundamental * h) < binRes * 2) {
        harmonicEnergy += power;
        break;
      }
    }
  }
  
  return totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0;
}

// Dynamic Range — amplitude variation (track over recording)
function getDynamicRange(rmsHistory: number[]): number {
  if (rmsHistory.length < 10) return 0;
  const max = Math.max(...rmsHistory);
  const min = Math.min(...rmsHistory.filter(v => v > 0.01)); // Ignore silence
  if (max <= 0) return 0;
  return Math.min(1, (max - min) / max);
}
```

---

## Updated Data Types

Add to `src/lib/types.ts`:

```typescript
interface ChakraScore {
  name: string;
  color: string;
  score: number;       // 0-100
  label: string;       // "Strong" | "Balanced" | "Gentle" | "Quiet"
  description: string; // Human-friendly insight
}

interface VocalQualities {
  rmsEnergy: number;
  stability: number;
  spectralCentroid: number;
  spectralSpread: number;
  harmonicToNoise: number;
  dynamicRange: number;
}

// Update FrequencyProfile to include:
interface FrequencyProfile {
  // ... existing fields ...
  chakraScores: ChakraScore[];    // ALL 7 chakras with scores
  vocalQualities: VocalQualities;  // Raw vocal analysis data
  dominantChakra: ChakraScore;     // Highest scoring (replaces old single chakra)
}
```

---

## UI: Chakra Body Map Visualisation

### On the Result Screen, add a "Chakra Map" section:

A vertical body silhouette (simple, elegant SVG) with 7 glowing circles positioned at each chakra point. Each circle's size and opacity scales with the chakra score. Strongest chakras glow brightly, quiet ones are dim.

```
        ◯  Crown (top of head)
        ◯  Third Eye (forehead)
        ◯  Throat (throat)
        ◯  Heart (chest)
        ◯  Solar Plexus (upper abdomen)
        ◯  Sacral (lower abdomen)
        ◯  Root (base)
```

### Design Specs:
- Simple human silhouette outline (SVG, very minimal — just a head/torso outline or even just a vertical line with position markers)
- Each chakra point: coloured circle with the chakra's colour
- Circle radius: proportional to score (min 8px, max 24px)
- Opacity: 0.3 (quiet) to 1.0 (strong)
- Glow effect: box-shadow/filter with chakra colour, intensity proportional to score
- Score percentage shown next to each circle
- Label on hover/tap for mobile

### Alternative: Horizontal Bar Chart
If the body map is complex, a simpler alternative:

7 horizontal bars, one per chakra, coloured with chakra colours, width proportional to score. Label on left, percentage on right. Ordered Root (bottom) to Crown (top) to maintain the body metaphor.

```
Crown        ████████████████░░░░░  72%
Third Eye    ██████████░░░░░░░░░░░  45%
Throat       ████████████████████░  89%
Heart        ███████████████░░░░░░  68%
Solar Plexus ██████████████░░░░░░░  61%
Sacral       ████████░░░░░░░░░░░░░  38%
Root         ██████████████████░░░  82%
```

### Recommendation: Build BOTH
- Body map as the hero visual (beautiful, shareable, memorable)
- Bar chart below it as the detailed breakdown

---

## Updated Live Screen

During recording, show a **live mini chakra indicator** — 7 small dots in a vertical line on the side of the screen, each glowing in real-time as the audio analysis detects energy in each band. This gives immediate visual feedback that the scan is working across all centres.

---

## Updated Profile Card (Save as Image)

The shareable card should now include the chakra body map or bar chart as the centrepiece, replacing the single chakra badge. The card tells a richer story.

---

## Chakra Insight Descriptions

```typescript
function getChakraInsight(chakra: string, score: number): string {
  const insights: Record<string, Record<string, string>> = {
    "Root": {
      strong: "Your voice carries deep grounding energy — a strong foundation and sense of safety resonates through your tone.",
      balanced: "Your Root centre is present and stable — you have a natural sense of groundedness.",
      gentle: "Your Root energy is quieter — grounding work with low tones may help strengthen your foundation.",
      quiet: "Your Root centre is resting — deep, sustained bass tones could help reconnect you with your ground.",
    },
    "Sacral": {
      strong: "Your voice flows with creative, emotional energy — the Sacral centre is alive with expression and feeling.",
      balanced: "Your Sacral energy is flowing naturally — creativity and emotional expression are accessible to you.",
      gentle: "Your Sacral centre is quieter — gentle, rhythmic sounds may help awaken creativity and emotional flow.",
      quiet: "Your Sacral energy is resting — warm, flowing tones could help open this centre of feeling and creativity.",
    },
    "Solar Plexus": {
      strong: "Your voice projects with confidence and power — your Solar Plexus radiates strong personal energy.",
      balanced: "Your Solar Plexus is active — you carry a healthy sense of personal power and confidence.",
      gentle: "Your Solar Plexus is quieter — empowering, resonant tones may help strengthen your sense of personal power.",
      quiet: "Your Solar Plexus is resting — bright, energising sounds could help ignite your inner confidence and will.",
    },
    "Heart": {
      strong: "Your voice resonates with warmth and openness — the Heart centre shines with compassion and connection.",
      balanced: "Your Heart energy is flowing — love and compassion are naturally present in your expression.",
      gentle: "Your Heart centre is quieter — gentle, open tones may help expand your capacity for connection.",
      quiet: "Your Heart energy is resting — soft, harmonious sounds could help open this centre of love and compassion.",
    },
    "Throat": {
      strong: "Your voice is clear and expressive — the Throat centre is wide open, supporting authentic communication.",
      balanced: "Your Throat energy is flowing — self-expression and truth come naturally to your voice.",
      gentle: "Your Throat centre is quieter — humming and vocal toning may help free your authentic expression.",
      quiet: "Your Throat energy is resting — gentle vocal exercises and singing bowl work could help open your voice.",
    },
    "Third Eye": {
      strong: "Your voice carries bright, perceptive energy — the Third Eye is active with intuition and insight.",
      balanced: "Your Third Eye is present — intuition and inner vision are accessible in your current state.",
      gentle: "Your Third Eye is quieter — high, clear tones may help sharpen your intuition and inner clarity.",
      quiet: "Your Third Eye is resting — crystalline, bell-like sounds could help awaken your intuitive perception.",
    },
    "Crown": {
      strong: "Your voice reaches into expansive, transcendent frequencies — the Crown centre is radiantly open.",
      balanced: "Your Crown energy is present — a natural connection to something larger than yourself.",
      gentle: "Your Crown centre is quieter — ethereal, high-harmonic sounds may help expand your spiritual connection.",
      quiet: "Your Crown energy is resting — delicate overtone singing or crystal bowls could help open this transcendent centre.",
    },
  };
  
  const level = score > 75 ? "strong" : score > 50 ? "balanced" : score > 30 ? "gentle" : "quiet";
  return insights[chakra]?.[level] || "";
}
```

---

## Updated Email Format

The email should now include the full chakra scan:

```
✦ HARMONIC INTAKE — Your Frequency Profile
{date}

Hello,

Here are the insights from your vocal frequency analysis — a complete scan of your seven energy centres.

YOUR NATURAL TONE
Your voice naturally rests at {note} — a {range_description} tone.

YOUR ENERGY CENTRES

  ● Root — {score}% {label}
    {description}

  ● Sacral — {score}% {label}
    {description}

  ● Solar Plexus — {score}% {label}
    {description}

  ● Heart — {score}% {label}
    {description}

  ● Throat — {score}% {label}
    {description}

  ● Third Eye — {score}% {label}
    {description}

  ● Crown — {score}% {label}
    {description}

YOUR STRONGEST CENTRE
{dominant_chakra_name} — {dominant_description}

SESSION GUIDANCE
  ◆ Grounding tone: {note}
  ◆ Expansion tone: {fifth_note}
  ◆ Release tone: {third_note}

{instrument_suggestion}

—
With resonance,
Harmonic Intake
```

---

## Implementation Priority

1. Add vocal quality extraction functions to `src/lib/audio/`
2. Create `src/lib/audio/chakra-analysis.ts` with the multi-variable scoring
3. Update `src/lib/types.ts` with new interfaces
4. Update `src/hooks/useAudioAnalysis.ts` to calculate all variables during recording
5. Update `src/lib/profile/build-profile.ts` to include chakraScores
6. Create `src/components/viz/ChakraBodyMap.tsx` (SVG body map)
7. Create `src/components/viz/ChakraBarChart.tsx` (horizontal bars)
8. Add live chakra dots to `LiveScreen.tsx`
9. Update `ResultScreen.tsx` with full chakra map section
10. Update email and card share components with full scan data
11. Update `src/lib/profile/humanize.ts` with chakra insight text

---

## Important Notes

- The composite scoring should feel **meaningful and varied** — avoid all chakras clustering around 50%. Use scaling and normalisation to create differentiation.
- The **dominant chakra** (highest score) still drives the accent colour throughout the UI.
- On the live screen, the chakra dots should update in real-time — this gives powerful visual feedback that the scan is "reading" all centres.
- The body map is the **hero visual** for the shareable card — it's what makes people want to share their results.
- Keep Hz values small and subtle. Lead with human language always.
