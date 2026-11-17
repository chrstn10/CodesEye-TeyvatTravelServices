/* Primordial Haven — Tour Packages filter (home page only).
   Each nation card carries its package data as attributes:
     data-duration="4 Days, 3 Nights"   (must match a Duration option exactly)
     data-min-guests="4" data-max-guests="8"   (group size from that nation's page)
   A card is shown when it matches every filter that isn't set to "All". */
(function () {
  "use strict";

  var durationSelect = document.getElementById("filter-duration");
  var guestSelect = document.getElementById("filter-guests");
  var emptyMsg = document.getElementById("filter-empty");
  var resetBtn = document.getElementById("filter-reset");
  var track = document.querySelector(".nations-track");
  if (!durationSelect || !guestSelect || !track) return;

  var cards = Array.prototype.slice.call(track.querySelectorAll(".nation-slide"));

  function applyFilters() {
    var duration = durationSelect.value;
    var guests = guestSelect.value === "all" ? null : parseInt(guestSelect.value, 10);
    var shown = 0;

    cards.forEach(function (card) {
      var matchesDuration = duration === "all" || card.dataset.duration === duration;
      var min = parseInt(card.dataset.minGuests, 10) || 1;
      var max = parseInt(card.dataset.maxGuests, 10) || Infinity;
      var matchesGuests = guests === null || (guests >= min && guests <= max);
      var visible = matchesDuration && matchesGuests;
      card.hidden = !visible;
      if (visible) shown++;
    });

    if (emptyMsg) emptyMsg.hidden = shown !== 0;
    track.hidden = shown === 0;
    // Bring the first matching card back into view after filtering.
    track.scrollLeft = 0;
  }

  durationSelect.addEventListener("change", applyFilters);
  guestSelect.addEventListener("change", applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      durationSelect.value = "all";
      guestSelect.value = "all";
      applyFilters();
      durationSelect.focus();
    });
  }

  applyFilters();
})();
