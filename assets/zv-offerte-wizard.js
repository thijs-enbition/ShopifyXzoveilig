/* Zo Veilig offertewizard (2026-11-17). Drives sections/zelf-samenstellen-wizard.liquid on
   /pages/zelf-samenstellen: four questions, one at a time, then a result step.

   There is NO product grid any more (the grid-based version is superseded, see
   docs/zelf-samenstellen-wizard-2026-11-17.md). After Q4 the result step shows
     - first, right under the heading, the line "Ons advies: <package>." (static text, no link) when Q2's woning
       type has a package set. Nothing about the package is shown during the questions: visitors stay in the
       flow instead of being routed out,
     - then a plain list of the matched products, grouped by category (names only, no prices),
     - the Woning note from 2 etages,
     - the contact form (naam, e-mail, telefoon, toestemming).
   Submitting posts one lead to window.ZV_LEAD_ENDPOINT (Odoo) through window.ZVLeadWebhook with
   lead_type 'zelfsamenstellen' and a flat-string `description` (also sent as `message`, the key the
   contact lead already uses). The recommendation e-mail itself is an Odoo automation, not part of the
   theme. Nothing here touches the cart or shows a price.

   The question -> category mapping is NOT in this file: every option carries data-cats / data-d /
   data-floors / data-types / data-tier-* in the section markup, and the category -> product-name lookup is
   the JSON island #zvwData. The result list is the union of Q1's and Q4's data-cats; a Q4 option with
   data-types (Binnencamera -> Binnen, Buitencamera -> Buiten) narrows its category to products of that
   type, also when Q1 already asked for the whole category (unless that would leave the category empty). */
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
  var result = root.querySelector('#zvwResult');
  var lead = root.querySelector('#zvwLead');
  var leadErr = root.querySelector('#zvwLeadErr');
  var done = root.querySelector('#zvwDone');
  var edit = root.querySelector('#zvwEdit');
  var cur = 0;

  var DATA = { order: [], cats: {} };
  try { DATA = JSON.parse(root.ownerDocument.getElementById('zvwData').textContent); } catch (e) { /* result list stays empty */ }

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
    result.hidden = true;
    form.hidden = false;
    count.hidden = false;
    steps.forEach(function (s, n) { s.hidden = n !== cur; });
    bar.style.width = ((cur + 1) / (steps.length + 1) * 100) + '%';
    count.textContent = 'Vraag ' + (cur + 1) + ' van ' + steps.length;
    back.hidden = cur === 0;
    next.textContent = cur === steps.length - 1 ? 'Toon mijn aanbeveling' : 'Volgende';
    clearMissing();
    if (moveFocus) {
      var lg = steps[cur].querySelector('legend');
      if (lg) lg.focus({ preventScroll: true });
    }
  }

  function answered(step) {
    return checked(step.getAttribute('data-name')).length > 0;
  }

  /* Answers -> matched products. Only the data attributes are read, never the label text. */
  function compute() {
    var q1 = checked('beveiliging'), q2 = checked('woning')[0], q3 = checked('etages')[0], q4 = checked('camera')[0];
    var cats = [], catTypes = {};
    function addCats(el) { words(el.getAttribute('data-cats')).forEach(function (c) { if (cats.indexOf(c) < 0) cats.push(c); }); }
    q1.forEach(addCats);
    if (q4) {
      addCats(q4);
      var types = words(q4.getAttribute('data-types'));
      if (types.length) words(q4.getAttribute('data-cats')).forEach(function (c) { catTypes[c] = types; });
    }
    var groups = [];
    (DATA.order || []).forEach(function (c) {
      var cat = DATA.cats[c];
      if (!cat || cats.indexOf(c) < 0) return;
      var items = cat.items;
      var t = catTypes[c];
      if (t) {
        var narrowed = items.filter(function (it) { return t.indexOf(it.t) > -1; });
        if (narrowed.length) items = narrowed; else t = null;   // never leave a category empty
      }
      groups.push({ cat: c, label: cat.label + (t ? ' (' + t.join(', ').toLowerCase() + ')' : ''), names: items.map(function (it) { return it.n; }) });
    });
    var floors = q3 ? parseInt(q3.getAttribute('data-floors'), 10) : 1;
    return {
      q1: q1.map(function (e) { return e.getAttribute('data-d'); }),
      woning: q2 ? q2.getAttribute('data-d') : '',
      etages: q3 ? q3.getAttribute('data-d') : '',
      camera: q4 ? q4.getAttribute('data-d') : '',
      floors: floors,
      extraFloors: floors >= 2,
      tierName: (q2 && q2.getAttribute('data-tier-name')) || '',
      tierText: (q2 && q2.getAttribute('data-tier-text')) || '',
      groups: groups
    };
  }

  /* One flat string for the lead (never JSON): the answers, the matched products, the Woning remark when
     it applies and the package advice when one is set. Lines end with a full stop so the text still reads
     when a system collapses the line breaks. */
  function describe(c) {
    var lines = [
      'Zelf samenstellen (offertewizard).',
      'Beveiliging: ' + c.q1.join(', ') + '.',
      'Type woning: ' + c.woning + '.',
      'Etages: ' + c.floors + '.',
      'Camera-interesse: ' + c.camera + '.',
      'Aanbevolen producten: ' + c.groups.map(function (g) { return g.label + ': ' + g.names.join(', '); }).join('; ') + '.'
    ];
    if (c.extraFloors) lines.push(root.querySelector('#zvwResWoning').getAttribute('data-summary'));
    if (c.tierName) lines.push('Pakketadvies: ' + c.tierName + '.');
    return lines.join('\n');
  }

  function renderResult(c) {
    var list = root.querySelector('#zvwResList');
    list.textContent = '';
    c.groups.forEach(function (g) {
      var h = document.createElement('p'); h.className = 'zvw-res-cat'; h.textContent = g.label;
      var ul = document.createElement('ul'); ul.className = 'zvw-res-list';
      g.names.forEach(function (n) { var li = document.createElement('li'); li.textContent = n; ul.appendChild(li); });
      list.appendChild(h); list.appendChild(ul);
    });
    root.querySelector('#zvwResWoning').hidden = !c.extraFloors;
    var adv = root.querySelector('#zvwResAdvies');
    adv.hidden = !c.tierName;
    root.querySelector('#zvwResAdviesName').textContent = c.tierName;
    root.querySelector('#zvwResAdviesText').textContent = c.tierText;
  }

  function showResult() {
    renderResult(compute());
    form.hidden = true;
    result.hidden = false;
    bar.style.width = '100%';
    count.hidden = true;   // the result heading says it already
    var h = root.querySelector('#zvwResH');
    h.focus({ preventScroll: true });
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  }

  form.addEventListener('change', clearMissing);

  back.addEventListener('click', function () { show(cur - 1, true); });
  edit.addEventListener('click', function () { show(steps.length - 1, true); });

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
    /* Last step: re-check the earlier ones (Q1's checkboxes can be unticked after going back). */
    for (var i = 0; i < steps.length; i++) {
      if (!answered(steps[i])) { show(i, true); steps[i].classList.add('is-missing'); err.textContent = 'Beantwoord eerst deze vraag.'; err.hidden = false; return; }
    }
    showResult();
  });

  /* ---- Contact form -> lead ---- */
  var fName = root.querySelector('#zvwName'), fEmail = root.querySelector('#zvwEmail'), fPhone = root.querySelector('#zvwPhone'), fConsent = root.querySelector('#zvwConsent');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function mark(input, bad) {
    var box = input.closest('.zvw-fld') || input.closest('.zvw-consent');
    if (box) box.classList.toggle('is-invalid', bad);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
  }
  lead.addEventListener('input', function () { leadErr.hidden = true; });

  lead.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = fName.value.trim(), email = fEmail.value.trim(), phone = fPhone.value.trim();
    var problems = [];
    if (!name) problems.push([fName, 'Vul uw naam in.']);
    if (!EMAIL.test(email)) problems.push([fEmail, 'Vul een geldig e-mailadres in.']);
    if (!phone) problems.push([fPhone, 'Vul uw telefoonnummer in.']);
    if (!fConsent.checked) problems.push([fConsent, lead.getAttribute('data-consent-error')]);
    [fName, fEmail, fPhone, fConsent].forEach(function (f) { mark(f, problems.some(function (p) { return p[0] === f; })); });
    if (problems.length) {
      leadErr.textContent = problems.map(function (p) { return p[1]; }).join(' ');
      leadErr.hidden = false;
      problems[0][0].focus();
      return;
    }
    /* No endpoint or no sender = the lead would vanish; say so instead of showing a thank-you. */
    if (!window.ZVLeadWebhook || !window.ZV_LEAD_ENDPOINT) {
      leadErr.textContent = 'Het versturen is niet gelukt. Probeer het later opnieuw of bel ons op 088 122 11 11.';
      leadErr.hidden = false;
      return;
    }
    leadErr.hidden = true;
    var description = describe(compute());
    var ctx = {
      lead_type: 'zelfsamenstellen',
      cta_location: 'zelf_samenstellen_wizard',
      source_page: 'zelf-samenstellen',
      name: name,
      phone: phone,
      email: email,
      description: description,
      message: description,
      consent: true
    };
    var rec;
    if (window.ZVMeasurement && window.ZVMeasurement.buildCallbackLead) {
      rec = window.ZVMeasurement.buildCallbackLead(ctx);
    } else {
      rec = Object.assign({ lead_source: 'website', lead_temperature: 'hot', page_url: window.location.href, timestamp: new Date().toISOString() }, ctx);
    }
    window.ZVLeadWebhook.send(rec, 'zelf_samenstellen_wizard');
    root.querySelector('#zvwSend').disabled = true;
    lead.hidden = true;
    edit.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
  });

  show(0, false);
})();
