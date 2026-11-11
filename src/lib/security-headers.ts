/**
 * Security headers and Content-Security-Policy, applied to every route from
 * next.config.ts. Kept in a plain module (no Next imports) so it can be
 * unit-tested.
 *
 * script-src keeps 'unsafe-inline' because Next.js injects inline bootstrap
 * scripts into statically generated pages; a nonce would force every page to
 * render dynamically (no static/ISR). Revisit if pages become dynamic anyway.
 */

export interface CspOptions {
  mapStyleUrl: string;
  development: boolean;
}

function originOf(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function buildCsp({ mapStyleUrl, development }: CspOptions) {
  const tiles = originOf(mapStyleUrl);
  const turnstile = "https://challenges.cloudflare.com";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", turnstile, ...(development ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...(tiles ? [tiles] : [])],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", turnstile, ...(tiles ? [tiles] : []), ...(development ? ["ws:"] : [])],
    "worker-src": ["'self'", "blob:"],
    "child-src": ["'self'", "blob:"],
    "frame-src": [turnstile],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "manifest-src": ["'self'"],
  };

  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
  return development ? policy : `${policy}; upgrade-insecure-requests`;
}

export function securityHeaders(options: CspOptions & { cspReportOnly: boolean }) {
  return [
    {
      key: options.cspReportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
      value: buildCsp(options),
    },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
