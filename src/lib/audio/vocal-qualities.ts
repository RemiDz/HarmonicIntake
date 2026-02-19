/**
 * RMS Energy — overall loudness/projection (from time domain).
 * Kept as a standalone export since it's used per-frame in the recording hook.
 */
export function getRMSEnergy(timeDomainData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    sum += timeDomainData[i] * timeDomainData[i];
  }
  return Math.sqrt(sum / timeDomainData.length);
}
