# fix: Veilig Onderweg launch copy, contact button text, wrong-tab links, VO pricing display

Branch `fix/final-check-decisions-2026-10-14`, built on the investigation branch
`docs/final-check-decisions-investigation-2026-10-14` (`616e022`,
`docs/final-check-decisions-plan-2026-10-14.md`). Thijs's decisions on that plan are all
applied below. V-02 needed no change (closed in the plan: zero hits).

## What changed

### S-07 / V-03: Veilig Onderweg launch date (firm wording)

The date is stated plainly: no "verwacht" or "naar verwachting" anywhere.

- **Oplossingen subnav tab** (`templates/page.oplossingen.json`, block `veilig_onderweg`,
  `sublabel`): "Binnenkort beschikbaar" → **"Beschikbaar eind 2026"**.
- **Line under the hero** (same block, `pak_sub`, the sub line of the package area directly
  below the hero): "Paniek Meldkamer en Zorgmeldkamer. Prijzen en specificaties volgen
  binnenkort." → **"Paniek Meldkamer en Zorgmeldkamer zijn eind 2026 beschikbaar. Prijzen en
  specificaties volgen nog."**
- **Hero button: deliberately untouched.** It still says "Keuzehulp" and links to
  `/#keuzehulp`. Its tracking is unchanged too (`data-zv-finder`, `book_advice`,
  `vind_uw_oplossing`, position `veilig-onderweg_hero`); verified on the preview theme.
- Also unchanged: the hero eyebrow "Veilig Onderweg". The coming-soon block keys on that
  text, so it must stay. Also the "Binnenkort beschikbaar" heading above the new line, the
  homepage badge and the Vergelijk "Prijzen volgen binnenkort" (plan A-3/A-6), so the date
  lives in one template.

### S-02: floating contact button (`snippets/zv-contact-fab.liquid`, the only source)

| Line | Element | Before | After |
|---|---|---|---|
| 18 | toggle `aria-label` | Contact opnemen met Zo Veilig | **Hoe kunnen wij u helpen?** |
| 22 | toggle label (visible) | Contact | **Hoe kunnen wij u helpen?** |
| 25 | open panel's heading | Hoe kunnen wij u helpen? | **Neem contact met ons op** |

- The `aria-label` now matches the visible label, so screen readers and voice control get
  the same words as on screen (WCAG 2.5.3, Label in Name).
- The panel heading changed because the button now carries its old text.
- The snippet is rendered once, from `layout/theme.liquid`, so this covers every storefront
  page.
- Nothing related to Odoo lead creation (ADR-004) was touched.

### Links that opened Oplossingen on the wrong tab

All three now go to `/pages/oplossingen#veilig-onderweg`. The existing hash deep-link opens
the Veilig Onderweg tab.

- **Footer** (`sections/zv-footer.liquid`, fallback links; the footer has no link-list menu
  set): `{% render 'zv-route', key: 'oplossingen' %}` + `#veilig-onderweg`.
- **Vergelijk pakketten**, "Bekijk Veilig Onderweg" (`sections/vergelijk-pakketten.liquid`):
  `{{ opl }}#veilig-onderweg`.
- **Site search** (`sections/zv-search.liquid`, the Veilig Onderweg entry):
  `/pages/oplossingen?cat=persoonlijk` → `/pages/oplossingen#veilig-onderweg`. Nothing on
  Oplossingen reads `?cat=`.

### €0,00 on the Veilig Onderweg product pages

**Cause: the products really have no price in Shopify yet. It's not a template bug.**

- Both variants (VO-SOLO, VO-GUARD) are priced **0.00** in Shopify (storefront
  `/products.json`, 2026-10-14).
- `pricing.config.json` marks both packages `PRICE_PENDING`, display "Prijs volgt",
  `purchasable: false`.
- Dawn's `snippets/price.liquid` just printed that 0.

No price was invented and no product was changed. The **display** is fixed instead:

- `snippets/price.liquid`: a product of type `Beveiligingsabonnement` (a package, see
  CLAUDE.md) with price 0 now shows **"Prijs volgt"**, the config's wording for
  `PRICE_PENDING`.
- This snippet renders the price on the product page, on collection and search cards and in
  predictive search, so all of those are covered.
