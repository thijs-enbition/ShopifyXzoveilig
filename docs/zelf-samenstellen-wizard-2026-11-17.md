# Zelf samenstellen: offertewizard (2026-11-17)

Branch `feature/offerte-wizard-2026-11-17`. **Current scope: a 7-question wizard, no product grid.** The page is a
standalone question -> lead -> e-mail flow; nothing is sold or priced on it. Two earlier designs are **superseded**,
see the last section: the 4-question grid-based version, and the house-type -> package mapping of question 3.

Files: `sections/zelf-samenstellen-wizard.liquid` (the whole page, scoped `.zv-wiz`), `assets/zv-offerte-wizard.js`,
`templates/page.zelf-samenstellen.json` (only the `wizard` section, no settings). Builds on
`docs/zelf-samenstellen-2026-11-02.md` and `docs/zelf-samenstellen-matcher-2026-11-02.md` (both historical now).

## The flow end to end

Seven questions, one at a time ("Vraag n van 7", a progress bar of n/8 that reaches 100% on the result step, Vorige /
Volgende, a required answer per step, the last button reads "Toon mijn aanbeveling"), then a result step with a
contact form. It never touches the cart, shows or computes no price, and adds no checkout entry point.

| # | Question | Options | What it does |
|---|---|---|---|
| 1 | Hoe wilt u uw woning beveiligen? (kies alles wat past, at least one) | Met een alarmsysteem / Met camera's / Met een video deurbel | alarm -> categories `sensoren` + `bediening`; camera's -> `camera`; video deurbel -> `deurbel` |
| 2 | Waar zoekt u in de eerste plaats beveiliging voor? | "Algemene beveiliging van mijn woning (inbraak, brand, camera's)" = `mijn_thuis` / "Zelfstandig en veilig blijven wonen — voor mezelf of een naaste" = `langer_thuis` | decides which three options Q3 shows |
| 3 | Welk soort bescherming past het beste bij u? (**kies alles wat past**, at least one, checkboxes like Q1) | three options per line (table below) | **each option IS one package**; with several ticked, **only the highest-ranked package is advised** |
| 4 | Uit hoeveel etages bestaat uw woning? | 1 / 2 / 3 / 4 etages | from 2 etages the Woning note (nothing else) |
| 5 | Welke camera heeft uw interesse? | Geen / Deurbelcamera / Binnencamera / Buitencamera | Deurbelcamera -> `deurbel`; Binnencamera -> `camera` narrowed to type Binnen; Buitencamera -> `camera` narrowed to type Buiten |
| 6 | Heeft u interesse in rook- of waterdetectie? | Geen / Rookmelder / Watersensor / Beide | `rookwater` ("Rook- en waterdetectie"): Rookmelder -> only Rook, Watersensor -> only Water, Beide -> both |
| 7 | Hoeveel afstandsbedieningen heeft u nodig? | Geen / 1 / 2 / 3+ | 1 / 2 / 3+ -> `bediening`, shown as "Afstandsbediening x1 / x2 / x3+" (text only); Geen removes `bediening` |

### Q3 and the package advice: the direct mapping, multi-select, highest tier wins

