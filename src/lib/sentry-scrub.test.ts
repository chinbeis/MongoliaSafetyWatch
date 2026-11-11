import { describe, expect, it } from "vitest";
import { scrubEvent } from "./sentry-scrub";

describe("scrubEvent", () => {
  it("strips body, headers, cookies, query and user", () => {
    const event = scrubEvent({
      request: {
        url: "https://example.mn/api/community-reports?x=1",
        data: '{"latitude":47.9}',
        headers: { "x-real-ip": "198.51.100.7", authorization: "Bearer secret" },
        cookies: { a: "b" },
        query_string: "x=1",
      },
      user: { ip_address: "198.51.100.7" },
    });
    expect(event).toEqual({ request: { url: "https://example.mn/api/community-reports" } });
  });
});

describe("SQL parameter redaction", () => {
  it("removes bound values from database errors", () => {
    const event = scrubEvent({
      exception: {
        values: [{ value: 'Failed query: insert into "community_reports" ("latitude") values ($1)\nparams: 47.9188,106.9173,voterkey' }],
      },
    });
    expect(event.exception?.values?.[0].value).toBe(
      'Failed query: insert into "community_reports" ("latitude") values ($1)\nparams: [redacted]'
    );
  });
});
