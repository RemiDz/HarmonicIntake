'use client';

import { motion } from 'framer-motion';

interface SpectrumBarProps {
  data: number[];
}

export function SpectrumBar({ data }: SpectrumBarProps) {
  return (
    <div className="flex h-16 items-end gap-[1px]" role="img" aria-label="Frequency spectrum">
      {data.map((value, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{
            background: `linear-gradient(to top, var(--color-accent-primary), var(--color-accent-secondary))`,
            opacity: 0.4 + value * 0.6,
          }}
          animate={{ height: `${Math.max(2, value * 100)}%` }}
          transition={{ duration: 0.08, ease: 'linear' }}
        />
      ))}
    </div>
  );
}
