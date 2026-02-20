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
 * Glottal cycle extraction WITHOUT DC blocker — identical logic to
 * extractGlottalCycles but operates directly on raw samples.
 */
function extractCyclesNoDcBlocker(
  timeDomainData: Float32Array,
  sampleRate: number,
  fundamental: number,
): { count: number; periods: number[] } {
  if (fundamental <= 0) return { count: 0, periods: [] };

  const n = timeDomainData.length;
  const expectedPeriod = sampleRate / fundamental;
  const minPeriod = expectedPeriod * 0.7;
  const maxPeriod = expectedPeriod * 1.4;

  // Find positive-going zero crossings on RAW signal (no DC blocker)
  const crossings: number[] = [];
  for (let i = 1; i < n; i++) {
    if (timeDomainData[i - 1] <= 0 && timeDomainData[i] > 0) {
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

async function runDcBlockerTest(): Promise<TestResult> {
  const log: string[] = [];
  const ctx = new AudioContext();
  const { analyser, signalGain } = buildPipeline(ctx);

  // Create 200 Hz oscillator at gain 0.15
  const osc = ctx.createOscillator();
  osc.frequency.value = 200;
  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.15;
  osc.connect(oscGain);

  // ScriptProcessorNode to add DC offset of +0.1 to every sample
  const bufSize = 4096;
  const dcInjector = ctx.createScriptProcessor(bufSize, 1, 1);
  dcInjector.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < input.length; i++) {
      output[i] = input[i] + 0.1;
    }
  };

  oscGain.connect(dcInjector);
  dcInjector.connect(signalGain);
  osc.start();

  const timeDomain = new Float32Array(analyser.fftSize);

  log.push(`Sample rate: ${ctx.sampleRate} Hz`);
  log.push(`Signal: 200 Hz sine @ gain=0.15 + DC offset=+0.1`);
  log.push('Waiting 1s for stabilisation...');
  await wait(1000);

  // Collect multiple frames over ~2s
  const withDcBlockerCycles: number[] = [];
  const withDcBlockerPeriods: number[] = [];
  const noDcBlockerCycles: number[] = [];
  const noDcBlockerPeriods: number[] = [];

  const collectEnd = performance.now() + 2000;
  log.push('Collecting glottal cycles for 2s...');

  await new Promise<void>((resolve) => {
    function frame() {
      if (performance.now() >= collectEnd) {
        resolve();
        return;
      }
      analyser.getFloatTimeDomainData(timeDomain);

      // With DC blocker (production function)
      const cyclesWith = extractGlottalCycles(timeDomain, ctx.sampleRate, 200);
      withDcBlockerCycles.push(cyclesWith.length);
      for (const c of cyclesWith) withDcBlockerPeriods.push(c.periodSeconds);

      // Without DC blocker (raw signal)
      const rawResult = extractCyclesNoDcBlocker(timeDomain, ctx.sampleRate, 200);
      noDcBlockerCycles.push(rawResult.count);
      for (const p of rawResult.periods) noDcBlockerPeriods.push(p);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  osc.stop();
  dcInjector.disconnect();
  await ctx.close();

  const withTotal = withDcBlockerCycles.reduce((a, b) => a + b, 0);
  const withoutTotal = noDcBlockerCycles.reduce((a, b) => a + b, 0);

  const withJitter = calculateJitter(withDcBlockerPeriods);
  const withoutJitter = calculateJitter(noDcBlockerPeriods);

  log.push(`--- WITH DC blocker ---`);
  log.push(`Valid cycles: ${withTotal}`);
  log.push(`Jitter (relative): ${withJitter.relative.toFixed(4)}%`);
  log.push(`Periods collected: ${withDcBlockerPeriods.length}`);

  log.push(`--- WITHOUT DC blocker ---`);
  log.push(`Valid cycles: ${withoutTotal}`);
  log.push(`Jitter (relative): ${withoutJitter.relative.toFixed(4)}%`);
  log.push(`Periods collected: ${noDcBlockerPeriods.length}`);

  const moreCycles = withTotal > withoutTotal;
  const lowerJitter = withJitter.relative < withoutJitter.relative;
  const pass = moreCycles && lowerJitter;

  if (!pass) {
    if (!moreCycles)
      log.push(`FAIL: DC blocker cycles (${withTotal}) <= raw cycles (${withoutTotal})`);
    if (!lowerJitter)
      log.push(
        `FAIL: DC blocker jitter (${withJitter.relative.toFixed(4)}%) >= raw jitter (${withoutJitter.relative.toFixed(4)}%)`,
      );
  }

  return {
    status: pass ? 'pass' : 'fail',
    metrics: {
      'Cycles (DC)': `${withTotal}`,
      'Cycles (raw)': `${withoutTotal}`,
      'Jitter (DC)': `${withJitter.relative.toFixed(4)}%`,
      'Jitter (raw)': `${withoutJitter.relative.toFixed(4)}%`,
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
