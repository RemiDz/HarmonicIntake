# AUDIO ENGINE — Round 2 Fixes (from second review)

## Read first

These are 4 additional fixes identified in a second-pass review of the audio engine. They address silent correctness bugs, performance issues, and missing confidence signals. Implement all 4 in order.

---

## Fix 1: Audit and document all dB-to-linear conversions

**Problem:** The codebase uses both `10^(dB/10)` (power) and `10^(dB/20)` (amplitude) in different places. Both can be correct depending on context, but if the wrong formula is used in the wrong place, it silently distorts results without crashing.

**Action:**
1. Search every file in `src/lib/audio/` for `Math.pow(10,` and `10 **` — find every dB conversion
2. For each one, verify:
   - If computing **energy/power ratios** (HNR, band energies, live chakra scoring): must use `10^(dB/10)`
   - If computing **amplitude/magnitude weights** (spectral centroid, spectral slope weighting): must use `10^(dB/20)`
3. Add a comment above each conversion explaining the choice, e.g.:
   ```ts
   // Convert dB to linear power (10^(dB/10)) — used for energy ratio comparison
   const power = Math.pow(10, frequencyData[i] / 10);
   ```
4. If you find any mismatches, fix them
5. Report what you found before moving on

---

## Fix 2: Reduce pitch detection CPU load

**Problem:** The autocorrelation runs ~810 lag iterations × 4096 multiplications per frame at ~60fps via requestAnimationFrame. That's ~200M multiply-add operations per second. On mid-range mobile devices this causes:
- Frame drops and UI stutter during recording
- Device-dependent analysis quality (slower phones process fewer frames)
- GC pressure from `new Float32Array(n)` allocated every frame

**Fix in `pitch-detection.ts`:**
1. Move the normalised buffer allocation OUTSIDE the function — declare it once at module scope and reuse:
   ```ts
   // Module-level reusable buffer (allocated once)
   let normalizedBuffer: Float32Array | null = null;
   
   export function detectPitch(buffer: Float32Array, sampleRate: number): number {
     if (!normalizedBuffer || normalizedBuffer.length !== buffer.length) {
       normalizedBuffer = new Float32Array(buffer.length);
     }
     // Use normalizedBuffer instead of creating new Float32Array(n) every frame
     for (let i = 0; i < buffer.length; i++) {
       normalizedBuffer[i] = buffer[i] / rms;
     }
     // ... rest of algorithm uses normalizedBuffer
   }
   ```

2. Do the same for the autocorrelation array — allocate once, reuse.

**Fix in `useAudioAnalysis.ts`:**
3. Add a frame counter and only run pitch detection every 2nd frame:
   ```ts
   const frameCountRef = useRef(0);
   
   // Inside the animation loop:
   frameCountRef.current++;
   
   // Pitch detection + glottal cycles + jitter/shimmer — every 2nd frame (30Hz)
   if (frameCountRef.current % 2 === 0) {
     const hz = detectPitch(timeDomainBuffer, sampleRate);
     // ... glottal cycles, jitter, shimmer
   }
   
   // FFT-based features — every frame (cheap, just array lookups)
   // spectral centroid, slope, flatness, overtones, HNR, formants, spectrum viz
   ```

4. When pitch detection is skipped, hold the last valid values (already implemented for -1 returns, just extend the skip logic).

This cuts CPU load by ~50% with zero impact on final results (15 seconds × 30 readings/sec = 450 readings, more than enough).

---

## Fix 3: Add DC blocker before glottal cycle extraction

**Problem:** Zero-crossing detection is very sensitive to DC offset. Even a tiny DC offset of 0.01 in the signal shifts ALL zero-crossing positions, which directly corrupts:
- Cycle period measurements → wrong jitter
- Cycle peak amplitude measurements → wrong shimmer

Microphones, especially on mobile, commonly introduce small DC offsets.

**Fix in `glottal-cycles.ts`:**

Add a single-pole DC blocking filter before scanning for zero crossings:

```ts
export function extractGlottalCycles(
  timeDomainData: Float32Array,
  expectedPeriod: number
): { periods: number[]; amplitudes: number[] } {
  
  // DC blocker: y[n] = x[n] - x[n-1] + R * y[n-1]
  // R = 0.995 gives a high-pass corner around 35 Hz at 44100 Hz
  // This removes DC offset and sub-bass rumble without affecting vocal frequencies
  const R = 0.995;
  const filtered = new Float32Array(timeDomainData.length);
  let xPrev = 0;
  let yPrev = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    filtered[i] = timeDomainData[i] - xPrev + R * yPrev;
    xPrev = timeDomainData[i];
    yPrev = filtered[i];
  }
  
  // Use filtered[] for all zero-crossing detection below
  // ... rest of the existing algorithm, but replace timeDomainData with filtered
```

