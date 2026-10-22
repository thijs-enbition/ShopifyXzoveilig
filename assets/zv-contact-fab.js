/*
  zv-contact-fab.js — floating contact button (S-02). Markup: snippets/zv-contact-fab.liquid.
  Toggles the panel, keeps aria-expanded in sync, closes on Escape (focus back on the
  button), on a click outside, and after one of the options is chosen.
  "Chat met ons" forwards to Odoo's livechat button (.o-livechat-LivechatButton, inside the
  open shadow root of .o-livechat-root), which mounts late (deferred scripts), so the click is retried for ~18s (silent no-op if it never mounts).
*/
(function (document) {
  'use strict';

  // Odoo mounts its livechat button inside an open shadow root on .o-livechat-root, which
  // document.querySelector can't reach: look it up through the host's shadowRoot.
  function getOdooBtn() {
    var host = document.querySelector('.o-livechat-root');
    var root = host && host.shadowRoot;
    return root ? root.querySelector('.o-livechat-LivechatButton') : null;
  }

  // Odoo's injected stylesheet beats the CSS rule on specificity/order, so also hide the
  // bubble inline (inline !important wins) and again whenever Odoo redraws it.
  function hideOdooBubble() {
    var btn = getOdooBtn();
    if (btn) btn.style.setProperty('display', 'none', 'important');
  }

  // The host div and its shadowRoot both attach late: poll for the shadowRoot, then observe
  // it directly (an observer outside the shadow tree can't see mutations inside it).
  (function watchOdooShadow() {
    var host = document.querySelector('.o-livechat-root');
    var root = host && host.shadowRoot;
    if (!root) { setTimeout(watchOdooShadow, 200); return; }
    hideOdooBubble();
    new MutationObserver(hideOdooBubble).observe(root, { childList: true, subtree: true });
  })();

  function ready() {
    var root = document.querySelector('[data-zv-fab]');
    if (!root) return;
    var toggle = root.querySelector('[data-zv-fab-toggle]');
    var panel = root.querySelector('[data-zv-fab-panel]');
    if (!toggle || !panel) return;

    function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
    }

    toggle.addEventListener('click', function () { setOpen(!isOpen()); });

    function openChat() {
      var tries = 0;
      (function attempt() {
        var btn = getOdooBtn();
        if (btn) { btn.click(); return; }
        if (++tries >= 60) return;
        setTimeout(attempt, 300);
      })();
    }

    panel.addEventListener('click', function (e) {
      var chat = e.target.closest && e.target.closest('[data-zv-fab-chat]');
      if (chat) {
        setOpen(false);
        openChat();
      } else if (e.target.closest && e.target.closest('a')) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (isOpen() && !root.contains(e.target)) setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})(document);
