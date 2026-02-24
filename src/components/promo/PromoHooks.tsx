'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Copy, Check, Shuffle } from 'lucide-react';

type Category = 'Science' | 'Wellness' | 'Wow Factor' | 'Practitioner' | 'Educational';

interface Hook {
  text: string;
  category: Category;
}

const HOOKS: Hook[] = [
  // Science (5)
  { text: 'Your voice vibrates at a frequency as unique as your fingerprint.', category: 'Science' },
  { text: 'Every sound you make contains hidden harmonics — most people never hear them.', category: 'Science' },
  { text: 'The human voice produces overtones that ancient cultures used for healing.', category: 'Science' },
  { text: 'Cymatics proves that sound literally shapes matter. What is YOUR sound shaping?', category: 'Science' },
  { text: 'Scientists can now detect stress, fatigue, and emotional state — just from vocal frequency.', category: 'Science' },
  // Wellness (5)
  { text: 'What if 15 seconds of humming could reveal which energy centre needs attention?', category: 'Wellness' },
  { text: 'Your voice knows things your mind hasn\'t processed yet.', category: 'Wellness' },
  { text: 'Sound healers have known for centuries: the voice is the body\'s most powerful instrument.', category: 'Wellness' },
  { text: 'The frequency you hum at naturally is trying to tell you something.', category: 'Wellness' },
  { text: 'Forget blood type — your frequency profile might be the most revealing thing about you.', category: 'Wellness' },
  // Wow Factor (5)
  { text: 'I just analysed my voice in 15 seconds and the results gave me chills.', category: 'Wow Factor' },
  { text: 'This free tool told me more about my energy than a 60-minute session.', category: 'Wow Factor' },
  { text: 'POV: You discover your natural humming frequency aligns with your throat chakra.', category: 'Wow Factor' },
  { text: 'I didn\'t believe in chakras until I saw my frequency profile.', category: 'Wow Factor' },
  { text: 'The internet just gave sound healers their most powerful free tool.', category: 'Wow Factor' },
  // Practitioner (5)
  { text: 'Every new client walks in as a mystery. What if their voice could tell you where to start?', category: 'Practitioner' },
  { text: 'I used to spend 20 minutes on intake. Now I get a frequency baseline in 15 seconds.', category: 'Practitioner' },
  { text: 'Sound healers: stop guessing which bowl to reach for first.', category: 'Practitioner' },
  { text: 'The hardest part of a healing session is knowing where to begin. Not anymore.', category: 'Practitioner' },
  { text: 'Your clients\' voices contain data you\'ve been missing. Here\'s how to read it.', category: 'Practitioner' },
  // Educational (5)
  { text: 'Did you know each chakra has a specific frequency range? Here\'s the science.', category: 'Educational' },
  { text: 'Overtones explained: why a single hum contains an entire harmonic series.', category: 'Educational' },
  { text: 'The difference between a "stable" and "unstable" vocal frequency — and what it means.', category: 'Educational' },
  { text: 'Why sound healers use perfect 5ths: the most powerful interval in music therapy.', category: 'Educational' },
  { text: 'Frequency 101: How Hz, notes, and chakras all connect.', category: 'Educational' },
];

const CATEGORIES: Category[] = ['Science', 'Wellness', 'Wow Factor', 'Practitioner', 'Educational'];

interface PromoHooksProps {
  selectedHook: string | null;
  onSelectHook: (hook: string) => void;
}

export default function PromoHooks({ selectedHook, onSelectHook }: PromoHooksProps) {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const filtered = useMemo(
    () =>
      activeCategory === 'All'
        ? HOOKS
        : HOOKS.filter((h) => h.category === activeCategory),
    [activeCategory],
  );

  const handleCopy = useCallback((idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  const handleShuffle = useCallback(() => {
    const random = HOOKS[Math.floor(Math.random() * HOOKS.length)];
    onSelectHook(random.text);
  }, [onSelectHook]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-2xl font-semibold text-text-primary">
          Opening Hooks
        </h2>
        <button
          onClick={handleShuffle}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono
            bg-bg-surface border border-border hover:border-border-hover
            text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <Shuffle size={12} />
          Shuffle
        </button>
      </div>
      <p className="text-sm text-text-muted mb-4">
        Select a hook to use in your captions and image cards.
      </p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setActiveCategory('All')}
          className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer border ${
            activeCategory === 'All'
              ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
              : 'bg-bg-surface border-border text-text-muted hover:text-text-secondary hover:border-border-hover'
          }`}
        >
          All ({HOOKS.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer border ${
              activeCategory === cat
                ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                : 'bg-bg-surface border-border text-text-muted hover:text-text-secondary hover:border-border-hover'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hook list */}
      <div className="space-y-2">
        {filtered.map((hook, i) => {
          const globalIdx = HOOKS.indexOf(hook);
          const isSelected = selectedHook === hook.text;
          return (
            <Card
              key={globalIdx}
              className={`flex items-start gap-3 !py-3 !px-4 transition-colors ${
                isSelected ? '!border-accent-primary' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[10px] tracking-wider uppercase text-text-dim">
                  {hook.category}
                </span>
                <p className="text-sm text-text-primary mt-0.5 leading-relaxed">
                  {hook.text}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0 pt-2">
                <button
                  onClick={() => onSelectHook(hook.text)}
                  className={`rounded-md px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                      : 'bg-bg-surface border-border text-text-muted hover:text-text-secondary hover:border-border-hover'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
                <button
                  onClick={() => handleCopy(globalIdx, hook.text)}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono
                    bg-bg-surface border border-border hover:border-border-hover
                    text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  {copiedIdx === globalIdx ? (
                    <Check size={10} className="text-success" />
                  ) : (
                    <Copy size={10} />
                  )}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
