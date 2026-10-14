/*
  zv-contact-fab.js — floating contact button (S-02). Markup: snippets/zv-contact-fab.liquid.
  Toggles the panel, keeps aria-expanded in sync, closes on Escape (focus back on the
  button), on a click outside, and after one of the options is chosen.
*/
(function (document) {
  'use strict';

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

    panel.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) setOpen(false);
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
