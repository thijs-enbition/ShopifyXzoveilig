# Zelf samenstellen: offertewizard (2026-11-17)

Branch `feature/offerte-wizard-2026-11-17`. **Current scope: a 7-question wizard, no product grid.** The page is a
standalone question -> lead -> e-mail flow; nothing is sold or priced on it. The earlier 4-question, grid-based
version is **superseded**, see the last section.

Files: `sections/zelf-samenstellen-wizard.liquid` (the whole page, scoped `.zv-wiz`), `assets/zv-offerte-wizard.js`,
`templates/page.zelf-samenstellen.json` (only the `wizard` section, with the package mappings). Builds on
`docs/zelf-samenstellen-2026-11-02.md` and `docs/zelf-samenstellen-matcher-2026-11-02.md` (both historical now).

## The flow end to end

Seven questions, one at a time ("Vraag n van 7", a progress bar of n/8 that reaches 100% on the result step, Vorige /
Volgende, a required answer per step, the last button reads "Toon mijn aanbeveling"), then a result step with a
contact form. It never touches the cart, shows or computes no price, and adds no checkout entry point.

| # | Question | Options | What it does |
|---|---|---|---|
| 1 | Hoe wilt u uw woning beveiligen? (kies alles wat past, at least one) | Met een alarmsysteem / Met camera's / Met een video deurbel | alarm -> categories `sensoren` + `bediening`; camera's -> `camera`; video deurbel -> `deurbel` |
| 2 | Waar zoekt u in de eerste plaats beveiliging voor? | "Algemene beveiliging van mijn woning (inbraak, brand, camera's)" = `mijn_thuis` / "Zelfstandig en veilig blijven wonen — voor mezelf of een naaste" = `langer_thuis` | decides which package mapping Q3 uses |
| 3 | Wat voor type woning heeft u? | Appartement / Rijtjeswoning / Vrijstaand | with Q2, picks the package for "Ons advies" (table below) |
| 4 | Uit hoeveel etages bestaat uw woning? | 1 / 2 / 3 / 4 etages | from 2 etages the Woning note |
| 5 | Welke camera heeft uw interesse? | Geen / Deurbelcamera / Binnencamera / Buitencamera | Deurbelcamera -> `deurbel`; Binnencamera -> `camera` narrowed to type Binnen; Buitencamera -> `camera` narrowed to type Buiten |
| 6 | Heeft u interesse in rook- of waterdetectie? | Geen / Rookmelder / Watersensor / Beide | `rookwater` ("Rook- en waterdetectie"): Rookmelder -> only Rook, Watersensor -> only Water, Beide -> both |
| 7 | Hoeveel afstandsbedieningen heeft u nodig? | Geen / 1 / 2 / 3+ | 1 / 2 / 3+ -> `bediening`, shown as "Afstandsbediening x1 / x2 / x3+" (text only); Geen removes `bediening` |

**Package mapping for "Ons advies"** (Thijs, 2026-11-17), set as section settings in the template JSON, not in code:

| Type woning (Q3) | `mijn_thuis` (settings `tier_*`) | `langer_thuis` (settings `tier_lt_*`) |
|---|---|---|
| Appartement | Alert (`secure`) | Inzicht (`aware`) |
| Rijtjeswoning | Protect (`guard`) | Zeker (`aware_plus`) |
| Vrijstaand | Vista (`secure_plus`) | Beschermd (`care`) |

The optional one-line notes (`text_*`, `text_lt_*`) are blank. "Geen advies" hides the line for a type. Names come from
the config (`zv-package-name`), never a literal. In the theme editor: section "Zelf samenstellen wizard", groups
"Pakketadvies Mijn Thuis bij vraag 3" and "Pakketadvies Langer Thuis bij vraag 3". A merge to main carries these
mappings. The mapping is stored on the Q3 options as `data-tier-mijn-thuis-*` / `data-tier-langer-thuis-*`; the JS reads
the pair that matches Q2's answer (`doel`). **During the questions nothing about a package is shown and there is no link
to Oplossingen** (the Q2-era bar with a "Bekijk dit pakket" link was removed so visitors finish the questionnaire).

