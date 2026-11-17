# Zelf samenstellen: offertewizard (2026-11-17)

Branch `feature/offerte-wizard-2026-11-17`. **Current scope (last round, 2026-11-17): no product grid.** The page
is a standalone question -> lead -> e-mail flow; nothing is sold or priced on it. The earlier grid-based version
is **superseded**, see the last section.

Files: `sections/zelf-samenstellen-wizard.liquid` (the whole page, scoped `.zv-wiz`), `assets/zv-offerte-wizard.js`,
`templates/page.zelf-samenstellen.json` (only the `wizard` section). Builds on `docs/zelf-samenstellen-2026-11-02.md`
and `docs/zelf-samenstellen-matcher-2026-11-02.md` (both historical now).

## What it does

Four questions, one at a time (progress bar, Vorige / Volgende, a required answer per step), then a result step.
It never touches the cart, shows or computes no price, and adds no checkout entry point.

| # | Question | Control | What it contributes |
|---|---|---|---|
| 1 | Hoe wilt u uw woning beveiligen? | checkboxes, at least one | Met een alarmsysteem -> `sensoren` + `bediening`; Met camera's -> `camera`; Met een video deurbel -> `deurbel` |
| 2 | Wat voor type woning heeft u? | Appartement / Rijtjeswoning / Vrijstaand | the package advice (below); also recorded in the lead |
| 3 | Uit hoeveel etages bestaat uw woning? | 1 / 2 / 3 / 4 etages | from 2 etages the Woning note |
| 4 | Welke camera heeft uw interesse? | Geen / Deurbelcamera / Binnencamera / Buitencamera | Deurbelcamera -> `deurbel`; Binnencamera -> `camera` narrowed to type Binnen; Buitencamera -> `camera` narrowed to type Buiten; Geen -> nothing |

The mapping lives in `data-cats` / `data-types` / `data-floors` / `data-tier-*` on the options in the section, and the
category -> product-name lookup is the JSON island `#zvwData` in the same file (names and types only; copied from the
rows of the old grid, see below). The matched set is the **union** of Q1's and Q4's categories. A Q4 option with
`data-types` narrows its category to products of that type, **also when Q1 asked for all cameras** ("Met camera's" +
Buitencamera = the 3 Buiten cameras, not all 4; Q4 is the more specific answer); if a narrowing would leave a
category empty it is dropped. Today: Binnen = Binnencamera 516; Buiten = Buitencamera bedraad Dome 826, 729 WiFi
Camera Floodlight (Mickey), 730 Buitencamera met spotlight.

**Q2 package advice (result step only).** The woning type maps to a package, shown as the static line
"Ons advies: <package>." on the result step (below) and recorded in the lead. Mapping (Thijs, 2026-11-17), set as
section settings in the template JSON (`tier_appartement` / `tier_rijtjeswoning` / `tier_vrijstaand`), not in code:
**Appartement -> Alert (`secure`), Rijtjeswoning -> Protect (`guard`), Vrijstaand -> Vista (`secure_plus`)**; the
optional `text_*` notes are blank, "Geen advies" hides the line for a type. The package name comes from the config
(`zv-package-name`), never a literal. A merge to main carries this mapping.

