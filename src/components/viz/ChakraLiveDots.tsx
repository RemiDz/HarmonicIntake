'use client';

import type { ChakraScore } from '@/lib/types';

interface ChakraLiveDotsProps {
  scores: ChakraScore[];
}

export function ChakraLiveDots({ scores }: ChakraLiveDotsProps) {
  // Display Crown at top, Root at bottom
  const reversed = [...scores].reverse();

  return (
    <div
      className="flex flex-col items-center gap-1.5"
      role="img"
      aria-label="Live chakra indicators"
    >
      {reversed.map((score) => {
        const opacity = 0.2 + (score.score / 100) * 0.8;
        const size = 6 + (score.score / 100) * 6;

        return (
          <div
            key={score.name}
            className="rounded-full transition-all duration-200"
            style={{
              backgroundColor: score.color,
              opacity,
              width: `${size}px`,
              height: `${size}px`,
              boxShadow: score.score > 40 ? `0 0 ${size}px ${score.color}40` : 'none',
            }}
            title={`${score.name}: ${score.score}%`}
          />
        );
      })}
    </div>
  );
}
