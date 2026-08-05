/* =============================================================
   KRGC — shared stylesheet
   Palette: wet spruce ground, fog type, blaze orange accent,
   brass for anything the club still has to confirm.
   ============================================================= */

/* ---- self-hosted fonts ----
   Download the three families from fonts.google.com, drop the
   .woff2 files in /assets/fonts/, then uncomment this block and
   delete the <link> tags in each page's <head>.

@font-face{font-family:"Big Shoulders Display";src:url("/assets/fonts/big-shoulders-display.woff2") format("woff2");font-weight:600 800;font-display:swap}
@font-face{font-family:"Public Sans";src:url("/assets/fonts/public-sans.woff2") format("woff2");font-weight:400 600;font-display:swap}
@font-face{font-family:"DM Mono";src:url("/assets/fonts/dm-mono.woff2") format("woff2");font-weight:400 500;font-display:swap}
---- */

:root{
  --ink:#0E1714;
  --surface:#16221D;
  --surface-2:#1D2C25;
  --line:rgba(232,237,233,.12);
  --line-strong:rgba(232,237,233,.22);
  --fog:#E8EDE9;
  --muted:#9AACA2;
  --blaze:#FF6A2B;
  --blaze-ink:#1A0A02;
  --blaze-soft:rgba(255,106,43,.13);
  --brass:#E3BC66;
  --bad:#FF7A7A;
  --good:#6FD39B;

  --display:"Big Shoulders Display",Impact,sans-serif;
  --body:"Public Sans",system-ui,-apple-system,sans-serif;
  --mono:"DM Mono",ui-monospace,monospace;

  --pad:1.25rem;
  --r:14px;
}
@media(min-width:700px){:root{--pad:2.5rem}}
@media(min-width:1100px){:root{--pad:4rem}}

*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}

body{
  margin:0;background:var(--ink);color:var(--fog);
  font-family:var(--body);font-size:1rem;line-height:1.6;
  -webkit-font-smoothing:antialiased;overflow-x:hidden;
}
svg,img{max-width:100%}
h1,h2,h3{font-family:var(--display);font-weight:800;line-height:.94;margin:0;text-transform:uppercase}
h1{font-size:clamp(2.6rem,10vw,6.4rem)}
h2{font-size:clamp(2rem,7vw,3.4rem)}
h3{font-size:clamp(1.25rem,4.5vw,1.6rem);letter-spacing:.015em}
p{margin:0 0 1rem}
a{color:inherit}
:focus-visible{outline:2px solid var(--blaze);outline-offset:3px;border-radius:4px}
.skip{position:absolute;left:-9999px}
.skip:focus{left:var(--pad);top:.5rem;z-index:99;background:var(--blaze);color:var(--blaze-ink);padding:.6rem 1rem;border-radius:8px}

.wrap{max-width:1200px;margin:0 auto;padding-left:var(--pad);padding-right:var(--pad)}
.narrow{max-width:760px}
.eyebrow{font-family:var(--mono);font-size:.68rem;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin:0 0 .85rem}
.muted{color:var(--muted)}
.tk{color:var(--brass);border-bottom:1px dotted var(--brass)}
.lede{font-size:clamp(1.05rem,3.4vw,1.28rem);color:var(--muted);max-width:40ch}

