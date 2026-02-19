# AUDIO ENGINE V2 — Harmonic Intake

## Why This Update

The current audio engine produces near-identical results for different voices (e.g. male vs female) because it relies almost entirely on mapping the fundamental frequency to a chakra band. The spectral normalisation then washes out the differences. This update replaces the engine with a scientifically-grounded voice biomarker system based on published acoustic analysis research.

**Sources:** Teixeira et al. (2013) — Jitter/Shimmer/HNR algorithms; Aalto University Speech Processing textbook — jitter/shimmer formulas; Frontiers in Psychology — voice stress analysis via F0, jitter, shimmer, HNR; PMC/Sonde Health — vocal biomarkers for mental fitness; ScienceDirect — fundamental frequency norms (male ~125 Hz, female ~210 Hz).

**Principle:** Measure what actually differs between individuals and emotional states, then map those real differences onto the chakra/wellness framework.

---

## Voice Biomarkers to Extract

The engine must extract these 10 parameters from the audio signal during the 15-second recording:

### 1. Fundamental Frequency (F0)
- **What:** The base pitch of the voice in Hz
- **Method:** Autocorrelation with parabolic interpolation (already implemented)
- **Norms:** Male ~85-155 Hz, Female ~165-255 Hz
- **Tracks over recording:** Mean F0, min F0, max F0, F0 standard deviation

### 2. Jitter (Frequency Perturbation)
- **What:** Cycle-to-cycle variation in pitch period length — how irregular the vocal fold vibration is
- **Why it matters:** Reflects vocal fold tension, nervous system state, emotional stress. Lower jitter = more relaxed, steady vocal fold control. Higher jitter = tension, agitation, or vocal pathology.
- **Normal range:** 0.2% – 1.0% (relative jitter). Above 1.04% may indicate pathology.
- **Formula (Relative Jitter):**

```
Jitter(%) = (1/(N-1) * Σ|Ti - Ti+1|) / (1/N * ΣTi) * 100
```

Where Ti = period length of the i-th cycle, N = number of detected periods.

**Implementation:**

```typescript
function calculateJitter(periods: number[]): { absolute: number; relative: number; rap: number } {
  const N = periods.length;
  if (N < 3) return { absolute: 0, relative: 0, rap: 0 };

  // Mean period
  const meanPeriod = periods.reduce((a, b) => a + b, 0) / N;

  // Absolute jitter: average absolute difference between consecutive periods
  let sumDiff = 0;
  for (let i = 0; i < N - 1; i++) {
    sumDiff += Math.abs(periods[i] - periods[i + 1]);
  }
  const absolute = sumDiff / (N - 1);

  // Relative jitter: absolute jitter / mean period * 100
  const relative = meanPeriod > 0 ? (absolute / meanPeriod) * 100 : 0;

  // RAP (Relative Average Perturbation): 3-point moving average
  let rapSum = 0;
  for (let i = 1; i < N - 1; i++) {
    const localAvg = (periods[i - 1] + periods[i] + periods[i + 1]) / 3;
    rapSum += Math.abs(periods[i] - localAvg);
  }
  const rap = meanPeriod > 0 ? (rapSum / (N - 2)) / meanPeriod * 100 : 0;

  return { absolute, relative, rap };
}
```

### 3. Shimmer (Amplitude Perturbation)
- **What:** Cycle-to-cycle variation in peak amplitude — how irregular the loudness is
- **Why it matters:** Reflects breath control, vocal fold closure quality, and emotional state. Higher shimmer = breathier, less controlled voice. Lower shimmer = clear, steady projection.
- **Normal range:** 0.1 – 0.35 dB (Shimmer dB). Above 0.35 dB may indicate vocal strain.
- **Formula (Shimmer dB):**

```
Shimmer(dB) = 1/(N-1) * Σ|20 * log10(Ai+1 / Ai)|
```

Where Ai = peak amplitude of the i-th cycle.

**Implementation:**

