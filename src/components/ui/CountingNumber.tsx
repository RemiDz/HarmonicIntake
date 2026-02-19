'use client';

import { useState, useEffect, useRef } from 'react';

interface CountingNumberProps {
  /** Target value to count up to */
  value: number;
  /** Milliseconds before animation starts (default 0) */
  delay?: number;
  /** Animation duration in ms (default 900) */
  duration?: number;
  /** Number of decimal places (default 0) */
  decimals?: number;
  /** Suffix appended after the number (e.g. "%" or " Hz") */
  suffix?: string;
  /** Prefix prepended before the number (e.g. "+" for positive cents) */
  prefix?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountingNumber({
  value,
  delay = 0,
  duration = 900,
  decimals = 0,
  suffix = '',
  prefix = '',
}: CountingNumberProps) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Only animate once on mount
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const timeout = setTimeout(() => {
      const start = performance.now();
      let raf: number;
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = easeOutCubic(t);
        setDisplay(value * eased);
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setDisplay(value);
        }
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay, duration]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  );
}
