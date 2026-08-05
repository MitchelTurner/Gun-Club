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
    lng: -131.7834125
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

  /* ---------- Phase 2 placeholders (unused in Phase 1) ----------
     Added so keys exist before the server-backed season.
     Both remain .tk in the UI until the board sets them.      */
  hours: {
    creditPerHour: null,                          // TODO board sets $
    maxCredit: null                               // TODO board sets $
  }
};
