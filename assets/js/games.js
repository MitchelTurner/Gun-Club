/* =============================================================
   KRGC — training games (simulation only)
   Wind-call trainer + silhouette knockdown. No live fire.
   ============================================================= */
(function(){
  "use strict";

  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var SIL_PATHS = {
    chicken: "M0 0v-14h4l2-6h5l1 6h4V0z",
    pig: "M-2 0v-9h-3l-2-7h20l3 7h-3v9z",
    turkey: "M0 0v-12l-6-9h6l2-5h4l2 5 6-3-4 8v16z",
    ram: "M-4 0v-11h-4l-3-9h6a5 5 0 1 1 6 3h10l3 6v11z"
  };
  var SIL_ORDER = ["chicken", "chicken", "pig", "pig", "turkey", "turkey", "ram", "ram"];

  function bindTabs(){
    var tabs = $$(".tabs [role=tab]");
    if(!tabs.length){ return; }
    tabs.forEach(function(tab){
      tab.addEventListener("click", function(){
        var panel = tab.getAttribute("aria-controls");
        tabs.forEach(function(t){
          t.setAttribute("aria-selected", String(t === tab));
        });
        $$(".panel-stack").forEach(function(p){
          p.setAttribute("data-active", String(p.id === panel));
        });
      });
    });
  }

  /* ---------- wind-call trainer ---------- */
  function initWind(){
    var stage = $("#windStage");
    if(!stage){ return; }

    var state = {
      distance: 200,
      windMph: 0,
      windDir: "3",
      unit: "MOA",
      streak: 0,
      session: [],
      mirage: "none"
    };

    var distEl = $("#windDistance");
    var flagEl = $("#windFlag");
    var mirageEl = $("#windMirage");
    var holdEl = $("#windHold");
    var streakEl = $("#windStreak");
    var resultsEl = $("#windResults");
    var unitBtn = $("#windUnitToggle");
    var submitBtn = $("#windSubmit");

    function rand(min, max){ return min + Math.random() * (max - min); }
    function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

    function newRound(){
      state.distance = Math.round(rand(100, 500) / 25) * 25;
      state.windMph = Math.round(rand(2, 18) * 2) / 2;
      state.windDir = pick(["9", "10", "11", "12", "1", "2", "3", "4", "5"]);
      state.mirage = state.windMph > 10 ? "fast" : state.windMph > 5 ? "boil" : "lazy";
      if(distEl){ distEl.textContent = state.distance + " yd"; }
      if(flagEl){
        var angle = { "9":180,"10":202,"11":225,"12":270,"1":315,"2":337,"3":0,"4":22,"5":45 }[state.windDir] || 0;
        flagEl.innerHTML = '<svg viewBox="0 0 120 60" aria-hidden="true"><line x1="10" y1="50" x2="10" y2="10" stroke="currentColor" stroke-width="3"/>' +
          '<g transform="translate(10,14) rotate(' + angle + ')"><path d="M0 0 Q30 ' + (state.windMph * 1.2) + ' 55 0 L55 12 Q30 ' + (12 + state.windMph) + ' 0 12Z" fill="#FF6A2B"/></g></svg>';
      }
      if(mirageEl){
        mirageEl.textContent = state.mirage === "fast" ? "Mirage: fast boil" :
          state.mirage === "boil" ? "Mirage: boiling" : "Mirage: lazy angles";
      }
      if(holdEl){ holdEl.value = ""; holdEl.focus(); }
    }

    function correctHold(){
      var base = state.windMph * state.distance / 15;
      if(state.windDir === "9" || state.windDir === "3"){ base *= 0.15; }
      else if(state.windDir === "10" || state.windDir === "2"){ base *= 0.55; }
      else if(state.windDir === "11" || state.windDir === "1"){ base *= 0.85; }
      if(state.unit === "mils"){ return base / 3.438; }
      return base;
    }

    function submit(){
      var val = parseFloat(holdEl.value);
      if(isNaN(val)){ holdEl.focus(); return; }
      var answer = correctHold();
      var tol = state.unit === "mils" ? 0.15 : 0.4;
      var hit = Math.abs(val - answer) <= tol;
      if(hit){ state.streak += 1; } else { state.streak = 0; }
      state.session.unshift({
        dist: state.distance,
        guess: val,
        answer: answer.toFixed(2),
        unit: state.unit,
        hit: hit
      });
      if(streakEl){ streakEl.textContent = state.streak; }
      if(resultsEl){
        resultsEl.innerHTML = state.session.slice(0, 8).map(function(r){
          return '<p style="color:var(--' + (r.hit ? "good" : "bad") + ')">' + r.dist + ' yd — you: ' + r.guess +
            ' ' + r.unit + ', answer ~' + r.answer + ' ' + r.unit + (r.hit ? " ✓" : " ✗") + '</p>';
        }).join("");
      }
      newRound();
    }

    if(unitBtn){
      unitBtn.addEventListener("click", function(){
        state.unit = state.unit === "MOA" ? "mils" : "MOA";
        unitBtn.textContent = state.unit;
      });
    }
    if(submitBtn){ submitBtn.addEventListener("click", submit); }
    if(holdEl){
      holdEl.addEventListener("keydown", function(e){ if(e.key === "Enter"){ submit(); } });
    }
    document.addEventListener("keydown", function(e){
      if($(".panel-stack[data-active=true] #windStage") && e.key === "Enter" && document.activeElement !== holdEl){
        submit();
      }
    });

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

    var scoreEl = $("#silScore");
    var timerEl = $("#silTimer");
    var startBtn = $("#silStart");
    var soundBtn = $("#silSound");

    function render(){
      stage.innerHTML = '<svg viewBox="-30 -40 260 50" role="img" aria-label="Silhouette targets">' +
        animals.map(function(a, i){
          var x = 10 + (i % 4) * 55;
          var y = (i < 4 ? 0 : -22);
          return '<g transform="translate(' + x + ',' + y + ')" class="sil-target' + (a.down ? " down" : "") + '" data-i="' + i + '">' +
            '<path d="' + SIL_PATHS[a.type] + '" fill="' + (a.down ? "#555" : "#FF6A2B") + '" stroke="#000" stroke-width=".5"/>' +
            '</g>';
        }).join("") + '</svg>';

      stage.querySelectorAll(".sil-target").forEach(function(g){
        if(!running || animals[parseInt(g.getAttribute("data-i"), 10)].down){ return; }
        g.style.cursor = "pointer";
        g.addEventListener("click", function(){
          var idx = parseInt(g.getAttribute("data-i"), 10);
          if(animals[idx].down){ return; }
          animals[idx].down = true;
          score += 1;
          if(scoreEl){ scoreEl.textContent = score; }
          if(!muted){
            try{
              var ctx = new (window.AudioContext || window.webkitAudioContext)();
              var o = ctx.createOscillator();
              o.frequency.value = 220 + idx * 40;
              o.connect(ctx.destination);
              o.start();
              o.stop(ctx.currentTime + 0.08);
            } catch(e){}
          }
          render();
          if(animals.every(function(a){ return a.down; })){
            clearInterval(interval);
            running = false;
            if(startBtn){ startBtn.textContent = "Play again"; }
          }
        });
      });
    }

    function start(){
      animals = SIL_ORDER.map(function(t){ return { type:t, down:false }; });
      score = 0;
      timer = 0;
      running = true;
      if(scoreEl){ scoreEl.textContent = "0"; }
      if(timerEl){ timerEl.textContent = "0.0"; }
      if(startBtn){ startBtn.textContent = "Running…"; }
      clearInterval(interval);
      interval = setInterval(function(){
        timer += 0.1;
        if(timerEl){ timerEl.textContent = timer.toFixed(1); }
      }, 100);
      render();
    }

    if(startBtn){ startBtn.addEventListener("click", start); }
    if(soundBtn){
      soundBtn.textContent = "Sound off";
      soundBtn.addEventListener("click", function(){
        muted = !muted;
        soundBtn.textContent = muted ? "Sound off" : "Sound on";
        soundBtn.setAttribute("aria-pressed", String(!muted));
      });
    }

    document.addEventListener("keydown", function(e){
      if(e.key === " " && $("#silPanel") && $("#silPanel").getAttribute("data-active") === "true"){
        e.preventDefault();
        if(!running){ start(); }
      }
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
