"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query. The server snapshot is `false`, so the
 * first paint uses the mobile layout and switches after hydration without a
 * hydration mismatch.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
