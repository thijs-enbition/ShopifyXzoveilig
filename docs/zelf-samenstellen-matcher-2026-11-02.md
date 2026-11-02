# Zelf samenstellen: vragenhulp (2026-11-02)

Branch `feature/zelf-samenstellen-matcher-2026-11-02`. Files: `sections/zelf-samenstellen-matcher.liquid`
(new, scoped `.zv-match`), `sections/zelf-samenstellen.liquid` (the grid), `templates/page.zelf-samenstellen.json`
(`matcher` first in `order`, `main` unchanged below it). Builds on `docs/zelf-samenstellen-2026-11-02.md`.

## What it does

A short question flow above the grid narrows down which products the visitor needs. It filters the
existing grid; it shows no price and computes none (the cards already show Huren/Kopen, or Kopen only
where there is no Huren product). No Huren/Kopen question, no Ontzorgpakket, no hub/paneel branch.

**Split of work.** The matcher computes `{slug: qty}` and fires `zv-match:apply` on `document` with
`{qty, description}`. The grid applies it. The grid owns the marking because it re-renders every card
from its `HW` array on each Koop/Huur click, which would wipe classes added from outside (`state.match`
lives next to `state.lines`). Each `HW` row has an `m` slug, rendered as `data-match` on its card.

| Q1 option | Question | Answer -> product qty |
|---|---|---|
| Inbraakbeveiliging | Type woning | Appartement 2 / Rijtjeswoning 3 / Vrijstaand/anders 4 `magneetcontact` |
| | Verdiepingen | 1 etage 0 (not added) / 2: 1 / 3: 2 / 4: 3 `pir` |
| Rook- en waterdetectie | Rookmelders (stepper, min 1, default = etages answer if given, else 1, until edited) | `rookmelder` = input |
| | Watersensor (stepper, min 0, default 1) | `watersensor` = input (0 = not added) |
| Camera's | Binnen | `binnencamera` 1 |
| | Buiten, then stroom | Vaste stroom `dome826` / Liever draadloos `floodlight729` / Premium met spotlight `buitencamera730`, 1 each |
| Videodeurbel | Stroom bij de voordeur | Vaste stroom `videodeurbel750` / Liever op accu `videodeurbel780`, 1 |
| Afstandsbediening | Aantal (stepper, min 1, no cap, default 1) | `afstandsbediening` = input |

Only revealed blocks count: unchecking a Q1 option (or Buiten) ignores its answers even though the radios
keep their state. Submit with a revealed question unanswered flags it and applies nothing.

## On submit (grid side)

- scroll to `#winkel` (instant under `prefers-reduced-motion`), focus the note;
- cards in the map get `.zv-match-hit` and an "Aanbevolen · Nx" badge; every other card gets `.zv-match-dim`
  (opacity .5, back to 1 on hover/focus; never hidden, and not applied to a card the visitor already chose);
- the category chip is reset to "Alle" so no recommended card is filtered out;
- a note "Gemarkeerd: N producten die bij uw antwoorden passen. Toon alles" appears above the grid;
- the hidden `#ccDescription` of the callback form (`#camContact`) gets e.g.
  `Offerteformulier: 3x Magneetcontact, 1x PIR bewegingsdetector, 1x Videodeurbel 750`. The lead payload
  carries it as `description` (null when empty). `lead_type`, `source_page`, `cta_location` and the webhook
  source are untouched, and `item_name` / prices still describe only what the visitor picked in the grid
  (null when nothing was), because a recommendation is not a choice.

"Toon alles" clears the marks **and** the description: a recommendation the visitor dismissed must not
reach a lead. Re-submitting the quiz sets both again.

## Things to know

- **`description` is a new payload key.** The repo has no "offertebuilder" (not in the tree or in git
  history), and the form had no hidden description field, so this adds one. `window.ZV_LEAD_ENDPOINT`
  (Odoo) is opaque from here: **check that Odoo maps `description`**, as with the earlier `source_page`
  / webhook source for this page. If it doesn't, the list reaches Odoo nowhere. The fallback is `item_name`
  (Odoo's Pakket field, which the form already fills from the visitor's own picks), at the cost of
  mixing a recommendation into a field meant for a choice.
- **The quiz renders above the breadcrumb and h1**, because the brief puts it ABOVE `main` and
  hero, trust strip and grid are all one section. Moving it between hero and grid means splitting that section.
- The watersensor question is "Waar wilt u een watersensor plaatsen? (bijv. ...)" with a number stepper, as
  specified; the copy asks "where" and the control answers "how many".
- No price literals in the matcher, so `check_pricing.py` has nothing to say about it.

## QA (2026-11-02, disposable theme zz-validate-zelf-matcher-2026-11-02, deleted afterwards)

Real Chrome over CDP, `ZVLeadWebhook.send` stubbed so no lead left the browser. All five branches,
combinations, step floors, validation, re-render after a Koop click, "Toon alles", the lead payload and a
390px viewport passed. Not covered: a click-through on a real device, and Odoo's handling of `description`.
