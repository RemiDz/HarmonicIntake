import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Mono } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Harmonic Intake — Vocal Frequency Analysis for Practitioners',
  description:
    'Real-time vocal frequency profiling tool for sound healers, psychotherapists, and wellness practitioners. Analyse fundamental frequency, overtones, chakra resonance, and get personalised session recommendations. Free, no sign-up, runs in your browser.',
  keywords: [
    'sound healing',
    'frequency analysis',
    'vocal profiling',
    'chakra',
    'overtones',
    'sound therapy',
    'wellness tool',
  ],
  openGraph: {
    title: 'Harmonic Intake',
    description: "Discover your client's frequency fingerprint",
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