```typescript
function calculateShimmer(amplitudes: number[]): { db: number; relative: number; apq3: number } {
  const N = amplitudes.length;
  if (N < 3) return { db: 0, relative: 0, apq3: 0 };

  const meanAmp = amplitudes.reduce((a, b) => a + b, 0) / N;

  // Shimmer (dB): average absolute log difference between consecutive amplitudes
  let sumLogDiff = 0;
  for (let i = 0; i < N - 1; i++) {
    if (amplitudes[i] > 0 && amplitudes[i + 1] > 0) {
      sumLogDiff += Math.abs(20 * Math.log10(amplitudes[i + 1] / amplitudes[i]));
    }
  }
  const db = sumLogDiff / (N - 1);

  // Relative shimmer: average absolute amplitude difference / mean amplitude
  let sumAbsDiff = 0;
  for (let i = 0; i < N - 1; i++) {
    sumAbsDiff += Math.abs(amplitudes[i] - amplitudes[i + 1]);
  }
  const relative = meanAmp > 0 ? (sumAbsDiff / (N - 1)) / meanAmp * 100 : 0;

  // APQ3: 3-point amplitude perturbation quotient
  let apq3Sum = 0;
  for (let i = 1; i < N - 1; i++) {
    const localAvg = (amplitudes[i - 1] + amplitudes[i] + amplitudes[i + 1]) / 3;
    apq3Sum += Math.abs(amplitudes[i] - localAvg);
  }
  const apq3 = meanAmp > 0 ? (apq3Sum / (N - 2)) / meanAmp * 100 : 0;

  return { db, relative, apq3 };
}
```

### 4. Harmonic-to-Noise Ratio (HNR)
- **What:** Ratio of periodic (harmonic) energy to aperiodic (noise) energy in the voice
- **Why it matters:** Measures voice clarity. Higher HNR = clear, resonant, healthy voice. Lower HNR = breathy, strained, or hoarse. Women typically have higher HNR than men. Stress can reduce HNR.
- **Normal range:** 20-40 dB (healthy), below 20 dB may indicate pathology or strain
- **Method:** Compare harmonic energy at fundamental and overtone bins vs total energy in the FFT

**Implementation:**

```typescript
function calculateHNR(
  frequencyData: Float32Array,
  fundamental: number,
  sampleRate: number,
  fftSize: number
): number {
  if (fundamental <= 0) return 0;

  const binRes = sampleRate / fftSize;
  const maxBin = Math.min(frequencyData.length, Math.ceil(4000 / binRes));

  let harmonicPower = 0;
  let totalPower = 0;

  // Sum total power across relevant range
  for (let i = 1; i < maxBin; i++) {
    const power = Math.pow(10, frequencyData[i] / 10);
    totalPower += power;

    // Check if this bin is near a harmonic (within ±1 bin)
    const freq = i * binRes;
    for (let h = 1; h <= 12; h++) {
      const harmonicFreq = fundamental * h;
      if (harmonicFreq > 4000) break;
      if (Math.abs(freq - harmonicFreq) <= binRes) {
        harmonicPower += power;
        break;
      }
    }
  }

  const noisePower = totalPower - harmonicPower;
  if (noisePower <= 0) return 40; // Cap at 40 dB
  return Math.min(40, 10 * Math.log10(harmonicPower / noisePower));
}
```

### 5. Formant Frequencies (F1, F2, F3)
- **What:** Resonant frequencies of the vocal tract — the shapes created by throat, mouth, and nasal cavities
- **Why it matters:** Formants are THE primary differentiator between individuals. Male vocal tracts are ~17cm (lower formants), female ~14cm (higher formants). Formants tell you about physical body resonance, openness, and vocal tract tension.
- **Typical ranges:**
  - F1: Male 270-730 Hz, Female 310-850 Hz (openness of jaw/throat)
  - F2: Male 840-2290 Hz, Female 900-2790 Hz (tongue position/oral cavity)
  - F3: Male 1690-3010 Hz, Female 1960-3310 Hz (lip rounding/nasal)
- **Method:** Peak-picking from the spectral envelope (LPC or smoothed FFT)

**Implementation (simplified — spectral peak finding):**

