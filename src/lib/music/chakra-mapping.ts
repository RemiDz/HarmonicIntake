import type { ChakraInfo } from '@/lib/types';

const CHAKRAS: ChakraInfo[] = [
  {
    name: 'Root',
    note: 'C',
    freq: 256,
    color: '#E24B4B',
    range: [60, 130],
    intention: 'Grounding, safety & stability',
  },
  {
    name: 'Sacral',
    note: 'D',
    freq: 288,
    color: '#F0913A',
    range: [130, 175],
    intention: 'Creativity, emotion & flow',
  },
  {
    name: 'Solar Plexus',
    note: 'E',
    freq: 320,
    color: '#F5D547',
    range: [175, 225],
    intention: 'Confidence, will & personal power',
  },
  {
    name: 'Heart',
    note: 'F',
    freq: 341,
    color: '#5ABF7B',
    range: [225, 280],
    intention: 'Love, compassion & connection',
  },
  {
    name: 'Throat',
    note: 'G',
    freq: 384,
    color: '#4FA8D6',
    range: [280, 350],
    intention: 'Expression, truth & communication',
  },
  {
    name: 'Third Eye',
    note: 'A',
    freq: 426,
    color: '#7B6DB5',
    range: [350, 450],
    intention: 'Intuition, insight & awareness',
  },
  {
    name: 'Crown',
    note: 'B',
    freq: 480,
    color: '#C77DBA',
    range: [450, 600],
    intention: 'Transcendence, unity & spirit',
  },
];

/**
 * Map a frequency to the corresponding chakra based on frequency ranges.
 * Returns Root chakra as default if frequency is below all ranges.
 */
export function frequencyToChakra(hz: number): ChakraInfo {
  for (const chakra of CHAKRAS) {
    if (hz >= chakra.range[0] && hz < chakra.range[1]) {
      return chakra;
    }
  }

  // Below lowest range → Root; above highest range → Crown
  if (hz < CHAKRAS[0].range[0]) {
    return CHAKRAS[0];
  }
  return CHAKRAS[CHAKRAS.length - 1];
}

export { CHAKRAS };
