'use client';

import { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Copy, Check, Instagram, Twitter, MessageCircle, Linkedin } from 'lucide-react';

interface PlatformTemplate {
  id: string;
  platform: string;
  icon: React.ReactNode;
  template: string;
  charLimit?: number;
}

const PLACEHOLDER = '[Select a hook above]';

function buildTemplates(hook: string): PlatformTemplate[] {
  return [
    {
      id: 'instagram',
      platform: 'Instagram',
      icon: <Instagram size={16} />,
      charLimit: 2200,
      template: `${hook}

Harmonic Intake analyses your voice in just 15 seconds — revealing your fundamental frequency, chakra resonance, overtone richness, and personalised session recommendations.

No app download. No sign-up. No data stored.
Just open, hum, and discover.

Try it free (link in bio)

#HarmonicIntake #FrequencyProfile #SoundHealing #VocalAnalysis #ChakraResonance #HealingFrequencies #SoundTherapy #WellnessTech`,
    },
    {
      id: 'twitter',
      platform: 'Twitter / X',
      icon: <Twitter size={16} />,
      charLimit: 280,
      template: `${hook}

Harmonic Intake analyses your voice in 15 sec — frequency, chakra, overtones & session recs.

Free. No sign-up. Browser only.

harmonic-intake.vercel.app`,
    },
    {
      id: 'tiktok',
      platform: 'TikTok',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>,
      template: `${hook}

I just hummed into my phone for 15 seconds and got a full frequency profile — my note, my chakra, my overtone richness, even what instruments to use in my next session.

This tool is completely free. No app. No login. Just open and hum.

Link in bio — try it yourself

#HarmonicIntake #SoundHealing #FrequencyHealing #Chakra #SoundTherapy #WellnessTok #EnergyHealing #VocalFrequency`,
    },
    {
      id: 'whatsapp',
      platform: 'WhatsApp / DM',
      icon: <MessageCircle size={16} />,
      template: `Hey! Have you seen this?

${hook}

It's called Harmonic Intake — you hum for 15 seconds and it gives you a full frequency profile with your note, chakra resonance, and session recommendations.

Completely free, nothing to download, works in the browser:
harmonic-intake.vercel.app

I thought you'd love it for your practice.`,
    },
    {
      id: 'linkedin',
      platform: 'LinkedIn',
      icon: <Linkedin size={16} />,
      template: `${hook}

As a wellness practitioner, the intake process has always been one of the most time-consuming parts of my sessions. I wanted a way to get an objective, non-verbal baseline before I even begin.

So I built Harmonic Intake — a browser-based tool that analyses a client's vocal frequency in 15 seconds and generates a personalised Frequency Profile, including:

- Fundamental frequency & musical note
- Chakra resonance mapping
- Overtone richness analysis
- Tonal stability assessment
- Session recommendations (drone notes, intervals, instruments)

No app download. No accounts. No data stored. It runs entirely in the browser using the Web Audio API.

If you work with sound, voice, breath, or energy — I'd love your feedback.

harmonic-intake.vercel.app

#SoundHealing #WellnessTech #VocalAnalysis #FrequencyHealing #HolisticHealth`,
    },
  ];
}

interface PromoCaptionsProps {
  selectedHook: string | null;
}

export default function PromoCaptions({ selectedHook }: PromoCaptionsProps) {
  const hook = selectedHook || PLACEHOLDER;
  const templates = buildTemplates(hook);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
        Platform Captions
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {selectedHook
          ? 'Your selected hook has been inserted into each template.'
          : 'Select a hook above to auto-fill these captions.'}
      </p>

      <div className="space-y-4">
        {templates.map((t) => {
          const charCount = t.template.length;
          const overLimit = t.charLimit ? charCount > t.charLimit : false;

          return (
            <Card key={t.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-accent-primary">{t.icon}</span>
                  <span className="font-mono text-xs tracking-widest uppercase text-text-primary">
                    {t.platform}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-xs ${overLimit ? 'text-error' : 'text-text-dim'}`}>
                    {charCount}{t.charLimit ? ` / ${t.charLimit}` : ''} chars
                  </span>
                  <button
                    onClick={() => handleCopy(t.id, t.template)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono
                      bg-bg-surface border border-border hover:border-border-hover
                      text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    {copiedId === t.id ? (
                      <>
                        <Check size={12} className="text-success" />
                        <span className="text-success">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed font-body break-words">
                {t.template}
              </pre>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
