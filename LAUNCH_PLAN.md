# CatchPred — Public Launch Plan

Execution brief for the implementing agent (Claude Opus 5.5). Written 2026-11-11 after a full
read of the repo at commit `d5ca9a3`.

Read `CLAUDE.md` first, then this file. Where they disagree, **this file is newer** — `CLAUDE.md`
is stale in several places (listed in §2.7) and Phase 0 fixes it.

---

## 1. Goal and ground rules

**Goal:** put CatchPred on a public URL so ordinary Mongolians can use it on their phones, with
data that is current and honest, a community map that cannot be trivially abused, and enough
operational plumbing (monitoring, data refresh, moderation) that it does not rot after launch.

**What "done" means for this plan:** Phases 0–5 merged, production deployed, the launch checklist
in §9 passes. Phase 6 is post-launch backlog — do not start it.

**Ground rules**

1. **Privacy is the product.** No PII, no exact locations, no individual cases. Several current
   behaviours violate this (§2.1) — those fixes are not optional and come before any new feature.
2. **Calm, not alarming.** Copy is informational. Do not label places "high risk" from raw counts
   (§2.2). Never use red/alarm styling for a statistic that is merely large because the
   population is large.
3. **All user-facing copy is Mongolian (Cyrillic).** New strings go in `src/lib/translations.ts`.
   Avoid English loanwords that are in the UI today ("pin", "snapshot", "Captcha") when you touch
   that copy — use "тэмдэглэгээ", "хуулбар/татсан өгөгдөл", "хүний шалгалт".
4. **Do not invent numbers.** Every figure on screen must come from the snapshot or the DB. If
   there is no real source, remove the UI element.
5. **Small PRs, one phase per branch** (`launch/phase-0-cleanup`, …). Each PR must pass
   `pnpm lint`, `npx tsc --noEmit`, `pnpm build`, and the tests added in Phase 0. Lint and tsc are
   clean today — keep them clean.
6. **Never commit secrets.** `.env` is gitignored and has never been committed (verified). Keep it
   that way; add `.env.example` with placeholders only.
7. **Ask the owner only for the items in §8.** Everything else has a default in this document —
   use it and keep going. Do not block on §8 either: build behind env flags and leave the item
   in the PR description.
8. **Destructive or outward-facing actions need owner confirmation:** running migrations against
   the production Neon database, deleting rows, changing DNS, publishing the domain. Prepare
   them, do not run them unprompted.

---

## 2. Review findings (verified in code)

Severity: **P0** = must fix before any public traffic, **P1** = fix before launch,
**P2** = should fix, fine shortly after launch.

### 2.1 Community map — privacy and abuse

| # | Sev | Finding | Where |
|---|-----|---------|-------|
| C1 | P0 | **Exact coordinates are stored and served.** The click location is saved at full float precision and returned by `GET`. With the 50 m minimum radius, a "violence" or "child safety" pin identifies a single building or household. This contradicts the "area-level only" promise in the UI and privacy page. | `api/community-reports/route.ts` POST/GET, `community-map/page.tsx` (shows 5-decimal lat/lng) |
| C2 | P0 | **Rate limiting does nothing in production.** `rate-limit.ts` is an in-memory `Map`; on serverless every instance has its own, and cold starts reset it. | `src/lib/rate-limit.ts` |
| C3 | P0 | **CAPTCHA is not a bot barrier.** The prompt is plain text `"3 + 4 = ?"` returned by a JSON endpoint — a 5-line script solves it. The token is also replayable for 10 minutes (no single-use check), and the secret silently falls back to `"dev-community-captcha-secret"` if the env var is missing. | `src/lib/community-captcha.ts` |
| C4 | P0 | **Anyone can erase the map.** `POST /[id]/flag` has no CAPTCHA and no per-visitor dedupe; three requests from one client hide any report. Report IDs are public in the GET response, so a loop wipes all 200. | `api/community-reports/[id]/flag/route.ts` |
| C5 | P1 | `flag` does not validate `id` as a UUID → Postgres cast error → HTTP 500 instead of 400. | same |
| C6 | P1 | `verifyCaptchaToken` does `JSON.parse` on attacker-controlled input after the HMAC check only; a malformed-but-signed payload cannot happen, but `Buffer.from(sig)` length mismatch paths and non-numeric `answer` (`NaN`) should return 400, not fall through. Add explicit input validation with a schema. | `community-captcha.ts`, route |
| C7 | P1 | `GET` returns internal columns (`flagCount`, `hidden`, `details`, `areaLabel`). Return an explicit public projection. | route GET |
| C8 | P1 | **Pins never expire.** A pin from last year looks identical to one from today, and only the newest 200 are ever shown. | route GET |
| C9 | P1 | **No moderation path.** There is no way for the operator to review, unhide, or delete a pin except raw SQL. | — |
| C10 | P1 | **Mobile users cannot see the feed or flag anything.** The right rail is `hidden lg:flex`, the flag button is hover-only, and the map popup has no flag action. Most Mongolian traffic will be mobile. | `community-map/page.tsx` |
| C11 | P2 | UI radius slider max is 1000 m; server accepts up to 5000 m. Align both (see Phase 1). | page + route |
| C12 | P2 | No DB indexes on `community_reports` (`hidden`, `created_at`). | `src/db/schema.ts` |
| C13 | P2 | All pins are one colour; no category filter or legend. | `community-report-map.tsx` |
| C14 | P2 | Errors from the API are a mix of English (`"Captcha verification failed"`) and Mongolian and are shown raw to the user. | route + page |

