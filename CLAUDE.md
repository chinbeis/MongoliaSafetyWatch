# CLAUDE.md

Guidance for working in this repository.

## What this is

**CatchPred** — a Mongolian-language public-safety / crime-information website ("аюулгүй байдлын мэдээлэл"). It presents *aggregated, anonymized* crime statistics on maps and charts, plus prevention education and emergency-reporting channels. It also lets the public drop anonymous, area-level safety pins (community reports).

**Privacy is the core constraint.** The platform must never publish personally identifiable information, exact addresses, or individual cases. Official data is aggregated to aimag level (district level for Ulaanbaatar only). It is explicitly *not* an official police portal and does not accept crime reports — it points users to official channels (102, 108, etc.).

`LAUNCH_PLAN.md` is the launch execution plan; where it and this file disagree on what *should* be built, the plan wins.

## Stack

- **Next.js 16** (App Router) + **React 19** (React Compiler enabled via `babel-plugin-react-compiler`)
- **TypeScript** (strict), path alias `@/*` → `src/*`
- **Tailwind CSS v4** (`@import "tailwindcss"` in `globals.css`, theme tokens via `@theme inline`)
- **Drizzle ORM** + **Neon serverless Postgres** (`@neondatabase/serverless`, HTTP driver — no interactive transactions)
- **Maps:** **MapLibre GL** (there is no Leaflet in this project)
- **Charts:** Recharts
- **Validation:** zod
- **Tests:** Vitest
- **Icons:** lucide-react
- Fonts via `next/font`: Plus Jakarta Sans (Latin only — it has no Cyrillic glyphs), Inter and JetBrains Mono (both with `cyrillic` + `cyrillic-ext`; ө ү Ө Ү are in `cyrillic-ext`)

## Commands

```bash
pnpm dev            # next dev (default port 3000)
pnpm build          # next build — must succeed with NO env vars (CI checks this)
pnpm start          # next start
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest run
pnpm db:migrate     # drizzle-kit migrate — NEVER against production without owner approval
pnpm import:1212    # node scripts/import-1212-crime.mjs (1212.mn crime import)
```

`pnpm` is the package manager (version pinned via `packageManager`; Node version in `.nvmrc`).
CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build with no secrets.

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

1. **Official crime stats (map + stats pages):** served from a **static JSON snapshot** at
   `src/data/1212-crime-snapshot.json`, read through `src/lib/crime-snapshot.ts`. Frozen at build
   time. It is **never** stored in the database (the old `crime_statistics` / `data_sources` tables
   held fake seed data and are dropped by migration `0003`).
2. **Community reports (community-map page):** real-time, stored in Postgres (`community_reports`
   table) via `/api/community-reports`. Writes go through bot protection and a rate limiter
   (`src/lib/rate-limit.ts`), and are validated server-side (Mongolia geo-bounds, radius bounds).
   Reports are anonymous and area-level only (lat/lng + radius + category, no PII, no free text).
   Flagging/moderation columns were added in migration `0002`.

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
  api/              community-reports/*
src/components/
  layout/navigation.tsx     Navbar + Footer (Footer returns null on /map and /community-map —
                            those pages render their own monitor status bar)
  map/                      MapLibre components (client-only, dynamic import with ssr: false)
  ui/disclaimer.tsx         Reusable legal/info disclaimer
  ui/monitor.tsx            MonitorPanel / LiveBadge / LiveClock (wallboard chrome)
  ui/animated-number.tsx    Count-up number (respects prefers-reduced-motion)
src/lib/            env.ts, public-env.ts, crime-snapshot.ts, translations.ts,
                    community-captcha.ts, community-categories.ts, rate-limit.ts
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
  with `ssr: false`.
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
