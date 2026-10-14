# fix: final-check bugs batch (P-01, P-02, W-04)

Implements the decisions on `docs/final-check-bugs-plan-2026-10-14.md` (commit `1c1f821`; this
branch is cut from it, so the plan doc is included).

**Two items did not go exactly as briefed. Read these first:**

1. **"Nu bereikbaar" (Decision 2) was not implemented. I stopped as instructed.** There is a
   conflicting hours statement on the live site; see section 4.
2. **Decision 4's premise was off, so I kept two names, not one.** The telefonische/remote
   installation is **N0005 at €35**, not the €0 one. The €0 one is N0006, "Geen installatie".
   Only CL003 and N0004 now read "Installatie". See section 5.

## Baseline and validation

- Branch `fix/final-check-bugs-2026-10-14`, cut from `1c1f821` (= `origin/main` `f1c823b` + the
  plan doc).
- **Live drift:** `shopify theme pull` of live `188704719229` showed only the known noise (the
  `sections/legal-page.liquid` selector line, plus header comments and `settings: {}` in 10
  JSON templates). None of it is in a file this branch touches. The pull was discarded.
- **`python3 scripts/build_pricing.py`, then `python3 scripts/check_pricing.py`:** all checks
  pass (264 PASS). The generated files are reproducible: a rebuild gives no diff.
- **`shopify theme check --fail-level error`:** 0 errors.
  - Against the base, the only new warnings are `UndefinedObject` for `zv-pricing` variables
    used through `include`. That is the same, pre-existing pattern as `zv_activation_handle`
    and the rest.
  - Overzicht's LiquidComplexity went *down* (162 → 158).
- **Disposable theme:** the full branch was pushed to unpublished `zz-validate-final-check-bugs`
  (`#189704864125`). Everything was QA'd with Playwright against that theme. `Shopify.theme.id`
  was checked on every page. The theme was then deleted by id.
- **Console:** 0 theme console errors on `/pages/oplossingen`, `/cart`, Overzicht,
  `/pages/contact`, `/pages/kenniscentrum` and `/pages/zakelijk`. Same as live.

## 1. Clear fixes

| Fix | File | Change | Verified on the preview |
|---|---|---|---|
| Zakelijk hero h1 | `sections/zakelijk.liquid` (`.zhc h1`) | `color:#fff` | `rgb(255,255,255)` at 1440 and 390, was `#322469` on `#281c54` = 1.15:1, now 15.17:1 |
| Zakelijk "De meldkamer die niet slaapt" h2 | `sections/zakelijk.liquid` (`.anchor h2`) | `color:#fff` | same |
| KC "Veiligheid & inbraakpreventie" intro | `assets/zv-kc.css` | `.cluster .lede` → `.cluster .sec-head p.lede` (0,3,1), which now beats `.sec-head p.lede` (0,2,1) | `rgb(205,198,232)`, was `#6f6786` = 2.86:1, now ~9.3:1 |
| Contact "Meldkamer & klantenservice" h3 | `sections/contact-page.liquid` | `color:#fff` | `rgb(255,255,255)`, was 1.15:1 |
| Contact hours layout | `sections/contact-page.liquid` | `ul` `padding:0`; `li` `gap:12px`; `li span` `flex:none`; `li b` `text-align:right`; markup `…17.00 uur<br>vr 08.30…` | `ul` padding 0px (was 40px). Gap is 112px at 1440 and 23px at 390 (was 0). Hours on two right-aligned lines, one per day range. |
| `/cart` "ALL" eyebrow | `sections/zv-cart.liquid` | ported the 2026-09-24 Overzicht rule (`5ab1ede`): `is_install` → "Installatie" | All 4 installation SKUs read "INSTALLATIE" (was "ALL" for CL003, "NAMI" for N0004/5/6) |
| Drawer "/mnd" on installation | `sections/oplossingen.liquid` | `isActivation` now matches every installation handle (CL003, N0004, N0005, N0006), passed from `zv-pricing` in `data-install-handles`. Matching by handle needs no extra `all_products` lookups. | "Installatie €99,00" and "Telefonische ondersteuning €35,00", no "/mnd". Live showed "€99,00/mnd" **and "€35,00/mnd"**. |

"Find every place it renders with /mnd": I grepped every cart surface. `/cart` and Overzicht
already showed installation as a one-off. The Oplossingen drawer was the only place.

## 2. Decision 1: scoped gold overrides (`--belt` unchanged)

**`--belt` is still `#9c6c08` in all 18 definitions.** No new brand gold anywhere.

