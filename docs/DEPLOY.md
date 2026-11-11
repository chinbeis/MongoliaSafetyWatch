# Deploying CatchPred

Target: **Vercel** (functions in `sin1`, Singapore) + the existing **Neon** Postgres project
(`ap-southeast-1`). Everything below that touches production — migrations, DNS, secrets — is done
by the owner, or with the owner's explicit approval.

## 0. What you need

| Account | Used for | Required |
|---|---|---|
| Vercel (owner's) | hosting, Web Analytics | yes |
| Neon (existing project) | community map database | yes |
| Cloudflare | Turnstile bot protection | yes for a writable community map |
| Sentry | server error reporting | optional |
| Uptime monitor (UptimeRobot, Better Stack…) | `/api/health` probe | yes |

## 1. Neon: separate branches

1. In the Neon console, create a branch **`dev`** from the production branch. Preview
   deployments and local development use `dev`; nothing else ever writes to production.
2. Copy both connection strings (pooled, `sslmode=require`). Keep them out of git.

## 2. Secrets

Generate each secret separately (≥ 32 characters; `src/lib/env.ts` refuses shorter values,
placeholders, or missing values in production):

```bash
openssl rand -base64 48   # run once per secret
```

## 3. Vercel project

1. *Add New → Project*, import the GitHub repository. Framework: Next.js (detected).
   `vercel.json` pins the region to `sin1`; Node comes from `engines.node` (24.x).
2. **Environment variables** — set Production and Preview separately:

| Variable | Production | Preview |
|---|---|---|
| `DATABASE_URL` | Neon **production** branch | Neon **dev** branch |
| `COMMUNITY_CAPTCHA_SECRET` | new secret | different secret |
| `RATE_LIMIT_SALT_SECRET` | new secret | different secret |
| `ADMIN_TOKEN` | new secret | different secret |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | real site key | `1x00000000000000000000AA` (Cloudflare test key, always passes) |
| `TURNSTILE_SECRET_KEY` | real secret | `1x0000000000000000000000000000000AA` (Cloudflare test secret) |
| `NEXT_PUBLIC_SITE_URL` | `https://catchpred.mn` | leave empty or the preview URL |
| `NEXT_PUBLIC_MAP_STYLE_URL` | leave empty (OpenFreeMap) | leave empty |
| `SENTRY_DSN` | Sentry DSN (optional) | same or empty |
| `COMMUNITY_REPORTS_READONLY` | `1` until legal review is done (§8.5), then empty | empty |
| `CSP_REPORT_ONLY` | empty (enforce) | `1` for the first preview, then empty |

3. *Settings → Analytics*: enable **Web Analytics** (cookieless; the `<Analytics/>` component
   only renders on Vercel builds).
4. Without Turnstile keys a production deployment is automatically **read-only** for the
   community map (by design, LAUNCH_PLAN §8.3).

## 4. Database migrations

Migrations live in `drizzle/` and run in journal order:

| # | File | Effect | Destructive |
|---|---|---|---|
| 0000 | `0000_wide_roland_deschain.sql` | legacy stats tables | – |
| 0001 | `0001_community_reports.sql` | `community_reports` | – |
| 0002 | `0002_community_report_moderation.sql` | `flag_count`, `hidden` | – |
| 0003 | `0003_drop_legacy_stats.sql` | drops `crime_statistics`, `data_sources`, `crime_category` (fake seed data only) | **yes** |
| 0004 | `0004_rate_limits.sql` | `rate_limits` table | – |
| 0005 | `0005_community_report_status.sql` | `status` enum; maps `hidden=true` → `pending_review`; drops `hidden` | **yes** |
| 0006 | `0006_community_report_flags.sql` | per-client flags table; resets `flag_count` of visible pins | **yes** (counts) |
| 0007 | `0007_community_report_privacy.sql` | snaps existing coordinates to the 250 m grid, clamps radius, drops `title`/`details`/`area_label` | **yes** |

`drizzle-kit migrate` applies every pending migration in one run — approve them as a batch.

**Order of operations**

1. **Dev branch first:**
   ```bash
   DATABASE_URL='<neon dev branch url>' pnpm db:migrate
   ```
   Deploy a preview against it and run §6.
2. **Production (owner approval required):**
   1. In Neon, create a branch from production named `backup-YYYYMMDD` (instant snapshot).
   2. ```bash
      DATABASE_URL='<neon production url>' pnpm db:migrate
      ```
   3. Verify:
      ```sql
      SELECT status, count(*) FROM community_reports GROUP BY status;
      SELECT max(length(split_part(latitude::text, '.', 2))) FROM community_reports; -- ≤ 4
      SELECT min(radius_meters), max(radius_meters) FROM community_reports;         -- 250 … 2000
      ```
   4. Deploy the application **after** the migrations: the new code expects the new columns.

## 5. Sentry (optional)

1. Create a Next.js project, copy the DSN into `SENTRY_DSN`.
2. Only server-side errors are sent; no user info, IP, cookies, headers, bodies, query strings
   or SQL parameters (see `src/instrumentation.ts`, `src/lib/sentry-scrub.ts`).
3. Alerts:
   - **Issue alert** on events with tag `alert:true` → notify the owner immediately (the
     community-pin circuit breaker: > 300 new pins in an hour).
   - **Metric alert** on error count (> 10 in 5 minutes) for the production environment.

## 6. Verify a preview before promoting

```bash
# Mobile smoke test against the deployment (CSP enforced, no console errors)
E2E_BASE_URL=https://<preview>.vercel.app pnpm test:e2e e2e/smoke.spec.ts
# No CSP violations with the live map tiles
E2E_LIVE=1 E2E_BASE_URL=https://<preview>.vercel.app pnpm test:e2e e2e/csp-live.spec.ts
# Abuse test (creates a few test pins on the dev branch — remove them in /admin afterwards)
node scripts/abuse-check.mjs https://<preview>.vercel.app
# Headers
curl -sI https://<preview>.vercel.app | grep -iE 'content-security|strict-transport|x-frame|referrer|permissions'
```

Run the preview with `CSP_REPORT_ONLY=1` first; once the console shows no violations, remove it
and redeploy so the policy is enforced.

## 7. Domain

1. Vercel → *Settings → Domains*: add `catchpred.mn` (primary) and `www.catchpred.mn`
   (redirect to the apex). Follow the DNS records Vercel shows — **owner action**.
2. Set `NEXT_PUBLIC_SITE_URL=https://catchpred.mn` for Production and redeploy (canonical URLs,
   sitemap and Open Graph tags use it).
3. Add the domain to the Turnstile widget's hostname list.
4. Check the Open Graph preview with the Facebook Sharing Debugger.

## 8. Uptime

Point the monitor at `https://catchpred.mn/api/health` every 5 minutes; alert on anything other
than HTTP 200. The response is `{ ok, env, db, communityWrites, dataThrough }` — no secrets.

## 9. Rollback

- **Application:** Vercel → *Deployments* → previous production deployment → *Instant Rollback*.
  Exercise this once on a preview before launch.
- **Database:** restore from the `backup-YYYYMMDD` branch (Neon → *Branches* → *Restore*), or
  point-in-time restore. Roll the application back first if the schema changed.