How the answers combine (all in `data-*` attributes on the options, the JS is generic):
- `data-cats`: the matched set is the **union** of Q1's categories and those of Q5, Q6 and Q7.
- `data-types`: a Q5 or Q6 option narrows its category to products of that type, **also when Q1 asked for the whole
  category** ("Met camera's" + Buitencamera = the 3 Buiten cameras, not all 4). A narrowing that would leave a category
  empty is dropped.
- **Sensoren counts but is never listed.** "Met een alarmsysteem" still maps to `sensoren` + `bediening` internally,
  but the category carries `show: false` in the data island, so Magneetcontact and PIR Bewegingsdetector appear in no
  result. Rookmelder and Watersensor were **retagged** out of Sensoren into `rookwater` (not duplicated); they appear only
  there, and only when Q6 asks for them.
- **Q7 is the most specific answer about the remote** (`data-drop-cats`, `data-qty-label`): "Geen" removes the Bediening
  category even when Q1's alarm system added it; 1 / 2 / 3+ show it with the count, also without an alarm system in Q1.
- Data: the category -> product-name lookup is the JSON island `#zvwData` in the section (names and types only, copied
  from the rows of the old grid). Categories in result order: Camera's, Videodeurbel, Rook- en waterdetectie, Bediening.

## Result step (after Q7)

On screen, top to bottom:

1. The heading "Uw aanbeveling".
2. **"Ons advies: <package>."** as static text (no link), directly under the heading, when the package mapping of Q2's
   line has a package for Q3's type. A tinted box with a check mark; the line is `clamp(18px, 2.2vw, 22px)`, weight 900.
   The optional `text_*` note sits under it in a smaller line.
3. "Op basis van uw antwoorden past dit bij u:" and **a plain list** (not cards) of the matched products, grouped under
   their category ("Camera's (buiten)", "Videodeurbel", "Rook- en waterdetectie", "Bediening"). Names only: no price,
   no product code, no buy control. **If nothing is left to list** (for example alarm only, no camera, no rook/water,
   Q7 Geen) the intro becomes "Op basis van uw antwoorden bespreken we de onderdelen graag met u in het
   adviesgesprek." and the list is empty; the package line still shows.
4. The **Woning note** from 2 etages: the toeslag "Extra etage of >100 m²" comes with a subscription, is not orderable
   on its own, and is discussed in the adviesgesprek. No code or amount in it (`check_pricing.py` #13 forbids a theme
   file naming the Woning products).
5. **The contact form**: Naam, E-mailadres, Telefoonnummer (all required, e-mail format checked), the shared consent
   checkbox (`zv-form-copy` consent and consent_error, the single source for lead forms), button
   "Ontvang uw aanbeveling per e-mail". "Antwoorden wijzigen" goes back to Q7 with every answer kept.
6. On submit: **"Bedankt. U ontvangt de aanbeveling per e-mail. Onze klantenservice neemt ook contact met u op."** If
   the lead cannot be sent at all (no `ZV_LEAD_ENDPOINT` or no `ZVLeadWebhook`), the visitor gets "Het versturen is niet
   gelukt. Probeer het later opnieuw of bel ons op 088 122 11 11." instead of a thank-you for a lead that went nowhere.

Copy was checked against the existing forms (`contact-page`, `herroepen-page`, `zv-form-copy`): u-vorm throughout,
"uw" only as a possessive. The old grid's thank-you ("Dank voor je interesse") used "je" and was not carried over. The
title/intro say "7 vragen" / "zeven korte vragen" (section settings `title`, `lead`); these numbers are literal copy,
so change them if a question is added or removed.

## The lead

One lead per submit, to `window.ZV_LEAD_ENDPOINT` (the Odoo CRM webhook; **not** Supabase `capture-lead`) through
`window.ZVLeadWebhook.send(rec, 'zelf_samenstellen_wizard')`. The record is built with `ZVMeasurement.buildCallbackLead`
like the contact and herroepen leads (`lead_source: 'website'`, `lead_temperature`, `page_url`, `timestamp`,
attribution). Our fields:

| Field | Value |
|---|---|
| `lead_type` | `zelfsamenstellen` |
| `cta_location` / `source_page` | `zelf_samenstellen_wizard` / `zelf-samenstellen` |
| `name`, `email`, `phone` | the form; `consent: true` (the checkbox is required) |
| `description` | one flat string (below) |
| `message` | the same string. Added on top of the brief: `message` is the free-text key the contact lead already sends and that is confirmed to reach Odoo; `description` is not verified. Drop one if Odoo ends up with the text twice. |

