/* ============================================================
   Remedy Toolbox — Theme engine (SHARED, single source)
   Loaded EARLY in every page's <head> via:
       <script src="shared/theme.js?v=1"></script>      (root pages)
       <script src="../shared/theme.js?v=1"></script>   (SubTools)
   It must load in <head> (before the body paints) so the saved
   theme is applied with no flash of the wrong colours.

   How it works
   ------------
   Every page defines the brand palette as CSS custom properties in
   :root (--charcoal, --orange, --bg, --white, …) and uses them via
   var(--token). This engine simply OVERRIDES those properties on
   <html> (document.documentElement). Inline element styles win over
   stylesheet :root rules, so one assignment re-themes the whole page.

       light  → no overrides; the page's own :root governs (pristine).
       dark   → a tuned dark palette is layered on.
       custom → light base + the user's curated colours.

   Saved in localStorage under 'remedy.theme.v1':
       { mode:'light'|'dark'|'custom', custom:{ accent, accentHover,
         bg, surface, text, border } }

   Public API (window.RemedyTheme):
       getMode()                      → 'light' | 'dark' | 'custom'
       get()                          → the full saved object
       setMode('dark')                → switch mode + persist + apply
       setCustom('accent', '#ff0')    → set one custom colour (→ custom mode)
       resetCustom()                  → clear custom colours
       apply()                        → re-apply current state
       FIELDS                         → curated custom controls (see below)
       DEFAULTS                       → the light/brand values of each field
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'remedy.theme.v1';

  // All theme-managed tokens (union across every page, incl. --key-lime).
  var TOKENS = [
    '--charcoal', '--charcoal-2', '--orange', '--orange-d', '--orange-l',
    '--amber', '--lime', '--lime-d', '--pale-or', '--pale-lime', '--key-lime',
    '--cream', '--white', '--grey', '--grey-l', '--border', '--bg', '--ok', '--bad', '--red'
  ];

  // ---- Semantic "ink" + hairline tokens (ALWAYS provided) -----------------
  // The brand palette overloads --charcoal (dark bars AND body text) and
  // --white (card surfaces AND text on dark bars). A token swap alone can't
  // invert both directions, so the pages were restructured: text now uses
  // --ink / --ink-2 / --on-dark, and borders use --hair, leaving --charcoal /
  // --white / --charcoal-2 as pure SURFACES. These ink tokens are set in every
  // mode (light values here) so text never disappears; dark mode overrides them.
  var BASE = {
    '--ink':     '#2b2b2b',   // primary text  (was color:var(--charcoal))
    '--ink-2':   '#404040',   // secondary text(was color:var(--charcoal-2))
    '--on-dark': '#ffffff',   // text on dark bars / accent fills (was color:var(--white))
    '--hair':    '#e3e3e3'    // soft dividers (was #eee / #e0e0e0 / …)
  };

  // Tuned dark palette. Surfaces go dark; ink goes light.
  var DARK = {
    // surfaces (charcoal/charcoal-2/white stay DARK now)
    '--charcoal':   '#1f2329',   // dark bars (header, tabnav, panel heads, footers)
    '--charcoal-2': '#2a2f37',   // elevated dark (hover / active bars)
    '--white':      '#1e2128',   // cards
    '--bg':         '#14161a',   // page
    '--cream':      '#242019',   // input fills
    '--border':     '#343941',
    // ink (light)
    '--ink':        '#e8e9eb',
    '--ink-2':      '#c6c8cc',
    '--on-dark':    '#f4f5f7',
    '--hair':       '#2f343b',
    // greys & accents
    '--grey':       '#a7abb2',
    '--grey-l':     '#9aa0a9',
    '--orange':     '#ff7f3f',
    '--orange-d':   '#e06a2c',
    '--orange-l':   '#ffae4d',
    '--amber':      '#f3b53a',
    '--lime':       '#b3c279',
    '--lime-d':     '#97a861',
    '--pale-or':    '#33271d',
    '--pale-lime':  '#232a1b',
    '--key-lime':   '#3a4524',
    '--ok':         '#46c06a',
    '--bad':        '#ff6b6b',
    '--red':        '#ff6b6b'
  };

  // Curated custom controls → which token(s) each one drives.
  var FIELDS = [
    { key: 'accent',      token: '--orange',   label: 'Accent',          def: '#ef702d' },
    { key: 'accentHover', token: '--orange-d', label: 'Accent (hover)',  def: '#c45a1e' },
    { key: 'bg',          token: '--bg',       label: 'Page background', def: '#f4f4f4' },
    { key: 'surface',     token: '--white',    label: 'Card surface',    def: '#ffffff' },
    { key: 'text',        token: '--ink',      label: 'Text',            def: '#2b2b2b' },
    { key: 'border',      token: '--border',   label: 'Border',          def: '#bfbfbf' }
  ];

  var DEFAULTS = {};
  FIELDS.forEach(function (f) { DEFAULTS[f.key] = f.def; });

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function write(o) {
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }

  function root() { return document.documentElement; }

  function clearVars() {
    var r = root();
    for (var i = 0; i < TOKENS.length; i++) { r.style.removeProperty(TOKENS[i]); }
  }
  function setVars(map) {
    var r = root();
    for (var k in map) { if (map.hasOwnProperty(k)) { r.style.setProperty(k, map[k]); } }
  }

  function customVars(custom) {
    var ov = {};
    custom = custom || {};
    for (var i = 0; i < FIELDS.length; i++) {
      var f = FIELDS[i];
      var v = custom[f.key];
      if (v) { ov[f.token] = v; }
    }
    return ov;
  }

  // The value each curated field has in a given mode (for seeding Custom).
  function paletteFor(mode) {
    var out = {};
    for (var i = 0; i < FIELDS.length; i++) {
      var f = FIELDS[i];
      out[f.key] = (mode === 'dark') ? (DARK[f.token] || f.def) : f.def;
    }
    return out;
  }

  // Small dark-mode-only niceties. The heavy lifting is done by the tokens
  // (surfaces dark, ink light), so this only needs a couple of touches.
  // Scoped to [data-theme="dark"] so it is inert in light / custom modes.
  function injectCss() {
    if (document.getElementById('remedy-theme-css')) return;
    var css =
      // sensible default text colour for anything that only inherits
      '[data-theme="dark"] body{color:var(--ink);}' +
      // soften bright illustrations a touch on dark
      '[data-theme="dark"] img{filter:brightness(.94);}' +
      // let native form controls / scrollbars match the theme
      '[data-theme="dark"]{color-scheme:dark;}' +
      '[data-theme="light"],[data-theme="custom"]{color-scheme:light;}' +

      // ---- Dark-mode readability fixes -------------------------------------
      // A handful of panels hard-code a pale background (e.g. #FFFBF0) that
      // never flips, so in dark mode themed text landed on a near-white box.
      // Re-point those backgrounds at tokens that DO flip. Scoped to
      // [data-theme="dark"] + the exact selector so light/custom stay pristine
      // and these always win on specificity over the page's own rule.
      // Info / note / warning panels -> dark input-fill surface.
      '[data-theme="dark"] .note,[data-theme="dark"] .info-note,[data-theme="dark"] .warn-box{background:var(--cream);}' +
      // Neutral "idle"/placeholder chips -> elevated dark surface.
      '[data-theme="dark"] .verdict.idle,[data-theme="dark"] .train-link.placeholder .train-tag{background:var(--charcoal-2);color:var(--ink-2);}' +
      // Fail / error banners -> dark warm surface (text is --bad/--red, now light).
      '[data-theme="dark"] .status.bad,[data-theme="dark"] .result-banner.fail,[data-theme="dark"] .pick-result.bad,[data-theme="dark"] .headline.err,[data-theme="dark"] .verdict.fail,[data-theme="dark"] table.results tr.bad td{background:var(--pale-or);}' +
      // Read-only computed table cells -> dark pale surfaces (supply=green, return=orange).
      '[data-theme="dark"] table.comp td.ro,[data-theme="dark"] table.loop-table td.ro.sup{background:var(--pale-lime);}' +
      '[data-theme="dark"] table.loop-table td.ro.ret{background:var(--pale-or);}' +
      // Offline tile label: white on light-grey -> dark ink on light-grey.
      '[data-theme="dark"] .tile.offline .tile-head span:last-child{color:var(--charcoal);}' +
      // Green (lime) filled action buttons read poorly with white text on dark
      // mode\'s lighter green -> use dark ink instead.
      '[data-theme="dark"] #remedy-fb-modal .fb-foot .fb-send{color:#14161a;}' +
      '[data-theme="dark"] .doc-tag,[data-theme="dark"] .btn.lime:hover,[data-theme="dark"] .btn-export,[data-theme="dark"] .chip.chip-const:hover{color:#14161a;}' +
      // Warn panels + warm hover states -> dark warm surface.
      '[data-theme="dark"] .headline.warn,[data-theme="dark"] .pick-result.warn,[data-theme="dark"] .res-cell.warn,[data-theme="dark"] .copilot-ask:hover,[data-theme="dark"] .drop-item-egg:hover,[data-theme="dark"] .loop-table th.group-ret{background:var(--pale-or);}' +
      // Green table group header -> dark green surface.
      '[data-theme="dark"] .loop-table th.group-sup{background:var(--pale-lime);}' +
      // Error result boxes (text is --red, now light) -> dark warm surface.
      '[data-theme="dark"] .widget.type-calc .w-result.error,[data-theme="dark"] .widget.type-var .w-result.error{background:var(--pale-or);}' +
      // Subtle near-white section tints / row hovers -> elevated dark surface.
      '[data-theme="dark"] .sys-section,[data-theme="dark"] .add-row-bar,[data-theme="dark"] .sch-item:hover,[data-theme="dark"] .sdv tbody tr:hover,[data-theme="dark"] .doc-row:hover{background:var(--charcoal-2);}';
    var st = document.createElement('style');
    st.id = 'remedy-theme-css';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  function apply() {
    var s = read();
    var mode = s.mode === 'dark' || s.mode === 'custom' ? s.mode : 'light';
    var r = root();
    clearVars();
    setVars(BASE);                                    // ink/hairline (light values) always present
    if (mode === 'dark') { setVars(DARK); }           // overrides BASE + surfaces
    else if (mode === 'custom') { setVars(customVars(s.custom)); }
    r.setAttribute('data-theme', mode);
  }

  // Apply as early as possible (we are in <head>). The injected stylesheet
  // needs <head>; if it is not parsed yet, fall back to documentElement.
  injectCss();
  apply();

  // Keep multiple open tabs / the greeting in sync.
  try {
    window.addEventListener('storage', function (e) {
      if (e && e.key === KEY) { apply(); }
    });
  } catch (e) {}

  window.RemedyTheme = {
    KEY: KEY,
    FIELDS: FIELDS,
    DEFAULTS: DEFAULTS,
    DARK: DARK,
    get: read,
    getMode: function () { var m = read().mode; return (m === 'dark' || m === 'custom') ? m : 'light'; },
    getCustom: function () {
      var c = read().custom || {}, out = {};
      for (var i = 0; i < FIELDS.length; i++) {
        var f = FIELDS[i];
        out[f.key] = c[f.key] || f.def;
      }
      return out;
    },
    setMode: function (m) {
      if (m === 'custom') { return this.enterCustom(); }
      var s = read();
      s.mode = (m === 'dark' || m === 'custom') ? m : 'light';
      write(s); apply();
      return s.mode;
    },
    // Switch to Custom, seeding the curated colours from the mode you were just
    // on (light or dark) — but never overwriting colours you've changed yourself.
    enterCustom: function () {
      var s = read();
      var cur = (s.mode === 'dark' || s.mode === 'custom') ? s.mode : 'light';
      if (cur !== 'custom') {
        var seed = paletteFor(cur);
        s.custom = s.custom || {};
        s.touched = s.touched || {};
        for (var i = 0; i < FIELDS.length; i++) {
          var k = FIELDS[i].key;
          if (!s.touched[k]) { s.custom[k] = seed[k]; }
        }
      }
      s.mode = 'custom';
      write(s); apply();
      return 'custom';
    },
    setCustom: function (key, val) {
      var s = read();
      s.custom = s.custom || {};
      s.touched = s.touched || {};
      s.custom[key] = val;
      s.touched[key] = true;          // remember the user changed this one
      s.mode = 'custom';
      write(s); apply();
    },
    resetCustom: function () {
      var s = read();
      s.custom = {};
      s.touched = {};
      write(s); apply();
    },
    apply: apply
  };
})();
