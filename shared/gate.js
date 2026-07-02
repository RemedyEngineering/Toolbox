/* ============================================================
   Remedy Toolbox — Staff access gate (SHARED, single source)
   Loaded EARLY in every page's <head>, right after theme.js:
       <script src="shared/gate.js?v=1"></script>       (root pages)
       <script src="../shared/gate.js?v=1"></script>     (SubTools)

   What it does
   ------------
   Before the tools are usable, a full-screen sign-in asks for a
   Remedy Engineering email (must end in @remedyeng.com) and the
   shared team password. On success it remembers the browser
   (localStorage) so each person only signs in once per device.

   IMPORTANT — this is a lightweight deterrent, NOT real security.
   Because the site is fully static (GitHub Pages), the check runs
   in the browser: a determined person can read the page source,
   disable JavaScript, or clear the stored flag to get around it.
   The password is stored here as a hash (not plain text) so it
   isn't handed out in "View Source", but that only slows down the
   casual case. For genuine access control, host behind a login
   (server-side auth, Cloudflare Access, or a private site).

   To change the password: pick a new one, compute its djb2 hash
   with the same function below, and replace PWHASH.
   To change the allowed domain: edit DOMAIN_RE.
   To force everyone to sign in again: bump KEY (…v1 -> …v2).
   ============================================================ */
(function () {
  'use strict';

  var KEY      = 'remedy.gate.v1';
  var DOMAIN_RE = /^[^@\s]+@remedyeng\.com$/i;   // must be an @remedyeng.com address
  var PWHASH   = 4050481259;                     // djb2("RemedyTools2026!")

  function djb2(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) { h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; }
    return h >>> 0;
  }

  // Already signed in on this browser? Do nothing.
  try { if (localStorage.getItem(KEY)) return; } catch (e) {}

  // Hide page content until the gate is up (prevents a flash of the tools).
  // The overlay itself is attached to <html>, so it stays visible.
  try {
    var hide = document.createElement('style');
    hide.id = 'remedy-gate-hide';
    hide.textContent = 'html.remedy-gated body{visibility:hidden!important}';
    (document.head || document.documentElement).appendChild(hide);
    document.documentElement.className += ' remedy-gated';
  } catch (e) {}

  function unlock(email) {
    try { localStorage.setItem(KEY, JSON.stringify({ email: email, ts: new Date().toISOString() })); } catch (e) {}
    var h = document.getElementById('remedy-gate-hide');
    if (h && h.parentNode) { h.parentNode.removeChild(h); }
    document.documentElement.className = document.documentElement.className.replace(/\bremedy-gated\b/, '').trim();
    var g = document.getElementById('remedy-gate');
    if (g && g.parentNode) { g.parentNode.removeChild(g); }
  }

  function mount() {
    if (document.getElementById('remedy-gate')) return;

    var inputCss = 'width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:14px;' +
                   'border:1px solid #bfbfbf;border-radius:4px;font-size:14px;font-family:inherit;color:#2b2b2b;background:#fff;';
    var labelCss = 'display:block;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#595959;margin-bottom:5px;';

    var g = document.createElement('div');
    g.id = 'remedy-gate';
    g.setAttribute('role', 'dialog');
    g.setAttribute('aria-modal', 'true');
    g.setAttribute('aria-label', 'Staff sign-in');
    g.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#1f2329;' +
      'display:flex;align-items:center;justify-content:center;padding:24px;' +
      'font-family:Calibri,"Segoe UI",Tahoma,sans-serif;-webkit-font-smoothing:antialiased;';
    g.innerHTML =
      '<form id="remedy-gate-form" novalidate style="width:100%;max-width:380px;background:#fff;' +
        'border-top:5px solid #ef702d;box-shadow:0 20px 60px rgba(0,0,0,.5);border-radius:4px;padding:30px 28px;">' +
        '<div style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#c45a1e;margin-bottom:6px;">Remedy Toolbox</div>' +
        '<h1 style="margin:0 0 4px;font-size:20px;color:#2b2b2b;">Staff sign-in</h1>' +
        '<p style="margin:0 0 18px;font-size:13px;color:#595959;line-height:1.5;">Enter your Remedy Engineering email and the team password to continue.</p>' +
        '<label for="remedy-gate-email" style="' + labelCss + '">Work email</label>' +
        '<input id="remedy-gate-email" type="email" autocomplete="email" spellcheck="false" placeholder="you@remedyeng.com" style="' + inputCss + '">' +
        '<label for="remedy-gate-pass" style="' + labelCss + '">Team password</label>' +
        '<input id="remedy-gate-pass" type="password" autocomplete="current-password" style="' + inputCss + '">' +
        '<div id="remedy-gate-err" role="alert" style="min-height:18px;color:#b00000;font-size:12.5px;margin:2px 0 12px;"></div>' +
        '<button type="submit" style="width:100%;padding:11px;background:#ef702d;color:#fff;border:0;border-radius:4px;' +
          'font-family:inherit;font-size:14px;font-weight:bold;letter-spacing:.5px;cursor:pointer;">Enter toolbox</button>' +
        '<p style="margin:16px 0 0;font-size:11px;color:#8c8c8c;line-height:1.5;">Remedy Engineering staff only. ' +
          'Your access is remembered on this browser.</p>' +
      '</form>';

    // Attach to <html> so the "hide body" style above doesn't hide the gate too.
    (document.documentElement || document.body).appendChild(g);

    var form  = g.querySelector('#remedy-gate-form');
    var email = g.querySelector('#remedy-gate-email');
    var pass  = g.querySelector('#remedy-gate-pass');
    var err   = g.querySelector('#remedy-gate-err');

    setTimeout(function () { try { email.focus(); } catch (e) {} }, 30);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var em = (email.value || '').trim().toLowerCase();
      if (!DOMAIN_RE.test(em)) {
        err.textContent = 'Please use your @remedyeng.com email address.';
        email.focus();
        return;
      }
      if (djb2(pass.value || '') !== PWHASH) {
        err.textContent = 'Incorrect password. Please try again.';
        pass.value = '';
        pass.focus();
        return;
      }
      unlock(em);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
