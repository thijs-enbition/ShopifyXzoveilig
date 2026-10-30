# Videodeurbel rider (A102B) fixes, 2026-10-30

Branch `fix/addon-rider-fixes-2026-10-30`. Four changes in one feature area: the bought
Videodeurbel (ADC-750) and the camera subscription that rides with it (A102B).

## 1. Stale "A102B is not discounted" comments

A102B is in the "Eerste 3 maanden" discount. It was added in Shopify Admin on 2026-10-28, and an
Admin API read-only query on 2026-10-30 lists 15 products, A102B among them (ADC-750 and CL004 are
not). The cart agrees: an Overzicht cart on 2026-10-30 had A102B x3 at `final_line_price` 525
against `original_line_price` 1050. Every comment and config note that said it stays at full price
now says it is discounted: `sections/oplossingen.liquid` (rider block and `addonTargets()`),
`snippets/zv-cart-guard.liquid` (rule 7), `sections/zv-checkout-overview.liquid`,
`pricing/pricing.config.json` (A102B note, `promo.discountScopeNote`, `ODOO_ADDON_BILLING`),
`scripts/build_pricing.py` and `scripts/check_pricing.py` (comments only: neither script asserted
the exclusion). Comments that still said "quantity 1" for the rider (`zv-addon-riders`, `zv-cart`)
were brought up to `pkg_qty` too.

