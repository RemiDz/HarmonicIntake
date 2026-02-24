import type { FrequencyProfile } from '@/lib/types';
import {
  getFrequencyRangeDescription,
  getHumanInstrumentSuggestion,
} from '@/lib/profile/humanize';
import { getStabilityLabel } from '@/lib/profile/recommendations';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildCardHTML(profile: FrequencyProfile): string {
  const { noteInfo, fundamental, stability, richness, fifth, third, dominantChakra, chakraScores, voiceProfile } =
    profile;

  const date = profile.timestamp.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rangeDesc = getFrequencyRangeDescription(fundamental);
  const stabilityPct = Math.round(stability * 100);
  const accent = dominantChakra.color;

  const clarityLbl = voiceProfile.hnr >= 28 ? 'Clear' : voiceProfile.hnr >= 20 ? 'Warm' : 'Soft';

  // Chakra bars — Crown at top, Root at bottom
  const reversed = [...chakraScores].reverse();
  const chakraRowsHtml = reversed
    .map(
      (cs) => `
    <div style="display:flex;align-items:center;margin-bottom:18px;">
      <span style="font-family:'DM Mono',monospace;font-size:22px;width:80px;text-align:right;color:#8aa5bb;">${cs.score}%</span>
      <div style="flex:1;padding:0 20px;">
        <div style="height:12px;background:rgba(22,37,53,0.8);border-radius:6px;overflow:hidden;">
          <div style="height:100%;width:${cs.score}%;background:${cs.color};border-radius:6px;"></div>
        </div>
      </div>
      <span style="font-size:22px;width:160px;color:#8aa5bb;">${escapeHtml(cs.name)}</span>
    </div>`,
    )
    .join('\n');

  return `
<div style="width:1080px;height:1350px;background:linear-gradient(180deg,#050c15 0%,#091623 40%,#0d1e30 100%);color:#d8e8f5;font-family:'Cormorant Garamond',Georgia,serif;padding:80px 72px;box-sizing:border-box;position:relative;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:48px;">
    <div style="font-family:'DM Mono',monospace;font-size:18px;letter-spacing:4px;text-transform:uppercase;color:${accent};margin-bottom:12px;">✦ Harmonic Intake</div>
    <div style="font-size:48px;font-weight:300;">Frequency Profile</div>
    <div style="font-family:'DM Mono',monospace;font-size:18px;color:#507090;margin-top:8px;">${escapeHtml(date)}</div>
  </div>

  <!-- Tone Card -->
  <div style="background:rgba(13,30,48,0.6);border:1px solid #162535;border-radius:24px;padding:40px;text-align:center;margin-bottom:36px;">
    <div style="font-size:96px;font-weight:600;line-height:1;color:${accent};">${escapeHtml(noteInfo.note)}${noteInfo.octave}</div>
    <div style="font-family:'DM Mono',monospace;font-size:28px;color:#8aa5bb;margin-top:8px;">${fundamental} Hz</div>
    <div style="font-size:26px;color:#8aa5bb;margin-top:16px;">A ${escapeHtml(rangeDesc)} tone</div>
  </div>

  <!-- Metrics Row -->
  <div style="display:flex;gap:16px;margin-bottom:36px;">
    <div style="flex:1;text-align:center;padding:20px;background:rgba(13,30,48,0.6);border-radius:16px;border:1px solid #162535;">
      <div style="font-family:'DM Mono',monospace;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#507090;margin-bottom:8px;">Fundamental</div>
      <div style="font-family:'DM Mono',monospace;font-size:36px;">${fundamental} Hz</div>
    </div>
    <div style="flex:1;text-align:center;padding:20px;background:rgba(13,30,48,0.6);border-radius:16px;border:1px solid #162535;">
      <div style="font-family:'DM Mono',monospace;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#507090;margin-bottom:8px;">Stability</div>
      <div style="font-family:'DM Mono',monospace;font-size:36px;">${stabilityPct}%</div>
      <div style="font-family:'DM Mono',monospace;font-size:16px;color:#507090;margin-top:4px;">${escapeHtml(getStabilityLabel(stability))}</div>
    </div>
    <div style="flex:1;text-align:center;padding:20px;background:rgba(13,30,48,0.6);border-radius:16px;border:1px solid #162535;">
      <div style="font-family:'DM Mono',monospace;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#507090;margin-bottom:8px;">Clarity</div>
      <div style="font-family:'DM Mono',monospace;font-size:36px;">${clarityLbl}</div>
    </div>
  </div>

  <!-- Energy Centres -->
  <div style="margin-bottom:36px;">
    <div style="font-family:'DM Mono',monospace;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#507090;margin-bottom:20px;">Energy Centres</div>
    ${chakraRowsHtml}
  </div>

  <!-- Dominant Chakra -->
  <div style="background:rgba(13,30,48,0.6);border:1px solid ${accent}40;border-radius:20px;padding:28px;margin-bottom:36px;">
    <div style="font-size:28px;font-weight:600;color:${accent};margin-bottom:6px;">● ${escapeHtml(dominantChakra.name)} Chakra — ${dominantChakra.score}%</div>
    <div style="font-size:22px;line-height:1.5;color:#8aa5bb;">${escapeHtml(dominantChakra.description)}</div>
  </div>

  <!-- Session Guidance -->
  <div style="margin-bottom:36px;">
    <div style="font-family:'DM Mono',monospace;font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#507090;margin-bottom:16px;">Session Guidance</div>
    <div style="font-size:22px;line-height:1.8;color:#8aa5bb;">
      ◆ Ground: <span style="font-family:'DM Mono',monospace;color:${accent};">${escapeHtml(noteInfo.note)}${noteInfo.octave}</span> ·
      Expand: <span style="font-family:'DM Mono',monospace;color:${accent};">${escapeHtml(fifth.note.note)}${fifth.note.octave}</span> ·
      Release: <span style="font-family:'DM Mono',monospace;color:${accent};">${escapeHtml(third.note.note)}${third.note.octave}</span>
    </div>
  </div>

  <!-- Footer -->
  <div style="position:absolute;bottom:60px;left:72px;right:72px;text-align:center;border-top:1px solid #162535;padding-top:20px;">
    <div style="font-family:'DM Mono',monospace;font-size:16px;letter-spacing:4px;text-transform:uppercase;color:#3a5570;">sonarus.app</div>
  </div>

</div>`;
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

export async function generateShareCard(profile: FrequencyProfile): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = buildCardHTML(profile);
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

    // Try native Web Share API on mobile
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'frequency-profile.png', { type: 'image/png' });
      const shareData = { files: [file], title: 'My Frequency Profile' };

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
    downloadBlob(blob, 'frequency-profile.png');
  } finally {
    document.body.removeChild(container);
  }
}
