# EMAIL & SHARE UPDATE — Harmonic Intake

## Overview

The current email output is too technical — Hz values, cents, harmonic numbers. The target audience (sound healers, holistic practitioners, and their clients) need warm, human-readable language with visual presentation. This update replaces the plain text email with a beautiful HTML email and rewrites all copy to be accessible to someone with zero knowledge of frequencies or music theory.

**Goal:** The email should feel like receiving a personalised wellness insight — not a lab report.

---

## Key Principle: Translate Everything to Feeling

Every technical metric must have a human translation:

| Technical | Human Translation |
|-----------|-------------------|
| 127.3 Hz | "Your voice naturally rests at a deep, grounding tone" |
| Note: B2 | "Your natural tone is B — associated with stillness and inner listening" |
| +12 cents sharp | (Don't mention cents at all in the email) |
| Chakra: Heart | "Your voice resonates most strongly with the Heart centre — the space of compassion, love, and connection" |
| Stability: 78% | "Your tone was steady and centred — a sign of calm presence" |
| Overtone Richness: 65% | "Your voice carries rich, layered harmonics — a naturally resonant quality" |
| Perfect 5th: E3 | "Complementary tone for expansion: E" |
| Minor 3rd: D3 | "Complementary tone for emotional release: D" |

### Stability Descriptions (replace percentages)
- **> 80%:** "Your tone was very steady and centred — reflecting a calm, grounded presence"
- **60-80%:** "Your tone was mostly steady with natural variation — reflecting an open, adaptive state"
- **40-60%:** "Your tone had moderate movement — this can reflect emotional processing or energetic shifting"
- **< 40%:** "Your tone was quite fluid and shifting — this often reflects a period of change or emotional movement"

### Overtone Richness Descriptions
- **> 60%:** "Your voice carries rich, layered harmonics — a naturally resonant and expressive quality"
- **35-60%:** "Your voice has a balanced harmonic presence — clear and centred"
- **< 35%:** "Your voice has a pure, focused quality — like a clear bell. Instruments with rich harmonics can beautifully complement this"

### Chakra Descriptions (expanded for email)
- **Root:** "Your voice connects deeply with the Root — the foundation of safety, grounding, and physical presence. This suggests your body is calling for stability and connection to the earth."
- **Sacral:** "Your voice resonates with the Sacral centre — the seat of creativity, emotion, and sensual flow. This suggests an openness to feeling and creative expression."
- **Solar Plexus:** "Your voice aligns with the Solar Plexus — your centre of confidence, personal power, and will. This reflects strength and determination in your energy."
- **Heart:** "Your voice resonates with the Heart centre — the space of love, compassion, and deep connection. This suggests openness and emotional warmth."
- **Throat:** "Your voice connects with the Throat centre — the gateway of expression, truth, and authentic communication. Your voice is naturally aligned with its own home."
- **Third Eye:** "Your voice resonates with the Third Eye — the seat of intuition, insight, and inner vision. This suggests a naturally contemplative and perceptive energy."
- **Crown:** "Your voice reaches toward the Crown — the centre of transcendence, unity, and spiritual connection. This reflects an elevated, expansive quality in your energy."

---

## HTML Email Template

The email should be sent as an HTML email (via mailto: with HTML body, or better — rendered as a shareable/downloadable card). Since mailto: doesn't reliably support HTML across all clients, implement TWO share options:

### Option 1: "Email Profile" 
Opens mailto: with a **clean, well-formatted plain text** version (but written in human language, not technical). Keep it warm and readable.

### Option 2: "Save as Image" (NEW — replaces "Copy Text")
Generates a shareable card image (PNG) using HTML Canvas or dom-to-image that the practitioner can save and send via WhatsApp, iMessage, Instagram DM, etc. This is how new-age practitioners actually share — visual, not text.

---

## Email Plain Text Format (Human-Friendly)

```
✦ HARMONIC INTAKE — Your Frequency Profile
{date}

Hello,

Here are the insights from your vocal frequency analysis.

YOUR NATURAL TONE
Your voice naturally rests at {note} — a {low/mid/high} tone at {freq} Hz.
{chakra_description}

YOUR VOICE QUALITY  
{stability_description}
{richness_description}

SESSION GUIDANCE
Your practitioner can use these insights to personalise your session:

  ◆ Grounding tone: {note} — matches your natural frequency for deep resonance
  ◆ Expansion tone: {fifth_note} — opens and uplifts
  ◆ Release tone: {third_note} — supports emotional letting go

{instrument_suggestion}

FOCUS FOR YOUR SESSION
{chakra_intention}

—
With resonance,
Harmonic Intake
harmonicintake.com
```

### Frequency Range Descriptions (for "low/mid/high" tone)
- **60-150 Hz:** "deep, grounding"
- **150-250 Hz:** "warm, centred"  
- **250-350 Hz:** "clear, expressive"
- **350-450 Hz:** "bright, elevated"
- **450-600 Hz:** "light, expansive"

### Instrument Suggestions (Human Language)
- **Rich voice (>50%):** "Your voice has natural warmth — singing bowls, monochord, and sustained tones will resonate beautifully with your frequency."
- **Thinner voice (≤50%):** "Instruments with rich overtones like gongs, didgeridoo, and Tibetan bowls will complement and enrich your natural tone."

---

## Shareable Profile Card (Save as Image)

Generate a visually beautiful card (approximately 1080×1350px — Instagram story friendly) that includes:

### Layout
```
┌─────────────────────────────────┐
│                                 │
│     ✦ HARMONIC INTAKE           │
│     Frequency Profile           │
│     {date}                      │
│                                 │
│     ┌─────────────────────┐     │
│     │                     │     │
│     │   MANDALA SVG       │     │
│     │   (simplified)      │     │
│     │                     │     │
│     └─────────────────────┘     │
│                                 │
│     {NOTE}{OCTAVE}              │
│     {freq} Hz                   │
│                                 │
│     ● {Chakra Name}             │
│     {short chakra description}  │
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Stab. │ │Rich. │ │Tone  │    │
│  │{val} │ │{val} │ │{desc}│    │
│  └──────┘ └──────┘ └──────┘    │
│                                 │
│     SESSION GUIDANCE            │
│     ◆ Ground: {note}            │
│     ◆ Expand: {fifth}           │
│     ◆ Release: {third}          │
│                                 │
│     harmonicintake.com          │
│                                 │
└─────────────────────────────────┘
```

### Card Design
- Background: deep ocean gradient matching the app (dark, atmospheric)
- Chakra colour as accent throughout the card
- Mandala: simplified version (just the rings and centre, no animation obviously)
- Typography: same as app (Cormorant Garamond + DM Mono)
- Include a subtle watermark/branding at bottom

### Implementation
Use `html2canvas` library or the native Canvas API:
1. Render the profile card as a hidden DOM element
2. Convert to canvas → PNG blob
3. Trigger download or use Web Share API if available (for mobile share sheets)

```bash
npm install html2canvas
```

Or use the Canvas API directly to draw the card (more reliable, no DOM dependency).

### Share Button Behaviour
- **On mobile (if Web Share API available):** Open native share sheet with the image
- **On desktop / fallback:** Download the PNG file

---

## Updated Result Screen Share Section

Replace the current two buttons with three:

```
┌─────────────────────────────────────────┐
│  [✉ Email Summary]  [📱 Save Card]     │
│                                         │
│  [↺ New Analysis]                       │
└─────────────────────────────────────────┘
```

1. **✉ Email Summary** — opens mailto: with human-friendly plain text
2. **📱 Save Card** — generates and downloads/shares the visual profile card
3. **↺ New Analysis** — reset (same as current)

Remove "Copy Text" — the visual card replaces it as the sharing method.

---

## Implementation Notes for Claude Code

1. Create a new file `src/lib/profile/humanize.ts` that contains all the translation functions (frequency → human description, stability → human description, etc.)
2. Create `src/components/share/ProfileCard.tsx` — the visual card component (rendered off-screen, captured to image)
3. Update `src/components/share/EmailProfile.tsx` — use the humanized text
4. Remove `CopyProfile.tsx` — replaced by the card
5. Add `html2canvas` as a dependency OR implement with Canvas API
6. The card component should accept a `FrequencyProfile` and render the full visual
7. Test the mailto: on both desktop and mobile
8. Test image generation quality — it must look sharp, not blurry

---

## Tone of Voice Guidelines

The entire app's written communication should follow these principles:

- **Warm, not clinical** — "your voice resonates with" not "frequency detected at"
- **Inviting, not instructive** — "this suggests" not "this means"
- **Sensory language** — "deep, grounding tone" not "low frequency"
- **No jargon without translation** — if Hz is mentioned, always pair it with a feeling-word
- **Empowering** — the profile should make the client feel seen and understood, not measured
- **Gender-neutral** — avoid assumptions about voice type
- **Inclusive** — accessible language, no assumptions about spiritual beliefs

The Hz value can appear small/subtle for practitioners who want precision, but the primary communication should always be the human description.
