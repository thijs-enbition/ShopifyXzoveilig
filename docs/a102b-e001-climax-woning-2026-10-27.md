# A102B with a bought Videodeurbel, and Woning for Climax via E001 (2026-10-27)

Branch `feature/a102b-e001-climax-woning-2026-10-27`, from `origin/main` @ `37aed95` (PR #152 and
#153 merged). Same pattern and rigor as `docs/woning-n0008-line-2026-09-25.md`.

**Blocks merge: E001 is not in the "Eerste 3 maanden" discount (§5).** The Climax Woning line is
built like N0008: quantity 3 x floors, meant to be 50% off. Today E001 is charged in full
(€12,00 per floor instead of €6,00), and Overzicht blocks every checkout that carries it
(`cart_woning_bad`, contact message), exactly as N0008 did before it was added to the discount.

## 1. The two changes

1. **A102B rides with ADC-750.** `camera-abonnement-videodeurbel-1200-clips` / A102B (€3,50/mnd)
   was never referenced by the theme, so a customer who chose "Kopen" for the Videodeurbel paid the
   one-time €299 (ADC-750) and nothing recurring. Now one A102B line is in the cart whenever an
   ADC-750 line is, and goes when it goes.
2. **Climax gets Woning, via E001.** Beschermd and Protect offer the same Woning choice as the
   NAMI packages, collected by their own product `extra-etage-of-100m2-climax` / E001 (€4,00).
   This replaces the hardware page's `#grotere-woning` block (removed in PR #152) as how a bigger
   Climax home is handled.

## 2. Decision: A102B syncs flat at quantity 1 (not the N0008 treatment)

Written into A102B's `addonNames` note in `pricing.config.json` and pinned by `check_pricing.py`
§17. Rejected: quantity `promo.months` in the promo discount, like N0008. Reasons:

- The intro promo is Huren only (`koop.promoApplies` is false), and A102B is only ever triggered by
  a Koop purchase (ADC-750).
- A102B is not in the "Eerste 3 maanden" discount (Admin API, 2026-10-27), so quantity 3 would
  charge three full months today.
- A bought package prepays nothing either; its monthly service fee is Odoo's.

So A102B joins the Huren rentals H750/H0010 in the same open question: a monthly product at
quantity 1, one month charged today, not in Overzicht's "Daarna". It is now tracked as
`unresolved.ODOO_ADDON_BILLING` in the config (documentation only, like `ODOO_PROMO_DISCOUNT`).

## 3. Where it lives

| Place | What |
|---|---|
| `pricing.config.json` `surcharges[]` | `extra-etage` gets `installGroup: nami`; new `extra-etage-climax` (E001, `installGroup: climax`, appliesTo Beschermd/Protect). The Woning choice (heading, values, legacy prefix) stays once, on `extra-etage.woning`. |
| `pricing.config.json` `addonNames[]` | A102B: `ridesWith` ADC-750, `cartQuantity` 1, the decision in its note. |
| `pricing.config.json` `unresolved[]` | `ODOO_ADDON_BILLING`. |
| `scripts/build_pricing.py` | `woning.products` (one per installGroup) replaces `woning.shopify`; refuses two products for one installGroup, a package in the wrong platform's appliesTo or in two, a Climax unit that differs from NAMI's, and a rider that doesn't ride a Koop product or isn't quantity 1. Emits `zv_woning_handles`, `zv_woning_skus`, `zv_woning_applies_by_product` (parallel lists), `zv_woning_applies_handles`/`_fks` (every Woning package), `zv_beschermd/protect_woning_<n>_icv_cents`, `zv_addon_rider_by_lead`, `addonRiders`. `zv_woning_handle`/`zv_woning_sku` are gone. |
| `scripts/check_pricing.py` §13, §17 | §13 pins both Woning products and their appliesTo per platform; §17 pins A102B ↔ ADC-750 at 1. No theme file outside the generated snippets names N0008, E001, A102B or their handles. |
| `snippets/zv-woning-variants.liquid` (new) | Resolves the Woning products by handle + SKU into a parallel list (0 = unresolved). |
| `snippets/zv-woning-label.liquid` (new) | "Woning: <value>" for one Woning line, from its own platform's package lines only. |
| `snippets/zv-addon-riders.liquid` (new) | Resolves rider pairs into `leadVariant:riderVariant:cents`. |
| `sections/oplossingen.liquid` | `WONING_PRODUCTS` replaces `WONING_VARIANT_ID`; Climax cards render the shared Woning panel; Climax accordion, hardware link and its CSS removed; modal gate is `woningAppliesFk()`, not `pk.plus`; `syncAddonLines()` syncs riders last; the Videodeurbel Kopen price names A102B's live monthly price; footnote lists every Woning package from config. |
| `snippets/zv-cart-guard.liquid` | Rule 5 per Woning product; rule 6 strips Woning only from a package that doesn't offer it (none today); rule 7 keeps A102B in step with ADC-750. |
| `sections/zv-cart.liquid`, `zv-checkout-overview.liquid`, `zv-header.liquid`, `snippets/zv-hidden-cart-lines.liquid` | Woning lines as a list; a label per line; the Overzicht gate per product; Beschermd/Protect Woning ICV; A102B row (config name, no remove link on /cart, `cart_needs_fix` while out of step). |

## 4. Platform-aware, not a parallel copy

Every reader keys the Woning product off the package: `appliesTo` per product, matched by
installGroup in the build. A Climax package can never resolve to N0008 (or NAMI to E001): the
build refuses it and §13 fails on it (both tried against broken config). The UI pieces (card panel,
drawer control, modal box, readCardOptions, the Woning property, the legacy prefix) were already
written against `WONING.appliesTo` and needed no second copy, only the union list.

What resisted a clean refactor (flagged, not forced):

- **One price per Woning option.** The cards, drawer, modal and footnote show one "+€4/mnd" per
  option, and Overzicht checks one `zv_woning_unit_cents`. E001 and N0008 are both €4,00, so the
  build requires equal units and refuses otherwise. A different Climax price needs per-platform
  prices in those four places first.
- **Overzicht's gate in Liquid.** Liquid has no maps, so the per-product line/floor tally is two
  `index:value|` logs summed per product after the loop. Correct, but harder to read than the
  single-product version.
- **The modal's `plus` data.** It gated the Woning box but `plus.items` was never rendered. The
  gate is now `woningAppliesFk()` (config), and Beschermd/Protect get no `plus.items`: what an extra
  Climax verdieping adds in hardware is not confirmed (the removed hardware block listed sets, but
  whether E001 includes them is unknown).
- **The modal's `.ltc__hwlink` branch and `climax_hardware_link` event** are gone with the link. A
  GTM trigger on that event, if any, stops firing.

## 5. Preflight (2026-10-27, Admin API, read-only)

| Check | A102B | E001 |
|---|---|---|
| Handle | `camera-abonnement-videodeurbel-1200-clips` | `extra-etage-of-100m2-climax` |
| Status / variants | ACTIVE, 1 (`58962654429565`) | ACTIVE, 1 (`58962654888317`) |
| SKU / price | A102B, €3,50 | E001, €4,00 |
| Type | `ADC Camera ABO` | `NAMI_abonnementen` (never a package: not `Beveiligingsabonnement`) |
| Published | Online Store, POS, Google & YouTube, Inbox, Shop | same |
| Inventory | tracked, CONTINUE, 0 (buyable) | tracked, CONTINUE, 0 (buyable) |
| "Eerste 3 maanden" discount | no (intended: flat, §2) | **no: blocks merge** |

The discount's scope today: Beschermd, Protect, Vista, N0008, Inzicht, Zeker, Alert. N0008 is
€4,00 now (it was €40,00 at its 2026-09-25 preflight). Nothing was changed from here.

## 6. Validation (disposable themes `zz-validate-a102b-e001` #190133797245 and `-base` #190133928317 from `main`)

- `build_pricing.py` + `check_pricing.py`: all pass. Broken config tried and caught by both:
  Protect in the NAMI appliesTo, a Climax unit of 500, two products for one installGroup, A102B at
  quantity 3, A102B riding H750; a theme file naming E001 and one reading `zv_woning_handle`.
- `shopify theme check`: 0 errors on main and branch; new warnings are only include-scoped
  `UndefinedObject`/`UnusedAssign` for the new assigns (no typos).
- `shopify theme push --unpublished`: the server-side validator accepted every file.
- Server HTML, branch vs base: all 5 package cards render (no SKU/handle miss, same "Prijs volgt"
  count), so the page's 19 `all_products` handles fit. NAMI cards differ only in the Videodeurbel
  Kopen text ("+€299,00 eenmalig + €3,50/mnd"). Beschermd/Protect gain the Woning group and lose the
  `#grotere-woning` link. `/`, `/cart`, Overzicht, camera-hardware, vergelijk-pakketten and a
  product page render without a Liquid error.
- Guard `planFix` in node, 14 cases: E001 added/set/merged/removed for Climax floors only, never
  N0008; mixed NAMI + Climax carts; a legacy Beschermd Woning value now counts; a Koop Beschermd keeps
  Woning without a line; A102B added, set to 1, merged, removed without ADC-750. With E001
  unresolved the Climax Woning stays property only.
- **Real carts (Playwright, branch theme):** Beschermd card 1 floor → Beschermd x3 + CL003 + E001
  x3, no N0008; drawer → 2 floors → E001 x6; Zeker 1 floor + Videodeurbel Kopen → N0008 x3,
  E001 x6, ADC-750 x1, A102B x1, drawer rows only packages + CL003; drawer uncheck → ADC-750 and
  A102B gone; Protect modal (Woning box, price +€4, no hardware link) 1 floor → E001 x9; removing
  Beschermd → E001 x3, CL003 kept; /cart: guard adds A102B to a lone ADC-750, two "Woning" rows
  with their own labels, A102B row named from config without remove link, `planFix` null, count "3
  artikelen"; removing ADC-750 on /cart → guard removes A102B; Overzicht single Beschermd 1 floor:
  ICV €1.615,29 (1.477,29 + 138), Daarna €43,95, checkout blocked with the contact message (E001
  undiscounted: `final_line_price` 1200, no allocation). No console errors besides the platform's.
- **Not validated:** a checkout that passes the Climax Woning gate (needs E001 in the discount),
  and Odoo's handling of E001 and A102B.

## 7. Open items

1. **E001 in "Eerste 3 maanden" (Admin).** Blocks merge, same gate as N0008 had. Then a Climax
   floor costs 3 x €2,00 = €6,00 today.
2. **Odoo (Alex):** E001 like N0008 (quantity = floors, €4/floor/month from month 4, the prepaid
   three not billed again; reads the `Woning` property on the Climax line). A102B and the Huren
   rentals: `unresolved.ODOO_ADDON_BILLING`.
3. **Copy (Thijs/Robi):** the footnote now reads "Bij Inzicht, Zeker, Alert, Beschermd en Protect:
   +€4/mnd per extra verdieping …" (the "breidt u uit met extra sensoren" sentence is gone); the
   Videodeurbel Kopen price shows "+€299,00 eenmalig + €3,50/mnd"; A102B is named "Camera-abonnement
   videodeurbel", with "Hoort bij uw gekochte videodeurbel" on /cart and Overzicht (no claim
   about which month the €3,50 today covers: that is `ODOO_ADDON_BILLING`).
4. **/cart and Overzicht with both platforms:** two rows read "Woning: 1 extra verdieping of 100 m²"
   without saying which package each belongs to. Correct amounts, but a package name in the label
   may help.
5. **all_products budget:** Oplossingen is at 19 of 20 unique handles. The next product looked up
   on that page needs one removed first.
6. **Ontzorgpakket on a Koop package, and other legacy shapes,** unchanged by this branch.
