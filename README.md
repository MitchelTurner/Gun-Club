# Ketchikan Rod & Gun Club — website

Static site. No build step, no framework, no server. Every page is plain
HTML sharing one stylesheet and one script. Phase 1 adds offline tools
(PWA), a come-up card, printable targets, Rimfire Cup standings, games,
and match recaps.

```
index.html              home — membership, range, matches, FAQ, tools
first-visit.html        walkthrough for people who have never shot
visitors.html           out-of-town shooters + visit request
waiver.html             liability waiver, signed online
members.html            gate code, documents, results, bay requests (noindex)
range-card.html         ballistic come-up card (offline)
targets.html            printable targets (offline)
play.html               wind-call trainer + silhouette game
standings.html          Rimfire Cup, badges, records, profiles
recaps.html             match recaps index
offline.html            offline fallback shell
sw.js / manifest        PWA — service worker must stay at site root
assets/css/site.css     shared stylesheet
assets/css/print.css    print rules for wallet card + targets
assets/js/config.js     ← the only file you edit for normal changes
assets/js/site.js       shared behaviour
assets/js/ballistics.js come-up solver
assets/js/standings.js  Rimfire Cup math + badges
assets/js/games.js      training games
assets/js/pwa.js        install prompt + SW registration
data/status.json        open/closed + banner
data/results.json       match results — source of truth for standings
data/badges.json        badge definitions
data/records.json       club records board
data/recaps.json        match recaps (newest first)
_headers / _redirects   Cloudflare Pages helpers
Staticfile              Railway / Railpack static detection
```

## Launch checklist

Nothing here is guessed. Anything the club still has to confirm shows on
the site in **brass with a dotted underline** (`.tk`). Search the source for
`TODO` and for `class="tk"`.

**Must do before launch**

1. `assets/js/config.js` — real domain, email, dues, gate code, member passcode.
2. **Form endpoint.** Set `formEndpoint` to a Formspree/Basin/Netlify Forms URL.
3. **Stripe.** Create one Payment Link per membership type, paste into `config.stripe`.
4. **Waiver legal review.** Draft text — Alaska attorney + insurer sign-off.
5. **Photos.** Drop JPGs into `assets/img/` (see README there).
6. Delete the `.tk` rule in `assets/css/site.css` once real values are in.

## Posting a match recap

Add a block to `data/recaps.json` (newest first):

```json
{ "id": "2026-08-02-rimfire", "date": "2026-08-02", "title": "Rimfire — August",
  "matchId": "2026-08-02-rimfire", "body": "Two to four sentences.", "photos": [] }
```

Then add the matching scores object to `data/results.json`. Standings recompute
themselves. No other files to touch.

## Deploying

Cloudflare Pages: connect the repo, leave the build command empty, set the
output directory to `/`. `_headers` and `_redirects` are picked up
automatically. Railway/Railpack also works via `index.html` + `Staticfile`.

After each deploy that changes cached assets, bump `CACHE = "krgc-v1"` in
`sw.js` (e.g. to `krgc-v2`) so clients drop the old shell.

## Day-to-day, for officers

**Closing the range for a day:** open `admin.html` when available, or edit
`data/status.json` directly (`open`, `detail`, `notice`).

**After a match:** add scores to `data/results.json` (finishing order) and a
recap block to `data/recaps.json`.

**Changing dues:** edit the five prices in `assets/js/config.js`.

## Notes on the members area

The passcode is a shared secret held in memory for one page view. It keeps the
gate code off the open web and off search engines; it is not authentication.

## Phase 2 (not started)

Server-backed check-in, magic-link auth, live scoring, work-party hours, and
closure alerts. Do not start until Phase 1 is deployed. See the build spec.

## Not built

Recurring auto-billing for dues and a full bay booking calendar. Out of scope
for a club this size.
