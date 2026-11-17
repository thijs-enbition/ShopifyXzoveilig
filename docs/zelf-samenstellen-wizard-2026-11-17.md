# Zelf samenstellen: offertewizard (2026-11-17)

Branch `feature/offerte-wizard-2026-11-17`. Files: `sections/zelf-samenstellen-wizard.liquid` (new, scoped
`.zv-wiz`), `assets/zv-offerte-wizard.js` (new), `sections/zelf-samenstellen.liquid` (the grid: listens for
the wizard, multi-category filter, two small notes), `templates/page.zelf-samenstellen.json` (`wizard` first
in `order`, replacing `matcher`). Builds on `docs/zelf-samenstellen-2026-11-02.md` and
`docs/zelf-samenstellen-matcher-2026-11-02.md`.

## What it does

Four questions, one at a time (progress bar, Vorige/Volgende, a required answer per step). It filters and
annotates the existing Winkelgrid and puts the answers in the callback form. It computes and shows no price,
touches no cart and adds no checkout entry point.

| # | Question | Control | Effect on the grid |
|---|---|---|---|
| 1 | Hoe wilt u uw woning beveiligen? | checkboxes, at least one | Met een alarmsysteem -> `sensoren` + `bediening`; Met camera's -> `camera`; Met een video deurbel -> `deurbel` |
| 2 | Wat voor type woning heeft u? | Appartement / Rijtjeswoning / Vrijstaand | none on the grid; an "Ons advies" bar with a link to a package on Oplossingen (see "Q2 package advice") |
| 3 | Uit hoeveel etages bestaat uw woning? | 1 / 2 / 3 / 4 etages | none, except from 2 etages: the Woning note appears (below) |
| 4 | Welke camera heeft uw interesse? | Geen / Deurbelcamera / Binnencamera / Buitencamera | Deurbelcamera -> `deurbel`; Binnencamera -> `camera`, only rows with `type` Binnen; Buitencamera -> `camera`, only rows with `type` Buiten; Geen -> nothing |

The grid shows the **union** of Q1's and Q4's categories (e.g. alarm + Deurbelcamera = Sensoren, Videodeurbel,
Bediening). The mapping lives in `data-cats` / `data-types` on the options in the section, not in the JS.

**Binnen/Buiten narrowing (2026-11-17).** A Q4 option with `data-types` narrows its category to rows of that
`type`, **also when Q1 asked for all cameras** ("Met camera's" + Buitencamera = the two Buiten cameras, not
all four; Q4 is the more specific answer). Q1 "Met camera's" with Q4 Geen or Deurbelcamera still shows all four
cameras. Today: Binnen = Binnencamera 516; Buiten = 730 Buitencamera met spotlight + Buitencamera bedraad Dome
826. The note above the grid says which ("Camera's (buiten)"). If a narrowing would leave no card at all (a
row's type renamed), the grid drops it for that category instead of going empty. A chip click or "Toon alles"
drops it as well.

## Q2 package advice (2026-11-17)

After a woning type is chosen, step 2 shows an "Ons advies: <package>." bar with a button
"Bekijk dit pakket", in the pakket-matcher's `.pm-advies` look (the snippet's CSS is scoped to
`.zv-vergelijk` and loaded with that page's asset, so the few rules are copied into `.zv-wiz`, not loaded).
The link is `/pages/oplossingen?pakket=<finder_key>`: the existing Keuzehulp interlink on Oplossingen, which
switches to that package's tab and opens its "Meer informatie" modal, so no new anchor was needed. It opens in a
new tab (`rel=noopener`) because the wizard's answers would be lost on a same-tab navigation. The package
name comes from the config (`zv-package-name` via `zv_package_names_by_fk`), never a hardcoded string.

**The woning type -> package mapping is NOT confirmed, so none is hardcoded.** Nothing in the repo ties a
house type to a package: the tiers differ in care level (Inzicht / Zeker / Beschermd, Alert / Protect / Vista),
not in house type, and the pakket-matcher's own scenario mapping is a placeholder that still needs sign-off
(CLAUDE.md, "Pakket-matcher"). So the section has settings per woning type (a package picker, default
"Geen advies", plus an optional one-line toelichting). **Until Thijs/Robi fill them in (theme editor, section
"Zelf samenstellen wizard", "Pakketadvies bij vraag 2"), no bar shows.** The advice is not added to the lead
description (a suggestion is not a choice). The bar was QA'd on the draft theme with a throwaway test
mapping that was removed again.

After Q4 ("Toon mijn selectie") the page scrolls to `#winkel`. The grid then:
- shows only those categories (several chips lit; the "Alle" chip is off) and a note "Getoond op basis van uw
  antwoorden: ..." with "Toon alles";
- from 2 etages shows a Woning note: "Extra etage of >100 m²" is a toeslag on a subscription, not orderable on
  its own, discussed in the adviesgesprek. No product code and no amount in it (`check_pricing.py` #13 forbids
  a theme file naming the Woning products);
- puts `Offertewizard: Beveiliging: ...; Woning: ...; Etages: n; Camera: ...` in the hidden `#ccDescription`
  of the callback form and shows the same text above the form ("Uw antwoorden gaan mee: ...", with "Wissen").

Interplay: Koop/Huur clicks keep the filter and the description (state is `state.cats`, not DOM). A category
chip click takes over from the wizard filter and removes its notes; the description stays (visible, "Wissen")
until "Toon alles" or "Wissen". The lead keeps `lead_type: 'camerahardware'`, `source_page`, `cta_location` and
the webhook source; `item_name` / prices still describe only what the visitor picked in the grid.

## Where the brief and the repo differed (read this)

1. **The scoring quiz was not "never built".** `sections/zelf-samenstellen-matcher.liquid` (quantity-based
   matcher, 2026-11-02) is on main and was on the template. The template now renders the wizard instead.
   The matcher section file and the grid's `zv-match:apply` handler are **left in place, unused** (easy to
   put back in the template; delete both when nobody wants them).
