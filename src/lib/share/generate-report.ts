import type { FrequencyProfile } from '@/lib/types';
import {
  getFrequencyRangeDescription,
  getJitterDescription,
  getShimmerDescription,
  getHnrDescription,
  getPitchRangeDescription,
  getHumanInstrumentSuggestion,
} from '@/lib/profile/humanize';
import { getStabilityLabel } from '@/lib/profile/recommendations';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatCents(cents: number): string {
  if (cents === 0) return '±0';
  return cents > 0 ? `+${cents}` : `${cents}`;
}

function steadinessLabel(jitterRel: number): string {
  if (jitterRel < 0.5) return 'Calm';
  if (jitterRel < 1.0) return 'Natural';
  return 'Fluid';
}

function projectionLabel(shimmerDb: number): string {
  if (shimmerDb < 0.2) return 'Strong';
  if (shimmerDb < 0.4) return 'Gentle';
  return 'Soft';
}

function clarityLabel(hnr: number): string {
  if (hnr >= 28) return 'Clear';
  if (hnr >= 20) return 'Warm';
  return 'Soft';
}

function expressivenessLabel(semitones: number): string {
  if (semitones >= 6) return 'Dynamic';
  if (semitones >= 3) return 'Balanced';
  return 'Focused';
}

function buildChakraRows(profile: FrequencyProfile): string {
  // Display Crown at top, Root at bottom
  const reversed = [...profile.chakraScores].reverse();
  return reversed
    .map(
      (cs) => `
      <div class="chakra-row">
        <span class="chakra-percent">${cs.score}%</span>
        <div class="chakra-dot-container">
          <div class="chakra-bar-bg">
            <div class="chakra-bar-fill" style="width: ${cs.score}%; background: ${cs.color};"></div>
          </div>
        </div>
        <span class="chakra-name">${escapeHtml(cs.name)}</span>
      </div>`,
    )
    .join('\n');
}

function buildQualityItems(profile: FrequencyProfile): string {
  const vp = profile.voiceProfile;
  const accent = profile.dominantChakra.color;
  const items = [
    {
      name: 'Vocal Steadiness',
      level: steadinessLabel(vp.jitter.relative),
      desc: getJitterDescription(vp.jitter.relative),
    },
    {
      name: 'Projection',
      level: projectionLabel(vp.shimmer.db),
      desc: getShimmerDescription(vp.shimmer.db),
    },
    {
      name: 'Clarity',
      level: clarityLabel(vp.hnr),
      desc: getHnrDescription(vp.hnr),
    },
    {
      name: 'Expressiveness',
      level: expressivenessLabel(vp.pitchRange.rangeSemitones),
      desc: getPitchRangeDescription(vp.pitchRange.rangeSemitones),
    },
  ];

  return items
    .map(
      (q) => `
      <div class="quality-item">
        <div class="quality-header">
          <span class="quality-name" style="color: ${accent}">${q.name}</span>
          <span class="quality-level">${q.level}</span>
        </div>
        <div class="quality-description">${escapeHtml(q.desc)}</div>
      </div>`,
    )
    .join('\n');
}

