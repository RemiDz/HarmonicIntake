/**
 * Web Audio API generated UI sounds.
 * No audio files needed — all synthesised in real-time.
 */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContext();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume();
  }
  return sharedCtx;
}

/** Singing bowl "ting" — a decaying sine at 528 Hz. Plays on recording start. */
export function playTing() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 528;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {
    // Silently fail — sound is non-critical
  }
}

/** Gentle harmonic chord — plays on analysis complete. */
export function playChord() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    // C major triad: C4 (261.6), E4 (329.6), G4 (392.0)
    const freqs = [261.63, 329.63, 392.0];

    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2);
    }
  } catch {
    // Silently fail
  }
}

/** Haptic feedback — short buzz */
export function hapticBuzz() {
  try {
    navigator?.vibrate?.(50);
  } catch {
    // Not supported
  }
}

/** Haptic feedback — double buzz */
export function hapticDoubleBuzz() {
  try {
    navigator?.vibrate?.([50, 30, 50]);
  } catch {
    // Not supported
  }
}
