/* =============================================================
   KRGC — training games (simulation only)
   Wind-call trainer uses the Phase 1.3 solver for truth.
   Silhouette knockdown is keyboard playable. Sound off by default.
   ============================================================= */
(function(){
  "use strict";

  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SIL_PATHS = {
    chicken: "M0 0v-14h4l2-6h5l1 6h4V0z",
    pig: "M-2 0v-9h-3l-2-7h20l3 7h-3v9z",
    turkey: "M0 0v-12l-6-9h6l2-5h4l2 5 6-3-4 8v16z",
    ram: "M-4 0v-11h-4l-3-9h6a5 5 0 1 1 6 3h10l3 6v11z"
  };
  var SIL_ORDER = ["chicken", "chicken", "pig", "pig", "turkey", "turkey", "ram", "ram"];
  var SIL_DIST = { chicken: 40, pig: 60, turkey: 77, ram: 100 }; /* metres → treat as yd-ish for game */
  var WIND_STORE = "krgc.games.wind";
  var SIL_PB = "krgc.games.silhouette.pb";

  function bindTabs(){
    var tabs = $$(".tabs [role=tab]");
    if(!tabs.length){ return; }
    tabs.forEach(function(tab){
      tab.addEventListener("click", function(){
        var panel = tab.getAttribute("aria-controls");
        tabs.forEach(function(t){ t.setAttribute("aria-selected", String(t === tab)); });
        $$(".panel-stack").forEach(function(p){
          p.setAttribute("data-active", String(p.id === panel));
        });
      });
      tab.addEventListener("keydown", function(e){
        if(e.key !== "ArrowRight" && e.key !== "ArrowLeft"){ return; }
        e.preventDefault();
        var i = tabs.indexOf(tab);
        var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.click(); next.focus();
      });
    });
  }

  /* ---------- wind-call trainer ---------- */
  function initWind(){
    var stage = $("#windStage");
    if(!stage){ return; }

    var state = {
      distance: 200,
      windMph: 8,
      unit: "MOA",
      streak: 0,
      round: 0,
      session: [],
      truthMoa: 0
    };

    var distEl = $("#windDistance");
    var flagEl = $("#windFlag");
    var mirageEl = $("#windMirage");
    var holdEl = $("#windHold");
    var streakEl = $("#windStreak");
    var resultsEl = $("#windResults");
    var unitBtn = $("#windUnitToggle");
    var submitBtn = $("#windSubmit");
    var impactEl = $("#windImpact");

    function rand(min, max){ return min + Math.random() * (max - min); }

    function solverWindMoa(distanceYd, windMph){
      var B = window.KRGC_Ballistics;
      if(!B){
        /* fallback if ballistics.js missing */
        return windMph * distanceYd / 100;
      }
      var t = B.trajectory({
        bulletGr: 168, bc: 0.450, dragModel: "G1", mvFps: 2600,
        sightHeightIn: 1.5, zeroYd: 100,
        tempF: 50, pressureInHg: 29.9, altitudeFt: 0,
        windMph: windMph, maxYd: Math.max(500, distanceYd)
      });
      var row = t.rows.filter(function(r){ return r.yd === distanceYd; })[0]
        || t.rows[t.rows.length - 1];
      return row.windMoa;
    }

    function drawImpact(errorIn){
      if(!impactEl){ return; }
      var size = 160;
      var hitX = Math.max(-60, Math.min(60, errorIn * 2));
      impactEl.innerHTML = '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Impact on target">' +
        '<circle cx="80" cy="80" r="70" fill="none" stroke="#E8EDE9" stroke-width="2"/>' +
        '<circle cx="80" cy="80" r="45" fill="none" stroke="#E8EDE9" stroke-width="1.5"/>' +
        '<circle cx="80" cy="80" r="20" fill="none" stroke="#E8EDE9" stroke-width="1.5"/>' +
        '<circle cx="80" cy="80" r="4" fill="#E8EDE9"/>' +
        '<circle cx="' + (80 + hitX) + '" cy="80" r="5" fill="#FF6A2B"/>' +
        '</svg>' +
        '<p class="muted" style="margin-top:.5rem">Impact error: <strong>' + errorIn.toFixed(1) + ' in</strong> (' +
        (errorIn / (state.distance * 1.047)).toFixed(2) + ' MOA)</p>';
    }

    function newRound(){
      if(state.round >= 10){
        if(resultsEl){
          var hits = state.session.filter(function(r){ return r.hit; }).length;
          resultsEl.innerHTML = '<p><strong>Session done.</strong> ' + hits + '/10 within tolerance. Streak best this run: ' +
            state.session.reduce(function(m, r, i, a){ /* show final */ return m; }, state.streak) +
            '</p>' + resultsEl.innerHTML;
        }
        try{ localStorage.setItem(WIND_STORE, JSON.stringify(state.session)); } catch(e){}
        state.round = 0;
        state.session = [];
        state.streak = 0;
      }
      state.distance = Math.round(rand(100, 500) / 25) * 25;
      state.windMph = Math.round(rand(3, 16) * 2) / 2;
      state.truthMoa = solverWindMoa(state.distance, state.windMph);
      if(distEl){ distEl.textContent = state.distance + " yd"; }
      if(flagEl){
        var bend = Math.min(40, state.windMph * 2.2);
        flagEl.innerHTML = '<svg viewBox="0 0 120 60" aria-hidden="true"><line x1="14" y1="52" x2="14" y2="8" stroke="currentColor" stroke-width="3"/>' +
          '<path d="M14 10 Q' + (30 + bend) + ' ' + (10 + bend * 0.3) + ' ' + (55 + bend) + ' 14 L' + (55 + bend) + ' 28 Q' + (30 + bend) + ' ' + (24 + bend * 0.3) + ' 14 24Z" fill="#FF6A2B"/></svg>';
      }
      if(mirageEl){
        mirageEl.textContent = state.windMph > 12 ? "Mirage: fast boil →" :
          state.windMph > 6 ? "Mirage: boiling →" : "Mirage: lazy angles →";
      }
      if(holdEl){ holdEl.value = ""; holdEl.focus(); }
      state.round += 1;
    }

    function truthInUnit(){
      return state.unit === "mils" ? state.truthMoa / 3.4377 : state.truthMoa;
    }

    function submit(){
      var val = parseFloat(holdEl.value);
      if(isNaN(val)){ holdEl.focus(); return; }
      var answer = truthInUnit();
      var tol = state.unit === "mils" ? 0.15 : 0.5;
      var errUnit = val - answer;
      var errMoa = state.unit === "mils" ? errUnit * 3.4377 : errUnit;
      var errorIn = errMoa * state.distance * 1.047;
      var hit = Math.abs(errUnit) <= tol;
      if(hit){ state.streak += 1; } else { state.streak = 0; }
      state.session.unshift({
        dist: state.distance, wind: state.windMph, guess: val, answer: +answer.toFixed(2),
        unit: state.unit, hit: hit, errorIn: errorIn
      });
      if(streakEl){ streakEl.textContent = String(state.streak); }
      drawImpact(errorIn);
      if(resultsEl){
        resultsEl.innerHTML = '<p style="color:var(--' + (hit ? "good" : "bad") + ')">Round ' + state.round +
          ': ' + state.distance + ' yd, ' + state.windMph + ' mph full-value. You: ' + val + ' ' + state.unit +
          ', truth ~' + answer.toFixed(2) + ' ' + state.unit +
          '. Full-value wind; hold into the wind.</p>' +
          state.session.slice(0, 5).map(function(r){
            return '<p class="muted">' + r.dist + ' yd / ' + r.wind + ' mph — ' + (r.hit ? "good call" : "missed call") + '</p>';
          }).join("");
      }
      if(!reduceMotion){ /* brief pause before next */ }
      newRound();
    }

    if(unitBtn){
      unitBtn.addEventListener("click", function(){
        state.unit = state.unit === "MOA" ? "mils" : "MOA";
        unitBtn.textContent = state.unit;
        unitBtn.setAttribute("aria-label", "Hold unit: " + state.unit);
      });
    }
    if(submitBtn){ submitBtn.addEventListener("click", submit); }
    if(holdEl){
      holdEl.addEventListener("keydown", function(e){ if(e.key === "Enter"){ e.preventDefault(); submit(); } });
    }

    newRound();
  }

  /* ---------- silhouette knockdown ---------- */
  function initSilhouette(){
    var stage = $("#silStage");
    if(!stage){ return; }

    var animals = [];
    var score = 0;
    var timer = 0;
    var interval = null;
    var muted = true;
    var running = false;
    var focusIdx = 0;

    var scoreEl = $("#silScore");
    var timerEl = $("#silTimer");
    var startBtn = $("#silStart");
    var soundBtn = $("#silSound");
    var pbEl = $("#silPB");

    function loadPB(){
      try{ return parseFloat(localStorage.getItem(SIL_PB) || ""); }
      catch(e){ return NaN; }
    }
    function savePB(t){
      var prev = loadPB();
      if(!prev || t < prev){
        try{ localStorage.setItem(SIL_PB, String(t.toFixed(1))); } catch(e){}
        if(pbEl){ pbEl.textContent = t.toFixed(1) + "s"; }
      }
    }
    if(pbEl){
      var pb = loadPB();
      pbEl.textContent = pb ? pb.toFixed(1) + "s" : "—";
    }

    function beep(){
      if(muted){ return; }
      try{
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.value = 0.05;
        o.connect(g); g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.08);
      } catch(e){}
    }

    function hitProb(type){
      /* closer animals easier; hold assumed centre */
      var d = SIL_DIST[type] || 80;
      return Math.max(0.35, 1 - d / 160);
    }

    function render(){
      stage.innerHTML = '<svg viewBox="-20 -50 280 70" role="img" aria-label="Silhouette targets. Keys 1-8 to shoot.">' +
        animals.map(function(a, i){
          var x = 10 + (i % 4) * 60;
          var y = (i < 4 ? 0 : -24);
          var focused = running && i === focusIdx && !a.down;
          return '<g transform="translate(' + x + ',' + y + ')" class="sil-target' + (a.down ? " down" : "") + '" data-i="' + i + '" tabindex="-1">' +
            (focused ? '<circle cx="8" cy="-8" r="18" fill="none" stroke="#E3BC66" stroke-width="1.5"/>' : '') +
            '<path d="' + SIL_PATHS[a.type] + '" fill="' + (a.down ? "#555" : "#FF6A2B") + '" stroke="#000" stroke-width=".5"/>' +
            '<text x="0" y="14" fill="#9AACA2" font-size="7" font-family="DM Mono, monospace">' + (i + 1) + '</text>' +
            '</g>';
        }).join("") + '</svg>' +
        '<p class="kbd-hint">Keys <kbd>1</kbd>–<kbd>8</kbd> shoot · <kbd>←</kbd>/<kbd>→</kbd> select · <kbd>Enter</kbd>/<kbd>Space</kbd> fire · <kbd>S</kbd> start</p>';

      stage.querySelectorAll(".sil-target").forEach(function(g){
        g.addEventListener("click", function(){
          shoot(parseInt(g.getAttribute("data-i"), 10));
        });
      });
    }

    function shoot(idx){
      if(!running || !animals[idx] || animals[idx].down){ return; }
      focusIdx = idx;
      var a = animals[idx];
      if(Math.random() <= hitProb(a.type)){
        a.down = true;
        score += 1;
        if(scoreEl){ scoreEl.textContent = String(score); }
        beep();
      }
      render();
      if(animals.every(function(x){ return x.down; })){
        clearInterval(interval);
        running = false;
        savePB(timer);
        if(startBtn){ startBtn.textContent = "Play again"; }
      }
    }

    function start(){
      animals = SIL_ORDER.map(function(t){ return { type: t, down: false }; });
      score = 0;
      timer = 0;
      focusIdx = 0;
      running = true;
      if(scoreEl){ scoreEl.textContent = "0"; }
      if(timerEl){ timerEl.textContent = "0.0"; }
      if(startBtn){ startBtn.textContent = "Running…"; }
      beep();
      clearInterval(interval);
      interval = setInterval(function(){
        timer += 0.1;
        if(timerEl){ timerEl.textContent = timer.toFixed(1); }
      }, reduceMotion ? 100 : 100);
      render();
    }

    if(startBtn){ startBtn.addEventListener("click", start); }
    if(soundBtn){
      soundBtn.textContent = "Sound off";
      soundBtn.setAttribute("aria-pressed", "false");
      soundBtn.addEventListener("click", function(){
        muted = !muted;
        soundBtn.textContent = muted ? "Sound off" : "Sound on";
        soundBtn.setAttribute("aria-pressed", String(!muted));
      });
    }

    document.addEventListener("keydown", function(e){
      var panel = $("#silPanel");
      if(!panel || panel.getAttribute("data-active") !== "true"){ return; }
      if(e.key === "s" || e.key === "S"){ if(!running){ start(); } return; }
      if(!running){ return; }
      if(e.key === "ArrowRight"){ focusIdx = (focusIdx + 1) % 8; render(); e.preventDefault(); }
      if(e.key === "ArrowLeft"){ focusIdx = (focusIdx + 7) % 8; render(); e.preventDefault(); }
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); shoot(focusIdx); }
      if(e.key >= "1" && e.key <= "8"){ shoot(parseInt(e.key, 10) - 1); }
    });

    render();
  }

  function init(){
    bindTabs();
    initWind();
    initSilhouette();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
