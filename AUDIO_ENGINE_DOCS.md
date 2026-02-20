# Harmonic Intake — Audio Engine Technical Documentation

> Generated from source code in `src/lib/audio/`, `src/lib/scoring/`, `src/lib/music/`, `src/lib/profile/`, and `src/hooks/`.

---

## 1. Architecture Overview

### File Structure

```
src/
├── lib/
│   ├── audio/                          # Raw audio capture & DSP
│   │   ├── recorder.ts                 # Mic stream + AudioContext + AnalyserNode
│   │   ├── pitch-detection.ts          # Autocorrelation F0 detection
│   │   ├── glottal-cycles.ts           # Vocal fold cycle extraction (zero-crossing)
│   │   ├── jitter.ts                   # Cycle-to-cycle period perturbation
│   │   ├── shimmer.ts                  # Cycle-to-cycle amplitude perturbation
│   │   ├── hnr.ts                      # Harmonic-to-Noise Ratio
│   │   ├── formants.ts                 # Formant extraction (F1/F2/F3)
│   │   ├── spectral-features.ts        # Spectral centroid + spectral slope
│   │   ├── overtone-analysis.ts        # Harmonic overtone extraction (H2–H8)
│   │   ├── spectrum.ts                 # 64-band spectrum for visualisation
│   │   └── vocal-qualities.ts          # RMS energy helper
│   ├── scoring/                        # Biomarker → score mapping
│   │   ├── chakra-scoring.ts           # Multi-biomarker weighted chakra scores
│   │   └── normalisation.ts            # clamp01, sigmoidSpread, weightedScore
│   ├── music/                          # Musical theory helpers
│   │   ├── note-mapping.ts             # Hz → note/octave/cents (A440 ET)
│   │   ├── chakra-mapping.ts           # Hz → chakra (frequency range table)
│   │   └── intervals.ts               # Perfect 5th (×1.5), minor 3rd (×1.2)
│   ├── profile/
│   │   ├── build-profile.ts            # Aggregates recording → FrequencyProfile
│   │   └── recommendations.ts          # Labels, instrument suggestions
│   └── types.ts                        # All TypeScript interfaces
├── hooks/
│   ├── useAudioAnalysis.ts             # Main recording loop + state machine
│   └── useTonePlayer.ts               # Playable tones + binaural beats
```

### Data Flow

```
┌──────────────┐
│  Microphone   │
│ getUserMedia  │
│ {audio: {...}}│
└──────┬───────┘
       │ MediaStream
       ▼
┌──────────────┐
│ AudioContext  │  (browser default sample rate, typically 44100 or 48000)
│   .create     │
│ MediaStream   │
│   Source()    │
└──────┬───────┘
       │ AudioNode
       ▼
┌──────────────────────┐
│    AnalyserNode       │  fftSize=4096, smoothingTimeConstant=0.5
│                       │
│  getFloatTimeDomain   │──► pitch-detection.ts ──► F0 (Hz)
│  Data() [4096 float]  │──► glottal-cycles.ts ──► jitter.ts, shimmer.ts
│                       │──► vocal-qualities.ts ──► RMS energy
│                       │
│  getFloatFrequency    │──► overtone-analysis.ts ──► overtones H2-H8
│  Data() [2048 float]  │──► hnr.ts ──► HNR (dB)
│         (dB values)   │──► formants.ts ──► F1, F2, F3
│                       │──► spectral-features.ts ──► centroid, slope, flatness
│                       │──► spectrum.ts ──► 64-band viz data
│                       │──► chakra-scoring.ts (live) ──► 7 band energies
└──────────────────────┘
       │
       │  (15 seconds of frames accumulated via requestAnimationFrame)
       ▼
┌──────────────────────┐
│   build-profile.ts    │  Aggregates all frame data:
│                       │  - Average F0 readings → fundamental
│                       │  - All glottal cycles → jitter, shimmer
│                       │  - Average FFT snapshots → HNR, formants, spectral features
│                       │  - Average overtone snapshots → richness
│                       │  - RMS history → dynamic range
│                       │  - F0 history → pitch range, stability
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  chakra-scoring.ts    │  10 normalised biomarkers → 7 weighted chakra scores
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  FrequencyProfile     │  Final output: fundamental, note, chakra, stability,
│                       │  overtones, richness, voiceProfile, chakraScores,
│                       │  dominantChakra, session guidance (5th, m3)
└──────────────────────┘
```

---

## 2. Audio Capture

**Source:** `src/lib/audio/recorder.ts`

### Microphone Access

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: { ideal: 44100 },
  },
});
```

- All browser audio processing is **explicitly disabled** to preserve the raw vocal signal for analysis:
  - `autoGainControl: false` — prevents dynamic volume adjustment that would corrupt shimmer, RMS, and dynamic range
  - `noiseSuppression: false` — prevents frequency filtering that would corrupt formant detection and spectral slope
  - `echoCancellation: false` — prevents signal alteration that would corrupt HNR and overtone measurements
- Requests 44100 Hz sample rate for consistency (falls back to device default if unavailable)

### AudioContext Configuration

```ts
const ctx = new AudioContext();
const source = ctx.createMediaStreamSource(stream);
const analyser = ctx.createAnalyser();

