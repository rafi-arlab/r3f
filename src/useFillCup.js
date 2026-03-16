import { useState, useCallback, useRef, useEffect } from 'react';

const POUR_DURATION_MS = 4000;

/**
 * Fill-cup logic: start pour on demand, stop after a few seconds.
 * Returns { isPouring, startFill }.
 */
export function useFillCup() {
  const [isPouring, setIsPouring] = useState(false);
  const timeoutRef = useRef(null);

  const startFill = useCallback(() => {
    if (isPouring) return;
    setIsPouring(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsPouring(false);
      timeoutRef.current = null;
    }, POUR_DURATION_MS);
  }, [isPouring]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { isPouring, startFill };
}
