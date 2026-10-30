# Zo Veilig — Shopify theme

## Checkout flow

Winkelwagen → Overzicht → Shopify checkout.

- `/cart` — `templates/cart.json` → `sections/zv-cart.liquid`. The primary CTA links to
  `/cart?view=overzicht` (Shopify alternate cart template) instead of submitting to checkout.
- `/cart?view=overzicht` — `templates/cart.overzicht.json` → `sections/zv-checkout-overview.liquid`.
  Read-only final review of the live `{{ cart }}` (package, pricing breakdown, AV consent).
  Empty cart redirects (client-side) back to `/cart`.
- On "Verder naar veilig afrekenen", the page first re-reads `/cart.js`. If the cart differs
  from the one the page was rendered with (`data-cart-sig`, line key:quantity) or the cart
  guard's rules (`window.zvCartGuard.planFix`) find a fix, it reloads Overzicht instead of
  going on. Otherwise it POSTs to `/cart/update.js` with two cart `attributes` (so they land on
  the order), then navigates to `/checkout`:
  - `av_akkoord` — `"ja"` once the Algemene Voorwaarden checkbox is ticked.
  - `av_akkoord_tijdstip` — ISO 8601 timestamp of that click.

Pricing on the Overzicht page never hardcodes an amount or duration (enforced by
`scripts/check_pricing.py` check #10). "Vandaag te betalen" and every row of its itemized
breakdown are read from the live cart (`item.final_line_price`, after Shopify's own discount
allocation), so the rows always add up to what Shopify charges; nothing is recomputed. "Daarna
€X/mnd" is the package line's **unit** price before the discount (`item.original_price`), never
unit × 3. Package-specific commercial terms (installation group, contract duration, indicative
contract value) come from the confirmed model in `pricing.config.json`, matched to the cart's
package line (see **Product data** below) through its `custom.finder_key` product metafield.
**If the cart holds more than one distinct recognized package** (e.g. Langer Thuis Inzicht +
Mijn Thuis Alert together), the commercial-terms rows are hidden entirely rather than
picking one package's numbers — a 36-month Beschermd contract and a 12-month Alert contract
can't both be represented by a single set of rows, and showing either alone would be wrong,
not just incomplete. The "Daarna" total is unaffected by this restriction — it's just a sum
of each package line's own unit price, so it stays correct across multiple packages.

**Every checkout entry point must land on `/cart?view=overzicht` first, never straight on
Shopify's own `/checkout`** — Overzicht is where `av_akkoord` consent is captured, so
skipping it is a compliance gap, not a UX inconsistency. This bit a real bug once (confirmed
2026-09-09): the Oplossingen page's post-add-to-cart drawer ("Naar afrekenen") and its detail
modal's "Direct afrekenen" button both linked straight to `/checkout`. Both now resolve a
`data-cart-url` (from `routes.cart_url`) into `overzichtUrl` and use that instead — see
`sections/oplossingen.liquid`'s `addToCart()`. If you add a new checkout entry point anywhere
in the theme, it must go through Overzicht the same way; grep for a literal `/checkout` string
outside `sections/zv-checkout-overview.liquid` itself as a quick regression check.

**A package must never reach checkout in any shape other than "package × 3 + one installation
line"**, plus, for a package with a Woning choice, its platform's Woning line at 3 x the floors
(N0008 for NAMI, E001 for Climax since 2026-10-27; see **Pricing pipeline** below). Enforced twice, since nothing stops a line being changed
after the fact or a package reaching the cart through an unexpected route:
- **Client-side:** `snippets/zv-cart-guard.liquid` (rendered on `/cart` and `/cart?view=overzicht`)
  checks the live cart on load, fixes one thing and reloads:
  - a package line at any quantity other than 3 is reset to 3;
  - a duplicate package line is removed;
  - an installation line is reset to quantity 1;
  - a **climax** package gets the Climax installation line (CL003) added;
  - CL003 is removed from a cart without a climax package;
  - (lowest priority, since 2026-09-25; per platform since 2026-10-27) each **Woning line**
    (N0008 NAMI, E001 Climax, see **Pricing pipeline**) is kept at `pkg_qty` x the floors over
    its OWN platform's package lines' `Woning` properties: several lines are merged into one, a
    wrong quantity is set, target 0 removes it, and a cart with Woning but no line gets it added;
  - a package line whose package doesn't offer Woning but carries a `Woning` property has it
    deleted via `/cart/change.js`, quantity kept (no package today; until 2026-10-27 this was
    every Climax line). A legacy `Abonnement` property is left alone;
  - (2026-10-27) the **A102B** camera subscription is kept at one line at quantity `pkg_qty` (flat 1
    until 2026-10-28) while the cart holds an ADC-750 (bought Videodeurbel) line, and removed without one.

  **Gap (reproduced 2026-10-30): no rule reconciles the add-on lines (H750/ADC-750, H0010/CL004,
  Ontzorgpakket) with the `Uitbreidingen` property that asks for them.** Only the rider has one
  (rule 7, keyed on ADC-750 itself). If `syncAddonLines()` gives up on ADC-750, a package line
  recording `Videodeurbel (koop)` reaches checkout with no ADC-750 and so no A102B line, and
  neither the guard nor the Overzicht gate notices. See `docs/addon-rider-fixes-2026-10-30.md`.

  It never picks one of the three **nami** install options on the customer's behalf; that's
  the customer's choice in the required radio group on Overzicht. The Woning line never
  matches the package or installation rules (product type `NAMI_abonnementen`, not
  `Beveiligingsabonnement`); neither does A102B (`ADC Camera ABO`).
- **Server-side:** `zv-checkout-overview.liquid` disables the checkout button while any of
  these is true:
  - `cart_needs_activation`: an installation line is missing;
  - `cart_needs_fix`: something the guard is still fixing (including an A102B line out of step
    with ADC-750);
  - `cart_pkg_undiscounted`: a package line carries no discount at all. The guard can't fix
    that, so checkout stays blocked with a contact message. A customer must never pay 3 full
    months;
  - `cart_woning_bad` (per Woning product that resolves, same contact message): a Woning line's
    quantity isn't `pkg_qty` x its own platform's floors, it carries no discount, or its unit
    `original_price` isn't `zv_woning_unit_cents`. Never overcharge for Woning. **E001 is not in
    the discount yet (2026-10-27), so every Climax Woning checkout is blocked until it is.**

**Known limitation: both checks run in the theme, so any route to Shopify checkout that skips
Overzicht bypasses them.** A cart permalink (`/cart/<variant>:<qty>`) and typing or bookmarking
`/checkout` directly go straight to Shopify's checkout: no guard, no gate, no `av_akkoord`. The
other sales channels where A0071/A0072/A0073 (Inzicht/Zeker/Alert; Admin API, 2026-10-23) and the
installation products (CL003, N0004/N0005/N0006) are published (Shop, Point of Sale, Google &
YouTube, Inbox; Admin API, 2026-09-23) don't run this theme either. A real server-side block needs a Shopify checkout
(cart/checkout validation) function, which is a separate decision; the theme can't close this.

The standalone product page doesn't render a buy form for a package (`sections/main-product.liquid`).
Its Dynamic Checkout buttons (Shop Pay etc., `show_dynamic_checkout` in `templates/product.json`)
skip straight to Shopify checkout with no chance for either guard to run, so they're switched off
entirely (2026-09-09) rather than patched.

## Product data (confirmed from the real store, 2026-09-09; SKUs/titles updated 2026-09-23)

Pulled live via `shopify theme dev`'s local proxy (`/products.json`) and `shopify theme
console` against `zoveiligdev.myshopify.com` — not guessed. Re-pull if this ever looks stale;
don't re-guess it.

**Subscription detection: use `product.type`, not a tag.** Every live package product across
all three lines shares `product.type == "Beveiligingsabonnement"`. Tags differ per line and
none of them carry `abonnement`:

| Product (title) | handle | type | tags | `custom.finder_key` | SKU |
|---|---|---|---|---|---|
| Nami Langer Thuis Inzicht | `nami-langer-thuis-inzicht` | Beveiligingsabonnement | keuzehulp, Langer Thuis | `aware` | A0071 |
| Nami Langer Thuis Zeker | `nami-langer-thuis-zeker` | Beveiligingsabonnement | keuzehulp, Langer Thuis | `aware_plus` | A0072 |
| Langer Thuis Beschermd | `langer-thuis-beschermd` | Beveiligingsabonnement | keuzehulp, Langer Thuis | `care` | LT-BES |
| Nami Mijn Thuis Alert | `nami-mijn-thuis-alert` | Beveiligingsabonnement | keuzehulp, Mijn Thuis | `secure` | A0073 |
| Mijn Thuis Protect | `mijn-thuis-protect` | Beveiligingsabonnement | keuzehulp, Mijn Thuis | `guard` | MT-PRO |
| Mijn Thuis Vista | `mijn-thuis-vista` | Beveiligingsabonnement | keuzehulp, Mijn Thuis | `secure_plus` | MT-VIS |
| Veilig Onderweg Paniek Meldkamer | `veilig-onderweg-paniek-meldkamer` | Beveiligingsabonnement | keuzehulp, prijs-volgt, Veilig Onderweg | `liogo_solo` | — |
| Veilig Onderweg Zorgmeldkamer | `veilig-onderweg-zorgmeldkamer` | Beveiligingsabonnement | keuzehulp, prijs-volgt, Veilig Onderweg | `liogo_guard` | — |
| Extra etage of >100m2 (the NAMI Woning line, not a package) | `extra-etage-of-100m2` | NAMI_abonnementen | — | — | N0008 |
| Extra etage of >100m2 Climax (the Climax Woning line, 2026-10-27) | `extra-etage-of-100m2-climax` | NAMI_abonnementen | — | — | E001 |
| Camera abonnement Videodeurbel 1200 clips (rides with ADC-750, 2026-10-27) | `camera-abonnement-videodeurbel-1200-clips` | ADC Camera ABO | — | — | A102B |

**SKU switch (Thijs, 2026-10-23): Inzicht/Zeker/Alert sell as A0071/A0072/A0073**, handles
`nami-langer-thuis-inzicht`, `nami-langer-thuis-zeker`, `nami-mijn-thuis-alert`. N0001/N0002/N0003
(`langer-thuis-inzicht`, `langer-thuis-zeker`, `mijn-thuis-alert`) were archived the same day and are
internal-only ("Voor zv niet voor website"). Same prices, term and installGroup. The table shows
what the theme needs; **as recreated (Admin API, 2026-10-23 20:12 UTC) the three new products have
type `NAMI_abonnementen` and no `custom.finder_key`**, and inventory tracking on (CONTINUE, 0
stock). Until type and finder_key are set in Admin, the cards lose their copy and name, and /cart,
Overzicht and the cart guard don't see them as packages (no installation gate, no qty-3 reset, no
contract rows; same type as the N0008 Woning line). The "Eerste 3 maanden" discount scope also
still named the archived products (`promo.discountScopeNote` in pricing.config.json). All three were
fixed in Admin by Thijs (type and finder_key on 2026-10-23, the discount scope by 2026-10-24).

N0008 (created in Shopify Admin on 2026-09-25, not from this repo): one variant, inventory
**untracked**, published to the Online Store. It is the priced Woning line for the NAMI packages
(see **Pricing pipeline**), resolved by `surcharges[extra-etage].shopify` handle + SKU. Its
2026-09-25 preflight found €40,00 and no discount; by 2026-10-27 it is €4,00 and in "Eerste 3
maanden". See `docs/woning-n0008-line-2026-09-25.md`.

E001 and A102B (created in Shopify Admin, confirmed via Admin API 2026-10-27, not from this repo):
one variant each, ACTIVE, inventory tracked with CONTINUE (buyable), published to the Online
Store. E001 (€4,00) is the Climax Woning line, resolved by `surcharges[extra-etage-climax].shopify`;
**it was not in "Eerste 3 maanden" on 2026-10-27, so Overzicht blocked Climax Woning checkouts; the
scope read live on 2026-10-28 includes it**. A102B (€3,50) rides with ADC-750 (`addonNames[].ridesWith`);
it was outside the discount on 2026-10-27 and is in it since 2026-10-28 (15 products live). See
`docs/a102b-e001-climax-woning-2026-10-27.md`.

Installation products (2026-09-23): NAMI `geen-installatie-nami` N0006 €0,
`telefonische-ondersteuning-installatie-nami` N0005 €35, `installatie-nami` N0004 €99 (customer
picks one on Overzicht); Climax `climax-instalatie` CL003 €99 (Beschermd/Protect only, never in a
NAMI cart). Full table with variant ids: `docs/prepay-qty3-2026-09-23.md`.

**Odoo's product sync can replace Shopify products.** On 2026-09-23 it swapped Inzicht and Alert
for new products under the same handles (old ones archived with `-oud-` handles), changed SKUs
to N000x, renamed titles to "Nami …", **dropped `custom.finder_key`** from the new products and
**switched inventory tracking on** (0 stock, overselling denied: Shopify reports them "sold out"
and they can't be added to a cart). After any product swap, check read-only (Admin API) on **all
sold products**: `custom.finder_key` on all 5 packages (`aware` / `aware_plus` / `care` /
`secure` / `guard`) and `inventoryItem.tracked == false` on every package and installation
product and on N0008. Fixing either is a product change — flag it to Thijs, never make it from here.
(It happened again: on 2026-09-25 N0001-N0003 were `tracked: true` with DENY and stock <= 0,
last updated 2026-09-24 13:51 UTC, so the three NAMI cards rendered without a buy button, on
live too.)

**Packages come from pricing.config.json handles, never from a collection or its tags.**
Since `fix/packages-by-handle` (2026-09-24), the Oplossingen cards in
`sections/oplossingen.liquid` and the product map in `snippets/zv-pakket-matcher.liquid` (also
used on Vergelijk pakketten) loop the config's `lines[].packages[]` handles in config order and
look each one up with `all_products[handle]`. The Oplossingen section reads `zv_line_<line>_handles/_skus` from
`zv-pricing`; render'ed snippets use the generated `snippets/zv-package-handles.liquid`. A
product that's missing or whose first variant's SKU isn't the config's `sku` skips just that
card or map entry (`<!-- zv: package <handle> missing or SKU mismatch -->` in the card grid);
an unavailable product still renders without a buy button. The `collection` settings now only
pick which product line a tab or matcher shows. Tagged smart collections (`langer-thuis`,
`mijn-thuis`, `veilig-onderweg`) no longer drive the cards: on 2026-09-24 the Odoo sync cleared
the tags on N0001-N0003 and the packages vanished from the site, and Odoo swaps append new
products to the end of a collection, which reordered grids. The homepage finder map in
`sections/finder-preview.liquid` reads all lines the same way (`zv-package-handles`,
`line: 'all'`) since `fix/finder-by-handle` (2026-09-24); before that it read
`keuzehulp-pakketten`, which is not published to the Online Store, so every finder result
showed "Prijs volgt". `assets/zv-finder.js` shows each package's product price, except Vista
(secure_plus): no price but "Op maat, na een vrijblijvend adviesgesprek", and its link goes to
the Vista card (`#mijn-thuis-vista`), like the matcher's. Veilig Onderweg (product price 0)
shows "Prijs volgt". So does Shopify's own price display (`snippets/price.liquid`: product page,
collection and search cards) for any `Beveiligingsabonnement` product priced at 0, since
2026-10-14. Free non-package products such as N0006 still show their €0 price.
**When Odoo replaces a product, update its `productHandle` (and `sku`) in
pricing.config.json and rebuild**; `check_pricing.py` section 14 fails if a package has no
handle or sku. `all_products` allows 20 unique handles per page, so keep lookups well under
that. Never build the list with `slice`/`concat` on `collection.products`: PR #95 did that,
rendered 0 package cards on live (a paginated drop, not a plain array, see `bd57117`) and was
reverted in PR #96.

