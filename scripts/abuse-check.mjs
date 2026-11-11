#!/usr/bin/env node
/**
 * Scripted abuse test for a DEPLOYED preview (LAUNCH_PLAN §9). It creates
 * real pins, so point it at a preview that uses the Neon dev branch — never
 * at production.
 *
 *   node scripts/abuse-check.mjs https://<preview>.vercel.app
 *
 * Preview should use Cloudflare's Turnstile *test* keys (always-pass
 * secret), so this script can send the documented dummy token. With test
 * keys Cloudflare does not reject replays — replay protection for real
 * Turnstile is Cloudflare's; for the math fallback it is covered by
 * test/api/community-reports.test.ts.
 *
 * Exit code 0 = every check passed.
 */

const base = (process.argv[2] ?? "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(base)) {
  console.error("usage: node scripts/abuse-check.mjs <base-url>");
  process.exit(2);
}
if (/catchpred\.mn/.test(base) && !process.argv.includes("--i-know-this-is-production")) {
  console.error("Refusing to run against what looks like production. Use a preview URL.");
  process.exit(2);
}

const TURNSTILE_TEST_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

async function json(path, init) {
  const response = await fetch(`${base}${path}`, init);
  let body = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON
  }
  return { status: response.status, body };
}

async function humanFields() {
  const { body } = await json("/api/community-reports/challenge", { cache: "no-store" });
  if (body?.readonly) throw new Error("community map is read-only on this deployment");
  if (body?.mode === "turnstile") return { turnstileToken: TURNSTILE_TEST_TOKEN };
  const [left, right] = String(body?.prompt ?? "").match(/\d+/g)?.map(Number) ?? [0, 0];
  return { captchaToken: body?.token, captchaAnswer: left + right };
}

const pin = { category: "other", latitude: 47.9188, longitude: 106.9173, radiusMeters: 500 };

async function main() {
  const health = await json("/api/health");
  check("health endpoint is green", health.status === 200 && health.body?.ok === true, JSON.stringify(health.body));

  // 20 rapid creates from one client: at most 3 may succeed.
  const attempts = await Promise.all(
    Array.from({ length: 20 }, async () => {
      const fields = await humanFields();
      return json("/api/community-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pin, ...fields }),
      });
    })
  );
  const created = attempts.filter((a) => a.status === 201);
  const limited = attempts.filter((a) => a.status === 429);
  check("20 rapid POSTs → at most 3 accepted", created.length <= 3, `${created.length} created, ${limited.length} rate-limited`);

  const report = created[0]?.body?.report;
  if (report) {
    const decimals = (v) => (String(v).split(".")[1] ?? "").length;
    check(
      "stored pin is snapped (≤ 4 decimals, radius ≥ 250)",
      decimals(report.latitude) <= 4 && decimals(report.longitude) <= 4 && report.radiusMeters >= 250
    );

    // One client flagging repeatedly must not hide the pin.
    for (let i = 0; i < 3; i += 1) {
      const fields = await humanFields();
      await json(`/api/community-reports/${report.id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields.turnstileToken ? { turnstileToken: fields.turnstileToken } : {}),
      });
    }
    const list = await json(`/api/community-reports?nocache=${Date.now()}`);
    const stillVisible = (list.body?.reports ?? []).some((r) => r.id === report.id);
    check("one client flagging 3× does not hide a pin", stillVisible);

    const leaked = (list.body?.reports ?? []).some((r) =>
      Object.keys(r).some((key) => !["id", "category", "latitude", "longitude", "radiusMeters", "createdAt"].includes(key))
    );
    check("public list exposes no internal fields", !leaked);
  } else {
    check("could create at least one pin to test flagging", false, "no 201 — check Turnstile test keys / read-only flag");
  }

  const badFlag = await json("/api/community-reports/not-a-uuid/flag", { method: "POST" });
  check("non-UUID flag → 400", badFlag.status === 400, `got ${badFlag.status}`);

  const admin = await json("/api/admin/reports");
  check("admin API refuses requests without a token", admin.status === 401 || admin.status === 404, `got ${admin.status}`);

  console.log("\nClean up: remove the test pins from /admin (they are in the 'other' category at Sükhbaatar Square).");
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
