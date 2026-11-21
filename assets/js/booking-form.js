/* Primordial Haven — Booking Form, shown in the site-wide pop-up.
   Registered with PHModal (assets/js/form-modal.js), so it opens on top of
   whatever page the visitor is on. Three steps inside one pop-up:
     1. fill-up form -> 2. read-only confirmation -> 3. submitted notice
   Entered values are kept in sessionStorage, so going Back or reloading
   the page never wipes what the visitor typed. */
(function () {
  "use strict";

  var F = window.PHForms;
  var PACKAGES = window.PH_PACKAGES;
  var DRAFT_KEY = "ph-booking-draft";
  var REDIRECT_SECONDS = 5;

  // The form's markup, built once per page the first time it opens.
  var TEMPLATE = `
  <!-- Step 1: fill-up form -->
  <section class="form-card" id="booking-step-1" aria-labelledby="booking-step-1-title">
    <button type="button" class="form-close" data-modal-close aria-label="Close booking form">&times;</button>
    <header class="form-head">
      <img class="form-logo" src="assets/img/logo-shadow-transparent.png" alt="Primordial Haven">
      <h2 id="booking-step-1-title" tabindex="-1">Booking Form</h2>
    </header>

    <form id="booking-form-el" class="form-body" novalidate>

      <fieldset class="field-group">
        <legend class="field-label">Name:<span class="req" aria-hidden="true">*</span></legend>
        <div class="field-row field-row-2">
          <div class="field">
            <label class="sr-only" for="booking-first-name">First Name</label>
            <input class="pill-input" type="text" id="booking-first-name" name="firstName" placeholder="First Name"
                   autocomplete="given-name" maxlength="60" required aria-describedby="booking-first-name-error">
            <p class="field-error" id="booking-first-name-error" hidden></p>
          </div>
          <div class="field">
            <label class="sr-only" for="booking-last-name">Last Name</label>
            <input class="pill-input" type="text" id="booking-last-name" name="lastName" placeholder="Last Name"
                   autocomplete="family-name" maxlength="60" required aria-describedby="booking-last-name-error">
            <p class="field-error" id="booking-last-name-error" hidden></p>
          </div>
        </div>
      </fieldset>

      <div class="field">
        <label class="field-label" for="booking-email">Email Address:<span class="req" aria-hidden="true">*</span></label>
        <input class="pill-input" type="email" id="booking-email" name="email" placeholder="example@email.com"
               autocomplete="email" maxlength="120" required aria-describedby="booking-email-error">
        <p class="field-error" id="booking-email-error" hidden></p>
      </div>

      <div class="field">
        <label class="field-label" for="booking-phone">Phone Number:<span class="req" aria-hidden="true">*</span></label>
        <input class="pill-input" type="tel" id="booking-phone" name="phone" placeholder="(+63)9XX-XXX-XXXX"
               autocomplete="tel" inputmode="tel" maxlength="20" required aria-describedby="booking-phone-error">
        <p class="field-error" id="booking-phone-error" hidden></p>
      </div>

      <div class="field-row field-row-2 field-row-dates">
        <div class="field">
          <label class="field-label" for="booking-check-in">Check in Date:<span class="req" aria-hidden="true">*</span></label>
          <div class="date-wrap">
            <input class="pill-input" type="text" id="booking-check-in" name="checkIn" placeholder="MM/DD/YYYY"
                   inputmode="numeric" maxlength="10" required aria-describedby="booking-check-in-error">
            <button type="button" class="date-btn date-clear" aria-label="Clear check-in date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>
            </button>
            <button type="button" class="date-btn" aria-label="Choose check-in date from a calendar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>
            </button>
            <input class="date-native" type="date" tabindex="-1" aria-hidden="true">
          </div>
          <p class="field-error" id="booking-check-in-error" hidden></p>
        </div>
        <div class="field">
          <label class="field-label" for="booking-check-out">Check out Date:<span class="req" aria-hidden="true">*</span></label>
          <!-- Read-only: auto-filled from check-in + package -->
          <div class="date-wrap date-wrap-auto">
            <input class="pill-input" type="text" id="booking-check-out" name="checkOut" placeholder="MM/DD/YYYY"
                   maxlength="10" readonly required autocomplete="off"
                   title="Filled in automatically from your check-in date and package"
                   aria-describedby="booking-check-out-hint booking-check-out-error">
            <button type="button" class="date-btn date-clear" aria-label="Clear check-out date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>
            </button>
          </div>
          <span class="sr-only" id="booking-check-out-hint">Filled in automatically from your check-in date and package.</span>
          <p class="field-error" id="booking-check-out-error" hidden></p>
        </div>
      </div>

      <h2 class="form-subhead">Select Your Package</h2>

      <div class="field-row field-row-package">
        <div class="field field-guests">
          <label class="field-label" for="booking-guests">Number of Guests:<span class="req" aria-hidden="true">*</span></label>
          <input class="pill-input" type="number" id="booking-guests" name="guests" min="1" max="50" step="1" value="1"
                 inputmode="numeric" required aria-describedby="booking-guests-error">
          <p class="field-error" id="booking-guests-error" hidden></p>
        </div>
        <div class="field field-package">
          <label class="field-label" for="booking-package-select">Package:<span class="req" aria-hidden="true">*</span></label>
          <select class="pill-input pill-select" id="booking-package-select" name="package" required aria-describedby="booking-package-select-error">
            <option value="" disabled selected>Select a package</option>
            <!-- Options are filled in from assets/js/packages.js -->
          </select>
          <p class="field-error" id="booking-package-select-error" hidden></p>
        </div>
      </div>

      <div class="form-actions form-actions-center">
        <button type="submit" class="pill-btn pill-btn-gold">Next</button>
      </div>
    </form>
  </section>

  <!-- Step 2: confirmation (read-only) -->
  <section class="form-card" id="booking-step-2" aria-labelledby="booking-step-2-title" hidden>
    <button type="button" class="form-close" data-modal-close aria-label="Close booking form">&times;</button>
    <header class="form-head">
      <img class="form-logo" src="assets/img/logo-shadow-transparent.png" alt="Primordial Haven">
      <h2 id="booking-step-2-title" tabindex="-1">Booking Form</h2>
    </header>

    <div class="form-body">
      <p class="confirm-intro">Please review your booking summary before submitting.</p>

      <!-- Receipt-style summary: bold labels on the left, values on the right -->
      <div class="receipt">
        <h3 class="receipt-title">Traveler Details</h3>
        <dl class="receipt-rows">
          <div class="receipt-row"><dt>Name</dt><dd data-confirm="name"></dd></div>
          <div class="receipt-row"><dt>Email Address</dt><dd data-confirm="email"></dd></div>
          <div class="receipt-row"><dt>Phone Number</dt><dd data-confirm="phone"></dd></div>
        </dl>

        <h3 class="receipt-title">Trip Details</h3>
        <dl class="receipt-rows">
          <div class="receipt-row"><dt>Package</dt><dd data-confirm="package"></dd></div>
          <div class="receipt-row"><dt>Duration</dt><dd data-confirm="duration"></dd></div>
          <div class="receipt-row"><dt>Check in Date</dt><dd data-confirm="checkIn"></dd></div>
          <div class="receipt-row"><dt>Check out Date</dt><dd data-confirm="checkOut"></dd></div>
          <div class="receipt-row"><dt>Number of Guests</dt><dd data-confirm="guests"></dd></div>
        </dl>

        <h3 class="receipt-title">Price Summary</h3>
        <dl class="receipt-rows">
          <div class="receipt-row"><dt>Price per Person</dt><dd data-confirm="price"></dd></div>
          <div class="receipt-row"><dt>Guests</dt><dd data-confirm="guestsTimes"></dd></div>
          <div class="receipt-row receipt-total"><dt>Total Price</dt><dd data-confirm="total"></dd></div>
        </dl>
      </div>

      <p class="field-error form-error" id="booking-submit-error" role="alert" hidden></p>

      <div class="form-actions form-actions-split">
        <button type="button" class="pill-btn pill-btn-cream" id="booking-back-btn">Back</button>
        <button type="button" class="pill-btn pill-btn-gold" id="booking-submit-btn">Submit Booking</button>
      </div>
    </div>
  </section>

  <!-- Step 3: submission notice -->
  <section class="form-card form-notice" id="booking-step-3" aria-labelledby="booking-step-3-title" hidden>
    <button type="button" class="form-close" data-modal-close aria-label="Close booking form">&times;</button>
    <h2 id="booking-step-3-title" tabindex="-1">Your booking has been submitted!</h2>
    <p>Thank you for trusting us! Our team will review your travel details and contact you as soon as
    possible for the next steps.</p>
    <p class="notice-countdown">You will be redirected back to Homepage <span class="countdown-tail">in <span id="booking-countdown">5</span>s....</span></p>
    <div class="form-actions form-actions-center">
      <button type="button" class="pill-btn pill-btn-light" id="booking-okay-btn">Okay</button>
    </div>
  </section>
`;

  function pkgBySlug(slug) {
    for (var i = 0; i < PACKAGES.length; i++) if (PACKAGES[i].slug === slug) return PACKAGES[i];
    return null;
  }

  // Package nights: `nights` if set, else read from duration ("4 Nights" / "5 Days").
  function nightsFor(p) {
    if (typeof p.nights === "number" && p.nights > 0) return p.nights;
    var text = String(p.duration || "");
    var m = /(\d+)\s*nights?/i.exec(text);
    if (m && +m[1] > 0) return +m[1];
    m = /(\d+)\s*days?/i.exec(text);
    if (m && +m[1] > 1) return +m[1] - 1;
    return 1;
  }

  function mount(container, api) {
    container.innerHTML = TEMPLATE;

    var $ = function (id) { return container.querySelector("#booking-" + id); };
    var steps = { 1: $("step-1"), 2: $("step-2"), 3: $("step-3") };
    var form = $("form-el");
    var fields = {
      firstName: $("first-name"),
      lastName: $("last-name"),
      email: $("email"),
      phone: $("phone"),
      checkIn: $("check-in"),
      checkOut: $("check-out"),
      guests: $("guests"),
      package: $("package-select")
    };
    var submitBtn = $("submit-btn");
    var submitError = $("submit-error");
    var countdownEl = $("countdown");

    var booking = null;    // the checked booking, kept between steps
    var triedNext = false; // after the first "Next", errors update as you type
    var currentStep = 1;

    /* ---------- Package dropdown ---------- */

    PACKAGES.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.slug;
      opt.textContent = p.label;
      fields.package.appendChild(opt);
    });

    /* ---------- Reading and checking the form ---------- */

    function readForm() {
      return {
        firstName: fields.firstName.value.trim(),
        lastName: fields.lastName.value.trim(),
        email: fields.email.value.trim(),
        phone: fields.phone.value.trim(),
        checkIn: fields.checkIn.value.trim(),
        checkOut: fields.checkOut.value.trim(),
        guests: fields.guests.value.trim(),
        package: fields.package.value
      };
    }

    function fillForm(data) {
      Object.keys(fields).forEach(function (key) {
        if (data[key] !== undefined && data[key] !== null) fields[key].value = data[key];
      });
    }

    // Returns { fieldKey: "message" } for every problem found.
    function validate(d) {
      var errors = {};
      if (!d.firstName) errors.firstName = "Please enter your first name.";
      if (!d.lastName) errors.lastName = "Please enter your last name.";

      var emailMsg = F.emailError(d.email, true);
      if (emailMsg) errors.email = emailMsg;
      var phoneMsg = F.phoneError(d.phone, true);
      if (phoneMsg) errors.phone = phoneMsg;

      var inDate = F.parseDate(d.checkIn);
      var outDate = F.parseDate(d.checkOut);
      if (!d.checkIn) errors.checkIn = "Please enter your check-in date.";
      else if (!inDate) errors.checkIn = "Please use the format MM/DD/YYYY with a real date.";
      else if (inDate < F.today()) errors.checkIn = "Check-in can't be in the past.";

      // Check-out is auto-filled, so only flag it once check-in is valid.
      if (!d.checkOut) {
        if (inDate && !pkgBySlug(d.package)) errors.checkOut = "Fills in once you choose a package.";
        else if (inDate) errors.checkOut = "Choose your check-in date again to fill this in.";
      }
      else if (!outDate) errors.checkOut = "Please use the format MM/DD/YYYY with a real date.";
      else if (inDate && outDate <= inDate) errors.checkOut = "Check-out must be after your check-in date.";

      var n = Number(d.guests);
      if (!d.guests) errors.guests = "Please enter the number of guests.";
      else if (!Number.isInteger(n) || n < 1) errors.guests = "Number of guests must be a whole number, at least 1.";
      else if (n > 50) errors.guests = "For groups over 50, please send us an inquiry instead.";

      if (!d.package || !pkgBySlug(d.package)) errors.package = "Please choose a package.";
      return errors;
    }

    function showErrors(errors) {
      F.showErrors(fields, errors);
    }

    // Check-out = check-in + package nights; empty if either is missing.
    function updateCheckOut() {
      var inDate = F.parseDate(fields.checkIn.value);
      var p = pkgBySlug(fields.package.value);
      var next = "";
      if (inDate && p) {
        next = F.formatDate(new Date(inDate.getFullYear(), inDate.getMonth(), inDate.getDate() + nightsFor(p)));
      }
      if (fields.checkOut.value !== next) {
        fields.checkOut.value = next;
        if (!triedNext) F.clearError(fields.checkOut);
      }
    }

    function saveDraft(step) {
      F.save(DRAFT_KEY, { data: readForm(), step: step });
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

    function renderConfirmation(d) {
      var p = pkgBySlug(d.package);
      var guests = Number(d.guests);
      var values = {
        name: d.firstName + " " + d.lastName,
        email: d.email,
        phone: F.formatPhone(d.phone),
        checkIn: d.checkIn,
        checkOut: d.checkOut,
        guests: String(guests),
        package: p.label,
        duration: p.duration,
        price: F.formatPHP(p.price),
        guestsTimes: "× " + guests,
        total: F.formatPHP(p.price * guests)
      };
      Object.keys(values).forEach(function (key) {
        // textContent: whatever was typed is shown as plain text, never as HTML
        steps[2].querySelector('[data-confirm="' + key + '"]').textContent = values[key];
      });
    }

    function goToConfirm() {
      var d = readForm();
      if (Object.keys(validate(d)).length) return false;
      booking = d;
      saveDraft(2);
      renderConfirmation(d);
      submitError.hidden = true;
      showStep(2);
      return true;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      triedNext = true;
      var errors = validate(readForm());
      showErrors(errors);
      var firstBad = F.firstInvalid(fields, errors);
      if (firstBad) {
        firstBad.focus();
        return;
      }
      goToConfirm();
    });

    // Save as they type; once they've pressed Next, keep the errors current.
    ["input", "change"].forEach(function (type) {
      form.addEventListener(type, function (e) {
        if (e.target === fields.checkIn || e.target === fields.package) updateCheckOut();
        saveDraft(1);
        if (triedNext) showErrors(validate(readForm()));
      });
    });

    // Check a field as soon as the visitor leaves it (only if they typed something).
    Object.keys(fields).forEach(function (key) {
      fields[key].addEventListener("blur", function () {
        if (!fields[key].value.trim() && !triedNext) return;
        var errors = validate(readForm());
        if (errors[key]) F.setError(fields[key], errors[key]);
        else F.clearError(fields[key]);
      });
    });

    Array.prototype.forEach.call(container.querySelectorAll(".date-wrap"), function (wrap) {
      F.setupDateField(wrap, function (input) { input.dispatchEvent(new Event("blur")); });
    });

    $("back-btn").addEventListener("click", function () {
      saveDraft(1);
      showStep(1);
    });

    /* ---------- Submitting ----------
       There's no backend yet, so this only pretends to send the booking.
       To save bookings for real later, replace the body of sendBooking()
       with a request to your server, for example:

         return fetch("/api/bookings", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload)
         }).then(function (res) {
           if (!res.ok) throw new Error("Server responded " + res.status);
         });

       The server would then validate the data again and insert it into
       your database (for example a "bookings" table with these columns). */
    function sendBooking(payload) {
      return new Promise(function (resolve) { setTimeout(resolve, 400); });
    }

    submitBtn.addEventListener("click", function () {
      if (!booking) return;
      var p = pkgBySlug(booking.package);
      var guests = Number(booking.guests);
      var payload = {
        firstName: booking.firstName,
        lastName: booking.lastName,
        email: booking.email,
        phone: F.formatPhone(booking.phone),
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: guests,
        package: p.slug,
        pricePerPerson: p.price,
        totalPrice: p.price * guests,
        submittedAt: new Date().toISOString()
      };

      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
      submitError.hidden = true;

      sendBooking(payload).then(function () {
        F.remove(DRAFT_KEY);
        booking = null;
        triedNext = false;
        form.reset();
        showErrors({});
        showStep(3);
        startCountdown();
      }).catch(function () {
        submitError.textContent = "Sorry, we couldn't send your booking. Please try again, or contact us through the details in the footer.";
        submitError.hidden = false;
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Booking";
      });
    });

    /* ---------- Step 3: countdown back to the homepage (shared, form-utils.js) ---------- */

    var stopCountdown = function () {};

    function goHome() {
      stopCountdown();
      F.goHome(api);
    }

    function startCountdown() {
      stopCountdown();
      stopCountdown = F.startCountdown(countdownEl, REDIRECT_SECONDS, goHome);
    }

    $("okay-btn").addEventListener("click", goHome);

    /* ---------- What the pop-up calls ---------- */

    return {
      // options.package: preselect this nation (from data-package or #book=liyue).
      open: function (options) {
        stopCountdown();
        if (currentStep === 3) currentStep = 1;
        var saved = F.load(DRAFT_KEY);
        if (saved && saved.data) fillForm(saved.data);

        var theme = document.body.getAttribute("data-theme") || "";
        var preselect = pkgBySlug(options.package || "") ? options.package : (pkgBySlug(theme) ? theme : "");
        if (preselect) fields.package.value = preselect;
        updateCheckOut();

        // Closed on the confirmation step? Reopen there if it's still valid.
        if (!(saved && saved.step === 2 && goToConfirm())) showStep(1);
      },
      onClose: function () {
        // Closing on the submitted notice just stops the countdown and
        // leaves the visitor on the page they were on.
        stopCountdown();
        if (currentStep === 3) currentStep = 1;
      },
      // Close confirmation (form-modal.js); skipped on the submitted notice.
      askBeforeClose: function () {
        return currentStep !== 3;
      },
      save: function () {
        saveDraft(currentStep === 2 ? 2 : 1);
      },
      discard: function () {
        F.remove(DRAFT_KEY);
        booking = null;
        triedNext = false;
        form.reset();
        showErrors({});
        submitError.hidden = true;
        currentStep = 1;
      }
    };
  }

  window.PHModal.register("booking", { mount: mount });
})();
