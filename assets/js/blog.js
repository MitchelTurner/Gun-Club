/* KRGC blog index — category filter */
(function(){
  "use strict";
  var grid = document.getElementById("postGrid");
  if(!grid){ return; }
  var buttons = Array.prototype.slice.call(document.querySelectorAll(".blog-filters [data-filter]"));
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".post-card"));

  function apply(filter){
    cards.forEach(function(card){
      var cat = card.getAttribute("data-category") || "";
      var show = filter === "all" || cat === filter;
      card.hidden = !show;
    });
    buttons.forEach(function(btn){
      btn.setAttribute("aria-selected", String(btn.getAttribute("data-filter") === filter));
    });
  }

  buttons.forEach(function(btn){
    btn.addEventListener("click", function(){
      apply(btn.getAttribute("data-filter") || "all");
    });
  });
})();