```typescript
function extractFormants(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
  fundamental: number
): { f1: number; f2: number; f3: number } {
  const binRes = sampleRate / fftSize;

  // Create smoothed spectral envelope (remove fine harmonic structure)
  // Use a moving average window wider than the fundamental period
  const windowBins = Math.max(5, Math.round(fundamental / binRes) * 2);
  const smoothed = new Float32Array(frequencyData.length);

  for (let i = 0; i < frequencyData.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - windowBins); j <= Math.min(frequencyData.length - 1, i + windowBins); j++) {
      sum += frequencyData[j];
      count++;
    }
    smoothed[i] = sum / count;
  }

  // Find peaks in the smoothed envelope within formant ranges
  const peaks: { freq: number; amp: number }[] = [];
  const startBin = Math.ceil(200 / binRes);
  const endBin = Math.min(smoothed.length - 1, Math.floor(4000 / binRes));

  for (let i = startBin + 1; i < endBin; i++) {
    if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1]) {
      peaks.push({ freq: i * binRes, amp: smoothed[i] });
    }
  }

  // Sort by amplitude (strongest peaks are most likely formants)
  peaks.sort((a, b) => b.amp - a.amp);

  // Extract F1, F2, F3 from peaks in expected ranges
  const f1 = findPeakInRange(peaks, 200, 900) || 500;
  const f2 = findPeakInRange(peaks, 800, 2800) || 1500;
  const f3 = findPeakInRange(peaks, 1500, 3500) || 2500;

  return { f1, f2, f3 };
}

function findPeakInRange(peaks: { freq: number; amp: number }[], low: number, high: number): number {
  for (const p of peaks) {
    if (p.freq >= low && p.freq <= high) return p.freq;
  }
  return 0;
}
```

### 6. Spectral Centroid
- **What:** The "centre of mass" of the frequency spectrum — perceived brightness
- **Why it matters:** Higher centroid = brighter, more energised voice. Lower = warmer, heavier. Shifts with emotional state.
- Already specified in CHAKRA_SCAN_UPDATE.md

### 7. Spectral Slope / Tilt
- **What:** The rate at which energy drops off from low to high frequencies
- **Why it matters:** Steep slope = more energy in lows (relaxed, grounded). Flat/gentle slope = energy spread across highs (alert, activated, stressed)

```typescript
function getSpectralSlope(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number
): number {
  const binRes = sampleRate / fftSize;
  const startBin = Math.ceil(60 / binRes);
  const endBin = Math.min(frequencyData.length, Math.ceil(4000 / binRes));

  // Linear regression of dB values vs frequency
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  let n = 0;

  for (let i = startBin; i < endBin; i++) {
    const freq = i * binRes;
    const db = frequencyData[i];
    sumX += freq;
    sumY += db;
    sumXY += freq * db;
    sumX2 += freq * freq;
    n++;
  }

  // Slope of linear regression (dB per Hz)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope; // Negative = steep rolloff (warm), closer to 0 = flat (bright)
}
```

### 8. RMS Energy (Loudness)
- **What:** Overall signal power — how loud/projected the voice is
- **Why it matters:** Louder = more confident, activated Solar Plexus. Quieter = more withdrawn or internalised.
- Already in the time-domain buffer

### 9. Dynamic Range
- **What:** Variation in loudness over the recording
- **Why it matters:** More variation = emotional expressiveness (Sacral). Less = monotone, controlled (Root stability or emotional flatness)

### 10. Pitch Range (F0 Range)
- **What:** Difference between highest and lowest detected pitch, in semitones
- **Why it matters:** Wide range = expressive, lively voice. Narrow = monotone. Research shows reduced pitch range correlates with depression and low energy states.

```typescript
function getPitchRange(f0History: number[]): { rangeSemitones: number; rangeHz: number } {
  const valid = f0History.filter(f => f > 50 && f < 600);
  if (valid.length < 10) return { rangeSemitones: 0, rangeHz: 0 };

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const rangeHz = max - min;
  const rangeSemitones = 12 * Math.log2(max / min);

  return { rangeSemitones, rangeHz };
}
```

---

## Period & Amplitude Extraction (Critical for Jitter/Shimmer)

Jitter and shimmer require detecting individual glottal cycles in the time-domain signal. This is the most important new capability the engine needs.