analyser.fftSize = 4096;
analyser.smoothingTimeConstant = 0.5;

source.connect(analyser);
```

| Parameter | Value | Effect |
|-----------|-------|--------|
| `fftSize` | 4096 | Frequency resolution = sampleRate/4096 ≈ 10.77 Hz at 44100 Hz. Time window ≈ 93ms. |
| `smoothingTimeConstant` | 0.5 | Moderate temporal smoothing on frequency data (50% previous + 50% current frame). Balances responsiveness with stability for HNR, formant, and spectral analysis. |
| `minDecibels` | -100 (default) | Not explicitly set. |
| `maxDecibels` | -30 (default) | Not explicitly set. |

### Data Extraction

Two pre-allocated buffers are reused every frame:

```ts
const timeDomainBuffer = new Float32Array(analyser.fftSize);       // 4096 samples
const frequencyBuffer = new Float32Array(analyser.frequencyBinCount); // 2048 bins
```

- `getFloatTimeDomainData()` → normalised PCM samples in range [-1, 1]
- `getFloatFrequencyData()` → power spectrum in dB (typically -100 to 0)

### Recording Loop

**Source:** `src/hooks/useAudioAnalysis.ts`

- Duration: **15 seconds** (constant `RECORDING_DURATION = 15`)
- Loop driven by `requestAnimationFrame` (≈60fps on most devices)
- Each frame calls all analysis functions and pushes results to accumulator arrays
- On completion, `buildProfile()` aggregates everything into a `FrequencyProfile`
- A 1.8-second "analysing" animation plays before showing results

---

## 3. Pitch Detection

**Source:** `src/lib/audio/pitch-detection.ts`

### Algorithm: Autocorrelation with Parabolic Interpolation

The algorithm follows these steps:

#### Step 1: Noise Gate

```ts
const NOISE_THRESHOLD = 0.01;
let rms = 0;
for (let i = 0; i < n; i++) rms += buffer[i] * buffer[i];
rms = Math.sqrt(rms / n);
if (rms < NOISE_THRESHOLD) return -1;
```

- Computes RMS amplitude of the 4096-sample buffer
- If RMS < 0.01 (very quiet), returns -1 (silence/no voice)
- This is the "voice present" vs "no voice" detection

#### Step 2: Normalisation

```ts
const normalized = new Float32Array(n);
for (let i = 0; i < n; i++) normalized[i] = buffer[i] / rms;
```

- Divides all samples by RMS to normalise amplitude
- This makes the autocorrelation independent of volume

#### Step 3: Autocorrelation Computation

```ts
const minLag = Math.floor(sampleRate / MAX_FREQ);  // sampleRate/600 ≈ 73 samples
const maxLag = Math.ceil(sampleRate / MIN_FREQ);    // sampleRate/50  ≈ 882 samples
const searchEnd = Math.min(maxLag, Math.floor(n / 2));