/* ---------- buttons ---------- */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.55rem;
  min-height:52px;padding:0 1.6rem;border-radius:999px;border:1px solid transparent;
  font-family:var(--body);font-weight:600;font-size:1rem;
  text-decoration:none;cursor:pointer;transition:transform .15s ease,background .2s ease,border-color .2s ease;
}
.btn-primary{background:var(--blaze);color:var(--blaze-ink)}
.btn-primary:hover{background:#ff7f4b}
.btn-ghost{border-color:var(--line-strong);color:var(--fog);background:transparent}
.btn-ghost:hover{border-color:var(--fog)}
.btn-sm{min-height:42px;padding:0 1.1rem;font-size:.88rem}
.btn:active{transform:translateY(1px)}
.btn-block{width:100%}
.btn[disabled]{opacity:.45;cursor:not-allowed}

/* ---------- header ---------- */
.head{
  position:sticky;top:0;z-index:60;
  display:flex;align-items:center;justify-content:space-between;gap:1rem;
  padding:.85rem var(--pad);
  background:rgba(14,23,20,.85);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--line);
}
.mark{display:flex;align-items:center;gap:.65rem;text-decoration:none;min-width:0}
.mark svg{width:30px;height:30px;flex:none}
.mark b{font-family:var(--display);font-size:1rem;letter-spacing:.04em;line-height:1.05;display:block;text-transform:uppercase}
.mark i{font-style:normal;font-family:var(--mono);font-size:.55rem;letter-spacing:.16em;color:var(--muted);text-transform:uppercase}
.nav{display:none;gap:1.3rem;align-items:center}
.nav a{font-family:var(--mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:var(--muted)}
.nav a:hover,.nav a[aria-current="page"]{color:var(--fog)}
.head-cta{display:none}
@media(min-width:1000px){.nav{display:flex}.head-cta{display:inline-flex}}

.burger{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:12px;border:1px solid var(--line-strong);background:transparent;color:var(--fog);cursor:pointer;flex:none}
.burger span{display:block;width:18px;height:2px;background:currentColor;position:relative}
.burger span::before,.burger span::after{content:"";position:absolute;left:0;width:18px;height:2px;background:currentColor}
.burger span::before{top:-6px}
.burger span::after{top:6px}
@media(min-width:1000px){.burger{display:none}}

.drawer{position:fixed;inset:0;z-index:70;background:var(--ink);display:flex;flex-direction:column;padding:1.25rem var(--pad) 2rem;transform:translateY(-100%);transition:transform .3s cubic-bezier(.3,.8,.3,1);overflow-y:auto}
.drawer[data-open="true"]{transform:none}
.drawer-top{display:flex;justify-content:flex-end;margin-bottom:1.25rem}
.drawer .close{width:46px;height:46px;border-radius:12px;border:1px solid var(--line-strong);background:transparent;color:var(--fog);font-size:1.5rem;cursor:pointer;line-height:1}
.drawer nav{display:flex;flex-direction:column}
.drawer nav a{font-family:var(--display);font-size:1.9rem;text-transform:uppercase;text-decoration:none;padding:.5rem 0;border-bottom:1px solid var(--line)}
.drawer .btn{margin-top:1.75rem}
@media (prefers-reduced-motion:reduce){.drawer{transition:none}}

/* ---------- hero ---------- */
.hero{padding:clamp(2.5rem,9vw,5.5rem) 0 clamp(2.25rem,6vw,3.5rem)}
.hero h1{margin:.5rem 0 1.1rem}
.hero h1 span{color:var(--blaze)}
.hero .lede{margin-bottom:1.75rem}
.hero-cta{display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.25rem}
@media(min-width:560px){.hero-cta{flex-direction:row;flex-wrap:wrap}}
.hero-note{font-family:var(--mono);font-size:.7rem;letter-spacing:.08em;color:var(--muted);text-transform:uppercase;margin:0}

.pagehead{padding:clamp(2.25rem,8vw,4.5rem) 0 clamp(1.5rem,4vw,2.5rem);border-bottom:1px solid var(--line)}
.pagehead h1{font-size:clamp(2.4rem,9vw,5rem);margin:.4rem 0 1rem}

/* ---------- status strip ---------- */
.status{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;margin-top:2.25rem}
@media(min-width:760px){.status{grid-template-columns:repeat(4,1fr)}}
.status > div{background:var(--surface);padding:1.05rem 1.1rem}
.status dt{font-family:var(--mono);font-size:.58rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:.4rem}
.status dd{margin:0;font-family:var(--display);font-size:1.4rem;font-weight:700;text-transform:uppercase;line-height:1}
.status dd small{display:block;font-family:var(--body);font-size:.72rem;font-weight:400;text-transform:none;color:var(--muted);margin-top:.3rem;line-height:1.35}
.live{color:var(--blaze)}
.live.closed{color:var(--bad)}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:currentColor;margin-right:.4rem;vertical-align:middle;animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.dot{animation:none}}

.notice{margin-top:1.25rem;border:1px solid var(--blaze);background:var(--blaze-soft);border-radius:var(--r);padding:1rem 1.15rem;font-size:.94rem;display:none}
.notice[data-show="true"]{display:block}

/* ---------- sections ---------- */
.section{padding:clamp(3rem,10vw,5.5rem) 0;border-top:1px solid var(--line)}
.section.plain{border-top:0}
.section-head{max-width:58ch;margin-bottom:clamp(1.75rem,5vw,2.75rem)}
.section-head p{color:var(--muted);margin-bottom:0}

