# CLAUDE.md

Guidance for working in this repository.

## What this is

**CatchPred** — a Mongolian-language public-safety / crime-information website ("аюулгүй байдлын мэдээлэл"). It presents *aggregated, anonymized* crime statistics on maps and charts, plus prevention education and emergency-reporting channels. It also lets the public drop anonymous, area-level safety pins (community reports).

**Privacy is the core constraint.** The platform must never publish personally identifiable information, exact addresses, or individual cases. Official data is aggregated to aimag level (district level for Ulaanbaatar only). It is explicitly *not* an official police portal and does not accept crime reports — it points users to official channels (102, 108, etc.).

`LAUNCH_PLAN.md` is the launch execution plan; where it and this file disagree on what *should* be built, the plan wins. Operations: `docs/DEPLOY.md`, `docs/RUNBOOK.md`.

## Stack

- **Next.js 16** (App Router) + **React 19** (React Compiler enabled via `babel-plugin-react-compiler`)
- **TypeScript** (strict), path alias `@/*` → `src/*`
- **Tailwind CSS v4** (`@import "tailwindcss"` in `globals.css`, theme tokens via `@theme inline`)
- **Drizzle ORM** + **Neon serverless Postgres** (`@neondatabase/serverless`, HTTP driver — no interactive transactions)
- **Maps:** **MapLibre GL** (there is no Leaflet in this project)
- **Charts:** Recharts
- **Validation:** zod
- **Tests:** Vitest (+ PGlite for route handlers), Playwright (mobile smoke)
- **Icons:** lucide-react
- Fonts via `next/font`: Plus Jakarta Sans (Latin only — it has no Cyrillic glyphs), Inter and JetBrains Mono (both with `cyrillic` + `cyrillic-ext`; ө ү Ө Ү are in `cyrillic-ext`)

## Commands

```bash
pnpm dev            # next dev (default port 3000)
pnpm build          # next build — must succeed with NO env vars (CI checks this)
pnpm start          # next start
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest run (route tests use PGlite — a real in-process Postgres running every migration)
pnpm test:e2e       # playwright, against `pnpm build` output; API mocked; CSP enforced
pnpm db:migrate     # drizzle-kit migrate — NEVER against production without owner approval
pnpm import:1212    # node scripts/import-1212-crime.mjs (1212.mn crime import)
```

`pnpm` is the package manager (version pinned via `packageManager`; Node version in `.nvmrc`).
CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build → e2e with no secrets.
`.github/workflows/refresh-data.yml` re-runs the importer on the 16th/26th and opens a PR.

## Environment

- Server env is read **only** through `getServerEnv()` in `src/lib/env.ts` (zod-validated, cached).
  In production it throws if a required secret is missing, < 32 chars, or a placeholder. Never add
  a silent `?? "default-secret"` fallback.
- Public env is read through `publicEnv` in `src/lib/public-env.ts` (literal `process.env.NEXT_PUBLIC_*`
  references so Next can inline them).
- The DB client is lazy: call `getDb()` from `src/db/index.ts`; importing it never throws.
- `.env.example` lists every variable with placeholders. `.env` is gitignored.

## Data model — two distinct sources

There are **two data paths**, and it's important not to conflate them:

1. **Official crime stats (home, map, stats):** a **static, compact JSON snapshot** at
   `src/data/1212-crime-snapshot.json` (pretty copy + CSVs in `public/data/`), read only through
   `src/lib/crime-snapshot.ts`. Built by `scripts/import-1212-crime.mjs` from four 1212.mn tables:
   `003V1` monthly cumulative totals, `044V1` six *overlapping* circumstance indicators, `034V1`
   rate per 10 000 aged 16+ (yearly), `046V1` crime types by aimag/UB district (yearly). Never in
   the database. Rules: compare the partial newest year like-for-like (`getLikeForLike`), never
   sum the circumstance indicators, compare regions by rate not count, counts 1–4 are suppressed
   (`-1` → "<5"), aimag level + UB districts only (no soums).
   Boundaries: `public/geo/*.geojson` (geoBoundaries ADM2 / NSO, CC BY 3.0 IGO — see SOURCES.json).
2. **Community reports (community-map page):** Postgres `community_reports` via
   `/api/community-reports` (+ `/challenge`, `/[id]/flag`), moderated at `/admin` via
   `/api/admin/reports`. Invariants (tested): the server snaps every pin to a ~250 m grid
   (`src/lib/geo-privacy.ts`), radius 250–2000 m, strict body schema (no free text), public GET
   returns only `{id, category, latitude, longitude, radiusMeters, createdAt}` for visible pins
   < 30 days old. Abuse controls: Postgres fixed-window rate limiter keyed by
   `HMAC(ip, secret + UTC date)` (`client-key.ts`, `rate-limit.ts`; no raw IPs stored), Turnstile
   (math check only in dev; production without Turnstile is read-only), one flag per client per
   pin, 3 distinct flags → `pending_review`, global 300/h circuit breaker,
   `COMMUNITY_REPORTS_READONLY=1` emergency switch.

