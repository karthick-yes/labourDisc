"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// Keeps an unsent form in localStorage so a dropped connection or a closed tab
// doesn't lose a half-entered worker or need. Per-device convenience only.

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

/**
 * The draft saved on this phone when the page opened (null on the server and
 * when there is none). Read once, so it doesn't flip while the user types.
 */
export function useInitialDraft<T>(key: string): T | null {
  const snapshot = useRef<string | null | undefined>(undefined);
  const raw = useSyncExternalStore(
    () => () => {},
    () => {
      if (snapshot.current === undefined) snapshot.current = read(key);
      return snapshot.current;
    },
    () => null,
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Saves `value` under `key` (debounced) while `enabled`, after the first edit. */
export function useDraftSaver<T>(key: string, value: T, enabled: boolean) {
  const first = useRef(true);
  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage full or blocked */
      }
    }, 400);
    return () => clearTimeout(id);
  }, [key, value, enabled]);
}
