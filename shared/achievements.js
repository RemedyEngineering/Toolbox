/* ============================================================
   Remedy Toolbox — Achievements (SHARED, single source)
   Loaded by every page via:  <script src="shared/achievements.js?v=1"></script>
   (SubTools use ../shared/achievements.js?v=1)
   Exposes the global __achievementsAPI and auto-runs page tracking on load.
   To add/edit an achievement, edit the REGISTRY array below — once, here.
   ============================================================ */
var __achievementsAPI = (function() {
  var PREFIX = 'remedy.ach.';
  var REGISTRY = [
    // ── Unit Converter ──
    { id: 'uc_first_convert',    emoji: '📐', title: 'Baby\'s First Conversion',    desc: 'You converted a unit. The engineering world trembles at your potential.' , reward: 'One (1) mass-produced participation ribbon.' },
    { id: 'uc_hot_take',         emoji: '🌡️', title: 'Thermodynamic Personality',   desc: 'You converted a temperature. The thermostat war in your office rages on.' , reward: 'Ownership of exactly zero thermostats.' },
    { id: 'uc_bilingual',        emoji: '🌍', title: 'Renaissance Engineer',        desc: 'Used every unit category. Your versatility is almost suspicious.' , reward: 'An honorary degree from a university we made up.' },
    { id: 'uc_going_in_circles', emoji: '🔁', title: 'The Round Trip',              desc: 'Converted a value then immediately converted it back. We\'ve all been there.' , reward: 'A round-trip ticket to nowhere.' },
    { id: 'uc_power_user',       emoji: '💯', title: 'Quantity Over Quality',       desc: '100 conversions. At this point you should probably just memorize the formula.' , reward: 'A lanyard that reads: Adequate.' },
    { id: 'uc_absolute_zero',    emoji: '❄️', title: 'Absolute Zero Chill',         desc: '0 Kelvin. Nothing is colder than this except your office\'s server room.' , reward: 'A blanket. You clearly need one.' },
    { id: 'uc_mystery',          emoji: '❓', title: 'The Audacity',                desc: 'You searched for a unit that doesn\'t exist. Points for confidence.' , reward: 'Nothing. Confidence is its own reward.' },
    { id: 'uc_legend',           emoji: '🏛️', title: 'Professional Unit Botherer',  desc: '1,000 conversions. Google is free, but here we are.' , reward: 'A calculator. Since you clearly refuse to use one.' },
    // ── Duct Sizer ──
    { id: 'ds_first_duct',       emoji: '📏', title: 'Into the Void',               desc: 'You sized your first duct. Somewhere, an HVAC system just got a little less wrong.' , reward: 'A handshake from a man named Gerald.' },
    { id: 'ds_design_friction',  emoji: '🎯', title: 'The Sweet Spot',              desc: '0.08–0.10 in.w.g./100ft. The engineering equivalent of a perfect parallel park.' , reward: 'Fifteen seconds of respectful silence.' },
    { id: 'ds_speed_demon',      emoji: '💨', title: 'Mach Speed Ductwork',         desc: 'Velocity over 2,000 FPM. That\'s not a duct, that\'s a wind tunnel with ambitions.' , reward: 'A speeding ticket from the ductwork police.' },
    { id: 'ds_reynolds',         emoji: '🔬', title: 'Turbulence Enthusiast',       desc: 'Re > 10,000. Turbulent flow, just like your Monday mornings.' , reward: 'A laminar flow of appreciation.' },
    { id: 'ds_friction_fanatic', emoji: '🌀', title: 'Friction Fanatic',            desc: '50 duct calculations. Your dedication to airflow is statistically abnormal.' , reward: 'The admiration of absolutely no one at the party.' },
    { id: 'ds_concrete',         emoji: '🧱', title: 'Brutalist Architecture',      desc: 'You selected concrete ducts. We have questions, but we respect the commitment.' , reward: 'A very heavy trophy. Made of concrete, naturally.' },
    { id: 'ds_mystery',          emoji: '❓', title: 'Gentle Breeze',               desc: 'Under 200 FPM. That\'s not air distribution, that\'s a polite suggestion.' , reward: 'A gentle pat on the back. Almost imperceptible.' },
    { id: 'ds_legend',           emoji: '🏗️', title: 'Duct Whisperer',             desc: '250 duct calcs. The ducts speak to you now. This is either expertise or a cry for help.' , reward: 'An office with a window. The window does not open.' },
    // ── VAV Box Sizer ──
    { id: 'vav_box_office',      emoji: '📦', title: 'Box Office Hit',              desc: 'First VAV box sized. One small step for airflow, one giant leap for your submittal.' , reward: 'A box. Inside the box is a smaller box.' },
    { id: 'vav_in_zone',         emoji: '✅', title: 'Nailed It',                   desc: 'Flow landed perfectly between min and max. Screenshot this. It may never happen again.' , reward: 'Bragging rights. Non-transferable. Non-redeemable.' },
    { id: 'vav_go_big',          emoji: '📏', title: 'Compensating for Something',  desc: 'You sized the 24×16. That\'s not a VAV box, that\'s a studio apartment.' , reward: 'A studio apartment. Inside a VAV box.' },
    { id: 'vav_below_floor',     emoji: '⚠️', title: 'Underachiever',               desc: 'Hit the minimum flow warning. The box is disappointed in you.' , reward: 'A participation trophy. Hollow, like the flow rate.' },
    { id: 'vav_goldilocks',      emoji: '🎯', title: 'Goldilocks Protocol',         desc: 'Sized every box from 4″ to 24×16. Put it on your resume.' , reward: 'Three bowls of porridge. All the wrong temperature.' },
    { id: 'vav_thinking_small',  emoji: '🔹', title: 'Fun Sized',                   desc: '4″ box at minimum flow. For when the closet absolutely needs conditioned air.' , reward: 'A very small trophy for a very small achievement.' },
    { id: 'vav_mystery',         emoji: '❓', title: 'Ambitious',                   desc: 'Over maximum on the biggest box. You dreamed too big and the box said no.' , reward: 'A motivational poster that reads: Aim Lower.' },
    // ── Fan Static Calculator ──
    { id: 'fs_under_pressure',   emoji: '🌬️', title: 'Under Pressure',              desc: 'First fan static calc complete. Queen and David Bowie would be proud.' , reward: 'A vinyl record you cannot play at work.' },
    { id: 'fs_kitchen',          emoji: '🍕', title: 'Kitchen Nightmare',           desc: 'Grease-laden exhaust selected. May your ductwork never meet a match.' , reward: 'A pizza you will never receive.' },
    { id: 'fs_collector',        emoji: '🏗️', title: 'Hoarder of Components',       desc: '10+ components in one system. This stopped being engineering three fittings ago.' , reward: 'More components. Obviously.' },
    { id: 'fs_fire',             emoji: '🔥', title: 'Playing with Fire',           desc: 'High-temp smoke control selected. Please tell us this is theoretical.' , reward: 'A fire extinguisher. Decorative only.' },
    { id: 'fs_safety',           emoji: '🛡️', title: 'Safety Third',                desc: 'Safety factor at 25%+. You\'ve been burned before. Figuratively. We hope.' , reward: 'A safety vest. For your spreadsheets.' },
    { id: 'fs_multi_system',     emoji: '🏛️', title: 'System Hoarder',              desc: '5+ systems in one session. You\'re not sizing fans, you\'re building a civilization.' , reward: 'The title of Emperor. Subjects not included.' },
    { id: 'fs_fume',             emoji: '☣️', title: 'Hazard Pay',                  desc: 'Fume exhaust selected. Your nose thanks you for the consideration.' , reward: 'A gas mask. Non-functional. Display purposes only.' },
    { id: 'fs_mystery',          emoji: '❓', title: 'Credit Where Due',            desc: 'Named your engineer and exported. Taking credit — the most important engineering skill.' , reward: 'Your name in 8pt font on a PDF no one will open.' },
    // ── Pipe Sizer ──
    { id: 'ps_pipe_dream',       emoji: '🚿', title: 'Pipe Dream',                  desc: 'First pipe calc done. Water will flow. Probably in the right direction.' , reward: 'A pipe dream. It is literally a dream about a pipe.' },
    { id: 'ps_fixture_fixer',    emoji: '🚽', title: 'Flush with Success',          desc: 'Used the sanitary DFU calculator. Glamorous work.' , reward: 'A golden plunger. Not actual gold. Not an actual plunger.' },
    { id: 'ps_cold_blooded',     emoji: '🧊', title: 'Cold Blooded',                desc: '40%+ propylene glycol. Your pipes won\'t freeze but your budget might.' , reward: 'A parka. Your budget will need it.' },
    { id: 'ps_triple_threat',    emoji: '🏗️', title: 'Triple Threat',               desc: 'Used all three pipe calculators. Hydronic, sanitary, domestic — the pipe trifecta nobody asked for.' , reward: 'A three-headed trophy. None of the heads match.' },
    { id: 'ps_alchemist',        emoji: '⚗️', title: 'The Alchemist',               desc: 'Steel, copper, and PEX. You don\'t have a favourite material. You love them all equally.' , reward: 'A rock with googly eyes. We call it the Philosopher Stone.' },
    { id: 'ps_steep_grade',      emoji: '📐', title: 'Steep Grade',                 desc: '1:25 sanitary slope. That drain has places to be.' , reward: 'A tiny sled. For the drain.' },
    { id: 'ps_mystery',          emoji: '❓', title: 'Antifreeze Sommelier',        desc: '60% propylene glycol. At this point it\'s basically syrup.' , reward: 'A bottle of syrup. Regular syrup. Not glycol.' },
    // ── Heating Loop ──
    { id: 'hl_loop_de_loop',     emoji: '♨️', title: 'Loop de Loop',                desc: 'First heating loop complete. Warm feelings all around. Literally.' , reward: 'A warm feeling. Thermal, not emotional.' },
    { id: 'hl_full_house',       emoji: '🏨', title: 'Full House',                  desc: '20+ terminal units. That\'s not a loop, that\'s a logistics operation.' , reward: 'A sitcom laugh track plays in your honour.' },
    { id: 'hl_delta_force',      emoji: '🌡️', title: 'Delta Force',                 desc: 'ΔT of 40°F+. Subtlety was clearly not in the design brief.' , reward: 'A pair of sunglasses you did not ask for.' },
    { id: 'hl_multi_loop',       emoji: '🔀', title: 'Multi-Loop Maestro',          desc: '3+ loops in one project. You\'re not designing heating, you\'re composing a symphony.' , reward: 'A baton. For conducting your symphony of loops.' },
    { id: 'hl_load_bearer',      emoji: '🧮', title: 'Load Bearer',                 desc: '500+ MBH. That\'s not heating, that\'s a small industrial operation with a dream.' , reward: 'A hard hat. For your desk.' },
    { id: 'hl_district_heat',    emoji: '🏭', title: 'District Heating Overlord',   desc: '2,000+ MBH. You are now personally responsible for warming a small neighborhood.' , reward: 'A small neighbourhood. Population: zero.' },
    // ── Louver Sizer ──
    { id: 'ls_fresh_intake',     emoji: '🌀', title: 'Fresh Intake',                desc: 'First louver sized. Fresh air is overrated, but code says otherwise.' , reward: 'A single breath of fresh air. Use wisely.' },
    { id: 'ls_rain_brain',       emoji: '🌧️', title: 'Rain Brain',                  desc: 'Intake within drainable velocity limit. The building will stay dry. Probably.' , reward: 'An umbrella that does not close.' },
    { id: 'ls_high_velocity',    emoji: '💨', title: 'Terminal Velocity',            desc: 'Exhaust over 1,000 FPM. That air is LEAVING and it\'s not coming back.' , reward: 'A farewell card for the departing air.' },
    { id: 'ls_big_face',         emoji: '📐', title: 'Big Face Energy',             desc: 'Face area over 25 ft². That\'s not a louver, that\'s a window with commitment issues.' , reward: 'A comically oversized novelty cheque. Amount: $0.00.' },
    { id: 'ls_velocity_check',   emoji: '⚡', title: 'Living on the Edge',          desc: 'Within 2% of max velocity. Bold. Reckless. Efficient.' , reward: 'An adrenaline rush. Invoice to follow.' },
    { id: 'ls_mystery',          emoji: '❓', title: 'Warranty Voided',             desc: 'Exceeded the recommended intake velocity. The manufacturer just felt a disturbance.' , reward: 'A sternly worded letter from a louver manufacturer.' },
    // ── Psychrometric ──
    { id: 'psy_wet_bulb',        emoji: '💧', title: 'Certified Air Nerd',          desc: 'First psychrometric lookup complete. There is no going back.' , reward: 'A one-way ticket to the psychrometric chart dimension.' },
    { id: 'psy_mile_high',       emoji: '🏔️', title: 'Mile High',                   desc: 'Elevation over 5,000 ft. The air is thinner but your calcs are not.' , reward: 'Thin air. You may keep it.' },
    { id: 'psy_desert_dry',      emoji: '🌵', title: 'Bone Dry',                    desc: 'RH below 10%. Even the air is dehydrated. Drink some water.' , reward: 'A glass of water. Please actually drink it.' },
    { id: 'psy_saturation',      emoji: '🌊', title: 'You Made a Cloud',            desc: '100% RH entered. Congratulations, you\'ve invented weather indoors.' , reward: 'Indoor weather rights. Non-transferable.' },
    { id: 'psy_four_mode',       emoji: '🔬', title: 'Four-Mode Engineer',          desc: 'Used all four input modes. You are become psychrometrics, destroyer of comfort zones.' , reward: 'A lab coat. Slightly used. Mostly clean.' },
    { id: 'psy_mystery',         emoji: '❓', title: 'Surface of the Sun',          desc: 'Dry-bulb over 120°F. Sir, this is a building, not a kiln.' , reward: 'SPF 5000 sunscreen. Theoretical protection only.' },
    // ── Training Library ──
    { id: 'tl_first_chapter',    emoji: '📖', title: 'Page Turner',                 desc: 'Opened your first training doc. Knowledge is power. Allegedly.' , reward: 'Knowledge. Allegedly.' },
    { id: 'tl_template_tamer',   emoji: '📋', title: 'Standing on Shoulders',       desc: 'Downloaded a template. Honour the person who made this by filling it in correctly.' , reward: 'The eternal gratitude of whoever made that template.' },
    { id: 'tl_code_walker',      emoji: '📜', title: 'Code Walker',                 desc: 'Accessed Codes & Standards. Light reading for the truly unhinged.' , reward: 'A bookmark. You will need several.' },
    { id: 'tl_cross_disciplined',emoji: '🎓', title: 'Cross-Disciplined',           desc: '4+ library sections visited. You\'re either thorough or completely lost.' , reward: 'A compass. You are clearly lost.' },
    { id: 'tl_deep_search',      emoji: '🔍', title: 'Deep Search',                 desc: 'Used search to find and open a doc. Ctrl+F energy, but for your career.' , reward: 'The satisfaction of not scrolling like a barbarian.' },
    { id: 'tl_librarian',        emoji: '🏆', title: 'The Librarian',               desc: '50 documents opened. At this point, just move into the training library.' , reward: 'A library card. Valid at exactly zero libraries.' },
    // ── Platform-Wide ──
    { id: 'pw_fresh_air',        emoji: '👋', title: 'Hello World',                 desc: 'You entered your name. The toolbox now acknowledges you as a person.' , reward: 'Acknowledgement as a person. The bare minimum.' },
    { id: 'pw_tool_tourist',     emoji: '🌐', title: 'Tool Tourist',                desc: 'Visited every tool. You\'ve seen things. Calculators. Dropdowns. Unspeakable tables.' , reward: 'A postcard from every tool. None are interesting.' },
    { id: 'pw_deadline_eng',     emoji: '🌙', title: 'The Deadline Engineer',       desc: 'Using the toolbox between midnight and 4 AM. The project is due tomorrow, isn\'t it.' , reward: 'Imaginary coffee. Dangerously strong.' },
    { id: 'pw_night_owl',        emoji: '🦉', title: 'Night Owl',                   desc: 'Toolbox use after 10 PM. Go home. Or don\'t. We\'re not your manager.' , reward: 'Permission to go home. You will not use it.' },
    { id: 'pw_early_bird',       emoji: '🐦', title: 'Early Bird',                  desc: 'Toolbox use before 6 AM. Either extremely dedicated or haven\'t slept. Both valid.' , reward: 'A worm. The early bird gets one. Sorry.' },
    { id: 'pw_seven_day_streak', emoji: '📅', title: '7-Day Streak',                desc: 'Seven days in a row. Weekends are a social construct anyway.' , reward: 'A calendar with the weekends removed.' },
    { id: 'pw_search_party',     emoji: '🔎', title: 'Search Party',                desc: '100 searches. You have personally kept this search bar employed.' , reward: 'A magnifying glass. Mostly decorative.' },
    { id: 'pw_egg_found',        emoji: '🥚', title: 'Easter Egg Hunter',           desc: 'Found a hidden easter egg. You weren\'t supposed to find that.' , reward: 'A chocolate egg. Digital. You cannot eat it.' },
    { id: 'pw_bookworm',         emoji: '📚', title: 'Digital Hoarder',             desc: '5+ favourites. You favourite things like your career depends on it.' , reward: 'A bookshelf. Assembly required. Instructions missing.' },
    { id: 'pw_organized',        emoji: '📁', title: 'Organized',                   desc: 'Reordered your favourites. Rearranging deck chairs, but productively.' , reward: 'A label maker. Batteries sold separately. Labels not included.' },
    { id: 'pw_identity_crisis',  emoji: '🥸', title: 'Identity Crisis',             desc: 'Changed your name 3+ times. Still figuring things out. That\'s okay.' , reward: 'A name tag. Currently blank. Fitting.' },
    { id: 'pw_profile_visitor',  emoji: '🪞', title: 'Self Reflection',             desc: 'Visited the profile page. Sometimes you just need to look yourself in the eye.' , reward: 'Self-awareness. Handle with care.' },
    { id: 'pw_remedy_lifer',     emoji: '🎖️', title: 'Remedy Lifer',                desc: '40+ achievements. You\'re either incredibly thorough or procrastinating spectacularly.' , reward: 'A corner office in a building that has not been designed yet.' }
  ];

  var _toastEl = null;
  var _toastTimer = null;
  var _toastQueue = [];
  var _toastShowing = false;

  function _getToast() {
    if (_toastEl) return _toastEl;
    _toastEl = document.createElement('div');
    _toastEl.className = 'ach-toast';
    _toastEl.setAttribute('role', 'status');
    _toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(_toastEl);
    _toastEl.addEventListener('click', function() {
      window.location.href = '../Remedy_Profile.html#achievements';
    });
    return _toastEl;
  }

  function _processQueue() {
    if (_toastQueue.length === 0) { _toastShowing = false; return; }
    _toastShowing = true;
    var ach = _toastQueue.shift();
    var el = _getToast();
    el.innerHTML = '<span class="ach-toast-emoji">' + ach.emoji + '</span>' +
      '<div class="ach-toast-text">' +
        '<span class="ach-toast-label">Achievement Unlocked</span>' +
        '<span class="ach-toast-title">' + ach.title + '</span>' +
        '<span class="ach-toast-desc">' + ach.desc + '</span>' +
        (ach.reward ? '<span class="ach-toast-reward">✦ ' + ach.reward + '</span>' : '') +
      '</div>';
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function() {
      el.classList.remove('show');
      setTimeout(_processQueue, 350);
    }, 3200);
  }

  function _showToast(ach) {
    _toastQueue.push(ach);
    if (!_toastShowing) _processQueue();
  }

  function unlock(id) {
    var key = PREFIX + id;
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, new Date().toISOString());
    var ach = REGISTRY.find(function(a) { return a.id === id; });
    if (ach) _showToast(ach);
    _checkRemedy();
    return true;
  }

  function isUnlocked(id) {
    return !!localStorage.getItem(PREFIX + id);
  }

  function getAll() {
    return REGISTRY.map(function(a) {
      var ts = localStorage.getItem(PREFIX + a.id);
      return { id: a.id, emoji: a.emoji, title: a.title, desc: a.desc, reward: a.reward || '', unlocked: !!ts, date: ts || null };
    });
  }

  function getUnlockedCount() {
    return REGISTRY.filter(function(a) { return !!localStorage.getItem(PREFIX + a.id); }).length;
  }

  function _checkRemedy() {
    if (getUnlockedCount() >= 40) unlock('pw_remedy_lifer');
  }

  function trackPageVisit(page) {
    try {
      var raw = localStorage.getItem(PREFIX + '_visited') || '{}';
      var visited = JSON.parse(raw);
      visited[page] = 1;
      localStorage.setItem(PREFIX + '_visited', JSON.stringify(visited));
      var keys = Object.keys(visited);
      if (visited.home && visited.tools && visited.docs) {
        var allTools = ['duct_sizer','vav_sizer','fan_static','pipe_sizer','heating_loop','louver_sizer','unit_converter','psychrometric'];
        var visitedAll = allTools.every(function(t) { return !!visited[t]; });
        if (visitedAll) unlock('pw_tool_tourist');
      }
    } catch (e) {}
  }

  function trackSubtool(name) {
    try {
      var raw = localStorage.getItem(PREFIX + '_subtools') || '[]';
      var list = JSON.parse(raw);
      if (list.indexOf(name) < 0) list.push(name);
      localStorage.setItem(PREFIX + '_subtools', JSON.stringify(list));
    } catch (e) {}
  }

  function trackEggFound(query) {
    try {
      var raw = localStorage.getItem(PREFIX + '_eggs_found') || '[]';
      var list = JSON.parse(raw);
      if (list.indexOf(query) < 0) list.push(query);
      localStorage.setItem(PREFIX + '_eggs_found', JSON.stringify(list));
      unlock('pw_egg_found');
    } catch (e) {}
  }

  function trackNameChange() {
    try {
      var count = parseInt(localStorage.getItem(PREFIX + '_nameChanges') || '0', 10) + 1;
      localStorage.setItem(PREFIX + '_nameChanges', '' + count);
      if (count >= 3) unlock('pw_identity_crisis');
    } catch (e) {}
  }

  function trackSearch() {
    try {
      var count = parseInt(localStorage.getItem(PREFIX + '_searchCount') || '0', 10) + 1;
      localStorage.setItem(PREFIX + '_searchCount', '' + count);
      if (count >= 100) unlock('pw_search_party');
    } catch (e) {}
  }

  function trackDayVisit() {
    try {
      var today = new Date().toISOString().slice(0, 10);
      var raw = localStorage.getItem(PREFIX + '_dayVisits') || '[]';
      var days = JSON.parse(raw);
      if (days[days.length - 1] !== today) {
        days.push(today);
        if (days.length > 14) days = days.slice(-14);
        localStorage.setItem(PREFIX + '_dayVisits', JSON.stringify(days));
      }
      if (days.length >= 7) {
        var last7 = days.slice(-7);
        var streak = true;
        for (var i = 1; i < last7.length; i++) {
          var prev = new Date(last7[i-1]); var curr = new Date(last7[i]);
          var diff = (curr - prev) / 86400000;
          if (diff !== 1) { streak = false; break; }
        }
        if (streak) unlock('pw_seven_day_streak');
      }
    } catch (e) {}
  }

  function checkPageLoad() {
    try {
      var hr = new Date().getHours();
      if (hr >= 22 || hr < 2) unlock('pw_night_owl');
      if (hr >= 0 && hr < 4) unlock('pw_deadline_eng');
      if (hr >= 4 && hr < 6) unlock('pw_early_bird');
    } catch (e) {}

    trackDayVisit();

    try {
      var path = location.pathname.replace(/\\/g, '/').split('/').pop() || '';
      if (/Remedy_Home/i.test(path))            trackPageVisit('home');
      else if (/Remedy_Tools/i.test(path))      trackPageVisit('tools');
      else if (/Training_Library/i.test(path))  trackPageVisit('docs');
      else if (/Remedy_Profile/i.test(path))    { trackPageVisit('profile'); unlock('pw_profile_visitor'); }
      else if (/Duct_Sizer/i.test(path))        { trackPageVisit('duct_sizer');    trackSubtool('Duct_Sizer'); }
      else if (/VAV_Sizer/i.test(path))         { trackPageVisit('vav_sizer');     trackSubtool('VAV_Sizer'); }
      else if (/Fan_Static/i.test(path))        { trackPageVisit('fan_static');    trackSubtool('Fan_Static'); }
      else if (/pipe-sizer/i.test(path))        { trackPageVisit('pipe_sizer');    trackSubtool('pipe_sizer'); }
      else if (/Heating_Loop/i.test(path))      { trackPageVisit('heating_loop');  trackSubtool('Heating_Loop'); }
      else if (/Louver_Sizer/i.test(path))      { trackPageVisit('louver_sizer');  trackSubtool('Louver_Sizer'); }
      else if (/Unit_Converter/i.test(path))    { trackPageVisit('unit_converter');trackSubtool('Unit_Converter'); }
      else if (/Psychrometric/i.test(path))     { trackPageVisit('psychrometric'); trackSubtool('Psychrometric'); }
    } catch (e) {}

    try {
      if (typeof __favsAPI !== 'undefined') {
        var favs = __favsAPI.load();
        if (favs.length >= 5) unlock('pw_bookworm');
      }
    } catch (e) {}

    try {
      if (localStorage.getItem('remedy_egg_fresh_air')) unlock('pw_fresh_air');
      if (localStorage.getItem('remedy_egg_deadline_date')) unlock('pw_deadline_eng');
    } catch (e) {}
  }

  return {
    REGISTRY: REGISTRY,
    unlock: unlock,
    isUnlocked: isUnlocked,
    getAll: getAll,
    getUnlockedCount: getUnlockedCount,
    trackPageVisit: trackPageVisit,
    trackSubtool: trackSubtool,
    trackEggFound: trackEggFound,
    trackNameChange: trackNameChange,
    trackSearch: trackSearch,
    trackDayVisit: trackDayVisit,
    checkPageLoad: checkPageLoad
  };
})();

/* Auto-run page-load tracking (replaces the per-page __achievementsAPI.checkPageLoad() call). */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { __achievementsAPI.checkPageLoad(); });
} else {
  __achievementsAPI.checkPageLoad();
}
