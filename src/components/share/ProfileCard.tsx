'use client';

import { forwardRef } from 'react';
import type { FrequencyProfile } from '@/lib/types';
import {
  getFrequencyRangeDescription,
  getStabilityDescription,
  getRichnessDescription,
} from '@/lib/profile/humanize';
import { getRichnessLabel } from '@/lib/profile/recommendations';

interface ProfileCardProps {
  profile: FrequencyProfile;
}

/**
 * Off-screen card component rendered for html2canvas capture.
 * Fixed dimensions for Instagram-story-friendly output (540x675, renders at 2x for sharpness).
 */
export const ProfileCard = forwardRef<HTMLDivElement, ProfileCardProps>(({ profile }, ref) => {
  const { noteInfo, fundamental, stability, richness, fifth, third, dominantChakra, chakraScores } =
    profile;

  const date = profile.timestamp.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rangeDesc = getFrequencyRangeDescription(fundamental);
  const stabilityPct = Math.round(stability * 100);

  return (
    <div
      ref={ref}
      style={{
        width: '540px',
        minHeight: '675px',
        background: 'linear-gradient(180deg, #050c15 0%, #091623 40%, #0d1e30 100%)',
        color: '#d8e8f5',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        padding: '48px 40px',
        boxSizing: 'border-box',
        position: 'absolute',
        left: '-9999px',
        top: 0,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            color: dominantChakra.color,
            fontFamily: "'DM Mono', monospace",
            fontSize: '11px',
            letterSpacing: '3px',
            textTransform: 'uppercase' as const,
            marginBottom: '8px',
          }}
        >
          ✦ HARMONIC INTAKE
        </div>
        <div style={{ fontSize: '32px', fontWeight: 300, lineHeight: 1.2 }}>Frequency Profile</div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            color: '#507090',
            marginTop: '6px',
          }}
        >
          {date}
        </div>
      </div>

      {/* Chakra circles */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '28px',
        }}
      >
        {chakraScores.map((cs) => (
          <div key={cs.name} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: `${14 + (cs.score / 100) * 18}px`,
                height: `${14 + (cs.score / 100) * 18}px`,
                borderRadius: '50%',
                backgroundColor: cs.color,
                opacity: 0.3 + (cs.score / 100) * 0.7,
                margin: '0 auto 4px',
                boxShadow: cs.score > 40 ? `0 0 12px ${cs.color}50` : 'none',
              }}
            />
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '8px',
                color: '#507090',
              }}
            >
              {cs.score}%
            </div>
          </div>
        ))}
      </div>

      {/* Note + Frequency */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '36px', fontWeight: 500 }}>
          {noteInfo.note}
          {noteInfo.octave}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#8aa5bb' }}>
          {fundamental} Hz · {rangeDesc}
        </div>
      </div>

      {/* Dominant chakra */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px',
          padding: '14px',
          background: 'rgba(10, 21, 32, 0.6)',
          borderRadius: '12px',
          border: '1px solid #162535',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: dominantChakra.color,
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>{dominantChakra.name} Chakra</div>
          <div style={{ fontSize: '11px', color: '#8aa5bb', marginTop: '2px', lineHeight: 1.4 }}>
            {dominantChakra.label} · {dominantChakra.score}%
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
        }}
      >
        {[
          { label: 'Stability', value: `${stabilityPct}%` },
          { label: 'Richness', value: `${richness}%` },
          { label: 'Tone', value: rangeDesc.split(',')[0] },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px 8px',
              background: 'rgba(9, 22, 35, 0.8)',
              borderRadius: '10px',
              border: '1px solid #162535',
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '8px',
                color: '#507090',
                textTransform: 'uppercase' as const,
                letterSpacing: '1px',
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '16px',
                fontWeight: 500,
                marginTop: '4px',
              }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Session guidance */}
      <div
        style={{
          padding: '14px',
          background: 'rgba(10, 21, 32, 0.6)',
          borderRadius: '12px',
          border: '1px solid #162535',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '8px',
            color: '#507090',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            marginBottom: '10px',
          }}
        >
          Session Guidance
        </div>
        <div style={{ fontSize: '12px', color: '#8aa5bb', lineHeight: 1.6 }}>
          ◆ Ground: {noteInfo.note}
          {noteInfo.octave} · Expand: {fifth.note.note}
          {fifth.note.octave} · Release: {third.note.note}
          {third.note.octave}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          fontFamily: "'DM Mono', monospace",
          fontSize: '9px',
          color: '#3a5570',
          letterSpacing: '2px',
          textTransform: 'uppercase' as const,
        }}
      >
        sonarus.app
      </div>
    </div>
  );
});

ProfileCard.displayName = 'ProfileCard';