### 2.2 Official statistics — accuracy and honesty

| # | Sev | Finding | Where |
|---|-----|---------|-------|
| D1 | P0 | **Home page shows fabricated numbers** under a pulsing "live" dot and the heading "Өнөөдрийн тойм": `1284`, `16`, `21`, `42` with deltas `+3.1%`, `-2`. These are hardcoded constants. | `src/app/page.tsx` `quickStats` |
| D2 | P0 | **"Risk level" is computed from raw counts.** `risk = count >= max*0.66 ? "Өндөр" …`. Ulaanbaatar holds roughly half the population, so it is permanently "Өндөр эрсдэл" and every aimag is "Бага". This is statistically wrong and is exactly the fear-mongering the product principles forbid. | `src/app/map/page.tsx:61`, legend, `riskTextClass`/`riskBadgeClass` |
| D3 | P0 | **Year-over-year delta compares a partial year with a full year.** For the newest year the snapshot holds a year-to-date cumulative figure (currently 2026-04) and it is compared with full-year 2025 (2025-12), producing a large fake "decrease". | `map/page.tsx` (`deltaPercent`), `stats/page.tsx` (`delta`, `previousTotal`) |
| D4 | P1 | **Snapshot is 5 months stale.** It holds 2026-04; 1212.mn now publishes through **2026-09** (checked 2026-11-11). | `src/data/1212-crime-snapshot.json` |
| D5 | P1 | **The dataset is not "crime totals".** Table `DT_NSO_2300_044V1` is six *overlapping circumstance* indicators (domestic-violence-related, committed while intoxicated, under drugs, in a group, woman involved, child involved). One case can be in several. The UI must never sum across indicators or present one as "total crime", and should explain what each indicator means. Check `getIndicatorYearBreakdown` usage on the stats page — a bar comparison is fine, a share/percentage or a sum is not. | `crime-snapshot.ts`, `stats/page.tsx` |
| D6 | P1 | **The "heatmap" is 22 points** — one per aimag at the aimag-centre coordinate — rendered as a continuous heat layer centred on Ulaanbaatar at zoom 9. It implies spatial precision the data does not have. | `safety-heatmap.tsx`, `map/page.tsx` |
| D7 | P1 | **"Live" chrome on static data.** `LiveBadge`, `live-dot`, `LiveClock` on `/map` and the home page suggest real-time monitoring of a frozen JSON file. Keep the wallboard look, replace "live" semantics with "data as of YYYY-MM". | `ui/monitor.tsx` users |
| D8 | P1 | **Data-sources page states things that are not true:** it lists the Police and the child-and-family agency as sources with invented "last updated" dates and frequencies. The only real source is 1212.mn table 044V1. The "Арга зүй" paragraph claims GPS removal and ≥1 km grid aggregation that the code does not do. | `src/app/data-sources/page.tsx` |
| D9 | P1 | **Dead, misleading API surface.** `/api/stats/summary`, `/by-year`, `/by-region`, `/api/data-sources` read `crime_statistics` / `data_sources`, which contain only fake seed data (`seed.ts` generates values for "UB/DA/OR/SE/DO"). They are publicly reachable and would serve fabricated statistics. Nothing in the UI calls them. | `src/app/api/stats/*`, `api/data-sources`, `seed.ts`, `src/db/seed.ts` |
| D10 | P2 | Snapshot `updated` field is `2025-04-05` — that is the stale header inside the PX file, not the real publish date. Use the `updated` timestamp from the folder listing endpoint (044V1 currently `2026-10-14`) and the max month label instead. | `scripts/import-1212-crime.mjs` |
| D11 | P2 | The snapshot is written twice (`src/data` and `public/data`) and imported into client bundles on `/map` and `/stats` (11.6k lines of pretty-printed JSON each, with repeated `indicatorName`/`regionName`/lat/lng on every row). | importer, `crime-snapshot.ts` |

### 2.3 Deployment readiness

| # | Sev | Finding |
|---|-----|---------|
| R1 | P0 | No hosting config, no CI, no `.env.example`, no documented env vars. README is the unmodified create-next-app boilerplate. |
| R2 | P0 | No security headers (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame-ancestors). `next.config.ts` is empty apart from `reactCompiler`. |
| R3 | P1 | `src/db/index.ts` throws at import time if `DATABASE_URL` is unset, which makes `next build` fragile in CI and takes down any route that imports it. Make the client lazy. |
| R4 | P1 | No `error.tsx`, `global-error.tsx`, or `loading.tsx`. If the DB is down, the community map shows an unhandled promise rejection and a blank feed (`Promise.all([...]).finally` with no `catch`). |
| R5 | P1 | No tests of any kind. |
| R6 | P1 | No monitoring, error reporting, or uptime check. |
| R7 | P2 | Two lockfiles (`package-lock.json` and `pnpm-lock.yaml`); pnpm is the package manager. |
| R8 | P2 | Unused dependencies: `leaflet`, `leaflet.heat`, `@types/leaflet`, `@types/leaflet.heat`, `pg`, `@types/pg` (the maps are MapLibre, the DB driver is Neon HTTP). `autoprefixer` is likely unneeded with Tailwind v4. Verify with grep before removing. |
| R9 | P2 | No `engines` / `.nvmrc`. Local Node is v26; pin to the active LTS that the host supports. |
| R10 | P2 | Next.js is pinned at 16.1.6 — move to the latest 16.x patch and read its release notes for security fixes. Do not jump majors. |
| R11 | P2 | Map tiles come from `tiles.openfreemap.org` (free, no SLA). Acceptable for launch; make the style URL an env var so it can be swapped without a deploy, and handle tile failure gracefully. |

