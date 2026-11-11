"use client";

import { useSyncExternalStore } from "react";

type Kind = "local" | "session";

const listeners = new Set<() => void>();

function storage(kind: Kind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null; // blocked (private mode, sandboxed iframe…)
  }
}

function read(kind: Kind, key: string) {
  try {
    return storage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Writes (or removes, with null) a value and notifies every subscriber. Never throws. */
export function writeBrowserStorage(kind: Kind, key: string, value: string | null) {
  try {
    const target = storage(kind);
    if (value === null) target?.removeItem(key);
    else target?.setItem(key, value);
  } catch {
    // Storage full or blocked: callers must work without it.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Reads a browser-storage value reactively. Returns `undefined` during SSR
 * and hydration ("not known yet"), then the stored string or null.
 */
export function useBrowserStorage(kind: Kind, key: string): string | null | undefined {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      window.addEventListener("storage", onChange);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => read(kind, key),
    () => undefined
  );
}
