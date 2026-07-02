/* ============================================================
   Remedy Toolbox — Feedback widget (SHARED, self-mounting)
   Loaded by every page via:  <script src="shared/feedback.js?v=1"></script>
   (SubTools use ../shared/feedback.js?v=1)
   Injects its own styles + FAB button + modal + toast and wires submit.
   The formly.email ACCESS_KEY lives here, once.
   ============================================================ */
(function () {
  'use strict';
  function mountFeedback() {
    if (document.getElementById('remedy-fb-fab')) return;   // already mounted
    var styleEl = document.createElement('style');
    styleEl.textContent = `
  #remedy-fb-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 9000;
    background: #ef702d; color: #fff; border: none;
    padding: 12px 18px; border-radius: 28px;
    font-family: Calibri,"Segoe UI",Tahoma,sans-serif; font-size: 13px;
    font-weight: bold; letter-spacing: 1px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    cursor: pointer; transition: background 0.15s, transform 0.15s;
    display: flex; align-items: center; gap: 8px;
  }
  #remedy-fb-fab:hover { background: #c45a1e; transform: translateY(-2px); }
  #remedy-fb-fab .fb-icon { font-size: 16px; }
  #remedy-fb-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(43,43,43,0.55); z-index: 9100;
    display: none; align-items: center; justify-content: center;
  }
  #remedy-fb-overlay.open { display: flex; }
  #remedy-fb-modal {
    background: #fff; width: 480px; max-width: 92vw; max-height: 88vh;
    overflow-y: auto;
    border-top: 5px solid #ef702d;
    font-family: Calibri,"Segoe UI",Tahoma,sans-serif;
    color: #2B2B2B;
    box-shadow: 0 10px 40px rgba(0,0,0,0.35);
  }
  #remedy-fb-modal .fb-head {
    padding: 16px 20px 12px;
    border-bottom: 1px solid #BFBFBF;
    display: flex; justify-content: space-between; align-items: center;
  }
  #remedy-fb-modal .fb-head h2 { margin: 0; font-size: 18px; color: #2B2B2B; }
  #remedy-fb-modal .fb-head .fb-x {
    background: transparent; border: none; font-size: 24px;
    cursor: pointer; color: #8C8C8C; line-height: 1; padding: 0 4px;
  }
  #remedy-fb-modal .fb-head .fb-x:hover { color: #B00000; }
  #remedy-fb-modal .fb-body { padding: 16px 20px; }
  #remedy-fb-modal .fb-row { margin-bottom: 14px; }
  #remedy-fb-modal label {
    display: block; font-size: 11px; font-weight: bold;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: #c45a1e; margin-bottom: 4px;
  }
  #remedy-fb-modal .fb-page-display {
    font-size: 13px; color: #2B2B2B; font-weight: bold;
    padding: 6px 10px; background: #FFF4E0;
    border-left: 3px solid #ef702d;
  }
  #remedy-fb-modal select,
  #remedy-fb-modal textarea {
    width: 100%; font-family: inherit; font-size: 13px;
    border: 1px solid #BFBFBF; padding: 7px 9px;
    background: #fff; color: #2B2B2B;
    box-sizing: border-box;
  }
  #remedy-fb-modal textarea { min-height: 110px; resize: vertical; }
  #remedy-fb-modal select:focus,
  #remedy-fb-modal textarea:focus { outline: 2px solid #ef702d; outline-offset: -1px; }
  #remedy-fb-modal .fb-screenshot-note {
    background: #FFF4E0; border-left: 3px solid #99a668;
    padding: 8px 10px; font-size: 11px; color: #595959;
    line-height: 1.4;
  }
  #remedy-fb-modal .fb-screenshot-note b { color: #c45a1e; }
  #remedy-fb-modal .fb-foot {
    padding: 14px 20px; background: #F4F4F4;
    border-top: 1px solid #BFBFBF;
    display: flex; justify-content: flex-end; gap: 8px;
  }
  #remedy-fb-modal .fb-foot button {
    font-family: inherit; font-size: 13px; font-weight: bold;
    padding: 8px 16px; border: none; cursor: pointer;
    letter-spacing: 0.5px;
  }
  #remedy-fb-modal .fb-foot .fb-cancel {
    background: #fff; color: #2B2B2B; border: 1px solid #BFBFBF;
  }
  #remedy-fb-modal .fb-foot .fb-cancel:hover { background: #F4F4F4; }
  #remedy-fb-modal .fb-foot .fb-send {
    background: #99a668; color: #fff;
    display: inline-flex; align-items: center; gap: 8px;
  }
  #remedy-fb-modal .fb-foot .fb-send:hover { background: #839053; }
  #remedy-fb-modal .fb-foot .fb-send:disabled {
    background: #BFBFBF; cursor: not-allowed; opacity: 0.85;
  }
  #remedy-fb-modal .fb-spinner {
    width: 12px; height: 12px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: remedy-fb-spin 0.7s linear infinite;
    display: none;
  }
  #remedy-fb-modal .fb-foot .fb-send.is-sending .fb-spinner { display: inline-block; }
  @keyframes remedy-fb-spin { to { transform: rotate(360deg); } }
  #remedy-fb-toast {
    position: fixed; bottom: 80px; right: 24px;
    background: #2B2B2B; color: #FFF4E0;
    padding: 10px 16px; font-family: Calibri,sans-serif; font-size: 13px;
    border-left: 4px solid #99a668; z-index: 9200;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    opacity: 0; transform: translateY(10px);
    transition: opacity 0.2s, transform 0.2s;
    pointer-events: none;
    max-width: 360px;
  }
  #remedy-fb-toast.show { opacity: 1; transform: translateY(0); }
  @media print { #remedy-fb-fab, #remedy-fb-overlay, #remedy-fb-toast { display: none !important; } }
`;
    document.head.appendChild(styleEl);
    var wrap = document.createElement('div');
    wrap.innerHTML = `
<button id="remedy-fb-fab" type="button" aria-label="Send feedback">
  <span class="fb-icon">&#9993;</span><span>Feedback</span>
</button>

<div id="remedy-fb-overlay" role="dialog" aria-modal="true" aria-labelledby="remedy-fb-title">
  <div id="remedy-fb-modal">
    <div class="fb-head">
      <h2 id="remedy-fb-title">Send Feedback</h2>
      <button class="fb-x" id="remedy-fb-close" aria-label="Close">&times;</button>
    </div>
    <div class="fb-body">
      <div class="fb-row">
        <label>Page</label>
        <div class="fb-page-display" id="remedy-fb-page">&mdash;</div>
      </div>
      <div class="fb-row">
        <label for="remedy-fb-type">Type</label>
        <select id="remedy-fb-type">
          <option>Bug</option>
          <option>Suggestion</option>
          <option>Question</option>
          <option>General</option>
        </select>
      </div>
      <div class="fb-row">
        <label for="remedy-fb-comment">Comments</label>
        <textarea id="remedy-fb-comment" placeholder="What happened, what you expected, or what you'd like added&hellip;"></textarea>
      </div>
      <div class="fb-row">
        <div class="fb-screenshot-note">
          <b>Need to share a screenshot?</b> Email it separately to Colson and reference this page name &mdash; the page name is included automatically with every feedback message.
        </div>
      </div>
    </div>
    <div class="fb-foot">
      <button class="fb-cancel" id="remedy-fb-cancel" type="button">Cancel</button>
      <button class="fb-send" id="remedy-fb-send" type="button">
        <span class="fb-spinner"></span>
        <span class="fb-send-label">Send Feedback</span>
      </button>
    </div>
  </div>
</div>

<div id="remedy-fb-toast"></div>
`;
    while (wrap.firstChild) { document.body.appendChild(wrap.firstChild); }

(function() {
  'use strict';
  var ACCESS_KEY = 'aab66b178e7f443592bd3c906d930053';
  var ENDPOINT = 'https://formly.email/submit';

  var fab = document.getElementById('remedy-fb-fab');
  var overlay = document.getElementById('remedy-fb-overlay');
  var closeBtn = document.getElementById('remedy-fb-close');
  var cancelBtn = document.getElementById('remedy-fb-cancel');
  var sendBtn = document.getElementById('remedy-fb-send');
  var sendLabel = sendBtn.querySelector('.fb-send-label');
  var typeSel = document.getElementById('remedy-fb-type');
  var commentEl = document.getElementById('remedy-fb-comment');
  var pageEl = document.getElementById('remedy-fb-page');
  var toastEl = document.getElementById('remedy-fb-toast');

  function getPageLabel() {
    var t = (document.title || '').trim();
    if (t) return t;
    var p = location.pathname.split('/').pop() || 'Unknown';
    return p.replace(/\.html?$/i, '').replace(/_/g, ' ');
  }
  function lsGet(k) {
    try { return (localStorage.getItem(k) || '').trim(); } catch (_) { return ''; }
  }
  function getUserName() {
    return lsGet('remedy.userName.v1') || lsGet('remedy.user.name');
  }
  function getUserEmail() {
    return lsGet('remedy.email.v1') || lsGet('remedy.user.email') || lsGet('remedy.userEmail.v1');
  }

  function toast(msg, isError) {
    toastEl.textContent = msg;
    toastEl.style.borderLeftColor = isError ? '#B00000' : '#99a668';
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ toastEl.classList.remove('show'); }, 3500);
  }

  function openModal() {
    pageEl.textContent = getPageLabel();
    overlay.classList.add('open');
    setTimeout(function(){ commentEl.focus(); }, 30);
  }
  function closeModal() { overlay.classList.remove('open'); }

  fab.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  function setSending(isSending) {
    sendBtn.disabled = isSending;
    sendBtn.classList.toggle('is-sending', isSending);
    sendLabel.textContent = isSending ? 'Sending…' : 'Send Feedback';
    cancelBtn.disabled = isSending;
  }

  sendBtn.addEventListener('click', function() {
    var comment = (commentEl.value || '').trim();
    if (!comment) {
      toast('Please add a comment before sending.', true);
      commentEl.focus();
      return;
    }

    var name = getUserName() || '(not set)';
    var email = getUserEmail() || '(not set in profile)';
    var page = getPageLabel();
    var type = typeSel.value;
    var when = new Date().toLocaleString();

    var fd = new FormData();
    fd.append('access_key', ACCESS_KEY);
    fd.append('subject', 'Remedy Tools Feedback: ' + type + ' — ' + page);
    fd.append('from_name', 'Remedy Tools Feedback');
    if (email && email.indexOf('@') > 0) fd.append('replyto', email);
    fd.append('Tester', name);
    fd.append('Tester Email', email);
    fd.append('Page', page);
    fd.append('URL', location.href);
    fd.append('Type', type);
    fd.append('Submitted', when);
    fd.append('Comments', comment);

    setSending(true);

    fetch(ENDPOINT, { method: 'POST', body: fd })
      .then(function(res) { return res.json().then(function(json){ return { ok: res.ok, json: json }; }); })
      .then(function(r) {
        if (r.ok && r.json && r.json.success) {
          toast('Feedback sent — thanks!');
          setTimeout(function(){
            closeModal();
            commentEl.value = '';
            typeSel.selectedIndex = 0;
          }, 400);
        } else {
          var msg = (r.json && r.json.message) ? r.json.message : 'Server rejected the submission.';
          toast('Could not send: ' + msg, true);
        }
      })
      .catch(function(err) {
        var msg = (err && err.message) ? err.message : 'Network error.';
        toast('Send failed: ' + msg + ' — check your connection or firewall.', true);
      })
      .finally(function() {
        setSending(false);
      });
  });
})();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', mountFeedback); }
  else { mountFeedback(); }
})();
