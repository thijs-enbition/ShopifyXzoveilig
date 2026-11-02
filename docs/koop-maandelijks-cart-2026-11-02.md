# Koop monthly service fee missing from "Daarna" (2026-11-02)

Reported with a screenshot: a cart holding a bought (Kopen) Zeker package showed
"Vandaag te betalen €357,94. Daarna €5,95 per maand" — the €5,95 is Ontzorgpakket's monthly
fee only. Zeker's own koop service fee (€9,95/mnd) was nowhere on the page and wasn't in
"Daarna" at all.

## Root cause

Every package's `koopEenmalig`/`koopMaandelijks` pair has always been correctly defined and
checked end to end — `pricing.config.json` → `pricing.generated.json` →
`snippets/zv-pricing.liquid` (`zv_<id>_koop_maandelijks_cents`) → Oplossingen's Kopen note
(`ltc__koopnote`, "Plus €X,XX/mnd voor de dienst, zonder apparatuurkosten"). `check_pricing.py`
section 15 already asserted all of that.

What didn't exist was anywhere past Oplossingen. `sections/zv-cart.liquid` and
`sections/zv-checkout-overview.liquid` both deliberately treat a Koop line as "never counted as
a package ... not in 'Daarna'" (2026-10-24 decision, `docs/koop-checkout-2026-10-24.md`) —
correct for the Shopify-billing side (`koopMaandelijks` is never a Shopify line, no x3, no
promo, no ICV: Odoo bills it separately, out of scope here), but their `true_month_cents`
("Daarna") loops had no branch for a koop line at all, unlike Ontzorgpakket, the Huren hardware
add-ons (H750/H0010) and the camera rider, which all do count there.

## Fix

- `scripts/build_pricing.py` emits a new generated map, `zv_koop_maandelijks_by_fk`
  (`finder_key:cents|...`), alongside the existing `zv_package_names_by_fk` — the 5 koop
  packages only, same source (`koop_row()`).
- `snippets/zv-koop-maandelijks.liquid` (new, hand-written like `zv-package-name.liquid`):
  finder_key → cents lookup against that map.
- `sections/zv-cart.liquid` and `sections/zv-checkout-overview.liquid`: the `true_month_cents`
  loop now adds a Koop line's `koopMaandelijks` figure in, the same way it already adds
  Ontzorgpakket/H750/H0010/the rider.
- `pricing/pricing.config.json`'s `koop.cartNote` updated to describe this (still true: no
  Shopify line, no x3/promo/ICV; no longer true: left out of "Daarna").
- `scripts/check_pricing.py` section 15 gained: a check that `zv_koop_maandelijks_by_fk` matches
  the generated config, and that both templates actually render the new snippet once each
  (into `true_month_cents`), not just define an unused map.

## No per-line note

`fix/remove-cart-overzicht-notes-2026-11-02` landed the same day and dropped every line type's
per-line recurring-cost note from both templates ("Loopt daarna door via SEPA-incasso.", the
Woning meta line, Overzicht's "Aantal: N") — only "Apparatuur, eenmalig" and the rider note
survived. This fix does **not** add a new "Plus €X,XX/mnd ..." note under a Koop line to match;
doing so right after that cleanup would reintroduce exactly the kind of per-line copy it just
removed, inconsistently (every other recurring cost lost its note that day, a Koop line would be
the only one that kept — or gained — one). The aggregate "Daarna" total is the one thing that
doc explicitly calls out as untouched and still authoritative, so that's the only number this
fix corrects.

## What's still open

Odoo's own month-4 billing of the koop service fee is unchanged and untouched by this — same
"out of scope here, Thijs/Alex to resolve in Odoo" status the config already states for
`koopMaandelijks`. This fix only makes the "Daarna" total stop hiding a figure it already knew.