### 2.4 Mobile, accessibility, typography

| # | Sev | Finding |
|---|-----|---------|
| U1 | P1 | **Fonts fall back for Mongolian letters.** `Inter` and `JetBrains_Mono` load `["latin","cyrillic"]`; `Plus_Jakarta_Sans` loads `["latin"]`. The Mongolian letters **ө ү Ө Ү** live in Google's `cyrillic-ext` subset, so they render in a fallback font mid-word. All three fonts ship `cyrillic-ext` — add it. (`src/app/layout.tsx`) |
| U2 | P1 | Monitor pages (`/map`, `/community-map`) need a real pass at 360×740: left rail covers the map, top chips overflow, the bottom status bar hides map attribution. |
| U3 | P1 | Every page is `"use client"`, including fully static ones (home, report, education, about…). They ship unnecessary JS and cannot export per-page `metadata`. |
| U4 | P2 | Mobile menu button has `aria-label="Menu"` (English) and no `aria-expanded`; active nav link has no `aria-current`; map canvases have no text alternative; the flag button is invisible to keyboard users until hover. |
| U5 | P2 | `document.documentElement.style.overflow = "hidden"` hack on monitor pages — replace with layout CSS. |

### 2.5 SEO and sharing

| # | Sev | Finding |
|---|-----|---------|
| S1 | P1 | One global `<title>`/description; no per-page metadata, no `metadataBase`, no Open Graph / Twitter image. Links shared on Facebook (the dominant channel in Mongolia) will show a bare URL. |
| S2 | P1 | No `sitemap.ts`, `robots.ts`, `manifest.ts`, app icons; `favicon.ico` is the Next default; `public/` still has the create-next-app SVGs. |
| S3 | P2 | Brand is inconsistent: repo "catchpred", GitHub "MongoliaSafetyWatch", UI "Олон Нийтийн Аюулгүй Байдал", contact `info@catchpred.mn`. Pick one (owner decision, §8). |

### 2.6 Legal (flag for legal review — do not self-certify)

- `/privacy` and `/terms` must match what the system actually does after Phase 1: what is stored
  for a pin, rate-limit hashing, CAPTCHA provider, analytics, retention, how to request removal.
- Community pins about a small area can still be defamatory toward a business or household.
  The mitigations in Phase 1 (coarse grid, minimum radius, expiry, moderation) reduce this;
  whether they are sufficient under Mongolian law (incl. the Personal Data Protection Law,
  "Хувь хүний мэдээлэл хамгаалах тухай хууль") is a **legal question for the owner's counsel**.
- 1212.mn reuse terms: confirm attribution wording on `/data-sources`.

### 2.7 `CLAUDE.md` is out of date

Fix in Phase 0:

- Maps are **MapLibre GL**, not Leaflet; there are no Leaflet popups. `escapeHtml` lives in
  `community-report-map.tsx` and is used for MapLibre popups.
- `report/page.tsx` links are fixed and it uses the slate palette now.
- `about/page.tsx` email is `info@catchpred.mn`, not `info@example.mn`.
- A rate limiter exists (`src/lib/rate-limit.ts`) and a flag/moderation column pair exists
  (migration `0002`).
- After this plan: document new env vars, the data pipeline, the admin route, the test commands.

---

## 3. Target architecture (decisions already made)

| Concern | Decision | Why |
|---|---|---|
| Hosting | **Vercel**, functions pinned to **`sin1`** | The Neon DB is already in `ap-southeast-1` (Singapore); co-locate. Singapore is also a reasonable edge for Mongolia. |
| Database | Existing Neon project. Create a **separate Neon branch for preview/dev**; production branch only gets migrations via an explicit, owner-approved step. | Avoid test pins in production. |
| Official stats | **Stay static** — JSON generated by the importer, committed, bundled at build. No DB. | It is monthly data; static is fastest, free, and cannot go down. |
| Bot protection | **Cloudflare Turnstile** (managed, invisible-first) verified server-side, behind `TURNSTILE_SECRET_KEY`. If the key is absent (local dev), fall back to the existing math CAPTCHA. | The math CAPTCHA stops nobody. Turnstile is free and works in Mongolia. |
| Rate limiting | **Postgres-backed** fixed-window limiter keyed by `HMAC(ip, daily-rotating salt)`. No raw IP is ever stored; keys are useless after the salt rotates. | No new vendor; correct across serverless instances; privacy-preserving. |
| Location privacy | **Snap on the server** to a ~250 m grid; minimum radius 250 m. | Makes "exact location" structurally impossible, not a UI convention. |
| Moderation | Token-protected `/admin` page + API (single shared secret `ADMIN_TOKEN`, constant-time compare, `noindex`). | One operator; a full auth system is overkill for launch. |
| Analytics | **Vercel Web Analytics** (cookieless, no PII). No Google Analytics, no Meta pixel. | Consistent with the privacy promise; no cookie banner needed. |
| Error monitoring | **Sentry** (`@sentry/nextjs`) gated on `SENTRY_DSN`, with IP collection off and request bodies scrubbed. | Need to know when the pin API breaks. |
| Data refresh | **GitHub Actions cron** runs the importer monthly and opens a PR with the diff. Human merges. | 1212.mn publishes mid-month; a PR keeps a human in the loop for sanity. |
| Tests | **Vitest** for lib + route handlers; **Playwright** smoke for the five main pages at mobile viewport. | Minimum that protects the privacy invariants. |

