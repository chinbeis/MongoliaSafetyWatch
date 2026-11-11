/**
 * Public (browser-visible) configuration. Each value must be referenced as a
 * literal `process.env.NEXT_PUBLIC_*` so Next.js can inline it at build time.
 * Never put a secret behind a NEXT_PUBLIC_ name.
 */

export const DEFAULT_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
/** Must match the provider behind NEXT_PUBLIC_MAP_STYLE_URL — change both together. */
export const DEFAULT_MAP_ATTRIBUTION = "© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors";

export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  mapStyleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_MAP_STYLE_URL,
  mapAttribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || DEFAULT_MAP_ATTRIBUTION,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
} as const;