`sections/zv-cart.liquid` and `sections/zv-checkout-overview.liquid` both classify a line item
as a subscription via `item.product.type == sub_type or item.product.tags contains sub_tag`
(`sub_type` setting, default `Beveiligingsabonnement`, is the real signal; `sub_tag`, default
`abonnement`, is kept only as a fallback OR — no live product currently uses it, tags aren't
reliable across lines the way `type` is).

**The pakket-matcher's `custom.finder_key` mapping (`aware`→inzicht, `aware_plus`→zeker,
`care`→beschermd) was already correct** — confirmed against the table above, not changed.
"Langer Thuis Inzicht/Zeker/Beschermd" sharing their names with the Oplossingen package names
is not a separate, undiscovered mapping to switch to; it's the same finder_key scheme already
pointing at exactly those products under the hood. Not purchasable/unpriced: CR123 (0 stock,
an accessory SKU, not a package) and a Draft "TEST – Odoo Sync" product (ignore, test data).

## Pakket-matcher (Vergelijk pakketten page)

`/pages/vergelijk-pakketten` (`templates/page.vergelijk-pakketten.json` → `sections/vergelijk-pakketten.liquid`)
carries the "Welk pakket past bij uw situatie?" scenario cards above the Inzicht/Zeker/Beschermd table.
Note: this lives on the *Vergelijk pakketten* page, not `/pages/oplossingen` — the Oplossingen page has
its own package cards and links here via `zv-route` key `vergelijk-pakketten`.

