# fix: final-check content batch (L-03, L-04, L-05, P-03)

Branch `fix/final-check-content-batch-2026-10-14`. The investigation behind it is on
`docs/final-check-content-batch-investigation-2026-10-14`
(`docs/final-check-content-batch-plan-2026-10-14.md`).

## What changed

**L-03, Beschermd.** The card is the source of truth, except for the panic buttons.

- **Card** (`sections/oplossingen.liquid`, `care`): "Alles van Zeker, plus:" removed. The
  three bullets now stand on their own. In "Wat zit erin?", "3x paniekknop naar keuze" is
  now "Paniekknop, keuze uit 3".
- **Modal** (`#opl-modal-data`, `pkg.care`):
  - Familie-app tile removed.
  - "24/7 Zorgmeldkamer" replaced by the existing `meldkamer` entry, named "Nederlandse
    meldkamer 24/7". The shared `zorgmeld` entry stays, because Veilig Onderweg
    Zorgmeldkamer uses it.
  - Panic button: no "3×", now "Paniekknop, keuze uit 3". The modal `sub` line is updated
    the same way.
- **Shared taglines in the modal.** Two hardware taglines that the modal shares between
  packages made claims Beschermd's card doesn't make:
  - rookmelder: "…én in de familie-app"
  - locatiesensor: "…zodat afwijkingen in de routine opvallen"

  `itemHtml()` now takes an optional per-package `tagline`. Beschermd uses it to override
  both. Specs are not touched.
- **Comparison table** (`snippets/zv-pakket-matcher.liquid`, default Langer Thuis rows,
  shown on Oplossingen and Vergelijk pakketten): Beschermd goes from ✓ to – on "Discrete
  sensoren (beweging en routine)", "App voor familie", "Melding bij afwijking" and "Dag- en
  nachtinzicht".
- **Keuzehulp** (`assets/zv-finder.js`, `care.sub`): "paniekknoppen" is now "paniekknop
  (keuze uit 3)".
- **Mantelzorgdashboard badge** (`page.oplossingen.json` and the schema default): "Bij alle
  Langer Thuis-pakketten: Inzicht, Zeker en Beschermd" is now "Bij de Langer
  Thuis-pakketten Inzicht en Zeker". The dashboard is reached through the Familie-app, so
  removing the Familie-app from Beschermd everywhere includes this badge. **Confirmed by
  Thijs (2026-10-14).** The dashboard's trend view tracks the daily activity-level pattern
  and detects irregularities. That matches Inzicht and Zeker, not Beschermd. This
  supersedes the 2026-09-24 decision (spec §12 addendum); nothing to revert.

**L-04, Zeker claims.**

- Zeker card: "Signalering als medicijnen of koelkast niet worden gebruikt" and "Directe
  melding als er mogelijk niet meer gegeten of gedronken wordt" are replaced by "Inzicht in
  slaap- en rustpatronen" and "Melding bij afwijkende nachtelijke routines". Both come from
  the Zeker modal's existing text ("rustpatronen … nachtelijke routines").
- Kenniscentrum Alarm.com card (`sections/kc-hub.liquid`): "op het bed, de koelkast en
  kastjes" and "medicatie die blijft liggen" are removed.
- No repo instance is left (`grep -i "medicijn|medicat|gegeten|gedronken|koelkast"` finds
  nothing).

**L-05, situatietegels.**

- s9 "Opvolging aan huis mogelijk / Zorgpartner aan huis mogelijk." is removed from
  `page.oplossingen.json`, `page.vergelijk-pakketten.json` and the `vergelijk-pakketten`
  section preset. The Langer Thuis matcher now has 8 tiles. The Oplossingen schema note now
  says "8 kaarten".
- s2 is unchanged and still on Inzicht.

**P-05 follow-up, Kenniscentrum practice cases** (`sections/kc-hub.liquid`).

- "Voor gezinnen / Gerust op vakantie" now points to **Protect** (`guard`). It was
  Beschermd. Protect needs no story change, since "iemand meekijkt terwijl u er niet bent"
  is a meldkamer. Alert is self-monitored, so it would have needed a rewrite.
  `?pakket=guard` opens the Protect modal on the Mijn Thuis tab.
- "Voor alleenwonenden / Niemand merkt het? Wij wel" (the fall-detection claim) is removed
  entirely. 7 cases remain.

**P-03, Klantenservice.** "Maak me wegwijs" now goes to `/#keuzehulp`, like every other
"help me choose" button. The template value changed, and the section default now uses
`zv-route` key `keuzehulp`. "Hoe het werkt" is unchanged.

## Notes for review

