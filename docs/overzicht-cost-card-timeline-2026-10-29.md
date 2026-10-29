# Overzicht: cost card split into Huren/Kopen + "Wanneer betaalt u wat?" (2026-10-29)

Branch `fix/cart-sort-heading-2026-10-29`, on top of `c67be99` (lines sorted by price, heading "Huren").
Touches only the right-hand card of `/cart?view=overzicht` ("Uw kosten in het kort",
`sections/zv-checkout-overview.liquid`) and its CSS. The left item list, every checkout gate, the cart
guard and `/cart` are unchanged.

## Breakdown ("Opbouw van dit bedrag")

- The rows are split into the same two groups as the item list on the left: **Huren** above
  **Kopen · eenmalig** (copy from `snippets/zv-cart-group-label.liquid`). A group with no lines is not
  shown. Within a group the rows follow `sorted_items` (`final_line_price`, highest first), so the two
  cards list the lines in the same order.
- Nothing is recomputed: the card reuses the left list's pre-pass, i.e. `cg_huren_keys` / `cg_kopen_keys`
  (group membership, the same `'|' + item.key + '|'` test), `cg_huren_cents` / `cg_kopen_cents`
  (subtotals), `cg_groups` and `sorted_items`.
- Every row keeps its existing label (`row_label`: package "× 3 — eerste 3 maanden (50% korting)",
  installation name, "Woning: …", "Ontzorgpakket × 3 — eerste 3 maanden", "<pakket> — kopen, eenmalig",
  "Videodeurbel / Afstandsbediening (kopen)", the rider's config name) and its `final_line_price`. The
  label logic only moved inside the group loop.
- Each group ends with **Subtotaal vandaag** (its subtotal). "Vandaag te betalen" (`today_cents`) and
  "Daarna" (`true_month_cents`, only when > 0) follow both groups, unchanged.
- Markup: one `<div class="ovbreakdown-group">` per group with an `<h3 class="ovg-head">` (the left
  list's group-heading style) and its own `<dl class="ovdl ovbreakdown">`; the two totals are a last
  `<dl>`. A heading can't sit inside a `<dl>`, hence one list per group.

## Timeline ("Wanneer betaalt u wat?")

An indigo panel (`.ovtimeline-*`, only the section's existing colour variables) between the breakdown
and the Contract block: a dot-and-line timeline with uppercase gold step labels and a large amount per
step. N = `zv_promo_months` (3); no number of months or amount is written into the file.

| Step | Shown when | Figure | Source |
|---|---|---|---|
| **Vandaag** | always | `today_cents` | the same figure as "Vandaag te betalen" |
| ↳ "N maanden vooruit" | `cg_huren_cents > 0` | `cg_huren_cents` | the Huren subtotal |
| ↳ "Eenmalige kosten" | `cg_kopen_cents > 0` | `cg_kopen_cents` | the Kopen subtotal |
| **Maand 1 t/m N** | `true_month_cents > 0` | €0,00 — al vooruitbetaald | `0 \| money` |
| **Vanaf maand N+1** | `true_month_cents > 0` | `true_month_cents` per maand, "Automatisch via SEPA-incasso" | the same figure as "Daarna" |
| "Eenmalige betaling — geen maandelijkse kosten" | `true_month_cents == 0`, no Huren line, no bought package | – | – |

The €0,00 is rendered with `{{ 0 | money }}` (shop money format, like every other amount on the page),
because `scripts/check_pricing.py` §10 rejects a literal euro amount in any theme file.

### The koop-only fallback, and when it is withheld

The brief asked for "Eenmalige betaling — geen maandelijkse kosten" whenever `true_month_cents == 0`.
That sentence is only true when nothing in the cart recurs, so it shows only then: no Huren line
(`cg_huren_keys == '|'`) **and** no bought package (`distinct_koop_fks == ''`).

- A **bought package** (K001-K005) has a monthly service fee that Odoo bills (`koopMaandelijks`,
  €9,95 or €19,95): the Kopen card on Oplossingen says "Plus €X/mnd voor de dienst", and Overzicht's own
  line shows "Woning: … (+€4/mnd)" when a Woning is chosen. "Geen maandelijkse kosten" would contradict
  both, on the page where consent is captured.
- A cart whose only Huren lines are ones "Daarna" leaves out (A102B, H750, H0010, a Woning line on a bought
  package: `unresolved.ODOO_ADDON_BILLING`) does recur: those lines say "Loopt daarna door tegen €X/mnd".

Both kinds of cart show the **Vandaag step alone**, with no claim either way. Showing the Koop service fee
as a step is a separate decision: its amount is in the config (`zv_<pakket>_koop_maandelijks_cents`), but
when Odoo starts billing it isn't confirmed (`docs/koop-checkout-2026-10-24.md`).

## Known limitations

1. **Cart-level discounts are not allocated to a group.** `today_cents` subtracts
   `cart.cart_level_discount_applications`, while the group subtotals are sums of `final_line_price`
   (line-level allocations only). With a cart-level discount (e.g. an order-wide discount code),
   `cg_huren_cents + cg_kopen_cents` is more than `today_cents`: the breakdown's subtotals and the
   timeline's two sub-lines add up to more than "Vandaag te betalen". Same caveat as /cart
   (`docs/cart-huur-koop-split-2026-10-28.md`). "Eerste 3 maanden" is a product discount allocated to
   lines, so it doesn't cause this; no QA cart on 2026-10-29 had a cart-level discount
   (`cart_level_discount_applications: []`).
2. **"Vanaf maand N+1" inherits the gaps of "Daarna".** It is `true_month_cents`, so H750, H0010, A102B,
   the Woning line on a bought package and a bought package's service fee are not in it
   (`unresolved.ODOO_ADDON_BILLING`). In cart A below, the Videodeurbel line says "Loopt daarna door tegen
   €9,55/mnd" while the timeline says €24,90 per maand (package €19,95 + Ontzorgpakket €4,95).
3. "Maand 1 t/m N: €0,00" assumes every recurring line is prepaid for N months, which holds since
   2026-10-28 (every Huren line syncs to `PKG_QTY`).

## Verified 2026-10-29

Disposable theme `zz-validate-overzicht-timeline` (deleted afterwards), real Chrome, server-rendered
`/cart?view=overzicht`:

| Cart | Breakdown | Timeline | Subtotals vs Vandaag |
|---|---|---|---|
| **A** Inzicht ×3, N0004, MOIOH ×3, H750 ×3, CL004 | Huren: Inzicht €29,94, Videodeurbel €14,34, Ontzorgpakket €7,44 → €51,72. Kopen: Installatie €99,00, Afstandsbediening (kopen) €40,00 → €139,00. Vandaag €190,72, Daarna €24,90/mnd | Vandaag €190,72 (3 maanden vooruit €51,72, Eenmalige kosten €139,00); Maand 1 t/m 3 €0,00; Vanaf maand 4 €24,90 per maand | 5172 + 13900 = 19072 = today |
| **B** K001 (Afname: Kopen), N0004 | no Huren group, no Daarna. Kopen: Inzicht — kopen, eenmalig €299,00, Installatie €99,00 → €398,00 | Vandaag €398,00 (Eenmalige kosten €398,00) only; no fallback line (bought package) | 39800 = today |
| **B2** CL004 only | Kopen: Afstandsbediening (kopen) €40,00 | Vandaag €40,00 + "Eenmalige betaling — geen maandelijkse kosten" | 4000 = today |
| **D** K001 (Kopen), N0004, ADC-750, A102B ×3 | Huren: Camera-abonnement videodeurbel €5,25. Kopen: Inzicht — kopen €299,00, Videodeurbel (kopen) €299,00, Installatie €99,00 → €697,00. Vandaag €702,25, no Daarna | Vandaag €702,25 (3 maanden vooruit €5,25, Eenmalige kosten €697,00) only; no fallback line | 525 + 69700 = 70225 = today |

In every cart the rows came in the same groups and order as the item list on the left.

## Narrow width (seen, not changed)

The panel itself fits a phone: in the one-column layout (≤920px, `ov-right` above `ov-left`) it is ~300px
wide at 390px, and its rows wrap.

**Pre-existing on main:** on a cart with a rented package the whole Overzicht page is 445px wide at every
phone width measured (414, 390, 375, 360, 320), so the right-aligned amounts of the cost card, the new
panel included, sit partly off-screen until the customer scrolls sideways. Carts B, B2 and D (no rented
package) fit at 390. The cause is the left card's package row (`.ovitem`, grid `64px 1fr auto`): its
uppercase `.ovi-line` "BEVEILIGINGSABONNEMENT" can't wrap (~168px) next to the price column, and the
single mobile grid column (`.olayout`, `1fr` = `minmax(auto, 1fr)`) grows to that row's min-content
(~425px). This branch doesn't touch the left card. Tried and dropped: `.ovi-line { overflow-wrap:anywhere }`
fixes 390px and up but splits the label into four pieces and still overflows at 375 and 360 (386px). A
real fix is a phone layout for `.ovitem`, e.g. the price block under the name at ≤480px as
`.ovinstall-opt` already does: a design call, left open.

Also seen: the section setting `due_today_text` ("Vandaag betaalt u de eventuele installatiekosten en de
eerste 3 maanden van uw pakket vooruit, met 50% korting…") shows on koop-only carts too (cart B), where
nothing is prepaid.