for (let lag = minLag; lag <= searchEnd; lag++) {
  let sum = 0;
  for (let i = 0; i < n - lag; i++) sum += normalized[i] * normalized[i + lag];
  autocorrelation[lag] = sum;
}
```

- Only computes lags corresponding to 50–600 Hz (human vocal range)
- At 44100 Hz: searches lags 73–882
- Standard unnormalised autocorrelation: `R(lag) = Σ x[i] × x[i + lag]`

#### Step 4: Peak Finding (First-Dip-Then-Peak)

```ts
let foundDip = false;
for (let lag = minLag; lag <= searchEnd; lag++) {
  if (!foundDip) {
    if (lag > minLag && autocorrelation[lag] > autocorrelation[lag - 1]) {
      foundDip = true;
    }
    continue;
  }
  if (autocorrelation[lag] > bestVal) {
    bestVal = autocorrelation[lag];
    bestLag = lag;
  }
}
```

- Skips past the initial zero-lag peak by looking for the first dip (where autocorrelation starts increasing again after decreasing)
- Then takes the highest peak after that dip as the fundamental period
- This avoids locking onto the zero-lag maximum

#### Step 5: Confidence Check

```ts
const confidence = bestVal / n;  // peak autocorrelation relative to zero-lag energy
if (confidence < 0.5) return -1;
```

- Zero-lag autocorrelation of the normalised buffer equals `n` (buffer length), so `confidence = bestVal / n` gives a 0–1 score
- A threshold of **0.5** filters out most weak or ambiguous pitch detections
- This prevents octave errors and spurious detections from silently corrupting downstream biomarkers (jitter, shimmer, chakra scoring)

#### Step 6: Parabolic Interpolation

```ts
const prev = autocorrelation[bestLag - 1] || 0;
const curr = autocorrelation[bestLag];
const next = autocorrelation[bestLag + 1] || 0;
const denominator = 2 * (2 * curr - prev - next);
let interpolatedLag = bestLag;
if (denominator !== 0) {
  interpolatedLag = bestLag + (prev - next) / denominator;
}
```

- Fits a parabola through the peak and its neighbours
- Achieves sub-sample accuracy (e.g. lag = 367.4 instead of 367)
- Significantly improves precision for lower frequencies

#### Step 7: Conversion & Range Check

```ts
const freq = sampleRate / interpolatedLag;
if (freq < 50 || freq > 600) return -1;
```

- Valid frequency range: **50–600 Hz**
- Covers typical male (85–180 Hz) and female (165–255 Hz) fundamental range, plus higher singing voices

### Pitch Confidence & Octave Rejection

The algorithm uses a multi-layer filtering approach:

1. **Noise gate:** RMS < 0.01 → reject (no voice)
2. **Autocorrelation dip check:** Must find a rising edge after initial decay
3. **Confidence threshold:** `bestVal / n >= 0.5` required (Step 5)
4. **Frequency range:** Must be 50–600 Hz
5. **Spectral flatness gate** (in `useAudioAnalysis.ts`): Rejects frames where spectral flatness > 0.5 (noise-like signals with no clear pitch)
6. **Octave error rejection** (in `useAudioAnalysis.ts`): Maintains a running median of the last 10 valid F0 readings. If a new detection is ~2× or ~0.5× the median, it's rejected as a likely octave error:

```ts
if (hz > 0 && recentF0s.length >= 5) {
  const ratio = hz / median;
  if (ratio > 1.8 && ratio < 2.2) hz = -1; // octave-up error
  if (ratio > 0.4 && ratio < 0.6) hz = -1; // octave-down error
}
```

When pitch detection returns -1, the `useAudioAnalysis` hook **holds the last valid values** for display, so the UI never flashes empty.

---

## 4. Biomarker Calculations

### 4.1 Fundamental Frequency (F0)

**Calculated in:** `build-profile.ts` → `buildVoiceProfile()`

- **What it measures:** The average pitch of the voice across the 15-second recording
- **Algorithm:** Mean of all valid (> 0) pitch readings from `detectPitch()`
- **Input:** Array of per-frame F0 values from `readingsRef`
- **Output:**
  - `mean`: Hz (rounded to 1 decimal)
  - `stdDev`: Hz
  - `min` / `max`: Hz (range of valid readings)
- **Additional:** Invalid frames (pitch = -1) are filtered out before averaging

```ts
const validReadings = readings.filter((r) => r > 0);
const meanF0 = validReadings.reduce((a, b) => a + b, 0) / validReadings.length;
```

### 4.2 Jitter (Frequency Perturbation)

**Source:** `src/lib/audio/jitter.ts`

- **What it measures:** Cycle-to-cycle irregularity in vocal fold vibration period. Lower jitter = relaxed, steady voice. Higher jitter = tension or pathology.
- **Input:** Array of period durations in seconds from `extractGlottalCycles()`
- **Minimum data:** 3 cycles required; returns zeros otherwise
- **Normal range:** 0.2–1.0% (relative); above 1.04% may indicate pathology
- **Output:**
  - `absolute`: Mean of |T[i] - T[i+1]| across consecutive cycles (seconds)
  - `relative`: `(absolute / meanPeriod) × 100` (percentage)
  - `rap`: Relative Average Perturbation — uses 3-point sliding window (percentage)

**Absolute jitter formula:**

```
jitter_abs = (1/(N-1)) × Σ|T[i] - T[i+1]|  for i = 0..N-2
```

**RAP formula:**

```
RAP = (1/(N-2)) × Σ|T[i] - avg(T[i-1], T[i], T[i+1])| / meanPeriod × 100
```

### 4.3 Shimmer (Amplitude Perturbation)

**Source:** `src/lib/audio/shimmer.ts`

- **What it measures:** Cycle-to-cycle variation in peak loudness. Higher shimmer = breathier, less controlled. Lower shimmer = clear, steady projection.
- **Input:** Array of peak amplitudes (one per glottal cycle) from `extractGlottalCycles()`
- **Minimum data:** 3 cycles required
- **Normal range:** 0.1–0.35 dB; above 0.35 dB may indicate vocal strain
- **Output:**
  - `db`: Mean |20×log10(A[i+1]/A[i])| across consecutive cycles (dB)
  - `relative`: Mean |A[i]-A[i+1]| / meanAmplitude × 100 (percentage)
  - `apq3`: 3-point Amplitude Perturbation Quotient (percentage)

**Shimmer (dB) formula:**

```
shimmer_dB = (1/(N-1)) × Σ|20×log10(A[i+1] / A[i])|
```

### 4.4 Glottal Cycle Extraction

**Source:** `src/lib/audio/glottal-cycles.ts`

Both jitter and shimmer depend on glottal cycle detection:

1. **Find positive-going zero crossings** in the time-domain signal (where sample goes from ≤0 to >0)
2. **Validate period length:** Each crossing pair must have a period within **±30%** of the expected fundamental period:
   - `minPeriod = expectedPeriod × 0.7`
   - `maxPeriod = expectedPeriod × 1.4`
3. **Extract peak amplitude** within each valid cycle (max absolute value between crossings)

```ts
for (let i = 1; i < timeDomainData.length; i++) {
  if (timeDomainData[i - 1] <= 0 && timeDomainData[i] > 0) {
    crossings.push(i);
  }
}
```

- Cycles are accumulated across ALL frames during the 15-second recording
- By the end, typically hundreds of cycles are available

### 4.5 Harmonic-to-Noise Ratio (HNR)

**Source:** `src/lib/audio/hnr.ts`

- **What it measures:** Ratio of periodic (harmonic) energy to aperiodic (noise) energy. Higher HNR = clear, resonant voice. Lower HNR = breathy or strained.
- **Input:** Averaged FFT frequency data (dB), fundamental frequency, sample rate, FFT size
- **Algorithm:**
  1. Scan all FFT bins from bin 1 up to 4000 Hz
  2. Convert each bin's dB value to linear power: `power = 10^(dB/10)`
  3. For each bin, check if its frequency is near any harmonic (h×F0, h=1..12) with **scaled tolerance** — tolerance increases with harmonic number to account for natural inharmonicity at higher overtones
  4. Sum harmonic power vs total power
  5. `HNR = 10 × log10(harmonicPower / noisePower)`
- **Output:** HNR in dB, capped at **50 dB** (raised from 40 to accommodate trained singers)
- **Normal range:** 20–40 dB (healthy); below 20 dB may indicate pathology or strain; trained singers can exceed 40 dB

```ts
for (let i = 1; i < maxBin; i++) {
  const power = Math.pow(10, frequencyData[i] / 10);
  totalPower += power;
  const freq = i * binRes;
  for (let h = 1; h <= 12; h++) {
    const harmonicFreq = fundamental * h;
    if (harmonicFreq > 4000) break;
    const tolerance = Math.max(1, Math.round(h * 0.5)); // ±1 bin for H1-2, ±2 for H3-4, etc.
    if (Math.abs(freq - harmonicFreq) <= binRes * tolerance) {
      harmonicPower += power;
      break;
    }
  }
}
```

### 4.6 Formants (F1, F2, F3)

**Source:** `src/lib/audio/formants.ts`

- **What it measures:** Resonant frequencies of the vocal tract — determined by throat, mouth, and nasal cavity shapes. F1 reflects jaw/throat openness, F2 reflects tongue position, F3 reflects lip rounding.
- **Algorithm:** Simplified spectral peak picking (not LPC):
  1. Create a smoothed spectral envelope using a **moving average** with window width = `2 × (F0 / binResolution)` bins (minimum 5 bins). This removes fine harmonic structure.
  2. Find all local peaks in the smoothed envelope between **200–4000 Hz**
  3. Sort peaks by amplitude (descending)
  4. Pick the strongest peak in each expected range **with overlap prevention** — each subsequent formant must be well above the previous one:
     - F1: 200–900 Hz (default: 500 Hz)
     - F2: max(800, F1+200) – 2800 Hz (default: 1500 Hz)
     - F3: max(1500, F2+300) – 3500 Hz (default: 2500 Hz)
- **Output:** Three frequencies in Hz (with hardcoded defaults if no peaks found)
- **Overlap prevention:** Ensures F2 > F1 + 200 Hz and F3 > F2 + 300 Hz, preventing impossible configurations like F2 < F1
- **Typical ranges:** Male F1 270–730 Hz, Female F1 310–850 Hz

```ts
const windowBins = Math.max(5, Math.round(fundamental / binRes) * 2);
// ... smoothing loop ...
const f1 = findPeakInRange(peaks, 200, 900) || 500;
const f2Floor = Math.max(800, f1 + 200);
const f2 = findPeakInRange(peaks, f2Floor, 2800) || 1500;
const f3Floor = Math.max(1500, f2 + 300);
const f3 = findPeakInRange(peaks, f3Floor, 3500) || 2500;
```

### 4.7 Spectral Centroid

**Source:** `src/lib/audio/spectral-features.ts` → `getSpectralCentroid()`

- **What it measures:** The "centre of mass" of the frequency spectrum — perceived brightness. Higher centroid = brighter, more energised. Lower = warmer, heavier.
- **Algorithm:** Weighted mean of frequencies by their linear magnitude:

```
centroid = Σ(mag[i] × freq[i]) / Σ(mag[i])
where mag[i] = 10^(dB[i] / 20)
```

- **Input:** Full FFT frequency data (dB), starting from bin 1
- **Output:** Frequency in Hz (integer, rounded in build-profile)

### 4.8 Spectral Slope

**Source:** `src/lib/audio/spectral-features.ts` → `getSpectralSlope()`

- **What it measures:** Rate of energy drop-off from low to high frequencies. Steep negative slope = warm, relaxed. Flat/gentle slope = bright, activated, possibly stressed.
- **Algorithm:** Linear regression (least squares) of dB values vs frequency over **60–4000 Hz**:

```
slope = (n×Σ(f×dB) - Σf×ΣdB) / (n×Σf² - (Σf)²)
```

- Bins with -Infinity dB (silent) are skipped to avoid NaN
- **Output:** dB/Hz (small number, typically -0.01 to 0)
- **Normalisation in profile:** Rounded to 4 decimal places

### 4.9 Spectral Flatness

**Source:** `src/lib/audio/spectral-features.ts` → `getSpectralFlatness()`

- **What it measures:** How "noise-like" vs "tonal" the signal is. Used as a noise gate to reject non-voice frames.
- **Algorithm:** Ratio of geometric mean to arithmetic mean of linear magnitudes across 60–4000 Hz (Wiener entropy):

```
flatness = geometricMean(magnitudes) / arithmeticMean(magnitudes)
```

- White noise → flatness ≈ 1 (all frequencies equal energy)
- Tonal signal → flatness ≈ 0 (energy concentrated at harmonics)
- **Threshold:** Frames with flatness > 0.5 are rejected in `useAudioAnalysis.ts` before pitch is accepted
- **Purpose:** Filters out steady background noise (HVAC, fans) that passes the RMS noise gate but has no pitch

### 4.10 RMS Energy

**Source:** `src/lib/audio/vocal-qualities.ts` → `getRMSEnergy()`

- **What it measures:** Overall loudness/projection of the voice
- **Algorithm:** Root mean square of time-domain samples:

```
RMS = sqrt(Σ(x[i]²) / N)
```

- **Input:** Float32Array from `getFloatTimeDomainData()` (4096 samples per frame)
- **Per-frame output:** Raw RMS value (0 to ~0.5 for typical speech)
- **Profile output:** The per-frame values are accumulated in `rmsHistory`, then averaged: `rmsEnergy = min(1, mean(rmsHistory))`, clamped to 0–1. The raw mean is preserved without additional scaling — normalisation happens in chakra scoring.

### 4.11 Dynamic Range

**Calculated in:** `build-profile.ts` → `getDynamicRange()`

- **What it measures:** Variation in volume across the recording — how much the voice fluctuates between loud and quiet
- **Algorithm:**

```ts
const valid = rmsHistory.filter((v) => v > 0.01);  // Ignore silence
const max = Math.max(...valid);
const min = Math.min(...valid);
dynamicRange = min(1, (max - min) / max);
```

- **Input:** Array of per-frame RMS values
- **Minimum data:** 10 valid frames required (returns 0 otherwise)
- **Output:** 0–1 (0 = monotone, 1 = very dynamic)

### 4.12 Pitch Range

**Calculated in:** `build-profile.ts` → `getPitchRange()`

- **What it measures:** How much the pitch varied during the recording
- **Algorithm:**

```ts
const valid = f0History.filter((f) => f > 50 && f < 600);
const rangeSemitones = 12 × log2(max / min);
const rangeHz = max - min;
```

- **Input:** All valid F0 readings from the recording
- **Minimum data:** 10 valid readings required
- **Output:**
  - `rangeSemitones`: Musical interval spanned (0 = perfectly steady, 12 = one octave)
  - `rangeHz`: Raw frequency difference

### 4.13 Vocal Stability

**Source:** `build-profile.ts` → `calculateStability()`

- **What it measures:** How steadily the client held their pitch
- **Algorithm:** Based on coefficient of variation (CV):

```ts
const cv = stddev / mean;  // of valid F0 readings
stability = clamp(1 - cv × 5, 0, 1);
```

- **Multiplier:** ×5 provides a forgiving scale — CV of 5% → 0.75 (good), CV of 10% → 0.5 (moderate), CV of 20% → 0.0 (very unstable)
- **Input:** Array of per-frame F0 values (filtered to > 0)
- **Output:** 0–1 (0 = very unstable, 1 = perfectly steady)
- **Live calculation:** During recording, uses a rolling window of last 30 readings (`STABILITY_WINDOW = 30`)
- **Labels:** ≥0.85 "Locked", ≥0.6 "Steady", ≥0.3 "Variable", <0.3 "Unstable"

### 4.14 Overtone Extraction

**Source:** `src/lib/audio/overtone-analysis.ts`

- **What it measures:** Relative strength of harmonics 2–8 above the fundamental
- **Algorithm:**
  1. Find the FFT bin at the fundamental frequency
  2. For each harmonic h (2–8), look up the bin at `F0 × h`
  3. Compute dB relative to fundamental: `relativeDb = bin[h] - bin[F0]`
  4. Convert to linear amplitude: `amplitude = clamp(10^(relativeDb/20), 0, 1)`
- **Input:** Per-frame FFT data; averaged across all frames in the final profile
- **Output per harmonic:** frequency (Hz), amplitude (0–1), dB (relative to fundamental)
- **Richness:** Average of all 7 overtone amplitudes × 100 → 0–100%

---

## 5. Chakra Scoring

**Source:** `src/lib/scoring/chakra-scoring.ts`

### Two Scoring Systems

#### 1. Live Scoring (during recording) — Spectral Band Energy

**Function:** `calculateLiveChakraScores()`

Simple and fast — used per-frame in the animation loop:

| Chakra | Frequency Band |
|--------|---------------|
| Root | 60–130 Hz |
| Sacral | 130–175 Hz |
| Solar Plexus | 175–225 Hz |
| Heart | 225–280 Hz |
| Throat | 280–350 Hz |
| Third Eye | 350–450 Hz |
| Crown | 450–600 Hz |

Algorithm:
1. Convert FFT bins in 60–600 Hz to linear power: `10^(dB/10)`
2. Sum power in each chakra's frequency band
3. Score = `min(100, (bandEnergy / totalEnergy) × 300)`

The `× 300` multiplier inflates the percentage so that even a band with ~33% of the total energy maxes out. This is because energy is spread across all 7 bands.

#### 2. Final Scoring (after recording) — Multi-Biomarker Weighted Composites

**Function:** `calculateChakraScores()`

Each of the 10 biomarkers is normalised to 0–1:

| Normalised Metric | Formula | Range |
|---|---|---|
| `jitterNorm` | `1 - jitter% / 2` | 0% jitter → 1.0, 2% → 0.0 |
| `shimmerNorm` | `1 - shimmer_dB / 0.8` | 0 dB → 1.0, 0.8 dB → 0.0 |
| `hnrNorm` | `(HNR - 5) / 40` | 5 dB → 0.0, 45 dB → 1.0 |
| `rmsNorm` | `(RMS - 0.01) / 0.12` | 0.01 → 0.0, 0.13 → 1.0 |
| `dynamicNorm` | raw (already 0–1) | |
| `centroidNorm` | `(centroid - 100) / 800` | 100 Hz → 0.0, 900 Hz → 1.0 |
| `slopeNorm` | `1 - |slope| / 0.05` | flat → 1.0, steep → 0.0 |
| `f1Norm` | `(F1 - 200) / 700` | 200 Hz → 0.0, 900 Hz → 1.0 |
| `f2Norm` | `(F2 - 800) / 2000` | 800 Hz → 0.0, 2800 Hz → 1.0 |
| `f3Norm` | `(F3 - 1500) / 2000` | 1500 Hz → 0.0, 3500 Hz → 1.0 |
| `pitchRangeNorm` | `semitones / 12` | 0 → 0.0, 12 → 1.0 |
| `f0Low` | `1 - (F0 - 60) / 200` | Lower F0 → higher |
| `f0Mid` | `1 - |F0 - 250| / 200` | Peaks at ~250 Hz |
| `f0High` | `(F0 - 200) / 400` | Higher F0 → higher |

### Chakra Weighting Profiles

Each chakra has a unique combination of biomarker weights that reflects its energetic quality:

**Root** (grounding, stability, deep tone):
| Biomarker | Weight |
|-----------|--------|
| jitterNorm (stability) | 0.25 |
| f0Low (deep tone) | 0.25 |
| rmsNorm (physical presence) | 0.20 |
| shimmerNorm (steadiness) | 0.15 |
| hnrNorm (clarity) | 0.15 |

**Sacral** (flow, emotion, expressiveness):
| Biomarker | Weight |
|-----------|--------|
| dynamicNorm (amplitude variation) | 0.30 |
| pitchRangeNorm (pitch variation) | 0.25 |
| f1Norm (open jaw/throat) | 0.20 |
| slopeNorm (spectral warmth) | 0.10 |
| rmsNorm (not withdrawn) | 0.15 |

**Solar Plexus** (confidence, power, projection):
| Biomarker | Weight |
|-----------|--------|
| rmsNorm (loudness) | 0.30 |
| hnrNorm (clarity) | 0.25 |
| shimmerNorm (steady amplitude) | 0.20 |
| jitterNorm (controlled pitch) | 0.15 |
| f0Mid (mid-range presence) | 0.10 |

**Heart** (openness, warmth, expansiveness):
| Biomarker | Weight |
|-----------|--------|
| slopeNorm (balanced spectrum) | 0.20 |
| f1Norm (open throat) | 0.20 |
| hnrNorm (harmonic richness) | 0.20 |
| dynamicNorm (emotional range) | 0.15 |
| pitchRangeNorm (warmth/expression) | 0.15 |
| shimmerNorm (steadiness) | 0.10 |

**Throat** (expression, clarity, truth):
| Biomarker | Weight |
|-----------|--------|
| hnrNorm (voice clarity — primary) | 0.30 |
| jitterNorm (pitch control) | 0.20 |
| shimmerNorm (amplitude control) | 0.15 |
| f2Norm (articulation) | 0.15 |
| rmsNorm (projection) | 0.10 |
| centroidNorm (brightness) | 0.10 |

**Third Eye** (brightness, perception, upper frequencies):
| Biomarker | Weight |
|-----------|--------|
| centroidNorm (spectral brightness) | 0.30 |
| f3Norm (upper formant) | 0.20 |
| f0High (higher fundamental) | 0.15 |
| hnrNorm (clarity) | 0.15 |
| slopeNorm (gentle slope) | 0.10 |
| jitterNorm (precision) | 0.10 |

**Crown** (transcendence, overtone richness, harmonic complexity):
| Biomarker | Weight |
|-----------|--------|
| hnrNorm (harmonic richness) | 0.25 |
| centroidNorm (upper frequency energy) | 0.20 |
| f3Norm (highest formant) | 0.15 |
| slopeNorm (gentle slope) | 0.15 |
| f0High (higher fundamental) | 0.15 |
| pitchRangeNorm (expansive range) | 0.10 |

### Score Calculation Pipeline

**Source:** `src/lib/scoring/normalisation.ts`

```ts
function weightedScore(weights: [number, number][]): number {
  let sum = 0;
  for (const [value, weight] of weights) {
    sum += clamp01(value) * weight;
  }
  const raw = sum * 100;                      // Scale to 0-100
  return Math.round(clamp(sigmoidSpread(raw, 50), 5, 98));
}
```

1. Weighted sum of normalised biomarkers (each clamped to 0–1)
2. Scale to 0–100
3. **Sigmoid spread:** Pushes scores away from the centre (50) by a factor of 1.4× to increase differentiation between chakras:
   ```ts
   sigmoidSpread(value, 50) = 50 + (value - 50) × 1.4
   ```
4. Final clamp to **5–98** (never shows 0% or 100%)
5. Round to integer

### Dominant Chakra

The chakra with the highest score becomes the dominant chakra:

```ts
const dominantChakra = chakraScores.reduce((a, b) => (b.score > a.score ? b : a));
```

### Labels and Insights

Each chakra score receives a tier label:
- \> 75: "Strong"
- \> 50: "Balanced"
- \> 30: "Gentle"
- ≤ 30: "Quiet"

Each tier for each chakra has a unique human-readable description (see `getChakraInsight()` — 28 unique strings total).

---

## 6. Session Guidance

### Grounding / Expansion / Release Tones

**Source:** `src/lib/music/intervals.ts`, `src/hooks/useTonePlayer.ts`

Three therapeutic tones are generated from the detected fundamental:

| Tone | Calculation | Musical Interval | Purpose |
|------|-------------|-----------------|---------|
| Grounding | `F0` | Unison | Matches natural resonance |
| Expansion | `F0 × 1.5` | Perfect 5th | Opens and uplifts energy |
| Release | `F0 × 1.2` | Minor 3rd | Supports emotional softening |

Each tone is played for **10 seconds** via Web Audio API using a sine wave oscillator with 1-second fade-in and 1-second fade-out:

```ts
gain.gain.setValueAtTime(0, now);
gain.gain.linearRampToValueAtTime(0.3, now + FADE_IN);  // 1s fade in to 0.3 volume
// ...
gain.gain.linearRampToValueAtTime(0, fadeStart + FADE_OUT); // 1s fade out
```

### Binaural Beat

**Source:** `src/hooks/useTonePlayer.ts`

- Two sine wave oscillators panned hard left and hard right
- Left ear: `F0` Hz
- Right ear: `F0 + 7.83` Hz
- The **7.83 Hz** offset is the Schumann Resonance (Earth's electromagnetic pulse)
- The brain perceives a 7.83 Hz "beat" between the two tones
- Duration: **30 seconds**
- Volume: 0.25 per channel (lower than single tones)

```ts
const BINAURAL_OFFSET = 7.83;
leftOsc.frequency.setValueAtTime(frequency, now);
rightOsc.frequency.setValueAtTime(frequency + BINAURAL_OFFSET, now);
leftPan.pan.setValueAtTime(-1, now);  // Hard left
rightPan.pan.setValueAtTime(1, now);   // Hard right
```

### Instrument Recommendations

**Source:** `src/lib/profile/recommendations.ts`

Based solely on overtone richness:

```ts
if (richness > 50) {
  return 'Rich overtone voice — warm, sustained tones. Monochord and singing bowls.';
}
return 'Thinner profile — complement with harmonically rich instruments. Gongs and didgeridoo.';
```

### Note Mapping

**Source:** `src/lib/music/note-mapping.ts`

Uses **A4 = 440 Hz equal temperament**:

```ts
const semitones = 12 × log2(hz / 440);
const midiNote = round(semitones) + 69;
const cents = round((semitones - round(semitones)) × 100);
```

- Cents range: -50 to +50 (deviation from nearest equal-temperament pitch)

### Chakra Frequency Mapping

**Source:** `src/lib/music/chakra-mapping.ts`

| Chakra | Traditional Note | Traditional Freq | Detection Range |
|--------|-----------------|-------------------|----------------|
| Root | C | 256 Hz | 60–130 Hz |
| Sacral | D | 288 Hz | 130–175 Hz |
| Solar Plexus | E | 320 Hz | 175–225 Hz |
| Heart | F | 341 Hz | 225–280 Hz |
| Throat | G | 384 Hz | 280–350 Hz |
| Third Eye | A | 426 Hz | 350–450 Hz |
| Crown | B | 480 Hz | 450–600 Hz |

- Below 60 Hz → defaults to Root
- Above 600 Hz → defaults to Crown
- Boundary frequencies are exclusive on the upper end (`hz >= low && hz < high`)

---

## 7. Known Limitations and Concerns

### Pitch Detection

- **Single-pitch assumption:** Only detects the strongest fundamental — will struggle with polyphonic sounds or strong background music.
- **No pre-emphasis filter:** High-frequency content may be underweighted in the autocorrelation, potentially making detection less accurate for higher voices.
- **Octave rejection requires history:** The median-based octave rejection needs 5 valid readings before it activates. The first few frames are unprotected.

### Glottal Cycle Detection

- **Zero-crossing method is simplified:** Real glottal pulses are not perfectly symmetrical. Zero crossings may not correspond exactly to glottal opening/closing events.
- **±30% tolerance is hardcoded:** The `minPeriod = 0.7 × expected` and `maxPeriod = 1.4 × expected` values are reasonable but not tuned to specific voice types.
- **Dependent on F0 accuracy:** If pitch detection gives a wrong F0, the expected period is wrong, and valid cycles may be rejected.

### Formant Extraction

- **Not LPC:** The moving-average smoothing + peak picking method is a simplification. True formant analysis typically uses Linear Predictive Coding (LPC), which models the vocal tract transfer function.
- **Hardcoded defaults:** If no peaks are found, F1=500, F2=1500, F3=2500 are returned. These defaults are used in chakra scoring and could skew results if formant detection consistently fails.
- **Smoothing window depends on F0:** If F0 is wrong, the smoothing window is wrong, and formant peaks may not be properly resolved.

### HNR Calculation

- **Uses averaged FFT data:** The smoothingTimeConstant on the AnalyserNode (0.5), plus averaging across frames, may smooth out both harmonic and noise components, potentially inflating HNR slightly.

### Spectral Features

- **Centroid uses magnitude (10^(dB/20)):** This is correct for amplitude spectrum, but the FFT data from `getFloatFrequencyData()` is power spectrum in dB. Using `10^(dB/20)` converts to amplitude, not power. This doesn't affect relative comparison but differs from some textbook definitions that use power weighting.
- **Spectral slope is dB/Hz:** The values are very small (order of -0.005). The normalisation in chakra scoring assumes `|slope| / 0.05` is a reasonable range, but this hasn't been validated across many voices.

### RMS Energy Normalisation

- **Device-dependent:** Raw RMS depends on microphone gain, distance, and hardware. With `autoGainControl: false`, values are more consistent but vary more between devices/distances.
- **Normalisation range:** `rmsNorm = (RMS - 0.01) / 0.12` assumes typical speaking voice RMS of 0.02–0.13 with AGC disabled. Voices much louder or quieter may saturate at 0 or 1.

### Chakra Scoring

- **No empirical validation:** The biomarker-to-chakra weight mappings are based on physiological reasoning, not validated against any clinical dataset.
- **Sigmoid spread creates artificial differentiation:** The `× 1.4` offset from center (50) means small differences in raw scores are amplified. A voice with all biomarkers at exactly 0.5 would produce all chakra scores near 50, then the spread would push them apart based on weight distributions alone.

### Browser Compatibility

- **Audio constraint support:** While `echoCancellation`, `noiseSuppression`, and `autoGainControl` are set to `false`, some older mobile browsers may not honour all constraints. On such devices, measurements may still be affected by browser processing.
- **AudioContext sample rate:** Requested as `{ ideal: 44100 }` but the actual rate varies by device (44100 on most, 48000 on some). All calculations correctly use the runtime sample rate, so this is handled.
- **Safari iOS:** The AudioContext must be created after a user gesture. The app handles this by only starting recording after the user clicks "Begin Analysis."

### Edge Cases

- **Very low voices (< 80 Hz):** The autocorrelation search extends down to 50 Hz (lag ≈ 882 samples at 44100 Hz), which approaches half the 4096 FFT window. Detection accuracy degrades.
- **Very high voices (> 400 Hz):** The minimum lag (sampleRate/600 ≈ 73 samples) provides reasonable resolution, but formant extraction may struggle to separate F0 harmonics from F1.
- **Background noise:** The RMS noise gate (0.01) combined with spectral flatness gate (> 0.5) rejects most non-tonal noise, but unusual noise patterns with partial tonality could still pass through.
- **Short recordings:** If the user ends early (e.g. 3 seconds), there may be too few valid readings for reliable statistics. Stability requires at least 2 valid readings; dynamic range and pitch range require 10.
- **No voice detected:** If the entire recording produces RMS < 0.01, all pitch readings are -1. `meanF0` becomes 0, and most biomarkers fall back to defaults or zeros.

---

## Appendix: Type Definitions

### VoiceProfile (10 biomarkers + metadata)

```ts
interface VoiceProfile {
  fundamental: { mean: number; stdDev: number; min: number; max: number };
  jitter: { absolute: number; relative: number; rap: number };
  shimmer: { db: number; relative: number; apq3: number };
  hnr: number;
  formants: { f1: number; f2: number; f3: number };
  spectralCentroid: number;
  spectralSlope: number;
  rmsEnergy: number;
  dynamicRange: number;
  pitchRange: { rangeSemitones: number; rangeHz: number };
  cycleCount: number;
}
```

### FrequencyProfile (final output)

```ts
interface FrequencyProfile {
  fundamental: number;
  noteInfo: NoteInfo;
  chakra: ChakraInfo;
  stability: number;
  overtones: Overtone[];
  richness: number;
  fifth: IntervalInfo;
  third: IntervalInfo;
  timestamp: Date;
  chakraScores: ChakraScore[];
  voiceProfile: VoiceProfile;
  dominantChakra: ChakraScore;
  frozenWaveform: Float32Array | null;
}
```
