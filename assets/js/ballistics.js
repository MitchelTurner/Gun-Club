/* =============================================================
   KRGC — ballistics engine + come-up card UI
   Point-mass solver with G1/G7 drag. Starting points only —
   confirm every solution on paper before you shoot.
   ============================================================= */
(function(){
  "use strict";

  var C = window.KRGC || {};
  var $ = function(s, r){ return (r || document).querySelector(s); };

  var PRESETS = {
    "22lr-std":   { label:".22 LR — standard", bulletGr:40,  bc:0.128, dragModel:"G1", mvFps:1250 },
    "22lr-match": { label:".22 LR — match",    bulletGr:40,  bc:0.148, dragModel:"G1", mvFps:1200 },
    "223-55":     { label:".223 — 55 gr",      bulletGr:55,  bc:0.243, dragModel:"G1", mvFps:3200 },
    "308-168":    { label:".308 — 168 gr",     bulletGr:168, bc:0.470, dragModel:"G1", mvFps:2650 },
    "3006-180":   { label:".30-06 — 180 gr",   bulletGr:180, bc:0.439, dragModel:"G1", mvFps:2700 },
    "65cm-140":   { label:"6.5 CM — 140 gr",   bulletGr:140, bc:0.610, dragModel:"G7", mvFps:2710 },
    "custom":     { label:"Custom load",       bulletGr:168, bc:0.450, dragModel:"G1", mvFps:2600 }
  };

  var DISTANCES = [25, 50, 75, 100, 150, 200, 250, 300, 400, 500];
  var STORAGE_KEY = "krgc-dope-profiles";
  var GRAV = 32.174;
  var STD_TEMP = 59;
  var STD_PRESS = 29.92;

  /* ---------- simplified G1 / G7 drag (Mach → Cd) ---------- */
  var G1 = [
    [0.00,0.262],[0.05,0.255],[0.10,0.248],[0.15,0.242],[0.20,0.237],[0.25,0.233],
    [0.30,0.229],[0.35,0.226],[0.40,0.223],[0.45,0.221],[0.50,0.219],[0.55,0.217],
    [0.60,0.216],[0.65,0.215],[0.70,0.214],[0.75,0.214],[0.80,0.215],[0.85,0.217],
    [0.90,0.220],[0.95,0.225],[1.00,0.270],[1.05,0.310],[1.10,0.340],[1.20,0.360],
    [1.30,0.370],[1.50,0.380],[2.00,0.385],[3.00,0.390]
  ];
  var G7 = [
    [0.00,0.120],[0.05,0.119],[0.10,0.118],[0.20,0.116],[0.30,0.114],[0.40,0.112],
    [0.50,0.110],[0.60,0.108],[0.70,0.106],[0.80,0.104],[0.90,0.102],[1.00,0.100],
    [1.10,0.098],[1.20,0.096],[1.30,0.094],[1.50,0.092],[2.00,0.090],[3.00,0.088]
  ];

  function lerp(t, a, b){ return a + (b - a) * t; }
  function interp(table, x){
    if(x <= table[0][0]){ return table[0][1]; }
    for(var i = 1; i < table.length; i++){
      if(x <= table[i][0]){
        var t = (x - table[i-1][0]) / (table[i][0] - table[i-1][0]);
        return lerp(t, table[i-1][1], table[i][1]);
      }
    }
    return table[table.length - 1][1];
  }

  function airDensity(tempF, pressureInHg, altitudeFt){
    var tempR = tempF + 459.67;
    var p = pressureInHg * 70.726;
    var rho = p / (1718 * tempR);
    if(altitudeFt){
      rho *= Math.exp(-altitudeFt / 22000);
    }
    return rho;
  }

  function speedOfSound(tempF){
    return 49.02 * Math.sqrt(tempF + 459.67);
  }

  function trajectory(params){
    var bc = params.bc;
    var w = params.bulletGr / 7000;
    var sight = params.sightHeightIn / 12;
    var zero = params.zeroYd * 3;
    var rho = airDensity(params.tempF, params.pressureInHg, params.altitudeFt);
    var rho0 = airDensity(STD_TEMP, STD_PRESS, 0);
    var rhoRatio = rho / rho0;
    var table = params.dragModel === "G7" ? G7 : G1;
    var i = 0.0004166666666666667;
    var sd = w / (bc * i);
    var a0 = speedOfSound(params.tempF);

    function step(vx, vy, dt){
      var v = Math.sqrt(vx * vx + vy * vy);
      var mach = v / a0;
      var cd = interp(table, mach);
      var drag = 0.5 * rho * v * v * cd * sd / w;
      var ax = -drag * vx / v;
      var ay = -drag * vy / v - GRAV;
      return {
        vx: vx + ax * dt,
        vy: vy + ay * dt,
        x: 0,
        y: 0
      };
    }

    function simulate(angleRad){
      var dt = 0.0005;
      var vx = params.mvFps * Math.cos(angleRad);
      var vy = params.mvFps * Math.sin(angleRad);
      var x = 0, y = -sight;
      var last = { x:0, y:0 };
      while(y > -50 && x < 2000){
        last = { x:x, y:y };
        var v = Math.sqrt(vx * vx + vy * vy);
        var mach = v / a0;
        var cd = interp(table, mach);
        var drag = 0.5 * rho * v * v * cd * sd / w;
        var ax = -drag * vx / v;
        var ay = -drag * vy / v - GRAV;
        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;
      }
      return last;
    }

    var lo = -0.05, hi = 0.05;
    for(var n = 0; n < 24; n++){
      var mid = (lo + hi) / 2;
      var hit = simulate(mid);
      if(hit.y < 0){ lo = mid; } else { hi = mid; }
    }
    var zeroAngle = (lo + hi) / 2;

    var rows = [];
    var maxDrop = 0;
    DISTANCES.forEach(function(yd){
      var target = yd * 3;
      var dt = 0.0005;
      var vx = params.mvFps * Math.cos(zeroAngle);
      var vy = params.mvFps * Math.sin(zeroAngle);
      var x = 0, y = -sight;
      while(x < target && y > -200){
        var v = Math.sqrt(vx * vx + vy * vy);
        var mach = v / a0;
        var cd = interp(table, mach);
        var drag = 0.5 * rho * v * v * cd * sd / w;
        var ax = -drag * vx / v;
        var ay = -drag * vy / v - GRAV;
        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;
      }
      var dropIn = -y * 12;
      var moa = dropIn / (yd * 1.047);
      var mils = dropIn / (yd * 3.6);
      var vel = Math.sqrt(vx * vx + vy * vy);
      var energy = w * vel * vel / (2 * GRAV);
      maxDrop = Math.max(maxDrop, dropIn);
      rows.push({
        yd: yd,
        dropIn: dropIn,
        moa: moa,
        mils: mils,
        vel: vel,
        energy: energy
      });
    });

    var path = [];
    var dt2 = 0.002;
    var vx2 = params.mvFps * Math.cos(zeroAngle);
    var vy2 = params.mvFps * Math.sin(zeroAngle);
    var x2 = 0, y2 = -sight;
    while(x2 < DISTANCES[DISTANCES.length - 1] * 3 && y2 > -30){
      path.push({ x: x2 / 3, y: -y2 * 12 });
      var v2 = Math.sqrt(vx2 * vx2 + vy2 * vy2);
      var mach2 = v2 / a0;
      var cd2 = interp(table, mach2);
      var drag2 = 0.5 * rho * v2 * v2 * cd2 * sd / w;
      vx2 += (-drag2 * vx2 / v2) * dt2;
      vy2 += (-drag2 * vy2 / v2 - GRAV) * dt2;
      x2 += vx2 * dt2;
      y2 += vy2 * dt2;
    }

    return { rows: rows, path: path, maxDrop: maxDrop, zeroAngle: zeroAngle };
  }

  function readForm(){
    var defs = C.ballistics || {};
    return {
      preset: $("#preset").value,
      bulletGr: parseFloat($("#bulletGr").value),
      bc: parseFloat($("#bc").value),
      dragModel: $("#dragModel").value,
      mvFps: parseFloat($("#mvFps").value),
      sightHeightIn: parseFloat($("#sightHeightIn").value),
      zeroYd: parseFloat($("#zeroYd").value),
      tempF: parseFloat($("#tempF").value),
      pressureInHg: parseFloat($("#pressureInHg").value),
      altitudeFt: parseFloat($("#altitudeFt").value) || 0
    };
  }

  function applyPreset(key){
    var p = PRESETS[key];
    if(!p || key === "custom"){ return; }
    $("#bulletGr").value = p.bulletGr;
    $("#bc").value = p.bc;
    $("#dragModel").value = p.dragModel;
    $("#mvFps").value = p.mvFps;
  }

  function loadProfiles(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch(e){ return []; }
  }

  function saveProfiles(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function renderProfileList(){
    var host = $("#dopeList");
    if(!host){ return; }
    var list = loadProfiles();
    host.innerHTML = list.length ? list.map(function(p, i){
      return '<li><span>' + p.name + '</span><span class="muted">' + (PRESETS[p.preset] || {}).label + '</span>' +
        '<span><button type="button" class="btn btn-ghost btn-sm" data-load="' + i + '">Load</button> ' +
        '<button type="button" class="btn btn-ghost btn-sm" data-del="' + i + '">Delete</button></span></li>';
    }).join("") : '<li class="muted">No saved profiles yet.</li>';

    host.querySelectorAll("[data-load]").forEach(function(b){
      b.addEventListener("click", function(){
        var prof = list[parseInt(b.getAttribute("data-load"), 10)];
        if(!prof){ return; }
        Object.keys(prof).forEach(function(k){
          var el = $("#" + k);
          if(el){ el.value = prof[k]; }
        });
        compute();
      });
    });
    host.querySelectorAll("[data-del]").forEach(function(b){
      b.addEventListener("click", function(){
        list.splice(parseInt(b.getAttribute("data-del"), 10), 1);
        saveProfiles(list);
        renderProfileList();
      });
    });
  }

  function drawChart(path, maxDrop){
    var canvas = $("#trajChart");
    if(!canvas || !path.length){ return; }
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth || 600;
    var h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#16221D";
    ctx.fillRect(0, 0, w, h);
    var maxX = path[path.length - 1].x;
    var pad = 24;
    ctx.strokeStyle = "rgba(232,237,233,.15)";
    ctx.lineWidth = 1;
    for(var g = 0; g <= 4; g++){
      var gy = pad + (h - pad * 2) * g / 4;
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(w - pad, gy); ctx.stroke();
    }
    ctx.strokeStyle = "#FF6A2B";
    ctx.lineWidth = 2;
    ctx.beginPath();
    path.forEach(function(pt, i){
      var px = pad + (pt.x / maxX) * (w - pad * 2);
      var py = pad + (pt.y / (maxDrop || 1)) * (h - pad * 2);
      if(i === 0){ ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
    });
    ctx.stroke();
    ctx.fillStyle = "#9AACA2";
    ctx.font = "10px DM Mono, monospace";
    ctx.fillText("Drop (in)", pad, 12);
    ctx.fillText("0 yd", pad, h - 6);
    ctx.fillText(maxX + " yd", w - pad - 30, h - 6);
  }

  function renderWallet(params, rows){
    var card = $("#walletCard");
    if(!card){ return; }
    var title = PRESETS[params.preset] ? PRESETS[params.preset].label : "Custom";
    card.innerHTML = '<h1>' + title + '</h1>' +
      '<p style="margin:0 0 .05in;font-size:6.5pt">' + params.bulletGr + ' gr · BC ' + params.bc +
      ' · ' + params.mvFps + ' fps · zero ' + params.zeroYd + ' yd</p>' +
      '<table><thead><tr><th>yd</th><th>drop</th><th>MOA</th><th>mils</th></tr></thead><tbody>' +
      rows.map(function(r){
        return '<tr><td>' + r.yd + '</td><td>' + r.dropIn.toFixed(1) + '"</td><td>' +
          r.moa.toFixed(1) + '</td><td>' + r.mils.toFixed(2) + '</td></tr>';
      }).join("") + '</tbody></table>' +
      '<p style="margin:.04in 0 0;font-size:5.5pt">Computed — confirm on paper. Invalid if inputs wrong.</p>';
    card.hidden = false;
  }

  function renderTable(rows){
    var host = $("#dopeTable");
    if(!host){ return; }
    host.innerHTML = '<table><thead><tr><th>yd</th><th>Drop (in)</th><th>MOA</th><th>Mils</th><th>fps</th><th>ft-lb</th></tr></thead><tbody>' +
      rows.map(function(r){
        return '<tr><td class="num">' + r.yd + '</td><td class="num">' + r.dropIn.toFixed(2) +
          '</td><td class="num">' + r.moa.toFixed(2) + '</td><td class="num">' + r.mils.toFixed(2) +
          '</td><td class="num">' + Math.round(r.vel) + '</td><td class="num">' + Math.round(r.energy) + '</td></tr>';
      }).join("") + '</tbody></table>';
  }

  function compute(){
    var params = readForm();
    if(!params.bc || !params.mvFps || !params.bulletGr){
      return null;
    }
    var result = trajectory(params);
    renderTable(result.rows);
    drawChart(result.path, result.maxDrop);
    renderWallet(params, result.rows);
    return result;
  }

  function initRangeCard(){
    if(!$("#dopeTable")){ return; }
    var defs = C.ballistics || {};
    $("#sightHeightIn").value = defs.sightHeightIn || 1.5;
    $("#zeroYd").value = defs.zeroYd || 50;
    $("#tempF").value = defs.temperatureF || 50;
    $("#pressureInHg").value = defs.pressureInHg || 29.9;
    $("#altitudeFt").value = defs.altitudeFt || 0;

    $("#preset").addEventListener("change", function(){ applyPreset($("#preset").value); });
    applyPreset($("#preset").value);

    $("#computeBtn").addEventListener("click", compute);
    $("#printCardBtn").addEventListener("click", function(){
      if(!compute()){ return; }
      document.body.classList.add("print-wallet");
      window.print();
      window.addEventListener("afterprint", function(){
        document.body.classList.remove("print-wallet");
      }, { once: true });
    });
    $("#saveProfileBtn").addEventListener("click", function(){
      var name = $("#profileName").value.trim();
      if(!name){ $("#profileName").focus(); return; }
      var params = readForm();
      params.name = name;
      var list = loadProfiles().filter(function(p){ return p.name !== name; });
      list.unshift(params);
      saveProfiles(list.slice(0, 12));
      renderProfileList();
    });
    $("#exportBtn").addEventListener("click", function(){
      var blob = new Blob([JSON.stringify(loadProfiles(), null, 2)], { type:"application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "krgc-dope-profiles.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
    $("#importFile").addEventListener("change", function(e){
      var file = e.target.files[0];
      if(!file){ return; }
      var reader = new FileReader();
      reader.onload = function(){
        try{
          var data = JSON.parse(reader.result);
          if(Array.isArray(data)){ saveProfiles(data); renderProfileList(); }
        } catch(err){ alert("Could not read that file."); }
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    renderProfileList();
    compute();
  }

  window.KRGC_Ballistics = {
    PRESETS: PRESETS,
    trajectory: trajectory,
    compute: compute
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initRangeCard);
  } else {
    initRangeCard();
  }
})();
