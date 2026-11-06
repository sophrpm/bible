import { useEffect, useState } from 'react';

/** React's stable setter also accepts functional updates, avoiding stale preference state. */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null') ?? initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Storage may be unavailable or full; keep the current session usable.
      console.warn(`No se pudo guardar la preferencia ${key}.`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