**Note:** The DC blocker buffer (`filtered`) should also be allocated once at module scope and reused (same pattern as Fix 2) to avoid per-frame allocation.

---

## Fix 4: Add formant confidence and reduce weight when detection fails

**Problem:** When formant peak picking finds no peaks in the expected ranges, it falls back to hardcoded defaults (F1=500, F2=1500, F3=2500). These defaults are then used at full weight in chakra scoring. The system appears to produce valid results but is actually operating on fake data.

This is especially likely when:
- Background noise masks the spectral envelope
- Very low voices where F1 is hard to separate from F0 harmonics
- Quiet recordings where spectral peaks are weak

**Fix in `formants.ts`:**

Track how many formants were actually detected vs defaulted:

```ts
interface FormantResult {
  f1: number;
  f2: number;
  f3: number;
  confidence: number; // 0, 0.33, 0.67, or 1.0
}

export function extractFormants(
  frequencyData: Float32Array,
  fundamental: number,
  sampleRate: number,
  fftSize: number
): FormantResult {
  // ... existing peak finding logic ...
  
  let detectedCount = 0;
  
  const f1Peak = findPeakInRange(peaks, 200, 900);
  const f1 = f1Peak || 500;
  if (f1Peak) detectedCount++;
  
  const f2Floor = Math.max(800, f1 + 200);
  const f2Peak = findPeakInRange(peaks, f2Floor, 2800);
  const f2 = f2Peak || 1500;
  if (f2Peak) detectedCount++;
  
  const f3Floor = Math.max(1500, f2 + 300);
  const f3Peak = findPeakInRange(peaks, f3Floor, 3500);
  const f3 = f3Peak || 2500;
  if (f3Peak) detectedCount++;
  
  return { f1, f2, f3, confidence: detectedCount / 3 };
}
```

**Fix in `chakra-scoring.ts`:**

Scale formant-dependent weights by confidence:

```ts
// When building chakra scores, scale formant weights:
const fc = voiceProfile.formantConfidence ?? 1; // fallback for backwards compat

// Example for Heart chakra:
// Original: f1Norm weight 0.20
// With confidence: f1Norm weight (0.20 * fc), redistribute (0.20 * (1-fc)) to other biomarkers

// Simple approach: multiply formant weights by confidence, boost non-formant weights proportionally
function adjustWeights(weights: [number, number][], formantIndices: number[], confidence: number): [number, number][] {
  if (confidence >= 1) return weights;
  
  let lostWeight = 0;
  const adjusted = weights.map(([value, weight], i) => {
    if (formantIndices.includes(i)) {
      const newWeight = weight * confidence;
      lostWeight += weight - newWeight;
      return [value, newWeight] as [number, number];
    }
    return [value, weight] as [number, number];
  });
  
  // Redistribute lost weight proportionally to non-formant entries
  const nonFormantTotal = adjusted
    .filter((_, i) => !formantIndices.includes(i))
    .reduce((sum, [, w]) => sum + w, 0);
  
  return adjusted.map(([value, weight], i) => {
    if (!formantIndices.includes(i) && nonFormantTotal > 0) {
      return [value, weight + lostWeight * (weight / nonFormantTotal)] as [number, number];
    }
    return [value, weight] as [number, number];
  });
}
```

**Also update `VoiceProfile` type in `types.ts`:**
```ts
formants: { f1: number; f2: number; f3: number; confidence: number };
```

And ensure `formantConfidence` is passed through `build-profile.ts` into the final profile.

---

## Build checklist

- [ ] Fix 1: Audit all dB conversions, add comments, fix any mismatches
- [ ] Fix 2: Reuse pitch detection buffers (normalised + autocorrelation)
- [ ] Fix 2: Run pitch detection at 30Hz (every 2nd frame), FFT features at 60Hz
- [ ] Fix 3: Add DC blocker in glottal-cycles.ts, reuse buffer
- [ ] Fix 4: Add formant confidence tracking in formants.ts
- [ ] Fix 4: Scale formant weights by confidence in chakra-scoring.ts
- [ ] Fix 4: Update VoiceProfile type to include formantConfidence
- [ ] Run `npm run build` — zero errors
- [ ] Test on mobile: recording should feel smoother (Fix 2)
- [ ] Test with quiet voice: formant confidence should be < 1.0 (Fix 4)
- [ ] Do NOT push to GitHub yet — save locally, I want to review the changes first