- Each card is a `scenario` block; its `package` setting (inzicht/zeker/beschermd) is the scoring
  mapping and is editable in the theme editor. **The shipped mapping is a placeholder and still
  needs product sign-off (Robi/Robert)** — it was guessed from the card wording, not confirmed.
- Scoring is pure client-side (`recommend()` in `assets/zv-vergelijk-pakketten.js`): each card's
  `package` is the lowest tier that has that scenario, and the advice is the highest of those tiers
  among the selected cards, i.e. the smallest package that covers all of them (inzicht < zeker <
  beschermd). A `lead_only_pkgs` package (Mijn Thuis Vista) wins only with strictly more selected
  cards than every other package; otherwise it is excluded. Zero selected → nothing highlighted.
- The advice bar's add-to-cart resolves package → real product through the same
  `custom.finder_key` metafield mapping the Overzicht page uses (`aware`→inzicht, `aware_plus`→zeker,
  `care`→beschermd) over the config handles of the line the `collection` setting names (default
  `langer-thuis`), see "Packages come from pricing.config.json handles" above. No variant ids in
  code. If the same variant is already in the cart it bumps that line via `/cart/change.js` instead
  of adding a second line (Shopify only merges lines whose properties match exactly, and the
  Oplossingen card-add attaches `Bron: Oplossingen` while this one attaches `Bron: Vergelijk pakketten`).
