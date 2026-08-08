/* KRGC service worker — offline shell for range tools */
var CACHE = "krgc-v6";
var OFFLINE = "/offline.html";

/* App shell — cache-first */
var SHELL = [
  "/",
  "/index.html",
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
  "/blog/",
  "/blog/index.html",
  "/blog/zero-rimfire-rifle.html",
  "/blog/wind-calls-southeast-alaska.html",
  "/blog/first-rimfire-match.html",
  "/blog/range-commands-cease-fire.html",
  "/blog/shooting-in-the-rain.html",
  "/blog/come-up-card-basics.html",
  "/blog/eye-ear-protection-range.html",
  "/blog/metallic-silhouette-beginners.html",
  "/assets/css/site.css",
  "/assets/css/print.css",
  "/assets/js/config.js",
  "/assets/js/site.js",
  "/assets/js/blog.js",
  "/assets/js/ballistics.js",
  "/assets/js/games.js",
  "/assets/js/standings.js",
  "/assets/js/pwa.js",
  "/assets/js/api.js",
  "/checkin.html",
  "/score.html",
  "/admin.html",
  "/manifest.webmanifest",
  "/assets/img/icons/icon-192.png",
  "/assets/img/icons/icon-512.png",
  "/assets/img/icons/icon-maskable-512.png",
  "/assets/img/icons/apple-touch-180.png",
  "/assets/img/og.jpg"
];

/* JSON — network-first with cache fallback; also precached */
var DATA = [
  "/data/status.json",
  "/data/results.json",
  "/data/badges.json",
  "/data/records.json",
  "/data/recaps.json",
  "/data/schedule.json",
  "/data/posts.json"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(SHELL.concat(DATA).map(function(u){
        return new Request(u, { cache: "reload" });
      })).catch(function(){ /* partial precache is OK */ });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

function isData(url){
  return url.pathname.indexOf("/data/") === 0 && url.pathname.slice(-5) === ".json";
}

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET"){ return; }
  var url = new URL(e.request.url);
  if(url.origin !== location.origin){ return; }

  /* Navigations: network, then cache, then offline.html */
  if(e.request.mode === "navigate"){
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){
        return caches.match(e.request).then(function(cached){
          return cached || caches.match(OFFLINE);
        });
      })
    );
    return;
  }

  /* data/*.json — network-first, cache fallback */
  if(isData(url)){
    e.respondWith(
      fetch(e.request).then(function(res){
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }

  /* App shell — cache-first */
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached){ return cached; }
      return fetch(e.request).then(function(res){
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
