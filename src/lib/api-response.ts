import "server-only";
import { NextResponse } from "next/server";
import { t, type ApiErrorCode } from "@/lib/translations";

/**
 * Every API error is `{ error: <code>, message: <Mongolian text> }`. The code is
 * stable for clients and tests; the message is safe to show to users as-is.
 */
export function apiError(code: ApiErrorCode, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    { error: code, message: t.apiErrors[code] },
    { status, headers: { "Cache-Control": "no-store", ...headers } }
  );
}

export function retryAfter(seconds: number): HeadersInit {
  return { "Retry-After": String(Math.max(1, Math.ceil(seconds))) };
}

/** Parses a JSON body, returning undefined (never throwing) on bad input. */
export async function readJson(request: Request, maxBytes = 8 * 1024): Promise<unknown> {
  try {
    const text = await request.text();
    if (text.length > maxBytes) {
      return undefined;
    }
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
