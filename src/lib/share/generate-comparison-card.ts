import type { FrequencyProfile } from '@/lib/types';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function deltaStr(a: number, b: number, unit: string, decimals = 0): string {
  const diff = b - a;
  const rounded = decimals > 0 ? diff.toFixed(decimals) : Math.round(diff).toString();
  const sign = diff > 0 ? '+' : '';
  const color = diff > 0.5 ? '#5ABF7B' : diff < -0.5 ? '#F0913A' : '#507090';
  return `<span style="color:${color};font-size:20px;">${sign}${rounded}${unit}</span>`;
}

function generateChangeSummary(before: FrequencyProfile, after: FrequencyProfile): string[] {
  const lines: string[] = [];

  const stabBefore = Math.round(before.stability * 100);
  const stabAfter = Math.round(after.stability * 100);
  if (Math.abs(stabAfter - stabBefore) > 2) {
    const word = stabAfter > stabBefore + 1 ? 'increased' : stabAfter < stabBefore - 1 ? 'decreased' : 'stayed steady';
    lines.push(`Stability ${word} from ${stabBefore}% to ${stabAfter}%.`);
  }

  if (Math.abs(after.richness - before.richness) > 3) {
    const word = after.richness > before.richness + 1 ? 'increased' : after.richness < before.richness - 1 ? 'decreased' : 'stayed steady';
    lines.push(`Overtone richness ${word} from ${before.richness}% to ${after.richness}%.`);
  }

  const hnrBefore = Math.round(before.voiceProfile.hnr);
  const hnrAfter = Math.round(after.voiceProfile.hnr);
  if (Math.abs(hnrAfter - hnrBefore) > 2) {
    const word = hnrAfter > hnrBefore + 1 ? 'increased' : hnrAfter < hnrBefore - 1 ? 'decreased' : 'stayed steady';
    lines.push(`Vocal clarity ${word} from ${hnrBefore} dB to ${hnrAfter} dB.`);
  }

  if (before.dominantChakra.name !== after.dominantChakra.name) {
    lines.push(`Dominant chakra shifted from ${before.dominantChakra.name} to ${after.dominantChakra.name}.`);
  }

  if (lines.length === 0) {
    lines.push('Your voice profile remained consistent between recordings.');
  }

  return lines;
}

