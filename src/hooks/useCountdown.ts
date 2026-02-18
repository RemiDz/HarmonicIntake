'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useCountdown(from: number, onComplete: () => void) {
  const [count, setCount] = useState(from);
  const [isRunning, setIsRunning] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isRunning) return;

    if (count <= 0) {
      setIsRunning(false);
      onCompleteRef.current();
      return;
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, isRunning]);

  const start = useCallback(() => {
    setCount(from);
    setIsRunning(true);
  }, [from]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setCount(from);
  }, [from]);

  return { count, isRunning, start, reset };
}
