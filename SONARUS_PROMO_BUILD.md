# Sonarus.app — Social Content Studio (/promo)

## Instructions for Claude Code

Build a hidden page at `/promo` within the existing Sonarus app that generates daily social media content for promoting the Harmonic Intake vocal frequency analysis tool. This page is a personal tool for the app creator — it is NOT linked anywhere in the app navigation, sitemap, or discoverable by users. Only accessible via direct URL: `sonarus.app/promo`

**IMPORTANT:** Before writing any code, read the existing codebase thoroughly — understand the project structure, routing setup, component patterns, styling approach, and any shared hooks/utilities. Match everything to the existing codebase conventions.

---

## STEP 1: UNDERSTAND THE CODEBASE

Before building anything:
1. Read the project's routing setup (App Router, React Router, etc.)
2. Identify the existing theme/design system (colours, fonts, component patterns)
3. Check what packages are already installed
4. Understand how the app currently works — it's a vocal frequency analysis tool where clients hum into a microphone and get a Frequency Profile with chakra resonance, overtone analysis, and session recommendations

---

## STEP 2: ROUTING

Add a new route at `/promo`. Do NOT add it to any navigation, header, footer, or sitemap. It must be invisible to regular users.

Follow the existing routing pattern in the codebase — don't introduce a new routing library if one already exists.

Code-split the promo page with lazy loading so it doesn't impact the main app's bundle size.

---

## STEP 3: PAGE LAYOUT & SECTIONS

The promo page has a dark theme matching the existing app. It contains these sections:

### Header
```
🎯 Sonarus — Content Studio
Today: [current date, nicely formatted]
"Your daily social media toolkit for Harmonic Intake"
```

### Section 1: Shareable Image Card Generator

Generate downloadable visual cards for social media. Use `html2canvas` (install if not present) to render DOM elements as PNG images.

**Card formats with toggle:**
- Instagram Post (1080×1080)
- Instagram Story (1080×1920)
- Twitter/X Post (1200×675)
- TikTok Cover (1080×1920)

**Card design (dark theme, matching app aesthetic — glass morphism, cosmic/sacred geometry feel):**

```
┌─────────────────────────────────────┐
│                                     │
│     🎵 Harmonic Intake              │
│     by Sonarus                      │
│                                     │
│     ┌───────────────────────┐       │
│     │   [VISUAL ELEMENT]    │       │
│     │   Chakra colour wheel │       │
│     │   or frequency wave   │       │
│     └───────────────────────┘       │
│                                     │
│     "Discover Your Unique           │
│      Frequency Fingerprint"         │
│                                     │
│     [Rotating headline from         │
│      hook templates below]          │
│                                     │
│     ─────────────────────────       │
│     🎵 Hum for 15 seconds.          │
│     See what your voice reveals.    │
│                                     │
│     sonarus.app                     │
│     Free · No signup required       │
│                                     │
└─────────────────────────────────────┘
```

**Visual elements to rotate between cards (use SVG or CSS):**
- 7-colour chakra spectrum bar
- Sound wave / frequency visualization graphic
- Mandala-style sacred geometry pattern
- Overtone series visualization (harmonic partials)

Each card should have a **Download PNG** button.

---

### Section 2: Opening Hooks (Attention Grabbers)

Generate rotating opening hooks organized by content angle. User clicks to select one, and it flows into all caption templates below.

**Hook Categories & Templates:**

#### 🔬 Science / Curiosity Hooks
1. "Your voice has a frequency fingerprint as unique as your DNA"
2. "What if 15 seconds of humming could reveal your energetic state?"
3. "Scientists have measured voice frequencies for decades. Now you can too — for free"
4. "Your fundamental frequency says more about you than you think"
5. "There's a reason certain sounds make you feel calm. Here's the science"

#### 🧘 Wellness / Healing Hooks
1. "Sound healers: stop guessing which frequencies your client needs"
2. "Before your next session, try this 15-second voice check"
3. "Your voice naturally gravitates to the chakra that needs attention"
4. "The frequency you hum most comfortably? That's your body talking"
5. "Every sound healer should know their client's vocal frequency profile"

#### 😮 Wow Factor Hooks
1. "I just discovered which chakra my voice resonates with. Mind blown"
2. "Hum into your phone for 15 seconds and watch what happens"
3. "This free app told me my vocal frequency, overtone series, and which singing bowl I need"
4. "My voice is a G#3 resonating at the Throat Chakra. What's yours?"
5. "I found out my voice produces 8 overtones. This is wild"

