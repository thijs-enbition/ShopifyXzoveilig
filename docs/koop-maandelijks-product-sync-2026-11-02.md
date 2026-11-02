# Koop monthly service fee as a real product line (2026-11-02)

Follow-up to `docs/koop-maandelijks-cart-2026-11-02.md`, same day. That fix added a Koop
package's `koopMaandelijks` figure into "Daarna" by computing it directly from config, since
there was no real Shopify line for it. Thijs then asked for real products instead, explicitly
wired to behave like a Huren line: synced at quantity 3 (`PKG_QTY`), in the "Eerste 3 maanden"
discount. This note covers that.

## Shopify side (done directly via the Admin connector, not from this repo)

Five new products, one per Koop package, matching the `koopMaandelijks` figures already in
`pricing.config.json`:

| SKU | Title | Handle | Price | Vendor | Rides with |
|---|---|---|---|---|---|
| K001.1 | Koop Inzicht (maand) | `koop-inzicht-maand` | €9,95 | Zo Veilig NAMI | koop-inzicht / K001 |
| K002.1 | Koop Zeker (maand) | `koop-zeker-maand` | €9,95 | Zo Veilig NAMI | koop-zeker / K002 |
| K003.1 | Koop Beschermd (maand) | `koop-beschermd-maand` | €19,95 | Zo Veilig Climax | koop-beschermd / K003 |
| K004.1 | Koop Alert (maand) | `koop-alert-maand` | €9,95 | Zo Veilig NAMI | koop-alert / K004 |
| K005.1 | Koop Protect (maand) | `koop-protect-maand` | €19,95 | Zo Veilig Climax | koop-protect / K005 |

`productType: "Huur Componenten"` on all 5, matching H750/H0010 (the other recurring-monthly
add-ons already synced at `PKG_QTY`), not `NAMI_abonnementen`/`Huur Componenten` like the one-time
K001-K005 hardware products. All 5 created ACTIVE, confirmed already published to the Online
Store channel (no extra publish step needed), and added to the existing "Eerste 3 maanden"
automatic discount (`gid://shopify/DiscountAutomaticNode/2498019852669`) via
`discountAutomaticBasicUpdate`'s `productsToAdd` - confirmed via the mutation result ("50% off 20
products", up from 15), no other fields touched.

## Theme side: reused the existing rider mechanism, not new code

The theme already had exactly this shape built: A102B (a camera subscription) "rides with" ADC-750
(a bought Videodeurbel) - one line, synced to `PKG_QTY`, appearing only while its lead line is in
the cart, already counted into "Daarna" and rendered like any other add-on. Both the client-side
sync (`syncAddonLines()`/`ADDON_RIDERS` in `oplossingen.liquid`) and the server-side safety net
(`zv-cart-guard.liquid` rule 7) are list-driven already, not hardcoded to one pair.

The only gap: `build_pricing.py`'s rider validation only accepted an *add-on's* Koop product
(from `addonNames[].koopProduct`) as a valid `ridesWith` target - never a *package's* own Koop
product (`lines[].packages[].koopProduct`, K001-K005). Fixed by also collecting package-level
`koopProduct`s into the same `koop_products` lookup the validation checks against.

With that, the 5 new products are just 5 more `addonNames` entries with `ridesWith` pointing at
their package's `koopProduct` - no JS or cart-guard changes needed at all:

```json
{"productHandle": "koop-inzicht-maand", "sku": "K001.1", "name": "Koop Inzicht (maand)",
 "ridesWith": {"handle": "koop-inzicht", "sku": "K001"}, "cartQuantity": 1}
```

(`cartQuantity: 1` is the same stale reference value A102B carries - the theme syncs at `PKG_QTY`,
nothing reads this field.) Regenerating emits all 6 pairs into `zv_addon_rider_by_lead` and the
`'rider'` line of `zv-package-handles.liquid`, so `zv-hidden-cart-lines.liquid`'s
`zv_rider_variant_id_list` (used by both `/cart` and Overzicht to classify a line as a rider, show
its name via `zv_install_names_by_handle` - also auto-populated from `addonNames[].name` - and sum
it into `true_month_cents`) picks up all 5 new lines automatically.

## Reverted: the direct-from-config "Daarna" fix

Since each package's `(maand)` product now rides with its Koop line as a real product, its price
already counts toward "Daarna" via the generic rider check (`zv_rider_variant_id_list contains
item_vid`). The branches added earlier today in `zv-cart.liquid` and `zv-checkout-overview.liquid`
that computed the same figure directly from `zv_koop_maandelijks_by_fk` would now double it, so
they're removed, along with the now-unused `zv_koop_maandelijks_by_fk` map and
`snippets/zv-koop-maandelijks.liquid`.

## Generic rider caption