`description` is plain text, lines joined with line breaks, each ending in a full stop (so it still reads if a system
collapses them), never JSON. Example (alarm + camera's + video deurbel, Mijn Thuis, rijtjeswoning, 3 etages,
Buitencamera, Beide, 2 remotes):

```
Zelf samenstellen (offertewizard).
Beveiliging: Alarmsysteem, Camera's, Videodeurbel.
Zoekt beveiliging voor: Algemene beveiliging van de woning.
Type woning: Rijtjeswoning.
Etages: 3.
Camera-interesse: Buitencamera.
Rook- of waterdetectie: Rookmelder en watersensor.
Afstandsbedieningen: 2.
Aanbevolen producten: Camera's (buiten): Buitencamera bedraad Dome 826, 729 WiFi Camera Floodlight (Mickey), 730 Buitencamera met spotlight; Videodeurbel: Video Deurbel 750, Video Deurbel 780 (accu); Rook- en waterdetectie: Rookmelder, Watersensor; Bediening: Afstandsbediening x2.
Meerdere etages: de toeslag "Extra etage of >100 m²" kan van toepassing zijn. Bespreken in het adviesgesprek.
Pakketadvies: Protect (Mijn Thuis).
```

New with the 7 questions: the lines "Zoekt beveiliging voor", "Rook- of waterdetectie" and "Afstandsbedieningen" (the answers,
"Geen" / "3 of meer" in words), "Afstandsbediening x<N>" inside the product list, and the **package line now names the
line the advice came from** ("Protect (Mijn Thuis)", "Beschermd (Langer Thuis)"). The Meerdere-etages line appears only
from 2 etages, the Pakketadvies line only when a package is set; with nothing to list the product line reads "Aanbevolen
producten: geen specifieke producten." The lead's line order does not follow the on-screen order. No prices, no
`item_name`: the list says what suits the visitor, it is not a quote (no quantities beyond the remote count).

## Open follow-ups (not buildable from this repo)

- **The customer e-mail itself.** Needs an Odoo Automation Rule on `lead_type: 'zelfsamenstellen'` (mirroring the
  Herroepingsrecht ticket rule of 2026-10-14) that mails the summary and the "klantenservice neemt contact op" copy to
  the lead's address. Robi's side in Odoo. **Until it exists the visitor is told they will get an e-mail and none is
  sent**; do not point traffic at this page before the rule is live.
- **The Odoo `record_getter` must read the new fields** (`docs/contact-odoo-dual-write-2026-09-16.md`: an unknown field is
  silently dropped): `lead_type: 'zelfsamenstellen'`, `description`, and `message` if that one is to be used.
- The page still needs its Admin page `zelf-samenstellen` (template `zelf-samenstellen`); the Oplossingen pill points to
  `offerte.zoveilig.nl` via `zelf_url_override` meanwhile (`docs/zelf-samenstellen-2026-11-02.md`).
- `sections/zelf-samenstellen.liquid` (the old grid) and `sections/zelf-samenstellen-matcher.liquid` are **no longer on
  any template** and can be deleted when nobody wants them back; their `zv-match:apply` / `zv-wizard:apply` listeners are
  dead code until then.

## Decisions taken without a brief (say if any is wrong)

- **Q7 "Geen" beats Q1's alarm system**: no remote is listed then. Alarm only, with no camera, no rook/water and Q7 Geen,
  therefore lists no products at all (fallback sentence above, package advice still shown). The alternative is to keep a
  bare "Afstandsbediening" whenever Q1 has an alarm.
