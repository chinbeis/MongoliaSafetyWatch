# CLAUDE.md

Guidance for working in this repository.

## What this is

**CatchPred** — a Mongolian-language public-safety / crime-information website ("аюулгүй байдлын мэдээлэл"). It presents *aggregated, anonymized* crime statistics on maps and charts, plus prevention education and emergency-reporting channels. It also lets the public drop anonymous, area-level safety pins (community reports).

**Privacy is the core constraint.** The platform must never publish personally identifiable information, exact addresses, or individual cases. All official data is aggregated to region level (~1km+). It is explicitly *not* an official police portal and does not accept crime reports — it points users to official channels (102, 108, etc.).

## Stack

- **Next.js 16** (App Router) + **React 19** (React Compiler enabled via `babel-plugin-react-compiler`)
- **TypeScript** (strict), path alias `@/*` → `src/*`
- **Tailwind CSS v4** (`@import "tailwindcss"` in `globals.css`, theme tokens via `@theme inline`)
- **Drizzle ORM** + **Neon serverless Postgres** (`@neondatabase/serverless`, also `pg`)
- **Maps:** Leaflet + `leaflet.heat` (heatmap/community pins); MapLibre GL is installed
- **Charts:** Recharts
- **Icons:** lucide-react
- Fonts: Plus Jakarta Sans + Inter (cyrillic subset) via `next/font`

## Commands

```bash
pnpm dev            # next dev (default port 3000)
pnpm build          # next build
pnpm start          # next start
pnpm lint           # eslint
pnpm db:migrate     # drizzle-kit migrate (applies drizzle/*.sql)
pnpm import:1212    # node scripts/import-1212-crime.mjs (1212.mn crime import)
```

`pnpm` is the package manager (see `pnpm-lock.yaml` / `pnpm-workspace.yaml`).

## Data model — two distinct sources

There are **two data paths**, and it's important not to conflate them:

1. **Official crime stats (map + stats pages):** served from a **static JSON snapshot** at
   `src/data/1212-crime-snapshot.json`, read through `src/lib/crime-snapshot.ts`. This is frozen at
   build time — the `crime_statistics` / `data_sources` Drizzle tables exist and have stat API routes
   (`/api/stats/*`), but the map/stats UI currently reads the snapshot, not the DB.
2. **Community reports (community-map page):** real-time, stored in Postgres (`community_reports`
   table) via `/api/community-reports`. Writes are protected by a math CAPTCHA
   (`src/lib/community-captcha.ts`, HMAC-signed token) and validated server-side (Mongolia geo-bounds,
   radius 50–5000m). Reports are anonymous and area-level only (lat/lng + radius + category, no PII).

Schema lives in `src/db/schema.ts`; the Drizzle client in `src/db/index.ts` normalizes several
`DATABASE_URL` formats. Migrations are in `drizzle/`.

## Layout of `src`

```
src/app/            App Router pages (most are "use client") + /api routes
  map/              Official crime heatmap (snapshot data)
  stats/            Charts & trends (snapshot data)
  community-map/    Anonymous community pins (DB-backed, captcha)
  education/        Static prevention content
  report/           Emergency numbers & official channels (static)
  about|terms|privacy|data-sources/   Static info pages
  api/              stats/*, community-reports/*, data-sources
src/components/
  layout/navigation.tsx     Navbar + Footer (Footer has a special compact mode on /map)
  map/                      Leaflet wrappers (dynamic import, SSR off)
  ui/disclaimer.tsx         Reusable legal/info disclaimer
src/lib/            crime-snapshot.ts, translations.ts, community-captcha.ts
src/db/             schema.ts, index.ts, seed.ts
```

## Conventions

- **Language:** all user-facing copy is **Mongolian (Cyrillic)**. UI strings live in
  `src/lib/translations.ts` as the `t` object — add new strings there, don't hardcode. Keep copy
  calm and informational, never fear-mongering (this is a stated product principle).
- **Design system:** slate neutrals + teal accent (`--accent: #0f766e`), glassy `.surface-card`
  utility, rounded-2xl panels, lucide icons. Note: `report/page.tsx` currently uses a `stone` palette
  and is visually out of sync with the rest of the site.
- **Maps must be client-only:** Leaflet touches `window`, so map components are dynamically imported
  with `ssr: false` via the wrappers in `src/components/map/`.
- **Privacy/safety review:** any change touching community reports, the crime snapshot, or anything
  rendering data must preserve aggregation and never expose PII or exact locations. When rendering
  user-supplied strings into Leaflet popups, escape them (see `escapeHtml` in `community-report-map.tsx`).

## Known rough edges (as of this writing)

- `report/page.tsx` — two "online resource" links are broken: they use `target="https://…"` with
  `href="#"` instead of putting the URL in `href`.
- `map/page.tsx` hardcodes the Ulaanbaatar hotspot id (`"5"`).
- `about/page.tsx` has a placeholder contact email (`info@example.mn`).
- API routes set no `Cache-Control` headers.
- No rate limiting on community-report POSTs beyond the CAPTCHA.

## Secrets

`DATABASE_URL` (and any keys) live in `.env` — never commit real credentials, MSISDNs, phone numbers,
or CDR-style data; use obvious placeholders in examples.