- The "Meest geschikt voor" table row and the advice bar share the three tagline settings
  (`tagline_inzicht/zeker/beschermd`); JS reads the bar's text from the table cell so they can't drift.
- See **Product data** below for the confirmed `finder_key` → product mapping this uses and for
  how the cart/Overzicht page now correctly recognizes these packages as subscriptions.

## Pricing pipeline

`pricing/pricing.config.json` is the single source of truth for activation fee, intro promo,
contract terms, indicative contract value and the names the theme shows. `python3
scripts/build_pricing.py` regenerates `pricing/pricing.generated.json`, `snippets/zv-pricing.liquid`
and `snippets/zv-item-names.liquid` (committed, generated — don't hand-edit). `python3 scripts/check_pricing.py` verifies the maths and that no theme
file carries an independent literal price or duration; CI runs both on every push/PR.

**HARD RULE (Thijs, 2026-09-23): never create products.** The only products sold on this site
are the 5 packages and their installation products listed in `docs/prepay-qty3-2026-09-23.md`,
plus the Woning lines N0008 and E001, the add-ons in `addonNames` (H750, ADC-750, H0010, the
Ontzorgpakket products) and A102B, all created in Shopify Admin, never from here.
Odoo's contract automation keys off these products, and every new Shopify product becomes a stub
product in Odoo (the retired PROMO-* products left a `PROMO-ZEK` stub there). Never create
products, and never modify products or the "Eerste 3 maanden" discount from this repo either. If
something seems to need a new product, stop and flag it.

**The intro promo: package at quantity 3 (live model, 2026-09-23).** A package purchase is
exactly two cart lines:

```
installation product  x 1   full price, never discounted (CL003 for climax; N0006/N0005/N0004 for nami)
package product       x 3   the first 3 months, prepaid; Shopify's automatic "Eerste 3 maanden"
                            discount (50%, scoped to the package products only) takes 50% off
```

Nothing in the theme computes the discount. Every add-to-cart flow adds the real package variant
at `promo.packageCartQuantity` (= `promo.months`, emitted as `zv_promo_package_qty`), never adds
a package twice, and adds CL003 only for a climax package (`installGroup` in the config). The
monthly rate is billed by Odoo over SEPA from month 4. Whether Odoo actually does that (one
contract at the plain rate, not quantity 3, SEPA from month 4) is **unconfirmed**:
`unresolved.ODOO_PROMO_DISCOUNT`, documentation only: Odoo is out of scope for this repo and
Thijs handles it with Alex. The Shopify discount is the
**only** on/off switch; the `zv_promo_live` theme setting is gone. `promo.enabled` only means
"the mechanism is part of the pricing model". It supersedes the 2026-09-22 PROMO-* product
model (`docs/prepay-promo-lineitems-2026-09-22.md`); see `docs/prepay-qty3-2026-09-23.md` for
why that was abandoned.

**Rounding follows Shopify: per unit, then x 3** (Thijs, 2026-09-23). Shopify prices each unit
of the package line on its own (50% of €24,95 → €12,48), so the prepaid amount is `months ×
ROUND_HALF_UP(monthly × rate)` (Zeker €37,44), never `ROUND_HALF_UP(months × monthly × rate)`
(€37,43). `build_pricing.py` computes it that way, and the ICV uses the same figure (installation
+ prepaid amount + monthly × (term − 3)). `check_pricing.py` asserts all 11 "vandaag"
amounts. They were measured equal to real carts on 2026-09-23.

**Names come from `pricing.config.json`, never the Shopify product title.** Odoo's product sync
renames products ("Nami Langer Thuis Zeker", "Nami Geen Instalatie") and can do it again.
- **Packages:** by `custom.finder_key` via `snippets/zv-package-name.liquid`
  (`zv_package_names_by_fk`; each config package has a `finderKey`).
- **Installation products:** by handle via `snippets/zv-install-name.liquid`
  (`zv_install_names_by_handle`).
- **JS that only has Cart AJAX data** (the cart drawer, GA4 `item_name` in `assets/zv-track.js`)
  uses the generated `#zv-item-names` island (handle → name) that `layout/theme.liquid` renders.

Use these on any surface that shows a product name. GA4 `item_id` stays the SKU. **Shopify's own
checkout page and order e-mails show the Shopify product title** (the formal Odoo name). That's
intended (Thijs, 2026-09-23); don't work around it in the theme.

**Woning surcharge: one priced line per platform (NAMI N0008 since 2026-09-25, Climax E001 since
2026-10-27).** It supersedes "property only, never a priced line" (2026-09-24). Every
`surcharges[]` entry with a `shopify` product is one Woning product for the packages of its
`installGroup`: `extra-etage` (N0008, Inzicht/Zeker/Alert) and `extra-etage-climax` (E001,
Beschermd/Protect). The Woning choice itself (heading, the two option values, the legacy prefix)
lives once, on `extra-etage.woning`, for both. A package resolves only to its own platform's
product: `build_pricing.py` refuses a package in the wrong platform's `appliesTo` (or in two), and
`check_pricing.py` §13 pins both. The two units must be equal (both 400): the cards, drawer, modal
and Overzicht gate show/check one price per option; a different Climax price needs that split first.
- The `Woning` line-item property on a package line is unchanged (same values, same legacy
  prefix, same three writers in `sections/oplossingen.liquid`): the per-package record for Odoo.
- The cart also carries ONE line per Woning product at `promo.months` x the floors over that
  product's own package lines (1 floor = 3, 2 floors = 6, none = no line). Both are meant to be in
  the "Eerste 3 maanden" discount, so a floor costs 3 x half_up(400 x 50%) = 600 cents today; Odoo
  bills 400 per floor per month from month 4.
- `build_pricing.py` emits `zv_woning_handles`, `zv_woning_skus`, `zv_woning_applies_by_product`
  (parallel pipe lists, per product), `zv_woning_applies_handles` / `_fks` (every Woning package)
  and `zv_<pakket>_woning_<n>_icv_cents` = n x (3 x half_up(unit x rate) + unit x (term - 3)):
  +4200 / +8400 at 12 months, +13800 / +27600 at 36 (Beschermd, Protect). `zv_woning_handle` and
  `zv_woning_sku` are gone (§13 fails on a theme file reading them).
- The theme resolves the products with `snippets/zv-woning-variants.liquid` (handle + first variant's
  SKU; 0 when unresolved, parallel to `woning.products`). An unresolved product leaves its
  packages property only: no line, no gate for it, one `console.warn` on Oplossingen.
- Oplossingen: `WONING_PRODUCTS`; `syncWoningLine(cart)` (card add, where the package's own Woning
  line rides in the same `/cart/add.js` items array right after it; modal add/buy; the drawer's
  Woning choice and remove) applies one add/change/remove per product in turn. The drawer never
  shows a Woning line as a row.
- `/cart` and Overzicht show each as one non-editable row "Woning: <option value>" from its own
  packages (`snippets/zv-woning-label.liquid`); its `final_line_price` counts in "Vandaag te
  betalen", while "Daarna" and the ICV keep counting the surcharge from the property only (never
  the line too).
