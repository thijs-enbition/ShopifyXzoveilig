# Uitbreidingen: NAMI Videodeurbel Koop-only, CL004 by handle, one compact list (2026-10-27)

Built on top of `docs/a102b-e001-climax-woning-2026-10-27.md` (same worktree and branch, not
committed yet: it needs that work's `zv-addon-riders` and the A102B pairing).

## 1. What changed

1. **Videodeurbel is Koop-only on the NAMI cards** (Inzicht, Zeker, Alert). No Huren side, no
   Huren/Kopen control: one single-price row "€299 + €3,50/mnd" (ADC-750 + A102B, both live), like
   Ontzorgpakket. It records `Videodeurbel (koop)`. Climax (Beschermd, Protect) is unchanged: Huren
   H750, Kopen ADC-750 + A102B.
2. **Afstandsbediening Kopen resolves by handle** (`koop-afstandsbediening`, CL004) and the theme
   setting is **retired**. It was never filled in (`settings_data.json` had no value), which is why
   the Kopen side read "binnenkort" for months. Climax only, as before.
3. **One compact Uitbreidingen list** per card: a bordered list, one row per add-on (checkbox, name,
   and where there is a real choice the two-segment control with each side's own price).

## 2. Where it lives

| Place | What |
|---|---|
| `pricing.config.json` `addonNames[]` | Afstandsbediening gets `koopProduct` {koop-afstandsbediening, CL004}; the Videodeurbel note no longer says the choice is on every card. |
| `scripts/build_pricing.py` | Emits `zv_koop_addon_product_by_handle` (Huren handle -> Koop handle). |
| `scripts/check_pricing.py` §15 | Pins CL004, the map, and fails if the retired setting is in any theme file or schema, or if any Koop setting is read for a hardware add-on. |
| `config/settings_schema.json` | The Afstandsbediening field is gone; the paragraph says the hardware add-ons are by handle. |
| `sections/oplossingen.liquid` | `ltc_addons` entry field `koop` (NAMI Videodeurbel); the add-ons group markup; list/segment CSS; Koop product, variant, price and the rider's price all read live. |
| `snippets/zv-hidden-cart-lines.liquid`, `sections/zv-checkout-overview.liquid` | CL004's variant by handle instead of the setting (so /cart, Overzicht and the header count recognise its line). |

No change to `syncAddonLines()`, the guard or the drawer logic. The new markup keeps what they read:
radios with `data-zv-mode` inside `.ltc__mode`, `.pcard__plus-item` / `.pcard__plus-opt`, the name as
the row's first span, and the `is-koop` class (permanently on NAMI's Koop-only row, so `optName()`
gives `Videodeurbel (koop)` even when it is ticked from the drawer). The drawer drops `.ltc__mode` and
shows the chosen mode's price in `.pcard__plus-pr`, which the card hides while the control exists
(`:has(.ltc__mode)`).

## 3. Found on the way

- **CL004 was not purchasable by handle when this was requested.** It was ACTIVE with
  `inventoryPolicy CONTINUE`, but **published to no sales channel** (`publishedAt` null), so
  `/products/koop-afstandsbediening.js` 404'd and `all_products` returned nothing. It was published
  to the Online Store at 2026-10-27 14:39 UTC (not from this repo); from then on it resolves. Until
  a Koop product is published its row reads "binnenkort" with a disabled checkbox.
- **The Oplossingen page is now at exactly 20 `all_products` handles**, the limit. Verified with a
  published stand-in in every file that looks CL004 up: the 20th resolves and all five cards render.
  An unpublished product also resolves to nothing *and still counts*, so a missing publication can
  look like the limit. The next product looked up on that page needs a handle freed first.

## 4. Validation (disposable theme `zz-validate-a102b-e001`, #190133797245)

- `build_pricing.py` + `check_pricing.py` pass (the two new §15 checks were red first, green after
  the retirement). `shopify theme check`: 0 errors. The server-side validator accepted every file.
- **Server HTML:** NAMI cards list Videodeurbel (single row "€299 + €3,50/mnd") and Ontzorgpakket,
  with no control and no Afstandsbediening; Climax cards list both hardware rows with segments
  Huren "€9,55/mnd" | Kopen "€299 + €3,50/mnd" and Huren "€0,80/mnd" | Kopen "€40,00", and
  Ontzorgpakket "+€10,50/mnd"; the CL004 variant resolves; no card is missing.
- **Layout:** screenshots on desktop (1280px) and 390px, no horizontal scroll and the list inside the
  card on every card.
- **Cart behaviour (emulated Cart AJAX, the theme's own JS):** NAMI Zeker ticks Videodeurbel ->
  ADC-750 x1 + A102B x1, property `Videodeurbel (koop)`, never H750; the drawer shows it ticked at
  "€299 + €3,50/mnd" with no control, and unticking removes both. Climax Huren -> H750 only; Kopen ->
  ADC-750 + A102B; Afstandsbediening Kopen -> **CL004 x1, never H0010**, drawer unticking removes
  CL004 and keeps the doorbell; Afstandsbediening Huren -> H0010.
- **Real Shopify cart (curl):** Protect x3 + CL003 + ADC-750 + CL004 + A102B accepted; /cart and
  Overzicht render "Afstandsbediening (kopen)", "Videodeurbel (kopen)" and the camera subscription by
  name, no Liquid errors, header count unchanged by the hidden add-ons.
- **Not validated in a real browser cart:** the card's "In winkelwagen" click against Shopify's real
  `/cart/add.js`. Shopify's bot protection ("Just a moment…", 429 on `/cart.js`) blocked headless
  Chromium after the second navigation of a run, so the cart-driven flows ran against the emulation
  and the real cart was exercised with the same payloads by curl. A manual click-through on the
  preview theme is worth doing once.

## 5. Open items

1. **Segmented control layout: superseded by §6** (it no longer wraps/right-aligns; it is a full-width
   line under the name).
2. **Heading "Uitbreidingen" under an accordion also called "Uitbreidingen"** (copy from the mockup;
   it replaced "Veel gekozen uitbreidingen"). Reads fine in the cart drawer, redundant on the card.
3. **Legacy NAMI carts** that already hold a Huren Videodeurbel (`Uitbreidingen: Videodeurbel`, H750)
   keep that line: nothing converts it, and the drawer shows the Koop-only checkbox unticked for it.
4. **`koopEenmalig` and `zv_koop_addon_cents_by_handle` are now reference only** (the cards read the
   Koop product's live price); they're still pinned by §15 and could be retired.
5. **Package Koop variants (K001-K005) still come from theme settings**; only the hardware add-ons
   were moved to handles, as asked.

## 6. Compact row (2026-10-27, second pass)

Asked: a toggleable row should read as "the Ontzorgpakket row plus one compact line".

| | Before | After |
|---|---|---|
| Toggleable row (Videodeurbel / Afstandsbediening) | 97px | 66px |
| Plain row (Ontzorgpakket, NAMI Videodeurbel) | 44px | 34px |
| Row padding / name-to-control gap | 10px / 8px | 5px / 4px |
| Control | right-aligned, ~206px, two-line segments | full row width (~270px), two equal columns, one line |

(Measured on the validation theme at a 297px list, desktop and 390px; the plain row shrank with the
same padding change, so a toggleable row is the plain row + 32px = the 29px control + 4px gap.)

- **The full Kopen text does not fit.** "Kopen €299 + €3,50/mnd" is ~145px at 12px/700 and a column
  is ~130px (list 292-297px), so one line overflowed its segment by ~18px. The control therefore shows
  the compact `a_koop_seg`, "Kopen €299+€3,50" (~112px): no spaces, no "/mnd" after a rider. Open
  question for Thijs: the control no longer says that the €3,50 is monthly; the checked row in the
  drawer and the radio's `aria-label` still carry the full "€299 + €3,50/mnd". Say so if the control
  should keep "/mnd" (it would then need unequal columns or a stacked control on cards this narrow).
- **The list is much narrower than ~300px in places**: 175px at 768px (3-column grid), 255px at
  1024px, 262px at 360px, 277px at 375px, 292px at 390px, 297px at 1280px, 316px at 414px. So the
  list is a container: 12px text from 262px, 11px below, and under 244px the two segments stack.
  Every width in that range was measured with `scrollWidth <= clientWidth` and one-line segments.
- **Not mine, found on the way:** at 768px the plain Ontzorgpakket price clips ("+€10") because the
  list is 175px and `.pcard__plus-pr` is `nowrap`; and at 320px the page scrolls 8px sideways from
  the header drawer (`.sf-drawer__logo`/`__close`), not from the list.

## 7. Handle budget audit (Oplossingen, 20 of 20 `all_products` handles)

Every one resolves on the store (`/products/<handle>.js` 200, one variant, available), so none is
a "counted but blank" lookup. The header's `zv-hidden-cart-lines` looks up only members of this set.

| # | Handle | SKU | Why it is on this page |
|---|---|---|---|
| 1-3 | `nami-langer-thuis-inzicht`, `nami-langer-thuis-zeker`, `langer-thuis-beschermd` | A0071, A0072, LT-BES | Langer Thuis cards (`finder_key` is read off the product) |
| 4-6 | `nami-mijn-thuis-alert`, `mijn-thuis-protect`, `mijn-thuis-vista` | A0073, MT-PRO, MT-VIS | Mijn Thuis cards; Vista is lead-only but its card still reads SKU + `finder_key` from the product |
| 7-8 | `veilig-onderweg-paniek-meldkamer`, `veilig-onderweg-zorgmeldkamer` | VO-SOLO, VO-GUARD | Veilig Onderweg cards (price 0 -> "Prijs volgt"); the tab is in the template |
| 9 | `climax-instalatie` | CL003 | Climax installation line |
| 10-11 | `extra-etage-of-100m2`, `extra-etage-of-100m2-climax` | N0008, E001 | One Woning line per platform |
| 12-13 | `huur-video-deurbel-750`, `huur-afstandsbediening` | H750, H0010 | Huren rows (Climax) and their cart variants |
| 14-15 | `koop-video-deurbel-750`, `koop-afstandsbediening` | ADC-750, CL004 | Kopen rows (NAMI Videodeurbel, Climax both) |
| 16 | `camera-abonnement-videodeurbel-1200-clips` | A102B | Rides with ADC-750: its price is in the Kopen text, its variant is kept in the cart |
| 17-20 | `maandelijks-ontzorg-inzicht-oh`, `...-zeker-oh`, `...-alert-oh`, `maandelijks-onderhoud-alarmsysteem` | MOIOH, MOZOH, MOAOH, OHC012 | Ontzorgpakket per package (Beschermd and Protect share OHC012) |

**Freeable without touching a product: nothing.**
- No archived handle is looked up: `ontzorgpakket-inzicht`, `langer-thuis-inzicht`/`-zeker`,
  `mijn-thuis-alert` and `activatie-en-installatie` appear only in config/doc notes, never in a
  lookup. The three NAMI installation handles are in a data attribute only (looked up on /cart and
  Overzicht, not here). Nothing is tied to something no longer rendered.
- A lookup used in two places (the add-on loop and the top of the section, the header snippet, the
  matcher) counts once, so there is no duplicate to remove.

**Freeable only by a structural change (not done; flag, don't speculate):**
- *Two handles to variants of one product:* Huren + Koop of the same hardware (H750/ADC-750,
  H0010/CL004), or the two Woning products (N0008/E001, both 400), would each free one handle as a
  two-variant product. They are separate products today on purpose: Odoo's contract automation keys
  off the product/SKU and the HARD RULE is that products are made in Admin, not from here. Merging
  the Ontzorgpakket products (MOZOH/MOAOH are both 595) was explicitly decided against on 2026-10-27.
- *Vista's lookup:* the only package never bought or priced on the page, but its card reads `p`
  (SKU, `finder_key`) like the others; dropping it means special-casing the card loop, and the
  Vista card would lose the SKU mismatch guard.
- *A variant id fetched in JS instead of Liquid* (`/products/<handle>.js` is not an `all_products`
  lookup): A102B's variant is only needed when a Videodeurbel is bought, but its live price is in
  the Kopen text, which the "never a hardcoded price" rule wants read live. A trade-off, not a free.

Cheapest real option if a 21st handle is needed: ask whether Huren and Koop Afstandsbediening
(lowest-volume pair) can be one product with two variants; otherwise nothing here is spare.
