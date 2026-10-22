/*
  zv-contact-fab.js — floating contact button (S-02). Markup: snippets/zv-contact-fab.liquid.
  Toggles the panel, keeps aria-expanded in sync, closes on Escape (focus back on the
  button), on a click outside, and after one of the options is chosen.
  "Chat met ons" forwards to Odoo's livechat button (.o-livechat-LivechatButton), which is
  hidden in CSS and mounts late (deferred scripts), so the click is retried for ~5s.
*/
(function (document) {
  'use strict';

  // Odoo's injected stylesheet beats the CSS rule on specificity/order, so also hide the
  // bubble inline (inline !important wins) and again whenever Odoo redraws it.
  function hideOdooBubble() {
    var btn = document.querySelector('.o-livechat-LivechatButton');
    if (btn) btn.style.setProperty('display', 'none', 'important');
  }
  hideOdooBubble();
  new MutationObserver(hideOdooBubble).observe(document.documentElement, { childList: true, subtree: true });

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

    function openChat(fallbackHref) {
      var tries = 0;
      (function attempt() {
        var btn = document.querySelector('.o-livechat-LivechatButton');
        if (btn) { btn.click(); return; }
        if (++tries >= 25) {
          if (fallbackHref) window.location.href = fallbackHref;
          return;
        }
        setTimeout(attempt, 200);
      })();
    }

    panel.addEventListener('click', function (e) {
      var chat = e.target.closest && e.target.closest('[data-zv-fab-chat]');
      if (chat) {
        setOpen(false);
        openChat(chat.getAttribute('data-fallback-href'));
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
