'use client';

import { useState, useCallback, useRef } from 'react';
import { detectPitch } from '@/lib/audio/pitch-detection';
import { getSpectralFlatness } from '@/lib/audio/spectral-features';
import { calculateHNR } from '@/lib/audio/hnr';
import { extractGlottalCycles } from '@/lib/audio/glottal-cycles';
import { calculateJitter } from '@/lib/audio/jitter';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TestStatus = 'pending' | 'running' | 'pass' | 'fail';

interface TestResult {
  status: TestStatus;
  metrics: Record<string, string>;
  log: string[];
}

const FFT_SIZE = 4096;
const SMOOTHING = 0.5;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function buildPipeline(ctx: AudioContext) {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = SMOOTHING;

  const signalGain = ctx.createGain();
  const muteGain = ctx.createGain();
  muteGain.gain.value = 0;

  signalGain.connect(analyser);
  analyser.connect(muteGain);
  muteGain.connect(ctx.destination);

  return { analyser, signalGain, muteGain };
}

/* ------------------------------------------------------------------ */
/*  Test A1: dB Semantics                                              */
/* ------------------------------------------------------------------ */

async function runDbSemanticsTest(): Promise<TestResult> {
  const log: string[] = [];
  const ctx = new AudioContext();
  const { analyser, signalGain } = buildPipeline(ctx);

  const osc = ctx.createOscillator();
  osc.frequency.value = 200;
  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.1;
  osc.connect(oscGain);
  oscGain.connect(signalGain);
  osc.start();

  const binRes = ctx.sampleRate / FFT_SIZE;
  const targetBin = Math.round(200 / binRes);
  const freqData = new Float32Array(analyser.frequencyBinCount);

  log.push(`Sample rate: ${ctx.sampleRate} Hz`);
  log.push(`Bin resolution: ${binRes.toFixed(2)} Hz`);
  log.push(`Target bin: ${targetBin} (${(targetBin * binRes).toFixed(1)} Hz)`);

  // Phase 1: gain = 0.1
  log.push('Waiting 1.5s at gain=0.1...');
  await wait(1500);
  analyser.getFloatFrequencyData(freqData);
  const db1 = freqData[targetBin];
  log.push(`dB at gain=0.1: ${db1.toFixed(2)} dB`);

  // Phase 2: gain = 0.2 (double amplitude)
  oscGain.gain.value = 0.2;
  log.push('Waiting 1.5s at gain=0.2...');
  await wait(1500);
  analyser.getFloatFrequencyData(freqData);
  const db2 = freqData[targetBin];
  log.push(`dB at gain=0.2: ${db2.toFixed(2)} dB`);

  osc.stop();
  await ctx.close();

  const delta = db2 - db1;
  log.push(`Delta: ${delta.toFixed(2)} dB`);

  let semantic: string;
  let pass = false;
  if (Math.abs(delta - 6) < 2) {
    semantic = 'magnitude dB (use 10^(dB/20))';
    pass = true;
  } else if (Math.abs(delta - 3) < 2) {
    semantic = 'power dB (use 10^(dB/10))';
    pass = true;
  } else {
    semantic = `unexpected (delta=${delta.toFixed(2)})`;
  }
  log.push(`Interpretation: ${semantic}`);

  return {
    status: pass ? 'pass' : 'fail',
    metrics: {
      'dB @ 0.1': `${db1.toFixed(2)} dB`,
      'dB @ 0.2': `${db2.toFixed(2)} dB`,
      Delta: `${delta.toFixed(2)} dB`,
      Semantic: semantic,
    },
    log,
  };
}

/* ------------------------------------------------------------------ */
/*  Test B1: Pitch Accuracy                                            */
/* ------------------------------------------------------------------ */

