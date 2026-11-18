/* Tour Packages filter */
(function () {
  "use strict";

  // The two dropdowns, the empty message, its reset button, and the card row.
  var durationSelect = document.getElementById("filter-duration");
  var guestSelect = document.getElementById("filter-guests");
  var emptyMsg = document.getElementById("filter-empty");
  var resetBtn = document.getElementById("filter-reset");
  var track = document.querySelector(".nations-track");
  if (!durationSelect || !guestSelect || !track) return;

  // All seven nation cards.
  var cards = Array.prototype.slice.call(track.querySelectorAll(".nation-slide"));

  // Shows only the cards that match both filters, or the empty message if none do.
  function applyFilters() {
    var duration = durationSelect.value;
    var range = guestSelect.value === "all" ? null : guestSelect.value.split("-").map(Number);
    var shown = 0;

    cards.forEach(function (card) {
      var matchesDuration = duration === "all" || card.dataset.duration === duration;
      var min = parseInt(card.dataset.minGuests, 10) || 1;
      var max = parseInt(card.dataset.maxGuests, 10) || Infinity;
      var matchesGuests = range === null || (range[0] <= max && range[1] >= min);
      var visible = matchesDuration && matchesGuests;
      card.hidden = !visible;
      if (visible) shown++;
    });

    if (emptyMsg) emptyMsg.hidden = shown !== 0;
    track.hidden = shown === 0;
    // Bring the first matching card back into view after filtering.
    track.scrollLeft = 0;
  }

  // Re-filter whenever either dropdown changes.
  durationSelect.addEventListener("change", applyFilters);
  guestSelect.addEventListener("change", applyFilters);

  if (resetBtn) {
    // "show all packages": reset both filters to All.
    resetBtn.addEventListener("click", function () {
      durationSelect.value = "all";
      guestSelect.value = "all";
      applyFilters();
      durationSelect.focus();
    });
  }

  applyFilters();
})();