**Removed (2026-11-17, after the no-grid round): the "Ons advies" bar that used to appear right after Q2 was
answered**, with its "Bekijk dit pakket" button to `/pages/oplossingen?pakket=<finder_key>`. Why: visitors should stay
in the questionnaire and finish it, not be routed out to Oplossingen mid-flow (the link opened a new tab, but it still
invited leaving, and a lead only comes from finishing). What went with it: the bar markup, the `.zvw-advies*` and
`.zvw-sr` CSS (copied from the pakket-matcher's `.pm-advies`), `syncAdvies()` and its two call sites in
`assets/zv-offerte-wizard.js`, the `data-tier-href` attribute and the `zv-route` lookup that fed it, and the unused
`advies_cta` ("Knoptekst advies") section setting. What stayed: the Q2 -> package mapping as data
(`data-tier-name` / `data-tier-text` on the woning options, read at the result step), `advies_label`, and the
`Pakketadvies:` line in the lead's `description`. During Q2 nothing about a package is shown any more.

### Result step (after Q4: "Toon mijn aanbeveling")

On screen, top to bottom (the package comes first since 2026-11-17, it used to sit below the product list):

1. The heading "Uw aanbeveling".
2. **"Ons advies: <package>."** as static text (no link), directly under the heading, when Q2's type has a package set.
   It is styled to stand out: a tinted box with a check mark, the line itself at heading size (`clamp(18px, 2.2vw, 22px)`, weight 900: 22 px on desktop vs the
   23 px heading, 18 px at 390 px), and the optional `text_*` note in a smaller line under it. When
   no package is set the block is hidden and the page starts with the intro line.
3. "Op basis van uw antwoorden past dit bij u:" and **a plain list** (not cards) of the matched products, grouped
   under their category ("Sensoren", "Camera's (buiten)", "Videodeurbel", "Bediening"). Names only: no price, no
   product code, no buy control. Unchanged by the reorder.
4. The **Woning note** from 2 etages: the toeslag "Extra etage of >100 m²" comes with a subscription, is not
   orderable on its own, and is discussed in the adviesgesprek. No code or amount in it (`check_pricing.py` #13
   forbids a theme file naming the Woning products).
5. **The contact form**: Naam, E-mailadres, Telefoonnummer (all required, e-mail format checked), the shared
   consent checkbox (`zv-form-copy` consent and consent_error, the single source for lead forms), button
   "Ontvang uw aanbeveling per e-mail". "Antwoorden wijzigen" goes back to Q4 with every answer kept.
6. On submit: **"Bedankt. U ontvangt de aanbeveling per e-mail. Onze klantenservice neemt ook contact met u op."**
   If the lead cannot be sent at all (no `ZV_LEAD_ENDPOINT` or no `ZVLeadWebhook`), the visitor gets "Het versturen
   is niet gelukt. Probeer het later opnieuw of bel ons op 088 122 11 11." instead of a thank-you for a lead that
   went nowhere.

Copy was checked against the existing forms (`contact-page`, `herroepen-page`, `zv-form-copy`): u-vorm throughout,
"uw" only as a possessive ("uw antwoorden", "uw aanbeveling"). The old grid's thank-you ("Dank voor je interesse")
used "je" and was **not** carried over.

## The lead

One lead per submit, to `window.ZV_LEAD_ENDPOINT` (the Odoo CRM webhook; **not** Supabase `capture-lead`) through
`window.ZVLeadWebhook.send(rec, 'zelf_samenstellen_wizard')`. The record is built with
`ZVMeasurement.buildCallbackLead` like the contact and herroepen leads, so it carries `lead_source: 'website'`,
`lead_temperature`, `page_url`, `timestamp` and the attribution fields. Our fields:

| Field | Value |
|---|---|
| `lead_type` | `zelfsamenstellen` (new) |
| `cta_location` / `source_page` | `zelf_samenstellen_wizard` / `zelf-samenstellen` |
| `name`, `email`, `phone` | the form; `consent: true` (the checkbox is required) |
| `description` | one flat string (below) |
| `message` | the same string. **Added on top of the brief**: `message` is the free-text key the contact lead already sends and that is confirmed to reach Odoo; `description` is not verified. Drop one if Odoo ends up with the text twice. |

`description` is plain text, lines joined with line breaks, each ending in a full stop (so it still reads if a system
collapses them), never JSON. Example (alarm + camera's + video deurbel, rijtjeswoning, 3 etages, Buitencamera):

```
Zelf samenstellen (offertewizard).
Beveiliging: Alarmsysteem, Camera's, Videodeurbel.
Type woning: Rijtjeswoning.
Etages: 3.
Camera-interesse: Buitencamera.
Aanbevolen producten: Sensoren: Magneetcontact (DC-23), PIR Bewegingsdetector, Rookmelder, Watersensor; Camera's (buiten): Buitencamera bedraad Dome 826, 729 WiFi Camera Floodlight (Mickey), 730 Buitencamera met spotlight; Videodeurbel: Video Deurbel 750, Video Deurbel 780 (accu); Bediening: Afstandsbediening.
Meerdere etages: de toeslag "Extra etage of >100 m²" kan van toepassing zijn. Bespreken in het adviesgesprek.
Pakketadvies: Protect.
```

The Meerdere-etages line appears only from 2 etages, the Pakketadvies line only when Q2's type has a package. The
on-screen reorder did not change the lead: the `Pakketadvies:` line stays at the end of `description` and `message`
(the text is for the adviser, it need not follow the screen). No prices,
no `item_name`: the list says what suits the visitor, it is not a quote (no quantities).

## Open follow-ups (not buildable from this repo)

- **The customer e-mail itself.** Needs an Odoo Automation Rule on `lead_type: 'zelfsamenstellen'` (mirroring the
  Herroepingsrecht ticket rule of 2026-10-14) that mails the summary and the "klantenservice neemt contact op" copy to
  the lead's address. Robi's side in Odoo. **Until it exists the visitor is told they will get an e-mail and none is
  sent**; do not point traffic at this page before the rule is live.
- **The Odoo `record_getter` must read the new fields.** A field it does not know is silently dropped
  (`docs/contact-odoo-dual-write-2026-09-16.md`): `lead_type: 'zelfsamenstellen'`, `description`, and `message` if that
  one is to be used. Not verifiable from here.
- The page still needs its Admin page `zelf-samenstellen` (template `zelf-samenstellen`); the Oplossingen pill points
  to `offerte.zoveilig.nl` via `zelf_url_override` meanwhile (`docs/zelf-samenstellen-2026-11-02.md`).
- `sections/zelf-samenstellen.liquid` (the old grid) and `sections/zelf-samenstellen-matcher.liquid` are **no longer
  on any template** and can be deleted when nobody wants them back; the `zv-match:apply` / `zv-wizard:apply` listeners
  in the grid file are dead code until then.

## Where the briefs and the repo differed

- The scoring quiz was not "never built": the quantity-based matcher (2026-11-02) was on main. It is no longer on the
  page, file left in place.
- "Inbraakbeveiliging" is not a category: "Met een alarmsysteem" -> Sensoren + Bediening (Thijs, 2026-11-17).
- Leads go to Odoo (`ZV_LEAD_ENDPOINT`), not Supabase `capture-lead` (a separate decision for Thijs).
- The wizard now sits alone on the page, so its title is the page's `<h1>` (it was an `<h2>` under the grid's h1).
- The Q2 advice bar with the Oplossingen link was built in an earlier round and removed in the last one (see above);
  the advice is static text on the result step only.

## QA

Draft theme `zv-offerte-wizard-2026-11-17` (theme 190897357181, **persistent, do not delete**). Real Chrome over CDP,
`ZVLeadWebhook.send` stubbed (no lead left the browser). `shopify theme check`: 568 warnings / 0 errors, identical to
`origin/main` (4c6f257), none new in the touched files (the section needs `zv-pricing` for package names, an `include`,
so DeprecatedTag/UndefinedObject are switched off around those lines only, as other sections do).
`scripts/check_pricing.py` fails on main too with the same single line (`zv-infrarood-installatie.liquid` literal
price); nothing added.

**Latest round (package line moved to the top of the result): 73 checks, 0 failures**, everything below re-run plus:
- For Appartement / Rijtjeswoning / Vrijstaand the result's children are in the order heading, Ons advies, intro,
  product list, both in the DOM and by on-screen position (`getBoundingClientRect`), with the line at 22 px / weight 900
  next to the 23 px heading (measured at 1280 px).
- The product groups for alarm (Sensoren 4 + Bediening 1) and all 16 Q1 x Q4 lists are unchanged.
- 390 px: the Ons advies box sits between the heading and the intro, fits inside the card (320 of 358 px), no horizontal
  overflow, the rest of the result and the form lay out as before. The lead `description` check (exact string incl.
  `Pakketadvies:`) still passes. `shopify theme check` 568 / 0 like `origin/main`, `check_pricing.py` only the known failure.

**Previous round (Q2 bar removed): 63 checks, 0 failures**, the no-grid checks below re-run unchanged plus:
- After Q2 for each of Appartement / Rijtjeswoning / Vrijstaand: no `.zvw-advies` / `#zvwAdvies*` element, no `.pm-advies`,
  no link at all in the question form, no `pakket=` / `oplossingen` link, no `target=_blank`, no `data-tier-href`, and
  no "Ons advies" / "Bekijk dit pakket" text; choosing a type opens no new tab and the page stays on question 2.
- Result step after Q4 still shows "Ons advies: Alert / Protect / Vista." (static, no link, no `pakket=` link in the
  result), and the lead's `description` still ends with the `Pakketadvies:` line.
- All 16 Q1 x Q4 combinations again produce exactly the expected lists. `shopify theme check` 568 warnings / 0 errors
  (same as `origin/main`, none new); `check_pricing.py` only the known `zv-infrarood-installatie.liquid` failure.

**No-grid round: 62 checks, 0 failures.**
- The grid, filter chips, summary, old callback form and matcher are gone from the page; one `<h1>`.
- 16 Q1 x Q4 combinations (Q1 = alarm / camera's / deurbel / all three, Q4 = Geen / Deurbelcamera / Binnencamera /
  Buitencamera): the results list equals the expected category groups and names exactly, none empty. Spelled out:
  camera's + Binnencamera = Binnencamera 516 only; camera's + Buitencamera = the 3 Buiten cameras; alarm = 4 sensors
  + the remote.
- Woning note hidden at 1 etage, shown at 2, 3, 4; no price or product code in it.
- "Ons advies" in the result: Alert / Protect / Vista for Appartement / Rijtjeswoning / Vrijstaand, static text with no
  link. (This round also checked the Q2 bar, since removed.)
- Form validation (empty form names all four problems; bad e-mail; no consent -> the shared consent error); missing
  endpoint -> honest error, no thank-you; real submit -> the confirmation text above.
- Lead (stubbed): `lead_type` `zelfsamenstellen`, contact fields, `consent: true`, standard `buildCallbackLead` fields,
  `description` equal to the exact flat string above, `message` equal to it, no prices / `item_name`; nothing in the cart.
- 390 px: no horizontal overflow on the result step, send button full width; "Antwoorden wijzigen" returns to Q4
  with the answer kept.

Not covered: a real device, and anything on the Odoo side (field mapping, the e-mail).

## Superseded: the grid-based version (2026-11-17, first three rounds)

Commits `74fbb1c`, `752f2c3`, `3ff5aa8`. The wizard sat above the Winkelgrid (`sections/zelf-samenstellen.liquid`: hero,
trust strip, filter chips, hardware cards with Koop/Huur, "Uw set" summary, callback form, FAQ). After Q4 it fired
`zv-wizard:apply` and the grid filtered itself to the matched categories (a chip per category, "Toon alles", a Woning
note, `#ccDescription` prefilled for the grid's callback form, lead type `camerahardware`). That whole mechanism is gone
from the wizard and the template. What carried over: the Q1/Q4 category union, the Binnen/Buiten narrowing (and the 729
Floodlight's `type` change from `Camera` to `Buiten`, which is why Buitencamera shows three cameras), the Q2 mapping
(its mid-flow advice bar was removed later), the Woning note, the `description` idea. What was dropped: any selling (Koop/Huur, set summary, phone-to-order),
the grid's own callback form (lead type `camerahardware`, a terugbelverzoek) in favour of the e-mail lead above, the
filter chips, the trust strip and the FAQ on this page.
