"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs an async function, tracks loading/data/error.
 *
 * The function is always stored in a ref, updated on every render, and
 * called through a null-safe guard. Refetch bumps an internal counter
 * that re-triggers the effect.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useAsync(() => api.get(), [deps]);
 */
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  // Store the latest fn in a ref. Update on every render — this is
  // cheap and it keeps fnRef.current in sync with the current closure.
  const fnRef = useRef(fn);
  fnRef.current = typeof fn === "function" ? fn : null;

  // Track whether the component is still mounted before setting state.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    const currentFn = fnRef.current;

    // Nothing to run — data is null, loading is done.
    if (typeof currentFn !== "function") {
      if (mountedRef.current) {
        setData(null);
        setLoading(false);
        setError(null);
      }
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await currentFn();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e);
        setData(null);
        setLoading(false);
      }
    }
  }, []);

  // Re-run whenever deps change (or the tick counter is bumped by refetch)
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  return { data, loading, error, refetch };
}
