/* =============================================================
   KRGC — ballistics engine + come-up card UI
   3-DOF point-mass solver, G1/G7 drag tables, ICAO atmosphere.
   Computed solutions are starting points only — confirm on paper.
   ============================================================= */
(function(){
  "use strict";

  var C = window.KRGC || {};
  var $ = function(s, r){ return (r || document).querySelector(s); };

  /* Nominal velocities — vary by barrel; marked .tk in the UI. */
  var PRESETS = {
    "22lr-std":   { label:".22 LR — high velocity",     bulletGr:40,  bc:0.125, dragModel:"G1", mvFps:1240 },
    "22lr-match": { label:".22 LR — match",             bulletGr:40,  bc:0.150, dragModel:"G1", mvFps:1080 },
    "223-55":     { label:".223 Rem 55 gr",             bulletGr:55,  bc:0.243, dragModel:"G1", mvFps:3240 },
    "308-168":    { label:".308 Win 168 gr",            bulletGr:168, bc:0.462, dragModel:"G1", mvFps:2680 },
    "3006-180":   { label:".30-06 180 gr",              bulletGr:180, bc:0.452, dragModel:"G1", mvFps:2700 },
    "65cm-140":   { label:"6.5 Creedmoor 140 gr",       bulletGr:140, bc:0.610, dragModel:"G7", mvFps:2710 },
    "custom":     { label:"Custom",                     bulletGr:168, bc:0.450, dragModel:"G1", mvFps:2600 }
  };

  var GRAV = 32.174;           /* ft/s² */
  var DT = 0.001;              /* s — per spec */
  var RHO0 = 0.076474;         /* lb/ft³ ICAO sea-level 59°F 29.92 inHg */
  /*
   * BC-based retardation scale for Cd(Mach) tables.
   * a = (ρ/ρ0) * Cd * v² / (BC * BC_SCALE)
   * Tuned so .22 LR HV (~1240 fps, BC 0.125, 50 yd zero) ≈ 30–34" at 200 yd
   * and .308 168 gr stays near published 100-yd-zero charts.
   */
  var BC_SCALE = 20000;
  var INDEX_KEY = "krgc.dope.__index";
  var KEY_PREFIX = "krgc.dope.";

  /* McCoy G1 / G7 Cd vs Mach (standard tables, linearly interpolated). */
  var G1 = [
    [0.00,0.2629],[0.05,0.2558],[0.10,0.2487],[0.15,0.2413],[0.20,0.2344],[0.25,0.2278],
    [0.30,0.2214],[0.35,0.2155],[0.40,0.2104],[0.45,0.2061],[0.50,0.2032],[0.55,0.2020],
    [0.60,0.2034],[0.70,0.2165],[0.725,0.2230],[0.75,0.2313],[0.775,0.2417],[0.80,0.2546],
    [0.825,0.2706],[0.85,0.2901],[0.875,0.3136],[0.90,0.3415],[0.925,0.3734],[0.95,0.4084],
    [0.975,0.4448],[1.00,0.4805],[1.025,0.5136],[1.05,0.5427],[1.075,0.5677],[1.10,0.5883],
    [1.125,0.6053],[1.15,0.6191],[1.20,0.6393],[1.25,0.6518],[1.30,0.6589],[1.35,0.6621],
    [1.40,0.6625],[1.45,0.6607],[1.50,0.6573],[1.55,0.6528],[1.60,0.6474],[1.65,0.6413],
    [1.70,0.6347],[1.75,0.6280],[1.80,0.6210],[1.85,0.6141],[1.90,0.6072],[1.95,0.6003],
    [2.00,0.5939],[2.05,0.5876],[2.10,0.5815],[2.15,0.5756],[2.20,0.5700],[2.25,0.5645],
    [2.30,0.5593],[2.35,0.5542],[2.40,0.5492],[2.45,0.5445],[2.50,0.5399],[2.55,0.5355],
    [2.60,0.5312],[2.65,0.5270],[2.70,0.5230],[2.75,0.5191],[2.80,0.5152],[2.85,0.5115],
    [2.90,0.5079],[2.95,0.5043],[3.00,0.5008],[3.05,0.4974],[3.10,0.4941],[3.15,0.4908],
    [3.20,0.4876],[3.25,0.4845],[3.30,0.4814],[3.40,0.4755],[3.50,0.4698],[3.60,0.4644],
    [3.70,0.4591],[3.80,0.4540],[3.90,0.4491],[4.00,0.4443],[4.20,0.4352],[4.40,0.4267],
    [4.60,0.4188],[4.80,0.4114],[5.00,0.4045]
  ];
  var G7 = [
    [0.00,0.1198],[0.05,0.1197],[0.10,0.1196],[0.15,0.1194],[0.20,0.1193],[0.25,0.1194],
    [0.30,0.1194],[0.35,0.1194],[0.40,0.1193],[0.45,0.1193],[0.50,0.1194],[0.55,0.1193],
    [0.60,0.1194],[0.65,0.1197],[0.70,0.1202],[0.725,0.1207],[0.75,0.1215],[0.775,0.1226],
    [0.80,0.1242],[0.825,0.1266],[0.85,0.1306],[0.875,0.1368],[0.90,0.1464],[0.925,0.1580],
    [0.95,0.1730],[0.975,0.1894],[1.00,0.2111],[1.025,0.2331],[1.05,0.2548],[1.075,0.2739],
    [1.10,0.2906],[1.125,0.3049],[1.15,0.3170],[1.20,0.3360],[1.25,0.3505],[1.30,0.3617],
    [1.35,0.3704],[1.40,0.3773],[1.45,0.3828],[1.50,0.3872],[1.55,0.3907],[1.60,0.3935],
    [1.65,0.3957],[1.70,0.3975],[1.75,0.3989],[1.80,0.3999],[1.85,0.4007],[1.90,0.4012],
    [1.95,0.4016],[2.00,0.4018],[2.05,0.4019],[2.10,0.4019],[2.15,0.4018],[2.20,0.4016],
    [2.25,0.4013],[2.30,0.4010],[2.35,0.4006],[2.40,0.4002],[2.45,0.3997],[2.50,0.3993],
    [2.60,0.3982],[2.70,0.3970],[2.80,0.3957],[2.90,0.3944],[3.00,0.3930],[3.10,0.3916],
    [3.20,0.3901],[3.30,0.3887],[3.40,0.3872],[3.50,0.3857],[3.75,0.3821],[4.00,0.3785],
    [4.25,0.3750],[4.50,0.3716],[4.75,0.3683],[5.00,0.3651]
  ];

  function lerp(t, a, b){ return a + (b - a) * t; }
  function interpCd(table, mach){
    if(mach <= table[0][0]){ return table[0][1]; }
    for(var i = 1; i < table.length; i++){
      if(mach <= table[i][0]){
        var t = (mach - table[i-1][0]) / (table[i][0] - table[i-1][0]);
        return lerp(t, table[i-1][1], table[i][1]);
      }
    }
    return table[table.length - 1][1];
  }

  /* ICAO density from station pressure + temperature; altitude for note only. */
  function airDensity(tempF, pressureInHg){
    var tempR = tempF + 459.67;
    /* ρ = P / (R * T); P in lb/ft², R_air ≈ 1716 ft·lb/(slug·°R); convert slug→lb via g */
    var pPsf = pressureInHg * 70.72675;
    return (pPsf / (1716.49 * tempR)) * GRAV;
  }

  function speedOfSound(tempF){
    return 49.0223 * Math.sqrt(tempF + 459.67);
  }

  function dragAccel(v, bc, cd, rhoRatio){
    if(v < 1 || bc <= 0){ return 0; }
    return rhoRatio * cd * v * v / (bc * BC_SCALE);
  }

  function distancesTo(maxYd){
    var out = [];
    for(var d = 25; d <= maxYd; d += 25){ out.push(d); }
    return out;
  }

  /**
   * Solve trajectory.
   * params: bulletGr, bc, dragModel, mvFps, sightHeightIn, zeroYd,
   *         tempF, pressureInHg, altitudeFt (unused in density — pressure is station),
   *         windMph (full-value crosswind, default 10 for table)
   */
  function trajectory(params){
    var table = params.dragModel === "G7" ? G7 : G1;
    var sightFt = (params.sightHeightIn || 1.5) / 12;
    var zeroFt = (params.zeroYd || 50) * 3;
    var mv = params.mvFps;
    var bc = params.bc;
    var massLb = params.bulletGr / 7000;
    var rho = airDensity(params.tempF, params.pressureInHg);
    var rhoRatio = rho / RHO0;
    var a0 = speedOfSound(params.tempF);
    var windFps = ((params.windMph != null) ? params.windMph : 10) * 1.4666667;
    var maxYd = params.maxYd || 500;
    var yards = distancesTo(maxYd);

    function integrate(angle, collectPath){
      var vx = mv * Math.cos(angle);
      var vy = mv * Math.sin(angle);
      var vz = 0; /* crossrange */
      var x = 0, y = -sightFt, z = 0;
      var t = 0;
      var steps = 0;
      var path = collectPath ? [] : null;
      var samples = {};
      var yi = 0;

      while(x < maxYd * 3 + 30 && y > -80 && t < 8 && steps++ < 20000){
        var vRelX = vx;
        var vRelY = vy;
        var vRelZ = vz - windFps; /* wind from 3 o'clock */
        var vRel = Math.sqrt(vRelX*vRelX + vRelY*vRelY + vRelZ*vRelZ);
        if(vRel < 40){ break; }
        var mach = vRel / a0;
        var cd = interpCd(table, mach);
        var aDrag = dragAccel(vRel, bc, cd, rhoRatio);
        var ax = -aDrag * vRelX / vRel;
        var ay = -aDrag * vRelY / vRel - GRAV;
        var az = -aDrag * vRelZ / vRel;

        vx += ax * DT;
        vy += ay * DT;
        vz += az * DT;
        x += vx * DT;
        y += vy * DT;
        z += vz * DT;
        t += DT;

        if(path && steps % 10 === 0){
          path.push({ x: x / 3, dropIn: -y * 12, windIn: z * 12 });
        }

        while(yi < yards.length && x >= yards[yi] * 3){
          var v = Math.sqrt(vx*vx + vy*vy + vz*vz);
          samples[yards[yi]] = {
            yd: yards[yi],
            dropIn: -y * 12,
            windIn: z * 12,
            vel: v,
            energy: massLb * v * v / (2 * GRAV),
            tof: t
          };
          yi++;
        }
      }
      return { samples: samples, path: path, lastY: y, lastX: x };
    }

    /* Binary search launch angle so path crosses y=0 at zero distance. */
    function yAtZeroDistance(angle){
      var vx = mv * Math.cos(angle);
      var vy = mv * Math.sin(angle);
      var x = 0, y = -sightFt;
      var steps = 0;
      while(x < zeroFt && steps++ < 20000){
        var v = Math.sqrt(vx*vx + vy*vy);
        if(v < 40){ break; }
        var mach = v / a0;
        var cd = interpCd(table, mach);
        var aDrag = dragAccel(v, bc, cd, rhoRatio);
        var ax = -aDrag * vx / v;
        var ay = -aDrag * vy / v - GRAV;
        vx += ax * DT; vy += ay * DT;
        x += vx * DT; y += vy * DT;
        if(y < -40){ break; }
      }
      return y;
    }

    var lo = -0.05, hi = 0.08;
    for(var n = 0; n < 28; n++){
      var mid = (lo + hi) / 2;
      if(yAtZeroDistance(mid) > 0){ hi = mid; } else { lo = mid; }
    }
    var zeroAngle = (lo + hi) / 2;

    var result = integrate(zeroAngle, true);
    var rows = yards.map(function(yd){
      var s = result.samples[yd];
      if(!s){
        return { yd:yd, dropIn:0, moa:0, mils:0, windIn:0, windMoa:0, vel:0, energy:0, tof:0 };
      }
      var moa = yd > 0 ? s.dropIn / (yd * 1.047) : 0;
      var mils = yd > 0 ? s.dropIn / (yd * 3.4377) : 0;
      var windMoa = yd > 0 ? s.windIn / (yd * 1.047) : 0;
      return {
        yd: yd,
        dropIn: s.dropIn,
        moa: moa,
        mils: mils,
        windIn: s.windIn,
        windMoa: windMoa,
        vel: s.vel,
        energy: s.energy,
        tof: s.tof
      };
    });

    var maxDrop = 0;
    rows.forEach(function(r){ if(r.dropIn > maxDrop){ maxDrop = r.dropIn; } });

    return {
      rows: rows,
      path: result.path || [],
      maxDrop: maxDrop,
      zeroAngle: zeroAngle,
      windMph: windFps / 1.4666667
    };
  }

  /* ---------- DOPE profile storage: krgc.dope.<name> ---------- */
  function listProfileNames(){
    try{ return JSON.parse(localStorage.getItem(INDEX_KEY) || "[]"); }
    catch(e){ return []; }
  }
  function saveProfile(name, data){
    var names = listProfileNames().filter(function(n){ return n !== name; });
    names.unshift(name);
    localStorage.setItem(KEY_PREFIX + name, JSON.stringify(data));
    localStorage.setItem(INDEX_KEY, JSON.stringify(names.slice(0, 24)));
  }
  function loadProfile(name){
    try{ return JSON.parse(localStorage.getItem(KEY_PREFIX + name) || "null"); }
    catch(e){ return null; }
  }
  function deleteProfile(name){
    localStorage.removeItem(KEY_PREFIX + name);
    localStorage.setItem(INDEX_KEY, JSON.stringify(listProfileNames().filter(function(n){ return n !== name; })));
  }
  function exportAll(){
    var out = {};
    listProfileNames().forEach(function(n){ out[n] = loadProfile(n); });
    return out;
  }
  function importAll(obj){
    Object.keys(obj || {}).forEach(function(n){ if(obj[n]){ saveProfile(n, obj[n]); } });
  }

  function readForm(){
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
      altitudeFt: parseFloat($("#altitudeFt").value) || 0,
      windMph: 10
    };
  }

  function applyPreset(key){
    var p = PRESETS[key];
    if(!p || key === "custom"){ return; }
    $("#bulletGr").value = p.bulletGr;
    $("#bc").value = p.bc;
    $("#dragModel").value = p.dragModel;
    $("#mvFps").value = p.mvFps;
    var note = $("#mvNote");
    if(note){ note.innerHTML = 'Muzzle velocity is nominal for this preset — varies by barrel. Chronograph yours.'; }
  }

  function renderProfileList(){
    var host = $("#dopeList");
    if(!host){ return; }
    var names = listProfileNames();
    host.innerHTML = names.length ? names.map(function(name){
      return '<li><span>' + name.replace(/</g,"&lt;") + '</span>' +
        '<span><button type="button" class="btn btn-ghost btn-sm" data-load="' + name.replace(/"/g,"&quot;") + '">Load</button> ' +
        '<button type="button" class="btn btn-ghost btn-sm" data-del="' + name.replace(/"/g,"&quot;") + '">Delete</button></span></li>';
    }).join("") : '<li class="muted">No saved profiles yet.</li>';

    host.querySelectorAll("[data-load]").forEach(function(b){
      b.addEventListener("click", function(){
        var prof = loadProfile(b.getAttribute("data-load"));
        if(!prof){ return; }
        ["preset","bulletGr","bc","dragModel","mvFps","sightHeightIn","zeroYd","tempF","pressureInHg","altitudeFt"].forEach(function(k){
          var el = $("#" + k);
          if(el && prof[k] != null){ el.value = prof[k]; }
        });
        compute();
      });
    });
    host.querySelectorAll("[data-del]").forEach(function(b){
      b.addEventListener("click", function(){
        deleteProfile(b.getAttribute("data-del"));
        renderProfileList();
      });
    });
  }

  function drawChart(path, maxDrop){
    var canvas = $("#trajChart");
    if(!canvas || !path.length){ return; }
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth || 600;
    var h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#16221D";
    ctx.fillRect(0, 0, w, h);
    var maxX = path[path.length - 1].x || 500;
    var pad = 28;
    ctx.strokeStyle = "rgba(232,237,233,.12)";
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
      var py = pad + (pt.dropIn / (maxDrop || 1)) * (h - pad * 2);
      if(i === 0){ ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
    });
    ctx.stroke();
    if(!reduce){
      ctx.fillStyle = "#FF6A2B";
      var last = path[path.length - 1];
      ctx.beginPath();
      ctx.arc(pad + (last.x / maxX) * (w - pad * 2), pad + (last.dropIn / (maxDrop || 1)) * (h - pad * 2), 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#9AACA2";
    ctx.font = "11px DM Mono, monospace";
    ctx.fillText("Drop (in) vs yards", pad, 14);
  }

  function renderWallet(params, rows){
    var card = $("#walletCard");
    if(!card){ return; }
    var title = PRESETS[params.preset] ? PRESETS[params.preset].label : "Custom";
    var slim = rows.filter(function(r){ return r.yd % 50 === 0 || r.yd === 25; });
    card.innerHTML = '<h1>' + title + '</h1>' +
      '<p style="margin:0 0 .05in;font-size:6.5pt">' + params.bulletGr + ' gr · BC ' + params.bc + ' ' + params.dragModel +
      ' · ' + params.mvFps + ' fps · zero ' + params.zeroYd + ' yd · 10 mph wind</p>' +
      '<table><thead><tr><th>yd</th><th>drop"</th><th>MOA</th><th>mil</th><th>wind"</th></tr></thead><tbody>' +
      slim.map(function(r){
        return '<tr><td>' + r.yd + '</td><td>' + r.dropIn.toFixed(1) + '</td><td>' +
          r.moa.toFixed(1) + '</td><td>' + r.mils.toFixed(2) + '</td><td>' + r.windIn.toFixed(1) + '</td></tr>';
      }).join("") + '</tbody></table>' +
      '<p style="margin:.04in 0 0;font-size:5.5pt">STARTING POINT ONLY — confirm on paper. Invalid if inputs wrong.</p>';
    card.hidden = false;
  }

  function renderTable(rows){
    var host = $("#dopeTable");
    if(!host){ return; }
    host.innerHTML = '<table><thead><tr><th>yd</th><th>Drop (in)</th><th>MOA</th><th>Mils</th><th>10mph wind (in)</th><th>Wind MOA</th><th>fps</th><th>ft-lb</th></tr></thead><tbody>' +
      rows.map(function(r){
        return '<tr><td class="num">' + r.yd + '</td><td class="num">' + r.dropIn.toFixed(2) +
          '</td><td class="num">' + r.moa.toFixed(2) + '</td><td class="num">' + r.mils.toFixed(2) +
          '</td><td class="num">' + r.windIn.toFixed(2) + '</td><td class="num">' + r.windMoa.toFixed(2) +
          '</td><td class="num">' + Math.round(r.vel) + '</td><td class="num">' + Math.round(r.energy) + '</td></tr>';
      }).join("") + '</tbody></table>';
  }

  function compute(){
    var params = readForm();
    if(!(params.bc > 0) || !(params.mvFps > 0) || !(params.bulletGr > 0)){ return null; }
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
      window.addEventListener("afterprint", function(){ document.body.classList.remove("print-wallet"); }, { once:true });
    });
    $("#saveProfileBtn").addEventListener("click", function(){
      var name = ($("#profileName").value || "").trim();
      if(!name){ $("#profileName").focus(); return; }
      saveProfile(name, readForm());
      renderProfileList();
    });
    $("#exportBtn").addEventListener("click", function(){
      var blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type:"application/json" });
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
          if(Array.isArray(data)){
            data.forEach(function(p){ if(p && p.name){ saveProfile(p.name, p); } });
          } else {
            importAll(data);
          }
          renderProfileList();
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
    compute: compute,
    dragAccel: dragAccel
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", initRangeCard);
  } else {
    initRangeCard();
  }
})();
