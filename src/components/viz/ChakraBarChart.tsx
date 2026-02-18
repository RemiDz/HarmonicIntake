'use client';

import { motion } from 'framer-motion';
import type { ChakraScore } from '@/lib/types';

interface ChakraBarChartProps {
  scores: ChakraScore[];
}

export function ChakraBarChart({ scores }: ChakraBarChartProps) {
  // Display Crown at top, Root at bottom
  const reversed = [...scores].reverse();

  return (
    <div className="space-y-2" role="img" aria-label="Chakra score breakdown">
      {reversed.map((score, i) => (
        <div key={score.name} className="flex items-center gap-2">
          {/* Chakra dot */}
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: score.color }}
          />
          {/* Label */}
          <span className="w-20 text-right font-mono text-[10px] text-text-muted truncate">
            {score.name}
          </span>
          {/* Bar */}
          <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-bg-mid">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: score.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, score.score)}%` }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
            />
          </div>
          {/* Percentage */}
          <span className="w-8 text-right font-mono text-[10px] text-text-secondary">
            {score.score}%
          </span>
        </div>
      ))}
    </div>
  );
}