```typescript
interface GlottalCycle {
  periodSamples: number;  // Length in samples
  periodSeconds: number;  // Length in seconds
  peakAmplitude: number;  // Maximum absolute amplitude in this cycle
}

function extractGlottalCycles(
  timeDomainData: Float32Array,
  sampleRate: number,
  fundamental: number
): GlottalCycle[] {
  if (fundamental <= 0) return [];

  const expectedPeriod = sampleRate / fundamental;
  const minPeriod = expectedPeriod * 0.7;
  const maxPeriod = expectedPeriod * 1.4;

  const cycles: GlottalCycle[] = [];

  // Find positive-going zero crossings
  const crossings: number[] = [];
  for (let i = 1; i < timeDomainData.length; i++) {
    if (timeDomainData[i - 1] <= 0 && timeDomainData[i] > 0) {
      crossings.push(i);
    }
  }

  // Extract cycles between zero crossings that match expected period
  for (let i = 0; i < crossings.length - 1; i++) {
    const periodSamples = crossings[i + 1] - crossings[i];

    if (periodSamples >= minPeriod && periodSamples <= maxPeriod) {
      // Find peak amplitude in this cycle
      let peak = 0;
      for (let j = crossings[i]; j < crossings[i + 1]; j++) {
        peak = Math.max(peak, Math.abs(timeDomainData[j]));
      }

      cycles.push({
        periodSamples,
        periodSeconds: periodSamples / sampleRate,
        peakAmplitude: peak,
      });
    }
  }

  return cycles;
}
```

---

## Updated Recording Loop

The main analysis loop must now collect data for ALL biomarkers on each frame:

```typescript
// On each requestAnimationFrame tick:

// 1. Get time-domain and frequency-domain data
analyser.getFloatTimeDomainData(timeDomainBuffer);
analyser.getFloatFrequencyData(frequencyBuffer);

// 2. Detect fundamental (existing autocorrelation)
const f0 = autoCorrelate(timeDomainBuffer, sampleRate);

if (f0 > 50 && f0 < 600) {
  // 3. Extract glottal cycles for jitter/shimmer
  const cycles = extractGlottalCycles(timeDomainBuffer, sampleRate, f0);
  allCycles.push(...cycles);

  // 4. Calculate frame-level metrics
  const rms = getRMSEnergy(timeDomainBuffer);
  rmsHistory.push(rms);
  f0History.push(f0);

  // 5. Spectral analysis (for live display)
  const centroid = getSpectralCentroid(frequencyBuffer, sampleRate, fftSize);
  const hnr = calculateHNR(frequencyBuffer, f0, sampleRate, fftSize);

  // 6. Update live display with current frame data
  updateLiveDisplay({ f0, rms, centroid, hnr });
}
```

---

## Profile Generation (After Recording Ends)

When the 15-second recording completes, calculate the full biomarker set:

```typescript
function buildVoiceProfile(
  f0History: number[],
  allCycles: GlottalCycle[],
  rmsHistory: number[],
  frequencyData: Float32Array,  // Last frame's FFT data (or averaged)
  sampleRate: number,
  fftSize: number
): VoiceProfile {
  const meanF0 = average(f0History);
  const f0StdDev = stdDev(f0History);

  // Extract periods and amplitudes from cycles
  const periods = allCycles.map(c => c.periodSeconds);
  const amplitudes = allCycles.map(c => c.peakAmplitude);

  // Core biomarkers
  const jitter = calculateJitter(periods);
  const shimmer = calculateShimmer(amplitudes);
  const hnr = calculateHNR(frequencyData, meanF0, sampleRate, fftSize);
  const formants = extractFormants(frequencyData, sampleRate, fftSize, meanF0);
  const spectralCentroid = getSpectralCentroid(frequencyData, sampleRate, fftSize);
  const spectralSlope = getSpectralSlope(frequencyData, sampleRate, fftSize);
  const rmsEnergy = average(rmsHistory);
  const dynamicRange = getDynamicRange(rmsHistory);
  const pitchRange = getPitchRange(f0History);

  return {
    fundamental: { mean: meanF0, stdDev: f0StdDev, min: Math.min(...f0History), max: Math.max(...f0History) },
    jitter,
    shimmer,
    hnr,
    formants,
    spectralCentroid,
    spectralSlope,
    rmsEnergy,
    dynamicRange,
    pitchRange,
    cycleCount: allCycles.length,
  };
}
```

---

## Revised Chakra Scoring

Now that we have real, differentiated biomarkers, map them to chakras with meaningful weighting:

```typescript
function calculateChakraScores(profile: VoiceProfile): ChakraScore[] {
  // Normalise each biomarker to 0-1 range based on known human ranges
  const n = {
    // Stability metrics (inverted — lower jitter = more stable)
    jitterNorm: clamp01(1 - (profile.jitter.relative / 2)),        // 0% = 1.0, 2% = 0.0
    shimmerNorm: clamp01(1 - (profile.shimmer.db / 0.8)),           // 0dB = 1.0, 0.8dB = 0.0
    hnrNorm: clamp01((profile.hnr - 5) / 30),                       // 5dB = 0.0, 35dB = 1.0

    // Energy & projection
    rmsNorm: clamp01(profile.rmsEnergy / 0.15),                     // Scale to typical hum range
    dynamicNorm: clamp01(profile.dynamicRange),

    // Spectral character
    centroidNorm: clamp01((profile.spectralCentroid - 100) / 800),   // 100Hz = 0, 900Hz = 1
    slopeNorm: clamp01(1 - Math.abs(profile.spectralSlope) / 0.05), // Flat = 1, steep = 0

    // Formant presence (higher formants = more upper chakra energy)
    f1Norm: clamp01((profile.formants.f1 - 200) / 700),
    f2Norm: clamp01((profile.formants.f2 - 800) / 2000),
    f3Norm: clamp01((profile.formants.f3 - 1500) / 2000),

    // Expressiveness
    pitchRangeNorm: clamp01(profile.pitchRange.rangeSemitones / 12), // 0 semitones = 0, 12 = 1

    // Fundamental frequency position (where in the spectrum the voice sits)
    f0Low: clamp01(1 - (profile.fundamental.mean - 60) / 200),      // Lower F0 = higher score
    f0Mid: 1 - Math.abs(profile.fundamental.mean - 250) / 200,      // Peak at ~250Hz
    f0High: clamp01((profile.fundamental.mean - 200) / 400),        // Higher F0 = higher score
  };

  return [
    {
      name: "Root",
      color: "#E24B4B",
      // Root = grounding, stability, deep tone
      // High stability (low jitter) + low fundamental + strong RMS = grounded
      score: weightedScore([
        [n.jitterNorm, 0.25],      // Vocal stability → grounding
        [n.shimmerNorm, 0.15],     // Amplitude steadiness
        [n.f0Low, 0.25],           // Deep tone presence
        [n.rmsNorm, 0.20],         // Physical presence/projection
        [n.hnrNorm, 0.15],         // Clear, not breathy
      ]),
    },
    {
      name: "Sacral",
      color: "#F0913A",
      // Sacral = flow, emotion, expressiveness
      // Dynamic range + pitch variation + moderate shimmer = emotional flow
      score: weightedScore([
        [n.dynamicNorm, 0.30],     // Amplitude expressiveness
        [n.pitchRangeNorm, 0.25],  // Pitch expressiveness
        [n.f1Norm, 0.15],          // Open jaw/throat (F1)
        [1 - n.jitterNorm, 0.15],  // Some natural variation (not rigid)
        [n.rmsNorm, 0.15],         // Not withdrawn
      ]),
    },
    {
      name: "Solar Plexus",
      color: "#F5D547",
      // Solar Plexus = confidence, power, projection
      // High RMS + high HNR + low shimmer = confident projection
      score: weightedScore([
        [n.rmsNorm, 0.30],         // Loudness/projection
        [n.hnrNorm, 0.25],         // Voice clarity (not breathy)
        [n.shimmerNorm, 0.20],     // Steady amplitude
        [n.jitterNorm, 0.15],      // Controlled pitch
        [n.f0Mid, 0.10],           // Mid-range presence
      ]),
    },
    {
      name: "Heart",
      color: "#5ABF7B",
      // Heart = openness, warmth, expansiveness
      // Wide spectral spread + moderate centroid + warm slope + formant openness
      score: weightedScore([
        [n.slopeNorm, 0.20],       // Balanced spectrum (not too steep/flat)
        [n.f1Norm, 0.20],          // Open throat (F1 height = jaw openness)
        [n.hnrNorm, 0.20],         // Harmonic richness
        [n.dynamicNorm, 0.15],     // Emotional range
        [n.pitchRangeNorm, 0.15],  // Vocal warmth & expression
        [n.shimmerNorm, 0.10],     // Steadiness
      ]),
    },
    {
      name: "Throat",
      color: "#4FA8D6",
      // Throat = expression, clarity, truth
      // High HNR + clear formants + good projection = clear expression
      score: weightedScore([
        [n.hnrNorm, 0.30],         // Voice clarity (primary indicator)
        [n.jitterNorm, 0.20],      // Pitch control
        [n.shimmerNorm, 0.15],     // Amplitude control
        [n.f2Norm, 0.15],          // Oral cavity resonance (articulation)
        [n.rmsNorm, 0.10],         // Projection
        [n.centroidNorm, 0.10],    // Brightness
      ]),
    },
    {
      name: "Third Eye",
      color: "#7B6DB5",
      // Third Eye = brightness, perception, upper frequencies
      // High centroid + high F3 + clear harmonics = bright, perceptive
      score: weightedScore([
        [n.centroidNorm, 0.30],    // Spectral brightness
        [n.f3Norm, 0.20],          // Upper formant presence
        [n.f0High, 0.15],          // Higher fundamental
        [n.hnrNorm, 0.15],         // Harmonic clarity
        [n.slopeNorm, 0.10],      // Gentle slope (energy in highs)
        [n.jitterNorm, 0.10],      // Precision/control
      ]),
    },
    {
      name: "Crown",
      color: "#C77DBA",
      // Crown = transcendence, overtone richness, harmonic complexity
      // Rich overtones + high HNR + wide spectral presence = transcendent quality
      score: weightedScore([
        [n.hnrNorm, 0.25],         // Harmonic richness
        [n.centroidNorm, 0.20],    // Upper frequency energy
        [n.f3Norm, 0.15],          // Highest formant
        [n.slopeNorm, 0.15],      // Gentle slope (energy spreads high)
        [n.f0High, 0.15],          // Higher fundamental
        [n.pitchRangeNorm, 0.10],  // Expansive range
      ]),
    },
  ];
}

function weightedScore(weights: [number, number][]): number {
  let sum = 0;
  for (const [value, weight] of weights) {
    sum += clamp01(value) * weight;
  }
  // Scale to 0-100 and add differentiation spread
  const raw = sum * 100;
  // Apply sigmoid-like curve to spread scores away from 50%
  return Math.round(clamp(sigmoidSpread(raw, 50, 25), 5, 98));
}

function sigmoidSpread(value: number, center: number, spread: number): number {
  // Push scores away from center to create more differentiation
  const offset = value - center;
  const stretched = center + offset * 1.4;
  return clamp(stretched, 0, 100);
}

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }
function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
```