`rounding.note` in pricing.config.json described rounding a line total once ("1.5 x 2495 = 3742.5 ->
3743"). Shopify rounds the 50% PER UNIT and multiplies by the quantity: Zeker 1247.5 -> 1248 x 3 =
3744 (EUR 37,44), not half_up(3742.5) = 3743 (EUR 37,43). The note now says that. No numbers changed:
`build_pricing.py` already computed per unit.

## 2. "A102B is not always added with ADC-750"

### How it was reproduced

Disposable theme `zz-validate-addon-rider-2026-10-30`, real Chrome over CDP, one login. Each trial
clears the cart, ticks Videodeurbel on the Zeker card (NAMI, Koop-only), clicks "In winkelwagen",
waits for the drawer (or the card's error), then reads `/cart.js`. The network is Chrome's Slow 3G
preset throughout, by CDP `Network.emulateNetworkConditions`. Three modes:

- **slow3g**: no fault.
- **offline**: one real CDP offline window (0.8-3s) at a random point 1-17s into the flow.
- **inject**: exactly one request fails, by an in-page `window.fetch` wrapper: `abort` (never sent),
  `drop` (sent, Shopify answers, the page never sees the answer) or `429`. This is fault injection
  on real Shopify requests, so each failure point can be named.

The add flow is 7 requests, one at a time: `GET /cart.js`, `POST /cart/add.js` (package), `GET
/cart.js`, then in `syncAddonLines()`: `POST /cart/add.js` ADC-750, `GET /cart.js`, `POST
/cart/add.js` A102B x3, `GET /cart.js`.

### Results on main (5a784f5), 26 trials

| Mode | Trials | OK | A102B missing (ADC-750 there) | ADC-750 and A102B missing | No package |
|---|---|---|---|---|---|
| slow3g | 8 | 8 | 0 | 0 | 0 |
| offline | 12 | 4 | 3 | 4 | 1 |
| inject (one per step) | 6 | 1 | 3 | 2 | 0 |

- Slowness alone never breaks it. The chain waits for each step.
- Any one failed request inside `syncAddonLines()` did. Each step ended in
  `.catch(function () { return cart; })`, with no retry and nothing shown. Three ways to lose A102B:
  the A102B add failed; the `/cart.js` re-read after the ADC-750 add failed; or the ADC-750 add
  landed but its answer was lost (`drop`). In the last two the rider step planned from the stale
  cart, saw no ADC-750 and added nothing.
- In 6 of the 7 bad offline trials the drawer opened normally, with Videodeurbel ticked.

### Can such a cart reach Shopify's checkout?

Every theme route to `/checkout` goes through Overzicht: the Oplossingen drawer's "Naar afrekenen"
(`addcart__go`) and the modal's "Direct afrekenen" link to `/cart?view=overzicht`, and /cart's CTA
does too. Dawn's `cart-notification` / `cart-drawer` / `main-cart-footer` checkout buttons are
never rendered: the header group is `zv-header` only and `templates/cart.json` is `zv-cart` only.
The only `window.location.href = '/checkout'` is Overzicht's button, behind the server gate
(`cart_needs_fix` includes the rider) and `window.zvCartGuard.planFix()` on a fresh `/cart.js`.
Overzicht resolves about 15 unique `all_products` handles, so the rider pair resolves there. The
drawer link needs no guard of its own: the guard and the gate on Overzicht are the check.

Checked on Overzicht with two hand-built carts (Zeker x3 recording `Videodeurbel (koop)`, plus N0006):

- **ADC-750 there, A102B missing:** the guard POSTed `/cart/update.js {"updates":{"<A102B>":3}}` on
  load and reloaded. A102B x3 was then in the cart (discounted), `planFix` returned null and the
  checkout button was enabled. **This form heals before checkout.**
- **ADC-750 and A102B both missing:** nothing reacts. `planFix` returns null, the gate passes and
  the button is enabled. The package line says the customer bought a Videodeurbel, and no ADC-750
  (EUR 299) or A102B line is charged. **No theme rule reconciles add-on lines with the
  `Uitbreidingen` property**; only the rider has one (guard rule 7, keyed on ADC-750 itself).
  Closing this needs a guard/gate rule per add-on (the name -> variant map, Huren vs Koop quantity,
  Afstandsbediening's count, Ontzorgpakket by finder_key). Not built here: it's a design decision.

The permalink and `/checkout` typed directly are unchanged (CLAUDE.md "Known limitation").

### The fix

`syncAddonLines()` now runs each add-on through `syncAddonLine()`. A failed step is tried twice
more, 1s then 2s later. A retry never resends the request, because `add.js` adds on top and the
failed write may have landed. It re-reads the cart and plans again from that. A cart that can't
be re-read is never planned from; the read is retried instead. After the last try the step gives up
with the cart as it was, as before; the guard still restores a missing rider on /cart and Overzicht.

The first fixed run showed one more entry point: the `GET /cart.js` that `addToCart()` (and
`addKoopToCart()`) make right after the package add, which the whole sync starts from. When it
failed, the package was in the cart but nothing was synced, and the card said "Toevoegen mislukt"
(baseline offline #7, fixed offline #10). That read now retries the same way (`readCartRetrying()`).

### Results with the fix

Same harness, same theme, two builds: "retry" (`syncAddonLine()` only) and "final" (plus
`readCartRetrying()`).

| Mode | main | retry build | final build |
|---|---|---|---|
| slow3g | 8/8 OK | 3/3 OK | (not re-run) |
| offline | 4/12 OK | 10/12 OK | 7/8 OK |
| inject, one fault per step | 1/6 OK | 6/6 OK | 5/5 OK (adds two faults on the post-add read) |

Each non-OK trial on the fixed builds:

- **retry build, offline #3:** the post-add read failed (the case `readCartRetrying()` now covers;
  on the final build `inject:cart-after-pkg` abort and 429 both end OK).
- **retry build offline #5, final build offline #1:** the package add itself failed. The card says
  "Toevoegen mislukt. Probeer het opnieuw." and the cart is empty, which is correct.

Several fixed-build trials show the retry at work in the request log. For example, the ADC-750 add
failed, the first retry's re-read failed too (still offline) and the second retry recovered it,
ending at ADC-750 x1 + A102B x3.

Drawer flows on the final build at normal speed:

- Unticking Videodeurbel in the drawer removed ADC-750 and A102B, and the rider row went too.
- Beschermd with Videodeurbel Kopen at 390px showed rows Installatie, Beschermd and
  Camera-abonnement.
- Removing Beschermd from the drawer emptied the cart (ADC-750 and A102B went with it) and closed
  the drawer.

One thing I noticed, not acted on: after about 40 throttled flows the headless tab crashed. Chrome
itself kept running, and one fresh tab and one navigation later the runs continued with no bot
challenge.

## 3. `data-selected-addon` after a Huren/Kopen switch

The mode radios toggled the row but never refreshed the card button's analytics attributes. Both
handlers now call `syncAddBtnSelection(card)`. Beschermd, real clicks:

| Step | main | branch |
|---|---|---|
| tick Videodeurbel (Huren) | `Videodeurbel` | `Videodeurbel` |
| switch to Kopen | `Videodeurbel` | `Videodeurbel (koop)` |
| back to Huren | `Videodeurbel` | `Videodeurbel` |
| Kopen again | `Videodeurbel` | `Videodeurbel (koop)` |

## 4. A102B row in the Oplossingen drawer

The drawer filtered every add-on line out (`isAddonLine()`), so A102B only showed inside the
Videodeurbel option's price text ("EUR 299 + EUR 3,50/mnd"). It now gets its own quiet row after the
package rows (`riderRowHtml()`): "Camera-abonnement videodeurbel" (from `#zv-item-names`), the
same note /cart shows ("Hoort bij uw gekochte videodeurbel."), its unit price "/mnd" like a package
row, and no remove control. It goes when the Videodeurbel goes. `updateCartCount()` and the
drawer's count are untouched. Zeker + Videodeurbel (koop) on both themes: badge `1`, drawer "3 items
in winkelwagen". The Videodeurbel option keeps "EUR 299 + EUR 3,50/mnd".

Aside: `--sand` is not defined on the Oplossingen page, so the drawer's existing
`.addcart__opt` / `.addcart__woning` sand backgrounds render transparent (pre-existing). The rider
row uses `--cream`, which is defined.
