/* Helpers shared by the Booking and Inquiry forms */
window.PHForms = (function () {
  "use strict";

  /* ---------- Formatting ---------- */

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // Date object -> "MM/DD/YYYY"
  function formatDate(d) {
    return pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + "/" + d.getFullYear();
  }

  // "MM/DD/YYYY" -> Date at local midnight, or null if it isn't a real date.
  function parseDate(text) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(text).trim());
    if (!m) return null;
    var month = +m[1], day = +m[2], year = +m[3];
    var d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
    return d;
  }

  // Today's date at midnight (used to block past check-in dates).
  function today() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Formats a number as PHP currency, e.g. PHP 60,000.
  function formatPHP(amount) {
    return "PHP " + amount.toLocaleString("en-PH");
  }

  /* ---------- Validation ---------- */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // True if the text looks like name@domain.tld.
  function isEmail(value) {
    return EMAIL_RE.test(String(value).trim());
  }

  // Philippine mobile: 09XXXXXXXXX, +639XXXXXXXXX or 639XXXXXXXXX.
  // Spaces, dashes, dots and brackets are allowed, e.g. (+63)912-345-6789.
  function phoneDigits(value) {
    return String(value).replace(/[\s\-().]/g, "");
  }

  // True for a valid Philippine mobile number.
  function isPHMobile(value) {
    return /^(?:\+?63|0)9\d{9}$/.test(phoneDigits(value));
  }

  // Shows a valid number the same way every time: 0912 345 6789 / +63 912 345 6789
  function formatPhone(value) {
    var d = phoneDigits(value);
    var local = d.replace(/^\+?63/, "").replace(/^0/, ""); // 9XXXXXXXXX
    var spaced = local.slice(0, 3) + " " + local.slice(3, 6) + " " + local.slice(6);
    return /^0/.test(d) ? "0" + spaced : "+63 " + spaced;
  }

  // Shared messages so both forms word problems the same way.
  // Pass required=false for optional fields: empty is fine, bad format isn't.
  function emailError(value, required) {
    if (!value) return required ? "Please enter your email address." : "";
    return isEmail(value) ? "" : "Please enter a valid email address, like example@email.com.";
  }

  // Same as emailError, for the phone field.
  function phoneError(value, required) {
    if (!value) return required ? "Please enter your phone number." : "";
    return isPHMobile(value) ? "" : "Please enter a valid Philippine mobile number, like 0912 345 6789 or +63 912 345 6789.";
  }

  /* ---------- Inline errors ---------- */

  function errorEl(input) {
    return document.getElementById(input.id + "-error");
  }

  // Shows a message under a field and marks it invalid for screen readers.
  function setError(input, message) {
    var el = errorEl(input);
    input.setAttribute("aria-invalid", "true");
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
  }

  // Hides a field's message and clears its invalid mark.
  function clearError(input) {
    var el = errorEl(input);
    input.removeAttribute("aria-invalid");
    if (el) {
      el.textContent = "";
      el.hidden = true;
    }
  }

  // fields: { key: inputElement }, errors: { key: "message" }
  function showErrors(fields, errors) {
    Object.keys(fields).forEach(function (key) {
      if (errors[key]) setError(fields[key], errors[key]);
      else clearError(fields[key]);
    });
  }

  // The first field (in form order) that has a problem, or null.
  function firstInvalid(fields, errors) {
    var keys = Object.keys(fields).filter(function (k) { return errors[k]; });
    return keys.length ? fields[keys[0]] : null;
  }

  /* ---------- "Submitted" step: countdown and back to the homepage ---------- */

  var HOME_URL = "index.html";

  // Already on the homepage: close the pop-up and go to the top.
  // Anywhere else: go to the homepage.
  function goHome(modalApi) {
    if (document.body.classList.contains("home-page")) {
      if (modalApi) modalApi.close();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      location.href = HOME_URL;
    }
  }

  // Counts down in `el` once a second, then calls onDone.
  // Returns a function that stops the countdown early.
  function startCountdown(el, seconds, onDone) {
    var left = seconds;
    el.textContent = left;
    var timer = setInterval(function () {
      left -= 1;
      el.textContent = Math.max(left, 0);
      if (left <= 0) {
        clearInterval(timer);
        onDone();
      }
    }, 1000);
    return function stop() { clearInterval(timer); };
  }

  /* ---------- MM/DD/YYYY date fields ----------
     Markup (one per date):
       <div class="date-wrap">
         <input type="text" class="pill-input" id="check-in" placeholder="MM/DD/YYYY">
         <button type="button" class="date-btn" aria-label="...">...</button>
         <input type="date" class="date-native" tabindex="-1" aria-hidden="true">
       </div>
     Typing auto-inserts the slashes; the calendar button opens the
     browser's own date picker and writes the result back as MM/DD/YYYY. */
  function setupDateField(wrap, onChange) {
    var text = wrap.querySelector('input[type="text"]');
    var native = wrap.querySelector(".date-native");
    var btn = wrap.querySelector(".date-btn");
    var t = today();
    native.min = t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());

    // Typing digits adds the slashes automatically (MM/DD/YYYY).
    text.addEventListener("input", function (e) {
      if (e.inputType && e.inputType.indexOf("delete") === 0) return;
      var digits = text.value.replace(/\D/g, "").slice(0, 8);
      var out = digits.slice(0, 2);
      if (digits.length > 2) out += "/" + digits.slice(2, 4);
      if (digits.length > 4) out += "/" + digits.slice(4);
      if (digits.length === 2 || digits.length === 4) out += "/";
      text.value = out;
    });

    // The calendar button opens the browser's date picker.
    btn.addEventListener("click", function () {
      var current = parseDate(text.value);
      if (current) native.value = current.getFullYear() + "-" + pad(current.getMonth() + 1) + "-" + pad(current.getDate());
      if (typeof native.showPicker === "function") {
        try { native.showPicker(); return; } catch (err) { /* fall through */ }
      }
      text.focus();
    });

    // A date picked from the calendar is written back as MM/DD/YYYY.
    native.addEventListener("change", function () {
      if (!native.value) return;
      var p = native.value.split("-");
      text.value = p[1] + "/" + p[2] + "/" + p[0];
      text.dispatchEvent(new Event("input", { bubbles: true }));
      if (onChange) onChange(text);
      text.focus();
    });
  }

  /* ---------- Saving a form between steps ---------- */

  // Reads a saved draft, or null if there is none.
  function load(key) {
    try { return JSON.parse(sessionStorage.getItem(key)) || null; } catch (e) { return null; }
  }

  // Saves a draft; quietly does nothing if the browser blocks storage.
  function save(key, data) {
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* storage off: JS variables still work */ }
  }

  // Deletes a draft after a successful submission.
  function remove(key) {
    try { sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  // Everything the forms can use from this file.
  return {
    formatDate: formatDate,
    parseDate: parseDate,
    today: today,
    formatPHP: formatPHP,
    isEmail: isEmail,
    isPHMobile: isPHMobile,
    formatPhone: formatPhone,
    emailError: emailError,
    phoneError: phoneError,
    setError: setError,
    clearError: clearError,
    showErrors: showErrors,
    firstInvalid: firstInvalid,
    goHome: goHome,
    startCountdown: startCountdown,
    setupDateField: setupDateField,
    load: load,
    save: save,
    remove: remove
  };
})();