---

## Why This Will Differentiate Male vs Female (and Everyone)

With the current engine, the only real differentiator is F0 band energy. The new engine has:

| Biomarker | Male (typical) | Female (typical) | Effect on Profile |
|-----------|---------------|-----------------|-------------------|
| F0 | 85-155 Hz | 165-255 Hz | Completely different chakra F0 mapping |
| F1 | 270-730 Hz | 310-850 Hz | Female higher → more Heart/Throat |
| F2 | 840-2290 Hz | 900-2790 Hz | Female higher → more Third Eye |
| F3 | 1690-3010 Hz | 1960-3310 Hz | Female higher → more Crown |
| HNR | ~20-28 dB | ~22-32 dB | Female typically clearer → Throat boost |
| Spectral Centroid | Lower | Higher | Female brighter → Third Eye/Crown |
| Spectral Slope | Steeper | Gentler | Male warmer → Root/Sacral |
| Jitter | ~0.5-1.0% | ~0.4-0.8% | Individual variation → Root stability |
| Shimmer | Similar ranges | Similar ranges | Individual variation → Solar Plexus |

Two people humming will now get **meaningfully different profiles** because formants, spectral shape, HNR, jitter, and shimmer genuinely vary between individuals.

---

## Updated Type Definitions

```typescript
interface VoiceProfile {
  fundamental: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
  };
  jitter: {
    absolute: number;    // seconds
    relative: number;    // percentage
    rap: number;          // relative average perturbation %
  };
  shimmer: {
    db: number;           // dB
    relative: number;     // percentage
    apq3: number;         // 3-point amplitude perturbation %
  };
  hnr: number;            // dB
  formants: {
    f1: number;           // Hz
    f2: number;           // Hz
    f3: number;           // Hz
  };
  spectralCentroid: number; // Hz
  spectralSlope: number;    // dB/Hz
  rmsEnergy: number;        // 0-1
  dynamicRange: number;     // 0-1
  pitchRange: {
    rangeSemitones: number;
    rangeHz: number;
  };
  cycleCount: number;
}

// FrequencyProfile now includes:
interface FrequencyProfile {
  voiceProfile: VoiceProfile;
  chakraScores: ChakraScore[];
  dominantChakra: ChakraScore;
  noteInfo: NoteInfo;
  timestamp: Date;
}
```

