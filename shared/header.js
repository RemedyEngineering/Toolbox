/* ============================================================
   Remedy Toolbox — Header + Tab nav + Greeting (SHARED)
   Loaded by every page via:  <script src="shared/header.js?v=1"></script>
   (SubTools use ../shared/header.js?v=1)

   Each page sets, BEFORE this script:
     <script>window.REMEDY_PAGE = { eyebrow:'Remedy Engineering · HVAC Tool',
                                    title:'Duct Sizing', active:'tools' };</script>
   Then either place <div id="remedy-header"></div> where the header should go,
   or it is prepended to <body>.

   To ADD A TAB: add one entry to REMEDY_TABS below. Done — every page updates.
   ============================================================ */
(function () {
  'use strict';

  // ---- One place to edit the top-level tabs ----
  var REMEDY_TABS = [
    { key: 'home',  label: 'Home',          file: 'Remedy_Home.html' },
    { key: 'tools', label: 'Tools',         file: 'Remedy_Tools.html' },
    { key: 'docs',  label: 'Documentation', file: 'Training_Library.html' }
  ];

  // Resolve paths relative to THIS script (shared/header.js), so it works from
  // the site root and from SubTools/ without per-page path juggling.
  var me = (document.currentScript && document.currentScript.src) || '';
  function url(p) { try { return me ? new URL(p, me).href : p; } catch (e) { return p; } }
  var LOGO    = url('remedy-logo.png');          // sits in shared/ next to this file
  var PROFILE = url('../Remedy_Profile.html');   // root, one level up from shared/

  var cfg = window.REMEDY_PAGE || {};
  var eyebrow = cfg.eyebrow || 'Remedy Engineering · HVAC Tool';
  var title   = cfg.title   || 'Remedy Engineering';
  var active  = cfg.active  || '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function tabsHtml() {
    var here = (location.pathname.split('/').pop() || '').toLowerCase();
    return REMEDY_TABS.map(function (t) {
      var isActive = active ? (t.key === active) : (here === t.file.toLowerCase());
      return '<a class="tab' + (isActive ? ' is-active' : '') + '" href="' + esc(url('../' + t.file)) + '">' +
             '<span class="tab-dot"></span>' + esc(t.label) + '</a>';
    }).join('');
  }

  function headerHtml() {
    return '' +
      '<div class="header">' +
        '<div class="header-left">' +
          '<img src="' + esc(LOGO) + '" alt="Remedy Engineering">' +
          '<div class="header-divider"></div>' +
          '<div class="header-titles">' +
            '<div class="eyebrow">' + esc(eyebrow) + '</div>' +
            '<h1>' + esc(title) + '</h1>' +
          '</div>' +
        '</div>' +
        '<div class="greeting" id="greeting">' +
          '<span id="greet-text">Welcome.</span>' +
          '<button class="pencil-btn" id="greet-edit" title="Edit profile" aria-label="Edit profile">&#9998;</button>' +
        '</div>' +
      '</div>' +
      '<div class="accent-stripes" aria-hidden="true">' +
        '<span class="s-charcoal"></span><span class="s-orange"></span><span class="s-lime"></span>' +
      '</div>' +
      '<nav class="tabnav" aria-label="Primary">' + tabsHtml() + '</nav>' +
      '<div class="accent-bar"></div>';
  }

  function paintGreeting() {
    var el = document.getElementById('greet-text');
    if (!el) return;
    var n = '';
    try { n = (localStorage.getItem('remedy.userName.v1') || '').trim(); } catch (e) {}
    el.innerHTML = n ? 'Welcome, <strong>' + esc(n) + '</strong>.' : 'Welcome.';
  }

  function mount() {
    var holder = document.getElementById('remedy-header');
    var host = document.createElement('div');
    host.innerHTML = headerHtml();
    if (holder) {
      while (host.firstChild) { holder.parentNode.insertBefore(host.firstChild, holder); }
      holder.parentNode.removeChild(holder);
    } else {
      var ref = document.body.firstChild;
      while (host.firstChild) { document.body.insertBefore(host.firstChild, ref); }
    }
    paintGreeting();
    var pencil = document.getElementById('greet-edit');
    if (pencil) pencil.addEventListener('click', function () { window.location.href = PROFILE; });
    window.addEventListener('storage', function (e) {
      if (e && e.key === 'remedy.userName.v1') paintGreeting();
    });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', mount); }
  else { mount(); }
})();