- **Needs Robi, not code:** the blog article `langer-thuis-wonen-met-dementie` still says
  "Blijft iemand 's ochtends in bed, of wordt er een hele dag niet gegeten, dan volgt een
  melding." Blog articles live in Shopify admin, so it has to be edited there (Blog posts →
  langer-thuis-wonen-met-dementie).
- **Open question for Robi/nami, not blocking:** the table gives Inzicht only "Dag" on
  "Melding bij afwijking" (Zeker ✓), and Zeker's copy suggests that full day-and-night
  alerting is Zeker-only. Yet the table also ticks Inzicht for "Dag- en nachtinzicht", and
  s2 ("Vannacht meerdere keren beweging") stays on Inzicht. Please confirm that Inzicht's
  three wifi sensors support what the table claims for Inzicht at night.
- **Scoring logic:**
  - Removing s9 needed no logic change. `recommend()` in `assets/zv-vergelijk-pakketten.js`
    is generic and has no reference to s9, a tile count or a care partner. s7/s8 still lead
    to Beschermd.
  - **Known, accepted limitation, deliberately not fixed in this branch (Thijs,
    2026-10-14):** the matcher still assumes Inzicht ⊂ Zeker ⊂ Beschermd. It recommends the
    highest tier among the selected tiles. With Beschermd no longer framed as "Alles van
    Zeker", that is imprecise for mixed selections. For example, s6 "Melding wanneer een
    routine verandert" plus s7 "Snelle hulp wanneer het telt" gives "Ons advies:
    Beschermd" (checked in preview), while the table shows Beschermd with a – for routine
    alerts. Thijs's call: this is a broader imprecision in the scoring model, not specific to
    this fix, so it isn't addressed here. It stays documented. It is not resolved. A future
    fix means deciding what to recommend when no single package covers the selection
    (multi-package tiles, a "combineer" message, or Zeker plus a note).
  - Related: practice case "Voor mensen met dementie" ("Dwaaldetectie en een meldkamer")
    still points to Beschermd, which has the meldkamer. Wandering detection is an
    Inzicht-tier tile (s4). Not changed.
- **L-07 ("Ideaal voor" jargon): out of scope for this branch, and not overlooked.** It *was*
  located during the investigation: `sections/oplossingen.liquid`, the modal data
  `pkg.aware.info.idealFor` / `pkg.aware_plus.info.idealFor`. It is deliberately untouched
  here.
- **Kept deliberately:** Beschermd keeps ✓ on "Meerdere contactpersonen", because the
  meldkamer calls the contact persons.
- **Out of scope (confirmed by Thijs, 2026-10-14; left as is):**
  - Climax/NAMI hardware specs in the Beschermd and Protect modals are untouched.
  - Protect's modal still shows the shared rookmelder tagline ("…én in de familie-app") and
    the shared PIR tagline ("…afwijkingen in de routine").
- **Layout (confirmed by Thijs, 2026-10-14; left as is):** the Kenniscentrum case grid now
  has 7 cards, so its last row on desktop holds one card. No overflow on mobile (390px).

## Validation

- Live theme `#188704719229` was pulled before editing. Every touched file matches
  `origin/main` (Liquid byte-identical, JSON identical after parsing).
- `python3 scripts/build_pricing.py`: the generated files are unchanged.
  `python3 scripts/check_pricing.py`: all checks pass.
- `shopify theme check --fail-level error`: 0 errors. Every warning in the touched files is
  a type already on `main` (undefined `zv_*` globals from `zv-pricing`, `include`,
  complexity).
- Pushed to disposable unpublished theme `zz-validate-final-check-batch`
  (`#189703029117`). The upload was accepted by Shopify's validator, and the theme was
  deleted afterwards.
- Checked on the preview with headless Chromium and server HTML:
  - Beschermd card and "Wat zit erin?", and Beschermd modal (items and taglines read back).
  - Langer Thuis tiles: 8, s2 = Inzicht, s9 gone. Same on Vergelijk pakketten.
  - Comparison table on both pages.
  - Zeker card.
  - Mantelzorgdashboard badge.
  - Kenniscentrum Alarm.com card and the 7 cases (desktop and 390px mobile).
  - The Protect deep link.
  - Klantenservice: "Maak me wegwijs" lands on `/#keuzehulp` with the Keuzehulp in view.
  - The Keuzehulp asset serves the new Beschermd text.
- Console: only Shopify's privacy-banner 503 errors, which are platform errors, not theme
  errors.
- **Not tested:** the Keuzehulp result screen for Beschermd wasn't clicked through (the
  asset text was checked instead), and no real add-to-cart was done. Cart code wasn't
  touched.
