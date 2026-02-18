# 🎵 Harmonic Intake

**Real-time vocal frequency analysis for sound healers and wellness practitioners.**

Harmonic Intake creates a unique "frequency fingerprint" for each client. They hum into the microphone for 15 seconds, and the app instantly generates a personalised Frequency Profile with session recommendations.

🌐 **[harmonicintake.com](https://harmonicintake.com)** *(coming soon)*

---

## What It Does

A client hums a comfortable tone → the app analyses in real-time:

- **Fundamental Frequency** — their natural pitch in Hz
- **Musical Note** — with cents deviation from perfect pitch
- **Chakra Resonance** — which energy centre their voice aligns with
- **Overtone Series** — harmonics 2-8 with relative strength
- **Tonal Stability** — how consistently they hold their tone
- **Session Recommendations** — drone note, complementary intervals, instrument suggestions

Results can be emailed or copied to clipboard for practitioner records.

## Who It's For

- 🔔 **Sound Healers** — tailor instrument selection and drone notes to each client
- 🧠 **Psychotherapists** — non-verbal baseline assessment before/after sessions
- 🌬️ **Breathwork Facilitators** — track nervous system regulation through vocal stability
- 🎤 **Voice Coaches** — measure progress through overtone development
- 🎵 **Music Therapists** — frequency-based assessment tool

## Philosophy

- **Zero friction** — no accounts, no sign-up, no onboarding
- **Zero cost** — static site, free to host, free to use
- **Zero data stored** — nothing leaves the browser, no tracking, no analytics
- **Instant value** — open the app, hum, get insights

## Tech Stack

- Next.js 14 (static export)
- TypeScript
- Tailwind CSS
- Web Audio API
- Framer Motion
- Deployed on Vercel

## Getting Started

```bash
# Clone
git clone https://github.com/RemiDz/HarmonicIntake.git
cd HarmonicIntake

# Install
npm install

# Dev
npm run dev

# Build (static)
npm run build
```

## How It Works

The app uses the **Web Audio API** to capture microphone input and perform real-time analysis:

1. **Pitch Detection** — Autocorrelation algorithm with parabolic interpolation for sub-bin frequency accuracy
2. **Overtone Analysis** — FFT-based extraction of harmonics 2-8 relative to the fundamental
3. **Stability Measurement** — Coefficient of variation over a rolling 30-sample window
4. **Chakra Mapping** — Frequency ranges mapped to traditional chakra associations
5. **Recommendations** — Algorithmically generated drone notes, intervals, and instrument suggestions based on the vocal profile

All processing happens client-side in the browser. No audio is recorded, stored, or transmitted.

## Project Structure

```
src/
├── app/            # Next.js app router (single page)
├── components/
│   ├── screens/    # Idle, Countdown, Live, Result screens
│   ├── viz/        # Mandala, Spectrum, Overtone, Stability visualisations
│   ├── ui/         # Reusable UI components
│   └── share/      # Email and clipboard sharing
├── lib/
│   ├── audio/      # Pitch detection, overtone analysis, spectrum
│   ├── music/      # Note mapping, chakra mapping, intervals
│   └── profile/    # Profile builder and recommendations
├── hooks/          # Custom React hooks
└── __tests__/      # Unit tests
```

## Browser Support

- Chrome 80+ (recommended)
- Safari 14+ (iOS)
- Firefox 78+
- Edge 80+

Requires microphone access.

## Privacy

Harmonic Intake processes everything locally in your browser:

- ❌ No audio recording saved
- ❌ No data sent to any server
- ❌ No cookies or tracking
- ❌ No analytics
- ✅ Fully client-side processing
- ✅ Works offline after first load

## License

MIT

## Author

Built by [Remi](https://github.com/RemiDz) — sound healer & developer.

Part of the [NestorLab](https://nestorlab.app) ecosystem of sound healing tools.
