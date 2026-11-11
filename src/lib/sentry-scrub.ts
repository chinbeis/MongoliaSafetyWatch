/**
 * Removes anything that could identify a visitor or a pin location from a
 * Sentry event: request body, cookies, headers, query strings, user, IP, and
 * SQL parameters embedded in database error messages.
 */
type ScrubbableEvent = {
  message?: string;
  request?: { url?: string; data?: unknown; cookies?: unknown; headers?: unknown; query_string?: unknown; env?: unknown };
  user?: unknown;
  exception?: { values?: Array<{ value?: string }> };
};

// Drizzle errors read "Failed query: <sql>\nparams: <values>".
const SQL_PARAMS = /params:[\s\S]*$/i;

export function redactSqlParams(text: string) {
  return text.replace(SQL_PARAMS, "params: [redacted]");
}

export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
    delete event.request.env;
    if (typeof event.request.url === "string") {
      event.request.url = event.request.url.split("?")[0];
    }
  }
  delete event.user;
  if (typeof event.message === "string") {
    event.message = redactSqlParams(event.message);
  }
  for (const value of event.exception?.values ?? []) {
    if (typeof value.value === "string") value.value = redactSqlParams(value.value);
  }
  return event;
}
