import { describe, it, expect } from 'vitest';
import { frequencyToChakra } from '@/lib/music/chakra-mapping';

describe('frequencyToChakra', () => {
  it('maps low frequency to Root chakra', () => {
    const result = frequencyToChakra(100);
    expect(result.name).toBe('Root');
    expect(result.color).toBe('#E24B4B');
  });

  it('maps 150Hz to Sacral chakra', () => {
    const result = frequencyToChakra(150);
    expect(result.name).toBe('Sacral');
    expect(result.color).toBe('#F0913A');
  });

  it('maps 200Hz to Solar Plexus chakra', () => {
    const result = frequencyToChakra(200);
    expect(result.name).toBe('Solar Plexus');
    expect(result.color).toBe('#F5D547');
  });

  it('maps 250Hz to Heart chakra', () => {
    const result = frequencyToChakra(250);
    expect(result.name).toBe('Heart');
    expect(result.color).toBe('#5ABF7B');
  });

  it('maps 300Hz to Throat chakra', () => {
    const result = frequencyToChakra(300);
    expect(result.name).toBe('Throat');
    expect(result.color).toBe('#4FA8D6');
  });

  it('maps 400Hz to Third Eye chakra', () => {
    const result = frequencyToChakra(400);
    expect(result.name).toBe('Third Eye');
    expect(result.color).toBe('#7B6DB5');
  });

  it('maps 500Hz to Crown chakra', () => {
    const result = frequencyToChakra(500);
    expect(result.name).toBe('Crown');
    expect(result.color).toBe('#C77DBA');
  });

  // Boundary tests
  it('maps exact lower boundary of Sacral (130Hz)', () => {
    const result = frequencyToChakra(130);
    expect(result.name).toBe('Sacral');
  });

  it('maps just below Sacral boundary to Root (129Hz)', () => {
    const result = frequencyToChakra(129);
    expect(result.name).toBe('Root');
  });

  it('maps frequency below all ranges to Root', () => {
    const result = frequencyToChakra(30);
    expect(result.name).toBe('Root');
  });

  it('maps frequency above all ranges to Crown', () => {
    const result = frequencyToChakra(700);
    expect(result.name).toBe('Crown');
  });

  it('includes session intention text', () => {
    const result = frequencyToChakra(100);
    expect(result.intention).toBe('Grounding, safety & stability');
  });

  it('includes frequency range', () => {
    const result = frequencyToChakra(300);
    expect(result.range).toEqual([280, 350]);
  });
});