#### 🎯 Practitioner-Focused Hooks
1. "Client intake just got a frequency upgrade"
2. "Imagine starting every session with your client's exact vocal frequency profile"
3. "The most powerful tool I've added to my sound healing practice this year"
4. "How I personalise every sound bath using vocal frequency analysis"
5. "This replaces guesswork with data — and it's free"

#### 💡 Educational Hooks
1. "What are overtones and why does your voice produce them?"
2. "Your voice isn't one frequency — it's a symphony. Here's proof"
3. "The connection between your speaking pitch and your energy centres"
4. "Why do some singing bowls feel right and others don't? Your frequency profile explains it"
5. "Chakra frequencies aren't woo — here's the acoustic science"

Include a **Shuffle** button that randomly selects a hook, and a **Copy** button for each.

---

### Section 3: Ready-to-Copy Captions

Four platform-specific caption templates that incorporate the selected hook. Each has a **Copy** button with "Copied! ✓" feedback animation.

#### Instagram Caption
```
[Selected Hook]

Harmonic Intake analyses your voice in real-time:

🎵 Your fundamental frequency in Hz
🎵 Musical note + cents deviation
🎵 Which chakra your voice resonates with
🎵 Your overtone series (harmonics 2-8)
🎵 Tonal stability score
🎵 Personalised session recommendations

Just hum for 15 seconds. No signup. No download. Completely free.

Try it now → sonarus.app

Whether you're a sound healer profiling clients or just curious about your own frequency — this will surprise you.

#soundhealing #frequencyhealing #vocalanalysis #chakras #harmonicintake #overtones #frequencyfingerprint #soundtherapy #energyhealing #binauralbeats #crystalsingingbowls #soundbath #holistic #wellness #healingfrequencies #vibrationalhealing #soundjourney #meditation #resonance #harmonics
```

#### Twitter/X Caption
```
[Selected Hook]

Hum into your phone for 15 seconds. Get your:
→ Fundamental frequency
→ Chakra resonance
→ Overtone series
→ Session recommendations

Free. No signup.

sonarus.app

#soundhealing #frequencies #vocalanalysis
```

#### TikTok Caption
```
[Selected Hook]

POV: You just found out your voice resonates at your Heart Chakra 💚

Try it free → sonarus.app

#soundhealing #frequencies #chakra #vocalanalysis #overtones #fyp #healingtok #soundtherapy #frequency #vibration #energyhealing #wellness
```

#### WhatsApp / DM Share
```
Hey! I found this amazing free tool — you hum into your phone for 15 seconds and it shows you your exact vocal frequency, which chakra it resonates with, your overtone series, everything. It's genuinely fascinating.

Try it: sonarus.app

Let me know what frequency you get! 🎵
```

#### LinkedIn Caption
```
[Selected Hook]

In my sound healing practice, one of the biggest challenges has been personalising sessions to each client's unique needs.

Harmonic Intake solves this. Clients hum for 15 seconds, and the app analyses their vocal frequency in real-time — fundamental pitch, overtone series, chakra resonance, and tonal stability.

The result is a personalised Frequency Profile that helps me choose exactly the right instruments, frequencies, and techniques for each session.

I built this as a free, no-signup web tool because I believe every practitioner should have access to frequency-based client assessment.

Try it: sonarus.app

#SoundHealing #WellnessTechnology #HolisticHealth #FrequencyHealing #Innovation
```

---

### Section 4: Content Calendar & Posting Guide

Static but useful reference section:

**Best Posting Times:**
| Platform | Best Times (GMT) |
|----------|-----------------|
| Instagram | 11:00, 14:00, 19:00 |
| TikTok | 07:00, 12:00, 19:00 |
| Twitter/X | 09:00, 12:00, 17:00 |
| LinkedIn | 08:00, 12:00, 17:00 |

**Weekly Content Themes:**
- Monday: Educational (explain a frequency concept)
- Tuesday: Practitioner tips (how to use Harmonic Intake in practice)
- Wednesday: User testimonials / results showcase
- Thursday: Science / research (voice analysis, cymatics, acoustic science)
- Friday: Community engagement (poll: "What chakra does your voice resonate with?")
- Saturday: Behind the scenes (building the app, sound healing journey)
- Sunday: Wellness / reflection (gentle, inspirational tone)

