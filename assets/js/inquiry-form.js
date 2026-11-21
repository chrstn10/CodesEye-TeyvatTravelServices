/* Travel Inquiry Form, shown in the site-wide pop-up */
(function () {
  "use strict";

  // Shared form helpers, the package list, and this form's settings.
  var F = window.PHForms;
  var PACKAGES = window.PH_PACKAGES;
  var DRAFT_KEY = "ph-inquiry-draft";
  var REDIRECT_SECONDS = 5;
  var OTHERS = "others";

  var TEMPLATE = `
  <!-- Step 1: fill-up form -->
  <section class="form-card" id="inquiry-step-1" aria-labelledby="inquiry-step-1-title">
    <button type="button" class="form-close" data-modal-close aria-label="Close inquiry form">&times;</button>
    <header class="form-head">
      <img class="form-logo" src="assets/img/logo-shadow-transparent.png" alt="Primordial Haven">
      <h2 id="inquiry-step-1-title" tabindex="-1">Travel Inquiry Form</h2>
    </header>

    <form id="inquiry-form-el" class="form-body form-compact" novalidate>

      <fieldset class="field-group">
        <legend class="field-label">Name:<span class="req" aria-hidden="true">*</span></legend>
        <div class="field-row field-row-2 field-row-tight">
          <div class="field">
            <label class="sr-only" for="inquiry-first-name">First Name</label>
            <input class="pill-input" type="text" id="inquiry-first-name" name="firstName" placeholder="First Name"
                   autocomplete="given-name" maxlength="60" required aria-describedby="inquiry-first-name-error">
            <p class="field-error" id="inquiry-first-name-error" hidden></p>
          </div>
          <div class="field">
            <label class="sr-only" for="inquiry-last-name">Last Name</label>
            <input class="pill-input" type="text" id="inquiry-last-name" name="lastName" placeholder="Last Name"
                   autocomplete="family-name" maxlength="60" required aria-describedby="inquiry-last-name-error">
            <p class="field-error" id="inquiry-last-name-error" hidden></p>
          </div>
        </div>
      </fieldset>

      <div class="field">
        <label class="field-label" for="inquiry-email">Email Address:<span class="req" aria-hidden="true">*</span></label>
        <input class="pill-input" type="email" id="inquiry-email" name="email" placeholder="example@email.com"
               autocomplete="email" maxlength="120" required aria-describedby="inquiry-email-error">
        <p class="field-error" id="inquiry-email-error" hidden></p>
      </div>

      <div class="field">
        <label class="field-label" for="inquiry-phone">Phone Number:<span class="req" aria-hidden="true">*</span></label>
        <input class="pill-input" type="tel" id="inquiry-phone" name="phone" placeholder="(+63) 9XX-XXX-XXXX"
               autocomplete="tel" inputmode="tel" maxlength="20" required aria-describedby="inquiry-phone-error">
        <p class="field-error" id="inquiry-phone-error" hidden></p>
      </div>

      <div class="field">
        <label class="field-label" for="inquiry-guests">Number of Guests: <span class="opt">(optional)</span></label>
        <input class="pill-input" type="number" id="inquiry-guests" name="guests" min="1" max="50" step="1"
               inputmode="numeric" aria-describedby="inquiry-guests-error">
        <p class="field-error" id="inquiry-guests-error" hidden></p>
      </div>

      <div class="field">
        <label class="field-label" for="inquiry-destination">Where would you like to travel? <span class="opt">(optional)</span></label>
        <select class="pill-input pill-select" id="inquiry-destination" name="destination" aria-describedby="inquiry-destination-error">
          <option value="" selected>Select a nation</option>
          <!-- The 7 nations come from assets/js/packages.js; "Others" is added last -->
        </select>
        <p class="field-error" id="inquiry-destination-error" hidden></p>
      </div>

      <div class="field">
        <label class="field-label" for="inquiry-budget">What is your budget for this travel? <span class="opt">(optional)</span></label>
        <input class="pill-input" type="text" id="inquiry-budget" name="budget"
               inputmode="decimal" placeholder="Amount in PHP" aria-describedby="inquiry-budget-error">
        <p class="field-error" id="inquiry-budget-error" hidden></p>
      </div>

      <div class="field">
        <label class="field-label" for="inquiry-message">Message / Inquiry:<span class="req" aria-hidden="true">*</span></label>
        <textarea class="pill-input pill-textarea" id="inquiry-message" name="message" rows="4" maxlength="1500" required
                  placeholder="Tell us about your questions, travel preferences, or anything you'd like to know about our packages..."
                  aria-describedby="inquiry-message-error"></textarea>
        <p class="field-error" id="inquiry-message-error" hidden></p>
      </div>

      <p class="field-error form-error" id="inquiry-submit-error" role="alert" hidden></p>

      <div class="form-actions form-actions-center form-actions-compact">
        <button type="submit" class="pill-btn pill-btn-gold" id="inquiry-submit-btn">Submit</button>
      </div>
    </form>
  </section>

  <!-- Step 2: submitted notice (same layout as the Booking Form's last step) -->
  <section class="form-card form-notice" id="inquiry-step-2" aria-labelledby="inquiry-step-2-title" hidden>
    <button type="button" class="form-close" data-modal-close aria-label="Close">&times;</button>
    <h2 id="inquiry-step-2-title" tabindex="-1">Your inquiry has been submitted!</h2>
    <p>Our team will review your request and get back to you as soon as possible.</p>
    <p class="notice-countdown">You will be redirected back to Homepage <span class="countdown-tail">in <span id="inquiry-countdown">5</span>s....</span></p>
    <div class="form-actions form-actions-center">
      <button type="button" class="pill-btn pill-btn-light" id="inquiry-okay-btn">Okay</button>
    </div>
  </section>
`;

  // True if the key is one of the seven nations.
  function isNation(slug) {
    return PACKAGES.some(function (p) { return p.slug === slug; });
  }

  // Builds the form inside the pop-up and wires up its behavior; returns open/onClose for PHModal.
  function mount(container, api) {
    container.innerHTML = TEMPLATE;

    var $ = function (id) { return container.querySelector("#inquiry-" + id); };
    // The two steps and every field, looked up once.
    var steps = { 1: $("step-1"), 2: $("step-2") };
    var form = $("form-el");
    var fields = {
      firstName: $("first-name"),
      lastName: $("last-name"),
      email: $("email"),
      phone: $("phone"),
      guests: $("guests"),
      destination: $("destination"),
      budget: $("budget"),
      message: $("message")
    };
    // Submit button, its error line, and the countdown number on the notice.
    var submitBtn = $("submit-btn");
    var submitError = $("submit-error");
    var countdownEl = $("countdown");

    // Form state.
    var triedSubmit = false; // after the first "Submit", errors update as you type
    var currentStep = 1;
    var stopCountdown = function () {};

    /* ---------- Destination dropdown: 7 nations + "Others" ---------- */

    PACKAGES.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.slug;
      opt.textContent = p.name;
      fields.destination.appendChild(opt);
    });
    var others = document.createElement("option");
    others.value = OTHERS;
    others.textContent = "Others";
    fields.destination.appendChild(others);

    F.setupPhoneField(fields.phone);

    /* ---------- Reading and checking the form ---------- */

    function readForm() {
      var d = {};
      Object.keys(fields).forEach(function (key) { d[key] = fields[key].value.trim(); });
      return d;
    }

    // Puts saved values back into the fields (when a draft is reopened).
    function fillForm(data) {
      Object.keys(fields).forEach(function (key) {
        if (data[key] !== undefined && data[key] !== null) fields[key].value = data[key];
      });
      F.fixPhone(fields.phone);
    }

    // Name, email, phone and message are required. Guests, destination and
    // budget are optional, but must make sense when they are filled in.
    function validate(d) {
      var errors = {};
      if (!d.firstName) errors.firstName = "Please enter your first name.";
      if (!d.lastName) errors.lastName = "Please enter your last name.";
      var emailMsg = F.emailError(d.email, true);
      if (emailMsg) errors.email = emailMsg;
      var phoneMsg = F.phoneError(d.phone, true);
      if (phoneMsg) errors.phone = phoneMsg;

      if (d.guests) {
        var guests = Number(d.guests);
        if (!Number.isInteger(guests) || guests < 1) errors.guests = "Number of guests must be a whole number, at least 1.";
        else if (guests > 50) errors.guests = "For groups over 50, please mention the size in your message and enter 50 here.";
      }

      if (d.destination && !isNation(d.destination) && d.destination !== OTHERS) {
        errors.destination = "Please choose one of the listed nations, or \"Others\".";
      }

      if (d.budget) {
        var budget = Number(d.budget.replace(/,/g, ""));
        if (!isFinite(budget) || budget <= 0) errors.budget = "Your budget must be a positive amount in PHP.";
      }

      if (!d.message) errors.message = "Please tell us your question or request.";

      return errors;
    }

    // Saves what's typed so nothing is lost on close or reload.
    function saveDraft() {
      F.save(DRAFT_KEY, { data: readForm() });
    }

    /* ---------- Steps ---------- */

    function showStep(n) {
      currentStep = n;
      Object.keys(steps).forEach(function (k) { steps[k].hidden = Number(k) !== n; });
      var heading = steps[n].querySelector("h2");
      api.setLabel(heading.id);
      api.scrollTop();
      heading.focus({ preventScroll: true });
    }

    // Save as they type; after the first Submit, keep the error messages current.
    ["input", "change"].forEach(function (type) {
      form.addEventListener(type, function () {
        saveDraft();
        if (triedSubmit) F.showErrors(fields, validate(readForm()));
      });
    });

    // Check a field as soon as the visitor leaves it (only if they typed something).
    Object.keys(fields).forEach(function (key) {
      fields[key].addEventListener("blur", function () {
        var v = fields[key].value.trim();
        if ((!v || v === "(+63) 9") && !triedSubmit) return;
        var errors = validate(readForm());
        if (errors[key]) F.setError(fields[key], errors[key]);
        else F.clearError(fields[key]);
      });
    });

    /* ---------- Submitting ----------
       There's no backend yet, so this only pretends to send the inquiry.
       To save inquiries for real later, replace the body of sendInquiry()
       with a request to your server, for example:

         return fetch("/api/inquiries", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(inquiry)
         }).then(function (res) {
           if (!res.ok) throw new Error("Server responded " + res.status);
         });

       The server would then check the data again and insert it into your
       database (for example an "inquiries" table with these columns). */
    function sendInquiry(inquiry) {
      return new Promise(function (resolve) { setTimeout(resolve, 400); });
    }

    // Everything the visitor entered, in one object ready to send.
    function buildInquiry(d) {
      return {
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: F.formatPhone(d.phone),
        guests: d.guests ? Number(d.guests) : null,     // optional
        destination: d.destination || null,             // nation slug, "others", or null
        budget: d.budget ? Number(d.budget.replace(/,/g, "")) : null, // PHP, optional
        message: d.message,
        page: location.pathname.split("/").pop() || "index.html",
        submittedAt: new Date().toISOString()
      };
    }

    // Submit: check the fields, then send the inquiry and show the notice (or an error).
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      triedSubmit = true;
      var d = readForm();
      var errors = validate(d);
      F.showErrors(fields, errors);
      var firstBad = F.firstInvalid(fields, errors);
      if (firstBad) {
        firstBad.focus();
        return;
      }

      var inquiry = buildInquiry(d);
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
      submitError.hidden = true;

      sendInquiry(inquiry).then(function () {
        F.remove(DRAFT_KEY);
        triedSubmit = false;
        form.reset();
        F.showErrors(fields, {});
        showStep(2);
        startCountdown();
      }).catch(function () {
        submitError.textContent = "Sorry, we couldn't send your inquiry. Please try again, or contact us through the details in the footer.";
        submitError.hidden = false;
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      });
    });

    /* ---------- Step 2: countdown back to the homepage (shared, form-utils.js) ---------- */

    function goHome() {
      stopCountdown();
      F.goHome(api);
    }

    // Starts the 5-second countdown on the submitted notice.
    function startCountdown() {
      stopCountdown();
      stopCountdown = F.startCountdown(countdownEl, REDIRECT_SECONDS, goHome);
    }

    $("okay-btn").addEventListener("click", goHome);

    /* ---------- What the pop-up calls ---------- */

    return {
      // options.package: preselect this nation (from data-package or #inquire=liyue).
      open: function (options) {
        stopCountdown();
        var saved = F.load(DRAFT_KEY);
        if (saved && saved.data) fillForm(saved.data);

        var theme = document.body.getAttribute("data-theme") || "";
        var preselect = isNation(options.package || "") ? options.package : (isNation(theme) ? theme : "");
        if (preselect) fields.destination.value = preselect;

        submitError.hidden = true;
        showStep(1);
      },
      // Called when the pop-up closes: stops the countdown.
      onClose: function () {
        // Closing on the submitted notice just stops the countdown and
        // leaves the visitor on the page they were on.
        stopCountdown();
        currentStep = 1;
      },
      // Close confirmation (form-modal.js); skipped on the submitted notice.
      askBeforeClose: function () {
        return currentStep !== 2;
      },
      save: function () {
        saveDraft();
      },
      discard: function () {
        F.remove(DRAFT_KEY);
        triedSubmit = false;
        form.reset();
        F.showErrors(fields, {});
        submitError.hidden = true;
      }
    };
  }

  window.PHModal.register("inquiry", { mount: mount });
})();