Every override is a locally scoped colour on one text context. Each value is the lightest shade
of the original hue that reaches 4.5:1 on the **measured** background. Backgrounds were measured
by hiding the text, screenshotting its box, and taking the darkest pixel, so gradients, the
semi-transparent hero card and the gold band count at their worst. The measurement covered
`/pages/kenniscentrum`, `/blogs/kenniscentrum` and all its articles, on live (before) and on the
preview (after).

Font-size or weight was not an option. These are 11–15.5px labels, and the 3:1 large-text rule
needs 18.66px bold or 24px.

New scoped tokens, each with a comment saying it is an AA override and not a brand colour:
- `--belt-on-cream: #996a08`, in the `.zv-kc` block (`assets/zv-kc.css`) and the `.zv-article`
  block (`assets/zv-article.css`).
- `--belt-on-sand: #8c6107`, in the `.zv-kc` block only.

| Surface | Where | Background (measured worst) | Before | After |
|---|---|---|---|---|
| Hub eyebrow "Voor iedereen met een vraag over veiligheid" | `kc-hub.liquid:23` inline style → `var(--belt-on-cream)` | `#fcf9f1` | `#9c6c08` **4.38** | `#996a08` **4.52** |
| Hub eyebrow "Onderwerpen" | `kc-hub.liquid:140` → `var(--belt-on-cream)` | `#fdfaf2` | **4.41** | **4.56** |
| Hub eyebrow "Privacy-first · zonder camera's" | `kc-hub.liquid:194` → `var(--belt-on-cream)` | `#fdfaf2` | **4.41** | **4.56** |
| Article callbox h4 ("Wat het oplevert", "De kern in vier punten", …) | `zv-article.css` `.callbox h4` (both copies of the rule) → `var(--belt-on-cream)` | `#fdfaf3`–`#fefbf5` gradient | **4.42–4.46** | **4.56–4.60** |
| Article summary h4 "In het kort" | `zv-article.css` `.summary h4` (both copies) → `var(--belt-on-cream)` | `#fefbf5` | **4.46** | **4.60** |
| Onderwerpen dropdown tags ("Pijler", "Gids", … ×11) | `zv-kc.css` `.kc-dd-tag` → `var(--belt-on-sand, #8c6107)` | sand `#efe9d6` | **3.79** | `#8c6107` **4.52** |
| KC hero eyebrow "Zo Veilig Kenniscentrum" | `zv-kc.css` `.kc-hero .eyebrow` → `var(--belt-on-sand)` | `#eeebe4` (card 94% opaque over the photo) | **3.87** | **4.61** |
| Gold CTA band eyebrow "Van kennis naar de juiste oplossing" (hub + 9 articles) | `.cta-band .eyebrow` in `zv-kc.css` and `zv-article.css` | `#e5a717`–`#e6a717` | `#7a560a` **3.12** | `#5b4007` **4.53–4.54** |
| Gold CTA band body text (hub + articles) | `.cta-band p` in both files | `#e6a819`–`#e6a91a` | `#5c4410` **4.36–4.39** | `#59410f` **4.56–4.60** |

Notes:
- The hero eyebrow's own minimum is `#8e6207` (4.52). It shares `--belt-on-sand` (`#8c6107`,
  4.61) to avoid a third near-identical value. The difference is 2/255 per channel.
- The CTA band colours were never `--belt`. They are the band's own brown text literals,
  darkened in place with a comment.
- **Unchanged because they already pass at `#9c6c08`:**
  - the hub eyebrows "Begin hier", "Meest gelezen" and "Praktijkverhalen" (4.53 on `#fffdf8`);
  - `.case-persona` ×7 (4.53);
  - the gold icons, which are graphics and need 3:1.
- **Not in this decision's scope, still failing:** the Zakelijk eyebrows "Waarom Zo Veilig
  zakelijk" and "Voor wie" are `#9c6c08` on the band `#f4f0e6`, **4.04:1** (plan doc
  §1.2). The brief limited Decision 1 to Kenniscentrum and the CTA band. The same pattern
  (`#926508` passes there) would fix them in a follow-up.

## 3. Decision 3: cart count is logical

**Rule implemented:** one per cart line. Every product group is exactly one line. The add flows
never add a package twice, `zv-cart-guard` removes duplicate package lines, and add-ons and
Woning each keep one shared line. So the line count is:

- each package = 1, regardless of its quantity 3;
- installation = 1;
- each add-on = 1;
- the Woning line = 1.

**Why Woning counts as 1:** it is chosen in the NAMI cards' **"Uitbreidingen"** accordion
(`oplossingen.liquid:477-488`), so it is an uitbreiding under the brief's rule. Its quantity
(3 per floor) never counts.

