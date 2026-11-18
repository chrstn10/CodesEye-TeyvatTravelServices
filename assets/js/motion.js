/* Light page motion, on every page.
     1. Page transitions: the page fades in on arrival (CSS, style.css
        section 14) and fades out briefly before going to another page
        of the site.
     2. Scroll reveal: section headings, cards and blocks fade and rise
        gently into place the first time they scroll into view. */
(function () {
  "use strict";

  /* ---------- 0. Arriving on a #section link (e.g. index.html#contact) ----------
     Jump to that section once the page has laid out, so links from other
     pages (like the footer's Address and Office Hours) land in the right place.
     #book and #inquire are left to form-modal.js, which opens those forms. */
  window.addEventListener("load", function () {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id || /^(book|inquire)/.test(id)) return;
    var target = document.getElementById(id);
    if (!target) return;
    setTimeout(function () {
      target.scrollIntoView({ behavior: "instant", block: "start" });
    }, 60);
  });

  // Visitors who prefer less motion get no animations (the rest of this file is skipped).
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  // Page-transition settings.
  var root = document.documentElement;
  var LEAVE_MS = 200;

  /* ---------- 1. Fade out before leaving for another page ---------- */

  function isPageLink(a, e) {
    if (!a || e.defaultPrevented || e.button !== 0) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target && a.target !== "_self") return false;
    if (a.hasAttribute("download") || a.hasAttribute("data-open-form")) return false;
    if (a.protocol !== location.protocol || a.host !== location.host) return false;
    // Same page with only a different #section: let the browser scroll.
    return a.pathname !== location.pathname;
  }

  // Links to other pages of the site fade the page out first.
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!isPageLink(a, e)) return;
    e.preventDefault();
    root.classList.add("page-leaving");
    setTimeout(function () { location.href = a.href; }, LEAVE_MS);
  });

  // Coming back with the Back button can restore the faded-out page.
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) root.classList.remove("page-leaving");
  });

  /* ---------- 2. Reveal blocks as they scroll into view ---------- */

  if (!("IntersectionObserver" in window)) return;

  // Blocks that fade and rise into view.
  var TARGETS = [
    "section.block .section-head",
    ".lede-center", ".story-body", ".profile-wrap",
    ".package-filter", ".nations-carousel",
    ".grid > *", ".faq-item", ".faq-chibi",
    ".contact-lede", ".contact-item",
    ".stop-banner", ".price-panel", ".itinerary > li",
    "section.block > .container[style] > *",
    ".page-nav"
  ].join(",");

  // Everything to reveal, except what's inside the hero or the form pop-up.
  var items = Array.prototype.filter.call(document.querySelectorAll(TARGETS), function (el) {
    return !el.closest(".hero") && !el.closest(".form-modal");
  });

  // Items that share a parent appear one after another (max 5 steps).
  items.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentNode.children, function (s) {
      return items.indexOf(s) !== -1;
    });
    var step = Math.min(siblings.indexOf(el), 5);
    if (step > 0) el.style.transitionDelay = (step * 70) + "ms";
    el.classList.add("reveal");
  });

  // Cleans up once an element has finished appearing.
  function finish(el) {
    // Hand the element back to its own hover transitions once it's in place.
    el.classList.remove("reveal", "is-visible");
    el.style.transitionDelay = "";
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      observer.unobserve(el);
      el.classList.add("is-visible");
      var delay = parseFloat(el.style.transitionDelay) || 0;
      setTimeout(function () { finish(el); }, 700 + delay);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  // Start watching every block.
  items.forEach(function (el) { observer.observe(el); });
})();