- **"3+" is shown as "x3+"** (and "3 of meer" in the lead's answer line).
- Both package pickers offer all six packages (Mijn Thuis ones are not restricted to Alert / Protect / Vista, nor Langer
  Thuis ones to Inzicht / Zeker / Beschermd); only the saved values are, today.
- The Q2 answer's lead text is short ("Algemene beveiliging van de woning", "Zelfstandig en veilig blijven wonen"), not
  the full option label.
- The title now reads "...in 7 vragen" (it was "4 vragen"); everything else that said four was updated too.

## Where the briefs and the repo differed

- The scoring quiz was not "never built": the quantity-based matcher (2026-11-02) was on main. It is no longer on the
  page, file left in place.
- "Inbraakbeveiliging" is not a category: "Met een alarmsysteem" -> Sensoren + Bediening (Thijs, 2026-11-17).
- Leads go to Odoo (`ZV_LEAD_ENDPOINT`), not Supabase `capture-lead` (a separate decision for Thijs).
- The brief's "Q1xQ6 camera combinations" is the camera question, which is Q5 after the insertion; Q6 is rook/water and
  Q7 the remote, as listed above.

## QA

Draft theme `zv-offerte-wizard-2026-11-17` (theme 190897357181, **persistent, do not delete**). Real Chrome over CDP,
`ZVLeadWebhook.send` stubbed (no lead left the browser). `shopify theme check`: 568 warnings / 0 errors, identical to
`origin/main` (4c6f257), none new in the touched files (the section needs `zv-pricing` for package names, an `include`,
so DeprecatedTag/UndefinedObject are switched off around those lines only). `scripts/check_pricing.py` fails on main too
with the same single line (`zv-infrarood-installatie.liquid` literal price); nothing added.

**7-question round: 38 check groups, 0 failures.**
- Structure: 7 steps, one h1 "Stel uw beveiliging samen in 7 vragen", no grid, intro says "zeven"; "Vraag n van 7" on every
  step (also the server-rendered first text), required answer enforced on every step, bar n/8, 100% and the counter
  hidden on the result; the question wording and order, and the exact option texts of Q2, Q6 and Q7.
- **Full matrix, 5,376 combinations** driven through the real handlers: Q1 (all 7 non-empty subsets) x Q2 (2 lines) x
  Q3 (3 types) x Q4 (1 and 2 etages) x Q5 (4) x Q6 (4) x Q7 (4). Every result equals an independent reference model of
  the rules: groups, names, order, "x<N>" counts, the Woning note, and the "Ons advies" package (both lines x all three
  types: Alert / Protect / Vista and Inzicht / Zeker / Beschermd). **Sensoren, Magneetcontact and PIR appear in none of
  them; Rookmelder and Watersensor appear only under "Rook- en waterdetectie".**
- Real clicks: all six line x type advice combinations; rook/water = Beide, Rookmelder, Watersensor with remote x2, x1,
  x3+; alarm + Geen everything = empty list with the fallback sentence and the package line; remote x2 without an alarm;
  camera's + Buitencamera = the 3 Buiten cameras and camera's + Binnencamera = Binnencamera 516 only (unchanged).
- No advice bar or link during the questions; the result order is heading, Ons advies, intro, list.
- Lead (stubbed), three scenarios: Mijn Thuis with every answer (the exact string above), Langer Thuis ("Pakketadvies:
  Beschermd (Langer Thuis)", no Woning line at 1 etage), and the nothing-to-list case; `message` equals `description`,
  contact fields and consent, no prices, nothing in the cart, the confirmation text.
- 390 px: Q2's long options wrap inside the card, the full result step has no horizontal overflow.

Not covered: a real device, and anything on the Odoo side (field mapping, the e-mail).

## Superseded: the 4-question, grid-based version (2026-11-17, first rounds)

Commits `74fbb1c` to `e2e2b3c`. The wizard started above the Winkelgrid (`sections/zelf-samenstellen.liquid`: hero, trust
strip, filter chips, hardware cards with Koop/Huur, "Uw set" summary, callback form, FAQ) with four questions (beveiliging,
type woning, etages, camera); after the last one it fired `zv-wizard:apply` and the grid filtered itself (a Woning note,
`#ccDescription` prefilled for the grid's callback form, lead type `camerahardware`). Later rounds dropped the grid for
the question -> lead -> e-mail flow, removed the Q2-era "Ons advies" bar with its Oplossingen link, and moved the package
line to the top of the result. What carried over into the 7-question wizard: the category union, the Binnen/Buiten
narrowing (and the 729 Floodlight's `type` change from `Camera` to `Buiten`, so Buitencamera shows three cameras), the
package mapping (now per line), the Woning note and the `description` idea. What was dropped: any selling (Koop/Huur, set
summary, phone-to-order), the grid's own callback form, the filter chips, the trust strip and the FAQ on this page, and
the Sensoren listing.
