/**
 * Public (browser-visible) configuration. Each value must be referenced as a
 * literal `process.env.NEXT_PUBLIC_*` so Next.js can inline it at build time.
 * Never put a secret behind a NEXT_PUBLIC_ name.
 */

export const DEFAULT_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  mapStyleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_MAP_STYLE_URL,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
} as const;
