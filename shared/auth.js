/* ============================================================
   Remedy Toolbox — Firebase auth + cross-device sync (SHARED)
   Loaded EARLY in every page's <head>, AFTER the Firebase compat
   SDKs and after theme.js:
     <script>document.documentElement.className+=' rmd-auth-pending';</script>
     <style>html.rmd-auth-pending body{visibility:hidden!important}</style>
     <script defer src=".../firebase-app-compat.js"></script>
     <script defer src=".../firebase-auth-compat.js"></script>
     <script defer src=".../firebase-firestore-compat.js"></script>
     <script defer src="shared/auth.js?v=1"></script>

   Replaces the old client-side gate.js with real, server-verified
   sign-in (passwordless "magic link"), restricted to @remedyeng.com,
   and mirrors each person's settings/achievements to Firestore so
   they follow them across devices.

   Data model:  users/{uid} = { email, updatedAt, keys: { <lsKey>: <string>, ... } }
   Only the allow-listed keys below are ever synced.
   ============================================================ */
(function () {
  'use strict';

  // ---- Firebase project config (safe to be public; rules protect data) ----
  var firebaseConfig = {
    apiKey: "AIzaSyBwRMzMTtdONocLj2ikJfA5-KdAU3iUGc0",
    authDomain: "remedy-toolbox.firebaseapp.com",
    projectId: "remedy-toolbox",
    storageBucket: "remedy-toolbox.firebasestorage.app",
    messagingSenderId: "693142943366",
    appId: "1:693142943366:web:91abd92f17b3db4da9c307",
    measurementId: "G-B16DV2C3CK"
  };

  var DOMAIN_RE     = /^[^@\s]+@remedyeng\.com$/i;
  var EMAIL_FOR_SIGNIN = 'remedy.auth.emailForSignIn';

  // Keys that sync across devices (exact matches + prefixes).
  var SYNC_EXACT = [
    'remedy.userName.v1', 'remedy.email.v1', 'remedy.profilePic.v1',
    'remedy.theme.v1', 'remedy.favorites.v1', 'remedy.tileOrder.v1',
    'remedy.welcomeSeen.v1'
  ];
  var SYNC_PREFIX = ['remedy.ach.'];
  var AVATAR_KEY  = 'remedy.profilePic.v1';
  var AVATAR_MAX  = 700000;      // ~700 KB guard (Firestore doc limit is 1 MB)

  function isSynced(k) {
    if (!k) return false;
    if (SYNC_EXACT.indexOf(k) >= 0) return true;
    for (var i = 0; i < SYNC_PREFIX.length; i++) { if (k.indexOf(SYNC_PREFIX[i]) === 0) return true; }
    return false;
  }
  function isAchCounter(k) { return k.indexOf('remedy.ach._') === 0; }   // internal counters
  function isAchUnlock(k)  { return k.indexOf('remedy.ach.') === 0 && !isAchCounter(k); }

  // ---- Preserve the real localStorage writers before we wrap them ----
  var rawSet    = localStorage.setItem.bind(localStorage);
  var rawRemove = localStorage.removeItem.bind(localStorage);

  var state = { user: null, db: null, ready: false, applyingRemote: false, dirty: {}, pushTimer: null };

  /* ================= UI: loading + sign-in overlay ================= */
  function el(tag, css, html) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (html != null) e.innerHTML = html;
    return e;
  }
  var CARD = 'width:100%;max-width:380px;background:#fff;border-top:5px solid #ef702d;border-radius:4px;' +
             'box-shadow:0 20px 60px rgba(0,0,0,.5);padding:30px 28px;';
  var SHELL = 'position:fixed;inset:0;z-index:2147483647;background:#1f2329;display:flex;align-items:center;' +
              'justify-content:center;padding:24px;font-family:Calibri,"Segoe UI",Tahoma,sans-serif;';
  var INP = 'width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:14px;border:1px solid #bfbfbf;' +
            'border-radius:4px;font-size:16px;font-family:inherit;color:#2b2b2b;background:#fff;';
  var BTN = 'width:100%;padding:11px;background:#ef702d;color:#fff;border:0;border-radius:4px;font-family:inherit;' +
            'font-size:14px;font-weight:bold;letter-spacing:.5px;cursor:pointer;';
  var LBL = 'display:block;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#595959;margin-bottom:5px;';

  var overlay = null;
  function shell(inner) {
    if (!overlay) { overlay = el('div', SHELL); overlay.id = 'remedy-auth'; (document.documentElement || document.body).appendChild(overlay); }
    overlay.innerHTML = '<div style="' + CARD + '">' + inner + '</div>';
    return overlay;
  }
  function eyebrow() { return '<div style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#c45a1e;margin-bottom:6px;">Remedy Toolbox</div>'; }

  function showLoading(msg) {
    shell(eyebrow() +
      '<h1 style="margin:0 0 10px;font-size:20px;color:#2b2b2b;">' + (msg || 'Loading&hellip;') + '</h1>' +
      '<p style="margin:0;font-size:13px;color:#595959;">One moment while we get you signed in.</p>');
  }
  function removeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }
  function reveal() { document.documentElement.className = document.documentElement.className.replace(/\brmd-auth-pending\b/, '').trim(); }

  function showSignIn(errMsg) {
    shell(eyebrow() +
      '<h1 style="margin:0 0 4px;font-size:20px;color:#2b2b2b;">Staff sign-in</h1>' +
      '<p style="margin:0 0 18px;font-size:13px;color:#595959;line-height:1.5;">Enter your Remedy Engineering email and we\'ll send you a one-time sign-in link.</p>' +
      '<label for="rmd-email" style="' + LBL + '">Work email</label>' +
      '<input id="rmd-email" type="email" autocomplete="email" spellcheck="false" placeholder="you@remedyeng.com" style="' + INP + '">' +
      '<div id="rmd-err" role="alert" style="min-height:18px;color:#b00000;font-size:12.5px;margin:2px 0 12px;">' + (errMsg || '') + '</div>' +
      '<button id="rmd-send" type="button" style="' + BTN + '">Email me a sign-in link</button>' +
      '<p style="margin:16px 0 0;font-size:11px;color:#8c8c8c;line-height:1.5;">Remedy Engineering staff only. The link expires shortly and only works for your address.</p>');
    var email = document.getElementById('rmd-email');
    var send  = document.getElementById('rmd-send');
    var err   = document.getElementById('rmd-err');
    setTimeout(function () { try { email.focus(); } catch (e) {} }, 30);
    function submit() {
      var em = (email.value || '').trim().toLowerCase();
      if (!DOMAIN_RE.test(em)) { err.textContent = 'Please use your @remedyeng.com email address.'; email.focus(); return; }
      send.disabled = true; send.textContent = 'Sending…';
      var acs = { url: window.location.href, handleCodeInApp: true };
      firebase.auth().sendSignInLinkToEmail(em, acs).then(function () {
        try { rawSet(EMAIL_FOR_SIGNIN, em); } catch (e) {}
        shell(eyebrow() +
          '<h1 style="margin:0 0 10px;font-size:20px;color:#2b2b2b;">Check your email</h1>' +
          '<p style="margin:0 0 6px;font-size:13px;color:#595959;line-height:1.6;">We sent a sign-in link to<br><strong style="color:#2b2b2b;">' + em + '</strong>.</p>' +
          '<p style="margin:12px 0 0;font-size:12px;color:#8c8c8c;line-height:1.6;">Open it on this device to finish signing in. You can close this tab — the link brings you back.</p>');
      }).catch(function (e) {
        send.disabled = false; send.textContent = 'Email me a sign-in link';
        err.textContent = 'Could not send the link: ' + (e && e.code ? e.code : 'try again') + '.';
      });
    }
    send.addEventListener('click', submit);
    email.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  }

  function fatal(msg) {   // secure default: stay hidden, explain
    shell(eyebrow() +
      '<h1 style="margin:0 0 10px;font-size:20px;color:#2b2b2b;">Sign-in unavailable</h1>' +
      '<p style="margin:0;font-size:13px;color:#595959;line-height:1.6;">' + msg +
      '</p><button type="button" onclick="location.reload()" style="' + BTN + 'margin-top:16px;">Retry</button>');
  }

  /* ================= Sync: pull + push ================= */
  function localSyncedKeys() {
    var out = [];
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (isSynced(k)) out.push(k); }
    return out;
  }
  function fireStorage(k, v) {
    try { window.dispatchEvent(new StorageEvent('storage', { key: k, newValue: v, storageArea: localStorage, url: location.href })); } catch (e) {}
  }
  function collectLocal() {
    var keys = {}; var ks = localSyncedKeys();
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i], v = localStorage.getItem(k);
      if (k === AVATAR_KEY && v && v.length > AVATAR_MAX) continue;   // skip oversized avatar
      if (v != null) keys[k] = v;
    }
    return keys;
  }
  function seedCloud() {
    return state.db.collection('users').doc(state.user.uid).set({
      email: state.user.email,
      keys: collectLocal(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  function pull() {
    var ref = state.db.collection('users').doc(state.user.uid);
    return ref.get().then(function (snap) {
      if (!snap.exists) { return seedCloud(); }          // first device seeds the cloud
      var cloud = (snap.data() && snap.data().keys) || {};
      var union = {}, k;
      localSyncedKeys().forEach(function (kk) { union[kk] = 1; });
      for (k in cloud) { if (cloud.hasOwnProperty(k)) union[k] = 1; }
      state.applyingRemote = true;
      var changedLocal = [], toPush = {};
      for (k in union) {
        if (!union.hasOwnProperty(k)) continue;
        var loc = localStorage.getItem(k), cl = (cloud[k] != null ? String(cloud[k]) : null), win;
        if (isAchUnlock(k)) {                              // keep it if EITHER has it (earliest wins)
          win = (loc && cl) ? (loc < cl ? loc : cl) : (cl != null ? cl : loc);
        } else if (isAchCounter(k)) {                      // numeric counters -> max
          var ln = parseFloat(loc), cn = parseFloat(cl);
          if (!isNaN(ln) && !isNaN(cn)) win = String(Math.max(ln, cn));
          else win = (cl != null ? cl : loc);
        } else {                                           // settings -> cloud wins
          win = (cl != null ? cl : loc);
        }
        if (win == null) continue;
        if (win !== loc) { rawSet(k, win); changedLocal.push(k); }               // cloud -> local
        if (win !== cl && !(k === AVATAR_KEY && win.length > AVATAR_MAX)) {      // local -> cloud
          toPush[k] = win;
        }
      }
      state.applyingRemote = false;
      changedLocal.forEach(function (kk) { fireStorage(kk, localStorage.getItem(kk)); });
      // Only write back when we genuinely have something new for the cloud
      // (e.g. an achievement earned on this device) — not on every page load.
      if (Object.keys(toPush).length) {
        return ref.set({ keys: toPush, email: state.user.email, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
    });
  }
  function schedulePush() {
    if (state.pushTimer) return;
    state.pushTimer = setTimeout(function () {
      state.pushTimer = null;
      if (!state.user || !state.db) return;
      var upd = { email: state.user.email, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      var any = false;
      for (var k in state.dirty) {
        if (!state.dirty.hasOwnProperty(k)) continue;
        any = true;
        var v = state.dirty[k];
        if (v === null) { upd['keys.' + k] = firebase.firestore.FieldValue.delete(); }
        else if (k === AVATAR_KEY && v.length > AVATAR_MAX) { /* skip oversized */ }
        else { upd['keys.' + k] = v; }
      }
      state.dirty = {};
      if (!any) return;
      state.db.collection('users').doc(state.user.uid).set(
        // set(merge) so it works whether or not the doc/fields exist
        rebuild(upd), { merge: true }
      ).catch(function () {});
    }, 800);
  }
  // Firestore set(merge) needs nested maps, not dotted paths; convert "keys.x" -> {keys:{x:..}}
  function rebuild(flat) {
    var out = {};
    for (var k in flat) {
      if (!flat.hasOwnProperty(k)) continue;
      var m = k.match(/^keys\.(.+)$/);
      if (m) { out.keys = out.keys || {}; out.keys[m[1]] = flat[k]; }
      else { out[k] = flat[k]; }
    }
    return out;
  }

  /* ================= Wrap localStorage writers ================= */
  localStorage.setItem = function (k, v) {
    rawSet(k, v);
    if (!state.applyingRemote && state.user && isSynced(k)) { state.dirty[k] = String(v); schedulePush(); }
  };
  localStorage.removeItem = function (k) {
    rawRemove(k);
    if (!state.applyingRemote && state.user && isSynced(k)) { state.dirty[k] = null; schedulePush(); }
  };

  /* ================= Boot ================= */
  window.RemedyAuth = {
    signOut: function () { try { firebase.auth().signOut(); } catch (e) {} location.reload(); },
    currentEmail: function () { return state.user ? state.user.email : null; }
  };

  // Skip the background pull if we already synced very recently this session,
  // so rapid navigation between tools doesn't hammer Firestore.
  function shouldPull() {
    try {
      var last = parseFloat(sessionStorage.getItem('remedy.auth.lastPull') || '0');
      var now = Date.now();
      if (now - last < 15000) return false;
      sessionStorage.setItem('remedy.auth.lastPull', String(now));
      return true;
    } catch (e) { return true; }
  }

  function onUser(user) {
    if (!user) { showSignIn(); return; }
    var email = (user.email || '').toLowerCase();
    if (!DOMAIN_RE.test(email) || !user.emailVerified) {
      firebase.auth().signOut();
      showSignIn('That address isn’t a verified @remedyeng.com account.');
      return;
    }
    state.user = user;
    state.db = firebase.firestore();
    // Show the page IMMEDIATELY from the locally-cached data — navigating between
    // tools should never wait on the network. Then sync quietly in the background;
    // any genuinely newer data from another device is applied live via storage events.
    removeOverlay(); reveal();
    if (shouldPull()) { pull().catch(function () {}); }
  }

  function start() {
    if (typeof firebase === 'undefined' || !firebase.initializeApp) {
      fatal('The sign-in service could not load. Check your connection and retry.');
      return;
    }
    try { firebase.initializeApp(firebaseConfig); } catch (e) { /* already initialised */ }
    showLoading();

    // Completing a magic-link click?
    try {
      if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
        var em = '';
        try { em = localStorage.getItem(EMAIL_FOR_SIGNIN) || ''; } catch (e) {}
        if (!em) { em = window.prompt('Confirm your @remedyeng.com email to finish signing in:') || ''; }
        firebase.auth().signInWithEmailLink(em.trim().toLowerCase(), window.location.href).then(function () {
          try { rawRemove(EMAIL_FOR_SIGNIN); } catch (e) {}
          // strip the link params from the URL
          try { history.replaceState(null, '', window.location.pathname + window.location.hash); } catch (e) {}
        }).catch(function (e) {
          showSignIn('That sign-in link was invalid or expired. Request a new one.');
        });
      }
    } catch (e) {}

    firebase.auth().onAuthStateChanged(onUser);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); }
  else { start(); }
})();
