import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Mono } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

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

export const viewport: Viewport = {
  themeColor: '#050c15',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://harmonicintake.com'),
  title: 'Harmonic Intake — Vocal Frequency Analysis for Practitioners',
  description:
    'Discover your unique frequency profile in 15 seconds. Real-time vocal analysis with 10 biomarkers, chakra energy mapping, and personalised sound healing guidance. Free, no sign-up, runs in your browser.',
  keywords: [
    'sound healing',
    'frequency analysis',
    'vocal profiling',
    'chakra',
    'overtones',
    'sound therapy',
    'wellness tool',
    'voice analysis',
    'binaural beats',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Harmonic Intake',
  },
  openGraph: {
    title: 'Harmonic Intake — Vocal Frequency Analysis',
    description:
      'Discover your unique frequency profile in 15 seconds. Real-time vocal analysis for sound healing practitioners.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Harmonic Intake — Discover your frequency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harmonic Intake — Vocal Frequency Analysis',
    description:
      'Discover your unique frequency profile in 15 seconds. Real-time vocal analysis for sound healing practitioners.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmMono.variable}`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
