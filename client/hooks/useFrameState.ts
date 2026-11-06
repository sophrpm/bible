import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';

/** Coalesce high-frequency gesture/slider updates; the latest value wins within each frame. */
export function useFrameState<T>(initial: T) {
  const [value, setValue] = useState(initial);
  const pending = useRef(initial);
  const frame = useRef<number | null>(null);
  const update = useCallback((next: SetStateAction<T>) => {
    pending.current =
      typeof next === 'function' ? (next as (previous: T) => T)(pending.current) : next;
    if (frame.current !== null) {
      return;
    }
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      setValue(pending.current);
    });
  }, []);
  useEffect(
    () => () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    },
    [],
  );
  return [value, update] as const;
}