function buildComparisonCardHTML(before: FrequencyProfile, after: FrequencyProfile): string {
  const date = after.timestamp.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const changes = generateChangeSummary(before, after);
  const summaryHtml = changes.map((l) => `<div style="margin-bottom:8px;">&#x25C6; ${escapeHtml(l)}</div>`).join('');

  const stabBefore = Math.round(before.stability * 100);
  const stabAfter = Math.round(after.stability * 100);
  const hnrBefore = Math.round(before.voiceProfile.hnr);
  const hnrAfter = Math.round(after.voiceProfile.hnr);

  return `
<div style="width:1080px;height:1350px;background:linear-gradient(180deg,#050c15 0%,#091623 40%,#0d1e30 100%);color:#d8e8f5;font-family:'Cormorant Garamond',Georgia,serif;padding:72px 64px;box-sizing:border-box;position:relative;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:40px;">
    <div style="font-family:'DM Mono',monospace;font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#4FA8D6;margin-bottom:12px;">&#10022; Harmonic Intake</div>
    <div style="font-size:44px;font-weight:300;">My Voice Journey</div>
    <div style="font-family:'DM Mono',monospace;font-size:16px;color:#507090;margin-top:8px;">${escapeHtml(date)}</div>
  </div>

  <!-- Column headers -->
  <div style="display:flex;gap:24px;margin-bottom:16px;">
    <div style="flex:1;"></div>
    <div style="width:280px;text-align:center;font-family:'DM Mono',monospace;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#507090;">Before</div>
    <div style="width:100px;"></div>
    <div style="width:280px;text-align:center;font-family:'DM Mono',monospace;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#507090;">After</div>
  </div>

  <!-- Fundamental -->
  <div style="display:flex;align-items:center;gap:24px;background:rgba(13,30,48,0.6);border:1px solid #162535;border-radius:20px;padding:28px 32px;margin-bottom:16px;">
    <div style="flex:1;font-size:22px;color:#8aa5bb;">Fundamental</div>
    <div style="width:280px;text-align:center;">
      <div style="font-family:'DM Mono',monospace;font-size:36px;">${before.fundamental} Hz</div>
    </div>
    <div style="width:100px;text-align:center;">
      ${deltaStr(before.fundamental, after.fundamental, ' Hz')}
    </div>
    <div style="width:280px;text-align:center;">
      <div style="font-family:'DM Mono',monospace;font-size:36px;">${after.fundamental} Hz</div>
    </div>
  </div>

  <!-- Note -->
  <div style="display:flex;align-items:center;gap:24px;background:rgba(13,30,48,0.6);border:1px solid #162535;border-radius:20px;padding:28px 32px;margin-bottom:16px;">
    <div style="flex:1;font-size:22px;color:#8aa5bb;">Note</div>
    <div style="width:280px;text-align:center;">
      <div style="font-size:40px;font-weight:600;color:${before.dominantChakra.color};">${escapeHtml(before.noteInfo.note)}${before.noteInfo.octave}</div>
    </div>
    <div style="width:100px;text-align:center;">
      <span style="font-family:'DM Mono',monospace;font-size:18px;color:#507090;">&#8594;</span>
    </div>
    <div style="width:280px;text-align:center;">
      <div style="font-size:40px;font-weight:600;color:${after.dominantChakra.color};">${escapeHtml(after.noteInfo.note)}${after.noteInfo.octave}</div>
    </div>
  </div>

  <!-- Stability -->
  <div style="display:flex;align-items:center;gap:24px;background:rgba(13,30,48,0.6);border:1px solid #162535;border-radius:20px;padding:28px 32px;margin-bottom:16px;">
    <div style="flex:1;font-size:22px;color:#8aa5bb;">Stability</div>
    <div style="width:280px;text-align:center;">
      <div style="font-family:'DM Mono',monospace;font-size:36px;">${stabBefore}%</div>
    </div>
    <div style="width:100px;text-align:center;">
      ${deltaStr(stabBefore, stabAfter, '%')}
    </div>
    <div style="width:280px;text-align:center;">
      <div style="font-family:'DM Mono',monospace;font-size:36px;">${stabAfter}%</div>
    </div>
  </div>

  <!-- Clarity (HNR) -->
  <div style="display:flex;align-items:center;gap:24px;background:rgba(13,30,48,0.6);border:1px solid #162535;border-radius:20px;padding:28px 32px;margin-bottom:16px;">
    <div style="flex:1;font-size:22px;color:#8aa5bb;">Clarity</div>
    <div style="width:280px;text-align:center;">
      <div style="font-family:'DM Mono',monospace;font-size:36px;">${hnrBefore} dB</div>
    </div>
    <div style="width:100px;text-align:center;">
      ${deltaStr(hnrBefore, hnrAfter, ' dB')}
    </div>
    <div style="width:280px;text-align:center;">
      <div style="font-family:'DM Mono',monospace;font-size:36px;">${hnrAfter} dB</div>
    </div>
  </div>

  <!-- Dominant Chakra -->
  <div style="display:flex;align-items:center;gap:24px;background:rgba(13,30,48,0.6);border:1px solid #162535;border-radius:20px;padding:28px 32px;margin-bottom:24px;">
    <div style="flex:1;font-size:22px;color:#8aa5bb;">Chakra</div>
    <div style="width:280px;text-align:center;display:flex;align-items:center;justify-content:center;gap:10px;">
      <div style="width:14px;height:14px;border-radius:50%;background:${before.dominantChakra.color};"></div>
      <span style="font-size:26px;">${escapeHtml(before.dominantChakra.name)}</span>
    </div>
    <div style="width:100px;text-align:center;">
      <span style="font-family:'DM Mono',monospace;font-size:18px;color:#507090;">&#8594;</span>
    </div>
    <div style="width:280px;text-align:center;display:flex;align-items:center;justify-content:center;gap:10px;">
      <div style="width:14px;height:14px;border-radius:50%;background:${after.dominantChakra.color};box-shadow:0 0 8px ${after.dominantChakra.color};"></div>
      <span style="font-size:26px;">${escapeHtml(after.dominantChakra.name)}</span>
    </div>
  </div>

  <!-- Change Summary -->
  <div style="background:rgba(13,30,48,0.4);border:1px solid #162535;border-radius:20px;padding:28px 32px;margin-bottom:24px;">
    <div style="font-family:'DM Mono',monospace;font-size:14px;letter-spacing:3px;text-transform:uppercase;color:#507090;margin-bottom:16px;">Change Summary</div>
    <div style="font-size:20px;line-height:1.7;color:#8aa5bb;">
      ${summaryHtml}
    </div>
  </div>

  <!-- Footer -->
  <div style="position:absolute;bottom:52px;left:64px;right:64px;text-align:center;border-top:1px solid #162535;padding-top:20px;">
    <div style="font-family:'DM Mono',monospace;font-size:16px;letter-spacing:4px;text-transform:uppercase;color:#3a5570;">sonarus.app</div>
  </div>

</div>`;
}

export async function generateComparisonCard(
  before: FrequencyProfile,
  after: FrequencyProfile,
  options?: { forceDownload?: boolean },
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = buildComparisonCardHTML(before, after);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      width: 1080,
      height: 1350,
      scale: 1,
      backgroundColor: '#050c15',
      useCORS: true,
      logging: false,
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });

    if (!blob) return;

    // Try native Web Share API on mobile (unless forceDownload)
    if (!options?.forceDownload && navigator.share && navigator.canShare) {
      const file = new File([blob], 'voice-comparison.png', { type: 'image/png' });
      const shareData = { files: [file], title: 'My Voice Journey' };

      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch {
          // User cancelled or share failed — fall through to download
        }
      }
    }

    // Fallback: download
    downloadBlob(blob, 'voice-comparison.png');
  } finally {
    document.body.removeChild(container);
  }
}
