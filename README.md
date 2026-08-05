# Ketchikan Rod & Gun Club — website

Static site. No build step, no framework, no server. Every page is plain
HTML sharing one stylesheet and one script.

```
index.html          home — membership, range, matches, FAQ
first-visit.html    walkthrough for people who have never shot
visitors.html       out-of-town shooters + visit request
waiver.html         liability waiver, signed online
members.html        gate code, documents, results, bay requests (noindex)
admin.html          officer tool: set the range status (noindex)
assets/js/config.js ← the only file you edit for normal changes
data/status.json    open/closed + banner, written by admin.html
data/results.json   match results; feeds the season leaderboard
```

## Launch checklist

Nothing here is guessed. Anything the club still has to confirm shows on
the site in **brass with a dotted underline** (`.tk`). Search the source for
`TODO` and for `class="tk"`.

**Must do before launch**

1. `assets/js/config.js` — real domain, email, dues, gate code, member passcode.
2. **Form endpoint.** Set `formEndpoint` to a Formspree/Basin/Netlify Forms URL.
   Until then every form falls back to opening the visitor's mail app, which
   fails silently on some mobile browsers.
3. **Stripe.** Create one Payment Link per membership type, paste the URLs into
   `config.stripe`. Empty strings hide the pay button and show the invoice path
   instead, so it degrades cleanly.
4. **Waiver legal review.** The waiver text is a draft and says so on the page.
   An Alaska attorney needs to review it, and the insurer needs to confirm that
   a typed signature is acceptable. Remove the red banner in `waiver.html` once
   that's done.
5. **Photos.** Drop JPGs into `assets/img/`:
   `firing-line.jpg`, `rimfire-match.jpg`, `silhouette.jpg`, `turnoff.jpg`,
   `og.jpg` (1200×630 for link previews). Missing images turn into labelled
   placeholders rather than broken icons, so the site works without them —
   but a club site with no photos reads as abandoned.
6. Delete the `.tk` rule in `assets/css/site.css` once the real values are in.

**Should do soon**

- Claim the Google Business Profile. `SportsActivityLocation` JSON-LD is already
  in `index.html`; add opening hours there once they're confirmed.
- Set `plausibleDomain` in config to see where people drop out of the join flow.
- Self-host the fonts: download the three families, put the `.woff2` files in
  `assets/fonts/`, uncomment the `@font-face` block at the top of `site.css`,
  and delete the Google Fonts `<link>` from each page's `<head>`. Saves a DNS
  round trip on slow Southeast connections.

## Deploying

Cloudflare Pages, Netlify, or GitHub Pages — all free, all fine.

Cloudflare Pages: connect the repo, leave the build command empty, set the
output directory to `/`. `_headers` and `_redirects` are already written and
are picked up automatically by Cloudflare and Netlify.

## Day-to-day, for officers

**Closing the range for a day:** open `admin.html`, set it to Closed, write the
banner message, click Copy, paste into `data/status.json`, save. The home page
updates on the next visit.

**After a match:** add a block to `data/results.json` with shooters in finishing
order. The season leaderboard on `members.html` recalculates itself.

**Changing dues:** edit the five prices in `assets/js/config.js`. The whole site
follows, including the sticky mobile bar. Update the Stripe Payment Link amounts
to match.

## Notes on the members area

The passcode is a shared secret held in memory for one page view. It keeps the
gate code off the open web and off search engines; it is not authentication and
won't stop anyone determined. Rotate it whenever the gate code changes. If the
club ever needs real accounts, that's the point to add a backend.

## Not built

Recurring auto-billing for dues and a real booking calendar both need a backend
and ongoing maintenance. Reservations here are a request form that emails an
officer, which is the right amount of machinery for a club this size.