export function generateHTMLReport(profile: FrequencyProfile): void {
  const { noteInfo, fundamental, stability, richness, fifth, third, dominantChakra } = profile;

  const date = profile.timestamp.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = profile.timestamp.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const rangeDesc = getFrequencyRangeDescription(fundamental);
  const stabilityPct = Math.round(stability * 100);
  const accent = dominantChakra.color;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frequency Profile — ${noteInfo.note}${noteInfo.octave} ${fundamental}Hz — Harmonic Intake</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Mono:wght@400&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Cormorant Garamond', Georgia, serif;
      background: linear-gradient(180deg, #050c15 0%, #0d1e30 50%, #0a1520 100%);
      color: #d8e8f5;
      min-height: 100vh;
      padding: 40px 20px;
    }

    .container { max-width: 480px; margin: 0 auto; }

    .header { text-align: center; margin-bottom: 40px; }
    .header .label {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #507090;
      margin-bottom: 12px;
    }
    .header h1 { font-size: 32px; font-weight: 300; margin-bottom: 8px; }
    .header .date {
      font-family: 'DM Mono', monospace;
      font-size: 13px;
      color: #507090;
    }

    .divider {
      width: 60px; height: 1px;
      background: linear-gradient(90deg, transparent, #2a4560, transparent);
      margin: 32px auto;
    }

    .tone-card {
      background: rgba(13, 30, 48, 0.6);
      border: 1px solid #162535;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      margin-bottom: 24px;
    }
    .tone-card .note { font-size: 64px; font-weight: 600; line-height: 1; }
    .tone-card .freq {
      font-family: 'DM Mono', monospace;
      font-size: 18px;
      color: #8aa5bb;
      margin-top: 4px;
    }
    .tone-card .description {
      font-size: 18px;
      color: #8aa5bb;
      margin-top: 16px;
      line-height: 1.5;
    }

    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .metric {
      background: rgba(13, 30, 48, 0.6);
      border: 1px solid #162535;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .metric .label {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #507090;
      margin-bottom: 8px;
    }
    .metric .value {
      font-family: 'DM Mono', monospace;
      font-size: 24px;
      font-weight: 400;
    }
    .metric .sub {
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: #507090;
      margin-top: 4px;
    }

    .qualities {
      background: rgba(13, 30, 48, 0.6);
      border: 1px solid #162535;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .qualities h2 {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #507090;
      margin-bottom: 20px;
    }
    .quality-item {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #162535;
    }
    .quality-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .quality-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .quality-name { font-size: 14px; }
    .quality-level { font-family: 'DM Mono', monospace; font-size: 13px; color: #8aa5bb; }
    .quality-description { font-size: 16px; color: #8aa5bb; line-height: 1.5; }

    .chakra-section {
      background: rgba(13, 30, 48, 0.6);
      border: 1px solid #162535;
      border-radius: 16px;
      padding: 32px 24px;
      margin-bottom: 24px;
    }
    .chakra-section h2 {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #507090;
      margin-bottom: 24px;
      text-align: center;
    }
    .chakra-row { display: flex; align-items: center; margin-bottom: 16px; }
    .chakra-row:last-child { margin-bottom: 0; }
    .chakra-percent {
      font-family: 'DM Mono', monospace;
      font-size: 14px;
      width: 50px;
      text-align: right;
      color: #8aa5bb;
    }
    .chakra-dot-container { flex: 1; display: flex; align-items: center; padding: 0 16px; }
    .chakra-bar-bg {
      flex: 1; height: 8px;
      background: rgba(22, 37, 53, 0.8);
      border-radius: 4px;
      overflow: hidden;
    }
    .chakra-bar-fill { height: 100%; border-radius: 4px; }
    .chakra-name { font-size: 14px; width: 100px; color: #8aa5bb; }

    .dominant-card {
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .dominant-card .chakra-title { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
    .dominant-card .chakra-score {
      font-family: 'DM Mono', monospace;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .dominant-card .chakra-insight { font-size: 16px; line-height: 1.6; color: #8aa5bb; }

    .guidance {
      background: rgba(13, 30, 48, 0.6);
      border: 1px solid #162535;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .guidance h2 {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #507090;
      margin-bottom: 20px;
    }
    .guidance-item { display: flex; align-items: baseline; margin-bottom: 12px; }
    .guidance-icon { margin-right: 12px; font-size: 14px; }
    .guidance-text { font-size: 16px; line-height: 1.5; }
    .guidance-note { font-family: 'DM Mono', monospace; font-size: 14px; margin-left: 4px; }
    .instruments {
      font-size: 16px; line-height: 1.6; color: #8aa5bb;
      margin-top: 16px; padding-top: 16px; border-top: 1px solid #162535;
    }

    .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #162535; }
    .footer .brand {
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #3a5570;
    }
    .footer .disclaimer {
      font-size: 12px; color: #3a5570; margin-top: 12px; line-height: 1.5;
    }
    .footer a { color: #4FA8D6; text-decoration: none; }

    .nav-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      background: rgba(5, 12, 21, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid #162535;
    }
    .nav-btn {
      font-family: 'DM Mono', monospace;
      font-size: 12px;
      color: #8aa5bb;
      text-decoration: none;
      background: none;
      border: 1px solid #162535;
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      line-height: 1;
    }
    .nav-btn:hover {
      color: #d8e8f5;
      border-color: #2a4560;
      background: rgba(22, 37, 53, 0.5);
    }
    .nav-btn:disabled {
      opacity: 0.5;
      cursor: wait;
    }
    .nav-btn .btn-label { display: inline; }
    .nav-btn .btn-icon { display: none; font-style: normal; }

    @media (max-width: 380px) {
      .nav-btn { padding: 8px 12px; flex-direction: column; gap: 2px; height: auto; }
      .nav-btn .btn-label { display: none; }
      .nav-btn .btn-icon { display: inline; font-size: 16px; }
    }

    @media print {
      body { background: #050c15; }
      .container { max-width: 100%; }
      .nav-bar { display: none; }
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
</head>
<body>
  <div class="nav-bar">
    <a class="nav-btn" href="https://sonarus.app" onclick="if(window.opener||window.history.length<=1){window.close();return false;}">
      <em class="btn-icon">←</em>
      <span class="btn-label">← Back</span>
    </a>
    <button class="nav-btn" onclick="window.print()">
      <em class="btn-icon">🖨</em>
      <span class="btn-label">Print</span>
    </button>
    <button class="nav-btn" id="dl-btn" onclick="downloadPNG()">
      <em class="btn-icon">⬇</em>
      <span class="btn-label">Download</span>
    </button>
  </div>
  <script>
    function downloadPNG() {
      var btn = document.getElementById('dl-btn');
      var origLabel = btn.querySelector('.btn-label').textContent;
      btn.disabled = true;
      btn.querySelector('.btn-label').textContent = 'Saving...';
      btn.querySelector('.btn-icon').textContent = '⏳';
      var el = document.querySelector('.container');
      html2canvas(el, {
        backgroundColor: '#050c15',
        scale: 2,
        useCORS: true,
        logging: false
      }).then(function(canvas) {
        return new Promise(function(resolve) {
          canvas.toBlob(function(blob) { resolve(blob); }, 'image/png');
        });
      }).then(function(blob) {
        if (!blob) throw new Error('No blob');
        var d = new Date();
        var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        var fname = 'harmonic-intake-report-' + ds + '.png';

        // Use Web Share API on mobile (saves to Photos / share sheet)
        if (navigator.share && navigator.canShare) {
          var file = new File([blob], fname, { type: 'image/png' });
          var shareData = { files: [file], title: 'My Frequency Profile' };
          if (navigator.canShare(shareData)) {
            return navigator.share(shareData);
          }
        }

        // Fallback for desktop: blob download
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }).then(function() {
        btn.disabled = false;
        btn.querySelector('.btn-label').textContent = origLabel;
        btn.querySelector('.btn-icon').textContent = '⬇';
      }).catch(function() {
        btn.disabled = false;
        btn.querySelector('.btn-label').textContent = origLabel;
        btn.querySelector('.btn-icon').textContent = '⬇';
      });
    }
  <\/script>
  <div class="container">

    <div class="header">
      <div class="label">✦ Harmonic Intake</div>
      <h1>Frequency Profile</h1>
      <div class="date">${escapeHtml(date)} · ${escapeHtml(time)}</div>
    </div>

    <div class="divider"></div>

    <div class="tone-card">
      <div class="note" style="color: ${accent}">${escapeHtml(noteInfo.note)}${noteInfo.octave}</div>
      <div class="freq">${fundamental} Hz</div>
      <div class="description">A ${escapeHtml(rangeDesc)} tone</div>
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="label">Fundamental</div>
        <div class="value">${fundamental}</div>
        <div class="sub">Hz</div>
      </div>
      <div class="metric">
        <div class="label">Note</div>
        <div class="value">${escapeHtml(noteInfo.note)}${noteInfo.octave}</div>
        <div class="sub">${formatCents(noteInfo.cents)}¢</div>
      </div>
      <div class="metric">
        <div class="label">Stability</div>
        <div class="value">${stabilityPct}%</div>
        <div class="sub">${escapeHtml(getStabilityLabel(stability))}</div>
      </div>
    </div>

    <div class="qualities">
      <h2>Voice Qualities</h2>
      ${buildQualityItems(profile)}
    </div>

    <div class="chakra-section">
      <h2>Your Energy Centres</h2>
      ${buildChakraRows(profile)}
    </div>

    <div class="dominant-card" style="background: rgba(13, 30, 48, 0.6); border: 1px solid ${accent}40;">
      <div class="chakra-title" style="color: ${accent}">● ${escapeHtml(dominantChakra.name)} Chakra — ${dominantChakra.score}% ${escapeHtml(dominantChakra.label)}</div>
      <div class="chakra-insight">${escapeHtml(dominantChakra.description)}</div>
    </div>

    <div class="guidance">
      <h2>Session Guidance</h2>
      <div class="guidance-item">
        <span class="guidance-icon">◆</span>
        <span class="guidance-text">Grounding tone:
          <span class="guidance-note" style="color: ${accent}">${escapeHtml(noteInfo.note)}${noteInfo.octave}</span>
          — matches your natural frequency
        </span>
      </div>
      <div class="guidance-item">
        <span class="guidance-icon">◆</span>
        <span class="guidance-text">Expansion tone:
          <span class="guidance-note" style="color: ${accent}">${escapeHtml(fifth.note.note)}${fifth.note.octave}</span>
          — opens and uplifts
        </span>
      </div>
      <div class="guidance-item">
        <span class="guidance-icon">◆</span>
        <span class="guidance-text">Release tone:
          <span class="guidance-note" style="color: ${accent}">${escapeHtml(third.note.note)}${third.note.octave}</span>
          — supports emotional letting go
        </span>
      </div>
      <div class="instruments">${escapeHtml(getHumanInstrumentSuggestion(richness))}</div>
    </div>

    ${profile.voiceValidation?.status === 'warn' ? `
    <div style="background:rgba(240,145,58,0.05);border:1px solid rgba(240,145,58,0.2);border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
      <div style="font-family:'DM Mono',monospace;font-size:12px;color:#F0913A;">
        Recording conditions: ${Math.round(profile.voiceValidation.voiceRatio * 100)}% voice clarity.
        Results may be less precise than a higher-clarity recording.
      </div>
    </div>` : ''}

    <div class="footer">
      <div class="brand">Harmonic Intake</div>
      <div class="disclaimer">
        This analysis explores the acoustic qualities of your voice through a wellness lens.
        It is not a medical or clinical assessment.<br><br>
        <a href="https://sonarus.app">sonarus.app</a>
      </div>
    </div>

  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