async function runPitchAccuracyTest(): Promise<TestResult> {
  const log: string[] = [];
  const ctx = new AudioContext();
  const { analyser, signalGain } = buildPipeline(ctx);

  const osc = ctx.createOscillator();
  osc.frequency.value = 220;
  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.5;
  osc.connect(oscGain);
  oscGain.connect(signalGain);
  osc.start();

  const timeDomain = new Float32Array(analyser.fftSize);
  const readings: number[] = [];

  log.push(`Sample rate: ${ctx.sampleRate} Hz`);
  log.push(`Target: 220 Hz (A3)`);
  log.push('Waiting 500ms for stabilisation...');
  await wait(500);

  // Collect ~3s of frames
  const collectEnd = performance.now() + 3000;
  log.push('Collecting pitch readings for 3s...');

  await new Promise<void>((resolve) => {
    function frame() {
      if (performance.now() >= collectEnd) {
        resolve();
        return;
      }
      analyser.getFloatTimeDomainData(timeDomain);
      const hz = detectPitch(timeDomain, ctx.sampleRate);
      if (hz > 0) readings.push(hz);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  osc.stop();
  await ctx.close();

  log.push(`Total readings: ${readings.length}`);

  if (readings.length === 0) {
    log.push('FAIL: No pitch detected');
    return {
      status: 'fail',
      metrics: { Readings: '0', Error: 'N/A', Stddev: 'N/A' },
      log,
    };
  }

  const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
  const variance =
    readings.reduce((a, b) => a + (b - mean) ** 2, 0) / readings.length;
  const stddev = Math.sqrt(variance);
  const error = Math.abs(mean - 220);

  log.push(`Mean F0: ${mean.toFixed(2)} Hz`);
  log.push(`Stddev: ${stddev.toFixed(3)} Hz`);
  log.push(`Error from 220 Hz: ${error.toFixed(2)} Hz`);

  const pass = error < 2 && stddev < 2 && readings.length > 30;
  if (!pass) {
    if (error >= 2) log.push(`FAIL: error ${error.toFixed(2)} >= 2 Hz`);
    if (stddev >= 2) log.push(`FAIL: stddev ${stddev.toFixed(3)} >= 2`);
    if (readings.length <= 30)
      log.push(`FAIL: only ${readings.length} readings (need >30)`);
  }

  return {
    status: pass ? 'pass' : 'fail',
    metrics: {
      'Mean F0': `${mean.toFixed(2)} Hz`,
      Error: `${error.toFixed(2)} Hz`,
      Stddev: stddev.toFixed(3),
      Readings: `${readings.length}`,
    },
    log,
  };
}

/* ------------------------------------------------------------------ */
/*  Test D1: Noise Rejection                                           */
/* ------------------------------------------------------------------ */

async function runNoiseRejectionTest(): Promise<TestResult> {
  const log: string[] = [];
  const ctx = new AudioContext();
  const { analyser, signalGain } = buildPipeline(ctx);

  // Create white noise buffer
  const bufferSize = ctx.sampleRate * 3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const srcGain = ctx.createGain();
  srcGain.gain.value = 0.5;
  src.connect(srcGain);
  srcGain.connect(signalGain);
  src.start();

  const timeDomain = new Float32Array(analyser.fftSize);
  const freqData = new Float32Array(analyser.frequencyBinCount);

  log.push(`Sample rate: ${ctx.sampleRate} Hz`);
  log.push('Waiting 500ms for stabilisation...');
  await wait(500);

  let totalFrames = 0;
  let pitchDetected = 0;
  const flatnessReadings: number[] = [];
  const hnrReadings: number[] = [];

  const collectEnd = performance.now() + 2000;
  log.push('Collecting noise analysis for 2s...');

  await new Promise<void>((resolve) => {
    function frame() {
      if (performance.now() >= collectEnd) {
        resolve();
        return;
      }
      totalFrames++;

      analyser.getFloatTimeDomainData(timeDomain);
      analyser.getFloatFrequencyData(freqData);

      const hz = detectPitch(timeDomain, ctx.sampleRate);
      const flatness = getSpectralFlatness(freqData, ctx.sampleRate, FFT_SIZE);
      flatnessReadings.push(flatness);

      if (hz > 0) {
        pitchDetected++;
        const hnr = calculateHNR(freqData, hz, ctx.sampleRate, FFT_SIZE);
        hnrReadings.push(hnr);
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  src.stop();
  await ctx.close();

  const avgFlatness =
    flatnessReadings.length > 0
      ? flatnessReadings.reduce((a, b) => a + b, 0) / flatnessReadings.length
      : 0;
  const rejectionRate =
    totalFrames > 0 ? (1 - pitchDetected / totalFrames) * 100 : 0;
  const avgHnr =
    hnrReadings.length > 0
      ? hnrReadings.reduce((a, b) => a + b, 0) / hnrReadings.length
      : NaN;

  log.push(`Total frames: ${totalFrames}`);
  log.push(`Pitch detected: ${pitchDetected} frames`);
  log.push(`Rejection rate: ${rejectionRate.toFixed(1)}%`);
  log.push(`Avg spectral flatness: ${avgFlatness.toFixed(4)}`);
  if (hnrReadings.length > 0) {
    log.push(`Avg HNR on false positives: ${avgHnr.toFixed(2)} dB`);
  }

  const pass = avgFlatness > 0.5 && rejectionRate > 90;
  if (!pass) {
    if (avgFlatness <= 0.5)
      log.push(`FAIL: avg flatness ${avgFlatness.toFixed(4)} <= 0.5`);
    if (rejectionRate <= 90)
      log.push(`FAIL: rejection rate ${rejectionRate.toFixed(1)}% <= 90%`);
  }

  return {
    status: pass ? 'pass' : 'fail',
    metrics: {
      Flatness: avgFlatness.toFixed(4),
      'Rejection Rate': `${rejectionRate.toFixed(1)}%`,
      'False Positives': `${pitchDetected} / ${totalFrames}`,
      ...(hnrReadings.length > 0 ? { 'Avg HNR': `${avgHnr.toFixed(2)} dB` } : {}),
    },
    log,
  };
}

/* ------------------------------------------------------------------ */
/*  Test C2: DC Blocker                                                */
/* ------------------------------------------------------------------ */

/**
 * Glottal cycle extraction WITHOUT DC blocker — identical zero-crossing
 * and period-validation logic to extractGlottalCycles, but operates
 * directly on the raw (DC-offset) samples with no filtering.
 */
function extractCyclesRaw(
  signal: Float32Array,
  sampleRate: number,
  fundamental: number,
): { count: number; periods: number[] } {
  if (fundamental <= 0) return { count: 0, periods: [] };

  const n = signal.length;
  const expectedPeriod = sampleRate / fundamental;
  const minPeriod = expectedPeriod * 0.7;
  const maxPeriod = expectedPeriod * 1.4;

  const crossings: number[] = [];
  for (let i = 1; i < n; i++) {
    if (signal[i - 1] <= 0 && signal[i] > 0) {
      crossings.push(i);
    }
  }

  const periods: number[] = [];
  for (let i = 0; i < crossings.length - 1; i++) {
    const p = crossings[i + 1] - crossings[i];
    if (p >= minPeriod && p <= maxPeriod) {
      periods.push(p / sampleRate);
    }
  }

  return { count: periods.length, periods };
}

/**
 * Generate a synthetic 200 Hz sine with DC offset as a Float32Array.
 * No Web Audio involved — pure math.
 */
function generateDcOffsetSine(
  sampleRate: number,
  lengthSamples: number,
  freq: number,
  amplitude: number,
  dcOffset: number,
): Float32Array {
  const buf = new Float32Array(lengthSamples);
  for (let i = 0; i < lengthSamples; i++) {
    buf[i] = amplitude * Math.sin(2 * Math.PI * freq * (i / sampleRate)) + dcOffset;
  }
  return buf;
}

async function runDcBlockerTest(): Promise<TestResult> {
  const log: string[] = [];

  const sampleRate = 44100;
  const freq = 200;
  const amplitude = 0.15;
  const dcOffset = 0.1;
  const lengthSamples = FFT_SIZE; // Match real analyser buffer size

  log.push(`Synthetic signal: ${freq} Hz sine @ amplitude=${amplitude}, DC offset=+${dcOffset}`);
  log.push(`Sample rate: ${sampleRate} Hz, buffer: ${lengthSamples} samples`);
  log.push(`No Web Audio — pure Float32Array → algorithm test`);

  const signal = generateDcOffsetSine(sampleRate, lengthSamples, freq, amplitude, dcOffset);

  // Log signal stats to confirm DC offset is present
  let min = Infinity, max = -Infinity, sum = 0;
  for (let i = 0; i < signal.length; i++) {
    if (signal[i] < min) min = signal[i];
    if (signal[i] > max) max = signal[i];
    sum += signal[i];
  }
  const mean = sum / signal.length;
  log.push(`Signal range: [${min.toFixed(4)}, ${max.toFixed(4)}], mean: ${mean.toFixed(4)}`);

  // WITH DC blocker: production extractGlottalCycles (has DC blocker built in)
  const cyclesWith = extractGlottalCycles(signal, sampleRate, freq);
  const periodsWith = cyclesWith.map((c) => c.periodSeconds);
  const jitterWith = calculateJitter(periodsWith);

  // WITHOUT DC blocker: raw zero-crossing extraction on the DC-offset signal
  const rawResult = extractCyclesRaw(signal, sampleRate, freq);
  const jitterWithout = calculateJitter(rawResult.periods);

  log.push('');
  log.push(`--- WITH DC blocker (extractGlottalCycles) ---`);
  log.push(`Valid cycles: ${cyclesWith.length}`);
  log.push(`Jitter (relative): ${jitterWith.relative.toFixed(4)}%`);
  if (periodsWith.length > 0) {
    const meanP = periodsWith.reduce((a, b) => a + b, 0) / periodsWith.length;
    log.push(`Mean period: ${(meanP * 1000).toFixed(4)} ms (expected ${(1000 / freq).toFixed(4)} ms)`);
  }

  log.push('');
  log.push(`--- WITHOUT DC blocker (raw signal) ---`);
  log.push(`Valid cycles: ${rawResult.count}`);
  log.push(`Jitter (relative): ${jitterWithout.relative.toFixed(4)}%`);
  if (rawResult.periods.length > 0) {
    const meanP = rawResult.periods.reduce((a, b) => a + b, 0) / rawResult.periods.length;
    log.push(`Mean period: ${(meanP * 1000).toFixed(4)} ms (expected ${(1000 / freq).toFixed(4)} ms)`);
  }

  const moreCycles = cyclesWith.length > rawResult.count;
  // For jitter comparison: if raw has < 3 periods, calculateJitter returns 0,
  // so treat that as the raw extractor failing entirely (which is a win for DC blocker)
  const rawTooFew = rawResult.periods.length < 3;
  const lowerJitter = rawTooFew || jitterWith.relative < jitterWithout.relative;
  const pass = moreCycles && lowerJitter;

  log.push('');
  if (rawTooFew) {
    log.push(`Raw extractor found <3 periods — DC offset destroyed zero crossings entirely`);
  }
  if (!pass) {
    if (!moreCycles)
      log.push(`FAIL: DC blocker cycles (${cyclesWith.length}) <= raw cycles (${rawResult.count})`);
    if (!lowerJitter)
      log.push(
        `FAIL: DC blocker jitter (${jitterWith.relative.toFixed(4)}%) >= raw jitter (${jitterWithout.relative.toFixed(4)}%)`,
      );
  }

  return {
    status: pass ? 'pass' : 'fail',
    metrics: {
      'Cycles (DC)': `${cyclesWith.length}`,
      'Cycles (raw)': `${rawResult.count}`,
      'Jitter (DC)': `${jitterWith.relative.toFixed(4)}%`,
      'Jitter (raw)': rawTooFew ? 'N/A (<3)' : `${jitterWithout.relative.toFixed(4)}%`,
    },
    log,
  };
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: TestStatus }) {
  const styles: Record<TestStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'rgba(80,112,144,0.15)', text: 'var(--text-dim)', label: 'Pending' },
    running: { bg: 'rgba(79,168,214,0.15)', text: 'var(--accent-primary)', label: 'Running' },
    pass: { bg: 'rgba(90,191,123,0.15)', text: 'var(--success)', label: 'Pass' },
    fail: { bg: 'rgba(226,75,75,0.15)', text: 'var(--error)', label: 'Fail' },
  };
  const s = styles[status];
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        background: s.bg,
        color: s.text,
        ...(status === 'running' ? { animation: 'pulse 1.5s ease-in-out infinite' } : {}),
      }}
    >
      {s.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Test card                                                          */
/* ------------------------------------------------------------------ */

function TestCard({
  title,
  subtitle,
  result,
}: {
  title: string;
  subtitle: string;
  result: TestResult;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
        <StatusBadge status={result.status} />
      </div>

      {Object.keys(result.metrics).length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
            marginTop: 12,
          }}
        >
          {Object.entries(result.metrics).map(([k, v]) => (
            <div
              key={k}
              style={{
                background: 'var(--bg-mid)',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {k}
              </div>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 2 }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      )}

      {result.log.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              padding: 0,
            }}
          >
            {expanded ? '- Hide log' : '+ Show log'}
          </button>
          {expanded && (
            <pre
              style={{
                marginTop: 8,
                padding: 12,
                background: 'var(--bg-deep)',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                overflow: 'auto',
                maxHeight: 240,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {result.log.join('\n')}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const EMPTY: TestResult = { status: 'pending', metrics: {}, log: [] };
const RUNNING: TestResult = { status: 'running', metrics: {}, log: [] };

export default function TestPage() {
  const [running, setRunning] = useState(false);
  const [a1, setA1] = useState<TestResult>(EMPTY);
  const [b1, setB1] = useState<TestResult>(EMPTY);
  const [c2, setC2] = useState<TestResult>(EMPTY);
  const [d1, setD1] = useState<TestResult>(EMPTY);
  const abortRef = useRef(false);

  const runAll = useCallback(async () => {
    setRunning(true);
    abortRef.current = false;
    setA1(EMPTY);
    setB1(EMPTY);
    setC2(EMPTY);
    setD1(EMPTY);

    // A1
    setA1(RUNNING);
    try {
      const r = await runDbSemanticsTest();
      setA1(r);
    } catch (e) {
      setA1({ status: 'fail', metrics: {}, log: [`Error: ${e}`] });
    }

    if (abortRef.current) { setRunning(false); return; }

    // B1
    setB1(RUNNING);
    try {
      const r = await runPitchAccuracyTest();
      setB1(r);
    } catch (e) {
      setB1({ status: 'fail', metrics: {}, log: [`Error: ${e}`] });
    }

    if (abortRef.current) { setRunning(false); return; }

    // C2
    setC2(RUNNING);
    try {
      const r = await runDcBlockerTest();
      setC2(r);
    } catch (e) {
      setC2({ status: 'fail', metrics: {}, log: [`Error: ${e}`] });
    }

    if (abortRef.current) { setRunning(false); return; }

    // D1
    setD1(RUNNING);
    try {
      const r = await runNoiseRejectionTest();
      setD1(r);
    } catch (e) {
      setD1({ status: 'fail', metrics: {}, log: [`Error: ${e}`] });
    }

    setRunning(false);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-deep)',
        color: 'var(--text-primary)',
        padding: '48px 24px',
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Audio Engine Diagnostics
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            Synthetic signal tests — no microphone needed
          </p>
        </div>

        {/* Run button */}
        <button
          onClick={runAll}
          disabled={running}
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 0',
            marginBottom: 24,
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            cursor: running ? 'not-allowed' : 'pointer',
            background: running ? 'var(--bg-surface)' : 'var(--accent-primary)',
            color: running ? 'var(--text-muted)' : '#fff',
            transition: 'background 0.2s',
          }}
        >
          {running ? 'Running...' : 'Run All Tests'}
        </button>

        {/* Test cards */}
        <TestCard title="A1: dB Semantics" subtitle="Amplitude doubling → expected +6 dB (magnitude)" result={a1} />
        <TestCard title="B1: Pitch Accuracy" subtitle="220 Hz oscillator → detectPitch accuracy" result={b1} />
        <TestCard title="C2: DC Blocker" subtitle="DC offset signal → blocker should improve cycle detection" result={c2} />
        <TestCard title="D1: Noise Rejection" subtitle="White noise → pitch should be rejected" result={d1} />

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-dim)',
            marginTop: 32,
            fontFamily: 'var(--font-mono)',
          }}
        >
          HARMONIC INTAKE — Developer Diagnostics
        </p>
      </div>
    </div>
  );
}
