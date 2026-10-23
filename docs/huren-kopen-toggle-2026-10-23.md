# Huren/Kopen toggle (draft, 2026-10-23)

Branch `feature/huren-kopen-toggle-2026-10-23`. Draft theme `zv-huren-kopen-draft-2026-10-23`
(#190019338621) on zoveiligdev, left in place for review in the theme editor. Shopify only: no
Odoo change, no products created, Vista untouched.

## What it does

The five fixed packages (Inzicht, Zeker, Beschermd, Alert, Protect) get a Huren/Kopen choice
on their Oplossingen card. Huren is the default and the card is exactly as before. Kopen
shows the one-time hardware price plus the reduced monthly fee for the service (no hardware
cost in it), hides the huur price, the looptijd and the huur buy button, and shows a Kopen
button. The hardware add-on rows in the Uitbreidingen accordion (Videodeurbel,
Afstandsbediening) get their own Huren/Kopen choice. Ontzorgpakket (a service), the Woning
choice, Vista and Veilig Onderweg get none.

| Package | Huur (unchanged) | Kopen eenmalig | Kopen per maand |
|---|---|---|---|
| Inzicht | €19,95/mnd | €299 | €9,95/mnd |
| Zeker | €24,95/mnd | €349 | €9,95/mnd |
| Beschermd | €39,95/mnd | €849 | €19,95/mnd |
| Alert | €24,95/mnd | €349 | €9,95/mnd |
| Protect | **€37,95/mnd** | €799 | €19,95/mnd |

Protect huur: the brief said €34,95 "unchanged", but the config and the live Shopify variant
(MT-PRO, Admin API read 2026-10-23) are €37,95, confirmed by Thijs on 2026-09-23. Left at €37,95.

Add-on koop prices (`addonNames[].koopEenmalig`, the existing one-time Shopify products, Admin
API read 2026-10-23):

| Add-on (card row) | Huren row (live, unchanged) | Kopen | Source of the koop price |
|---|---|---|---|
| Videodeurbel | `koop-video-deurbel-750` ADC-750, +€299,00 | +€299 eenmalig | the same ADC-750 product |
| Afstandsbediening (Climax only) | `huur-afstandsbediening` H0010, +€0,80 | +€40 eenmalig | `koop-afstandsbediening` CL004 |

The Videodeurbel row's Huren price is the live price of a product that is itself a one-time
(koop) product, so both rows show €299 until Alex's rental conversion lands. Nothing in this
branch changes the Huren row.

## Where things live

- `pricing/pricing.config.json`: `koopEenmalig` / `koopMaandelijks` per package, `koopEenmalig`
  (+ `koopSource`) on the two add-ons, and a top-level `koop` block (`status: DISPLAY_ONLY`,
  `promoApplies: false`).
- `scripts/build_pricing.py`: copies the koop figures into each generated package row (`koop`)
  and emits `zv_<pakket>_koop_eenmalig_cents`, `zv_<pakket>_koop_maandelijks_cents` and
  `zv_koop_addon_cents_by_handle`. It refuses to build if `koop.promoApplies` is true.
- `scripts/check_pricing.py` section 15: the confirmed koop numbers, no koop on Vista / Veilig
  Onderweg, no promo field on any koop row, koop monthly below huur monthly, assigns match.
- `config/settings_schema.json`, group "Zo Veilig · Huren/Kopen": one Koop variant-ID text
  setting per package (`zv_koop_variant_<pakket>`) and per add-on
  (`zv_koop_variant_videodeurbel`, `zv_koop_variant_afstandsbediening`). All empty.
- `sections/oplossingen.liquid`: the toggles, the Kopen price blocks, the Kopen button,
  `addKoopToCart()`, `optName()` / `setAddonMode()`, and the drawer's koop row.

## Intro promo: Huren only

Nothing in the theme computes the 50% discount; Shopify's automatic "Eerste 3 maanden"
discount does, on the package line at quantity 3. The guards for Kopen:
- `build_pricing.py` never runs a koop figure through the promo maths and fails on
  `promoApplies: true`; `check_pricing.py` fails if a koop row carries a promo field.
- A Kopen add never goes through `addToCart()` (which adds at `PKG_QTY`); `addKoopToCart()`
  adds the Koop variant at quantity 1.
- The card shows no promo text in either mode (it never did on Oplossingen).
- Not guarded from the theme: if a Koop variant is created as a variant of the *same* product
  as the huur package, the automatic discount (scoped by product) would apply to it. Create
  the Koop variants as separate products, or keep them out of the discount's scope.

## Empty setting = "binnenkort"

With the setting empty (the state of the draft and of this branch), the package card's Kopen
button is disabled and reads "Kopen: binnenkort beschikbaar", and a Kopen add-on row shows its
price with "· binnenkort" while its checkbox is unchecked and disabled, so nothing koop can
reach the cart.

When a setting is filled: the Kopen button adds that variant once (quantity 1) with the
properties `Pakket`, `SKU` (the huur package SKU, also used to find the card in the drawer),
`Afname: Kopen`, `Oplossing`, `Bron` and any `Uitbreidingen` / `Abonnement`, never `Woning`. A
Kopen add-on is recorded as `<naam> (koop)` in `Uitbreidingen` and `syncAddonLines()` keeps
one line of its Koop variant at quantity 1. The Oplossingen drawer shows a koop package line as
"€X eenmalig".

## Before a Koop variant ID may be filled in on the live theme

Filling the setting is not the only step left. These are not built, and the brief kept Odoo
out of scope:
1. `/cart`, Overzicht and `zv-cart-guard` don't know a koop line. If the Koop product has
   type `Beveiligingsabonnement`, the guard resets it to quantity 3 and Overzicht blocks
   checkout as an undiscounted package (`cart_pkg_undiscounted`). Any other type and it isn't
   seen as a package: no installation is required, there are no contract rows, and checkout
   is allowed with only the one-time amount.
2. No installation line is added for a Kopen package (Climax CL003 or the NAMI choice).
3. The monthly service fee (`koopMaandelijks`) isn't collected anywhere: nothing in Shopify
   charges it and Odoo has no SEPA amount or contract template for it.
4. Odoo will see `Afname: Kopen`, `SKU` (the huur SKU) and `<naam> (koop)` in `Uitbreidingen`
   on the order; none of that is mapped.
5. The "Meer informatie" modal still only offers Huren.
6. `/pages/vergelijk-pakketten` (comparison table, pakket-matcher) and the homepage finder
   show huur prices only; no toggle there.

## Open questions for Thijs

- Kopen copy on the card: "Plus €9,95/mnd voor de dienst, zonder apparatuurkosten". NAMI
  packages have no meldkamer, so the brief's "meldkamer/app" wording wasn't used.
- Looptijd for the Kopen service fee: hidden in Kopen mode because no term was given.
- Woning surcharge (+€4/mnd per verdieping) for a bought NAMI package: not offered on a Kopen
  add (not decided).
- Installation for a bought package: same as Huren, or included?

## Validation (2026-10-23)

- `python3 scripts/build_pricing.py` and `python3 scripts/check_pricing.py`: all checks pass,
  every huur figure unchanged.
- `shopify theme check --fail-level error`: no errors (same as `origin/main`; +22 warnings, all
  the existing include-scoped `UndefinedObject` / `UnusedAssign` kind).
- Pushed to the draft theme; `sections/oplossingen.liquid`, `snippets/zv-pricing.liquid` and
  `config/settings_schema.json` pulled back byte-identical (Shopify's validator accepted them).
- Playwright on the draft preview, desktop and 390px: toggles on exactly the 5 packages, none
  on Vista or Ontzorgpakket; Kopen shows the right numbers, no promo text, a disabled
  binnenkort button; add-on Kopen disables the checkbox; Huren restores; no horizontal
  overflow; no console errors beyond the three known platform ones.
- Kopen add path with the settings simulated (HTML rewritten in the test, Cart AJAX mocked, so
  nothing real was added): package at quantity 1 with `Afname: Kopen` and no Woning, no
  installation or huur line, add-on Koop variant at quantity 1, drawer row "€349,00 eenmalig".
- Real Huren add on the draft (Zeker): N0002 × 3, €37,44, as before.
- Not tested: a real Koop product in a cart, `/cart`, Overzicht, checkout, Odoo.

## Live theme state at the start (not touched here)

A pull of the live theme on 2026-10-23 matched `origin/main` except five files where live still
runs the previous version: `snippets/price.liquid`, `sections/zv-search.liquid`,
`sections/zv-footer.liquid` and `sections/vergelijk-pakketten.liquid` (live lacks `4bdf774`,
2026-10-14), and `sections/legal-page.liquid` (the known 2026-10-12 drift). None is a live-only
edit, and this branch changes none of them.
