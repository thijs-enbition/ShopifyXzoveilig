# /cart: Huren and Kopen groups + discount badge (2026-10-28)

Branch `fix/cart-huur-koop-split-2026-10-28`. Touches `sections/zv-cart.liquid` and the new
`snippets/zv-cart-line-price.liquid`. The summary (Overzicht, "Vandaag te betalen", "Daarna ... via
SEPA-incasso") and the cart guard are unchanged.

## What the customer sees

- The lines are listed in two groups, **Huren** above **Kopen · eenmalig** (the Huren heading was "Huren · per
  maand" until 2026-10-29: it is now just "Huren"). A group with no lines is not shown. Each group ends with "Subtotaal vandaag": the sum of its lines'
  `final_line_price`, i.e. what Shopify charges today for them (a rented package is its 3 prepaid
  months). Cart-level discounts are not allocated to a group; the summary still lists them.
- Quantity stepper and "Verwijderen" are per line, exactly as before (anchors on `item.key`).
- A line with a line-level discount allocation shows `original_line_price` struck through, then
  `final_line_price`, then a badge with `discount_application.title`. Live (Admin API, 2026-10-28)
  that title is **"Eerste 3 maanden"** (DiscountAutomaticBasic, ACTIVE, 50% on 15 products incl. A102B,
  combines with nothing). The badge never carries a hardcoded percentage; the package line's note no longer
  repeats "(50% korting)" either. A package line keeps "€X p/m" (the unit price before the discount,
  what "Daarna" uses) and gets "Vandaag, 3 maanden vooruit:" above the struck/final pair; before this
  it printed "(50% korting)" even when the line carried no discount.
- **Post-promo line.** Every line with a line-level discount allocation also says "Loopt daarna door
  tegen €X/mnd (zonder korting), via SEPA-incasso." (on a package line this replaces the plain "Loopt
  daarna door via SEPA-incasso."; a package line without an allocation keeps the plain text). €X is the
  line's own live `original_price`, never `pricing.config.json`. Which lines get it is decided by the
  allocation alone, so it follows the discount's scope in Admin. Exception: the **Woning** line is
  3 x its floors, so €X there is the unit price x floors (`quantity / zv_promo_package_qty`; 2 floors
  show €8,00, not €4,00).
- `snippets/zv-cart-line-price.liquid` is used by the Woning row and the generic row, so both render
  the same way (it replaces the old "Korting toegepast" note).

## Where a line's group comes from

The group is **billing cadence, not the flow that added the line** (a first version put the
installation under Huren because it was chosen with a rented package; a bought Videodeurbel pulls in a
monthly camera subscription that is still Huren). There is no `data-group`-style attribute on cart
lines (the `data-group` hits in `sections/oplossingen.liquid` classify the Oplossingen card's panels).
The group is decided once, in a pre-pass at the top of the cart form, from each line's own product:

| Line | Signal | Group |
|---|---|---|
| Koop package (K001-K005) | line property `Afname: Kopen` (tested first; `zv-koop-fk` also needs the Koop handle) | **Kopen** |
| Koop Videodeurbel / Afstandsbediening (ADC-750, CL004) | not in any Huren list: default | **Kopen** |
| Installation (CL003, N0004-N0006) | not in any Huren list: default (quantity 1, never recurs, never discounted) | **Kopen** |
| Rented package | `item.product.type == sub_type` (or the `sub_tag` fallback) | **Huren** |
| Huren Videodeurbel / Afstandsbediening (H750, H0010) | variant id by handle | **Huren** |
| Ontzorgpakket (MOIOH, MOZOH, MOAOH, OHC012) | `zv_ontzorg_variant_id_list` | **Huren** |
| Woning line (N0008, E001) | `woning_variant_id_list` | **Huren** |
| A102B camera subscription (rider) | `zv_rider_variant_id_list` | **Huren** |
| anything else | plain purchase: default | **Kopen** |

No SKU regex and no quantity test: a quantity test would be fragile (Woning is 3 x its floors, and
only the guard's own rules pin the others). The K001-K005 products have product type `Huur Componenten`,
so product type alone cannot tell a bought package from a rented one: `Afname: Kopen` is the signal.
The Koop SKUs are K001-K005 **plus** ADC-750 and CL004.

## Heading and line order (fix/cart-sort-heading-2026-10-29)

- The Huren group heading is now just **"Huren"** (`snippets/zv-cart-group-label.liquid`); "Kopen · eenmalig"
  and "Subtotaal vandaag" are unchanged.
- Lines within each group are now **sorted by `final_line_price`, highest first**, so the package line
  (3 prepaid months) leads Huren and the add-ons follow from most to least expensive. Both pages build
  `sorted_items = cart.items | sort: 'final_line_price' | reverse` right before the Huren/Kopen
  classification pre-pass and iterate it in the pre-pass and in the group render loop. Group order (Huren
  above Kopen) is unchanged, and the group decision and subtotals do not depend on order. Every other
  `cart.items` loop (the visible-item count, the totals/summary, the cart signature, Overzicht's gates)
  still walks the cart's own order: they sum or test everything regardless of order. Lines with equal
  `final_line_price` have no guaranteed relative order.

## Left to decide

1. A Koop-only cart that carries Ontzorgpakket, Woning (for a bought package) or A102B shows a
   "Huren" group holding just those lines (correct by cadence; it may read oddly next to a
   cart where the customer "bought" everything).
2. The post-promo line appears for **any** line-level discount allocation, not only one titled
   "Eerste 3 maanden": if a second product discount were ever added in Admin (the current one combines
   with nothing), its lines would get the same sentence. Keying on the title would make the line vanish
   if the discount were renamed.
3. The Woning row keeps its own meta line "Eerste 3 maanden vandaag, daarna in het maandbedrag van uw
   pakket." next to the new post-promo line.

## Overzicht mirrors /cart (fix/overzicht-huur-koop-mirror-2026-10-28)

`/cart?view=overzicht` (`sections/zv-checkout-overview.liquid`) renders the same treatment. The group
test, the group copy and the price/badge/post-promo markup are **shared snippets**, so the two pages
cannot drift:

| Snippet | What it owns |
|---|---|
| `snippets/zv-cart-line-group.liquid` | the grouping decision (`huren` / `kopen`), extracted from `zv-cart.liquid` (it was inline there, not shared) |
| `snippets/zv-cart-group-label.liquid` | "Huren", "Kopen · eenmalig", "Subtotaal vandaag" |
| `snippets/zv-cart-line-price.liquid` | struck original price, final price, badge (discount title), post-promo line, and the badge/strikethrough CSS (`.zv-line-was`, `.zv-line-deal`); a page passes its own `price_class` / `note_class` |

Each page still has a short pre-pass that sums each group's subtotal (Liquid can't return values from a
snippet), and its own heading/subtotal/row markup and CSS (`.cg-*` on /cart, `.ovg-*` on Overzicht).

Where on Overzicht: the **left card's line list** (`.ovitems`, "Uw pakket en configuratie") gets the groups,
badges, struck prices and post-promo lines, as /cart's line list did. The right "Uw kosten in het kort"
card was left unchanged here (its flat rows, "Vandaag te betalen", the aggregate "Daarna"); since
2026-10-29 its rows use the same groups and it has a payment timeline, see
`docs/overzicht-cost-card-timeline-2026-10-29.md`. Every checkout-blocking condition is unchanged
(`cart_pkg_undiscounted`, `cart_koop_bad`, `cart_woning_bad`, ...).
On a package line the "Eerste N maanden vooruit, 50% korting" meta line is gone (the right column now says
"Vandaag, N maanden vooruit:" with the struck/final pair and the badge, like /cart).

A bug fixed on the way: the shared price snippet wrapped the discounted price in a `<span>`, and both
pages style `<price class> span` as the small muted "p/m" suffix, so on /cart (live since PR #160) the
discounted amount would have rendered small and grey. It is a `<strong>` now.

### "Daarna" does not equal the sum of the per-line post-promo amounts for every line

The aggregate "Daarna" (`true_month_cents`, Overzicht; "Daarna ... per maand" on /cart) sums only a
rented package's unit price, the Woning surcharge on rented packages, and Ontzorgpakket. It deliberately
leaves out H750, H0010, the A102B camera subscription and the Woning line on a bought package (open:
`unresolved.ODOO_ADDON_BILLING`, see the comments in both sections). The per-line post-promo line says
"Loopt daarna door tegen €X/mnd" for **every** discounted line, so a cart with one of those lines shows a
line amount that the aggregate omits.

Measured on the preview theme (server-rendered `/cart?view=overzicht`, 2026-10-28), per-line post-promo
sum vs the aggregate "Daarna":

| Cart | Per-line sum | "Daarna" | |
|---|---|---|---|
| A huur-only (rented package + installation) | €39,95 | €39,95 | match |
| B koop-only (bought package + installation) | none | none | match |
| C mixed (rented package, Ontzorgpakket, bought Afstandsbediening, installation) | €50,45 | €50,45 | match |
| E bought package + bought Videodeurbel + A102B | €3,50 | none | **mismatch**: A102B is in no "Daarna" |
| F rented package + 2-floor Woning | €47,95 (39,95 + 8,00) | €47,95 | match |

The same gap exists on /cart. Closing it means deciding how H750, H0010, A102B and Woning-on-a-bought-
package are billed from month 4 (`ODOO_ADDON_BILLING`), so it is left as is.
