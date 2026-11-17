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
| 2 | Wat voor type woning heeft u? | Appartement / Rijtjeswoning / Vrijstaand | none (lead only) |
| 3 | Uit hoeveel etages bestaat uw woning? | 1 / 2 / 3 / 4 etages | none, except from 2 etages: the Woning note appears (below) |
| 4 | Welke camera heeft uw interesse? | Geen / Deurbelcamera / Binnencamera / Buitencamera | Deurbelcamera -> `deurbel`; Binnencamera and Buitencamera -> `camera` (whole category); Geen -> nothing |

The grid shows the **union** of Q1's and Q4's categories (e.g. alarm + Deurbelcamera = Sensoren, Videodeurbel,
Bediening). The mapping lives in `data-cats` on the options in the section, not in the JS.

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
2. **Q2 and Q3 have nothing to highlight.** The grid is the hardware grid: no packages, and no Woning line,
   by design (Woning belongs to a package line; the cart guard removes a Woning line without a package, see
   `docs/zelf-samenstellen-2026-11-02.md` "Not on the page"). So "highlight/pre-select the suggested package
   tier" (Q2) has no target on this page, and the "pakket-matcher highlight pattern" lives on Vergelijk
   pakketten (`snippets/zv-pakket-matcher.liquid`, `assets/zv-vergelijk-pakketten.js`; `vergelijk-pakketten`
   is one of the lagging-on-live files, so it was not touched). Q2 therefore travels in the lead only. Q3 shows
   the explanatory Woning note instead of a purchasable add-on. **Decision for Thijs:** if a package tier should
   be suggested, say where (a link to Oplossingen / Vergelijk pakketten?).
3. **"Inbraakbeveiliging" is not a chip.** The chips are Sensoren, Camera's, Videodeurbel, Bediening. "Met een
   alarmsysteem" maps to Sensoren **and** Bediening (the remote arms the alarm). Change `data-cats` on that
   option if only Sensoren is wanted.
4. **Binnencamera/Buitencamera filtering is not actually blocked by missing data.** `koop-binnencamera-516`
   exists and is published (Admin API, 2026-11-02), and every camera row has `type` Binnen/Buiten/Camera. As
   briefed, both answers still show the whole camera category; making them filter is a one-line change in the
   section (`data-cats`) plus a type check in the grid. Waiting for Thijs.
5. **Deurbelcamera filters to the whole Videodeurbel category** (750 and 780), not the 750 alone.
6. **"Supabase capture-lead" is not this form's endpoint.** The callback form posts to
   `window.ZV_LEAD_ENDPOINT` (Odoo) through `ZVLeadWebhook`; `capture-lead` is the contact page. The wizard
   reuses the form's existing path and the `description` key from the matcher. **Whether Odoo maps `description`
   is still unverified**; fallback is `item_name`.
7. The wizard renders above the breadcrumb/h1 (it is a separate section above `main`), as the matcher did.

## QA (2026-11-17)

Draft theme `zv-offerte-wizard-2026-11-17` (**persistent, do not delete**). Real Chrome over CDP,
`ZVLeadWebhook.send` stubbed (no lead left the browser). Passed: every branch above, validation and error
states, Vorige keeps answers, focus on the legend per step, Koop click keeps filter + description, chip click,
Wissen, Toon alles, lead payload, nothing in the cart, 390 px (no horizontal overflow, options full width).
Not covered: a real device, Odoo's handling of `description`. Console errors seen are the primary-domain
redirect's CORS on `/cart.js` and platform 429/CSP, not theme errors.

`shopify theme check`: same 568 warnings / 0 errors as origin/main (4c6f257), no offense in the new or changed
files. `scripts/check_pricing.py` fails on main too, with the same single line
(`zv-infrarood-installatie.liquid` literal price); the wizard adds nothing to it.
