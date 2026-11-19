# Contact button (floating FAB) made smaller, 2026-11-19

**What "the contact button" is.** The floating bottom-left toggle ("Hoe kunnen wij u helpen?",
`.zv-fab__toggle`), rendered once on every storefront page from `layout/theme.liquid`
(`snippets/zv-contact-fab.liquid`, `assets/zv-contact-fab.css`). It was doubled to 96px on
2026-10-13 (b8e3bfd). Colour, radius, shadow, weight and label are unchanged.

Two passes the same day (original 2026-10-13 / first pass, PR #188 / **second pass, now**):

| Property | Desktop | Phone (<=600px) |
|---|---|---|
| `min-height` | 96 / 80 / **56px** | 72 / 60 / **46px** |
| `font-size` | 22 / 19 / **15px** | 17 / 15 / **13px** |
| icon | 40 / 34 / **22px** | 30 / 26 / **18px** |
| `padding` | 0 40px 0 32px / 0 34px 0 27px / **0 20px 0 16px** | 0 30px 0 24px / 0 26px 0 20px / **0 16px 0 13px** |
| `gap` | 16 / 14 / **10px** | 12 / 10 / **8px** |

Measured in Chrome (live theme vs a disposable copy): 382 x 96 -> 328 x 80 (first pass) -> **241 x 56**
at 1440px; 292 x 72 -> 255 x 60 -> **205 x 46** at 390px and 360px. The open panel and its 44px links
are untouched. The phone toggle (46px) is deliberately just above the 44px target size; its label is
13px/800, small for a primary contact action, so revisit if visitors struggle to read it.

**The FAB's height is hardcoded in two other sections.** `sections/camera-hardware.liquid` and
`sections/zelf-samenstellen.liquid` stack their sticky setup bar (`.ch-bar`) above the FAB below
960px with `bottom: calc(<n>px + env(safe-area-inset-bottom))`, where n = FAB offset + FAB height
+ a 12px gap: 20 + 96 + 12 = 128 (<=960px) and 16 + 72 + 12 = 100 (<=600px) originally, 112 / 88
after the first pass, **now 20 + 56 + 12 = 88 and 16 + 46 + 12 = 74**. If the FAB's height changes
again, change those four numbers with it (a comment at `.zv-fab__toggle` says so). Checked with
fresh page loads at 390px and 800px: the pinned bar sits exactly 12px above the toggle on both pages.

**Other buttons that link to the contact page were deliberately left alone**: `.btn` "Neem contact
op" in `sections/over-ons.liquid`, `zv-404.liquid`, `hoe-het-werkt.liquid`, `zv-search.liquid`
(no-results CTA), and the advice CTAs ("Vraag advies aan", "Plan een adviesgesprek", "Vraag advies",
"Stel uw vraag"). They share `.btn` and sit in rows of equal-sized `.btn` siblings, so shrinking only
the contact one would mismatch the row. The header CTA is "Zakelijk", not a contact button.
