/* =============================================================
   KRGC — SITE CONFIG
   This is the only file the club needs to edit for normal changes.
   Everything marked TODO must be filled in before launch.
   Add new keys; never rename or remove existing ones.
   ============================================================= */

window.KRGC = {

  /* ---------- identity (verified) ---------- */
  site: {
    name: "Ketchikan Rod & Gun Club",
    url: "https://ketchikanrodandgun.org",        // TODO: real domain
    phone: "(907) 247-8400",
    phoneHref: "+19072478400",
    email: "membership@example.org",              // TODO: real address
    mail: "PO Box 6391, Ketchikan, AK 99901",
    street: "North Tongass Highway",
    city: "Ketchikan",
    state: "AK",
    zip: "99901",
    lat: 55.4286257,
    lng: -131.7834125,
    /* Quoteable local-SEO / NAP copy — keep in sync across pages */
    hoursSummary: "Daylight hours, seven days a week. Open to the public. No night shooting — you must be able to see your backstop.",
    directionsSummary: "Eleven miles north of downtown Ketchikan on North Tongass Highway — about twenty-five minutes by car. No transit goes past the club. Cell service is unreliable at the range; arrange your ride back before you leave town.",
    directionsTurnoff: "Watch for the club sign near mile 11. The turnoff is easy to miss in the rain."
  },

  /* ---------- form handling ----------
     Point this at Formspree, Netlify Forms, Basin, or your own
     endpoint. It must accept a JSON POST. Leave empty ("") and the
     site falls back to opening the visitor's mail app.        */
  formEndpoint: "",                               // TODO e.g. "https://formspree.io/f/xxxxxxx"

  /* ---------- payments ----------
     Create one Stripe Payment Link per membership type, then paste
     the URLs here. Empty string hides the pay button and shows the
     "we'll invoice you" path instead.                          */
  stripe: {
    individual: "",                               // TODO
    family:     "",                               // TODO
    junior:     "",                               // TODO
    senior:     "",                               // TODO
    life:       ""                                // TODO
  },

  /* ---------- dues ----------
     Change these five numbers and the whole site updates.
     Keep them in sync with the Stripe Payment Link amounts.   */
  plans: {
    individual: { name:"Individual", price:"$__", unit:"per year",
      blurb:"One adult shooter, all disciplines.",
      perks:["Gate code and daylight access, seven days a week",
             "Every line: pistol, rifle to 500 yd, silhouette, trap",
             "Member rate at all club matches",
             "A vote at the annual meeting"] },

    family: { name:"Family", price:"$__", unit:"per year",
      blurb:"A household, including kids under 18 with an adult.",
      perks:["Everything in Individual, for the whole household",
             "Under-18s shoot under direct adult supervision",
             "Loaner rimfires for anyone learning",
             "One vote at the annual meeting"] },

    junior: { name:"Junior", price:"$__", unit:"per year",
      blurb:"Shooters under 18, supervised by an adult member.",
      perks:["Range access with a supervising adult member",
             "Free entry to the monthly rimfire match",
             "Loaner rifle and ammunition provided",
             "Coaching from members who want you to stick with it"] },

    senior: { name:"Senior", price:"$__", unit:"per year",
      blurb:"Reduced dues for members over 65.",
      perks:["Same access as an individual membership",
             "Reduced annual dues",
             "Member rate at all club matches",
             "A vote at the annual meeting"] },

    life: { name:"Life", price:"$__", unit:"one time",
      blurb:"Paid once. Never renew again.",
      perks:["Permanent membership, no annual renewal",
             "Every line, every match, member rate for good",
             "A vote at the annual meeting",
             "Your dues go straight into the range itself"] }
  },

  /* ---------- members area ----------
     This is a shared passcode, not real authentication. It keeps
     the gate code off the public web; it will not stop anyone
     determined. Rotate it whenever the gate code changes.     */
  memberPasscode: "tongass",                      // TODO: change this
  gateCode: "____",                               // TODO: the real gate code

  /* ---------- analytics ----------
     Plausible is privacy-friendly and needs no cookie banner.
     Leave empty to run with no analytics at all.              */
  plausibleDomain: "",                            // TODO e.g. "ketchikanrodandgun.org"

  /* ---------- standings / Rimfire Cup ----------
     How shooter names appear on public standings pages.
     "full" | "last-initial" | "opt-in"
     Default last-initial. Set hidden:true on a score entry
     to list that shooter as Anonymous.                        */
  standings: {
    nameFormat: "last-initial",
    dropWorst: 2,
    winPoints: 20
  },

  /* ---------- public policy copy ----------
     Edit these strings to update FAQ / visitor pages.
     Leave dayUseFee empty to say "ask at the shack".
     Set firstVisitNote to "First visit free" only when the board confirms. */
  policy: {
    firstVisitNote: "Public welcome",
    sponsorAnswer: "No sponsor is required to shoot as a visitor. Membership applications are reviewed by the club.",
    guestAnswer: "Yes — guests are welcome with a member or on public days. Everyone signs the waiver. Non-members pay a day-use fee at the range; ask at the shack for the current amount.",
    dayUseFee: "",
    loanersNote: "Loaner rimfires are often available on rimfire match days — ask when you arrive.",
    emptyHandedNote: "On rimfire match days, loaner rifles and ammunition are often on hand. On other days, bring your own firearm or request a visit so someone can meet you.",
    meetings: "Call or email for the next meeting date"
  },

  /* ---------- match schedule (recurring series) ----------
     Used for the home “Next match” tile and event card dates.
     One-off dates / cancellations can override via data/schedule.json.
     weekday: 0=Sun … 6=Sat. week: nth that weekday in the month. */
  schedule: {
    series: [
      {
        id: "rimfire",
        name: "Rimfire match",
        short: "Rimfire",
        week: 1,
        weekday: 6,
        time: "10:00",
        hours: 3,
        cadence: "First Saturday",
        rrule: "FREQ=MONTHLY;BYDAY=1SA",
        desc: "Monthly .22 LR match at the Ketchikan Rod & Gun Club. Loaner rifles available."
      },
      {
        id: "silhouette",
        name: "Metallic silhouette",
        short: "Silhouette",
        week: 3,
        weekday: 6,
        time: "11:00",
        hours: 3,
        cadence: "Third Saturday",
        rrule: "FREQ=MONTHLY;BYDAY=3SA",
        desc: "Monthly metallic silhouette match, 40 to 100 metres."
      }
    ]
  },

  /* ---------- ballistics defaults (Ketchikan) ----------
     Station defaults for the come-up card. Marked as defaults
     in the UI — shooters should override for their day.       */
  ballistics: {
    temperatureF: 50,
    pressureInHg: 29.9,
    altitudeFt: 0,
    sightHeightIn: 1.5,
    zeroYd: 50
  },

  /* ---------- work-party hours (Phase 2) ----------
     Shown on members hours view and used by /api/hours.
     Leave null until the board sets dollar amounts — UI marks .tk. */
  hours: {
    creditPerHour: null,                          // TODO board sets $ per hour
    maxCredit: null                               // TODO board sets max $ credit
  },

  /* ---------- Cloudflare Turnstile (Phase 2) ----------
     Site key is public; secret lives in Pages env TURNSTILE_SECRET_KEY. */
  turnstile: {
    siteKey: ""                                   // TODO Turnstile site key
  },

  /* ---------- Phase 2 API ----------
     When true, clients prefer /api/* over static JSON. Falls back if offline
     or the Functions binding is missing. */
  api: {
    enabled: true,
    resultsPath: "/api/results",
    statusPath: "/api/status",
    onRangePath: "/api/onrange",
    squadPath: "/api/squad"
  }
};