---

## File Structure for New Engine

```
src/lib/audio/
├── pitch-detection.ts       # Existing autocorrelation (keep as is)
├── glottal-cycles.ts        # NEW: Extract individual vocal fold cycles
├── jitter.ts                # NEW: Jitter calculation (relative, absolute, RAP)
├── shimmer.ts               # NEW: Shimmer calculation (dB, relative, APQ3)
├── hnr.ts                   # NEW: Harmonic-to-Noise Ratio
├── formants.ts              # NEW: Formant frequency extraction (F1, F2, F3)
├── spectral-features.ts     # NEW: Centroid, slope, spread
├── vocal-qualities.ts       # NEW: RMS, dynamic range, pitch range
├── overtone-analysis.ts     # Existing (keep, but secondary to new metrics)
├── spectrum.ts              # Existing (keep for visual display)
└── recorder.ts              # Update to collect all new data during recording

src/lib/scoring/
├── chakra-scoring.ts        # NEW: Multi-biomarker chakra composite scoring
├── normalisation.ts         # NEW: Biomarker normalisation to 0-1 ranges
└── humanize.ts              # Existing: Human-friendly descriptions
```

---

## Human-Friendly Biomarker Translations

These should be used in the UI and email, NEVER show raw jitter/shimmer values to the user:

| Biomarker | Raw | Human Translation |
|-----------|-----|-------------------|
| Jitter 0.3% | Low | "Your voice is very steady — a sign of inner calm and groundedness" |
| Jitter 0.8% | Moderate | "Your voice carries natural movement — openness and emotional presence" |
| Jitter 1.5% | High | "Your voice has noticeable fluidity — this can reflect a period of change or processing" |
| Shimmer 0.15 dB | Low | "Your voice projects with consistent, confident energy" |
| Shimmer 0.4 dB | Moderate | "Your voice has a gentle, natural breath quality" |
| Shimmer 0.7 dB | High | "Your voice carries a soft, diffused quality — breathwork may help strengthen projection" |
| HNR 30 dB | High | "Your voice is clear and richly harmonic — a naturally resonant quality" |
| HNR 18 dB | Low | "Your voice has a softer, more diffused quality — singing bowls can help brighten your resonance" |
| F0 Range 8 semitones | Wide | "Your voice is expressive and dynamic — emotionally open and communicative" |
| F0 Range 2 semitones | Narrow | "Your voice is focused and centred — steady and meditative" |

---

## Disclaimer

Add a small footer on the result screen:

> "This analysis explores the acoustic qualities of your voice through a wellness lens. It is not a medical, diagnostic, or clinical assessment. For voice health concerns, please consult a qualified healthcare professional."

This protects you and sets appropriate expectations for practitioners and clients.

---

## Implementation Notes for Claude Code

1. **Start with glottal cycle extraction** — this is the foundation for jitter and shimmer. Get this right first.
2. **Test with actual voice input** — use `npm run dev` and test with your own voice. Male and female voices MUST produce visibly different profiles.
3. **The formant extraction is approximate** — the simplified peak-picking approach won't be as accurate as LPC analysis, but it's good enough for a wellness tool and runs efficiently in the browser.
4. **Normalisation ranges matter** — the clamp ranges in the chakra scoring are based on published norms. If scores cluster too tightly, adjust the normalisation ranges to create more spread.
5. **Keep the existing overtone analysis** — it's still useful for the mandala visualisation and the overtone chart. But it should no longer be the primary driver of chakra scores.
6. **The live display** should show the new biomarkers in real-time where possible (jitter and shimmer need accumulated cycles, so they become more accurate as the recording progresses).
7. **Audio engine files should have zero UI concerns** — pure TypeScript functions with no React dependencies. This makes them testable and reusable.
8. **Write unit tests** for jitter, shimmer, and HNR calculations using known synthetic signals.
