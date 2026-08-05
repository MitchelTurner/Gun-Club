/* KRGC service worker — offline shell for range tools */
var CACHE = "krgc-v1";
var OFFLINE = "/offline.html";
var PRECACHE = [
  "/",
  "/offline.html",
  "/first-visit.html",
  "/range-card.html",
  "/targets.html",
  "/play.html",
  "/standings.html",
  "/recaps.html",
  "/waiver.html",
  "/visitors.html",
  "/members.html",
  "/assets/css/site.css",
  "/assets/css/print.css",
  "/assets/js/config.js",
  "/assets/js/site.js",
  "/assets/js/ballistics.js",
  "/assets/js/games.js",
  "/assets/js/standings.js",
  "/assets/js/pwa.js",
  "/manifest.webmanifest",
  "/data/recaps.json",
  "/data/results.json",
  "/data/badges.json",
  "/data/records.json"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(PRECACHE.map(function(u){
        return new Request(u, { cache:"reload" });
      })).catch(function(){});
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET"){ return; }
  var url = new URL(e.request.url);
  if(url.origin !== location.origin){ return; }

  if(e.request.mode === "navigate"){
    e.respondWith(
      fetch(e.request).catch(function(){
        return caches.match(e.request).then(function(cached){
          return cached || caches.match(OFFLINE);
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(res){
        if(res && res.status === 200 && url.pathname.match(/\.(css|js|json|html|webmanifest)$/)){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){
        if(url.pathname.endsWith(".html")){
          return caches.match(OFFLINE);
        }
      });
    })
  );
});
