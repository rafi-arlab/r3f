import { useState, useCallback, useRef, useEffect } from 'react';

const POUR_DURATION_MS = 4000;

/**
 * Fill-cup logic: start pour on demand, stop after a few seconds.
 * Calls onPourComplete when the pour finishes. Returns { isPouring, startFill }.
 */
export function useFillCup(options = {}) {
  const { onPourComplete } = options;
  const onPourCompleteRef = useRef(onPourComplete);
  onPourCompleteRef.current = onPourComplete;

  const [isPouring, setIsPouring] = useState(false);
  const timeoutRef = useRef(null);

  const startFill = useCallback(() => {
    if (isPouring) return;
    setIsPouring(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsPouring(false);
      timeoutRef.current = null;
      onPourCompleteRef.current?.();
    }, POUR_DURATION_MS);
  }, [isPouring]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { isPouring, startFill };
}
