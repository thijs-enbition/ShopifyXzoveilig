# /cart: Huren and Kopen groups + discount badge (2026-10-28)

Branch `fix/cart-huur-koop-split-2026-10-28`. Touches `sections/zv-cart.liquid` and the new
`snippets/zv-cart-line-price.liquid`. The summary (Overzicht, "Vandaag te betalen", "Daarna ... via
SEPA-incasso") and the cart guard are unchanged.

## What the customer sees

- The lines are listed in two groups, **Huren · per maand** above **Kopen · eenmalig**. A group with no
  lines is not shown. Each group ends with "Subtotaal vandaag": the sum of its lines'
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

## Left to decide

1. A Koop-only cart that carries Ontzorgpakket, Woning (for a bought package) or A102B shows a
   "Huren · per maand" group holding just those lines (correct by cadence; it may read oddly next to a
   cart where the customer "bought" everything).
2. The post-promo line appears for **any** line-level discount allocation, not only one titled
   "Eerste 3 maanden": if a second product discount were ever added in Admin (the current one combines
   with nothing), its lines would get the same sentence. Keying on the title would make the line vanish
   if the discount were renamed.
3. The Woning row keeps its own meta line "Eerste 3 maanden vandaag, daarna in het maandbedrag van uw
   pakket." next to the new post-promo line.