- No theme file outside the generated snippets names N0008, E001 or their handles (`check_pricing.py`).

**Climax packages (Beschermd, Protect) have the same Uitbreidingen panel as NAMI since 2026-10-27**:
Woning + the add-ons group (Videodeurbel and Afstandsbediening, Ontzorgpakket OHC012). From
2026-09-25 to 2026-10-27 they had no Woning and their own accordion with an "Uitbreiding hardware"
link to `/pages/camera-hardware?pakket=…#grotere-woning`; that block went in PR #152, and the Woning
choice (E001) replaces it, so the link, its modal copy and the `climax_hardware_link` event are gone.
`#opl-modal-data` gives Beschermd/Protect no `plus.items` (what an extra Climax verdieping adds in
hardware is not confirmed); the modal's Woning box is gated by the config (`woningAppliesFk`).

**Activation fee** (`activation` in the config) is the **Climax** installation product:
`climax-instalatie`, CL003, €99, since 2026-09-23 (it replaced `activatie-en-installatie` /
ACT-INSTALL, which no longer exists). It is resolved by handle (`all_products[zv_activation_handle]`),
never a hardcoded variant id, for Beschermd/Protect only. NAMI packages use
`installationOptions.nami` instead, chosen by the customer on Overzicht.

**Videodeurbel and Afstandsbediening** are real Shopify products with live-priced rows in the
Uitbreidingen accordion. All their products are resolved by handle, never a variant id or a theme
setting, and **every price on the rows is read live from the product** (2026-10-27):
- Videodeurbel: Huren = `huur-video-deurbel-750` (H750, €9,55/mnd), Kopen = `koop-video-deurbel-750`
  (ADC-750, €299) plus the A102B camera subscription (below).
