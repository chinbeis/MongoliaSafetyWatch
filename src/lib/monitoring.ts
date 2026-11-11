import "server-only";

/**
 * Operational alerts that a human should look at (e.g. the community-pin
 * circuit breaker tripping). Sentry picks these up when configured
 * (see instrumentation.ts); without Sentry they still land in the platform
 * logs. Never pass request bodies, IPs, tokens, or coordinates here.
 */
type AlertContext = Record<string, string | number | boolean>;

type AlertSink = (message: string, context: AlertContext) => void;

let sink: AlertSink | null = null;

export function setAlertSink(next: AlertSink | null) {
  sink = next;
}

export function reportAlert(message: string, context: AlertContext = {}) {
  console.error(`[alert] ${message}`, context);
  try {
    sink?.(message, context);
  } catch {
    // Monitoring must never break the request path.
  }
}
