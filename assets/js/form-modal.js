/* Reusable pop-up for every form on the site.
   One modal per page, created the first time a form is opened. Each form
   (Booking now, Inquiry later) registers itself once:

     PHModal.register("booking", { mount: function (container, api) { ... } });

   mount() builds the form inside `container` the first time it opens and
   returns an object with:
     open(options)     called every time the form is shown
     onClose()         optional, called when the pop-up closes
     askBeforeClose()  optional, true = confirm before X / background / Esc closes
     save(), discard() optional, run by the confirmation's Save / Discard
   `api` gives the form: close() (no confirmation), setLabel(headingId), scrollTop().

   Opening a form:
     - any link or button with data-open-form="booking" (optional
       data-package="liyue" to preselect a package), or
     - a page address ending in #book / #book=liyue (Booking) or
       #inquire / #inquire=liyue (Inquiry), or
     - PHModal.open("booking", { package: "liyue" }) from code. */
window.PHModal = (function () {
  "use strict";

  // State of the shared pop-up: registered forms, its elements, and what is open.
  var forms = {};        // name -> { def, instance, container }
  var overlay = null;
  var dialog = null;
  var currentName = null;
  var lastFocus = null;
  var inerted = [];
  var pushedHistory = false;
  var closeTimer = null;
  var confirmLayer = null;    // "Save your inputs?" box
  var confirmReturnFocus = null;
  var CLOSE_MS = 180; // matches the fade-out in forms.css
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Adds a form (booking or inquiry) so it can be opened by name.
  function register(name, def) {
    forms[name] = { def: def, instance: null, container: null };
  }

  // Creates the pop-up's overlay and dialog the first time any form opens.
  function build() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "form-modal";
    overlay.hidden = true;
    dialog = document.createElement("div");
    dialog.className = "form-modal-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.tabIndex = -1;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    buildConfirm();

    // Clicking the blurred area around the card asks before closing. (The
    // press has to start there too, so dragging out of an input doesn't.)
    var downOnBackdrop = false;
    overlay.addEventListener("mousedown", function (e) {
      downOnBackdrop = e.target === overlay || e.target === dialog;
    });
    overlay.addEventListener("click", function (e) {
      if (downOnBackdrop && (e.target === overlay || e.target === dialog)) requestClose();
      downOnBackdrop = false;
    });

    // Any element marked data-modal-close (like the X) asks before closing.
    overlay.addEventListener("click", function (e) {
      if (e.target.closest("[data-modal-close]")) {
        e.preventDefault();
        requestClose();
      }
    });

    // Esc closes the pop-up; Tab keeps focus inside it.
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      } else if (e.key === "Tab") {
        trapTab(e);
      }
    });
  }

  /* ---------- Close confirmation: Save / Discard / Cancel ---------- */
  function buildConfirm() {
    confirmLayer = document.createElement("div");
    confirmLayer.className = "form-confirm";
    confirmLayer.hidden = true;
    confirmLayer.innerHTML =
      '<section class="form-card form-confirm-card" role="alertdialog" aria-modal="true"' +
      ' aria-labelledby="form-confirm-title" aria-describedby="form-confirm-text">' +
      '<button type="button" class="form-close" data-confirm-choice="cancel" aria-label="Cancel">&times;</button>' +
      '<h2 id="form-confirm-title">Save your inputs?</h2>' +
      '<p id="form-confirm-text">Your inputs will be lost if you don\u2019t save them.</p>' +
      '<div class="form-actions form-actions-confirm">' +
      '<button type="button" class="pill-btn pill-btn-light" data-confirm-choice="cancel">Cancel</button>' +
      '<button type="button" class="pill-btn pill-btn-cream" data-confirm-choice="discard">Discard</button>' +
      '<button type="button" class="pill-btn pill-btn-gold" data-confirm-choice="save">Save</button>' +
      '</div></section>';
    document.body.appendChild(confirmLayer);

    // Clicking outside the box = Cancel.
    confirmLayer.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-confirm-choice]");
      if (btn) choose(btn.getAttribute("data-confirm-choice"));
      else if (e.target === confirmLayer) choose("cancel");
    });

    confirmLayer.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        choose("cancel");
      } else if (e.key === "Tab") {
        trapTab(e, confirmLayer);
      }
    });
  }

  // X, background click or Esc.
  function requestClose() {
    if (!currentName) return;
    var inst = forms[currentName].instance;
    if (inst && inst.askBeforeClose && inst.askBeforeClose()) showConfirm();
    else close();
  }

  function showConfirm() {
    if (!confirmLayer.hidden) return;
    confirmReturnFocus = document.activeElement;
    dialog.inert = true;
    confirmLayer.hidden = false;
    confirmLayer.querySelector('[data-confirm-choice="save"]').focus();
  }

  function hideConfirm(restoreFocus) {
    if (!confirmLayer || confirmLayer.hidden) return;
    confirmLayer.hidden = true;
    dialog.inert = false;
    if (restoreFocus && confirmReturnFocus && document.contains(confirmReturnFocus)) {
      confirmReturnFocus.focus({ preventScroll: true });
    }
    confirmReturnFocus = null;
  }

  function choose(choice) {
    var entry = currentName ? forms[currentName] : null;
    hideConfirm(choice === "cancel");
    if (!entry || choice === "cancel") return;
    var inst = entry.instance;
    if (choice === "save" && inst.save) inst.save();
    if (choice === "discard" && inst.discard) inst.discard();
    close();
  }

  // Keeps keyboard focus inside the pop-up.
  function trapTab(e, scope) {
    scope = scope || dialog;
    var items = Array.prototype.filter.call(
      scope.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null; }
    );
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === scope)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Everything else on the page is made unreachable while the pop-up is open.
  function setPageInert(on) {
    if (on) {
      inerted = Array.prototype.filter.call(document.body.children, function (el) {
        return el !== overlay && el !== confirmLayer && el.tagName !== "SCRIPT" && !el.inert;
      });
      inerted.forEach(function (el) { el.inert = true; });
    } else {
      inerted.forEach(function (el) { el.inert = false; });
      inerted = [];
    }
  }

  // The controls each form gets: close, label the dialog, scroll back to the top.
  function api(name) {
    return {
      close: close,
      setLabel: function (id) {
        if (currentName === name) dialog.setAttribute("aria-labelledby", id);
      },
      scrollTop: function () { if (overlay) overlay.scrollTop = 0; }
    };
  }

  // Opens a form by name: builds it once, shows it, locks the page behind, and adds a Back-button entry.
  function open(name, options) {
    var entry = forms[name];
    if (!entry) return false;
    build();
    if (currentName && currentName !== name) close(true);

    if (!entry.instance) {
      entry.container = document.createElement("div");
      entry.container.className = "form-modal-content";
      dialog.appendChild(entry.container);
      entry.instance = entry.def.mount(entry.container, api(name));
    }
    Object.keys(forms).forEach(function (key) {
      if (forms[key].container) forms[key].container.hidden = key !== name;
    });

    // Reopened while the closing fade is still running: cancel the fade.
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
      overlay.classList.remove("is-closing");
    }

    if (!currentName) {
      lastFocus = (options && options.returnFocus) || document.activeElement;
      // Keep the page from shifting when its scrollbar disappears.
      var scrollbar = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbar > 0) document.body.style.paddingRight = scrollbar + "px";
      document.documentElement.classList.add("form-modal-open");
      overlay.hidden = false;
      setPageInert(true);
      // The phone/browser Back button closes the pop-up instead of leaving the page.
      history.pushState({ phModal: name }, "");
      pushedHistory = true;
    }
    currentName = name;
    overlay.scrollTop = 0;
    entry.instance.open(options || {});
    return true;
  }

  // Closes the pop-up with a short fade, unlocks the page, and returns keyboard focus.
  function close(fromHistory) {
    if (!currentName) return;
    var entry = forms[currentName];
    hideConfirm(false);
    currentName = null;
    if (entry.instance && entry.instance.onClose) entry.instance.onClose();
    // Short fade-out first, then hide (immediately for reduced motion).
    if (reduceMotion) {
      overlay.hidden = true;
    } else {
      overlay.classList.add("is-closing");
      closeTimer = setTimeout(function () {
        closeTimer = null;
        overlay.classList.remove("is-closing");
        overlay.hidden = true;
      }, CLOSE_MS);
    }
    setPageInert(false);
    document.documentElement.classList.remove("form-modal-open");
    document.body.style.paddingRight = "";
    if (pushedHistory && fromHistory !== true) {
      pushedHistory = false;
      history.back();
    }
    pushedHistory = false;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  // The browser's Back button closes an open pop-up.
  window.addEventListener("popstate", function () {
    if (currentName) {
      pushedHistory = false;
      close(true);
    }
  });

  // data-open-form="booking" on any link or button opens that form.
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-open-form]");
    if (!trigger) return;
    var name = trigger.getAttribute("data-open-form");
    if (!forms[name]) return;
    e.preventDefault();
    // data-return-focus="selector": where keyboard focus goes after closing,
    // for triggers that are hidden by then (like Katheryne's menu buttons).
    var back = trigger.getAttribute("data-return-focus");
    open(name, {
      package: trigger.getAttribute("data-package") || "",
      returnFocus: (back && document.querySelector(back)) || trigger
    });
  });

  // A page address ending in #book / #book=liyue opens the Booking form,
  // and #inquire / #inquire=liyue opens the Inquiry form, on arrival.
  var HASH_FORMS = { book: "booking", inquire: "inquiry" };
  // Opens a form when the address ends in #book or #inquire (optionally =nation).
  function openFromHash() {
    var m = /^#(book|inquire)(?:=([a-z]+))?$/.exec(location.hash);
    if (!m) return;
    history.replaceState(null, "", location.pathname + location.search);
    open(HASH_FORMS[m[1]], { package: m[2] || "" });
  }
  // Run on arrival and whenever the # part of the address changes.
  window.addEventListener("hashchange", openFromHash);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", openFromHash);
  } else {
    setTimeout(openFromHash, 0);
  }

  // Public controls used by the forms and by Katheryne.
  return { register: register, open: open, close: close };
})();
