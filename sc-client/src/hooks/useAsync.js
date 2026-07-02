/**
 * Generic async data-fetching hook with loading/error/refetch states.
 * Migrated from useAsync.ts — TypeScript generics and interfaces removed.
 * @module useAsync
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Run an async function and track its loading / error / data state.
 *
 * @param {() => Promise<any>} fn  - Async factory function that returns the data.
 * @param {any[]} deps             - Dependency array (like useEffect deps).
 * @returns {{ data, loading, error, refetch, setData }}
 */
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fnRef
      .current()
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
