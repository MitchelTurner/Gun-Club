# Ketchikan Rod & Gun Club — website

Vanilla HTML/CSS/JS. Phase 1 is the offline static site. Phase 2 adds
Cloudflare Pages Functions + D1 for identity, check-in, scoring, hours,
and closure alerts. No npm, no bundler.

```
index.html              home — membership, range, matches, on-range count
first-visit.html        visitor funnel: hours → rules → waiver → contact
visitors.html / waiver.html / members.html
sitemap.xml / robots.txt  local SEO
assets/img/og.jpg       Open Graph share image (1200×630)
range-card.html         ballistic come-up card (offline)
targets.html / play.html / standings.html / recaps.html
checkin.html            QR gate check-in (Phase 2)
score.html              RO live scoring + offline queue (Phase 2)
admin.html              officer status, hours, match create (Phase 2)
offline.html / sw.js / manifest.webmanifest
assets/js/config.js     ← club edit point
assets/js/api.js        Phase 2 API client + score queue
functions/api/*         Cloudflare Pages Functions
functions/_lib/*        shared auth, crypto, alerts
functions/_middleware.js
schema.sql              D1 schema
wrangler.toml           Pages + D1 binding
data/*.json             Phase 1 static fallbacks
```

## Phase 2 setup (Cloudflare)

1. `wrangler d1 create krgc` — paste `database_id` into `wrangler.toml`
2. `wrangler d1 execute krgc --file=schema.sql`
3. Set Pages secrets:
   - `SESSION_SECRET` (long random)
   - `TURNSTILE_SECRET_KEY`
   - `PASSCODE_FALLBACK` (same as `config.memberPasscode` for the season)
   - Optional: `RESEND_API_KEY`, `MAGIC_LINK_FROM`, `TWILIO_*`, `SITE_URL`
   - Dev only: `ALLOW_DEV_LINKS=1` returns magic links in JSON
4. Put the Turnstile **site** key in `assets/js/config.js` → `turnstile.siteKey`
5. Deploy as Cloudflare Pages with Functions; output directory `/`

## Launch checklist (Phase 1 still applies)

Search `TODO` and `class="tk"`. Fill `config.js`, form endpoint, Stripe,
waiver legal review, photos. Replace `assets/img/og.jpg` with a real range
photo when you have one (keep 1200×630). NAP / hours / directions copy lives
in `config.js` → `site.hoursSummary`, `site.directionsSummary`.

## Posting a match recap (Phase 1 path)

Add to `data/recaps.json` and `data/results.json`. Or close a live match
via `score.html` → Publish (writes D1; `/api/results` feeds standings).

## Day-to-day

| Task | Where |
|---|---|
| Close the range + alert subscribers | `admin.html` (API) |
| Gate check-in | Printed QR → `checkin.html?loc=gate` |
| Live scores | `score.html` (works offline, syncs later) |
| Work-party hours | `admin.html` |
| Passcode fallback | `members.html` — keep for one season |
| Next-match tile / series dates | `config.js` → `schedule.series` or `data/schedule.json` |
| FAQ / guest / loaner copy | `config.js` → `policy` |

## Privacy

- Public `/api/onrange` returns a **count only** — never names
- Members see names when signed in
- Check-in rows purge after 90 days (opportunistic on API traffic)
- Closure SMS includes STOP; email has one-tap unsubscribe

## Commit convention

One commit per numbered build-spec section (`2.1`, `2.2`, …).
