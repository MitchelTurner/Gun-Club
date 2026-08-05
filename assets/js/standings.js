/* =============================================================
   KRGC — Rimfire Cup standings, profiles, head-to-head, records
   Results.json is the only source of truth. Drop worst N finishes.
   ============================================================= */
(function(){
  "use strict";

  var C = window.KRGC || {};
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var data = { matches:[], badges:[], records:[] };

  function slugify(name){
    return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "shooter";
  }

  function rowSlug(row){
    return row.slug || slugify(row.shooter);
  }

  function formatName(shooter, hidden){
    if(hidden){ return "Anonymous"; }
    var fmt = (C.standings || {}).nameFormat || "last-initial";
    if(fmt === "full" || fmt === "opt-in"){ return shooter; }
    var parts = String(shooter).replace(/\.$/, "").split(/,\s*/);
    if(parts.length >= 2){ return parts[0] + ", " + parts[1].charAt(0) + "."; }
    return shooter;
  }

  function pointsForPlace(i){
    var win = (C.standings || {}).winPoints || 20;
    return Math.max(1, win - i);
  }

  function normalizeMatches(matches){
    return (matches || []).map(function(m){
      var copy = Object.assign({}, m);
      copy.scores = (m.scores || []).map(function(r){
        return Object.assign({}, r, { slug: rowSlug(r) });
      });
      return copy;
    });
  }

  function seasonEntries(matches, season, slug){
    var out = [];
    matches.filter(function(m){ return m.season === season; }).forEach(function(m){
      (m.scores || []).forEach(function(row, i){
        if(row.slug !== slug){ return; }
        out.push({ match: m, row: row, place: i, points: pointsForPlace(i) });
      });
    });
    return out;
  }

  function seasonPoints(matches, season, slug){
    var drop = (C.standings || {}).dropWorst || 0;
    var per = seasonEntries(matches, season, slug).map(function(e){ return e.points; });
    per.sort(function(a, b){ return a - b; }); /* drop lowest points */
    return per.slice(drop).reduce(function(s, p){ return s + p; }, 0);
  }

  function winCount(matches, season, slug){
    return seasonEntries(matches, season, slug).filter(function(e){ return e.place === 0; }).length;
  }

  function headToHeadWins(matches, season, a, b){
    var aw = 0, bw = 0;
    matches.filter(function(m){ return m.season === season; }).forEach(function(m){
      var ia = (m.scores || []).findIndex(function(r){ return r.slug === a; });
      var ib = (m.scores || []).findIndex(function(r){ return r.slug === b; });
      if(ia < 0 || ib < 0){ return; }
      if(ia < ib){ aw++; } else if(ib < ia){ bw++; }
    });
    return { a: aw, b: bw };
  }

  function allSlugs(matches){
    var map = {};
    matches.forEach(function(m){
      (m.scores || []).forEach(function(row){ map[row.slug] = row; });
    });
    return Object.keys(map);
  }

  function shooterMeta(slug){
    for(var i = 0; i < data.matches.length; i++){
      var scores = data.matches[i].scores || [];
      for(var j = 0; j < scores.length; j++){
        if(scores[j].slug === slug){
          return { shooter: scores[j].shooter, hidden: !!scores[j].hidden };
        }
      }
    }
    return { shooter: slug, hidden: false };
  }

  function trend(entries){
    if(entries.length < 2){ return "—"; }
    var sorted = entries.slice().sort(function(a, b){ return a.match.date < b.match.date ? -1 : 1; });
    var last = sorted[sorted.length - 1].place;
    var prev = sorted[sorted.length - 2].place;
    if(last < prev){ return "↑"; }
    if(last > prev){ return "↓"; }
    return "→";
  }

  function compareRows(a, b, season){
    if(b.points !== a.points){ return b.points - a.points; }
    if(b.wins !== a.wins){ return b.wins - a.wins; }
    var h2h = headToHeadWins(data.matches, season, a.slug, b.slug);
    if(h2h.a !== h2h.b){ return h2h.b - h2h.a; }
    return b.matches - a.matches;
  }

  function renderStandings(season){
    var host = $("#standingsHost");
    if(!host){ return; }
    var rows = allSlugs(data.matches).map(function(slug){
      var entries = seasonEntries(data.matches, season, slug);
      if(!entries.length){ return null; }
      var meta = shooterMeta(slug);
      var best = entries.reduce(function(b, e){ return Math.max(b, e.row.score); }, 0);
      return {
        slug: slug,
        name: formatName(meta.shooter, meta.hidden),
        matches: entries.length,
        best: best,
        points: seasonPoints(data.matches, season, slug),
        wins: winCount(data.matches, season, slug),
        trend: trend(entries)
      };
    }).filter(Boolean).sort(function(a, b){ return compareRows(a, b, season); });

    host.innerHTML = rows.length
      ? '<div class="tablewrap"><table><thead><tr><th>#</th><th>Shooter</th><th>Pts</th><th>Matches</th><th>Best</th><th>Trend</th></tr></thead><tbody>' +
        rows.map(function(r, i){
          return '<tr><td class="num rank">' + (i + 1) + '</td><td><a href="standings.html?shooter=' + encodeURIComponent(r.slug) + '">' + r.name +
            '</a></td><td class="num">' + r.points + '</td><td class="num">' + r.matches +
            '</td><td class="num">' + r.best + '</td><td class="num">' + r.trend + '</td></tr>';
        }).join("") + '</tbody></table></div>'
      : '<p class="muted">No results for this season yet.</p>';
  }

  function awardBadges(slug){
    var earned = {};
    var slugMatches = [];
    data.matches.forEach(function(m){
      (m.scores || []).forEach(function(row, i){
        if(row.slug !== slug){ return; }
        slugMatches.push({ match: m, row: row, place: i });
      });
    });

    slugMatches.forEach(function(sm){
      if(sm.match.weather === "rain"){ earned["rain-dog"] = true; }
      var month = parseInt(String(sm.match.date).split("-")[1], 10);
      if(month === 11 || month === 12 || month === 1){ earned["dark-thirty"] = true; }
      if((sm.row.longestHitYd || 0) >= 100){ earned["first-steel"] = true; }
      if(sm.row.notes && /clean on rams|rams down/i.test(sm.row.notes)){ earned["ram-slayer"] = true; }
      if(sm.place < 3 && sm.row.sights === "iron"){ earned["iron-will"] = true; }
      if(sm.place < 3){ earned["podium"] = true; }
    });
    var seasons = {};
    slugMatches.forEach(function(sm){ seasons[sm.match.season] = (seasons[sm.match.season] || 0) + 1; });
    Object.keys(seasons).forEach(function(s){
      if(seasons[s] >= 6){ earned["regular"] = true; }
      if(seasonPoints(data.matches, s, slug) >= 100){ earned["centurion"] = true; }
    });
    return earned;
  }

  function drawHistoryChart(host, history){
    var wrap = document.createElement("div");
    wrap.className = "chart-wrap";
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-label", "Score history chart");
    wrap.appendChild(canvas);
    host.appendChild(wrap);
    if(!history.length){ return; }
    var dpr = window.devicePixelRatio || 1;
    var w = wrap.clientWidth || 560;
    var h = 200;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#16221D";
    ctx.fillRect(0, 0, w, h);
    var pad = 28;
    var scores = history.map(function(h){ return h.score; });
    var min = Math.min.apply(null, scores) - 5;
    var max = Math.max.apply(null, scores) + 5;
    ctx.strokeStyle = "rgba(232,237,233,.12)";
    for(var g = 0; g < 4; g++){
      var gy = pad + (h - pad * 2) * g / 3;
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(w - pad, gy); ctx.stroke();
    }
    ctx.strokeStyle = "#FF6A2B";
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach(function(pt, i){
      var px = pad + (history.length === 1 ? (w - pad * 2) / 2 : i * (w - pad * 2) / (history.length - 1));
      var py = pad + (1 - (pt.score - min) / (max - min || 1)) * (h - pad * 2);
      if(i === 0){ ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
    });
    ctx.stroke();
    ctx.fillStyle = "#FF6A2B";
    history.forEach(function(pt, i){
      var px = pad + (history.length === 1 ? (w - pad * 2) / 2 : i * (w - pad * 2) / (history.length - 1));
      var py = pad + (1 - (pt.score - min) / (max - min || 1)) * (h - pad * 2);
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  function renderProfile(slug){
    var host = $("#profileHost");
    if(!host){ return; }
    if(!slug){
      host.innerHTML = '<p class="muted">Pick a shooter from the standings, or open <code>standings.html?shooter=slug</code>.</p>';
      return;
    }
    var meta = shooterMeta(slug);
    var history = data.matches.slice().filter(function(m){
      return (m.scores || []).some(function(r){ return r.slug === slug; });
    }).sort(function(a, b){ return a.date < b.date ? -1 : 1; }).map(function(m){
      var idx = m.scores.findIndex(function(r){ return r.slug === slug; });
      return { date: m.date, name: m.name, place: idx + 1, score: m.scores[idx].score, matchId: m.id };
    });
    var earned = awardBadges(slug);
    var badges = (data.badges || []).map(function(b){
      return '<div class="badge" data-earned="' + (earned[b.id] ? "true" : "false") + '">' +
        '<span class="eyebrow">' + b.icon + '</span><b>' + b.name + '</b><span>' + b.blurb + '</span></div>';
    }).join("");

    var others = allSlugs(data.matches).filter(function(s){ return s !== slug; });
    var h2hRows = others.map(function(other){
      var shared = data.matches.filter(function(m){
        var sa = (m.scores || []).some(function(r){ return r.slug === slug; });
        var sb = (m.scores || []).some(function(r){ return r.slug === other; });
        return sa && sb;
      });
      if(!shared.length){ return null; }
      var wins = 0, losses = 0;
      shared.forEach(function(m){
        var ia = m.scores.findIndex(function(r){ return r.slug === slug; });
        var ib = m.scores.findIndex(function(r){ return r.slug === other; });
        if(ia < ib){ wins++; } else if(ib < ia){ losses++; }
      });
      var om = shooterMeta(other);
      return { name: formatName(om.shooter, om.hidden), wins: wins, losses: losses, n: shared.length };
    }).filter(Boolean);

    host.innerHTML = '<h2 style="margin-bottom:.5rem">' + formatName(meta.shooter, meta.hidden) + '</h2>' +
      '<p class="muted" style="margin-bottom:1.25rem">' + history.length + ' matches on record</p>' +
      '<div id="profileChart"></div>' +
      '<div class="badge-grid" style="margin-top:1rem">' + badges + '</div>' +
      '<h3 style="margin:1.5rem 0 .75rem">Match history</h3>' +
      (history.length ? '<div class="tablewrap compact"><table><thead><tr><th>Date</th><th>Match</th><th>Place</th><th>Score</th></tr></thead><tbody>' +
        history.slice().reverse().map(function(h){
          return '<tr><td class="num">' + h.date + '</td><td>' + h.name + '</td><td class="num">' + h.place +
            '</td><td class="num">' + h.score + '</td></tr>';
        }).join("") + '</tbody></table></div>' : '<p class="muted">No matches found.</p>') +
      '<h3 style="margin:1.5rem 0 .75rem">Head-to-head</h3>' +
      (h2hRows.length ? '<div class="tablewrap compact"><table><thead><tr><th>Opponent</th><th>W</th><th>L</th><th>Shared</th></tr></thead><tbody>' +
        h2hRows.map(function(r){
          return '<tr><td>' + r.name + '</td><td class="num">' + r.wins + '</td><td class="num">' + r.losses +
            '</td><td class="num">' + r.n + '</td></tr>';
        }).join("") + '</tbody></table></div>' : '<p class="muted">No shared matches yet.</p>');

    drawHistoryChart($("#profileChart"), history);
  }

  function renderH2H(){
    var host = $("#h2hHost");
    if(!host){ return; }
    var slugs = allSlugs(data.matches);
    host.innerHTML = '<div class="form-grid cols-2">' +
      '<div class="field"><label for="h2hA">Shooter A</label><select id="h2hA">' +
      slugs.map(function(s){ var m = shooterMeta(s); return '<option value="' + s + '">' + formatName(m.shooter, m.hidden) + '</option>'; }).join("") +
      '</select></div>' +
      '<div class="field"><label for="h2hB">Shooter B</label><select id="h2hB">' +
      slugs.map(function(s, i){ var m = shooterMeta(s); return '<option value="' + s + '"' + (i === 1 ? " selected" : "") + '>' + formatName(m.shooter, m.hidden) + '</option>'; }).join("") +
      '</select></div></div>' +
      '<button class="btn btn-primary" type="button" id="h2hBtn">Compare</button>' +
      '<div id="h2hOut" style="margin-top:1.25rem"></div>';

    function compare(){
      var a = $("#h2hA").value, b = $("#h2hB").value;
      var shared = data.matches.filter(function(m){
        var sa = (m.scores || []).some(function(r){ return r.slug === a; });
        var sb = (m.scores || []).some(function(r){ return r.slug === b; });
        return sa && sb;
      });
      var winsA = 0, winsB = 0;
      shared.forEach(function(m){
        var ia = m.scores.findIndex(function(r){ return r.slug === a; });
        var ib = m.scores.findIndex(function(r){ return r.slug === b; });
        if(ia < ib){ winsA++; } else if(ib < ia){ winsB++; }
      });
      var ma = shooterMeta(a), mb = shooterMeta(b);
      $("#h2hOut").innerHTML = shared.length
        ? '<p><strong>' + formatName(ma.shooter, ma.hidden) + '</strong> ' + winsA + ' – ' + winsB +
          ' <strong>' + formatName(mb.shooter, mb.hidden) + '</strong> across ' + shared.length + ' shared matches.</p>' +
          '<div class="tablewrap compact"><table><thead><tr><th>Date</th><th>Match</th><th>A</th><th>B</th></tr></thead><tbody>' +
          shared.map(function(m){
            var ra = m.scores.find(function(r){ return r.slug === a; });
            var rb = m.scores.find(function(r){ return r.slug === b; });
            return '<tr><td class="num">' + m.date + '</td><td>' + m.name + '</td><td class="num">' + ra.score +
              '</td><td class="num">' + rb.score + '</td></tr>';
          }).join("") + '</tbody></table></div>'
        : '<p class="muted">Those two have not shot the same match yet.</p>';
    }
    $("#h2hBtn").addEventListener("click", compare);
    compare();
  }

  function renderRecords(){
    var host = $("#recordsHost");
    if(!host){ return; }
    var recs = (data.records && data.records.records) ? data.records.records : [];
    host.innerHTML = '<div class="record-grid">' + recs.map(function(r){
      var tk = r.confirmed ? "" : ' class="tk"';
      return '<article class="record"><p class="eyebrow"' + tk + '>' + r.label + '</p>' +
        '<p class="val"' + tk + '>' + r.value + '</p>' +
        '<p><strong' + tk + '>' + r.holder + '</strong></p>' +
        '<p class="muted"' + tk + '>' + r.detail + '</p></article>';
    }).join("") + '</div>';
  }

  function bindTabs(){
    var tabs = $$(".tabs [role=tab]");
    tabs.forEach(function(tab){
      tab.addEventListener("click", function(){
        var panel = tab.getAttribute("aria-controls");
        tabs.forEach(function(t){ t.setAttribute("aria-selected", String(t === tab)); });
        $$(".panel-stack").forEach(function(p){
          p.setAttribute("data-active", String(p.id === panel));
        });
        if(panel === "profilePanel"){
          renderProfile(new URLSearchParams(location.search).get("shooter"));
        }
      });
    });
  }

  function showOffline(host){
    if(host){
      host.innerHTML = '<p class="muted">Standings need match data. You\'re offline and it isn\'t cached yet — reconnect once, then it works at the range.</p>';
    }
  }

  function init(){
    if(!$("#standingsHost")){ return; }
    bindTabs();

    var resultsUrl = (C.api && C.api.enabled !== false && C.api.resultsPath)
      ? C.api.resultsPath
      : "data/results.json";
    var loadResults = fetch(resultsUrl, { cache: "no-store" })
      .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
      .catch(function(){ return fetch("data/results.json", { cache: "no-store" }).then(function(r){ return r.json(); }); });

    Promise.all([
      loadResults,
      fetch("data/badges.json", { cache: "no-store" }).then(function(r){ return r.json(); }),
      fetch("data/records.json", { cache: "no-store" }).then(function(r){ return r.json(); })
    ]).then(function(res){
      data.matches = normalizeMatches(res[0].matches || []);
      data.badges = res[1].badges || [];
      data.records = res[2];

      var seasons = {};
      data.matches.forEach(function(m){ seasons[m.season] = true; });
      var seasonList = Object.keys(seasons).sort().reverse();
      var current = seasonList[0] || "2026";
      var filters = $("#seasonFilters");
      if(filters){
        filters.innerHTML = seasonList.map(function(s){
          return '<button class="tier" type="button" data-season="' + s + '" aria-selected="' + (s === current) + '">' + s + '</button>';
        }).join("");
        filters.addEventListener("click", function(e){
          var b = e.target.closest("[data-season]");
          if(!b){ return; }
          $$("#seasonFilters .tier").forEach(function(o){ o.setAttribute("aria-selected", "false"); });
          b.setAttribute("aria-selected", "true");
          renderStandings(b.getAttribute("data-season"));
        });
      }

      renderStandings(current);
      renderH2H();
      renderRecords();

      var slug = new URLSearchParams(location.search).get("shooter");
      if(slug){
        $$(".tabs [role=tab]").forEach(function(t){
          t.setAttribute("aria-selected", String(t.getAttribute("aria-controls") === "profilePanel"));
        });
        $$(".panel-stack").forEach(function(p){
          p.setAttribute("data-active", String(p.id === "profilePanel"));
        });
        renderProfile(slug);
      } else {
        renderProfile(null);
      }
    }).catch(function(){
      showOffline($("#standingsHost"));
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
