/* Zo Veilig offertewizard (2026-11-17). Drives sections/zelf-samenstellen-wizard.liquid: four questions,
   one at a time. It computes nothing about price. On the last step it fires `zv-wizard:apply` on document
   with { cats, description, floors, extraFloors } and scrolls to the grid (#winkel); the grid
   (sections/zelf-samenstellen.liquid) filters its cards to `cats`, shows the Woning note and puts
   `description` in the callback form's hidden #ccDescription, which the lead sends as `description`.

   The question -> category mapping is NOT in this file: every option carries data-cats / data-d /
   data-floors in the section markup. The grid filter is the union of Q1's and Q4's data-cats.
   docs/zelf-samenstellen-wizard-2026-11-17.md has the table. */
(function () {
  'use strict';
  var root = document.querySelector('[data-zv-wizard]');
  if (!root) return;

  var form = root.querySelector('#zvwForm');
  var steps = Array.prototype.slice.call(form.querySelectorAll('.zvw-step'));
  var bar = root.querySelector('#zvwBar');
  var count = root.querySelector('#zvwCount');
  var err = root.querySelector('#zvwErr');
  var back = root.querySelector('#zvwBack');
  var next = root.querySelector('#zvwNext');
  var cur = 0;

  function checked(name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked'));
  }
  function words(s) { return (s || '').split(/\s+/).filter(Boolean); }

  function clearMissing() {
    err.hidden = true;
    steps.forEach(function (s) { s.classList.remove('is-missing'); });
  }

  function show(i, moveFocus) {
    cur = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function (s, n) { s.hidden = n !== cur; });
    bar.style.width = ((cur + 1) / steps.length * 100) + '%';
    count.textContent = 'Vraag ' + (cur + 1) + ' van ' + steps.length;
    back.hidden = cur === 0;
    next.textContent = cur === steps.length - 1 ? 'Toon mijn selectie' : 'Volgende';
    clearMissing();
    if (moveFocus) {
      var lg = steps[cur].querySelector('legend');
      if (lg) lg.focus({ preventScroll: true });
    }
  }

  function answered(step) {
    return checked(step.getAttribute('data-name')).length > 0;
  }

  /* Answers -> what the grid needs. Only the data attributes are read, never the label text. */
  function compute() {
    var q1 = checked('beveiliging'), q2 = checked('woning')[0], q3 = checked('etages')[0], q4 = checked('camera')[0];
    var cats = [];
    function addCats(el) { words(el.getAttribute('data-cats')).forEach(function (c) { if (cats.indexOf(c) < 0) cats.push(c); }); }
    q1.forEach(addCats);
    if (q4) addCats(q4);
    var floors = q3 ? parseInt(q3.getAttribute('data-floors'), 10) : 1;
    var parts = [
      'Beveiliging: ' + q1.map(function (e) { return e.getAttribute('data-d'); }).join(', '),
      'Woning: ' + q2.getAttribute('data-d'),
      'Etages: ' + floors,
      'Camera: ' + q4.getAttribute('data-d')
    ];
    return {
      cats: cats,
      floors: floors,
      extraFloors: floors >= 2,
      description: 'Offertewizard: ' + parts.join('; ')
    };
  }

  function apply() {
    var detail = compute();
    document.dispatchEvent(new CustomEvent('zv-wizard:apply', { detail: detail }));
    var grid = document.getElementById('winkel');
    if (grid) {
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      grid.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
      var note = document.getElementById('zvMatchNote');
      if (note && !note.hidden) note.focus({ preventScroll: true });
    }
  }

  form.addEventListener('change', clearMissing);

  back.addEventListener('click', function () { show(cur - 1, true); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var step = steps[cur];
    if (!answered(step)) {
      step.classList.add('is-missing');
      err.textContent = cur === 0 ? 'Kies minstens één optie.' : 'Kies een antwoord om verder te gaan.';
      err.hidden = false;
      var first = step.querySelector('input'); if (first) first.focus();
      return;
    }
    if (cur < steps.length - 1) { show(cur + 1, true); return; }
    /* Last step: re-check the earlier ones (Back lets a visitor change an answer, never empty one, but
       a checkbox of Q1 can be unticked, so Q1 is validated again). */
    for (var i = 0; i < steps.length; i++) {
      if (!answered(steps[i])) { show(i, true); steps[i].classList.add('is-missing'); err.textContent = 'Beantwoord eerst deze vraag.'; err.hidden = false; return; }
    }
    apply();
  });

  show(0, false);
})();