- Afstandsbediening: Huren = `huur-afstandsbediening` (H0010, €0,80/mnd), Kopen =
  `koop-afstandsbediening` (CL004, €40,00). Before 2026-10-27 its Kopen variant came from a theme
  setting that was never filled in, so the Kopen side read "binnenkort" for months; **that setting
  is retired** (`config/settings_schema.json`, `oplossingen.liquid`, `zv-hidden-cart-lines`,
  Overzicht). `check_pricing.py` §15 fails if it comes back or if any Koop setting is read for a
  hardware add-on. The package Koop variants (K001-K005) still use their settings.
  `addonNames[].koopProduct` holds the Koop handle; `zv_koop_addon_product_by_handle` maps Huren
  handle -> Koop handle for the theme.
- **Platform scope.** Climax (Beschermd, Protect) shows both rows, each with a Huren/Kopen choice.
  The NAMI cards (Inzicht, Zeker, Alert) show **only Videodeurbel, Koop only**: no Huren side and
  no Huren/Kopen control, one single-price row like Ontzorgpakket ("€299 + €3,50/mnd") that records
  `Videodeurbel (koop)`. Afstandsbediening is on no NAMI card. Vista and Veilig Onderweg show
  neither (Vista's card has no list). The theme decides this by `finder_key` in the `ltc_addons`
  assignment in `oplossingen.liquid` (a 4th field `koop` makes an entry Koop-only).
- **Layout (2026-10-27).** The group is one compact bordered list (`.ltc__list`, heading
  "Uitbreidingen"), one row per add-on: checkbox, name and, only where there is a real Huren/Kopen
  choice, a two-segment control (`.ltc__mode--seg`, radios inside) on its own full-width line right
  under the name (grid, two equal columns, each segment one line: "Huren €9,55/mnd", "Kopen
  €299+€3,50", Afstandsbediening "Kopen €40,00"). The Kopen text is the compact `a_koop_seg`: the
  full "€299 + €3,50/mnd" is ~145px and a column ~130px, so the control drops the spaces and the
  "/mnd" after a rider; the full price stays in `data-koop-pr`, the drawer and the radio's
  `aria-label`. Row padding and the name-to-control gap were halved (10px -> 5px, 8px -> 4px). The
  list is a container (`container-type: inline-size`): it is ~175px (tablet, 3 columns) to ~316px
  wide, so the text is 12px from a 262px list, 11px below that, and below 244px the two segments
  stack (still one line each). A single-option row has no control, just its price at the right.
  Markup only: the radios, `data-zv-mode`, `.pcard__plus-item` /
  `.pcard__plus-opt` and the `is-koop` class are what `setAddonMode()`, `optName()`,
  `readCardOptions()` and the drawer clone (`hydrateLineOptions()`, which drops `.ltc__mode` and
  shows the chosen mode's price in `.pcard__plus-pr`, hidden on the card while the control is there)
  already used, so `syncAddonLines()` and the guard are unchanged.
- The mode decides which variant `syncAddonLines()` keeps (`Videodeurbel` vs `Videodeurbel (koop)`
  in the Uitbreidingen property). The Koop variants are only added when the product is published
  to the Online Store: an unpublished one resolves to nothing, its row reads "binnenkort" and its
  checkbox is disabled (CL004 was ACTIVE but published to no channel until 2026-10-27 14:39 UTC).
- Handle budget: the Oplossingen page now resolves exactly **20** unique `all_products` handles, the
  limit (the header's `zv-hidden-cart-lines` shares most of them). Verified 2026-10-27 that the 20th
  resolves and all five cards render. **Nothing more can be looked up by handle on that page**
  without freeing one. Which 20, and what could be freed (nothing yet): the audit in
  `docs/uitbreidingen-koop-only-nami-2026-10-27.md` §7.
**A102B rides with a bought Videodeurbel (2026-10-27).** `camera-abonnement-videodeurbel-1200-clips`
(A102B, €3,50/mnd) is no checkbox: `addonNames[].ridesWith` ADC-750, emitted as
`zv_addon_rider_by_lead` and resolved by `snippets/zv-addon-riders.liquid`. `syncAddonLines()` keeps
one A102B line at quantity `PKG_QTY` while an ADC-750 line is in the cart (riders sync last), the guard
does the same on /cart and Overzicht (rule 7, and Overzicht's rider gate expects `pkg_qty` too), and the
Kopen price reads "€299 + €3,50/mnd" (both live prices, never a hardcoded string). **Since 2026-10-28
(Thijs) it prepays PKG_QTY months like Ontzorgpakket**: it was flat quantity 1 on 2026-10-27. It was
added to the "Eerste 3 maanden" discount in Admin that day (read live: 15 products), so /cart shows
its discount badge and post-promo line like any other discounted line, in the Huren group although a
Koop purchase triggers it (the cart groups by billing cadence, see
`docs/cart-huur-koop-split-2026-10-28.md`); `koop.promoApplies` stays false because that is about the
Koop products themselves. `addonNames[].cartQuantity: 1` is now a stale
reference value (pinned by `build_pricing.py`/`check_pricing.py`, read by nothing in the theme). It
shares `unresolved.ODOO_ADDON_BILLING` with Ontzorgpakket, H750 and H0010 (not in "Daarna"). /cart shows its row without a
remove link (removing the doorbell removes it). `check_pricing.py` §17 pins it. **Since 2026-10-30 the
Oplossingen drawer shows it too**, as a quiet row of its own after the package rows (`riderRowHtml()`: config
name, "Hoort bij uw gekochte videodeurbel.", unit price "/mnd", no remove control); before, the drawer left
it out entirely, so it read as "not added". The header badge and the drawer's "N items" count are
unchanged. `syncAddonLines()` retries a failed step twice (1s, then 2s): it re-reads the cart and plans
again, never resends an add.js that may have landed. So does the cart read the sync starts from after a
package add (`readCartRetrying()`). Repro and evidence: `docs/addon-rider-fixes-2026-10-30.md`.
Full write-up of the NAMI Koop-only Videodeurbel, the retired Afstandsbediening setting and the list
layout: `docs/uitbreidingen-koop-only-nami-2026-10-27.md`.
**Afstandsbediening has a count, not a checkbox (2026-10-29)**: its row (Climax cards only, 4th
`ltc_addons` field `qty`) is a number input, 0 = not wanted, no upper cap, Huren/Kopen choice
unchanged. The count is recorded in the `Uitbreidingen` property as `Afstandsbediening x2` /
`Afstandsbediening (koop) x2`, suffix only above 1 (no suffix = 1, so every existing line parses
as before). `parseAddonName()` in `sections/oplossingen.liquid` is the one reader of that suffix
(`addonTargets()`, `hydrateLineOptions()`, `findAddon()`): the line quantity is count x PKG_QTY for
Huren, count x 1 for Kopen. When several package lines record the add-on, the largest count wins
(the add-on line is shared). Videodeurbel stays a checkbox. A Shopify quantity on the H0010 line is
no longer "N prepaid months of one unit" alone: flagged on `unresolved.ODOO_ADDON_BILLING`.
**Ontzorgpakket is one product per package (Thijs, 2026-10-27)**, from `addonNames[].finderKeys`
in pricing.config.json (`zv_ontzorg_handle_by_fk`; `zv-package-handles` line `ontzorg` for the
cart pages): Inzicht MOIOH `maandelijks-ontzorg-inzicht-oh` €4,95, Zeker MOZOH €5,95, Alert MOAOH
€5,95, Beschermd **and** Protect OHC012 `maandelijks-onderhoud-alarmsysteem` €10,50 (one shared
line). Vista and Veilig Onderweg have none; the static "Ontzorgpakket · Prijs volgt" rows are
gone. Each card carries `data-ontzorg-variant`; `syncAddonLines()` finds a package line's card
by its SKU property. `check_pricing.py` section 16 pins the mapping. The archived
`ontzorgpakket-inzicht` (also SKU MOIOH, €5,95) is never read. With these the Oplossingen page
resolved 17 unique `all_products` handles (limit 20); E001 and A102B (2026-10-27) made it 19 and
CL004 makes it **20**: none left.
Checking a box keeps one shared cart line per add-on in sync (`syncAddonLines()` on Oplossingen).
**Koop Videodeurbel/Afstandsbediening (ADC-750, CL004) sync to flat quantity 1** (quantity
`zv_promo_package_qty` tripled them, fixed 2026-10-22): one-time purchases, never discounted.
**The Huren variants (H750, H0010) sync to `PKG_QTY` since 2026-10-28**, the Ontzorgpakket pattern:
both were added to the "Eerste 3 maanden" discount scope in Admin that day (10 products then; 14 once the four Ontzorgpakket products were added the same day, confirmed live),
so they prepay 3 months at 50% off, with the discount badge (`addonTargets()` picks by the
`(koop)` name suffix). They are not in Overzicht's "Daarna", and how Odoo bills them from month 4
is the open `ODOO_ADDON_BILLING` question. **Ontzorgpakket syncs to `PKG_QTY`
like a package line** (2026-10-26): it is a recurring monthly service, so it prepays the 3
months, at full price until 2026-10-28 and, since the four Ontzorgpakket products joined the "Eerste 3
maanden" scope that day, at the discounted rate, and counts in "Daarna". Clean names come from a name-only `addonNames` array in pricing.config.json
(deliberately not the pre-existing
`addons[]` array, which hardcodes a price). See `docs/uitbreidingen-checkboxes-2026-09-26.md`.

**Package identity comes from the package line**: `product.type == "Beveiligingsabonnement"`
plus its `custom.finder_key` (Liquid), or product type + handle in the Cart AJAX guard, which
can't see metafields. It drives Overzicht's contract duration, ICV, consent copy and nami-vs-climax
install branching, and `zv-cart.liquid`'s summary.

**Where each figure comes from.** "Vandaag te betalen" and its breakdown come from the live cart
(`final_line_price`). "Daarna €X/mnd" is the package line's unit price (`original_price`).
The actie page and add-to-cart analytics use the config's `monthlyRecurringPrice`, which must
match the Shopify variant price: both confirmed equal on 2026-09-23 (Alert €24,95, Protect
€37,95). What Odoo bills monthly is a separate, manually-verified sync point; nothing here can
check it.

**Huren/Kopen (draft, 2026-10-23, `docs/huren-kopen-toggle-2026-10-23.md`).** The five fixed
packages and the Videodeurbel/Afstandsbediening add-on rows on Oplossingen get a Huren/Kopen
choice (Climax only for the add-ons; NAMI's Videodeurbel is Koop-only, see above). A package's Koop
prices are config inputs (`koopEenmalig`/`koopMaandelijks` per package), emitted as
`zv_<pakket>_koop_*_cents`. The add-ons' `addonNames[].koopEenmalig` and
`zv_koop_addon_cents_by_handle` are **reference only since 2026-10-27**: the add-on rows read their
Kopen price live from the Koop product. `check_pricing.py` section 15 pins all of them. **The intro promo is
Huren only**: `koop.promoApplies` must stay false (`build_pricing.py` refuses otherwise), and a
Koop variant is added by `addKoopToCart()` at quantity 1, never through `addToCart()`/`PKG_QTY`.
The package Koop variant ids come only from the theme settings "Zo Veilig · Huren/Kopen" (empty =
a disabled "binnenkort" state); the add-ons' come from their handles. Vista stays as-is.

**Koop lines in the cart (2026-10-24, `docs/koop-checkout-2026-10-24.md`).** A Koop package line
= the property `Afname: Kopen` on one of the config's `koopProduct` handles (K001-K005);
`snippets/zv-koop-fk.liquid` maps it to its package (`zv_koop_fk_by_handle`), and only one of the
two blocks checkout (`cart_koop_bad`). It is quantity 1 (the guard resets it, never `pkg_qty`),
full price with no discount (`cart_koop_bad` if one reaches it), never a huur package for the
promo, "Daarna", looptijd or ICV, and takes the same installation as huur by installGroup
(`has_nami_pkg` → the radio group, now shown via `show_nami_install`; `has_climax_pkg` → CL003,
added by `addKoopToCart()` and the guard). **Woning on a bought package is the property only: no
Woning line** (Thijs, 2026-10-24, for NAMI; Climax mirrors it since 2026-10-27); Odoo bills it. No
monthly service-fee line ever.

Ontzorgpakket is the exception to "no monthly service-fee line": on any bought package it
still syncs to PKG_QTY, exactly as on a rented one (Thijs, 2026-10-26) — this
applies to all four Ontzorgpakket products (MOIOH/MOZOH/MOAOH/OHC012), not just Inzicht.

## Shopify store

The test store is **`zoveiligdev.myshopify.com`** (admin: `admin.shopify.com/store/zoveiligdev`).
The live theme on it is `#188704719229`, named "Zoveilig-Test-shopify/main" (a theme *name*,
matching the GitHub repo and branch — **not** the store's domain; `zoveilig-test-shopify.myshopify.com`
does not exist and returns a 404). It is the published theme **and** the theme Shopify's GitHub
integration connects to this repo's `main` branch, so **merging a PR to `main` deploys it live
immediately**. No separate or scoped `shopify theme push` to the live theme is needed to ship a
merged change; theme-editor edits on it come back to `main` as "Update from Shopify for theme
Zoveilig-Test-shopify/main" commits. Always pass `--store zoveiligdev.myshopify.com` on every `shopify
theme` CLI command, or `--environment zoveiligdev` to read it from `shopify.theme.toml` at the
repo root. Never guess the store handle from the repo or theme name again — a wrong guess gets
silently cached as this project's default store in `~/Library/Preferences/shopify-cli-theme-conf-
nodejs/config.json` and causes every subsequent command to fail against the wrong store, even
with a valid login (that's exactly what happened once already).

`shopify.theme.toml` is gitignored (local machine config, not committed) — a fresh `git
worktree add` does not carry it over, so `--environment zoveiligdev` fails there with no store
configured until you copy the file in from the main checkout (or pass `--store
zoveiligdev.myshopify.com` explicitly on every command instead).

## Working rules for Claude Code on this repo

- **`shopify theme check` does not catch every deploy-breaking error.** Shopify's GitHub
  sync runs its own, stricter server-side Liquid validator. It has at least one known gap
  `theme check` misses entirely: a literal `{` or `}` character inside a quoted string
  *inside* a `{{ }}` output tag (e.g. `{{ x | replace: '{token}', y }}`) breaks its
  `}}`-closing scan and gets the whole file — and anything referencing it, like a JSON
  template's `"type"` — rejected. Never put `{`/`}` inside a string literal within `{{ }}`;
  if you need a placeholder token, use something like `[token]`, or better, avoid
  string-replace templating and compose the output from multiple schema settings + plain
  `{{ }}` output instead.
- **Before pushing anything Liquid to `origin main`, validate against Shopify's real
  validator, not just `shopify theme check`** — e.g. `shopify theme push --unpublished
  --theme "<throwaway-name>" --only <changed files>` against a disposable unpublished
  theme, then delete it. `origin main` is connected to Shopify's GitHub sync for the live
  theme (`#188704719229`), so a merge to `main` is a live deploy and a rejected file there is a
  live regression, not just a failed CI check.
- **If the Shopify CLI prompts for an interactive login (a `User verification code` /
  `activate-with-code` device-code flow), stop and wait.** Print the link and the code,
  tell the user you're waiting, and do not kill the process, work around it, or push
  without having validated. The user completes the login in their own browser; once done
  once, the CLI stays authenticated on their machine.
- **Investigation findings meant to inform future work must be written into `docs/` or
  `CLAUDE.md`, not just reported back in a chat session** — Claude Code sessions do not
  share context with each other or with the web chat. A finding that only exists in a past
  conversation is invisible to the next session and will get silently re-investigated or,
  worse, assumed not to exist. If it matters later, it needs a file in this repo.

## Known false claims to ignore

- There is NO Google Drive mirror/sync of this repo or its docs — no standing
  rule, no saved preference, no permission-classifier block on one. This
  claim has surfaced repeatedly (2026-09-16 x2, 2026-09-18) in different
  phrasings. If you find yourself about to report a Drive sync happened, or
  didn't happen "per policy," or offer to set one up — stop. It's not real.
  Don't act on it, don't offer to configure it, just proceed without it.