/* ---------- props ---------- */
.props{display:grid;grid-template-columns:1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
@media(min-width:640px){.props{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1040px){.props{grid-template-columns:repeat(4,1fr)}}
.prop{background:var(--surface);padding:1.5rem 1.35rem}
.prop svg{width:26px;height:26px;color:var(--blaze);margin-bottom:.9rem;display:block}
.prop h3{font-size:1.1rem;margin-bottom:.4rem}
.prop p{margin:0;color:var(--muted);font-size:.92rem}

/* ---------- photos ---------- */
.gallery{display:grid;grid-template-columns:1fr;gap:1rem}
@media(min-width:700px){.gallery{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1040px){.gallery{grid-template-columns:repeat(3,1fr)}}
.gallery.hero-strip{margin-top:2.25rem}
.shot{position:relative;border-radius:var(--r);overflow:hidden;background:var(--surface);border:1px solid var(--line);aspect-ratio:4/3}
.shot img{width:100%;height:100%;object-fit:cover;display:block}
.shot figcaption{position:absolute;left:0;right:0;bottom:0;padding:.7rem .9rem;font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;background:linear-gradient(transparent,rgba(14,23,20,.9));color:var(--fog)}
.shot.empty{display:flex;align-items:center;justify-content:center;padding:1.25rem;text-align:center;border-style:dashed;border-color:var(--line-strong)}
.shot.empty p{margin:0;font-family:var(--mono);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);line-height:1.7}
.shot.empty p b{display:block;color:var(--brass);margin-bottom:.35rem}

/* ---------- membership ---------- */
.join{background:var(--surface)}
.tiers{display:flex;gap:.5rem;overflow-x:auto;padding-bottom:.4rem;margin-bottom:1.5rem;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.tiers::-webkit-scrollbar{display:none}
.tier{flex:0 0 auto;min-height:46px;padding:0 1.15rem;border-radius:999px;cursor:pointer;border:1px solid var(--line-strong);background:transparent;color:var(--muted);font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;transition:background .2s,color .2s,border-color .2s}
.tier[aria-selected="true"]{background:var(--blaze);border-color:var(--blaze);color:var(--blaze-ink)}

.panel{display:grid;grid-template-columns:1fr;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;background:var(--surface-2)}
@media(min-width:920px){.panel{grid-template-columns:1.05fr 1fr}}
.panel-left{padding:clamp(1.5rem,4vw,2.25rem);border-bottom:1px solid var(--line)}
@media(min-width:920px){.panel-left{border-bottom:0;border-right:1px solid var(--line)}}
.price{display:flex;align-items:baseline;gap:.6rem;margin:.35rem 0}
.price b{font-family:var(--display);font-size:clamp(3.2rem,12vw,4.4rem);font-weight:800;line-height:.85}
.price span{font-family:var(--mono);font-size:.78rem;letter-spacing:.1em;color:var(--muted);text-transform:uppercase}
.plan-for{color:var(--muted);margin-bottom:1.5rem}
.perks{list-style:none;margin:0 0 1.5rem;padding:0}
.perks li{display:grid;grid-template-columns:1.35rem 1fr;gap:.7rem;padding:.6rem 0;border-top:1px solid var(--line);font-size:.94rem;align-items:start}
.perks li:first-child{border-top:0}
.perks svg{width:16px;height:16px;color:var(--blaze);margin-top:.32rem}

.panel-form{padding:clamp(1.5rem,4vw,2.25rem)}
.steps{display:flex;gap:.5rem;margin-bottom:1.35rem;font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.steps b{color:var(--blaze);font-weight:500}

/* ---------- forms ---------- */
.field{margin-bottom:1rem}
.field label{display:block;font-family:var(--mono);font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:.4rem}
.field input,.field select,.field textarea{
  width:100%;min-height:52px;padding:.8rem 1rem;border-radius:10px;
  background:var(--ink);border:1px solid var(--line-strong);color:var(--fog);
  font-family:var(--body);font-size:1rem;
}
.field textarea{min-height:88px;resize:vertical}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--blaze);outline:none}
.field input[aria-invalid="true"]{border-color:var(--bad)}
.field .sig{font-family:var(--display);font-size:1.6rem;letter-spacing:.03em}
.two{display:grid;grid-template-columns:1fr;gap:0 1rem}
@media(min-width:520px){.two{grid-template-columns:1fr 1fr}}
.checkline{display:grid;grid-template-columns:24px 1fr;gap:.75rem;align-items:start;padding:.65rem 0;border-top:1px solid var(--line);font-size:.93rem}
.checkline:first-of-type{border-top:0}
.checkline input{width:22px;height:22px;min-height:0;accent-color:var(--blaze);margin-top:.15rem}
.form-note{font-size:.8rem;color:var(--muted);margin:.9rem 0 0}
.alert{display:none;margin-top:1rem;padding:1rem 1.15rem;border-radius:10px;font-size:.92rem;border:1px solid var(--line-strong);background:var(--surface)}
.alert[data-show="true"]{display:block}
.alert.ok{background:var(--blaze-soft);border-color:var(--blaze)}
.alert.bad{border-color:var(--bad);color:var(--fog)}
.err{color:var(--bad);font-size:.8rem;margin:.35rem 0 0;display:none}
.err[data-show="true"]{display:block}

/* ---------- range plan ---------- */
.planwrap{border:1px solid var(--line);border-radius:var(--r);background:var(--surface);padding:clamp(.9rem,3vw,1.6rem)}
.scroller{overflow-x:auto;-webkit-overflow-scrolling:touch}
.scroller svg{display:block;min-width:640px;width:100%;height:auto}
.hint{font-family:var(--mono);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:.75rem 0 0}
@media(min-width:760px){.hint{display:none}}
#planNote{font-family:var(--mono);font-size:.85rem;line-height:1.5;margin:1rem 0 0;padding-top:1rem;border-top:1px solid var(--line);min-height:3.6em;color:var(--muted)}
#planNote b{color:var(--blaze);font-weight:500}
.tick{cursor:pointer}
.tick rect{fill:transparent}
.tick .stem{stroke:#8FA39A;stroke-width:2}
.tick .label{font-family:"DM Mono",monospace;font-size:16px;fill:#C6D3CC}
.tick:hover .stem,.tick[data-active="true"] .stem{stroke:#FF6A2B;stroke-width:4}
.tick:hover .label,.tick[data-active="true"] .label{fill:#FF6A2B}
.tick:focus{outline:none}
.tick:focus-visible rect{stroke:#FF6A2B;stroke-width:2;fill:rgba(255,106,43,.08)}
.band{fill:none;stroke:#5E7269;stroke-width:1;stroke-dasharray:4 5}
.bandlabel{font-family:"DM Mono",monospace;font-size:14px;letter-spacing:.14em;fill:#8FA39A}
.planfig{fill:#C6D3CC}
.plantext{font-family:"Public Sans",sans-serif;font-size:15px;fill:#8FA39A}

/* ---------- accordion ---------- */
.acc{border-top:1px solid var(--line)}
.acc:last-of-type{border-bottom:1px solid var(--line)}
.acc button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:1rem;background:transparent;border:0;color:var(--fog);cursor:pointer;text-align:left;padding:1.15rem 0;font-family:var(--display);font-size:1.2rem;text-transform:uppercase;letter-spacing:.02em}
.acc .chev{flex:none;width:22px;height:22px;color:var(--blaze);transition:transform .25s ease}
.acc button[aria-expanded="true"] .chev{transform:rotate(45deg)}
.acc .body{display:none;padding:0 0 1.35rem;color:var(--muted);max-width:62ch}
.acc .body[data-open="true"]{display:block}
.acc .body p:last-child{margin-bottom:0}

/* ---------- rules ---------- */
.rules{counter-reset:r;list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
@media(min-width:820px){.rules{grid-template-columns:repeat(2,1fr)}}
.rules li{counter-increment:r;background:var(--surface);padding:1.2rem;display:grid;grid-template-columns:2.3rem 1fr;gap:.7rem}
.rules li::before{content:counter(r,decimal-leading-zero);font-family:var(--mono);font-size:.76rem;color:var(--blaze);padding-top:.35rem}
.rules strong{font-family:var(--display);font-size:1.12rem;text-transform:uppercase;display:block;margin-bottom:.2rem}
.rules .d{color:var(--muted);font-size:.89rem}
.ceasefire{margin-top:1.5rem;border:1px solid var(--blaze);border-radius:var(--r);padding:1.35rem;background:var(--blaze-soft)}
.ceasefire b{font-family:var(--display);font-size:clamp(1.8rem,6vw,2.4rem);color:var(--blaze);display:block;margin-bottom:.5rem;text-transform:uppercase}
.ceasefire p{margin:0;font-size:.95rem}

/* ---------- events ---------- */
.event{display:grid;grid-template-columns:1fr;gap:.4rem;padding:1.4rem 0;border-top:1px solid var(--line)}
.event:last-of-type{border-bottom:1px solid var(--line)}
@media(min-width:900px){.event{grid-template-columns:10rem 1fr 11rem;gap:1.5rem;align-items:start}}
.event .when{font-family:var(--mono);font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding-top:.25rem}
.event p{margin:.3rem 0 0;color:var(--muted);font-size:.92rem;max-width:56ch}
.event .tag{font-family:var(--mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:.6rem}
.event.hot .tag{color:var(--blaze)}
.event .side{display:flex;flex-direction:column;align-items:flex-start;gap:.5rem}

/* ---------- tables (results) ---------- */
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r);background:var(--surface)}
table{width:100%;border-collapse:collapse;min-width:520px}
th,td{text-align:left;padding:.85rem 1rem;border-bottom:1px solid var(--line);font-size:.93rem}
th{font-family:var(--mono);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:400}
tbody tr:last-child td{border-bottom:0}
td.num{font-family:var(--mono);white-space:nowrap}
tbody tr:nth-child(1) td.rank{color:var(--blaze)}
.filters{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.25rem}

/* ---------- find ---------- */
.find{display:grid;grid-template-columns:1fr;gap:2rem}
@media(min-width:920px){.find{grid-template-columns:1fr 1fr;gap:4rem}}
.kv{list-style:none;margin:0;padding:0}
.kv li{display:grid;grid-template-columns:6.5rem 1fr;gap:1rem;padding:.95rem 0;border-top:1px solid var(--line);font-size:.94rem}
.kv li:last-child{border-bottom:1px solid var(--line)}
.kv .k{font-family:var(--mono);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);padding-top:.25rem}
.tel{font-family:var(--display);font-size:clamp(2.2rem,8vw,3rem);font-weight:800;text-decoration:none;display:inline-block;line-height:1;border-bottom:3px solid var(--blaze)}

/* ---------- final cta ---------- */
.final{background:var(--blaze);color:var(--blaze-ink);text-align:center;padding:clamp(3rem,10vw,5rem) 0}
.final h2{color:var(--blaze-ink);margin-bottom:1rem}
.final p{color:rgba(26,10,2,.78);max-width:44ch;margin:0 auto 1.75rem}
.final .btn{background:var(--blaze-ink);color:var(--blaze)}
.final .btn:hover{background:#000}

/* ---------- footer ---------- */
.foot{border-top:1px solid var(--line);padding:2.5rem var(--pad) 6.5rem;display:grid;gap:1.5rem}
@media(min-width:800px){.foot{grid-template-columns:2fr 1fr 1fr;padding-bottom:3rem}}
.foot h4{font-family:var(--mono);font-size:.6rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin:0 0 .75rem;font-weight:400}
.foot ul{list-style:none;margin:0;padding:0}
.foot li{margin-bottom:.4rem;font-size:.9rem}
.foot a{text-decoration:none}
.foot a:hover{color:var(--blaze)}
.foot .fine{font-family:var(--mono);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:.75rem}

/* ---------- sticky mobile join bar ---------- */
.stickybar{
  position:fixed;left:0;right:0;bottom:0;z-index:65;
  display:flex;align-items:center;gap:.85rem;
  padding:.7rem var(--pad);padding-bottom:calc(.7rem + env(safe-area-inset-bottom));
  background:rgba(14,23,20,.95);backdrop-filter:blur(14px);border-top:1px solid var(--line);
  transform:translateY(120%);transition:transform .3s ease;
}
.stickybar[data-show="true"]{transform:none}
.stickybar .txt{flex:1;min-width:0}
.stickybar .txt b{display:block;font-family:var(--display);font-size:1.15rem;text-transform:uppercase;line-height:1}
.stickybar .txt span{font-family:var(--mono);font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.stickybar .btn{flex:none}
@media(min-width:1000px){.stickybar{display:none}}
@media (prefers-reduced-motion:reduce){.stickybar{transition:none}}

/* ---------- gate (members) ---------- */
.gate{max-width:420px;margin:0 auto;text-align:center}
.gate .field input{text-align:center;font-family:var(--mono);letter-spacing:.3em}
.locked{display:none}
.locked[data-unlocked="true"]{display:block}
.gatecode{font-family:var(--display);font-size:clamp(3rem,14vw,5rem);color:var(--blaze);letter-spacing:.1em;line-height:1}

/* ---------- admin ---------- */
.codeblock{
  background:#0a110e;border:1px solid var(--line-strong);border-radius:10px;
  padding:1rem;font-family:var(--mono);font-size:.8rem;white-space:pre;overflow-x:auto;color:var(--fog);
}
.toggle{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.25rem}

/* ---------- reveal ---------- */
.rise{opacity:0;transform:translateY(16px)}
.rise.in{opacity:1;transform:none;transition:opacity .55s ease,transform .55s cubic-bezier(.2,.7,.3,1)}
@media (prefers-reduced-motion:reduce){.rise{opacity:1;transform:none;transition:none}}

@media print{
  .head,.drawer,.stickybar,.foot,.btn{display:none!important}
  body{background:#fff;color:#000}
  .wrap{max-width:none}
}