The hardcoded "Hoort bij uw gekochte videodeurbel." (A102B-specific) now has 5 siblings that have
nothing to do with a doorbell. Changed to "Hoort bij deze aankoop." everywhere it appeared:
`zv-cart.liquid`, `zv-checkout-overview.liquid`, and the Oplossingen add-to-cart drawer's
`riderRowHtml()`.

## Rebased onto a concurrent Overzicht redesign (Robi)

Built against `main` at `0eccc05`, but `main` moved to `4dd0709` before this landed (two direct
Shopify-editor pushes from "Thijs Wolf", synced back via `shopify[bot]`): a new two-card
"Maandelijkse kosten" / "Eenmalige kosten" layout for Overzicht, plus benefit-led per-line-type
copy ("Onderhoud en vervanging bij defect" for Ontzorgpakket, "Opslag en live beelden bekijken"
for the camera-subscription rider, etc.) replacing the old generic captions. Rebased cleanly
except one hunk: the generic rider caption I'd changed to "Hoort bij deze aankoop." no longer
existed at that spot - Robi's redesign had already replaced it with the camera-subscription-
specific "Opslag en live beelden bekijken", which **every** rider now falls into generically
(`zv_rider_variant_id_list contains item_vid`), including the 5 new package-service riders. Left
as-is, a bought package's monthly service line would have shown "Storage and live footage
viewing" on Overzicht - wrong for 5 of 6 riders.

Fixed with a new, narrower generated list (`zv-package-handles` line `koop-maandelijks`: the 5
package-service riders only, never the camera-subscription one), resolved the same way Ontzorgpakket's
list already was in both `zv-checkout-overview.liquid` (its own independent resolution - this file
doesn't include `zv-hidden-cart-lines.liquid` at all) and `snippets/zv-hidden-cart-lines.liquid`
(for `/cart`). Checked *before* the generic rider check in both `zv-checkout-overview.liquid`
(replacing the wrong camera caption for these 5) and `zv-cart.liquid` (upgrading the generic
"Hoort bij deze aankoop." to the same specific copy, for consistency - not a bug there, since
Robi's copy redesign only touched Overzicht, but worth matching). Copy used: "Maandelijkse dienst,
los van de apparatuur" / "Maandelijkse dienst, los van de apparatuur." - echoing Oplossingen's own
existing wording for this fee ("Plus €X,XX/mnd voor de dienst, zonder apparatuurkosten"), not
invented fresh. `check_pricing.py` gained checks that the narrower list excludes the camera rider
and that both templates check it before the generic one, so this can't silently regress.

This also means `oplossingen.liquid`'s own add-to-cart drawer (`riderRowHtml()`) still shows the
plain generic "Hoort bij deze aankoop." for all 6 riders - not wrong, just less specific than
Overzicht now is. Left alone: Robi's redesign didn't touch that drawer, and extending it would
need the same variant-id distinction threaded into client-side JS, which felt like scope creep
for a rebase-driven fix. Worth a follow-up if the drawer's copy should match Overzicht's.

## UNRESOLVED: the Oplossingen `all_products` handle budget

**This was not verified live and is the main open risk of this change.**
`docs/a102b-e001-climax-woning-2026-10-27.md` and `CLAUDE.md` both record Oplossingen as already
at **20 of 20** unique `all_products` handle lookups as of 2026-10-27 ("none left" - the next
product looked up on that page needs one removed first). `zv-addon-riders.liquid` resolves *both*
sides of every lead:rider pair by handle, and it's rendered from `oplossingen.liquid` itself (to
build the `data-addon-riders` attribute `syncAddonLines()` reads). The 5 new rider handles
(`koop-inzicht-maand`, etc.) are 5 more lookups against a budget with nothing left.

This was not re-counted live, and no handle was freed to make room before shipping. If the limit
behaves as "first N resolved, rest return blank" (consistent with the existing A102B/CL004
notes), the likely effect is that some or all of the 5 new rider pairs fail to resolve on
Oplossingen specifically - `ADDON_RIDERS` would be missing them, so `syncAddonLines()` wouldn't
add the new monthly line to the cart drawer immediately after a Koop purchase there.

The existing precedent for a dropped rider is `zv-cart-guard.liquid` rule 7, which restores a
missing rider line once the customer reaches `/cart` or Overzicht - separate page templates, each
with their own handle budget, almost certainly with headroom since neither does Oplossingen's
large per-package card rendering. So the likely real-world effect is degraded (missing from the
drawer, present by `/cart`), not silently wrong at checkout - but "likely" is not "confirmed".

**Needs one of:** a live recount of Oplossingen's actual current handle usage (this repo can't
run Shopify's renderer), or freeing a handle there before this ships, or a live test (add a Koop
package on Oplossingen, inspect the page's `data-addon-riders` attribute / the drawer / the
resulting cart) to confirm the 5 new pairs actually resolve.
