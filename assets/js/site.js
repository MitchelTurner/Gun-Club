/* =============================================================
   KRGC — shared behaviour
   Every block guards for its own elements, so this one file is
   safe to load on every page.
   ============================================================= */
(function(){
  "use strict";

  var C = window.KRGC || {};
  var $  = function(s, r){ return (r||document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };

  /* ---------- analytics (no-op until a domain is set) ---------- */
  function track(event, props){
    if(typeof window.plausible === "function"){ window.plausible(event, props ? {props:props} : undefined); }
  }
  (function(){
    if(!C.plausibleDomain){ return; }
    var s = document.createElement("script");
    s.defer = true;
    s.setAttribute("data-domain", C.plausibleDomain);
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
    window.plausible = window.plausible || function(){ (window.plausible.q = window.plausible.q || []).push(arguments); };
  })();

  /* ---------- form transport ----------
     POSTs JSON to C.formEndpoint. Falls back to the visitor's mail
     app when no endpoint is configured or the request fails, so a
     submission is never silently lost.                          */
  function mailtoFallback(subject, payload){
    var body = Object.keys(payload).map(function(k){
      return k + ": " + payload[k];
    }).join("\n");
    window.location.href = "mailto:" + (C.site && C.site.email) +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function submitForm(subject, payload){
    payload._subject = subject;
    payload._page = window.location.pathname;
    if(!C.formEndpoint){
      mailtoFallback(subject, payload);
      return Promise.resolve({ mode:"mailto" });
    }
    return fetch(C.formEndpoint, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Accept":"application/json" },
      body: JSON.stringify(payload)
    }).then(function(r){
      if(!r.ok){ throw new Error("bad status " + r.status); }
      return { mode:"endpoint" };
    }).catch(function(){
      mailtoFallback(subject, payload);
      return { mode:"mailto" };
    });
  }

  function show(el, kind, msg){
    if(!el){ return; }
    el.className = "alert " + (kind || "");
    el.textContent = msg;
    el.setAttribute("data-show","true");
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- header, drawer, accordion, reveal ---------- */
  (function(){
    var drawer = $("#drawer"), burger = $("#burger");
    if(drawer && burger){
      var set = function(open){
        drawer.setAttribute("data-open", String(open));
        burger.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      };
      burger.addEventListener("click", function(){ set(true); });
      var close = $("#drawerClose");
      if(close){ close.addEventListener("click", function(){ set(false); }); }
      $$("#drawer a").forEach(function(a){ a.addEventListener("click", function(){ set(false); }); });
      document.addEventListener("keydown", function(e){ if(e.key === "Escape"){ set(false); } });
    }

    $$(".acc button").forEach(function(b){
      b.addEventListener("click", function(){
        var open = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!open));
        b.parentNode.querySelector(".body").setAttribute("data-open", String(!open));
      });
    });

    if("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin:"0px 0px -6% 0px" });
      $$(".rise").forEach(function(n){ io.observe(n); });
    } else {
      $$(".rise").forEach(function(n){ n.classList.add("in"); });
    }
  })();

  /* ---------- photo slots ----------
     Any <img data-shot> that fails to load turns into a labelled
     placeholder instead of a broken icon.                       */
  $$("img[data-shot]").forEach(function(img){
    img.addEventListener("error", function(){
      var fig = img.closest(".shot");
      if(!fig){ return; }
      fig.classList.add("empty");
      fig.innerHTML = '<p><b>Photo needed</b>' + (img.getAttribute("alt") || "") + '</p>';
    });
  });

  /* ---------- range status ----------
     Reads /data/status.json so the club can post a closure without
     touching code. Falls back to "open" if the file is missing.  */
  (function(){
    var pill = $("#statusPill"), noticeEl = $("#statusNotice");
    if(!pill){ return; }
    var apply = function(s){
      var open = s.open !== false;
      pill.className = "live" + (open ? "" : " closed");
      pill.innerHTML = '<span class="dot"></span>' + (open ? "Open" : "Closed");
      if(noticeEl && s.notice){
        noticeEl.textContent = s.notice;
        noticeEl.setAttribute("data-show","true");
      }
      var until = $("#statusUntil");
      if(until && s.detail){ until.textContent = s.detail; }
    };
    fetch("data/status.json", { cache:"no-store" })
      .then(function(r){ return r.json(); })
      .then(apply)
      .catch(function(){ apply({ open:true }); });
  })();

  /* ---------- approximate sunset, Ketchikan ---------- */
  (function(){
    var out = $("#lastLight");
    if(!out){ return; }
    var lat = 55.3422 * Math.PI / 180, lng = -131.6461, now = new Date();
    var day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    var decl = 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + day) / 365);
    var cosH = -Math.tan(lat) * Math.tan(decl);
    if(cosH >= 1){ out.innerHTML = 'No sun<small>Check before you drive out</small>'; return; }
    if(cosH <= -1){ out.innerHTML = 'All day<small>Shoot until you get tired</small>'; return; }
    var H = Math.acos(cosH) * 180 / Math.PI / 15;
    var eqt = 9.87 * Math.sin(4 * Math.PI * (day - 81) / 364)
            - 7.53 * Math.cos(2 * Math.PI * (day - 81) / 364)
            - 1.5  * Math.sin(2 * Math.PI * (day - 81) / 364);
    var local = ((12 - lng / 15 - eqt / 60) + H + (-now.getTimezoneOffset() / 60) + 24) % 24;
    var h = Math.floor(local), m = Math.round((local - h) * 60);
    if(m === 60){ m = 0; h = (h + 1) % 24; }
    var h12 = (h % 12 === 0) ? 12 : (h % 12);
    out.innerHTML = h12 + ":" + (m < 10 ? "0" : "") + m + " " + (h >= 12 ? "pm" : "am") +
      '<small>Approximate sunset</small>';
  })();

  /* ---------- range plan markers ---------- */
  (function(){
    var note = $("#planNote");
    if(!note){ return; }
    var idle = note.innerHTML, active = null;
    var canHover = window.matchMedia && window.matchMedia("(hover:hover)").matches;
    $$(".tick").forEach(function(t){
      var reveal = function(){
        if(active && active !== t){ active.setAttribute("data-active","false"); }
        active = t;
        t.setAttribute("data-active","true");
        note.innerHTML = t.getAttribute("data-note");
      };
      t.addEventListener("mouseenter", reveal);
      t.addEventListener("click", reveal);
      t.addEventListener("focus", reveal);
      t.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); reveal(); }
      });
      t.addEventListener("mouseleave", function(){
        if(canHover){ t.setAttribute("data-active","false"); active = null; note.innerHTML = idle; }
      });
    });
  })();

  /* ---------- calendar files ----------
     Builds an .ics on the fly from data attributes on the button.
     Floating local time, so it lands correctly in Alaska.       */
  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function icsDate(d){
    return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) +
      "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
  }
  $$("[data-ics]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var title = btn.getAttribute("data-ics");
      var start = new Date(btn.getAttribute("data-start"));
      var hours = parseFloat(btn.getAttribute("data-hours") || "3");
      var rrule = btn.getAttribute("data-rrule");
      var end   = new Date(start.getTime() + hours * 3600000);
      var lines = [
        "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//KRGC//EN","CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        "UID:" + Date.now() + "@krgc",
        "DTSTAMP:" + icsDate(new Date()),
        "DTSTART:" + icsDate(start),
        "DTEND:"   + icsDate(end),
        "SUMMARY:" + title,
        "LOCATION:Ketchikan Rod & Gun Club, North Tongass Highway, Ketchikan AK",
        "DESCRIPTION:" + (btn.getAttribute("data-desc") || "")
      ];
      if(rrule){ lines.push("RRULE:" + rrule); }
      lines.push("END:VEVENT","END:VCALENDAR");
      var blob = new Blob([lines.join("\r\n")], { type:"text/calendar;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = title.toLowerCase().replace(/[^a-z0-9]+/g,"-") + ".ics";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      track("Calendar download", { match:title });
    });
  });

  /* ---------- membership picker + checkout ---------- */
  (function(){
    var nameEl = $("#planName");
    if(!nameEl){ return; }
    var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    var chosen = "individual";

    function render(key){
      var p = (C.plans || {})[key];
      if(!p){ return; }
      chosen = key;
      nameEl.textContent = p.name;
      $("#planPrice").textContent = p.price;
      $("#planUnit").textContent = p.unit;
      $("#planFor").textContent = p.blurb;
      $("#planList").innerHTML = p.perks.map(function(t){
        return "<li>" + CHECK + "<span>" + t + "</span></li>";
      }).join("");

      var pay = $("#payNow"), payNote = $("#payNote");
      var link = (C.stripe || {})[key];
      if(pay){
        if(link){
          pay.href = link;
          pay.style.display = "";
          pay.textContent = "Pay dues now — " + p.price;
          if(payNote){ payNote.style.display = "none"; }
        } else {
          pay.style.display = "none";
          if(payNote){ payNote.style.display = ""; }
        }
      }
      var bar = $("#barPrice");
      if(bar){ bar.textContent = p.price + " " + p.unit; }
      track("Tier viewed", { tier: p.name });
    }

    $$(".tier").forEach(function(b){
      b.addEventListener("click", function(){
        $$(".tier").forEach(function(o){ o.setAttribute("aria-selected","false"); });
        b.setAttribute("aria-selected","true");
        render(b.getAttribute("data-plan"));
      });
    });
    render("individual");

    var pay = $("#payNow");
    if(pay){ pay.addEventListener("click", function(){ track("Checkout started", { tier: chosen }); }); }

    /* application */
    var btn = $("#submitBtn");
    if(!btn){ return; }
    btn.addEventListener("click", function(){
      var first = $("#fname").value.trim(), last = $("#lname").value.trim();
      var email = $("#email").value.trim(), phone = $("#phone").value.trim();
      var exp = $("#exp").value, notes = $("#notes").value.trim();
      var remind = $("#remind") ? $("#remind").checked : false;
      var valid = EMAIL_RE.test(email);

      $("#email").setAttribute("aria-invalid", valid ? "false" : "true");
      $("#emailErr").setAttribute("data-show", valid ? "false" : "true");
      if(!first){ $("#fname").focus(); return; }
      if(!last){ $("#lname").focus(); return; }
      if(!valid){ $("#email").focus(); return; }

      btn.disabled = true;
      btn.textContent = "Sending…";
      track("Application submitted", { tier: chosen });

      submitForm("Membership application — " + first + " " + last, {
        type: "membership_application",
        membership: (C.plans[chosen] || {}).name,
        name: first + " " + last,
        email: email,
        phone: phone || "not given",
        experience: exp,
        match_reminders: remind ? "yes" : "no",
        notes: notes || "(none)"
      }).then(function(res){
        btn.disabled = false;
        btn.textContent = "Send application";
        if(res.mode === "endpoint"){
          show($("#formAlert"), "ok",
            "Thanks, " + first + ". Your application is in. Someone will be in touch about dues and the gate code — usually within a week.");
        } else {
          show($("#formAlert"), "ok",
            "Thanks, " + first + ". Your mail app should open with the application ready to send. If nothing happens, call " + C.site.phone + ".");
        }
      });
    });
  })();

  /* ---------- match reminder signup ---------- */
  (function(){
    var btn = $("#remindBtn");
    if(!btn){ return; }
    btn.addEventListener("click", function(){
      var email = $("#remindEmail").value.trim();
      var phone = $("#remindPhone") ? $("#remindPhone").value.trim() : "";
      if(!EMAIL_RE.test(email) && !phone){
        show($("#remindAlert"), "bad", "Add an email address or a phone number so we can reach you.");
        return;
      }
      btn.disabled = true;
      submitForm("Match reminder signup", {
        type: "reminder_signup",
        email: email || "not given",
        phone: phone || "not given"
      }).then(function(){
        btn.disabled = false;
        show($("#remindAlert"), "ok", "You're on the list. Reminders go out the week before each match.");
        track("Reminder signup");
      });
    });
  })();

  /* ---------- waiver ---------- */
  (function(){
    var btn = $("#waiverBtn");
    if(!btn){ return; }
    btn.addEventListener("click", function(){
      var name = $("#wName").value.trim();
      var email = $("#wEmail").value.trim();
      var dob = $("#wDob").value;
      var contact = $("#wContact").value.trim();
      var sig = $("#wSig").value.trim();
      var boxes = $$(".waiver-check");
      var allChecked = boxes.every(function(b){ return b.checked; });

      if(!name){ $("#wName").focus(); return; }
      if(!EMAIL_RE.test(email)){ $("#wEmail").focus(); show($("#waiverAlert"), "bad", "A valid email is required."); return; }
      if(!allChecked){ show($("#waiverAlert"), "bad", "Every acknowledgement has to be checked before you can sign."); return; }
      if(sig.toLowerCase() !== name.toLowerCase()){
        show($("#waiverAlert"), "bad", "Type your full name in the signature field exactly as you entered it above.");
        return;
      }

      btn.disabled = true;
      submitForm("Signed waiver — " + name, {
        type: "waiver",
        name: name,
        email: email,
        date_of_birth: dob || "not given",
        emergency_contact: contact || "not given",
        signature: sig,
        signed_at: new Date().toISOString(),
        acknowledgements: boxes.length + " of " + boxes.length + " accepted"
      }).then(function(){
        btn.disabled = false;
        show($("#waiverAlert"), "ok",
          "Signed and sent. Print a copy for your records if you'd like — the club keeps the original on file.");
        track("Waiver signed");
      });
    });
    var printBtn = $("#waiverPrint");
    if(printBtn){ printBtn.addEventListener("click", function(){ window.print(); }); }
  })();

  /* ---------- reservation request ---------- */
  (function(){
    var btn = $("#resBtn");
    if(!btn){ return; }
    btn.addEventListener("click", function(){
      var name = $("#resName").value.trim();
      var email = $("#resEmail").value.trim();
      if(!name || !EMAIL_RE.test(email)){
        show($("#resAlert"), "bad", "Name and a valid email are required.");
        return;
      }
      btn.disabled = true;
      submitForm("Range reservation request — " + name, {
        type: "reservation_request",
        name: name,
        email: email,
        bay: $("#resBay").value,
        date: $("#resDate").value,
        window: $("#resWindow").value,
        people: $("#resPeople").value,
        notes: $("#resNotes").value.trim() || "(none)"
      }).then(function(){
        btn.disabled = false;
        show($("#resAlert"), "ok", "Request sent. This is a request, not a confirmed booking — someone will confirm by email.");
        track("Reservation requested");
      });
    });
  })();

  /* ---------- members gate ----------
     A shared passcode, held in memory only for this page view. It
     keeps the gate code off the open web; it is not real auth.   */
  (function(){
    var btn = $("#gateBtn");
    if(!btn){ return; }
    var unlock = function(){
      $("#gateForm").style.display = "none";
      $$(".locked").forEach(function(n){ n.setAttribute("data-unlocked","true"); });
      var code = $("#gateCodeValue");
      if(code){ code.textContent = C.gateCode || "____"; }
      track("Members area unlocked");
    };
    var attempt = function(){
      var v = $("#gateInput").value.trim().toLowerCase();
      if(v && v === String(C.memberPasscode || "").toLowerCase()){ unlock(); }
      else { show($("#gateAlert"), "bad", "That passcode isn't right. Ask any officer, or call " + C.site.phone + "."); }
    };
    btn.addEventListener("click", attempt);
    $("#gateInput").addEventListener("keydown", function(e){ if(e.key === "Enter"){ attempt(); } });
  })();

  /* ---------- match results + season leaderboard ---------- */
  (function(){
    var host = $("#resultsHost");
    if(!host){ return; }
    var render = function(data){
      var matches = data.matches || [];
      var seasons = {};
      matches.forEach(function(m){ seasons[m.season] = true; });
      var seasonList = Object.keys(seasons).sort().reverse();
      var current = seasonList[0];

      var filters = $("#seasonFilters");
      filters.innerHTML = seasonList.map(function(s){
        return '<button class="tier" data-season="' + s + '" aria-selected="' + (s === current) + '">' + s + '</button>';
      }).join("");

      var draw = function(season){
        var inSeason = matches.filter(function(m){ return m.season === season; });
        var tally = {};
        inSeason.forEach(function(m){
          (m.scores || []).forEach(function(row, i){
            var t = tally[row.shooter] || (tally[row.shooter] = { shooter:row.shooter, points:0, matches:0, best:0 });
            t.points += Math.max(0, 20 - i);          /* 20 for a win, sliding down */
            t.matches += 1;
            t.best = Math.max(t.best, row.score);
          });
        });
        var board = Object.keys(tally).map(function(k){ return tally[k]; })
          .sort(function(a,b){ return b.points - a.points || b.best - a.best; });

        $("#leaderboard").innerHTML = board.length
          ? '<table><thead><tr><th>#</th><th>Shooter</th><th>Matches</th><th>Best score</th><th>Season points</th></tr></thead><tbody>' +
            board.map(function(r, i){
              return "<tr><td class='num rank'>" + (i+1) + "</td><td>" + r.shooter +
                     "</td><td class='num'>" + r.matches + "</td><td class='num'>" + r.best +
                     "</td><td class='num'>" + r.points + "</td></tr>";
            }).join("") + "</tbody></table>"
          : "<p class='muted' style='padding:1rem'>No results posted for this season yet.</p>";

        $("#matchList").innerHTML = inSeason.slice().reverse().map(function(m){
          return '<article class="event"><div class="when">' + m.date + '</div><div><h3>' + m.name +
            '</h3><p>' + (m.scores || []).slice(0,3).map(function(s, i){
              return (i+1) + ". " + s.shooter + " — " + s.score;
            }).join(" · ") + (m.shooters ? " · " + m.shooters + " shooters" : "") + '</p></div></article>';
        }).join("");
      };

      filters.addEventListener("click", function(e){
        var b = e.target.closest("[data-season]");
        if(!b){ return; }
        $$("#seasonFilters .tier").forEach(function(o){ o.setAttribute("aria-selected","false"); });
        b.setAttribute("aria-selected","true");
        draw(b.getAttribute("data-season"));
      });
      draw(current);
    };

    fetch("data/results.json", { cache:"no-store" })
      .then(function(r){ return r.json(); })
      .then(render)
      .catch(function(){
        host.innerHTML = "<p class='muted'>Results load from <code>data/results.json</code>. " +
          "Open this page over http (not as a local file) to see them.</p>";
      });
  })();

  /* ---------- admin: build status.json ---------- */
  (function(){
    var out = $("#statusOut");
    if(!out){ return; }
    var state = { open:true, detail:"", notice:"" };
    var paint = function(){
      out.textContent = JSON.stringify(state, null, 2);
      $$("#openToggle .tier").forEach(function(b){
        b.setAttribute("aria-selected", String((b.getAttribute("data-open") === "true") === state.open));
      });
    };
    $$("#openToggle .tier").forEach(function(b){
      b.addEventListener("click", function(){ state.open = b.getAttribute("data-open") === "true"; paint(); });
    });
    $("#adminDetail").addEventListener("input", function(e){ state.detail = e.target.value; paint(); });
    $("#adminNotice").addEventListener("input", function(e){ state.notice = e.target.value; paint(); });
    $("#copyStatus").addEventListener("click", function(){
      var text = out.textContent;
      if(navigator.clipboard){ navigator.clipboard.writeText(text); }
      show($("#adminAlert"), "ok", "Copied. Paste it into data/status.json and save.");
    });
    $("#downloadStatus").addEventListener("click", function(){
      var blob = new Blob([out.textContent], { type:"application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "status.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
    paint();
  })();

  /* ---------- sticky join bar ---------- */
  (function(){
    var bar = $("#stickybar");
    if(!bar){ return; }
    var hero = $(".hero") || $(".pagehead");
    var form = $("#membership");
    var pastHero = false, onForm = false;
    var sync = function(){ bar.setAttribute("data-show", String(pastHero && !onForm)); };
    if("IntersectionObserver" in window && hero){
      new IntersectionObserver(function(e){ pastHero = !e[0].isIntersecting; sync(); }, { threshold:0 }).observe(hero);
      if(form){
        new IntersectionObserver(function(e){ onForm = e[0].isIntersecting; sync(); }, { threshold:0.12 }).observe(form);
      }
    }
    var cta = bar.querySelector("a");
    if(cta){ cta.addEventListener("click", function(){ track("Sticky CTA tapped"); }); }
  })();

  /* ---------- fill config-driven text ---------- */
  $$("[data-site]").forEach(function(el){
    var key = el.getAttribute("data-site");
    var val = (C.site || {})[key];
    if(val){ el.textContent = val; }
  });
})();