Schema lives in `src/db/schema.ts`; `src/db/database-url.ts` normalises the several `DATABASE_URL`
formats and is shared with `drizzle.config.ts`. Migrations are hand-written SQL in `drizzle/` with
entries in `drizzle/meta/_journal.json` (keep `when` strictly increasing).

## Layout of `src`

```
src/app/            App Router pages + /api routes
  map/              Official crime map (snapshot data)
  stats/            Charts & trends (snapshot data)
  community-map/    Anonymous community pins (DB-backed)
  education/        Static prevention content
  report/           Emergency numbers & official channels (static)
  about|terms|privacy|data-sources/   Static info pages
  error.tsx, global-error.tsx, not-found.tsx   Mongolian error states
  admin/            Token-protected moderation (noindex)
  api/              community-reports/*, admin/reports/*, health
  sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx, icon.svg, apple-icon.tsx
src/components/
  layout/navigation.tsx     Navbar + Footer (Footer returns null on /map and /community-map —
                            those pages render their own monitor status bar)
  map/                      MapLibre components (client-only, dynamic import with ssr: false)
  ui/disclaimer.tsx         Reusable legal/info disclaimer
  ui/monitor.tsx            MonitorPanel / LiveBadge / LiveClock (wallboard chrome)
  ui/animated-number.tsx    Count-up number (respects prefers-reduced-motion)
src/lib/            env.ts, public-env.ts, crime-snapshot.ts, translations.ts, geo-privacy.ts,
                    community-*.ts, rate-limit.ts, client-key.ts, turnstile.ts, admin-*.ts,
                    security-headers.ts (CSP), monitoring.ts (reportError/reportAlert → Sentry),
                    page-metadata.ts (per-page OG/Twitter)
src/db/             schema.ts, index.ts (lazy getDb), database-url.ts
```

## Conventions

- **Language:** all user-facing copy is **Mongolian (Cyrillic)**. UI strings live in
  `src/lib/translations.ts` as the `t` object — add new strings there, don't hardcode. Avoid English
  loanwords in UI ("pin" → "тэмдэглэгээ", "snapshot" → "татсан өгөгдөл", "Captcha" → "хүний шалгалт").
  Keep copy calm and informational, never fear-mongering (this is a stated product principle):
  no "risk"/"эрсдэл"/"dangerous area" labels, no red/alarm styling for statistics.
- **No invented numbers.** Every figure on screen must come from the snapshot or the DB.
- **Design system:** slate neutrals + teal accent, glassy `.surface-card` utility, rounded-2xl
  panels, lucide icons. `/map` and `/community-map` use a full-viewport "monitor" layout: the map
  fills the stage, `.monitor-panel` glass rails float over it, with a bottom status bar.
  Motion utilities (`.anim-rise`, `.anim-slide-left/right`, `.hover-lift`, `.live-dot`,
  `.mono-data`) live in `globals.css`; all animations respect `prefers-reduced-motion`.
- **Maps must be client-only:** MapLibre touches `window`, so map components are dynamically imported
  with `ssr: false`. Recharts is lazy-loaded too (`components/stats/lazy-charts.tsx`). Prefer server
  components; `"use client"` only for interactive leaves.
- **Server env:** `src/instrumentation.ts` wires Sentry only when `SENTRY_DSN` is set. In route
  handlers, report caught errors with `reportError("<static label>", error)` — never log tokens,
  bodies, IPs or coordinates.
- **Charts/colour:** sequential = single teal ramp (`RATE_COLORS`), validated with the dataviz
  skill's checker; colour is never the only carrier of meaning (labels/tables always present).
- **Emergency numbers** on `/report` are verified against official sources (date in the file);
  re-verify before changing them.
- **Privacy/safety review:** any change touching community reports, the crime snapshot, or anything
  rendering data must preserve aggregation and never expose PII or exact locations. Never render
  user-supplied strings with `setHTML`; build popup DOM with `document.createElement`/`textContent`.
- **Tests:** co-locate `*.test.ts` next to the module. Route handlers are tested by importing the
  handler and calling it with a `Request`.

## Data freshness

`scripts/import-1212-crime.mjs` resolves the 1212.mn month codes dynamically from table metadata
(the "Сар" dimension is a rolling index — never hardcode codes). Data is cumulative (өссөн дүн);
the importer takes the latest available month per year, so the newest year can be partial —
`isPartialYear()` / `getYearDataMonth()` in `crime-snapshot.ts` are used to label it in the UI.

## Secrets

`DATABASE_URL` (and any keys) live in `.env` — never commit real credentials, MSISDNs, phone numbers,
or CDR-style data; use obvious placeholders in examples.
