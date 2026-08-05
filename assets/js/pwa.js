/* =============================================================
   KRGC — PWA install prompt + service worker registration
   ============================================================= */
(function(){
  "use strict";

  var $ = function(s){ return document.querySelector(s); };

  if("serviceWorker" in navigator){
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("/sw.js").catch(function(){});
    });
  }

  var deferredPrompt = null;
  var installBar = null;

  function ensureInstallBar(){
    if(installBar){ return installBar; }
    installBar = document.createElement("div");
    installBar.className = "installbar";
    installBar.id = "installBar";
    installBar.setAttribute("data-show", "false");
    installBar.innerHTML = '<div class="txt"><b>Add to home screen</b><span>Range rules and tools work offline.</span></div>' +
      '<div class="actions">' +
      '<button type="button" class="btn btn-primary btn-sm" id="installBtn">Install</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="installDismiss" aria-label="Dismiss">Not now</button>' +
      '</div>';
    document.body.appendChild(installBar);
    $("#installDismiss").addEventListener("click", function(){
      installBar.setAttribute("data-show", "false");
      try{ sessionStorage.setItem("krgc-install-dismissed", "1"); } catch(e){}
    });
    $("#installBtn").addEventListener("click", function(){
      if(!deferredPrompt){ return; }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function(){
        deferredPrompt = null;
        installBar.setAttribute("data-show", "false");
      });
    });
    return installBar;
  }

  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    deferredPrompt = e;
    try{
      if(sessionStorage.getItem("krgc-install-dismissed")){ return; }
    } catch(err){}
    ensureInstallBar().setAttribute("data-show", "true");
  });

  window.addEventListener("online", function(){
    document.documentElement.classList.remove("is-offline");
  });
  window.addEventListener("offline", function(){
    document.documentElement.classList.add("is-offline");
    if(location.pathname !== "/offline.html" && !location.pathname.endsWith("/offline.html")){
      /* Let the service worker serve cached pages; only redirect bare navigations */
    }
  });

  if(!navigator.onLine){
    document.documentElement.classList.add("is-offline");
  }
})();
