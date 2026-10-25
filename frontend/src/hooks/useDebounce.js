import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value by a specified delay
 * @template T
 * @param {T} value - The input value to debounce
 * @param {number} delay - The delay in milliseconds (default: 500ms)
 * @returns {T} - The debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
