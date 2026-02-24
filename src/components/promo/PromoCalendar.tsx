'use client';

import { Card } from '@/components/ui/Card';

const POSTING_TIMES = [
  { platform: 'Instagram', best: '11 am – 1 pm', alt: '7 – 9 pm', timezone: 'Local' },
  { platform: 'TikTok', best: '10 am – 12 pm', alt: '7 – 9 pm', timezone: 'Local' },
  { platform: 'Twitter/X', best: '8 – 10 am', alt: '12 – 1 pm', timezone: 'Local' },
  { platform: 'LinkedIn', best: '7 – 8 am', alt: '12 pm', timezone: 'Local' },
];

const WEEKLY_THEMES = [
  { day: 'Mon', theme: 'Science Monday', desc: 'Frequency facts, cymatics, acoustic science' },
  { day: 'Tue', theme: 'Tip Tuesday', desc: 'Practitioner tips, how-to content' },
  { day: 'Wed', theme: 'Wellness Wed', desc: 'Chakra deep-dives, healing stories' },
  { day: 'Thu', theme: 'Tool Thursday', desc: 'Feature spotlight, demo clips' },
  { day: 'Fri', theme: 'Frequency Friday', desc: 'Fun frequency facts, interactive polls' },
  { day: 'Sat', theme: 'Sound Saturday', desc: 'Instrument spotlights, sound baths' },
  { day: 'Sun', theme: 'Soul Sunday', desc: 'Reflective content, testimonials, intentions' },
];

const CONTENT_IDEAS = [
  'Screen-record a live analysis with a singing bowl drone',
  '"Guess the chakra" poll using a frequency screenshot',
  'Before/after: frequency profile at start vs end of a sound bath',
  'Reel: 15-second hum challenge — what\'s YOUR frequency?',
  'Carousel: 7 chakras explained with their frequency ranges',
  'Story series: "Day in the life of a sound healer" featuring Harmonic Intake',
  'Duet/stitch with another healer comparing their profiles',
  'Behind-the-scenes: how the pitch detection algorithm works',
  'Client testimonial (with permission) about their frequency journey',
  'Infographic: "What your voice frequency says about you"',
];

export default function PromoCalendar() {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-text-primary mb-2">
        Content Calendar
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Posting schedule, weekly themes, and content ideas.
      </p>

      {/* Best Posting Times */}
      <Card className="mb-4">
        <h3 className="font-mono text-xs tracking-widest uppercase text-accent-primary mb-4">
          Best Posting Times
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-text-muted font-mono text-xs uppercase tracking-wider">Platform</th>
                <th className="text-left py-2 pr-4 text-text-muted font-mono text-xs uppercase tracking-wider">Peak</th>
                <th className="text-left py-2 pr-4 text-text-muted font-mono text-xs uppercase tracking-wider">Alt</th>
                <th className="text-left py-2 text-text-muted font-mono text-xs uppercase tracking-wider">TZ</th>
              </tr>
            </thead>
            <tbody>
              {POSTING_TIMES.map((row) => (
                <tr key={row.platform} className="border-b border-border/50">
                  <td className="py-2.5 pr-4 text-text-primary font-medium">{row.platform}</td>
                  <td className="py-2.5 pr-4 font-mono text-text-secondary">{row.best}</td>
                  <td className="py-2.5 pr-4 font-mono text-text-secondary">{row.alt}</td>
                  <td className="py-2.5 font-mono text-text-muted">{row.timezone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Weekly Content Themes */}
      <Card className="mb-4">
        <h3 className="font-mono text-xs tracking-widest uppercase text-accent-primary mb-4">
          Weekly Content Themes
        </h3>
        <div className="grid gap-2">
          {WEEKLY_THEMES.map((item) => (
            <div
              key={item.day}
              className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
            >
              <span className="font-mono text-xs text-accent-secondary w-8 shrink-0 pt-0.5">
                {item.day}
              </span>
              <div>
                <span className="text-sm text-text-primary font-medium">{item.theme}</span>
                <span className="text-sm text-text-muted ml-2">— {item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Content Ideas */}
      <Card>
        <h3 className="font-mono text-xs tracking-widest uppercase text-accent-primary mb-4">
          Content Ideas
        </h3>
        <ul className="space-y-2.5">
          {CONTENT_IDEAS.map((idea, i) => (
            <li key={i} className="flex gap-2 text-sm text-text-secondary">
              <span className="text-accent-primary shrink-0">*</span>
              {idea}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
