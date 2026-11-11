# Runbook

Operational procedures for the live site. Deployment and first-time setup: `docs/DEPLOY.md`.

## Contacts

| Role | Who | How |
|---|---|---|
| Owner / on-call | _fill in_ | _fill in_ |
| Moderation (default: owner, daily) | _fill in_ | `/admin` |
| Public takedown requests | — | `info@catchpred.mn` (confirm the mailbox exists) |
| Legal | owner's counsel | — |

## Emergency: stop all community-map writes

Use when the map is being abused, a defamatory wave is underway, or legal asks.

1. Vercel → *Settings → Environment Variables* → Production → set `COMMUNITY_REPORTS_READONLY=1`.
2. *Deployments* → latest production → *Redeploy* (environment changes need a redeploy, ~2 min).
3. Check: `curl https://catchpred.mn/api/health` shows `"communityWrites":"readonly"`; the form
   on `/community-map` shows the read-only notice. Existing pins stay visible; to hide them,
   moderate in `/admin`.
4. To undo: remove the variable and redeploy.

## Daily moderation

1. Open `/admin`, enter `ADMIN_TOKEN` (kept only for the browser session).
2. **Хянах** tab: pins that 3 different clients flagged. They are hidden from the public map.
   - **Сэргээх** (restore): visible again, flags cleared.
   - **Устгах** (remove): hidden permanently.
3. Takedown e-mails: find the pin by category, date and approximate area in the **Нийтэд
   харагдаж буй** tab and remove it. Reply without asking for personal details.
4. Five wrong tokens from one client lock that client out for 15 minutes.

## Alerts

| Alert | Meaning | Action |
|---|---|---|
| Sentry `alert:true` "circuit breaker tripped" | > 300 new pins in one hour site-wide; new pins get 503 for the rest of the hour | Look at `/admin` → visible pins. If it is abuse, switch to read-only (above) and moderate. |
| Uptime: `/api/health` not 200 | `env: invalid` → a required variable is missing/weak; `db: error` → Neon unreachable | Fix the variable in Vercel and redeploy; check Neon status. Statistics pages keep working (static). |
| Sentry error spike | API failures | Check Vercel function logs; roll back if it started with a deploy. |

## Monthly data refresh

- `.github/workflows/refresh-data.yml` runs on the 16th and 26th (11:00 Ulaanbaatar). When
  1212.mn has new data it opens a PR **"data: 1212.mn refresh through YYYY-MM"**.
- Review: data month advanced; national and Ulaanbaatar figures in the PR body look plausible
  next to last month's; skim the revision warnings (decreases in cumulative figures are normal
  NSO revisions — large unexplained drops are not). Merge → Vercel deploys.
- PRs opened with the default token don't trigger CI; either set a `DATA_REFRESH_TOKEN` repo
  secret (fine-grained PAT) or re-run CI on the PR before merging.
- Manual refresh: `pnpm import:1212` locally, commit `src/data` and `public/data`, open a PR.
- If the importer fails validation: read the listed problems. Typical causes: 1212.mn renamed a
  dimension or table, a month is missing, the API is down (retry later). Never hand-edit the
  snapshot to make validation pass.

## Rotating secrets

Change in Vercel (Production and/or Preview), then redeploy.

| Secret | Side effects of rotating |
|---|---|
| `ADMIN_TOKEN` | Moderators must sign in again. |
| `RATE_LIMIT_SALT_SECRET` | Rate-limit counters restart; a client could flag a pin again once. Harmless. |
| `COMMUNITY_CAPTCHA_SECRET` | Outstanding math challenges (dev fallback only) become invalid. |
| `TURNSTILE_SECRET_KEY` | Rotate in Cloudflare first, then update here. |
| `DATABASE_URL` | Reset the role password in Neon, update, redeploy immediately. |
| `SENTRY_DSN` | Generate a new key in Sentry, update, revoke the old one. |

Never paste a secret into an issue, PR, chat or log. The admin token is never logged by the app.

## Map tiles down

The site falls back to a plain background (pins and the choropleth still render). To switch
provider: set `NEXT_PUBLIC_MAP_STYLE_URL` **and** `NEXT_PUBLIC_MAP_ATTRIBUTION` (the provider's
required credit) and redeploy. The CSP automatically allows the style's host; if the new style
loads tiles, glyphs or sprites from *other* hosts, add them in `src/lib/security-headers.ts`.

## Rollback

See `docs/DEPLOY.md` §9. Application: Vercel *Instant Rollback*. Database: restore the Neon
backup branch taken before the last migration.
