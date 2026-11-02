# NAMI installation choice moves to Winkelwagen (2026-11-02)

The 3-option NAMI installation picker (Geen installatie N0006 / Telefonische ondersteuning N0005 /
Installatie aan huis N0004) is now on `/cart` (`sections/zv-cart.liquid`) and gates "Naar afrekenen".
Overzicht keeps its own required radio group and `cart_needs_activation` gate unchanged, as the
fallback for a cart that reaches `/cart?view=overzicht` without choosing (bookmark, another tab).

## What /cart does
- Detection (top of the section, mirrors Overzicht): `has_nami_pkg` = a rented line (`sub_type`/`sub_tag`
  + finder_key `aware`/`aware_plus`/`secure`) or a Koop line (`zv-koop-fk`) of a NAMI package;
  `has_nami_install_line` / `selected_nami_install_id` from the three install variant ids.
  `has_climax_pkg` is not needed here (CL003 is added by `zv-cart-guard`) and is not computed.
- `show_nami_install = has_nami_pkg`. The picker (`.cinstall-section`, in `.citems` after the Huren/Kopen
  groups) renders only then; a Climax-only cart shows none and keeps the normal `<a>` button.
- `cart_install_pending` (NAMI package, no install line): the CTA is a real
  `<button disabled aria-disabled="true">` (no href to follow) plus "Kies eerst uw installatie
  hierboven." Picking an option POSTs `/cart/update.js` (zero the other fee variants: CL003 + the 3
  NAMI ids), then `/cart/add.js` (chosen variant x1), then reloads, so the button state is always the
  live cart's. On failure the radios re-enable and `.cinstall-err` shows.
- `zv-cart-guard` still never picks an option.

## Duplication (decision)
Markup, CSS and JS are copied from Overzicht (classes renamed `ovinstall-*` -> `cinstall-*`, data
attributes `data-cart-install-*`), not extracted to a snippet: the CSS is scoped per section root
(`.zv-cart` / `.zv-overzicht`), the JS reads Liquid ids, and refactoring Overzicht means touching a live
checkout gate for no behaviour change. **A change to the options (labels, icons, the swap) must be made in
both files.** Revisit if a third surface needs it.

## Verified (disposable theme, real Chrome, 2026-11-02)
NAMI Inzicht cart: picker, disabled CTA (click does nothing), pick -> update.js+add.js -> reload -> active
`<a href="/cart?view=overzicht">`; swap telefonisch -> huis replaces the line; Overzicht then pre-selects it
with no gate message. Fallback: removing the install line via `/cart/update.js` -> Overzicht shows the
"Er ontbreekt een onderdeel" message and the radio group, choosing there works, /cart then has an active
CTA. Climax-only (Beschermd): no picker, active CTA (guard adds CL003). Mixed NAMI + Climax: picker + disabled
CTA; picking removes CL003, the guard re-adds it once, no loop (same as Overzicht today).
`check_pricing.py` passes; `shopify theme check`: 0 errors, +11 warnings vs main (546 -> 557), all
`UndefinedObject` for `zv-pricing` globals / `activation_variant_id` that the checker can't see across files.
