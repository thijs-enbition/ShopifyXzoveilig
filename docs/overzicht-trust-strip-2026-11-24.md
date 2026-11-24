# Overzicht: one-line Trustpilot mention (2026-11-24)

The full testimonials carousel (added to `templates/cart.overzicht.json` the same day, 25a29d3) is replaced by a
single line under the step bar and above the cost cards: five green stars, the score, "Uitstekend", the review
count and "beoordelingen op Trustpilot", linked to the Trustpilot page.

- It lives in `sections/zv-checkout-overview.liquid` itself (between the `.ovbar` section and the `<noscript>`),
  not in a separate template section: the step bar and the cost cards are one section, so nothing else can sit
  between them. It is outside the `cart.item_count > 0` block; an empty cart redirects to `/cart` anyway.
- Five `trust_*` settings under a "Trustpilot" header (score, stars, rating word, review count, link). The values equal the homepage's and
  zelf-samenstellen's `testimonials` section settings (4,7 / 5 stars / Uitstekend / 650). They are the section's
  schema defaults, so `cart.overzicht.json` is back to `"settings": {}` with only `main`.
- `templates/page.zelf-samenstellen.json` and `sections/testimonials.liquid` are untouched: the carousel stays there.
  Hidden when `trust_review_count` is empty; the link is dropped when `trust_url` is empty.

## Two things that bit

1. **Class names.** The section already has an `.ovtrust` class: the checkout trust-badge row under the CTA
   ("Beveiligde betaling", "SSL-versleuteld", "14 dagen retour"), styled by `.zv-overzicht .ovtrust span` and
   `.ovtrust svg`. A new element called `.ovtrust` would inherit those (the stars would become `inline-flex`, grey,
   12px) and any unscoped `.ovtrust` rule would restyle the badge row. The new strip is `.ovtp` / `.ovtp-stars`.
   Grep the section for a class before reusing a name in it.
2. **`url` settings can't carry an external default.** `{ "type": "url", "default": "https://..." }` passes
   `shopify theme check` but Shopify's real validator rejects the section ("default must be a string or datasource
   access path"), and the JSON template that references it fails with "does not refer to an existing section file".
   That is why `testimonials.liquid`'s `trustpilot_url` has no default and gets its value from the template JSON.
   Here `trust_url` is a `text` setting with the URL as its default, so the template can stay `settings: {}`.
   Caught only by pushing the whole tree to a disposable theme.

## Checked on a disposable theme (deleted afterwards)

`/cart?view=overzicht` with a package (A0071 x3) plus N0006: the strip renders 14px under the step bar and 40px
(desktop) / 18px (mobile) above the first cost card, 15px stars, `#00b67a` fill, no border/background/shadow; the
old `.ovtrust` badge row computes exactly as before; no `.reviews` / `#ervaringen` element and no "Wat onze klanten
zeggen" text; no horizontal overflow at 1440 or 390. At 390px wide the sentence wraps to two lines.
