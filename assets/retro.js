// Hit counter: a real per-browser, per-page visit tally (localStorage),
// zero-padded to look like the old odometer widgets — not a fake global number.
//
// This is a static site with no server, so there's no way to key off IP —
// that would need a backend (e.g. a Cloudflare Worker + KV). Instead, a
// sessionStorage flag marks "already counted this tab session", so repeat
// refreshes in the same tab don't bump the tally — only a fresh session
// (new tab, or the old tab reopened after being closed) counts as a visit.
(function () {
  try {
    var el = document.getElementById('hit-counter-digits');
    if (!el) return;
    var path = location.pathname;
    var countKey = 'notes-hits:' + path;
    var sessionKey = 'notes-hits-counted:' + path;
    var count = parseInt(localStorage.getItem(countKey), 10) || 0;
    if (!sessionStorage.getItem(sessionKey)) {
      count += 1;
      localStorage.setItem(countKey, count);
      sessionStorage.setItem(sessionKey, '1');
    }
    el.innerHTML = String(count).padStart(6, '0')
      .split('').map(function (d) { return '<span class="odometer-digit">' + d + '</span>'; }).join('');
  } catch (e) {
    // localStorage/sessionStorage unavailable (private mode, etc.) — leave counter blank
  }
})();
