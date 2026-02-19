/**
 * Normalisation & scoring utilities for voice biomarkers.
 */

/** Clamp a value to the 0-1 range. */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Clamp a value to an arbitrary range. */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Push scores away from center to create more differentiation.
 * Stretches the offset from center by 1.4× factor.
 */
export function sigmoidSpread(value: number, center: number): number {
  const offset = value - center;
  const stretched = center + offset * 1.4;
  return clamp(stretched, 0, 100);
}

/**
 * Calculate a weighted score from an array of [value, weight] pairs.
 * Values are clamped to 0-1, then the weighted sum is scaled to 0-100
 * and spread via sigmoid to create differentiation.
 */
export function weightedScore(weights: [number, number][]): number {
  let sum = 0;
  for (const [value, weight] of weights) {
    sum += clamp01(value) * weight;
  }
  const raw = sum * 100;
  return Math.round(clamp(sigmoidSpread(raw, 50), 5, 98));
}
