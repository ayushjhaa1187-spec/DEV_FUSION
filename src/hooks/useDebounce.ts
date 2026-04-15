import { useEffect, useState } from 'react';

/**
 * useDebounce Hook
 * Standard compliance for Priority 3 & 9 auto-save features.
 */
export function useDebounce<T>(value: T, delay: number = 1500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