Changed in every place that showed a count:
- `/cart` header "N artikelen": `zv-cart.liquid`, `cart.item_count` → `cart.items.size`.
- Header badge and its aria-label, server-rendered: `zv-header.liquid`, `cart.items.size`.
- Header badge JS sync (page load + `cart:refresh`): `zv-header.liquid`, `cart.items.length`.
- Oplossingen badge sync, `updateCartCount`: `oplossingen.liquid`, `cart.items.length`.
- Oplossingen drawer "N items in winkelwagen": `oplossingen.liquid`, all lines. It used to
  count only the rows it shows, which left out Woning and add-ons.

The remaining `item_count` uses are empty-cart checks (`> 0` / `=== 0`), which mean the same
thing either way.

**Test scenarios** (real carts on the store via `/cart/add.js`; no checkout, no order):

| Scenario | Lines (SKU × qty) | Before (live): `/cart` / badge / drawer | After (preview): `/cart` / badge / drawer |
|---|---|---|---|
| A. Bare package + install (Climax Beschermd; the guard adds CL003) | CL003×1, LT-BES×3 | **4 artikelen** / 4 / n/a | **2 artikelen** / 2 / n/a |
| B. Package + install + 1 add-on (Inzicht + Installatie aan huis + Ontzorgpakket) | N0004×1, MOIOH×3, N0001×3 | **7 artikelen** / 7 / n/a | **3 artikelen** / 3 / n/a |
| C. NAMI + extra floor (Zeker, 1 extra verdieping, Installatie aan huis) | N0004×1, N0008×3, N0002×3 | **7 artikelen** / 7 / **2 items** | **3 artikelen** / 3 / **3 items** |
| D. (extra) NAMI + Telefonische ondersteuning | N0005×1, N0002×3 | **4 artikelen** / 4 / 2 items | **2 artikelen** / 2 / 2 items |

For B I used Ontzorgpakket because Videodeurbel (ADC-750) and Afstandsbediening (H0010) are
`available: false` on the store today, so no line can be added for them. They use the same
one-shared-line mechanic, so they count 1 each the same way.

**One visible consequence:** in scenario C the drawer now says "3 items" while it shows 2 rows.
The Woning sits inside the package row as a checkbox, and an add-on would sit inside the row the
same way. This follows the brief's counting rule.

## 4. Decision 2: "Nu bereikbaar". STOPPED: conflicting hours found

