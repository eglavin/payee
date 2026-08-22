"use client";

import { useEffect, useState } from "react";

/**
 * Like useState, but persists to localStorage under `key`. Syncs from
 * storage in an effect after mount, to avoid an SSR hydration mismatch.
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      // Reading localStorage is impossible during SSR, so this can only
      // happen post-mount — not a derivable-at-render-time value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // localStorage unavailable or value corrupted — fall back to default
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable/full — persistence is best-effort
    }
  }, [key, value, hydrated]);

  return [value, setValue] as const;
}
