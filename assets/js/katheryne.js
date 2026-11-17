/* Primordial Haven — Katheryne floating icon (home page + all 7 nations).
   No chatbot: her two buttons open the site's forms in the pop-up
   (assets/js/form-modal.js) on top of the current page.

   Widget states (data-state on .kath):
     idle   -> just the round icon
     bubble -> speech bubble to the left of the icon, ~4s after arrival,
               hidden on its own after 5s. Shown on the first page of a
               visit and again whenever the page is refreshed, but not
               on every move to another page of the site.
   Hovering the icon (or tabbing to it) shows a small tooltip.
     menu   -> "Send an inquiry" + "Book a trip" buttons above the icon */
(function () {
  "use strict";

  var ICON_SRC = "assets/img/katheryne-icon.png";
  var BUBBLE_DELAY_MS = 4000;
  var BUBBLE_SHOW_MS = 5000;
  var GREETED_KEY = "ph-kath-greeted";
  var NATIONS = ["mondstadt", "liyue", "inazuma", "sumeru", "fontaine", "natlan", "snezhnaya"];

  // On a nation page, pass that nation along so the form preselects it.
  var theme = document.body.getAttribute("data-theme") || "";
  var pageNation = NATIONS.indexOf(theme) !== -1 ? theme : "";
  var hero = document.querySelector(".hero");
  var header = document.querySelector(".site-header");

  var widget = document.createElement("div");
  widget.className = "kath";
  widget.setAttribute("data-state", "idle");
  widget.innerHTML =
    '<div class="kath-bubble" role="button" tabindex="0" aria-label="Open Katheryne\'s options">' +
      '<p class="kath-bubble-title">Ready to begin your journey across Teyvat, Traveler?</p>' +
      '<p class="kath-bubble-sub">Click to explore your options</p>' +
      '<button type="button" class="kath-bubble-close" aria-label="Dismiss message">&times;</button>' +
    "</div>" +
    '<nav class="kath-actions" id="kath-actions" aria-label="Katheryne\'s options">' +
      '<a class="kath-action kath-action-inquiry" href="#inquire" data-open-form="inquiry" data-package="' + pageNation + '" data-return-focus=".kath-launcher">Send an inquiry</a>' +
      '<a class="kath-action kath-action-book" href="#book" data-open-form="booking" data-package="' + pageNation + '" data-return-focus=".kath-launcher">Book a trip</a>' +
    "</nav>" +
    '<button type="button" class="kath-launcher" aria-label="Katheryne: show options" aria-expanded="false" aria-controls="kath-actions" aria-describedby="kath-tooltip">' +
      '<img src="' + ICON_SRC + '" alt="" width="88" height="88">' +
    "</button>" +
    '<span class="kath-tooltip" id="kath-tooltip" role="tooltip">Hi, I\'m Katheryne! Need help planning your trip?</span>';

  // Nation pages: anchor to the hero photo (on phones the photo stacks
  // above the title, so this keeps Katheryne off the hero text/buttons).
  var anchor = hero && hero.classList.contains("hero-split")
    ? (hero.querySelector(".hero-media") || hero)
    : hero;

  (anchor || document.body).appendChild(widget);
  if (!anchor) widget.classList.add("is-docked");

  var launcher = widget.querySelector(".kath-launcher");
  var bubble = widget.querySelector(".kath-bubble");
  var bubbleDismissed = false;

  function setState(state) {
    widget.setAttribute("data-state", state);
    launcher.setAttribute("aria-expanded", state === "menu" ? "true" : "false");
  }

  /* Sits at the bottom-right of the hero banner. Once the hero scrolls
     out of view (or is taller than the screen), it docks to the
     bottom-right of the screen so Katheryne stays reachable. */
  function updateDock() {
    if (!anchor) return;
    var r = anchor.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    var size = launcher.offsetHeight || 88;
    var gap = parseFloat(getComputedStyle(widget).bottom) || 24;
    var docked = !(r.bottom <= vh && r.bottom - gap - size >= headerBottom + 12);
    if (docked !== widget.classList.contains("is-docked")) {
      // Docked: lives on <body> as position:fixed. Undocked: lives inside
      // the hero as position:absolute, so it scrolls with the banner.
      var hadFocus = widget.contains(document.activeElement) ? document.activeElement : null;
      (docked ? document.body : anchor).appendChild(widget);
      if (hadFocus) hadFocus.focus({ preventScroll: true });
      widget.classList.toggle("is-docked", docked);
      widget.classList.remove("kath-pop");
      void widget.offsetWidth; // restart the fade-in
      widget.classList.add("kath-pop");
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; updateDock(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateDock();

  // The greeting appears once per visit: sessionStorage remembers it was
  // shown, so moving to another page of the site doesn't show it again.
  function alreadyGreeted() {
    try { return sessionStorage.getItem(GREETED_KEY) === "1"; } catch (e) { return false; }
  }
  function markGreeted() {
    try { sessionStorage.setItem(GREETED_KEY, "1"); } catch (e) { /* storage off */ }
  }

  // A refresh (reload button, F5, pull-to-refresh) counts as a new arrival.
  function isReload() {
    try {
      var nav = performance.getEntriesByType("navigation")[0];
      if (nav) return nav.type === "reload";
      return performance.navigation && performance.navigation.type === 1;
    } catch (e) { return false; }
  }

  if (!alreadyGreeted() || isReload()) {
    setTimeout(function () {
      if (bubbleDismissed || widget.getAttribute("data-state") !== "idle") return;
      markGreeted();
      setState("bubble");
      // Hide it again after a few seconds if the visitor didn't open it.
      setTimeout(function () {
        if (widget.getAttribute("data-state") === "bubble") setState("idle");
      }, BUBBLE_SHOW_MS);
    }, BUBBLE_DELAY_MS);
  }

  launcher.addEventListener("click", function () {
    setState(widget.getAttribute("data-state") === "menu" ? "idle" : "menu");
  });

  bubble.addEventListener("click", function (e) {
    if (e.target.closest(".kath-bubble-close")) {
      bubbleDismissed = true;
      setState("idle");
      return;
    }
    setState("menu");
  });
  bubble.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setState("menu"); }
  });

  // Opening a form closes the two-button menu behind it.
  Array.prototype.forEach.call(widget.querySelectorAll(".kath-action"), function (a) {
    a.addEventListener("click", function () { setState("idle"); });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && widget.getAttribute("data-state") !== "idle") setState("idle");
  });

  // Clicking elsewhere on the page closes the two-button menu.
  document.addEventListener("click", function (e) {
    if (widget.getAttribute("data-state") === "menu" && !widget.contains(e.target)) setState("idle");
  });
})();