Q3 shows only the three options of the line Q2 chose, as **checkboxes** (same pattern and wording as Q1: "Kies alles
wat past."). Each option maps 1 on 1 to a package; the option text carries the whole decision, so **there is no mapping
table and no theme-editor setting**.

| Q2 answer | Q3 option (exact text) | Package ("Ons advies") | finder_key | Rank |
|---|---|---|---|---|
| `mijn_thuis` | Inbraakbeveiliging die ik zelf beheer via de app | **Alert** | `secure` | 1 |
| `mijn_thuis` | Inbraak én brand, met 24/7 meldkamer die meekijkt | **Protect** | `guard` | 2 |
| `mijn_thuis` | Camerabeveiliging op maat | **Vista** | `secure_plus` | 3 |
| `langer_thuis` | Vooral rust dat de dag goed verloopt | **Inzicht** | `aware` | 1 |
| `langer_thuis` | Vroeg willen weten als het ritme verandert | **Zeker** | `aware_plus` | 2 |
| `langer_thuis` | Snelle hulp bij een noodsituatie, met 24/7 meldkamer | **Beschermd** | `care` | 3 |

**Business rule: the tier order.** When more than one option is ticked, "Ons advies" shows **only the highest-ranked
package** of those ticked, by this fixed order (the natural tier order, which is also the price order and the order the
options appear in):
- Mijn Thuis: **Alert < Protect < Vista**
- Langer Thuis: **Inzicht < Zeker < Beschermd**

It is not alphabetical and not the order of ticking (ticking Vista first and Alert second still advises Vista; all six
click orders of the triple give the top package). The rank lives in the markup as `data-rank` (1 / 2 / 3) on each option,
next to `data-tier-name`; `compute()` in `assets/zv-offerte-wizard.js` takes the ticked option with the highest
`data-rank`. Ranks are only compared within one line (a line's other group is disabled and unchecked, see below). If the
tier order ever changes, change the `data-rank` values in step 3 of the section, nowhere else.

Validation: at least one box must be ticked to go on, same as Q1: with none ticked "Volgende" stays on Q3 and shows "Kies
minstens één optie."; unticking the last box blocks again.

Mechanics: the options live in `data-line="mijn_thuis"` / `data-line="langer_thuis"` groups in step 3. Both start hidden and
disabled; `syncQ3()` shows the group of Q2's answer (on load and on every change of Q2) and hides, disables and **unchecks
every box of** the other, so a selection made for one line can never survive a switch to the other (Q3 must then be answered
again; re-selecting the same Q2 answer keeps Q3). Each checkbox carries `data-tier-name` (the package name, from the config
through `zv-package-name` with a fixed finder_key per option, so the name never comes from a product title), `data-rank` and
`data-d` (the option text, used in the lead). **During the questions nothing about a package is shown and there is no link to
Oplossingen.** The section's settings are `title`, `lead` and `advies_label`; the former per-house-type package pickers and
notes are gone (see Superseded).

### How the other answers combine

All in `data-*` attributes on the options, the JS is generic:
- `data-cats`: the matched product set is the **union** of Q1's categories and those of Q5, Q6 and Q7. Q2, Q3 and Q4 add no
  products.
- `data-types`: a Q5 or Q6 option narrows its category to products of that type, **also when Q1 asked for the whole
  category** ("Met camera's" + Buitencamera = the 3 Buiten cameras, not all 4). A narrowing that would leave a category
  empty is dropped.
- **Sensoren counts but is never listed.** "Met een alarmsysteem" still maps to `sensoren` + `bediening` internally, but
  the category carries `show: false` in the data island, so Magneetcontact and PIR Bewegingsdetector appear in no result.
  Rookmelder and Watersensor were retagged out of Sensoren into `rookwater` (not duplicated); they appear only there, and
  only when Q6 asks for them.
- **Q7 is the most specific answer about the remote** (`data-drop-cats`, `data-qty-label`): "Geen" removes the Bediening
  category even when Q1's alarm system added it; 1 / 2 / 3+ show it with the count, also without an alarm system in Q1.
- Data: the category -> product-name lookup is the JSON island `#zvwData` in the section (names and types only, copied from
  the rows of the old grid). Categories in result order: Camera's, Videodeurbel, Rook- en waterdetectie, Bediening.

## Result step (after Q7)

On screen, top to bottom:

1. The heading "Uw aanbeveling".
2. **"Ons advies: <package>."** as static text (no link), directly under the heading: the package of the Q3 option(s) the
   visitor ticked, **the highest-ranked one when several are ticked** (one line, never a list). A tinted box with a check mark; the line is `clamp(18px, 2.2vw, 22px)`, weight 900. The label "Ons advies:"
   is the `advies_label` setting.
3. "Op basis van uw antwoorden past dit bij u:" and **a plain list** (not cards) of the matched products, grouped under their
   category ("Camera's (buiten)", "Videodeurbel", "Rook- en waterdetectie", "Bediening"). Names only: no price, no product
   code, no buy control. **If nothing is left to list** (for example alarm only, no camera, no rook/water, Q7 Geen) the intro
   becomes "Op basis van uw antwoorden bespreken we de onderdelen graag met u in het adviesgesprek." and the list is empty;
   the package line still shows.
4. The **Woning note** from 2 etages: the toeslag "Extra etage of >100 m²" comes with a subscription, is not orderable on
   its own, and is discussed in the adviesgesprek. No code or amount in it (`check_pricing.py` #13 forbids a theme file
   naming the Woning products).
5. **The contact form**: Naam, E-mailadres, Telefoonnummer (all required, e-mail format checked), the shared consent checkbox
   (`zv-form-copy` consent and consent_error, the single source for lead forms), button "Ontvang uw aanbeveling per e-mail".
   "Antwoorden wijzigen" goes back to Q7 with every answer kept.
6. On submit: **"Bedankt. U ontvangt de aanbeveling per e-mail. Onze klantenservice neemt ook contact met u op."** If the lead
   cannot be sent at all (no `ZV_LEAD_ENDPOINT` or no `ZVLeadWebhook`), the visitor gets "Het versturen is niet gelukt.
   Probeer het later opnieuw of bel ons op 088 122 11 11." instead of a thank-you for a lead that went nowhere.

Copy was checked against the existing forms (`contact-page`, `herroepen-page`, `zv-form-copy`): u-vorm throughout, "uw" only
as a possessive. The title/intro say "7 vragen" / "zeven korte vragen" (section settings `title`, `lead`); these numbers are
literal copy, so change them if a question is added or removed.

## The lead

One lead per submit, to `window.ZV_LEAD_ENDPOINT` (the Odoo CRM webhook; **not** Supabase `capture-lead`) through
`window.ZVLeadWebhook.send(rec, 'zelf_samenstellen_wizard')`. The record is built with `ZVMeasurement.buildCallbackLead` like
the contact and herroepen leads (`lead_source: 'website'`, `lead_temperature`, `page_url`, `timestamp`, attribution). Our
fields:

| Field | Value |
|---|---|
| `lead_type` | `zelfsamenstellen` |
| `cta_location` / `source_page` | `zelf_samenstellen_wizard` / `zelf-samenstellen` |
| `name`, `email`, `phone` | the form; `consent: true` (the checkbox is required) |
| `description` | one flat string (below) |
| `message` | the same string. Added on top of the brief: `message` is the free-text key the contact lead already sends and that is confirmed to reach Odoo; `description` is not verified. Drop one if Odoo ends up with the text twice. |

`description` is plain text, lines joined with line breaks, each ending in a full stop (so it still reads if a system collapses
them), never JSON. Example (alarm + camera's + video deurbel, Mijn Thuis with the Protect and the Vista options ticked, 3 etages,
Buitencamera, Beide, 2 remotes):

```
Zelf samenstellen (offertewizard).
Beveiliging: Alarmsysteem, Camera's, Videodeurbel.
Zoekt beveiliging voor: Algemene beveiliging van de woning.
Soort bescherming: Inbraak én brand, met 24/7 meldkamer die meekijkt; Camerabeveiliging op maat.
Etages: 3.
Camera-interesse: Buitencamera.
Rook- of waterdetectie: Rookmelder en watersensor.
Afstandsbedieningen: 2.
Aanbevolen producten: Camera's (buiten): Buitencamera bedraad Dome 826, 729 WiFi Camera Floodlight (Mickey), 730 Buitencamera met spotlight; Videodeurbel: Video Deurbel 750, Video Deurbel 780 (accu); Rook- en waterdetectie: Rookmelder, Watersensor; Bediening: Afstandsbediening x2.
Meerdere etages: de toeslag "Extra etage of >100 m²" kan van toepassing zijn. Bespreken in het adviesgesprek.
Pakketadvies: Vista (Mijn Thuis).
```

The "Soort bescherming" line lists **every ticked Q3 option** (its option text, in the order the options appear, not the
order of ticking), separated by `; `. A semicolon, not a comma, because two option texts contain a comma themselves ("Inbraak
én brand, met 24/7 meldkamer die meekijkt", "Snelle hulp bij een noodsituatie, met 24/7 meldkamer"). It replaces the old "Type
woning" line (that question no longer exists). "Pakketadvies: <package> (<line>)" shows **only the single highest-ranked
package**, format unchanged; the line is Q2's answer ("Mijn Thuis" / "Langer Thuis"). The
Meerdere-etages line appears only from 2 etages; with nothing to list the product line reads "Aanbevolen producten: geen
specifieke producten." The lead's line order does not follow the on-screen order. No prices, no `item_name`: the list says
what suits the visitor, it is not a quote (no quantities beyond the remote count).

## Open follow-ups (not buildable from this repo)

- **The customer e-mail itself.** Needs an Odoo Automation Rule on `lead_type: 'zelfsamenstellen'` (mirroring the
  Herroepingsrecht ticket rule of 2026-10-14) that mails the summary and the "klantenservice neemt contact op" copy to the
  lead's address. Robi's side in Odoo. **Until it exists the visitor is told they will get an e-mail and none is sent**; do not
  point traffic at this page before the rule is live.
- **The Odoo `record_getter` must read the new fields** (`docs/contact-odoo-dual-write-2026-09-16.md`: an unknown field is
  silently dropped): `lead_type: 'zelfsamenstellen'`, `description`, and `message` if that one is to be used.
- The page still needs its Admin page `zelf-samenstellen` (template `zelf-samenstellen`); the Oplossingen pill points to
  `offerte.zoveilig.nl` via `zelf_url_override` meanwhile (`docs/zelf-samenstellen-2026-11-02.md`).
- `sections/zelf-samenstellen.liquid` (the old grid) and `sections/zelf-samenstellen-matcher.liquid` are **no longer on any
  template** and can be deleted when nobody wants them back; their `zv-match:apply` / `zv-wizard:apply` listeners are dead code
  until then.
- The six Q3 option texts are copy written for this wizard; the package behind each is fixed in the markup (finder_key per
  option). If a package is renamed or replaced, update the option's finder_key in step 3 (names follow the config).

## Decisions taken without a brief (say if any is wrong)

- **Q7 "Geen" beats Q1's alarm system**: no remote is listed then. Alarm only, with no camera, no rook/water and Q7 Geen,
  therefore lists no products at all (fallback sentence above, package advice still shown). The alternative is to keep a bare
  "Afstandsbediening" whenever Q1 has an alarm.
- **"3+" is shown as "x3+"** (and "3 of meer" in the lead's answer line).
- The lead's Q3 line is called "Soort bescherming" and lists the ticked option texts joined with `; ` (not `, `: see The lead); Q2's lead text is short ("Algemene
  beveiliging van de woning", "Zelfstandig en veilig blijven wonen"), not the full option label.
- The title reads "...in 7 vragen"; everything else that counted questions was updated too.

## Where the briefs and the repo differed

- The scoring quiz was not "never built": the quantity-based matcher (2026-11-02) was on main. It is no longer on the page,
  file left in place.
- "Inbraakbeveiliging" is not a category: "Met een alarmsysteem" -> Sensoren + Bediening (Thijs, 2026-11-17).
- Leads go to Odoo (`ZV_LEAD_ENDPOINT`), not Supabase `capture-lead` (a separate decision for Thijs).
- The brief's "Q1xQ6 camera combinations" of the 7-question round is the camera question, which is Q5 after the insertion.

## QA

Draft theme `zv-offerte-wizard-2026-11-17` (theme 190897357181, **persistent, do not delete**). Real Chrome over CDP,
`ZVLeadWebhook.send` stubbed (no lead left the browser). `shopify theme check`: 568 warnings / 0 errors, identical to
`origin/main` (4c6f257), none new in the touched files (the section needs `zv-pricing` for package names, an `include`, so
DeprecatedTag/UndefinedObject are switched off around those lines only). `scripts/check_pricing.py` fails on main too with the
same single line (`zv-infrarood-installatie.liquid` literal price); nothing added.

**Multi-select round (Q3 as checkboxes, highest tier wins): 59 check groups, 0 failures.**
- Q3 renders **checkboxes** (not radios) with the fixed `data-rank` 1 / 2 / 3, the exact option texts, the right package
  name on each, the "Kies alles wat past." sub-line; the other line's group is hidden, disabled and unchecked.
- Validation: nothing ticked blocks Volgende with "Kies minstens één optie." (same message as Q1); unticking the last box
  blocks again.
- Switching Q2 (Mijn Thuis -> Langer Thuis) clears the whole selection (two ticked boxes -> zero); re-selecting the same Q2
  answer keeps it.
- **Single selections unchanged**: all six individual options still give Alert / Protect / Vista and Inzicht / Zeker /
  Beschermd.
- **Every 2- and 3-option combination per line by real clicks**: Mijn Thuis alert+protect -> Protect, alert+vista -> Vista,
  protect+vista -> Vista, all three -> Vista; Langer Thuis inzicht+zeker -> Zeker, inzicht+beschermd -> Beschermd,
  zeker+beschermd -> Beschermd, all three -> Beschermd. All three ticked in each of the 6 click orders always gives the top
  package, per line.
- **Bulk matrix, 4,704 combinations** through the real handlers: Q1 (7 non-empty subsets) x Q2 (2 lines) x every non-empty
  Q3 subset of that line (7 each) x Q4 (1 and 2 etages) x Q5 (4) x six Q6/Q7 pairs; every result equals the reference model
  (groups, names, order, counts, Woning note, single highest-tier package line). Q6 x Q7 were run as six representative
  pairs instead of all 16 this round because they are unchanged since the 5,376-combination run of the previous round and
  Q3 is the new dimension. Sensoren never appears; Rookmelder / Watersensor only under their own category.
- Lead (stubbed): Mijn Thuis with Protect and Vista ticked -> "Soort bescherming: Inbraak én brand, met 24/7 meldkamer die
  meekijkt; Camerabeveiliging op maat." and "Pakketadvies: Vista (Mijn Thuis)."; Langer Thuis with Beschermd ticked before
  Inzicht -> the two options listed in option order (not click order) and "Pakketadvies: Beschermd (Langer Thuis)."; the
  nothing-to-list case unchanged.
- Q4 onward and the result layout are unchanged.

**Previous round (direct mapping, single choice): 48 check groups, 0 failures.**
- Q3 under each line: exactly its three options with the exact texts, all enabled and carrying the right package name; the
  other line's group hidden, disabled and unchecked; the legend "Welk soort bescherming past het beste bij u?"; Volgende
  without an answer is blocked; still 7 steps and no "type woning" radios anywhere.
- Switching Q2 (Mijn Thuis -> Langer Thuis) clears the Q3 answer, Q3 must be answered again; re-selecting the same Q2 answer
  keeps it.
- All six outcomes by real clicks: Alert / Protect / Vista and Inzicht / Zeker / Beschermd, each as static text with no link.
- **Full matrix, 5,376 combinations** driven through the real handlers: Q1 (all 7 non-empty subsets) x Q2 (2 lines) x the 3
  Q3 options of that line x Q4 (1 and 2 etages) x Q5 (4) x Q6 (4) x Q7 (4). Every result equals an independent reference
  model: groups, names, order, "x<N>" counts, the Woning note and the package line. This is the same suite as the 7-question
  round with Q3 swapped, and Q4 onward is unchanged. Sensoren, Magneetcontact and PIR appear in none of them; Rookmelder and
  Watersensor only under "Rook- en waterdetectie".
- Structure unchanged: "Vraag n van 7" and bar n/8 on every step, required answers, the exact question order, the result order
  heading / Ons advies / intro / list, no note line or link in the advice block, no advice bar during the questions.
- Lead (stubbed), three scenarios: Mijn Thuis with every answer (the exact string above), Langer Thuis ("Soort bescherming:
  Snelle hulp bij een noodsituatie, met 24/7 meldkamer.", "Pakketadvies: Beschermd (Langer Thuis).", no Woning line at 1
  etage), and the nothing-to-list case; no "Type woning" line, `message` equals `description`, no prices, nothing in the cart.
- Orphan check: `grep` over the repo for `tier_`, `tier_lt_`, `text_lt_`, `data-tier-mijn`, `data-tier-langer`, `advies_cta`,
  "Pakketadvies Mijn/Langer Thuis bij vraag 3" and "Type woning" finds nothing in the section, the JS or the template JSON; the
  only remaining hit is the old matcher's own doc (its own, unrelated "Type woning" question).

Not covered: a real device, and anything on the Odoo side (field mapping, the e-mail).

## Superseded

**1. The house-type -> package mapping (Q3 "Wat voor type woning heeft u?", 7-question round).** Appartement / Rijtjeswoning /
Vrijstaand mapped to a package per line (Alert / Protect / Vista and Inzicht / Zeker / Beschermd) through six package pickers in
the theme editor. Replaced because house size was never the right signal: it was only the one axis the old PHP wizard had. The
comparison tables on Oplossingen and Vergelijk pakketten differentiate the packages on service and care level, not on size or
type of home: Mijn Thuis on Bewegings- en deursensoren, Rookmelder, Meldkameropvolging (24/7), Camera, Zelf in- en
uitschakelen via de app and Contractduur; Langer Thuis on Discrete sensoren, App voor familie, Melding bij afwijking, Dag- en
nachtinzicht, Meerdere contactpersonen, Meldkameropvolging, Alarmknop met opvolging and Precieze lokalisering. The type-woning
question therefore cannot predict the package, and it is gone entirely (the wizard no longer asks the house type; Etages
stays, but only drives the Woning note). The new Q3 asks about the thing the tiers actually differ on, and each answer is one
package.

**2. The 4-question, grid-based version (2026-11-17, first rounds; commits `74fbb1c` to `e2e2b3c`).** The wizard started above the
Winkelgrid (`sections/zelf-samenstellen.liquid`: hero, trust strip, filter chips, hardware cards with Koop/Huur, "Uw set"
summary, callback form, FAQ) with four questions (beveiliging, type woning, etages, camera); after the last one it fired
`zv-wizard:apply` and the grid filtered itself (a Woning note, `#ccDescription` prefilled for the grid's callback form, lead type
`camerahardware`). Later rounds dropped the grid for the question -> lead -> e-mail flow, removed an early mid-flow "Ons advies"
bar with a link to Oplossingen, and moved the package line to the top of the result. What carried over: the category union, the
Binnen/Buiten narrowing (and the 729 Floodlight's `type` change from `Camera` to `Buiten`, so Buitencamera shows three
cameras), the Woning note and the `description` idea. What was dropped: any selling (Koop/Huur, set summary, phone-to-order), the
grid's own callback form, the filter chips, the trust strip and the FAQ on this page, and the Sensoren listing.
