# Final-check bugs: investigation and plan (2026-10-14)

P-01 (Zakelijk + Kenniscentrum heading contrast), P-02 (Contact page), W-04 (cart).

This was an investigation only. No `.liquid`, `.css`, `.json` or `pricing.config.json` file was
changed for this doc. Nothing was pushed to a theme and no validation run was done. Every fix
below still needs your OK before a fix branch starts.

## Baseline

- Branch `docs/final-check-bugs-investigation-2026-10-14`, cut from `origin/main` at `f1c823b`
  (2026-10-14, after PR #131).
- **Live drift check:** `shopify theme pull` of live theme `188704719229` into this worktree
  showed only known noise. That is the one CSS selector line in `sections/legal-page.liquid` (the
  known 2026-10-12 drift), plus Shopify's header comment, `"settings": {}` objects and trailing
  commas in 10 JSON templates. **None of the files involved below (contact, zakelijk,
  kenniscentrum, cart, header, oplossingen) differs between live and main.** The pull was then
  discarded with `git checkout -- .`.
- **Open branches:** no unmerged remote branch touches `contact-page.liquid`,
  `zakelijk.liquid`, `zv-kc.css`, `zv-article.css`, `zv-cart.liquid`, `oplossingen.liquid`,
  `zv-header.liquid` or `zv-chrome.css`.
- **How "live" was measured:** Playwright (Chromium) against the password-protected storefront.
  It read `getComputedStyle` colors, used CDP `CSS.getMatchedStylesForNode` to find which rule
  actually sets `color`, and took screenshots. `window.Shopify.theme.id` was `188704719229` on
  every page. Contrast follows the WCAG 2.x formula: AA needs 4.5:1 for normal text, or 3:1 for
  text ≥ 24px, or ≥ 18.66px bold.
- **Cart test:** two throwaway carts were built on the store with `/cart/add.js`. No checkout and
  no order. See Item 3.
- **14 Oct page-hero fix:** `fix/page-hero-h1-contrast-sitewide-2026-10-14` **is merged**
  (PR #128, `df4fc76`). The Contact hero h1 now renders `rgb(255,255,255)` live. See Item 2a.

---

## ITEM 1 — P-01

Zakelijk + Kenniscentrum heading contrast.

**Short answer: these are two different bugs, not the same one.**

- **Zakelijk:** the main failure is the **"missing explicit color" bug**, the same pattern as
  Contact/Herroepen on 14 Oct. Two big headings render dark indigo on dark indigo (1.15:1). The
  `--belt` problem is there too, but only on small eyebrows.
- **Kenniscentrum:** every real heading (h1/h2/h3) passes. What fails is **small gold text:
  `--belt` eyebrows/tags and the gold CTA band's eyebrow and body**, plus one lede that loses a
  specificity fight. So for KC this is the `--belt` bug in its current, already-once-fixed form,
  plus two smaller things.

### Findings

#### 1.1 The `--belt` token was already darkened once (16 Sept), to `#9c6c08`, not `#8a5f08`

The premise that `--belt` is still `#b67e0a` (3.4–3.5:1) is out of date:

- `docs/robi-feedback-2026-09-11-audit.md:150-183` is where the original finding lives. It
  measured `#b67e0a` at 3.4–3.5:1 and `.pcard__sub` (`#8c84a6`) at 3.52:1. It says: **"Needs a
  design decision (darken `--belt` to something ≥4.5:1 on white/cream, e.g. closer to
  `#8a5f08`, and separately darken the muted-gray `.pcard__sub` token)"**. That is the only
  place `#8a5f08` appears in the repo. It is a suggestion inside a "needs a design decision"
  paragraph. Nothing records anyone approving it.
- **Commit `2a19d49`** (2026-09-16, "Fix WCAG contrast for --belt gold token and .pcard__sub")
  implemented a **different** value. It moved `--belt: #b67e0a → #9c6c08` in all 18 token
  definitions plus two hardcoded uses, and set `.pcard__sub` to `#797290`. It was merged as
  **PR #58** (`488809e`, 2026-09-16 14:35, merge committed by GitHub, author `thijs-enbition`).
- **So what was signed off?** Your GitHub account merged `#9c6c08` and `#797290`. That merge is
  the only sign-off on record, for those two values. **`#8a5f08` was never approved and never
  implemented.** I found no design note, no PR comment in the repo and no doc that chose
  `#9c6c08` deliberately. The commit message only says it "rais[es] gold text/label contrast to
  pass WCAG AA". That holds **against pure white only** (4.60:1). It does not hold on the cream
  and sand backgrounds the token actually sits on (table below).

All 18 current `--belt` definitions are `#9c6c08`. No `#b67e0a` text color remains. The only
`#b67e0a` left is the decorative `box-shadow` at `sections/hero-banner.liquid:175-176`, which the
16 Sept commit left alone on purpose. The `#9c6c08` value also appears 4 more times as a
literal or fallback:

| Location | Use |
|---|---|
| `sections/oplossingen.liquid:911` | `.vhero__eye { … color: #9c6c08; }` (hardcoded) |
| `sections/over-ons.liquid:277` | `var(--belt,#9c6c08)` fallback |
| `assets/zv-kc.css:590` | `.kc-dd-tag` `var(--belt, #9c6c08)` fallback |
| `assets/zv-kc.css:591` | `.kc-dd-arr` `var(--belt, #9c6c08)` fallback (icon, not text) |

`var(--belt` is used 81 times across 19 files.

#### 1.2 `#9c6c08` measured against the real backgrounds

| `--belt` value | white `#fff` | paper `#fffdf8` | cream `#fdfaf2` | band `#f4f0e6` | sand `#efe9d6` | sand-2 `#e6dfca` |
|---|---|---|---|---|---|---|
| `#b67e0a` (pre-16 Sept) | 3.51 | 3.46 | 3.37 | 3.09 | 2.89 | 2.64 |
| **`#9c6c08` (live now)** | **4.60** | **4.53** | **4.41** ✗ | **4.04** ✗ | **3.79** ✗ | 3.46 ✗ |
| `#8a5f08` (doc suggestion) | 5.64 | 5.55 | 5.41 | 4.96 | 4.65 | 4.24 ✗ |
| `#8c6107` (lightest same-hue that passes on sand) | — | — | — | — | 4.52 | — |

Live failures with `#9c6c08` on these two pages (all 11–13px, 800 weight, so the 4.5:1 rule
applies):

| Page | Element | Background | Ratio |
|---|---|---|---|
| Zakelijk | `.props-head .eyebrow` "Waarom Zo Veilig zakelijk" (`zakelijk.liquid:222`) | band `#f4f0e6` | 4.04 |
| Zakelijk | `.aud-head .eyebrow` "Voor wie" (`zakelijk.liquid:247`) | band `#f4f0e6` | 4.04 |
| Kenniscentrum | `.kc-hero .eyebrow` "Zo Veilig Kenniscentrum" (`zv-kc.css:166-168`) | hero card `rgba(253,250,242,.94)` ≈ cream | 4.41 |
| Kenniscentrum | 3 inline `style="color:var(--belt);"` eyebrows (`kc-hub.liquid:23,88,140`) and "Privacy-first · zonder camera's" | cream `#fdfaf2` | 4.41 |
| Kenniscentrum | 11 × `.kc-dd-tag` ("Pijler", "Gids", …) (`zv-kc.css:590`) | sand `#efe9d6` | **3.79** |
| KC articles | `.callbox.key h4`, `.summary h4` ("De kern in vier punten", "In het kort") | cream gradient | 4.41 |

`.pcard__sub` `#797290` (`oplossingen.liquid:965`) sits on `.pcard` with `--paper: #ffffff`
(`zv-chrome.css:18`), giving **4.54:1**. That passes, but only just. It would fail on cream
(4.36).

#### 1.3 Zakelijk: two headings have no `color` (the Contact bug, not the `--belt` bug)

Rules in effect (`sections/zakelijk.liquid`):

```css
/* :177  parent sets white, expecting the h1 to inherit it */
.zv-zakelijk .zhero { position:relative; overflow:hidden; color:#fff; … }
/* :184  no color */
.zv-zakelijk .zhc h1 { font-size:clamp(38px,5vw,68px); font-weight:900; letter-spacing:-.025em; line-height:1; margin-top:16px; text-wrap:balance; }

/* :262  parent sets white */
.zv-zakelijk .anchor { background:var(--indigo-deep); color:#fff; … }
/* :267  no color */
.zv-zakelijk .anchor h2 { font-size:clamp(26px,3vw,42px); font-weight:900; letter-spacing:-.02em; line-height:1.05; margin-top:13px; text-wrap:balance; }
```

CDP shows that the **only** rule setting `color` directly on either element is Dawn's
`assets/base.css:250-265`, `h1, h2, h3, h4, h5, .h0, .h1, .h2, .h3, .h4, .h5 { … color:
rgb(var(--color-foreground)); }`. A rule set on the element beats any inherited value, so
`.zhero`/`.anchor`'s `color:#fff` never reaches the heading.

| Element | Text | Computed color | Background | Ratio |
|---|---|---|---|---|
| `.zhc h1` (`zakelijk.liquid:21`) | "Bescherm uw bedrijf met de meldkamer die u al kent." | `#322469` | `#281c54` (`rgba(40,28,84,.94)` gradient over the skyline photo; that is its value at the h1's left edge) | **1.15** |
| `.anchor h2` (`zakelijk.liquid:149`) | "De meldkamer die niet slaapt, werkt nu ook voor u." | `#322469` | `#281c54` (solid `--indigo-deep`) | **1.15** |

Both were confirmed by screenshot: the headline is close to invisible. Every other Zakelijk
heading has an explicit color: `.lead h2` `:192`, `.props-head h2` `:223`, `.tech-head h2`
`:234`, `.bene h4` `:240`, `.aud-head h2` `:248`, `.aud-card h3` `:254`, `.lead-done h3` `:216`.
**The 14 Oct sitewide fix (PR #128) didn't catch these two**, because it only searched for
`.page-hero h1`. Zakelijk uses its own `.zhero`/`.zhc` and `.anchor` classes.

#### 1.4 Kenniscentrum: no heading has the missing-color bug

Every KC heading sets its own color:

- `.kc-hero h1`: `color: var(--indigo)` (`zv-kc.css:169-178`) on the cream card, **12.65:1**.
- `.sec-head h2`: `color:var(--indigo)` (`zv-kc.css:349`).
- `.cluster h2`: `color:#fff` (`:440`).
- `.cta-band h2`: `#3a2a06` (`:320-327`).
- `.mz-bridge h3`: `#fff` (`:260-263`).
- `.ka-lead h3`: `#fff` (`:514`).
- `.topic-card h3`, `.art-body h3`, `.mon-card h3`, `.case-card h3`: all `var(--indigo)`.
- Article hero: `.zv-article .page-hero h1 {color:var(--indigo)}` (`zv-article.css:163`) at
  specificity (0,2,1) beats the shared `.page-hero h1 {color:#fff}` that PR #128 added
  (0,1,1). It renders `#322469` on `#fffdf8`, **12.98:1**.

All white-on-dark KC headings were checked visually (screenshots of `.ka-lead`, `.mz-bridge`,
`.cluster`) and read fine.

Two KC contrast failures that are **not** `--belt`:

1. **`.cluster .lede` loses a specificity fight.** "Inbraak is geen kwestie van pech maar van
   kans…" in the dark "Veiligheid & inbraakpreventie" block:
   - `zv-kc.css:441` sets `.cluster .lede{color:#cdc6e8;}`, specificity (0,2,0).
   - `zv-kc.css:350` sets `.sec-head p.lede{…color:var(--muted);…}`, specificity (0,2,1), and
     wins.
   - Live computed color is `rgb(111,103,134)` = `#6f6786` on `~#281c54`: **2.86:1** (15.5px,
     needs 4.5). The intended `#cdc6e8` would give ~9.3:1.
2. **Gold CTA band** (`.cta-band`, `zv-kc.css:302-334`; the same CSS sits in
   `zv-article.css:141-148` for articles). The background is
   `linear-gradient(120deg, #e4a311 → #f5c84a)`. Measured at the darker end, `#e4a311`:

   | Element | Color | on `#e4a311` | on `#f5c84a` | Needs |
   |---|---|---|---|---|
   | `.cta-band .eyebrow` (12px/800) | `#7a560a` | **3.02** | 4.19 | 4.5 |
   | `.cta-band p` (15.5px/600) | `#5c4410` | **4.17** | 5.78 | 4.5 |
   | `.cta-band h2` (34px/900) | `#3a2a06` | 6.31 | — | 3 |

### Proposed fix

**1a — Zakelijk headings (clear fix, same pattern as PR #128).** Add an explicit color to the
two rules in `sections/zakelijk.liquid`:

```css
.zv-zakelijk .zhc h1 { color:#fff; font-size:clamp(38px,5vw,68px); … }      /* :184 */
.zv-zakelijk .anchor h2 { color:#fff; font-size:clamp(26px,3vw,42px); … }   /* :267 */
```

Result: `#fff` on `#281c54` = **15.17:1**. I checked this by injecting the CSS into the live page:
both computed `rgb(255,255,255)`. Use `#fff` rather than `var(--zv-heading-on-dark)` to match the
other 7 rules PR #128 changed.

**1b — `--belt` (needs your decision: it's a brand color).** The 16 Sept value `#9c6c08` passes
only on pure white. Options:

| Option | Value | Lowest ratio on the backgrounds found | Notes |
|---|---|---|---|
| A (recommended) | **`#8a5f08`** | 4.65 (sand) · 4.96 (band) · 5.41 (cream) | The value the 11 Sept audit suggested. Passes on every background measured on these pages. Visibly browner. |
| B | `#8c6107` | 4.52 (sand) | The lightest same-hue gold that passes on sand. No margin at all. |
| C | keep `#9c6c08`, override only where it fails | — | Darker per-element colors on band/sand/cream. Lots of one-offs, and the next new section reintroduces the bug. |

Whichever value you pick, change all **18 `--belt:` definitions plus the 4 literals/fallbacks
listed in 1.1**. Otherwise the fallbacks drift. Neither A nor B passes on sand-2 `#e6dfca`. No
`--belt` text was found on sand-2 on these pages, but a sitewide sweep should check the other
pages before calling it done. This will not be visually identical to today, so it needs your
(or Robi's) OK on the color itself.

**1c — KC `.cluster .lede` (clear fix).** Raise the specificity so the intended color wins. In
`assets/zv-kc.css:441`:

```css
.cluster .sec-head p.lede{color:#cdc6e8;}
```

Result: ~9.3:1.

**1d — Gold CTA band (clear fix, both files).** In `zv-kc.css` and `zv-article.css`:
- `.cta-band .eyebrow` `#7a560a → #4f3a0a` (4.92 on `#e4a311`).
- `.cta-band p` `#5c4410 → #4a3608` (5.24 on `#e4a311`).

The h2 already passes. Both new values stay in the band's brown family.

---

## ITEM 2 — P-02

Contact: heading contrast, opening-hours overlap, "Nu bereikbaar".

All three are in `sections/contact-page.liquid`. They have **different causes**, except that 2a
and the Zakelijk bug share one.

### Findings

#### 2a. Heading contrast: the hero h1 is fixed, but a second Contact heading has the same bug

- **Hero h1, fixed and live.** `contact-page.liquid:99` now reads
  `.zv-contact .page-hero h1 { color:#fff; … }`, merged in PR #128 (`f56fbae`). Live computed
  color is `rgb(255,255,255)` on the `#2c3076→#241c54` gradient, which is **15.3:1**. The 14 Oct
  finding no longer applies to the h1.
- **Still broken: the "Meldkamer & klantenservice" h3** in the dark opening-hours box:

  ```css
  /* :139  parent sets white */
  .zv-contact .cn-hours { background:var(--indigo-deep); color:#fff; border-radius:16px; padding:22px; }
  /* :140  no color */
  .zv-contact .cn-hours h3 { font-size:15px; font-weight:900; letter-spacing:.01em; }
  ```

  This is the same mechanism. CDP shows the only rule setting its color is Dawn's
  `h1, h2, h3, h4, h5, … { color: rgb(var(--color-foreground)) }`. Computed `#322469` on
  `#281c54` = **1.15:1** (15px, needs 4.5). The screenshot shows it is close to invisible. The
  other Contact h3s (`.cn-opt h3`, `:135`) set `color:var(--indigo)` on a light card and are
  fine.

#### 2b. Opening-hours overlap

The prompt's grep (`openingstijden|opening.*hours|08:30|8:30`) finds no hours string in this
file, because the markup uses dots: `08.30`. The box is a single line of markup at
`contact-page.liquid:78`:

```html
<div class="cn-hours"><h3>Meldkamer &amp; klantenservice</h3><ul><li><span>Klantenservice</span><b>ma t/m do 08.30–17.00 uur, vr 08.30–13.00 uur</b></li><li><span>Meldkamer</span><b>24 uur, 7 dagen</b></li></ul><span class="now"><i></i>Nu bereikbaar</span></div>
```

CSS (`:141-143`):

```css
.zv-contact .cn-hours ul { list-style:none; margin-top:14px; display:flex; flex-direction:column; gap:9px; }
.zv-contact .cn-hours li { display:flex; justify-content:space-between; font-size:14px; font-weight:600; color:#d8d2ef; border-bottom:1px solid rgba(255,255,255,.12); padding-bottom:9px; }
.zv-contact .cn-hours li b { color:#fff; font-weight:800; }
```

The cause is three things together, measured live:

1. **No `gap` on the `li`.** The label and the hours touch. The gap between `span` and `b` is
   **0px** at 1440, 1280, 1024, 901 and 390px viewports. On screen it reads
   "Klantenservice**ma t/m do** 08.30…", as if it were one word.
2. **The hours string is too long for the column**, so `<b>` wraps to 2 lines (42px tall) at
   every width except 768px. There the grid has gone single-column (`@media(max-width:900px)`)
   and the box is 629px wide. The wrapped text is left-aligned inside a right-pushed box, so the
   second line ("08.30–13.00 uur") starts under the middle of the first line.
3. **The browser's default `ul` padding is never reset.** `list-style:none` hides the bullets,
   but `padding-inline-start: 40px` (user-agent stylesheet, confirmed by CDP) stays. The list
   sits 40px to the right of the h3 and loses 40px of width, which causes the wrap in (2).

Nothing overlaps in the strict sense: no absolute positioning, no negative margins, no z-index.
The "overlap" is two text runs fused together with no space, plus a ragged wrap.

#### 2c. "Nu bereikbaar": hardcoded, always shown

- It is a static `<span class="now"><i></i>Nu bereikbaar</span>` at `contact-page.liquid:78`.
  Its only CSS is `:144-145`, a green dot plus `#c9f0d8` text.
- **No logic anywhere decides it.** The section's `{% javascript %}` block (`:148-249`) only
  handles the contact form (validate, POST to `capture-lead`). A sitewide grep for
  "bereikbaar" finds no other code that touches this label.
- So it says "Nu bereikbaar" at 03:00 on a Sunday too. **That is the bug.**
- **Which hours would it use?** There's nothing to check against yet. The hours are now
  consistent everywhere they appear (the earlier three-format inconsistency is resolved in
  substance):

  | Where | Text |
  |---|---|
  | `contact-page.liquid:76` (Bel ons direct) | ma t/m do 08.30–17.00 uur, vr 08.30–13.00 uur |
  | `contact-page.liquid:78` (hours box) | ma t/m do 08.30–17.00 uur, vr 08.30–13.00 uur |
  | `herroepen-page.liquid:72` | ma t/m do 08.30–17.00 uur, vr 08.30–13.00 uur |
  | `klantenservice.liquid:110` + schema default `:349` + `page.klantenservice.json:594` | Ma t/m do 08.30–17.00 uur, vr 08.30–13.00 uur. |
  | `page.klantenservice.json:172` (FAQ answer) | maandag tot en met donderdag tussen 8:30 en 17:00 uur of op vrijdag tussen 8:30 en 13:00 uur |

  Same hours (Mon–Thu 08:30–17:00, Fri 08:30–13:00) everywhere. Only the formatting differs:
  `08.30` vs `8:30` in the FAQ.
- **Side note, not part of P-02:** the contact form's "Voorkeur terugbelmoment" select offers
  "Avond (17:00 - 20:00)" (`contact-page.liquid:57`). That is outside the klantenservice hours
  above. It may be intended (an adviseur calling back, not klantenservice), but it's worth
  confirming.

### Proposed fix

**2a (clear fix).** At `contact-page.liquid:140`:

```css
.zv-contact .cn-hours h3 { color:#fff; font-size:15px; font-weight:900; letter-spacing:.01em; }
```

Result: 15.17:1. Verified by injected CSS: `rgb(255,255,255)`.

**2b (clear fix).** Two parts, CSS and markup. Change the CSS at `:141-143`:

```css
.zv-contact .cn-hours ul { list-style:none; padding:0; margin-top:14px; display:flex; flex-direction:column; gap:9px; }
.zv-contact .cn-hours li { display:flex; justify-content:space-between; gap:12px; … }
.zv-contact .cn-hours li span { flex:none; }
.zv-contact .cn-hours li b { color:#fff; font-weight:800; text-align:right; }
```

Then, in the markup at `:78`, break the hours into their two day ranges:
`<b>ma t/m do 08.30–17.00 uur<br>vr 08.30–13.00 uur</b>`.

The CSS alone was tested by injection. It gives a 12px gap at 1440, 901 and 390, and the hours
right-aligned on 2 lines. Without the `<br>`, the break still lands mid-range ("08.30–" /
"13.00 uur"), which is why the markup change is part of the fix.

**2c (needs your decision).** Options:

| Option | What | Trade-off |
|---|---|---|
| A (recommended) | **Small JS check** in the section's `{% javascript %}`. It computes the current Amsterdam time with `Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',…})`, so a visitor's own clock zone doesn't matter. In hours (Mon–Thu 08:30–17:00, Fri 08:30–13:00) it shows "Klantenservice nu bereikbaar" with the green dot. Outside hours it shows "Klantenservice gesloten · meldkamer 24/7 bereikbaar", with no green dot or a neutral one. The label stays hidden until the script runs, so no-JS visitors never see a false claim. | Holidays (Koningsdag, Christmas, …) aren't known, so it would claim "bereikbaar" on a closed holiday unless you give me a holiday list. Hours become a JS literal: put them in one place, in a `data-` attribute or a section setting, so they don't drift from the 5 copies above. |
| B | Relabel to something always true: "Meldkamer 24/7 bereikbaar". | No logic and no holiday problem. It no longer says anything about klantenservice. |
| C | Remove the label. | Simplest. Loses the reassurance cue. |

---

## ITEM 3 — W-04

Cart: 4 items instead of 2, the "ALL" label, inconsistent installation naming.

### Findings

#### 3.0 Real carts on the live store

Two throwaway carts were built with `/cart/add.js` and rendered on live `/cart`, Overzicht and
the Oplossingen drawer.

**Climax cart.** Beschermd ×3 was added; `zv-cart-guard` then added CL003 by itself, as
designed:

| Shopify line | product_type | qty | final | `/cart` eyebrow (CSS-uppercased) | `/cart` name | Overzicht eyebrow |
|---|---|---|---|---|---|---|
| CL003 `climax-instalatie` ("Climax Instalatie") | **`All`** | 1 | €99,00 | **ALL** | Eenmalige activatie en installatie | Installatie |
| LT-BES `langer-thuis-beschermd` | Beveiligingsabonnement | 3 | €59,94 | BEVEILIGINGSABONNEMENT | Beschermd | Beveiligingsabonnement |

- `/cart` header: **"4 artikelen"**, from 2 lines.
- Header cart badge: 4.

**NAMI cart.** Zeker ×3 with Woning "1 extra verdieping of 100 m²", N0008 ×3 and N0004 ×1:

| Shopify line | product_type | qty | final | `/cart` eyebrow | `/cart` name |
|---|---|---|---|---|---|
| N0004 `installatie-nami` ("Nami Installatie Locatie") | `NAMI` | 1 | €99,00 | **NAMI** | Installatie aan huis |
| N0008 `extra-etage-of-100m2` | NAMI_abonnementen | 3 | €6,00 | (none, own row) | Woning: 1 extra verdieping of 100 m² |
| N0002 `langer-thuis-zeker` | Beveiligingsabonnement | 3 | €37,44 | BEVEILIGINGSABONNEMENT | Zeker |

- `/cart` header: **"7 artikelen"**, from 3 lines. Header badge: 7.
- The Oplossingen drawer, for the same cart, says **"2 items in winkelwagen"**. Its rows:
  - "Installatie aan huis **€99,00/mnd**"
  - "Langer Thuis · Zeker €28,95/mnd"

Product types for every cart-relevant product (live `/products/<handle>.js`):

| Handle | SKU | type |
|---|---|---|
| `geen-installatie-nami` | N0006 | NAMI |
| `telefonische-ondersteuning-installatie-nami` | N0005 | NAMI |
| `installatie-nami` | N0004 | NAMI |
| `climax-instalatie` | CL003 | All |
| `extra-etage-of-100m2` | N0008 | NAMI_abonnementen |
| `koop-video-deurbel-750` | ADC-750 | ADC_VIDEO_DEVICES |
| `huur-afstandsbediening` | H0010 | Huur Componenten |
| `ontzorgpakket-inzicht` | MOIOH | (empty) |

These types are Odoo's product categories, synced into Shopify. "All" is Odoo's default
category.

#### 3.1 "ALL": where it renders

The prompt's grep for a literal `ALL` in `sections/zv-cart.liquid snippets/zv-cart*.liquid`
returns nothing. The text is not in the theme. It is **`item.product.type` printed raw and
uppercased by CSS**:

```liquid
{%- comment -%} sections/zv-cart.liquid:165 {%- endcomment -%}
{%- if is_addon -%}<span class="ci-line">Uitbreiding</span>{%- elsif item.product.type != blank -%}<span class="ci-line">{{ item.product.type | escape }}</span>{%- endif -%}
```

```css
/* :322 */
.zv-cart .ci-line { font-size:11.5px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; color:var(--belt); }
```

`/cart` already computes `is_install` two lines earlier (`:152-153`: CL003 plus the three NAMI
variant ids) but never uses it for the eyebrow.

**Overzicht already fixed exactly this on 2026-09-24** (`5ab1ede`, "fix(overzicht):
installation lines read 'Installatie'"). `zv-checkout-overview.liquid:474-479` reads:

```liquid
{%- comment -%} Installation lines (CL003 and the 3 NAMI options) always read "Installatie": Odoo sets their product type (e.g. "All"), which isn't customer copy. {%- endcomment -%}
…
{%- if ovi_is_install -%}<span class="ovi-line">Installatie</span>{%- elsif ovi_is_addon -%}<span class="ovi-line">Uitbreiding</span>{%- elsif item.product.type != blank -%}<span class="ovi-line">{{ item.product.type | escape }}</span>{%- endif -%}
```

The fix was never ported to `/cart`. The same raw-type fallback means the package line shows
"BEVEILIGINGSABONNEMENT" on both pages. That is correct, but it is also Odoo/admin data, not
designed copy.

#### 3.2 "4 items instead of 2": it counts quantities, not lines

There is no phantom line. Every surface that shows a count uses **`cart.item_count`, which is
the sum of quantities**. A package is always 3 units (the prepaid months, by design since
2026-09-23), so a 2-line Climax cart is 3 + 1 = 4. A NAMI cart with one Woning floor is
3 + 3 + 1 = 7.

| Surface | Code | Counts |
|---|---|---|
| `/cart` header "N artikelen" | `zv-cart.liquid:113` `{{ cart.item_count }} … artikelen` | quantities |
| Header badge (server) | `zv-header.liquid:66,68` | quantities |
| Header badge (JS sync) | `zv-header.liquid:187,191` `syncCartDot(cart.item_count)` | quantities |
| Header badge (Oplossingen JS) | `oplossingen.liquid:1468` `updateCartCount` | quantities |
| Oplossingen drawer "N items in winkelwagen" | `oplossingen.liquid:1920-1923` `items.length` after filtering out Woning and add-on lines | **lines** |

The same cart therefore reads "2 items" in the drawer, "7 artikelen" on `/cart` and "7" on the
badge.

Answers to the questions in the brief:

- **Does the activation-fee auto-add make a visible line?** Yes. `zv-cart-guard` adds CL003
  (qty 1) to a Climax cart, and it's a real €99 charge, so it should stay a visible line. It
  adds **1** to the count, not 2. The other 3 come from the package's quantity.
- **Does N0008 count as its own item?** Yes. It shows as its own row on `/cart`
  (`zv-cart.liquid:124-140`) and Overzicht, and adds **3 per floor** to `item_count`. The drawer
  hides it (`oplossingen.liquid:1920`). The package row on `/cart` *also* shows the same
  surcharge as meta ("Woning: … (+€4/mnd)", `zv-cart.liquid:169-178`), so the Woning appears
  twice.
- **Do add-ons count?** Videodeurbel, Afstandsbediening and Ontzorgpakket lines sit at qty 3
  (same mechanic), so each adds 3 to `item_count`. They render as their own row on `/cart` with
  eyebrow "Uitbreiding", and are hidden from the drawer. I couldn't build a cart with
  ADC-750/H0010 live: both are `available: false` today.

#### 3.3 Installation naming

The prompt's SKU grep (`N0004|N0005|N0006|CL003` in `zv-cart.liquid snippets/*.liquid`) only
finds comments in `zv-cart-guard.liquid` and the generated `zv-pricing.liquid`. **No cart
template matches on SKU.** Names resolve by handle through `snippets/zv-install-name.liquid`
from `zv_install_names_by_handle` (`zv-pricing.liquid:28`), generated from
`pricing.config.json`:

| SKU | Shopify title (shown at Shopify checkout and in order e-mails, intended) | Theme name (`/cart`, Overzicht, drawer, GA4) | `/cart` eyebrow | Overzicht eyebrow |
|---|---|---|---|---|
| CL003 | Climax Instalatie | **Eenmalige activatie en installatie** (`activation.label`) | **ALL** | Installatie |
| N0004 | Nami Installatie Locatie | **Installatie aan huis** | **NAMI** | Installatie |
| N0005 | Nami Instalatie Telefoon | **Telefonische ondersteuning** | **NAMI** | Installatie |
| N0006 | Nami Geen Installatie | **Geen installatie** (a €0,00 line) | **NAMI** | Installatie |

So the inconsistency has two layers:

1. **Eyebrow:** `/cart` shows "ALL" for Climax and "NAMI" for NAMI. Overzicht shows
   "Installatie" for all four.
2. **Name:** the same €99 on-site installation is "Eenmalige activatie en installatie" for
   Climax and "Installatie aan huis" for NAMI. "Telefonische ondersteuning" doesn't say it's an
   installation choice.

Shopify checkout and order e-mails show the Shopify titles, including the "Instalatie" typos.
That's intended per CLAUDE.md (Thijs, 2026-09-23) and the theme can't change it.

#### 3.4 Drawer bug found on the way: an installation line shows "/mnd"

`oplossingen.liquid:1834` sets `isActivation = String(it.variant_id) === String(activationVariantId)`,
which matches **only CL003**. A NAMI install line (N0004/5/6) is in the cart once the customer
has picked one on Overzicht and then gone back to Oplossingen. That line takes the package path:
it gets the "/mnd" suffix (`:1848`) and an empty line-options slot. Live: "Installatie aan huis
**€99,00/mnd**". That's a wrong price claim, so it's worth fixing with W-04.

### Proposed fix

**3a — eyebrow (clear fix).** Port Overzicht's rule to `zv-cart.liquid:165` using the existing
`is_install`:

```liquid
{%- if is_install -%}<span class="ci-line">Installatie</span>{%- elsif is_addon -%}<span class="ci-line">Uitbreiding</span>{%- elsif item.product.type != blank -%}<span class="ci-line">{{ item.product.type | escape }}</span>{%- endif -%}
```

The same reasoning argues for showing **"Abonnement"** instead of the raw
"Beveiligingsabonnement" type on package lines (`is_sub`), on both `/cart` and Overzicht. Then
no Odoo category text reaches the customer. That part is optional copy; your call.

**3b — count (needs your decision on what a "count" means).** Separate lines are correct:
package, installation, Woning and add-ons are all real charges, and Odoo needs them as separate
order lines. **Nothing should be merged in the cart itself.** Only the number shown needs to
change. Options:

| Option | Climax cart | NAMI + Woning | Notes |
|---|---|---|---|
| A (recommended) | **Count lines, excluding the Woning line**, on all four surfaces | 2 | 2 | Matches the drawer's definition (except add-ons). Woning is a per-package attribute already shown on the package row. In Liquid: a loop over `cart.items` that skips `woning_variant_id`. In both JS badge syncs: `cart.items.filter(not N0008).length`. |
| B | Count packages only ("1 pakket") | 1 | 1 | Simplest message for the customer. Installation/add-ons aren't "items" they chose. A badge of 1 after adding one package is intuitive. |
| C | Count every line (`cart.items.size`) | 2 | 3 | Least code. The NAMI cart still shows a number the drawer disagrees with, unless the drawer changes too. |

With any option, the drawer, the `/cart` header, the server badge and both JS badge syncs must
share **one** definition. The aria-label "Winkelwagen, N artikelen" (`zv-header.liquid:66,182`;
`oplossingen.liquid:1479`) should use the same N.

Related (decide with 3b): drop the duplicate Woning display. Either keep the separate Woning
row and remove the "Woning: … (+€4/mnd)" meta from the package row, or the reverse. Today
`/cart` shows both.

**3c — installation naming (needs your decision: it's config copy).** All names live in
`pricing/pricing.config.json`: `activation.label` and `installationOptions.nami.options[].label`.
After an edit, run `build_pricing.py` and `check_pricing.py`. That keeps `/cart`, Overzicht,
the drawer and GA4 `item_name` in step automatically. Options:

| Option | CL003 | N0004 | N0005 | N0006 |
|---|---|---|---|---|
| A (recommended): eyebrow "Installatie" (3a) + names that describe the choice | Installatie aan huis | Installatie aan huis | Telefonische installatiehulp | Zelf installeren |
| B: one fixed label | Installatie | Installatie | Installatie | Installatie |
| C: only fix the eyebrow (3a), keep names | (unchanged) | | | |

B makes it impossible to tell the three NAMI choices apart in the cart, and they cost €0, €35
and €99. A gives one consistent pattern ("Installatie" eyebrow, then what kind) and makes CL003
and N0004 read the same, since they are the same service at the same price. **Watch out:**
`activation.label` feeds two generated values. One is `zv_install_names_by_handle` (the
CL003 name on `/cart`, Overzicht, the drawer and GA4). The other is `zv_label_activation`,
used for Overzicht's breakdown row (`zv-checkout-overview.liquid:599`). Renaming it changes
both, which is what option A wants. Re-check with `check_pricing.py` afterwards.

**3d — drawer "/mnd" (clear fix).** In `oplossingen.liquid` `cartRowHtml`, treat all four
installation variants as one-off, not just CL003. Pass the three NAMI install variant ids into
the script the way `activationVariantId` is passed, and make `isActivation` an "is
installation" check against all four. Those lines then get no "/mnd", no line options and no
Woning control.

---

## Summary

| Item | Code | Confidence | Status |
|---|---|---|---|
| 1 | P-01 | **Zakelijk headings: clear fix. `--belt` value: needs your decision. KC lede + CTA band: clear fix** | Zakelijk is the *missing-color* bug, not `--belt`: `.zhc h1` and `.anchor h2` render 1.15:1 (live). Two lines fix it. KC headings all pass. KC fails on small `--belt` text, which is `#9c6c08` since PR #58 (16 Sept) and passes only on white (4.41 cream / 4.04 band / 3.79 sand). `#8a5f08` was a doc suggestion, never approved or shipped. Also on KC: the `.cluster .lede` specificity bug (2.86:1) and the gold CTA band's eyebrow/body (3.02 / 4.17). |
| 2 | P-02 | **Heading + hours layout: clear fix. "Nu bereikbaar": needs your decision** | Hero h1 is fixed (PR #128, live). The `.cn-hours h3` has the same missing-color bug, 1.15:1. Hours "overlap" = no flex gap (0px) + an un-reset 40px `ul` padding + a long string wrapping. CSS + `<br>` fix verified by injection. "Nu bereikbaar" is a hardcoded `<span>` with no logic. Hours are now the same in all 5 places. |
| 3 | W-04 | **Eyebrow + drawer "/mnd": clear fix. Count definition + install names: needs your decision** | "ALL" = CL003's Odoo `product_type` "All", uppercased by CSS on `/cart` only. Overzicht fixed this 24 Sept (`5ab1ede`), never ported. "4 items" = `cart.item_count` sums quantities (package ×3 + install ×1); there's no phantom line. Live: Climax "4 artikelen", NAMI "7 artikelen", while the drawer says "2 items". Install names differ per SKU (CL003 vs N0004 for the same €99 service). Drawer also mislabels a NAMI install line "€99,00/mnd". |
