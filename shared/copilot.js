/* ============================================================
   Remedy Toolbox — Ask-Copilot search fallback (SHARED)
   Loaded by the hub pages AFTER search.js via:
     <script src="shared/copilot.js?v=1"></script>
   Mode switch is at the top (handoff / api / local). See DEVELOPER_GUIDE.md.
   ============================================================ */
/* ============================================================
   COPILOT — local AI fallback for the search bar.
   When the programmed INDEX has no good answer (or the user
   clicks "Ask Copilot"), the query is sent to a LOCAL,
   OpenAI-compatible chat endpoint running on the internal
   network. No cloud, no embedded secret.
   ============================================================ */
const COPILOT = {
  // ===== HOW COPILOT ANSWERS — flip one switch to change everything =====
  // mode:
  //   'handoff' (ACTIVE) → opens each user's Microsoft Copilot in a new tab with the
  //                        question pre-filled. No setup; uses the Copilot they already have.
  //   'api'              → inline answers in the dropdown, via YOUR internal M365 Copilot
  //                        proxy (set apiEndpoint). The proxy holds the Entra ID auth and must
  //                        return OpenAI-style JSON: { choices:[{ message:{ content } }] }.
  //   'local'            → inline answers from a local OpenAI-compatible server (Ollama/LM Studio).
  // When IT has the M365 Copilot proxy live, switch over by setting:  mode: 'api'
  // (everything else is already wired — no other code change needed).
  mode: 'handoff',

  // ---- Handoff (Option 1, active now) ----
  handoffTarget: 'm365',                            // 'm365' = work Copilot, 'web' = consumer
  m365Url: 'https://m365.cloud.microsoft/chat/',    // Microsoft 365 Copilot (work)
  webUrl:  'https://copilot.microsoft.com/',        // Microsoft Copilot (web)

  // ---- Inline (Option 2 = 'api', or 'local') ----
  apiEndpoint:   '/api/copilot/chat',               // ← your future M365 Copilot proxy URL
  localEndpoint: 'http://localhost:11434/v1/chat/completions',
  model: 'llama3.1',
  apiKey: '',                                       // only if your proxy/server needs one
  temperature: 0.2,
  maxTokens: 700
};

function copilotCfg() {
  const ls = k => { try { return (localStorage.getItem(k) || '').trim(); } catch (_) { return ''; } };
  const mode = ls('remedy.copilot.mode') || COPILOT.mode;
  const endpoint = (mode === 'api')
    ? (ls('remedy.copilot.apiEndpoint') || COPILOT.apiEndpoint)
    : (ls('remedy.copilot.endpoint')    || COPILOT.localEndpoint);
  return {
    mode: mode,
    handoffTarget: ls('remedy.copilot.handoffTarget') || COPILOT.handoffTarget,
    m365Url: COPILOT.m365Url,
    webUrl:  COPILOT.webUrl,
    endpoint: endpoint,
    model:  ls('remedy.copilot.model')  || COPILOT.model,
    apiKey: ls('remedy.copilot.apiKey') || COPILOT.apiKey,
    temperature: COPILOT.temperature,
    maxTokens: COPILOT.maxTokens
  };
}

function copilotEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// Compact catalog of the toolbox so the model can recommend the right tool/doc.
function copilotCatalog() {
  const seen = new Set();
  const lines = [];
  try {
    for (const e of INDEX) {
      if (!e || !e.title || !['tool', 'train', 'ref', 'soon'].includes(e.kind)) continue;
      const key = e.kind + '|' + e.title;
      if (seen.has(key)) continue;
      seen.add(key);
      const tag = e.kind === 'tool' ? 'Tool' : e.kind === 'train' ? 'Doc' : e.kind === 'ref' ? 'Reference' : 'Coming soon';
      const d = (e.desc || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      lines.push('- [' + tag + '] ' + e.title + (d ? ': ' + d : ''));
      if (lines.length >= 60) break;
    }
  } catch (_) {}
  return lines.join('\n');
}

function copilotSystemPrompt() {
  return [
    'You are the Remedy Engineering Copilot, embedded in the internal HVAC/plumbing design toolbox of Remedy Engineering (a Canadian mechanical / MEP consulting firm).',
    'Help engineers with HVAC, plumbing, fire protection, ventilation and building-systems design questions. Reference Canadian codes (NBC, NPC, CSA B149, ASHRAE) where relevant.',
    'When a Remedy tool or document fits the question, recommend it by name from the catalog below.',
    'Be concise and practical. Show the method or formula when a calculation is involved. If something is outside scope or you are unsure, say so plainly.',
    'For any code-, safety- or sizing-critical result, remind the user to verify against the governing code and their own engineering judgment.',
    '',
    'Remedy tools & documents available in this toolbox:',
    copilotCatalog()
  ].join('\n');
}

// Minimal, safe markdown → HTML (input is escaped first).
function copilotMarkdown(src) {
  let s = copilotEsc(src);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines = s.split(/\r?\n/);
  let out = '', listType = null;
  const closeList = () => { if (listType) { out += '</' + listType + '>'; listType = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    let m;
    if ((m = line.match(/^#{1,6}\s+(.*)$/)))      { closeList(); out += '<div class="copilot-h">' + m[1] + '</div>'; continue; }
    if ((m = line.match(/^[-*]\s+(.*)$/)))        { if (listType !== 'ul') { closeList(); out += '<ul>'; listType = 'ul'; } out += '<li>' + m[1] + '</li>'; continue; }
    if ((m = line.match(/^\d+[.)]\s+(.*)$/)))     { if (listType !== 'ol') { closeList(); out += '<ol>'; listType = 'ol'; } out += '<li>' + m[1] + '</li>'; continue; }
    closeList(); out += '<p>' + line + '</p>';
  }
  closeList();
  return out;
}

function copilotCtaHtml(q, primary) {
  const qe = copilotEsc(q);
  const sub = (copilotCfg().mode === 'handoff')
    ? 'Opens your Microsoft Copilot in a new tab.'
    : 'Answered inline by Copilot — always verify before use.';
  if (primary) {
    return `<div class="copilot-cta copilot-cta--primary">
      <button type="button" class="copilot-ask copilot-ask--primary" data-q="${qe}">
        <span class="copilot-spark">🤖</span>
        <span class="copilot-cta-text"><b>Ask Copilot</b> about &ldquo;${qe}&rdquo;</span>
        <span class="copilot-kbd">↵ Enter</span>
      </button>
      <div class="copilot-cta-sub">${sub}</div>
    </div>`;
  }
  return `<div class="copilot-cta">
    <button type="button" class="copilot-ask" data-q="${qe}">
      <span class="copilot-spark">🤖</span>
      <span class="copilot-cta-text">Ask Copilot about &ldquo;${qe}&rdquo;</span>
    </button>
  </div>`;
}

function copilotPanelHtml(q) {
  return `<div class="copilot-panel">
    <div class="copilot-head">
      <span class="copilot-spark">🤖</span>
      <span class="copilot-title">Remedy Copilot</span>
      <span class="copilot-config" title="Configure local AI endpoint">⚙</span>
    </div>
    <div class="copilot-q">${copilotEsc(q)}</div>
    <div class="copilot-body"><div class="copilot-thinking"><span class="copilot-dot"></span><span class="copilot-dot"></span><span class="copilot-dot"></span> Thinking locally…</div></div>
  </div>`;
}

function copilotErrorHtml(cfg, msg) {
  const isApi = cfg.mode === 'api';
  const what = isApi ? 'the Microsoft 365 Copilot service' : 'the local AI server';
  const hint = isApi
    ? `Expected your M365 Copilot proxy at <code>${copilotEsc(cfg.endpoint)}</code> to answer. Make sure the proxy is deployed and you're signed in, then ask again.`
    : `Expected an OpenAI-compatible endpoint at <code>${copilotEsc(cfg.endpoint)}</code> (model <code>${copilotEsc(cfg.model)}</code>). Make sure your local AI server (Ollama, LM Studio, …) is running and allows requests from this page, then ask again.`;
  return `<div class="copilot-error">
    <b>Copilot couldn't reach ${what}.</b>
    <div class="copilot-error-msg">${copilotEsc(msg || '')}</div>
    <div class="copilot-error-hint">${hint}<br>Use ⚙ to change how Copilot is wired.</div>
  </div>`;
}

// Dispatcher — hand off to Microsoft Copilot, or answer inline (api / local).
function askCopilot(q) {
  const cfg = copilotCfg();
  if (cfg.mode === 'handoff') return copilotHandoff(q, cfg);
  return copilotInline(q, cfg);
}

// Robust copy — works on plain http (internal servers), where navigator.clipboard is blocked.
function copilotCopy(text) {
  try {
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) { return false; }
}

// ---- Option 1: hand the question to the user's Microsoft Copilot (ACTIVE) ----
// Copilot does not reliably accept a pre-filled prompt via URL, so we copy the
// question to the clipboard and tell the user to paste it.
function copilotHandoff(q, cfg) {
  q = (q || '').trim();
  if (!q) return;
  try { __achievementsAPI && __achievementsAPI.trackSearch && __achievementsAPI.trackSearch(); } catch (_) {}
  const base = (cfg.handoffTarget === 'web') ? cfg.webUrl : cfg.m365Url;
  const url = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'q=' + encodeURIComponent(q);
  const copied = copilotCopy(q);
  const win = window.open(url, '_blank');
  if (win) { try { win.opener = null; } catch (_) {} }
  drop.classList.add('open');
  drop.innerHTML = copilotHandoffHtml(q, url, copied, !win);
}

function copilotHandoffHtml(q, url, copied, blocked) {
  const ue = copilotEsc(url);
  return `<div class="copilot-panel">
    <div class="copilot-head">
      <span class="copilot-spark">🤖</span>
      <span class="copilot-title">Microsoft Copilot</span>
      <span class="copilot-config" title="Configure Copilot">⚙</span>
    </div>
    <div class="copilot-q">${copilotEsc(q)}</div>
    <div class="copilot-body">
      <p>${blocked
        ? 'Your browser blocked the pop-up — <a href="' + ue + '" target="_blank" rel="noopener" class="copilot-open">open Copilot ↗</a>.'
        : 'Copilot opened in a new tab — <a href="' + ue + '" target="_blank" rel="noopener" class="copilot-open">↗ open it again</a> if needed.'}</p>
      <p class="copilot-foot">${copied
        ? '📋 Your question is <b>copied</b> — click in the Copilot box and press <b>Ctrl&nbsp;+&nbsp;V</b> to paste it.'
        : 'Copy your question and paste it into Copilot (the clipboard wasn\'t available).'}</p>
    </div>
  </div>`;
}

// ---- Option 2 ('api') / 'local': inline answer inside the dropdown ----
async function copilotInline(q, cfg) {
  q = (q || '').trim();
  if (!q) return;
  cfg = cfg || copilotCfg();
  try { __achievementsAPI && __achievementsAPI.trackSearch && __achievementsAPI.trackSearch(); } catch (_) {}

  drop.classList.add('open');
  drop.innerHTML = copilotPanelHtml(q);
  const bodyEl = drop.querySelector('.copilot-body');

  let data = null, errMsg = '';
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers['Authorization'] = 'Bearer ' + cfg.apiKey;
    const resp = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: headers,
      credentials: (cfg.mode === 'api') ? 'include' : 'same-origin',
      body: JSON.stringify({
        model: cfg.model,
        temperature: cfg.temperature,
        max_tokens: cfg.maxTokens,
        stream: false,
        messages: [
          { role: 'system', content: copilotSystemPrompt() },
          { role: 'user', content: q }
        ]
      })
    });
    if (!resp.ok) errMsg = 'Server returned ' + resp.status + ' ' + (resp.statusText || '') + '.';
    else data = await resp.json();
  } catch (e) {
    errMsg = (e && e.message) ? e.message : 'Network error.';
  }

  // The user may have kept typing — only write if our panel is still on screen.
  if (!bodyEl || !document.body.contains(bodyEl)) return;
  if (errMsg || !data) { bodyEl.innerHTML = copilotErrorHtml(cfg, errMsg); return; }

  const answer =
    (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
    (data.message && data.message.content) || '';
  if (!answer.trim()) { bodyEl.innerHTML = copilotErrorHtml(cfg, 'Copilot returned an empty response.'); return; }

  bodyEl.innerHTML =
    '<div class="copilot-md">' + copilotMarkdown(answer) + '</div>' +
    '<div class="copilot-foot">⚠ AI-generated and may be wrong — verify against codes and engineering judgment before use.</div>';
}

function copilotConfigure() {
  const cur = copilotCfg();
  const mode = prompt('Copilot mode:\n  handoff = open Microsoft Copilot in a new tab (current)\n  api     = inline answers via your M365 Copilot proxy\n  local   = inline answers from a local model server', cur.mode);
  if (mode === null) return;
  const m = (mode || '').trim().toLowerCase();
  try { localStorage.setItem('remedy.copilot.mode', m); } catch (_) {}
  if (m === 'handoff') {
    const t = prompt('Which Copilot? "m365" (work) or "web" (consumer):', cur.handoffTarget);
    if (t !== null) { try { localStorage.setItem('remedy.copilot.handoffTarget', (t || '').trim().toLowerCase()); } catch (_) {} }
  } else if (m === 'api') {
    const ep = prompt('M365 Copilot proxy endpoint (returns OpenAI-style JSON):', cur.endpoint);
    if (ep !== null) { try { localStorage.setItem('remedy.copilot.apiEndpoint', ep.trim()); } catch (_) {} }
  } else {
    const ep = prompt('Local AI endpoint (OpenAI-compatible chat-completions URL):', cur.endpoint);
    if (ep !== null) { try { localStorage.setItem('remedy.copilot.endpoint', ep.trim()); } catch (_) {} }
    const md = prompt('Model name:', cur.model);
    if (md !== null) { try { localStorage.setItem('remedy.copilot.model', md.trim()); } catch (_) {} }
  }
}

// Delegated clicks inside the dropdown (Ask Copilot / ⚙ configure).
drop.addEventListener('click', (e) => {
  const ask = e.target.closest('.copilot-ask');
  if (ask) { e.preventDefault(); askCopilot(ask.getAttribute('data-q') || inp.value); return; }
  if (e.target.closest('.copilot-config')) { e.preventDefault(); copilotConfigure(); }
});
