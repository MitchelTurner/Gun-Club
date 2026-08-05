/* =============================================================
   KRGC — PWA install prompt + service worker registration
   Install bar: once, on a second visit, only if beforeinstallprompt.
   ============================================================= */
(function(){
  "use strict";

  var $ = function(s){ return document.querySelector(s); };
  var VISIT_KEY = "krgc.visits";
  var DISMISS_KEY = "krgc.install.dismissed";

  try{
    var visits = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) || 0;
    localStorage.setItem(VISIT_KEY, String(visits + 1));
  } catch(e){}

  if("serviceWorker" in navigator){
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("/sw.js").catch(function(){});
    });
  }

  var deferredPrompt = null;
  var installBar = null;

  function visitCount(){
    try{ return parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) || 0; }
    catch(e){ return 0; }
  }

  function wasDismissed(){
    try{ return localStorage.getItem(DISMISS_KEY) === "1"; }
    catch(e){ return false; }
  }

  function ensureInstallBar(){
    if(installBar){ return installBar; }
    installBar = document.createElement("div");
    installBar.className = "installbar";
    installBar.id = "installBar";
    installBar.setAttribute("data-show", "false");
    installBar.setAttribute("role", "dialog");
    installBar.setAttribute("aria-label", "Install for offline use");
    installBar.innerHTML = '<div class="txt"><b>Install for offline use</b><span>Range rules and tools work with no cell service.</span></div>' +
      '<div class="actions">' +
      '<button type="button" class="btn btn-primary btn-sm" id="installBtn">Install</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="installDismiss">Not now</button>' +
      '</div>';
    document.body.appendChild(installBar);
    $("#installDismiss").addEventListener("click", function(){
      installBar.setAttribute("data-show", "false");
      try{ localStorage.setItem(DISMISS_KEY, "1"); } catch(e){}
    });
    $("#installBtn").addEventListener("click", function(){
      if(!deferredPrompt){ return; }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function(){
        deferredPrompt = null;
        installBar.setAttribute("data-show", "false");
        try{ localStorage.setItem(DISMISS_KEY, "1"); } catch(e){}
      });
    });
    return installBar;
  }

  function maybeShowInstall(){
    if(!deferredPrompt){ return; }
    if(wasDismissed()){ return; }
    if(visitCount() < 2){ return; } /* second visit only */
    ensureInstallBar().setAttribute("data-show", "true");
  }

  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    deferredPrompt = e;
    maybeShowInstall();
  });

  window.addEventListener("online", function(){
    document.documentElement.classList.remove("is-offline");
  });
  window.addEventListener("offline", function(){
    document.documentElement.classList.add("is-offline");
  });

  if(!navigator.onLine){
    document.documentElement.classList.add("is-offline");
  }
})();
