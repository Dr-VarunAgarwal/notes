// Hit counter: a real per-browser, per-page visit tally (localStorage),
// zero-padded to look like the old odometer widgets — not a fake global number.
(function () {
  try {
    var el = document.getElementById('hit-counter-digits');
    if (!el) return;
    var key = 'notes-hits:' + location.pathname;
    var count = (parseInt(localStorage.getItem(key), 10) || 0) + 1;
    localStorage.setItem(key, count);
    el.innerHTML = String(count).padStart(6, '0')
      .split('').map(function (d) { return '<span class="odometer-digit">' + d + '</span>'; }).join('');
  } catch (e) {
    // localStorage unavailable (private mode, etc.) — leave counter blank
  }
})();