The brief said to confirm the five places still agree, and to stop and report rather than pick
one if a sixth or conflicting instance turned up. I re-scanned the theme, then fetched the live
HTML of all 43 storefront pages (sitemap plus the four policy pages, because admin-managed
content isn't in the repo).

**Conflict:** the live Shopify **shipping policy** (`/policies/shipping-policy`, edited in Shopify
Admin → Settings → Policies; not a theme file) says:

> **Vragen over jouw zending**
> Onze klantenservice is bereikbaar van **maandag tot en met vrijdag tussen 09:00 en 17:00 uur**:
> - Telefoon: 088 122 11 11
> - E-mail: klantenservice@zoveilig.nl

Every theme instance says **ma t/m do 08.30–17.00, vr 08.30–13.00**:
- `contact-page.liquid:76`
- `contact-page.liquid:78`
- `herroepen-page.liquid:72`
- `klantenservice.liquid:110` and `:349`, plus `page.klantenservice.json:594`
- the FAQ answer at `page.klantenservice.json:172`

The policy text also looks unfinished: it contains a "vanaf €⚠ [bedrag]" placeholder and uses
je-vorm. It is still customer-facing, because Shopify links its policies from checkout. Which
schedule is right is your call. The policy is fixed in Shopify Admin, not in this repo.

Not conflicts, for the record:
- "Belt u na 16:00 uur…" and "technische dienst 24 uur per dag bereikbaar voor urgente
  storingen" (`page.klantenservice.json:108`) are about the storingen line.
- "24 uur per dag telefonisch bereikbaar bij storingen" (`over-ons.liquid:182`) is also about
  the storingen line.
- The terms of service mention "onderhoud … op werkdagen tussen 08.00 en 17.00 uur", which is a
  maintenance window, not klantenservice hours.

**Ready to build once the hours are confirmed (not in this branch):**
- **Pattern: client-side JS in `contact-page.liquid`'s existing `{% javascript %}` block.** The
  theme has no time-of-day logic to match. The only "now" is `{{ 'now' | date: '%Y' }}` in the
  footers, and Liquid can't do this job: Shopify serves cached HTML, so a server-rendered
  open/closed state would be stale. The JS would read Amsterdam time with
  `Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', … })`, so a visitor's own clock
  zone doesn't matter. It would read the schedule from a `data-` attribute next to the visible
  hours text, so both get edited together. The label would stay hidden until the script runs,
  so no-JS visitors never see a false claim.
- **Proposed copy:**
  - Open: "Nu bereikbaar" (unchanged).
  - Closed: **"Klantenservice nu gesloten · weer bereikbaar {vandaag | morgen | maandag} vanaf
    08.30 uur"**, with a neutral grey dot instead of the green one. It says "Klantenservice"
    because the box also lists the 24/7 meldkamer, which is never closed.
  - Example: Friday 14:00 → "Klantenservice nu gesloten · weer bereikbaar maandag vanaf 08.30 uur".
- Known limitation: public holidays aren't known to the script unless you give me Zo Veilig's
  holiday closures.

The label itself is untouched on this branch: still the hardcoded "Nu bereikbaar".

## 5. Decision 4: installation naming

| SKU | Handle | Price | What it is | Cart name before | Cart name after |
|---|---|---|---|---|---|
| CL003 | `climax-instalatie` | €99 | Climax installation (Beschermd/Protect) | Eenmalige activatie en installatie | **Installatie** |
| N0004 | `installatie-nami` | €99 | NAMI installation at home | Installatie aan huis | **Installatie** |
| N0005 | `telefonische-ondersteuning-installatie-nami` | **€35** | **the telefonische/remote option** | Telefonische ondersteuning | Telefonische ondersteuning (kept) |
| N0006 | `geen-installatie-nami` | **€0** | no installation | Geen installatie | Geen installatie (kept) |

**Which SKU is the telefonische variant, and why:** N0005. Its handle, its config `id`
(`telefonisch`) and its label all say telephone support, and its price is €35 (live product
data and `pricing.config.json`). The brief's "the €0 one, likely N0006" points at a different
product: N0006 is **Geen installatie**, the customer choosing *no* installation.

The brief described the exception two ways ("telefonische/remote" and "the €0 one"), and these
turned out to be two different SKUs. So I kept both names:
- Keeping N0005 follows the explicit "telefonische" exception.
- Keeping N0006 avoids a false claim. Renaming it would show "Installatie €0,00" to a customer
  who chose no installation.

**How:** a new optional `cartName` field in `pricing.config.json`, set on `activation` and on
the NAMI `huis` option, with a `cartNameNote`. `build_pricing.py` prefers it over the label for
the cart-name map (`zv_install_names_by_handle` and `#zv-item-names`). Names stay config-driven
and `check_pricing.py` passes.

Where it shows:
- `/cart` rows and summary;
- Overzicht line rows;
- Overzicht breakdown. Those rows now use the same by-handle cart name instead of the four
  separate labels;
- the Oplossingen drawer.

Deliberately **not** renamed:
- **Overzicht's installation radio group and its "Installatie: <keuze> · €…" detail row.** Those
  are the customer's *choice*, and "Installatie / Telefonische ondersteuning / Geen
  installatie" alone wouldn't tell the €99 option apart.
- **Shopify checkout and order e-mails.** They show the Shopify product titles, as intended per
  CLAUDE.md.

**Side effect to know about:** GA4 `item_name` reads the same `#zv-item-names` map ("the name the
theme shows", by design). From now on it reports "Installatie" for both CL003 and N0004.
`item_id` is still the SKU, so reports can still split them.

## Files changed

- `sections/zakelijk.liquid`: 2 heading colours.
- `sections/contact-page.liquid`: h3 colour, hours CSS, hours `<br>`.
- `assets/zv-kc.css`: cluster lede specificity, `--belt-on-cream` / `--belt-on-sand`, hero
  eyebrow, dropdown tags, CTA band.
- `assets/zv-article.css`: `--belt-on-cream`, callbox/summary h4 (both rule copies), CTA band.
- `sections/kc-hub.liquid`: 3 inline eyebrow colours.
- `sections/zv-cart.liquid`: logical count, "Installatie" eyebrow.
- `sections/zv-header.liquid`: logical count (server + JS).
- `sections/oplossingen.liquid`: logical badge/drawer count, installation lines one-off in the
  drawer.
- `sections/zv-checkout-overview.liquid`: breakdown installation rows use the cart name.
- `pricing/pricing.config.json` + `scripts/build_pricing.py`: `cartName`.
- `snippets/zv-pricing.liquid`, `snippets/zv-item-names.liquid`: regenerated.
- `docs/final-check-bugs-2026-10-14.md`: this file.

## Open items for you

1. **Hours:** which schedule is right (theme: ma–do 08.30–17.00, vr 08.30–13.00; shipping
   policy: ma–vr 09.00–17.00)? Then fix the shipping policy in Shopify Admin (it also has the
   "€⚠ [bedrag]" placeholder and je-vorm). After that, Decision 2 can be built as described in
   section 4.
2. The Zakelijk eyebrows on the band are still 4.04:1 (outside Decision 1's scope).