Environment variables (create `.env.example` with these, placeholder values only):

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
COMMUNITY_CAPTCHA_SECRET=change-me-32-random-bytes        # required in production
RATE_LIMIT_SALT_SECRET=change-me-32-random-bytes          # required in production
ADMIN_TOKEN=change-me-long-random-string                  # required in production
NEXT_PUBLIC_TURNSTILE_SITE_KEY=                           # optional; enables Turnstile
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=https://example.mn
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/dark
SENTRY_DSN=                                               # optional
```

Add `src/lib/env.ts` that validates these once (zod) and **throws in production** if a required
secret is missing or still equals a known dev default. No more silent
`?? "dev-community-captcha-secret"`.

---

## 4. Phases

Do them in order. Each phase lists tasks and acceptance criteria (AC). Phases 0 and 1 are the
launch blockers.

### Phase 0 — Hygiene and safety net (small, do first)

1. Delete `package-lock.json`, root `seed.ts`, `src/db/seed.ts`, the default SVGs in `public/`.
2. Remove unused deps (R8) after confirming with grep; run `pnpm install`.
3. Delete `/api/stats/*` and `/api/data-sources` routes (D9). Leave the `crime_statistics` and
   `data_sources` **tables** in place for now — dropping them is a production-DB change; write the
   migration that drops them and the `crime_category` enum, but **do not run it** without owner
   approval. Remove the table definitions from `schema.ts` in the same PR as that migration.
4. Add `.nvmrc` + `"engines"` + `"packageManager"` in `package.json`. Bump Next to latest 16.x.
5. Add `src/lib/env.ts` and `.env.example` (§3). Make `src/db/index.ts` lazy
   (`getDb()` that constructs on first call) so importing it never throws at build time; move the
   duplicated `normalizeDatabaseUrl` into one shared module used by both `src/db` and
   `drizzle.config.ts`.
6. Add Vitest + scripts: `pnpm test`, `pnpm typecheck` (`tsc --noEmit`). Add first tests for
   `crime-snapshot.ts` helpers and `community-captcha.ts`.
7. Add `.github/workflows/ci.yml`: install with pnpm, lint, typecheck, test, build. Build must
   succeed with **no** `DATABASE_URL`.
8. Add `error.tsx`, `global-error.tsx`, and a Mongolian-language `not-found.tsx` check.
9. Rewrite `README.md` (what it is, setup, env, commands, data refresh, deploy). Update
   `CLAUDE.md` per §2.7.
10. Fix fonts (U1): add `"cyrillic-ext"` to all three `next/font` calls. Verify visually that
    "Өнөөдөр", "үзүүлэлт" render in one typeface in headings and in `.mono-data`.

**AC:** CI green on a clean clone without `.env`; `pnpm build` output lists no `/api/stats/*`;
no Leaflet in `pnpm why leaflet`; ө/ү render in the intended font.

### Phase 1 — Community map hardening (P0 privacy/abuse)

**1.1 Location privacy (C1, C11)**

- Add `src/lib/geo-privacy.ts`:
  - `snapToGrid(lat, lng, cellMeters = 250)` — snap to the centre of a grid cell (compute
    longitude step with `cos(lat)`), then round to 4 decimals.
  - `MIN_RADIUS_M = 250`, `MAX_RADIUS_M = 2000`, radius rounded to the nearest 50.
- Apply **on the server in POST** before insert. The client may show the snapped circle as a
  preview, but the server is the authority.
- UI: slider 250–2000 m, default 500 m. Remove the 5-decimal coordinate readout; show
  "Ойролцоо бүс сонгогдлоо" instead. Popup and feed never show coordinates.
- **Existing rows:** write a one-off SQL migration that snaps existing `latitude/longitude` and
  raises `radius_meters` below 250 to 250. This is a production data change → owner approval.
- Unit-test the invariant: for random inputs inside Mongolia, the stored point is ≥ 0 and
  ≤ ~177 m (half-diagonal of the cell) from the input, and two inputs in the same cell produce
  identical output.

**1.2 Real rate limiting (C2)**

- Migration: table `rate_limits(key text primary key, count int not null, window_start timestamptz not null)`.
- `rateLimit(key, limit, windowMs)` becomes async: single `INSERT … ON CONFLICT DO UPDATE`
  statement that resets the window when expired and returns the new count (atomic; Neon HTTP has
  no interactive transactions).
- Key = `scope + ":" + HMAC_SHA256(ip, RATE_LIMIT_SALT_SECRET + UTC-date)`. Use the platform's
  trusted client-IP header (on Vercel: the **last** hop in `x-forwarded-for` is not what you want
  — use `x-vercel-forwarded-for` / `x-real-ip` as documented; verify against current Vercel docs).
- Limits: create 3 / 10 min and 10 / day per client; flag 10 / 10 min; captcha issue 30 / 10 min.
  Add a **global** circuit breaker: more than 300 new pins per hour site-wide → POST returns 503
  with a calm message and Sentry gets an alert.
- Opportunistic cleanup of rows older than 2 days inside the same request path (1-in-50 chance),
  no cron needed.

**1.3 Bot protection (C3, C6)**

- Add Turnstile widget to the form when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set; verify the token
  server-side against `siteverify` with a 5 s timeout; treat verification-service failure as a
  rejected request with a "try again" message (fail closed).
- Keep the math CAPTCHA as the no-key fallback, but make tokens single-use: include a random
  nonce in the payload and record used nonces in `rate_limits`-style table (or reuse it with a
  `captcha:` key prefix and TTL = token TTL). Use `crypto.randomInt`, not `Math.random`.
- Validate the whole POST body with one zod schema; every validation failure is a 400 with a
  Mongolian message from `translations.ts` (C14).
- CSP (Phase 4) must allow `https://challenges.cloudflare.com`.

**1.4 Flagging that cannot be weaponised (C4, C5)**

- Migration: table `community_report_flags(report_id uuid references community_reports on delete cascade, voter_key text, created_at timestamptz default now(), primary key (report_id, voter_key))`
  where `voter_key` is the same daily-salted HMAC. One flag per client per report; `flag_count`
  is derived from distinct rows (update it in the same statement or compute on read).
- Validate `id` with a UUID regex → 400.
- Change the semantics: reaching the threshold (keep 3 distinct clients) sets a new status
  **`pending_review`** instead of permanently hiding. Pending pins are hidden from the public map
  but appear in the admin queue, where the operator restores or removes them.
- Replace `hidden boolean` with `status` enum (`visible | pending_review | removed`) in a
  migration that maps existing values.
- Flag requests also require a Turnstile token when Turnstile is enabled.

**1.5 Expiry, projection, indexes (C7, C8, C12)**

- `GET /api/community-reports` returns only
  `{ id, category, latitude, longitude, radiusMeters, createdAt }` for `status = 'visible'` and
  `created_at > now() - interval '30 days'`, newest first, limit 500. Drop `title` from the
  response (derive the label client-side from `category`).
- Pins 14–30 days old render at reduced opacity; the popup shows relative age.
- Add index `(status, created_at desc)`.
- Set `Cache-Control: public, s-maxage=30, stale-while-revalidate=120` on GET; the client stops
  using `cache: "no-store"` and re-fetches every 60 s while the tab is visible.
- Stop writing the unused `title`, `details`, `area_label` columns; drop them in the same
  owner-approved migration batch.

**1.6 Admin moderation (C9)**

- `/admin` (client page, `robots: noindex`) asks for the token once, keeps it in
  `sessionStorage`, sends it as `Authorization: Bearer`.
- `GET /api/admin/reports?status=pending_review|visible|removed`,
  `POST /api/admin/reports/[id]` `{ action: "restore" | "remove" }`.
- Server compares with `timingSafeEqual`; rate-limit failed attempts (5 / 15 min); never log the
  token. If `ADMIN_TOKEN` is unset the routes return 404.

**1.7 Mobile and UX (C10, C13, U2)**

- Bottom sheet on `< lg`: tabs "Тэмдэглэх" / "Сүүлийн тэмдэглэгээ". The feed and the flag action
  must be reachable by touch.
- Popup gets a "Зохисгүй гэж мэдэгдэх" button (build popup DOM with `document.createElement`,
  not an HTML string, so no escaping concerns arise).
- Colour pins by category using a colour-blind-safe palette, with a legend and category filter
  chips. Do not use red for any category.
- Add a short, always-visible notice: this is not a way to report a crime; in an emergency call
  102. Link to `/report`.
- First-visit explainer (dismissible, remembered in `localStorage`): what a pin is, that it is
  anonymous, approximate, expires in 30 days, and can be flagged.
- Handle load failure: visible error state with a retry button (R4).

**AC for Phase 1**

- A test proves no API response contains a coordinate with more than 4 decimals or a radius
  below 250.
- Route-handler tests cover: missing/invalid body → 400; bad captcha → 400; replayed captcha
  token → 400; 4th create inside 10 min → 429; same client flagging twice counts once; non-UUID
  id → 400; three distinct clients → status `pending_review` and the pin disappears from GET.
- Manual check on a 360 px-wide viewport: place a pin, see it in the feed, flag it.
- `/privacy` text updated to describe exactly what is stored (§2.6) — mark the PR "needs legal
  review".

### Phase 2 — Honest, current official data

**2.1 Importer v2** (`scripts/import-1212-crime.mjs`)

Base API: `https://data.1212.mn/api/v1/mn/NSO/Society,%20development/Law%20and%20crime/`
(PXWeb; `GET` on a table returns metadata, `POST` with a query returns data; the folder `GET`
lists tables with their real `updated` timestamps). Always resolve dimension codes from metadata
— several dimensions are rolling indexes.

Pull these tables (IDs verified to exist on 2026-11-11; inspect each one's metadata before
writing the query — do not assume dimension names):

| Table | Content | Use |
|---|---|---|
| `DT_NSO_2300_044V1` | Registered crime by circumstance, aimag/capital, monthly cumulative | Existing indicators. Now through 2026-09. |
| `DT_NSO_2300_034V1` | Registered crimes **per 10,000 population aged 16+**, by region/aimag/capital, yearly | **The rate used for the map colour scale** (fixes D2). |
| `DT_NSO_2300_046V1` | Registered crime by crime type, soum/district, yearly | Ulaanbaatar **district** view and crime-type breakdown. |
| "БҮРТГЭГДСЭН ГЭМТ ХЭРГИЙН ТОО, бүс, аймаг, нийслэлээр, сар, жилээр" (listed in the same folder without a `DT_` id — find its id from the listing) | Total registered crimes by aimag, monthly | The real "total" headline number. |

Changes:

- For the partial newest year, also fetch the **same month of the previous year** from 044V1 and
  the monthly-total table, and store it as `previousYearSameMonth` so the UI can compute a fair
  year-to-date comparison (fixes D3).
- Also include the "Улсын дүн" (national total) row from the source instead of summing aimags in
  the client.
- Privacy guard for soum-level data: publish **aimag level nationwide, and district level for
  Ulaanbaatar only**. Do not publish soum-level rows (small populations, small counts). In any
  published cell, suppress values 1–4 as "<5".
- Output a compact normalised file: `{ meta, regions: {code: {name, lat, lng}}, indicators,
  series: … }` — no repeated strings per row, minified. Keep a pretty-printed copy only in
  `public/data/` for the download button, plus a CSV export (`public/data/*.csv`) since
  journalists and students will prefer CSV.
- `meta.sourceUpdated` = table `updated` from the folder listing; `meta.dataThrough` = max month.
- Validation before writing: all 21 aimags + Ulaanbaatar present for every year; no negative
  values; cumulative series non-decreasing within a year; newest month ≥ the month in the
  previous snapshot. Exit non-zero on failure so the cron PR is not opened with bad data.
- Region boundaries: add a simplified aimag (ADM1) GeoJSON and Ulaanbaatar district polygons to
  `public/geo/` from an openly licensed source (geoBoundaries or OSM-derived; record source and
  licence in `/data-sources`). Simplify to keep each file under ~150 kB.

**2.2 Run the refresh** — run the importer, commit the new snapshot (data through 2026-09).

**2.3 Fix the map page** (`/map`)

- Replace the heat layer with a **choropleth** of aimags coloured by the per-10,000 rate
  (sequential single-hue teal scale, 5 quantile classes, legend with actual numbers). Keep the
  "bubble" mode as raw counts, clearly labelled "тоо (хүн амын тооноос хамаарна)".
- Fit bounds to Mongolia on load (currently centred on UB at zoom 9, which hides the country).
- When Ulaanbaatar is selected, offer a district drill-down using 046V1.
- **Remove "эрсдэл / эрсдэлийн түвшин" entirely.** Show the rate, the national average, and
  "улсын дунджаас дээгүүр / доогуур / ойролцоо".
- Trend uses the like-for-like comparison from 2.1; label it "өмнөх оны мөн үетэй харьцуулахад".
- Replace `LiveBadge`/live dots with "Өгөгдөл: 2026-09 байдлаар · Эх сурвалж: ҮСХ" (D7). Keep
  `LiveClock` off this page.
- The "nearest region" geolocation feature: keep, but it must work without sending the location
  anywhere (it already does — add that sentence next to the button).

**2.4 Fix the stats page** (`/stats`)

- Headline cards: total registered crimes (from the monthly-total table), like-for-like change,
  rate per 10,000.
- Indicator section: explain in one sentence each what the six circumstance indicators mean and
  that they overlap (D5). No pie/share charts across indicators.
- Add: monthly cumulative line for current vs previous year; crime-type breakdown from 046V1;
  per-capita ranking table (sortable, with a search box) next to the raw-count chart.
- Downloads: JSON and CSV, with the data-through date in the filename.
- Follow the repo's chart conventions; if you build new charts, load the `dataviz` skill first.

**2.5 Fix the home page** (D1)

- Convert to a server component. Replace `quickStats` with real values computed at build time
  from the snapshot: total registered crimes year-to-date, like-for-like change, data-through
  month, number of regions covered. Heading becomes "Сүүлийн мэдээлэл (2026-09 байдлаар)". No
  live dot.
- Add a compact "visible community pins in the last 30 days" count only if it is fetched from the
  API with ISR (`revalidate = 300`); otherwise omit.

**2.6 Fix `/data-sources`** (D8) — list only real sources (ҮСХ / 1212.mn tables by id and title,
map boundary source, map tiles/OpenStreetMap), real update dates read from `meta`, and a
methodology section that describes what the code actually does (aggregation level, <5
suppression, community-pin grid snapping and expiry).

**2.7 Automate** — `.github/workflows/refresh-data.yml`: cron on the 16th and 26th of each month
+ manual dispatch; runs the importer; if the snapshot changed, opens a PR titled
"data: 1212.mn refresh through YYYY-MM" with a summary of the changed totals.

**AC:** no hardcoded statistic remains in `src/app` (grep for digit literals in JSX of
home/map/stats and justify any that remain); the newest-year delta for Ulaanbaatar is computed
against the same month of the prior year; the string "эрсдэл" appears nowhere in `/map`;
snapshot `meta.dataThrough` is `2026-09` or later; unit tests cover the like-for-like delta and
the <5 suppression.

### Phase 3 — Mobile, accessibility, SEO, sharing

1. Convert static pages to server components (home, report, education, about, terms, privacy,
   data-sources); keep `"use client"` only on interactive leaves (navbar, maps, charts, filters).
2. Per-page `metadata` (Mongolian title + description), `metadataBase` from
   `NEXT_PUBLIC_SITE_URL`, `openGraph` + `twitter` tags, and an `opengraph-image.tsx` (static,
   branded; make sure the OG image font includes `cyrillic-ext`).
3. `app/sitemap.ts`, `app/robots.ts` (disallow `/admin`, `/api`), `app/manifest.ts`, real
   `icon`/`apple-icon` (replace the default favicon).
4. Mobile pass at 360×740 and 390×844 on every page; fix U2. Tap targets ≥ 44 px. Emergency
   numbers on `/report` must be one tap from any page on mobile (the red navbar button is
   currently `hidden sm:flex` — show a compact version on small screens).
5. Accessibility (U4): Mongolian `aria-label`s, `aria-expanded`, `aria-current="page"`, visible
   focus rings, a data-table alternative under each chart and map (a `<details>` with the same
   numbers), colour contrast ≥ 4.5:1 for body text on the dark theme (check `text-slate-500`
   usages).
6. `/report`: add `tel:` links (present) plus a note that 102 accepts SMS only if that is
   verifiably true — the current bullet "текст мессеж илгээх боломжтой" is an unverified claim;
   **verify against an official source or remove it**. Same for every phone number and URL on the
   page: check each is live and correct, and list what you verified in the PR.
7. `/education`: read it fully for tone and factual claims; anything stated as fact about law or
   procedure needs a source link or softer wording.
8. Move remaining hardcoded Mongolian strings in shared components into `translations.ts`
   (don't do a repo-wide sweep of page bodies — long static prose can stay in the page).
9. Performance: lazy-load MapLibre and Recharts (already dynamic for maps; do the same for
   charts), confirm the snapshot is not in the home-page bundle. Target Lighthouse mobile
   ≥ 90 performance on `/` and ≥ 80 on `/map`, ≥ 95 accessibility everywhere.

**AC:** Playwright smoke test (mobile viewport) loads `/`, `/map`, `/stats`, `/community-map`,
`/report` with no console errors and no horizontal scroll; Lighthouse numbers recorded in the PR.

### Phase 4 — Deployment

1. `next.config.ts`: security headers for all routes —
   `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`,
   `Permissions-Policy: geolocation=(self), camera=(), microphone=()`,
   and a CSP. Starting point (tighten/adjust by testing, MapLibre needs `worker-src blob:`):
   ```
   default-src 'self';
   script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com;
   style-src 'self' 'unsafe-inline';
   img-src 'self' data: blob: https://tiles.openfreemap.org;
   connect-src 'self' https://tiles.openfreemap.org https://challenges.cloudflare.com https://*.ingest.sentry.io;
   worker-src 'self' blob:;
   frame-src https://challenges.cloudflare.com;
   frame-ancestors 'none'; base-uri 'self'; form-action 'self'
   ```
   Prefer a nonce-based `script-src` if it is practical with the current Next version; ship in
   `Content-Security-Policy-Report-Only` first on preview, then enforce.
2. `vercel.json` (or project settings): region `sin1`, Node version = `.nvmrc`.
3. Vercel project setup (owner's account — §8): connect the GitHub repo, set env vars for
   Production and Preview separately (Preview uses the Neon **dev branch** URL and Turnstile test
   keys), enable Web Analytics.
4. Database: document the exact migration order in `docs/DEPLOY.md`. Run `pnpm db:migrate`
   against the Neon dev branch first; production only after owner approval. Take a Neon
   branch/snapshot of production before the destructive migrations (column drops, coordinate
   snapping).
5. Sentry: `@sentry/nextjs`, `sendDefaultPii: false`, strip request bodies and query strings,
   sample rate low. Add an alert on the pin circuit-breaker and on 5xx rate.
6. `GET /api/health` → `{ ok, db, dataThrough }` (no secrets); point an external uptime check at
   it.
7. Domain + HTTPS + `www` redirect; set `NEXT_PUBLIC_SITE_URL`.
8. Write `docs/DEPLOY.md` and `docs/RUNBOOK.md`: how to deploy, roll back, rotate each secret,
   refresh data manually, moderate pins, **disable pin creation in an emergency** (env flag
   `COMMUNITY_REPORTS_READONLY=1` checked in POST — implement this flag), and whom to contact.

**AC:** preview deployment passes the smoke test with CSP enforced and zero CSP violations in the
console; `securityheaders.com`-equivalent check shows no missing header; `/api/health` is green;
rollback procedure tested once on preview.

### Phase 5 — Pre-launch verification

Run §9 end to end on the production URL before announcing it. Fix what fails. Then tag `v1.0.0`.

### Phase 6 — Post-launch backlog (do not start; listed so nobody re-invents it)

- English (and possibly Kazakh) UI toggle.
- "My area" summary page per aimag/district with a shareable card image.
- Road-accident statistics (`DT_NSO_2300_039V1`–`V3`) and registered violations
  (`DT_NSO_2300_045V1`) as extra datasets.
- Installable PWA with offline emergency-numbers page.
- Seasonal prevention tips on `/education` driven by the monthly data.
- Embeddable chart widget for news sites.
- Public changelog of data refreshes.

---

## 5. New-functionality summary (what users get at launch)

1. Map coloured by **rate per 10,000 people**, with a district drill-down for Ulaanbaatar — the
   first view on the site that actually answers "how does my area compare".
2. Fair year-to-date comparisons and a real national headline number.
3. CSV/JSON downloads with clear dates and sources.
4. Community map that works on a phone: bottom sheet, category colours and filters, flagging
   from the popup, pins that fade and expire after 30 days.
5. Share-ready links (Open Graph image, per-page titles) and an installable icon.
6. Behind the scenes: moderation queue, real bot protection and rate limits, monthly data
   refresh PRs, error monitoring, emergency read-only switch.

---

## 6. Things not to do

- Do not add user accounts, comments, free-text fields, photo upload, or any field on a pin
  beyond category + coarse area. Free text is where PII and defamation enter.
- Do not publish soum-level or sub-district statistics, and do not geocode anything finer than
  the published administrative unit.
- Do not add "prediction", "risk score", or "dangerous area" features or wording, despite the
  repository name.
- Do not add third-party trackers, ad scripts, or social embeds.
- Do not move the official statistics into the database.
- Do not run production migrations, delete production rows, or touch DNS without the owner.
- Do not rewrite the visual design system; keep slate + teal, `.surface-card`, monitor layout.

---

## 7. File map for the main changes

```
src/lib/env.ts                         new  – validated env
src/lib/geo-privacy.ts                 new  – grid snapping, radius bounds
src/lib/rate-limit.ts                  rewrite – Postgres-backed, salted keys
src/lib/client-key.ts                  new  – trusted IP → daily HMAC
src/lib/turnstile.ts                   new  – server verification
src/lib/community-captcha.ts           harden – nonce, single-use, no default secret
src/lib/crime-snapshot.ts              rewrite – new snapshot shape, like-for-like deltas, rates
src/lib/translations.ts                extend – API errors, new UI strings
src/db/schema.ts                       status enum, flags table, rate_limits, indexes; drop dead tables
src/db/index.ts                        lazy getDb()
drizzle/0003…                          new migrations (one concern per file)
src/app/api/community-reports/**       validation, projection, expiry, cache headers
src/app/api/admin/**                   new
src/app/api/health/route.ts            new
src/app/api/stats/**, api/data-sources delete
src/app/admin/page.tsx                 new
src/app/page.tsx                       server component, real numbers
src/app/map/page.tsx                   choropleth, rate, no "risk", honest labels
src/app/stats/page.tsx                 new headline, like-for-like, CSV
src/app/community-map/page.tsx         mobile sheet, filters, error states
src/app/data-sources/page.tsx          truthful sources + methodology
src/app/{sitemap,robots,manifest}.ts   new
src/app/opengraph-image.tsx            new
src/app/{error,global-error}.tsx       new
src/components/map/*                   choropleth layer, category colours, DOM popups
scripts/import-1212-crime.mjs          v2 (multiple tables, validation, compact output, CSV)
public/geo/*.geojson                   new (aimag + UB district boundaries)
.github/workflows/{ci,refresh-data}.yml new
next.config.ts                         security headers
.env.example, .nvmrc, vercel.json      new
docs/DEPLOY.md, docs/RUNBOOK.md        new
README.md, CLAUDE.md                   rewrite / update
```

---

## 8. Owner decisions (defaults in bold — proceed with the default, list it in the PR)

1. **Public name and domain.** Default: keep the UI name "Олон Нийтийн Аюулгүй Байдал", domain
   `catchpred.mn` (matches the contact email already in `/about`). The word "pred" in the domain
   suggests prediction, which the product explicitly does not do — worth reconsidering.
2. **Hosting account.** Default: **Vercel** project under the owner's account + existing Neon.
   The agent needs the owner to connect the repo and paste env vars.
3. **Turnstile keys** (Cloudflare account). Default: **launch requires them**; without keys the
   community map ships in read-only mode.
4. **Who moderates and how often.** Default: **the owner, daily check of `/admin`**; contact
   email for takedown requests = `info@catchpred.mn` (confirm the mailbox exists).
5. **Legal review** of `/privacy`, `/terms`, and the community-pin feature before public
   announcement (§2.6). Default: **ship the site, hold the public announcement of the community
   map until reviewed** — `COMMUNITY_REPORTS_READONLY=1` makes that a one-line switch.
6. **Approval to run production migrations** (snap existing coordinates, drop unused
   columns/tables). Default: **prepared, not run.**
7. **Sentry** account. Default: **optional**, code is DSN-gated.

---

## 9. Launch checklist

- [ ] CI green on `main`; `pnpm build` succeeds with no env file.
- [ ] Production env has all required secrets; none equals a dev default; `env.ts` enforces it.
- [ ] Snapshot `meta.dataThrough` ≥ 2026-09; `/data-sources` shows the same date.
- [ ] No fabricated numbers: home, map, stats values traceable to the snapshot.
- [ ] No "эрсдэл" labelling; map colours by rate; like-for-like deltas.
- [ ] `GET /api/community-reports`: ≤ 4-decimal coordinates, radius ≥ 250, no internal fields,
      nothing older than 30 days.
- [ ] Scripted abuse test against **preview**: 20 rapid POSTs → at most 3 accepted; replayed
      token rejected; one client cannot hide a pin; non-UUID flag → 400.
- [ ] `/admin` unreachable without token; token never appears in logs.
- [ ] Emergency read-only switch tested.
- [ ] Security headers + enforced CSP, zero violations on all pages.
- [ ] Mobile smoke test passes at 360 px; ө/ү render correctly; emergency numbers one tap away.
- [ ] Every phone number and external link on `/report` verified live.
- [ ] `/privacy` and `/terms` describe actual behaviour; legal review status recorded.
- [ ] OG image renders in the Facebook sharing debugger.
- [ ] Sitemap/robots reachable; `/admin` and `/api` disallowed.
- [ ] Health check + uptime monitor + Sentry alert wired.
- [ ] `docs/RUNBOOK.md` exists and the rollback was exercised once.
- [ ] Monthly data-refresh workflow ran once via manual dispatch and opened a correct PR.