**Content Ideas Based on App Features:**
- "What your overtone series reveals about your voice"
- "The difference between your speaking and humming frequency"
- "Why your voice gravitates to certain notes"
- "Chakra frequency mapping explained"
- "How sound healers use vocal frequency profiling"
- "Your voice's tonal stability — what it means"
- Screen recording of someone using the app (first hum → profile reveal)
- Before/after: different emotional states producing different frequency profiles
- Comparison: morning voice vs evening voice frequency shift

---

### Section 5: Hashtag Sets

Pre-built hashtag groups the user can copy with one click:

**Core Set (use every post):**
```
#soundhealing #frequencyhealing #vocalanalysis #harmonicintake #sonarus
```

**Extended Healing Set:**
```
#soundhealing #soundtherapy #soundbath #healingfrequencies #vibrationalhealing #energyhealing #frequencymedicine #soundjourney #healingsounds #resonancehealing
```

**Chakra Set:**
```
#chakras #chakrahealing #chakrabalancing #rootchakra #sacralchakra #solarplexus #heartchakra #throatchakra #thirdeyechakra #crownchakra
```

**Science Set:**
```
#acoustics #harmonics #overtones #frequencies #cymatics #soundscience #voiceanalysis #bioacoustics #resonance #waveform
```

**Practitioner Set:**
```
#soundhealer #soundhealerlife #holisticpractitioner #wellnesspractitioner #soundhealingtools #clientintake #sessionprep #healingpractice
```

**Instruments Set:**
```
#singingbowls #crystalsingingbowls #gong #tuningforks #monochord #didgeridoo #soundhealinginstruments #tibetanbowls
```

**Trending / Discovery Set:**
```
#fyp #healingtok #spiritualtok #wellnesstok #holistichealth #alternativehealing #mindfulness #meditation #wellness #selfcare
```

Each set has a **Copy** button.

---

## STEP 4: STYLING

- Match the existing app's design system exactly — colours, fonts, border radius, spacing
- Use the app's existing glass morphism / cosmic aesthetic
- Dark theme throughout
- Cards should feel premium — subtle gradients, glow effects, sacred geometry background patterns
- All buttons should have hover states and click feedback
- Copy buttons: show "Copied! ✓" for 2 seconds then reset
- Download buttons: show brief loading state while html2canvas renders
- Responsive layout — works on desktop (primary use) but also mobile

---

## STEP 5: TECHNICAL REQUIREMENTS

### Dependencies
- `html2canvas` — for rendering cards as downloadable PNGs (install if not present)
- All other deps should already exist in the project

### Code Quality
- TypeScript throughout (match existing codebase)
- Code-split with React.lazy() — promo page should not affect main app bundle
- No new API calls — this page uses static content templates, not live data
- All text content lives in the component files (no external CMS needed)
- Clean component structure: `PromoPage.tsx` (main), `PromoCards.tsx` (image cards), `PromoCaptions.tsx` (caption templates), `PromoHashtags.tsx` (hashtag sets)

### File Structure (suggested, adapt to existing patterns)
```
src/
  components/
    promo/
      PromoPage.tsx         — Main page layout
      PromoCards.tsx         — Shareable image card generator
      PromoCaptions.tsx      — Platform-specific captions
      PromoHooks.tsx         — Opening hook selector
      PromoCalendar.tsx      — Content calendar & posting guide
      PromoHashtags.tsx      — Hashtag set manager
```

---

## STEP 6: VERIFY

After building:
1. Run `npm run build` — ensure zero errors
2. Visit `/promo` in dev server — all sections render
3. Test card download — PNG saves correctly at specified dimensions
4. Test all copy buttons — clipboard works with feedback
5. Verify `/promo` is NOT linked from any navigation component
6. Verify the main app still works perfectly — no regressions

---

## CRITICAL NOTES

- This is a **content generation tool for the app creator**, not a user-facing feature
- The page should feel like a professional content studio
- All social copy should position Harmonic Intake as a free, professional-grade tool
- Target audience for the social posts: sound healers, holistic practitioners, wellness enthusiasts, frequency/vibration curious people
- The app URL in all content is: **sonarus.app**
- The tool name is: **Harmonic Intake**
- Key selling points to weave into content: free, no signup, works in browser, real-time analysis, professional-grade, unique frequency fingerprint
