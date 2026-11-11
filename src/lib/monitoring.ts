import "server-only";

/**
 * Operational alerts that a human should look at (e.g. the community-pin
 * circuit breaker tripping). Sentry picks these up when configured
 * (see instrumentation.ts); without Sentry they still land in the platform
 * logs. Never pass request bodies, IPs, tokens, or coordinates here.
 */
type AlertContext = Record<string, string | number | boolean>;

type AlertSink = (message: string, context: AlertContext) => void;
type ErrorSink = (error: unknown, context: AlertContext) => void;

let sink: AlertSink | null = null;
let errorSink: ErrorSink | null = null;

export function setAlertSink(next: AlertSink | null) {
  sink = next;
}

export function setErrorSink(next: ErrorSink | null) {
  errorSink = next;
}

/**
 * For errors a route handler catches and turns into a 500: they never reach
 * Next's onRequestError, so forward them explicitly. `where` is a short,
 * static label (e.g. "community-reports.create") — no user data.
 */
export function reportError(where: string, error: unknown) {
  console.error(`[error] ${where}`, error);
  try {
    errorSink?.(error, { where });
  } catch {
    // Monitoring must never break the request path.
  }
}

export function reportAlert(message: string, context: AlertContext = {}) {
  console.error(`[alert] ${message}`, context);
  try {
    sink?.(message, context);
  } catch {
    // Monitoring must never break the request path.
  }
}
