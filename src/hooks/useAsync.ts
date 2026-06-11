/**
 * Generic async data-fetching hook with loading/error/refetch states.
 * @module useAsync
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  setData: (data: T) => void;
}

/** Run an async function and track its loading/error/data state. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fnRef.current()
      .then((res) => {
        if (active) setData(res);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const cleanup = run();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, tick]);

  return { data, loading, error, refetch, setData };
}