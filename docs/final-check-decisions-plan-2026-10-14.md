# Final-check decisions — investigation and plan (2026-10-14)

Investigation only. No theme file was changed for this doc. Nothing was pushed to a theme and
no validation run was done. Every proposal below needs your OK before a fix branch starts.

## Baseline

- Branch `docs/final-check-decisions-investigation-2026-10-14`, cut from `origin/main` at
  `f1c823b` (2026-10-14, after PR #131).
- **Live drift check:** I didn't run `shopify theme pull` inside the worktree, because it
  writes over tracked files and this pass must not edit any. As in the last two passes, live
  theme `188704719229` was pulled into a scratch folder and compared with `origin/main` (JSON
  compared after parsing). The only differences are the known `sections/legal-page.liquid`
  selector line and some empty `settings: {}` objects in `password.json`, `article.json` and
  `product.json`. **None of the files named below has a live-only edit.**
- **Rendered check:** the storefront (behind the password) was fetched as HTML: home,
  `/pages/oplossingen`, `/vergelijk-pakketten`, `/klantenservice`, `/contact`, `/over-ons`,
  `/binnenkort`, `/zakelijk`, `/hoe-het-werkt`, `/kenniscentrum`, `/borg`, `/camera-hardware`,
  `/collections/all`, search, terms of service, all 12 Kenniscentrum articles and all 20
  products: **50 pages**. When this doc says "live", it means it was seen in that HTML.
- The floating button was measured in headless Chromium on the live theme by swapping the
  label text in the page's DOM only (nothing written to Shopify).

---

## ITEM — S-07 & V-03: Veilig Onderweg naming and launch messaging

### Findings

**Most of this is already done.** Veilig Onderweg can't be bought anywhere, every visible
mention uses the same name, and each surface already says it's coming. **The one thing
missing is the date:** "eind 2026" (or any date) appears nowhere on the site.

**A.1 Naming: already consistent.** Every customer-facing occurrence is **"Veilig Onderweg"**
(capital O). Lowercase forms only appear in handles and IDs (`veilig-onderweg`,
`veilig_onderweg`) and in the search index's keyword string, which isn't displayed. Checked in
the repo (case-insensitive) and in the visible text of all 50 live pages: zero "Veilig
onderweg" or other variants.

| Surface | File:line | Exact text |
|---|---|---|
| Header nav | Shopify menu `main-menu` (admin) | **Not in the header.** The header shows only the top-level links Home · Oplossingen · Kenniscentrum · Service · Over ons · BORG. `sections/zv-header.liquid:49-57` renders top-level links only, so there's no dropdown or submenu. |
| Oplossingen subnav tab (the "submenu") | `templates/page.oplossingen.json:85-86`, rendered by `sections/oplossingen.liquid:101` | **Veilig Onderweg** / sublabel **"Binnenkort beschikbaar"** (the other tabs: "Een dierbare thuis", "Uw woning"). The code calls this strip `oplossingen_subnav`. |
| Oplossingen hero | `page.oplossingen.json:85-92` | Eyebrow "Veilig Onderweg", h2 "Veilig, waar u ook bent.", bullets "GPS-paniekknop voor onderweg" · "Automatische valdetectie" · "Securitas-meldkamer inbegrepen", button "Keuzehulp" |
| Oplossingen package area | `oplossingen.liquid:182, 190`, `page.oplossingen.json:95` | h3 **"Binnenkort beschikbaar"** (hard-coded). Sub: "Paniek Meldkamer en Zorgmeldkamer. Prijzen en specificaties volgen binnenkort." Body: "Veilig Onderweg wordt een persoonlijk alarm voor onderweg en thuis: één druk op de knop of automatische valdetectie verbindt u met de meldkamer. We werken de precieze specificaties en prijzen nog uit." Then a "Blijf op de hoogte" signup form (`#veilig-onderweg-aanmelden`). |
| Oplossingen "Waarom" cards | `page.oplossingen.json:103-111` | "Veilig, ook buiten de deur" → "Blijf op de hoogte" (to the signup form); "Een val meldt zichzelf" → "Hoe valdetectie werkt" |
| Homepage bucket tile | `sections/feature-cards.liquid:58-64` (badge); title and body come from a metaobject (admin) | Badge **"Binnenkort beschikbaar"**, muted style. "03 Veilig Onderweg" / "Ga met een gerust gevoel op pad. …" / "Bekijk persoonlijke veiligheid", links to `/pages/oplossingen#veilig-onderweg` (PR #120, 2026-10-13. On 14 Sept it was a disabled tile.) |
| Homepage "Voor wie" column | `templates/index.json:77-81` | "Veilig Onderweg": "Paniek Meldkamer" / "Zorgmeldkamer" |
| Vergelijk pakketten card | `sections/vergelijk-pakketten.liquid:79-84` | "Veilig Onderweg" / "Persoonlijke alarmering, waar u ook bent" / "**Prijzen volgen binnenkort**" / "Bekijk Veilig Onderweg" |
| Keuzehulp (finder) | `assets/zv-finder.js:35-36, 42, 80, 85` | segment "Veilig Onderweg", results "Paniek Meldkamer" / "Zorgmeldkamer", sub "**Prijs en specs volgen**", links to the tab (PR #123) |
| Footer | `sections/zv-footer.liquid:48` | "Veilig Onderweg" |
| Over ons | `sections/over-ons.liquid:81` | "**Veilig Onderweg.** Persoonlijke veiligheid met directe hulp …" |
| Contact form option | `sections/contact-page.liquid:47` | "Veilig Onderweg (personenalarm)" |
| Site search | `sections/zv-search.liquid:48` | "Veilig Onderweg" |
| Product pages | Shopify admin | "Veilig Onderweg Paniek Meldkamer", "Veilig Onderweg Zorgmeldkamer" |

**A.2 Not purchasable: confirmed.**

- The Oplossingen tab shows the coming-soon block instead of package cards
  (`oplossingen.liquid:178-205`).
- Both product pages render **without** an add-to-cart button. Their only button is
  "Kies uw pakket", which goes to `/pages/oplossingen?pakket=liogo_solo`.
- The finder shows "Prijs volgt".

**A.3 Submenu label: already "Binnenkort beschikbaar"**, at `page.oplossingen.json:86`. It is
a theme-editor setting (block "veilig_onderweg" → "Tab-subtekst").

**A.4 Hero CTA: live, not disabled, not dead, but generic.** `oplossingen.liquid:152` renders
`hero_cta_label` / `hero_cta_url` from `page.oplossingen.json:91-92`:

- It says **"Keuzehulp"** and links to **`/#keuzehulp`**, which leaves for the homepage quiz.
  It's identical to the Langer Thuis and Mijn Thuis tabs.
- The Liquid hard-codes the tracking on that link (`data-zv-finder`,
  `data-cta-name="vind_uw_oplossing"`). A click is tracked as the start of the product finder.
- The hero itself has nothing that says "coming soon". The tab above it and the h3 below it
  do. The bullets are in the present tense ("Securitas-meldkamer inbegrepen").

**A.5 Date phrasing on the site: no convention exists.** I searched every `.liquid`, `.json`
and `.js` file for "eind/begin/medio 202x", "in 2026/2027", "voorjaar", "najaar", "kwartaal"
and "Qx 202x": **zero hits**. The Binnenkort page (`templates/page.binnenkort.liquid:68-75`)
uses "Binnenkort online" / "Langer veilig thuis. Bijna live." and a countdown, with no
written date. The "not yet" wording the site already uses:

- "Binnenkort beschikbaar" (tab, heading, homepage badge)
- "Prijzen volgen binnenkort"
- "Prijs volgt"
- "Prijs en specs volgen"
- "We werken … nog uit"

**A.6 Constraint for any change:** the coming-soon block switches on when
`b.settings.eyebrow contains 'Onderweg'` (`oplossingen.liquid:178`). **Don't change the hero
eyebrow text.** Changing it would bring back the (empty) package grid.

### Proposed fix

I'd put the date in **two places on Oplossingen**: the tab directly above the hero, and the
line directly below it. I'd leave the homepage badge and the Vergelijk card as "binnenkort",
so the date only has to be updated in one template if it slips. I'd also use the hedged
form **"verwacht" / "naar verwachting"**, because the product has no price or specs yet.
If you want it firm, swap in "Beschikbaar eind 2026" / "zijn eind 2026 beschikbaar".

| # | Where | Now | Proposed | Type of edit |
|---|---|---|---|---|
| A-1 | Subnav tab sublabel, `templates/page.oplossingen.json:86` | Binnenkort beschikbaar | **Verwacht eind 2026** | JSON / theme editor. It's 18 characters against 22 now, so the tab gets narrower, not wider. |
| A-2 | Package-area sub line, `templates/page.oplossingen.json:95` | Paniek Meldkamer en Zorgmeldkamer. Prijzen en specificaties volgen binnenkort. | **Paniek Meldkamer en Zorgmeldkamer zijn naar verwachting eind 2026 beschikbaar. Prijzen en specificaties volgen nog.** | JSON / theme editor |
| A-3 | h3 above it, `sections/oplossingen.liquid:182` | Binnenkort beschikbaar | **No change.** It matches the homepage badge, and the date sits in the line right under it. | None |
| A-4 | Hero button, `page.oplossingen.json:91-92` + `oplossingen.liquid:152` | "Keuzehulp" → `/#keuzehulp` | **Optional (needs you):** "**Blijf op de hoogte**" → `/pages/oplossingen#veilig-onderweg-aanmelden`, the same target the "Waarom" card already uses. It works in-page because the Onderweg panel is open when the hero is visible. The label/URL change is JSON only, **but** `:152` would keep tracking the click as a finder start. A clean version needs a small Liquid change that adds `data-zv-finder` / `vind_uw_oplossing` only when the URL is the Keuzehulp. If you'd rather not touch Liquid, leave the button as "Keuzehulp". | JSON + small Liquid |
| A-5 | Hero headline / bullets | (see A.4) | **No change.** The only field-only way to get the date *inside* the hero is a 4th bullet, and that gets a check-mark icon and reads like a feature. Not recommended. | None |
| A-6 | Homepage badge `feature-cards.liquid:64`; Vergelijk `vergelijk-pakketten.liquid:83` | Binnenkort beschikbaar; Prijzen volgen binnenkort | **No change** (see above). If you do want the date there too: badge "Verwacht eind 2026"; Vergelijk "Verwacht eind 2026, prijzen volgen". | (Liquid, if wanted) |

A-1 and A-2 are template settings, so they can also be made in the theme editor. Whoever
does it, make the change in the repo too, or the next push overwrites it.

### Adjacent findings (not fixed, for a later branch)

- **Links into Oplossingen without an anchor**, so they open on the Langer Thuis tab instead
  of Veilig Onderweg:
  - footer "Veilig Onderweg" (`sections/zv-footer.liquid:48`, same for Langer Thuis / Mijn
    Thuis on `:46-47`);
  - Vergelijk "Bekijk Veilig Onderweg" (`sections/vergelijk-pakketten.liquid:84`, `opl` set
    on `:22`).
- **Site-search results use `?cat=…`** (`sections/zv-search.liquid:48`, e.g.
  `/pages/oplossingen?cat=persoonlijk`). Nothing on Oplossingen reads `cat` (only `#hash` and
  `?pakket=`), so they all land on the first tab.
- **`templates/index.json:81`:** "voor wie ook geholpen wil worden bij een val, ook als **hij**
  zelf niets kan doen". The gendered "hij" could be "ook als u zelf niets kunt doen" or
  "ook als men zelf …".
- **`sections/feature-cards.liquid:196`:** the schema *default* still has the old tiers
  "Alarm / Locatie / Beschermd". It isn't rendered (`index.json` overrides it), but a fresh
  section would show them.
- **Product pages** for both Onderweg products show **€0,00** (price 0 in Shopify). They
  aren't linked from the theme, but they are reachable by URL and appear in
  `/collections/all`.

---

## ITEM — S-02: Floating contact button copy

### Findings

**B.1 One source of truth: confirmed.**

- Markup: `snippets/zv-contact-fab.liquid` (47 lines).
- It's rendered exactly **once**, from `layout/theme.liquid:451`. Every storefront page uses
  that layout. It's never in `layout/password.liquid`, and no template or section renders it.
- Styles: `assets/zv-contact-fab.css` (loaded at `theme.liquid:310`). Behaviour:
  `assets/zv-contact-fab.js` (`theme.liquid:452`). **Neither contains any of the copy**, so
  one edit to the snippet covers every page.
- Searching `sections/ snippets/ assets/ layout/` for `floating|sticky.*contact|contact.*float`
  turns up nothing else apart from unrelated CSS comments in `hero-banner.liquid` /
  `zv-kc.css`.
- Nothing here touches the Odoo lead flow (ADR-004 stays deferred).

**B.2 Current text** (`snippets/zv-contact-fab.liquid`):

| Line | Element | Text |
|---|---|---|
| 18 | toggle `aria-label` | Contact opnemen met Zo Veilig |
| 22 | **toggle label (visible)** | **Contact** |
| 25 | open panel's heading | **Hoe kunnen wij u helpen?** (already the target text) |
| 30 / 36 / 42 | panel links | Bel 088 122 11 11 · Mail ons · Plan een adviesgesprek |

**B.3 Consequences of changing the label**, measured on the live theme:

| Viewport | Toggle width now ("Contact") | With "Hoe kunnen wij u helpen?" | One line? |
|---|---|---|---|
| 1440 / 768 | 204 px | 382 px | yes |
| 390 / 360 / 320 | 154 px | 292 px | yes (right edge at 308 px, so it still fits a 320 px screen) |

1. **Duplicate text.** When the panel is open, the button and the panel heading right above
   it would both say "Hoe kunnen wij u helpen?".
2. **Accessible name.** The `aria-label` on line 18 replaces the visible label for screen
   readers. "Contact opnemen met Zo Veilig" contains "Contact" today. It would no longer
   contain the visible text, which fails WCAG 2.5.3 (Label in Name): a voice-control user
   saying "klik Hoe kunnen wij u helpen" wouldn't hit it.
3. **Overlap with Lio on phones.** Lio (`assets/zv-lio.css`, fixed bottom-right, z-index 9000)
   pops up for 4.2 s at funnel milestones (`assets/zv-lio.js:21`).
   - On screens narrower than **about 420 px** (most phones: 320 to 412), Lio's image overlaps
     the right end of the wider pill. On 390 it's the last ~30 px, with the text just clear.
     On 320 Lio covers "helpen?".
   - With "Contact" there is no overlap on any width.
   - It's temporary, and Lio can be closed.
   - Tried: wrapping the label to two lines on mobile (`max-width: 8.5em`) makes the pill
     241 px. That clears Lio at 375 px and up, but still overlaps by 9 px at 360.

### Proposed fix

`snippets/zv-contact-fab.liquid` only, one file:

| # | Line | Now | Proposed |
|---|---|---|---|
| B-1 | 22 | `<span class="zv-fab__label">Contact</span>` | `<span class="zv-fab__label">Hoe kunnen wij u helpen?</span>` |
| B-2 | 18 | `aria-label="Contact opnemen met Zo Veilig"` | **Remove the attribute.** The icons are `aria-hidden`, so the button's name becomes the visible label. This fixes point 2 above. |
| B-3 | 25 | `<p class="zv-fab__title">Hoe kunnen wij u helpen?</p>` | **Needs you.** Recommended: "**Neem contact met ons op**". Alternatives: delete the heading, or keep the repetition. |
| B-4 | (CSS) | — | **Needs you.** Recommended: **accept the brief Lio overlap** (max 4.2 s, closable, phones only). If you don't want it, the smallest fix is one rule in `assets/zv-contact-fab.css` inside the existing `@media (max-width: 600px)`: `body:has(.zv-lio.is-visible) .zv-fab { display: none; }`. That's the same pattern already used to hide the FAB under the mobile nav drawer (line 21). It hides the contact button while Lio is showing. |

---

## ITEM — V-02 close-out

### Findings

The exact command, run in the worktree:

```
$ grep -rn "gratis afstandsbediening\|gratis.*afstandsbediening" .
(no output)   exit=1
```

Also checked, all with **zero hits**:

- **Repo, case-insensitive, both word orders** (`gratis.*afstandsbediening` and
  `afstandsbediening.*gratis`), all files except `.git`.
- **The live theme pull** (scratch folder), same patterns.
- **Visible text of all 50 live pages**, both word orders within 80 characters. That covers
  the homepage, Oplossingen cards and modals, Vergelijk, the Klantenservice FAQ, all 12
  Kenniscentrum articles and all 20 product pages, including `/products/huur-afstandsbediening`.
- **Git history** of `origin/main` (`git log -S "gratis afstandsbediening"`).

The only file that contains both words is `templates/page.klantenservice.json`, and they're
unrelated:

- line 27-28: "Hoe activeer ik de paniekknop op de afstandsbediening?"
- line 324: "De meeste klanten kiezen voor automatische incasso. Dat is **gratis**, …"

### Proposed fix

None. **V-02 is closed: no code change.**

---

## Summary

| Item | Confidence | Status |
|---|---|---|
| S-07 / V-03 (Veilig Onderweg) | **Clear fix** for A-1 + A-2; **needs Thijs** for the hedge wording ("verwacht" vs firm) and the optional hero button (A-4) | Naming, badge, coming-soon block and "not purchasable" are already right. Only the "eind 2026" date is missing. Proposal: two JSON settings on Oplossingen. |
| S-02 (floating contact button) | **Clear fix** for B-1 + B-2; **needs Thijs** for B-3 (duplicate panel heading) and B-4 (Lio overlap on phones) | One snippet, rendered once site-wide. The new text already exists as the panel heading. |
| V-02 ("gratis afstandsbediening") | **Clear: closed** | Zero hits in repo, live theme, 50 live pages and git history. No change. |
