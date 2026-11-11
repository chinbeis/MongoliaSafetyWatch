import type { Instrumentation } from "next";

/**
 * Server-side error reporting with Sentry, enabled only when SENTRY_DSN is
 * set. Privacy: no user info, IP, cookies, headers, bodies or query strings
 * are collected (dataCollection), and scrubEvent strips them again before
 * sending as a second line of defence. There is no client-side Sentry.
 */
export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  if (process.env.NEXT_RUNTIME !== "nodejs" && process.env.NEXT_RUNTIME !== "edge") return;

  const Sentry = await import("@sentry/nextjs");
  const { scrubEvent } = await import("@/lib/sentry-scrub");

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // Sentry v11 replaces `sendDefaultPii` with per-category controls: collect none of it.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    tracesSampleRate: 0.02,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
    beforeBreadcrumb(breadcrumb) {
      // HTTP breadcrumbs can carry URLs with query strings; keep only the path.
      if (breadcrumb.data && typeof breadcrumb.data.url === "string") {
        breadcrumb.data.url = breadcrumb.data.url.split("?")[0];
      }
      return breadcrumb;
    },
  });

  const { setAlertSink, setErrorSink } = await import("@/lib/monitoring");
  setErrorSink((error, context) => {
    Sentry.captureException(error, { tags: { where: String(context.where ?? "unknown") } });
  });
  setAlertSink((message, context) => {
    Sentry.captureMessage(message, { level: "warning", extra: context, tags: { alert: "true" } });
  });
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
