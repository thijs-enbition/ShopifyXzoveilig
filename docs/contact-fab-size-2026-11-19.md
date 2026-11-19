# Contact button (floating FAB) made smaller, 2026-11-19

**What "the contact button" is.** The floating bottom-left toggle ("Hoe kunnen wij u helpen?",
`.zv-fab__toggle`), rendered once on every storefront page from `layout/theme.liquid`
(`snippets/zv-contact-fab.liquid`, `assets/zv-contact-fab.css`). It was doubled to 96px on
2026-10-13 (b8e3bfd). Colour, radius, shadow, weight and label are unchanged.

| Property | Desktop before | Desktop after | Phone (<=600px) before | Phone after |
|---|---|---|---|---|
| `min-height` | 96px | 80px | 72px | 60px |
| `font-size` | 22px | 19px | 17px | 15px |
| icon | 40px | 34px | 30px | 26px |
| `padding` | 0 40px 0 32px | 0 34px 0 27px | 0 30px 0 24px | 0 26px 0 20px |
| `gap` | 16px | 14px | 12px | 10px |

Measured in Chrome on the live theme vs a disposable copy: 382 x 96 -> 328 x 80 at 1440px,
292 x 72 -> 255 x 60 at 390px and 360px. The open panel and its 44px links are untouched.

**The FAB's height is hardcoded in two other sections.** `sections/camera-hardware.liquid` and
`sections/zelf-samenstellen.liquid` stack their sticky setup bar (`.ch-bar`) above the FAB below
960px with `bottom: calc(<n>px + env(safe-area-inset-bottom))`, where n = FAB offset + FAB height
+ a 12px gap: 20 + 96 + 12 = 128 (<=960px) and 16 + 72 + 12 = 100 (<=600px) before; **now
20 + 80 + 12 = 112 and 16 + 60 + 12 = 88**. If the FAB's height changes again, change those four
numbers with it (a comment at `.zv-fab__toggle` says so).

**Other buttons that link to the contact page were deliberately left alone**: `.btn` "Neem contact
op" in `sections/over-ons.liquid`, `zv-404.liquid`, `hoe-het-werkt.liquid`, `zv-search.liquid`
(no-results CTA), and the advice CTAs ("Vraag advies aan", "Plan een adviesgesprek", "Vraag advies",
"Stel uw vraag"). They share `.btn` and sit in rows of equal-sized `.btn` siblings, so shrinking only
the contact one would mismatch the row. The header CTA is "Zakelijk", not a contact button.
