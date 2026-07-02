/* ============================================================
   Remedy Toolbox — Branded calculation report (SHARED)
   Loaded by report-worthy tools via:
     <script src="../shared/report.js?v=1"></script>
   Then call:
     RemedyReport.print({
       title:    'Fan Static Pressure',
       subtitle: 'SMACNA / ASHRAE method',     // optional method line
       project:  { name, number, location, system, description, engineer },
       inputs:   [ {label, value, unit} | [label,value,unit], ... ],
       steps:    [ {label, eq, result}, ... ],            // optional
       results:  [ {label, value, unit, check}, ... ],    // check optional
       verdict:  { pass:true, text:'...' },               // optional
       notes:    'disclaimer / method note'               // optional
     });
   The report is built into a hidden <div class="remedy-report">, then printed
   (Ctrl-P / Save as PDF). One module, every tool — edit the look here only.
   ============================================================ */
(function () {
  'use strict';

  // Resolve the logo relative to THIS script (works from SubTools/ and root).
  var me = (document.currentScript && document.currentScript.src) || '';
  function rel(p) { try { return me ? new URL(p, me).href : p; } catch (e) { return p; } }
  var LOGO = rel('remedy-logo.png');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }
  function val(s) { s = (s == null ? '' : String(s)).trim(); return s ? esc(s) : '—'; }
  function item(x) { return Array.isArray(x) ? { label:x[0], value:x[1], unit:x[2], check:x[3] } : (x || {}); }

  function injectCss() {
    if (document.getElementById('remedy-report-css')) return;
    var st = document.createElement('style');
    st.id = 'remedy-report-css';
    st.textContent =
      '.remedy-report{display:none;}' +
      '@page{size:letter portrait;margin:0.5in;}' +
      '@media print{' +
      ' body>*:not(.remedy-report){display:none !important;}' +
      ' .remedy-report{display:block !important;color:#2B2B2B;font-family:Calibri,"Segoe UI",Tahoma,sans-serif;}' +
      ' .rr-head{display:flex;align-items:center;justify-content:space-between;gap:12pt;padding-bottom:6pt;border-bottom:3pt solid #ef702d;}' +
      ' .rr-head-left{display:flex;align-items:center;gap:10pt;}' +
      ' .rr-head img{height:40pt;}' +
      ' .rr-div{width:0.5pt;height:32pt;background:#BFBFBF;}' +
      ' .rr-eyebrow{font-size:7pt;font-weight:bold;letter-spacing:1.5pt;text-transform:uppercase;color:#c45a1e;}' +
      ' .rr-title{font-size:16pt;font-weight:bold;color:#2B2B2B;line-height:1.1;margin:1pt 0 0;}' +
      ' .rr-sub{font-size:8.5pt;color:#595959;}' +
      ' .rr-meta{text-align:right;font-size:8pt;color:#595959;line-height:1.35;}' +
      ' .rr-meta b{color:#2B2B2B;}' +
      ' .rr-sec{background:#2B2B2B;color:#fff;font-weight:bold;font-size:8pt;padding:3pt 8pt;letter-spacing:1.5pt;text-transform:uppercase;border-bottom:2pt solid #ef702d;margin-top:10pt;}' +
      ' .rr-proj{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3pt 14pt;padding:6pt 8pt;border:0.5pt solid #BFBFBF;border-top:none;font-size:9pt;}' +
      ' .rr-proj .f{display:flex;flex-direction:column;}' +
      ' .rr-proj .f.full{grid-column:1/-1;}' +
      ' .rr-proj .l{font-size:7pt;font-weight:bold;letter-spacing:1pt;text-transform:uppercase;color:#595959;margin-bottom:1pt;}' +
      ' .rr-proj .v{font-size:9.5pt;color:#2B2B2B;font-weight:bold;border-bottom:0.5pt solid #DDD;padding-bottom:1pt;min-height:11pt;}' +
      ' .rr-block{border:0.5pt solid #BFBFBF;border-top:none;padding:5pt 8pt 6pt;}' +
      ' .rr-block table{width:100%;border-collapse:collapse;font-size:9pt;}' +
      ' .rr-block td{padding:2pt 0;border-bottom:0.5pt dotted #CCC;vertical-align:top;}' +
      ' .rr-block tr:last-child td{border-bottom:none;}' +
      ' .rr-block td.l{color:#595959;}' +
      ' .rr-block td.v{text-align:right;font-weight:bold;color:#c45a1e;font-variant-numeric:tabular-nums;white-space:nowrap;}' +
      ' .rr-block td.u{color:#595959;font-size:7.5pt;text-align:right;padding-left:4pt;white-space:nowrap;width:1%;}' +
      ' .rr-block td.c{text-align:right;font-size:8pt;font-weight:bold;padding-left:6pt;white-space:nowrap;width:1%;}' +
      ' .rr-block td.c.ok{color:#1b7f3a;} .rr-block td.c.bad{color:#B00000;}' +
      ' .rr-calc .step{margin-bottom:4pt;font-size:8.5pt;} .rr-calc .step:last-child{margin-bottom:0;}' +
      ' .rr-calc .step b{display:block;font-size:7.5pt;letter-spacing:0.8pt;text-transform:uppercase;color:#2B2B2B;}' +
      ' .rr-calc .step .eq{font-family:Consolas,"Courier New",monospace;font-size:8.5pt;}' +
      ' .rr-calc .step .res{font-weight:bold;color:#c45a1e;}' +
      ' .rr-verdict{margin-top:6pt;padding:6pt 10pt;font-weight:bold;font-size:10pt;border-left:3pt solid;}' +
      ' .rr-verdict.pass{background:#e8edda;border-color:#839053;color:#1b7f3a;}' +
      ' .rr-verdict.fail{background:#FBE5D6;border-color:#B00000;color:#B00000;}' +
      ' .rr-foot{margin-top:8pt;padding-top:4pt;border-top:1pt solid #2B2B2B;display:flex;justify-content:space-between;font-size:7pt;color:#595959;}' +
      ' .rr-foot .d{max-width:4.8in;line-height:1.35;font-style:italic;}' +
      ' .rr-foot .s{text-align:right;line-height:1.35;} .rr-foot .s b{color:#2B2B2B;}' +
      ' .remedy-report,.rr-block,.rr-proj{page-break-inside:avoid;break-inside:avoid;}' +
      '}';
    document.head.appendChild(st);
  }

  function rowsHtml(arr) {
    return (arr || []).map(function (x) {
      var it = item(x);
      var chk = it.check ? '<td class="c ' + (/over|fail|✗|exceed|bad/i.test(it.check) ? 'bad' : 'ok') + '">' + esc(it.check) + '</td>' : '<td class="c"></td>';
      return '<tr><td class="l">' + esc(it.label) + '</td><td class="v">' + esc(it.value == null ? '' : it.value) + '</td><td class="u">' + esc(it.unit || '') + '</td>' + chk + '</tr>';
    }).join('');
  }

  function build(p) {
    p = p || {};
    var pj = p.project || {};
    var d = new Date();
    var date = d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });

    var html = '<div class="rr-head">' +
      '<div class="rr-head-left">' +
        '<img src="' + esc(LOGO) + '" alt="Remedy Engineering" onerror="this.style.display=\'none\'">' +
        '<div class="rr-div"></div>' +
        '<div><div class="rr-eyebrow">Remedy Engineering · Calculation Report</div>' +
        '<div class="rr-title">' + esc(p.title || 'Calculation') + '</div>' +
        (p.subtitle ? '<div class="rr-sub">' + esc(p.subtitle) + '</div>' : '') + '</div>' +
      '</div>' +
      '<div class="rr-meta"><div><b>Date:</b> ' + esc(date) + '</div>' +
        '<div><b>Prepared by:</b> ' + val(pj.engineer || 'Remedy Engineering') + '</div>' +
        (p.subtitle ? '<div><b>Method:</b> ' + esc(p.subtitle) + '</div>' : '') + '</div>' +
    '</div>';

    html += '<div class="rr-sec">Project Information</div>' +
      '<div class="rr-proj">' +
        '<div class="f"><span class="l">Project Name</span><span class="v">' + val(pj.name) + '</span></div>' +
        '<div class="f"><span class="l">Project Number</span><span class="v">' + val(pj.number) + '</span></div>' +
        '<div class="f"><span class="l">Location</span><span class="v">' + val(pj.location) + '</span></div>' +
        '<div class="f"><span class="l">System / Tag</span><span class="v">' + val(pj.system) + '</span></div>' +
        '<div class="f full"><span class="l">Description</span><span class="v">' + val(pj.description) + '</span></div>' +
      '</div>';

    if (p.inputs && p.inputs.length) {
      html += '<div class="rr-sec">Design Inputs</div><div class="rr-block"><table>' + rowsHtml(p.inputs) + '</table></div>';
    }
    if (p.steps && p.steps.length) {
      html += '<div class="rr-sec">Calculation</div><div class="rr-block rr-calc">' +
        p.steps.map(function (s) {
          s = s || {};
          return '<div class="step"><b>' + esc(s.label || '') + '</b>' +
            (s.eq ? '<div class="eq">' + esc(s.eq) + '</div>' : '') +
            (s.result != null ? '<div class="res">= ' + esc(s.result) + '</div>' : '') + '</div>';
        }).join('') + '</div>';
    }
    if (p.results && p.results.length) {
      html += '<div class="rr-sec">Results</div><div class="rr-block"><table>' + rowsHtml(p.results) + '</table></div>';
    }
    if (p.verdict) {
      html += '<div class="rr-verdict ' + (p.verdict.pass ? 'pass' : 'fail') + '">' + esc(p.verdict.text || (p.verdict.pass ? '✓ PASS' : '✗ FAIL')) + '</div>';
    }

    html += '<div class="rr-foot">' +
      '<div class="d">' + esc(p.notes || 'For preliminary engineering use. Confirm against the governing code and project requirements before issuing for construction.') + '</div>' +
      '<div class="s"><b>Remedy Engineering</b><br>' + esc(p.title || '') + '</div>' +
    '</div>';
    return html;
  }

  var RemedyReport = {
    print: function (payload) {
      injectCss();
      var el = document.querySelector('.remedy-report');
      if (!el) { el = document.createElement('div'); el.className = 'remedy-report'; document.body.appendChild(el); }
      el.innerHTML = build(payload);
      // let the DOM settle (image/layout) before printing
      setTimeout(function () { window.print(); }, 60);
    },
    // Render to the hidden div without printing (for preview/testing).
    render: function (payload) {
      injectCss();
      var el = document.querySelector('.remedy-report');
      if (!el) { el = document.createElement('div'); el.className = 'remedy-report'; document.body.appendChild(el); }
      el.innerHTML = build(payload);
      return el;
    }
  };
  window.RemedyReport = RemedyReport;
})();