2. **Q2 and Q3 had nothing to highlight on the grid.** The grid is the hardware grid: no packages, and no
   Woning line, by design (Woning belongs to a package line; the cart guard removes a Woning line without a
   package, see `docs/zelf-samenstellen-2026-11-02.md` "Not on the page"). Q3 therefore shows only an
   explanatory note. Q2 (follow-up, 2026-11-17) links to the package on Oplossingen instead, in the
   pakket-matcher's "Ons advies" look, driven by section settings that are still empty (the mapping is not
   confirmed, see "Q2 package advice"). `vergelijk-pakketten` (one of the files lagging on live) was not touched.
3. **"Inbraakbeveiliging" is not a chip.** The chips are Sensoren, Camera's, Videodeurbel, Bediening. "Met een
   alarmsysteem" maps to Sensoren **and** Bediening (confirmed by Thijs 2026-11-17; was already so in the first
   version, `data-cats="sensoren bediening"`).
4. **Binnencamera/Buitencamera now filter** (2026-11-17), because `koop-binnencamera-516` exists and is
   published (Admin API, 2026-11-02) and the camera rows carry `type` Binnen/Buiten/Camera. **Gap: the 729 WiFi
   Camera Floodlight (Mickey) has `type: 'Camera'`, so "Buitencamera" does NOT show it**, although it is an
   outdoor floodlight camera (the old matcher offered it as "Liever draadloos" outdoor). Fixing it means setting
   that row's `type` to `Buiten` in the HW array, which also changes its badge from CAMERA to BUITEN.
5. **Deurbelcamera filters to the whole Videodeurbel category** (750 and 780), not the 750 alone.
6. **"Supabase capture-lead" is not this form's endpoint.** The callback form posts to
   `window.ZV_LEAD_ENDPOINT` (Odoo) through `ZVLeadWebhook`; `capture-lead` is the contact page. The wizard
   reuses the form's existing path and the `description` key from the matcher. **Whether Odoo maps `description`
   is still unverified**; fallback is `item_name`.
7. The wizard renders above the breadcrumb/h1 (it is a separate section above `main`), as the matcher did.

## QA

### 2026-11-17, first version
Draft theme `zv-offerte-wizard-2026-11-17` (**persistent, do not delete**). Real Chrome over CDP,
`ZVLeadWebhook.send` stubbed (no lead left the browser). Passed: every branch above, validation and error
states, Vorige keeps answers, focus on the legend per step, Koop click keeps filter + description, chip click,
Wissen, Toon alles, lead payload, nothing in the cart, 390 px (no horizontal overflow, options full width).
Not covered: a real device, Odoo's handling of `description`. Console errors seen are the primary-domain
redirect's CORS on `/cart.js` and platform 429/CSP, not theme errors.

### 2026-11-17, follow-up (Q2 advice, alarm = Sensoren + Bediening, Binnen/Buiten)
Same method. A 16-combination matrix, Q1 (alarm / camera's / deurbel / all three) x Q4 (Geen / Deurbelcamera /
Binnencamera / Buitencamera), each asserting the exact expected cards and a non-empty grid: all 16 pass. For
the two narrowed branches: Binnencamera returns only "Binnencamera 516" (1 card with Q1 = camera's), Buitencamera
only "730 Buitencamera met spotlight" + "Buitencamera bedraad Dome 826" (2 cards). Alarm alone = 4 Sensoren + 1
Bediening, in every combination. Q2 bar: right package name, link `/pages/oplossingen?pakket=<fk>` (answers 200),
`target=_blank rel=noopener`, persists across Volgende/Vorige, no advice text in the lead, no bar when a woning
type is unmapped, 390 px without horizontal overflow. The first-version scenario "camera's + deurbel +
Buitencamera = 6 cards" is superseded on purpose (now 4: the two Buiten cameras + 2 deurbellen).

`shopify theme check`: 568 warnings / 0 errors, identical to `origin/main` (4c6f257), none new in the touched
files (the section needs `zv-pricing` for package names, an `include`, so its DeprecatedTag/UndefinedObject
are switched off around those lines only, as other sections do with `theme-check-disable`).
`scripts/check_pricing.py` fails on main too with the same single line (`zv-infrarood-installatie.liquid`
literal price); nothing added.
