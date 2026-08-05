/* =============================================================
   KRGC — Phase 2 API client
   Offline-tolerant score queue + auth helpers.
   ============================================================= */
(function(){
  "use strict";

  var SCORE_Q = "krgc.score.queue";
  var C = window.KRGC || {};

  function api(path, opts){
    opts = opts || {};
    return fetch(path, {
      method: opts.method || "GET",
      credentials: "same-origin",
      headers: opts.body ? { "content-type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store"
    }).then(function(r){
      return r.json().then(function(j){
        if(!r.ok){ throw Object.assign(new Error(j.error || r.statusText), { status:r.status, data:j }); }
        return j;
      });
    });
  }

  function queueScores(entries){
    var q = [];
    try{ q = JSON.parse(localStorage.getItem(SCORE_Q) || "[]"); } catch(e){}
    entries.forEach(function(e){
      if(!e.client_id){
        e.client_id = "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      }
      q.push(e);
    });
    localStorage.setItem(SCORE_Q, JSON.stringify(q));
    return syncScoreQueue();
  }

  function syncScoreQueue(){
    var q = [];
    try{ q = JSON.parse(localStorage.getItem(SCORE_Q) || "[]"); } catch(e){}
    if(!q.length){ return Promise.resolve({ synced:0, pending:0 }); }
    if(!navigator.onLine){ return Promise.resolve({ synced:0, pending:q.length, offline:true }); }

    return api("/api/score", { method:"POST", body:{ scores:q, setLive:true, matchId:q[0].matchId } })
      .then(function(){
        localStorage.setItem(SCORE_Q, "[]");
        return { synced:q.length, pending:0 };
      })
      .catch(function(){
        return { synced:0, pending:q.length };
      });
  }

  function pendingCount(){
    try{ return JSON.parse(localStorage.getItem(SCORE_Q) || "[]").length; }
    catch(e){ return 0; }
  }

  window.KRGC_API = {
    api: api,
    queueScores: queueScores,
    syncScoreQueue: syncScoreQueue,
    pendingCount: pendingCount,
    turnstileSiteKey: function(){
      return (C.turnstile && C.turnstile.siteKey) || "";
    }
  };

  window.addEventListener("online", function(){ syncScoreQueue(); });
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){ syncScoreQueue(); });
  } else {
    syncScoreQueue();
  }
})();