- **Why the rule keys on the product type and not just on 0:**
  - Real €0 products have to keep their price: `geen-installatie-nami` (N0006, "Geen
    installatie") is still €0,00 on the preview theme.
  - The two unavailable €0 accessories (SD card, chime) aren't packages, so they're left
    as they were.
- The product pages were already not buyable: no add-to-cart button, only "Kies uw pakket".

`CLAUDE.md` (Product data) has one added sentence on this.

## Evaluated and intentionally left unchanged

- **Lio overlapping the wider contact button on phones narrower than ~420px.**
  - Measured in the investigation: the pill grows from 154 to 292px on phones.
  - When Lio (the bottom-right helper) pops up, its image covers the right end of the pill.
    On 390px that's the last ~30px, with the text just clear. On 320px Lio covers "helpen?".
  - Lio only shows for 4.2 s at funnel milestones and can be closed, so Thijs accepted it.
  - The drafted fix (hide the FAB while Lio is visible) was **not** added. This is a
    decision, not an oversight.
- **"hij" on the homepage** ("Voor wie" column, `templates/index.json`: "…ook als **hij** zelf
  niets kan doen"). Flagged in the investigation as gendered; Thijs declined the change, so
  the text is exactly as it was.

## Notes for review

- **Possible overlap with the open `fix/final-check-bugs-2026-10-14`:** it changes
  `oplossingen.liquid`, `zv-pricing.liquid` and `build_pricing.py`. This branch touches none
  of those; `page.oplossingen.json` is the only Oplossingen file here, so no conflict is
  expected.
- **Adjacent, not fixed here** (one concern per branch):
  - The footer "Mijn Thuis" link, Vergelijk "Bekijk Mijn Thuis" and the Langer Thuis / Mijn
    Thuis search entries (`?cat=living`, `?cat=security`) have the same wrong-tab problem.
    Mijn Thuis lands on Langer Thuis. Langer Thuis is the first tab, so it lands correctly
    by accident.
  - At 320px wide, every page scrolls sideways by 8px, caused by the header utility bar
    (`.u-r`) and the drawer logo. It happens on live too, so it isn't from this branch.

## Validation

- `python3 scripts/build_pricing.py`, then `python3 scripts/check_pricing.py`: **all checks
  passed**. The first run caught a literal "€0,00" in the new `price.liquid` comment; the
  comment was reworded.
- `git diff --exit-code` on the generated files (`pricing.generated.json`, `zv-pricing.liquid`,
  `zv-item-names.liquid`): unchanged.
- `shopify theme check --fail-level error`: exit 0, **no errors**. The only offense in a
  touched file is the old `include` deprecation warning in `vergelijk-pakketten.liquid`.
- Live drift: the six touched files were pulled from live theme `188704719229` before
  editing. All were identical to the branch base.
- Pushed to disposable unpublished theme `zz-validate-final-check-decisions` (`#189708042621`)
  and checked with Playwright on its preview (`Shopify.theme.id` confirmed). **No console
  errors** on the pages checked.
  - **Oplossingen `#veilig-onderweg`:**
    - Tabs: "Langer Thuis / Een dierbare thuis", "Mijn Thuis / Uw woning", "Veilig Onderweg /
      Beschikbaar eind 2026".
    - h3 "Binnenkort beschikbaar". Sub line exactly as above.
    - Hero button "Keuzehulp" → `/#keuzehulp`, with the same `data-zv-finder`,
      `vind_uw_oplossing` and `book_advice` attributes as before.
  - **Floating button:**
    - On desktop the label and the `aria-label` are both "Hoe kunnen wij u helpen?". It
      opens (`aria-expanded="true"`) with the heading "Neem contact met ons op" and the
      three unchanged links.
    - On 390 and 320px it's one line, 292px wide (16–308), and opens with the new heading.
  - **Links:**
    - The footer link, Vergelijk "Bekijk Veilig Onderweg" and the search result for "veilig
      onderweg" each land on `/pages/oplossingen#veilig-onderweg`.
    - In each case the Veilig Onderweg tab is selected and is the only visible panel.
    - "Bekijk Mijn Thuis" still goes to `/pages/oplossingen` (untouched).
  - **Prices:**
    - Both Veilig Onderweg product pages show "Prijs volgt"; both are on page 2 of
      `/collections/all`, also "Prijs volgt".
    - Controls are unchanged: Inzicht €19,95, Protect €37,95, Geen installatie €0,00, and
      SD card / chime €0,00.
- The disposable theme was deleted afterwards and is gone from `shopify theme list`.
- Not tested: real screen-reader output (only the accessible-name attribute was checked);
  iOS Safari and Android browsers (Chromium only).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
