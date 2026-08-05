/* =============================================================
   KRGC — Rimfire Cup standings, profiles, head-to-head, records
   ============================================================= */
(function(){
  "use strict";

  var C = window.KRGC || {};
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var data = { matches:[], badges:[], records:[] };

  function formatName(shooter, hidden){
    if(hidden){ return "Anonymous"; }
    var fmt = (C.standings || {}).nameFormat || "last-initial";
    if(fmt === "full"){ return shooter; }
    if(fmt === "opt-in"){ return shooter; }
    var parts = shooter.replace(/\.$/, "").split(/,\s*/);
    if(parts.length >= 2){ return parts[0] + ", " + parts[1].charAt(0) + "."; }
    return shooter;
  }

  function pointsForPlace(i){
    var win = (C.standings || {}).winPoints || 20;
    return Math.max(1, win - i);
  }

  function seasonPoints(matches, season, slug){
    var drop = (C.standings || {}).dropWorst || 0;
    var perMatch = [];
    matches.filter(function(m){ return m.season === season; }).forEach(function(m){
      (m.scores || []).forEach(function(row, i){
        if(row.slug !== slug){ return; }
        perMatch.push(pointsForPlace(i));
      });
    });
    perMatch.sort(function(a,b){ return a - b; });
    var kept = perMatch.slice(drop);
    return kept.reduce(function(s, p){ return s + p; }, 0);
  }

  function allSlugs(matches){
    var map = {};
    matches.forEach(function(m){
      (m.scores || []).forEach(function(row){
        if(row.slug){ map[row.slug] = row; }
      });
    });
    return Object.keys(map);
  }

  function shooterName(slug){
    for(var i = 0; i < data.matches.length; i++){
      var scores = data.matches[i].scores || [];
      for(var j = 0; j < scores.length; j++){
        if(scores[j].slug === slug){ return scores[j].shooter; }
      }
    }
    return slug;
  }

  function renderStandings(season){
    var host = $("#standingsHost");
    if(!host){ return; }
    var slugs = allSlugs(data.matches);
    var rows = slugs.map(function(slug){
      var raw = data.matches.filter(function(m){ return m.season === season; })
        .map(function(m){
          var idx = (m.scores || []).findIndex(function(r){ return r.slug === slug; });
          return idx >= 0 ? { place: idx, score: m.scores[idx].score, date: m.date } : null;
        }).filter(Boolean);
      var best = raw.reduce(function(b, r){ return Math.max(b, r.score); }, 0);
      return {
        slug: slug,
        name: formatName(shooterName(slug), false),
        matches: raw.length,
        best: best,
        points: seasonPoints(data.matches, season, slug)
      };
    }).filter(function(r){ return r.matches > 0; })
      .sort(function(a,b){ return b.points - a.points || b.best - a.best; });

    host.innerHTML = rows.length
      ? '<div class="tablewrap"><table><thead><tr><th>#</th><th>Shooter</th><th>Matches</th><th>Best</th><th>Points</th></tr></thead><tbody>' +
        rows.map(function(r, i){
          return '<tr><td class="num rank">' + (i+1) + '</td><td><a href="?shooter=' + encodeURIComponent(r.slug) + '">' + r.name +
            '</a></td><td class="num">' + r.matches + '</td><td class="num">' + r.best +
            '</td><td class="num">' + r.points + '</td></tr>';
        }).join("") + '</tbody></table></div>'
      : '<p class="muted">No results for this season yet.</p>';
  }

  function awardBadges(slug){
    var earned = {};
    var slugMatches = [];
    data.matches.forEach(function(m){
      (m.scores || []).forEach(function(row, i){
        if(row.slug !== slug){ return; }
        slugMatches.push({ match:m, row:row, place:i });
      });
    });

    slugMatches.forEach(function(sm){
      if(sm.match.weather === "rain"){ earned["rain-dog"] = true; }
      var month = parseInt(sm.match.date.split("-")[1], 10);
      if(month === 11 || month === 12 || month === 1){ earned["dark-thirty"] = true; }
      if(sm.row.longestHitYd >= 100){ earned["first-steel"] = true; }
      if(sm.row.notes && /ram/i.test(sm.row.notes)){ earned["ram-slayer"] = true; }
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

  function renderProfile(slug){
    var host = $("#profileHost");
    if(!host){ return; }
    if(!slug){
      host.innerHTML = '<p class="muted">Pick a shooter from the standings, or add <code>?shooter=slug</code> to the URL.</p>';
      return;
    }
    var name = shooterName(slug);
    var history = data.matches.slice().reverse().filter(function(m){
      return (m.scores || []).some(function(r){ return r.slug === slug; });
    }).map(function(m){
      var idx = m.scores.findIndex(function(r){ return r.slug === slug; });
      return { date:m.date, name:m.name, place:idx + 1, score:m.scores[idx].score };
    });
    var earned = awardBadges(slug);
    var badges = (data.badges || []).map(function(b){
      return '<div class="badge" data-earned="' + (earned[b.id] ? "true" : "false") + '">' +
        '<span class="eyebrow">' + b.icon + '</span><b>' + b.name + '</b><span>' + b.blurb + '</span></div>';
    }).join("");

    host.innerHTML = '<h2 style="margin-bottom:.5rem">' + formatName(name, false) + '</h2>' +
      '<p class="muted" style="margin-bottom:1.25rem">' + history.length + ' matches on record</p>' +
      '<div class="badge-grid">' + badges + '</div>' +
      '<h3 style="margin:1.5rem 0 .75rem">Match history</h3>' +
      (history.length ? '<div class="tablewrap compact"><table><thead><tr><th>Date</th><th>Match</th><th>Place</th><th>Score</th></tr></thead><tbody>' +
        history.map(function(h){
          return '<tr><td class="num">' + h.date + '</td><td>' + h.name + '</td><td class="num">' + h.place +
            '</td><td class="num">' + h.score + '</td></tr>';
        }).join("") + '</tbody></table></div>' : '<p class="muted">No matches found.</p>');
  }

  function renderH2H(){
    var host = $("#h2hHost");
    if(!host){ return; }
    var slugs = allSlugs(data.matches);
    host.innerHTML = '<div class="form-grid cols-2">' +
      '<div class="field"><label for="h2hA">Shooter A</label><select id="h2hA">' +
      slugs.map(function(s){ return '<option value="' + s + '">' + formatName(shooterName(s), false) + '</option>'; }).join("") +
      '</select></div>' +
      '<div class="field"><label for="h2hB">Shooter B</label><select id="h2hB">' +
      slugs.map(function(s, i){ return '<option value="' + s + '"' + (i === 1 ? " selected" : "") + '>' + formatName(shooterName(s), false) + '</option>'; }).join("") +
      '</select></div></div>' +
      '<button class="btn btn-primary" type="button" id="h2hBtn">Compare</button>' +
      '<div id="h2hOut" style="margin-top:1.25rem"></div>';

    function compare(){
      var a = $("#h2hA").value, b = $("#h2hB").value;
      var shared = data.matches.filter(function(m){
        var sa = (m.scores || []).findIndex(function(r){ return r.slug === a; }) >= 0;
        var sb = (m.scores || []).findIndex(function(r){ return r.slug === b; }) >= 0;
        return sa && sb;
      });
      var winsA = 0, winsB = 0;
      shared.forEach(function(m){
        var ia = m.scores.findIndex(function(r){ return r.slug === a; });
        var ib = m.scores.findIndex(function(r){ return r.slug === b; });
        if(ia < ib){ winsA++; } else if(ib < ia){ winsB++; }
      });
      $("#h2hOut").innerHTML = shared.length
        ? '<p><strong>' + formatName(shooterName(a), false) + '</strong> ' + winsA + ' – ' + winsB +
          ' <strong>' + formatName(shooterName(b), false) + '</strong> across ' + shared.length + ' shared matches.</p>' +
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
      var cls = r.confirmed ? "" : ' class="tk"';
      return '<article class="record"><p class="eyebrow"' + cls + '>' + r.label + '</p>' +
        '<p class="val"' + cls + '>' + r.value + '</p>' +
        '<p><strong' + cls + '>' + r.holder + '</strong></p>' +
        '<p class="muted"' + cls + '>' + r.detail + '</p></article>';
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

  function init(){
    if(!$("#standingsHost")){ return; }
    bindTabs();

    Promise.all([
      fetch("data/results.json", { cache:"no-store" }).then(function(r){ return r.json(); }),
      fetch("data/badges.json", { cache:"no-store" }).then(function(r){ return r.json(); }),
      fetch("data/records.json", { cache:"no-store" }).then(function(r){ return r.json(); })
    ]).then(function(res){
      data.matches = res[0].matches || [];
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
          $$("#seasonFilters .tier").forEach(function(o){ o.setAttribute("aria-selected","false"); });
          b.setAttribute("aria-selected","true");
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
      $("#standingsHost").innerHTML = '<p class="muted">Could not load standings data. Serve over http, not as a local file.</p>';
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
