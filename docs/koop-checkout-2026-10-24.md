# Koop lines in /cart, Overzicht and the cart guard (2026-10-24)

Branch `feature/koop-checkout-2026-10-23`. Follows the Huren/Kopen toggle
(`docs/huren-kopen-toggle-2026-10-23.md`, live since PR #141). Shopify only: no Odoo, Odoo Sign or
SEPA change, no monthly service-fee line, no selling plan, the "Eerste 3 maanden" discount untouched.

## What a Koop line is

`addKoopToCart()` on Oplossingen adds the Koop variant from the theme setting (Zo Veilig ·
Huren/Kopen) at quantity 1 with the property **`Afname: Kopen`**. That property is the signal.
The line's product handle says which package: each config package has a `koopProduct`
(Admin API, 2026-10-24):

| Package | Koop product | SKU | Price | installGroup |
|---|---|---|---|---|
| Inzicht | `koop-inzicht` | K001 | €299 | nami |
| Zeker | `koop-zeker` | K002 | €349 | nami |
| Beschermd | `koop-beschermd` | K003 | €849 | climax |
| Alert | `koop-alert` | K004 | €349 | nami |
| Protect | `koop-protect` | K005 | €799 | climax |

`build_pricing.py` emits `zv_koop_fk_by_handle` (handle → finder_key), and
`snippets/zv-koop-fk.liquid` turns a line into its package's finder_key. With only one of the
two (the property on another product, or a Koop product without the property) it prints
`invalid`, and Overzicht blocks checkout with the contact message (`cart_koop_bad`).

The Koop products are typed `NAMI_abonnementen` / `Huur Componenten`, not
`Beveiligingsabonnement`, and have no `custom.finder_key`. Nothing here relies on their type.

## Audit: the quantity-3 bump

`snippets/zv-cart-guard.liquid`, `planFix()` rule 2: a line is reset to `pkg_qty` (3) only if
`product_type === sub_type` ("Beveiligingsabonnement") **and** its handle is one of the five
huur package handles. Koop lines never matched that, so they were never bumped. Now they're also
excluded explicitly (`!isKoopProp(it)`), and get their own rule: quantity 1, one line per
Koop product. Overzicht's `cart_needs_fix` mirrors that (quantity ≠ 1 or a duplicate).

The real gap was the other way round. Because a Koop line wasn't a "package":
- a bought Climax package never got CL003 (guard rule 3), and rule 4 *removed* CL003 from a cart
  whose only Climax package was bought;
- Overzicht set neither `has_nami_pkg` nor `has_climax_pkg`, so there was no installation gate;
- the NAMI installation radio group only showed when exactly one *rented* package was
  recognised (`pkg_install_group`), so a Koop-only NAMI cart couldn't pick an installation.

## How a Koop line is treated now

- **Quantity 1:** the guard resets it to 1 and removes a duplicate.
- **Full price today, no promo:** the line's own `final_line_price`. Overzicht blocks checkout if
  a Koop line carries any discount (`cart_koop_bad`), whatever the discount setup. The "Eerste 3
  maanden" scope (Admin API, 2026-10-24) is A0071-A0073, LT-BES, MT-PRO, MT-VIS and N0008; no
  Koop product is in it.
- **Installation, same as Huur, by installGroup:** a bought NAMI package sets `has_nami_pkg`, so
  the existing radio group shows and `cart_needs_activation` waits for the customer's choice
  (N0004/N0005/N0006). A bought Climax package sets `has_climax_pkg`, so CL003 is required;
  `addKoopToCart()` adds it like a huur add, and the guard adds or keeps it. The install radio
  group, the "Installatie" row and the delivery text now key off `has_nami_pkg`
  (`show_nami_install`). That also fixes a cart with a rented NAMI and a rented Climax package,
  which had no radio group before.
- **Woning on a bought NAMI package: the property only** (Thijs, 2026-10-24). `addKoopToCart()`
  writes the `Woning` property, but there is no N0008 line and nothing is charged for it today;
  Odoo bills it with the monthly service fee. A Koop line never counts towards the N0008 quantity
  (guard rule 5, Overzicht's `nami_woning_floors`), and its handle is never in Woning
  `appliesTo` (`check_pricing.py`). /cart and Overzicht show "Woning: … (+€4/mnd)" on the line.
  Woning on a bought Climax package is stripped by the guard (rule 6), like a rented one.
- **No looptijd or contract:** never in `pkg_available`, so no "Looptijd", no ICV, no contractduur
  in the consent line; a cart that only buys also drops the "Opzeggen … na afloop van de
  contractduur" row. Not in "Daarna" either (no recurring amount in Shopify).
- **Display:** /cart and Overzicht show the package's config name, the label "Kopen", the
  one-time price and "Apparatuur, eenmalig"; the breakdown row is "<pakket> — kopen, eenmalig";
  /cart shows no +/− for it.
- **Koop add-on lines** (the Videodeurbel/Afstandsbediening Koop settings): hidden from every
  cart count like the huur add-ons (`zv-hidden-cart-lines.liquid`, the header badge), labelled
  "<naam> (kopen)", no +/−.

## Validation (2026-10-24)

- `python3 scripts/check_pricing.py`: 0 failures (section 15 now also pins the Koop products and
  `zv_koop_fk_by_handle`).
- `shopify theme check --fail-level error`: 0 errors. 35 more warnings than `origin/main`, all
  the existing include-scope `UndefinedObject` / `UnusedAssign` kind, plus Overzicht's
  LiquidComplexity going from 178 to 190.
- Disposable theme `zz-validate-koop-checkout-2026-10-24` with K001-K005 in its
  `settings_data.json` only (live and the repo untouched), real carts, deleted afterwards:
  - Koop Zeker with Woning: K002 × 1 at €349, `Afname: Kopen` + Woning property, no N0008 line;
    /cart keeps it at 1, no stepper; Overzicht shows the radio group and blocks until a choice,
    "Installatie aan huis" adds N0004, total €448,00, no looptijd/contract/Daarna.
  - Quantity set to 2 by hand: the guard resets it to 1.
  - Koop Protect: K005 × 1 €799 + CL003 × 1; the guard keeps CL003; total €898,00, no radio.
  - Koop Protect added without CL003: the guard adds it.
  - K001 without `Afname`: Overzicht blocks with the contact message.
  - Huren Zeker regression: A0072 × 3 at €37,44 (discounted), radio, "Looptijd 12 maanden".
  - No console errors beyond the known platform ones; the cart was cleared after each scenario.
- Not tested: the Koop add-on settings (no separate Koop Videodeurbel product; ADC-750 is already
  the huur row's product, so pointing the Koop setting at it would give two add-on names one
  variant), Shopify checkout itself, Odoo.

## Before filling the settings on live

Fill the five package settings with the K001-K005 variant ids. Leave the two add-on settings
empty until real Koop add-on products exist that differ from the huur ones. Odoo still has to turn
a Koop order into the monthly service fee (koopMaandelijks, plus Woning for NAMI); that's outside
this repo.
