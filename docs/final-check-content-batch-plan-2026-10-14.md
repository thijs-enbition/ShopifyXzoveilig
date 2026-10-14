# Final-check content batch — investigation and plan (2026-10-14)

Investigation only. No `.liquid`, `.json` or `pricing.config.json` file was changed for this
doc. Nothing was pushed to a theme and no validation run was done. Every proposal below still
needs your OK before a fix branch starts.

## Baseline

- Branch `docs/final-check-content-batch-investigation-2026-10-14`, cut from `origin/main` at
  `8151335` (2026-10-14).
- **Live drift check:** live theme `188704719229` was pulled into a scratch folder and compared
  with `origin/main` (JSON compared after parsing, which ignores Shopify's header comment and
  empty `settings` objects). The only difference is one CSS selector line in
  `sections/legal-page.liquid`, the known drift from 2026-10-12. The
  `snippets/legal-herroepingsrecht.liquid` drift seen on 2026-10-12 is gone: live now matches
  main. **No file touched by any item below has a live-only edit.**
- **Rendered check:** the storefront (behind the password) was fetched as HTML for
  `/pages/oplossingen`, `/pages/vergelijk-pakketten`, `/pages/kenniscentrum`, the
  Kenniscentrum blog plus all 12 of its articles, `/pages/klantenservice` and
  `/pages/hoe-het-werkt`. When this doc says "live", it means it was seen in that HTML.
- **Open branches:** the only branch ahead of `main` is
  `fix/klantenservice-search-scroll-2026-10-14`, a one-line change to the "popular" search
  terms. It doesn't overlap any item here.

### Standing copy rules: how they were applied

- **u-vorm.** The brief says "u, never uw". *Uw* is the possessive of *u* ("uw woning"). It is
  correct u-vorm and appears hundreds of times. I checked for je/jij/jouw/jullie instead.
  **If you really mean no "uw" at all, tell me, because the scope changes completely.**
- Incidental findings, none caused by the 7 items:
  - `pricing/pricing.config.json:362`: add-on `vista-entry-deurbel` description "…waar **je**
    ook bent." This is je-vorm. It isn't rendered (see Item 5: `build_pricing.py` drops
    add-on `description`).
  - `templates/page.klantenservice.json:483`: FAQ question "Wat kost het als **jullie** iets
    moeten aanpassen?" It's in the customer's voice and addresses Zo Veilig, so it's borderline
    rather than a clear breach.
  - **wifi:** no "Wi-Fi"/"WiFi" in any file touched here. "Wifi-sensorstekker…"
    (`sections/oplossingen.liquid:857`) is capitalised only because it starts a sentence.
  - **Climax/nami mix-ups:** see Item 1, Finding 1.4. The Beschermd **and Protect** modals
    show NAMI hardware specs. This is the biggest incidental finding.

---

## ITEM 1 — L-03: Beschermd card inherits a Zeker claim

### Findings

**1.1 Where "Alles van Zeker" lives.** Only one occurrence in the theme:

- `sections/oplossingen.liquid:320`, inside the `when 'care'` branch of the card copy block:
  `{%- assign ltc_intro = 'Alles van Zeker, plus:' -%}`
- It's a hand-written Liquid literal. It is **not** generated from `pricing.config.json`, so
  `build_pricing.py` has no part in it. The fix goes in `oplossingen.liquid`.
- Live: seen once in `/pages/oplossingen`.
- It was added **on purpose** in `docs/pakket-wijzigingen-2026-09-23.md` §4 ("Intro (new, via
  `ltc_intro`): 'Alles van Zeker, plus:'"), from Robi's feedback docx. Removing it reverses a
  signed-off spec item. That needs sign-off from you or Robi, not just an engineering call.

**1.2 What the three surfaces say about Beschermd today.**

| Surface | File | What it says |
|---|---|---|
| **Card**, front | `oplossingen.liquid:318-322` | Tagline "Snelle hulp bij nood". Intro "Alles van Zeker, plus:". Bullets "Nederlandse meldkamer 24/7" (links to `kc/hoe-werkt-een-meldkamer`) · "Alarmknop met opvolging" · "Rookmelders met doormelding naar de meldkamer" |
| **Card**, "Wat zit erin?" | `oplossingen.liquid:322` | 1x centrale · 1x codebedienpaneel · 2x deur/raamsensor · 2x locatiesensor · 2x rookmelder · **3x paniekknop naar keuze** · Incl. meldkamer |
| **Modal** ("Meer informatie") | `oplossingen.liquid:866` (`#opl-modal-data`, `pkg.care`) | Hook "Complete bescherming met 24/7 meldkamer." Tier list: `hub` "Centrale" · codepaneel · `pir` ×2 "Locatiesensor" · `deursensor` ×2 · `rook` ×2 · `paniek` ×3 · **`zorgmeld` (24/7 *Zorg*meldkamer)** · **`familieapp`**. No `info` block, so no "Ideaal voor" for Beschermd. |
| **Comparison table** (Oplossingen, embedded under the matcher, and `/pages/vergelijk-pakketten`) | `snippets/zv-pakket-matcher.liquid`, default `feature_rows` | Beschermd ✓ on every row: "Discrete sensoren — Beweging en routine, geen camera", "App voor familie", "Melding bij afwijking", "Dag- en nachtinzicht — 24-uurs patroonherkenning", "Meerdere contactpersonen", "Meldkameropvolging", "Alarmknop met opvolging", "Jaarlijks onderhoud". "Meest geschikt voor": "Snelle hulp bij nood". |
| Pricing config (not rendered by these surfaces) | `pricing/pricing.config.json:186-199` | `platform: "Climax"`. `sub`: "Climax · 1 centrale, 2 deur-/raamsensoren, 2 bewegingsmelders, **keuze uit 3 paniekknoppen** en 2 rookmelders · incl. meldkamer" |

(`oplossingen.liquid:223` also sets a `sub` line for `care`. That line only renders in the
non-`ltc` card branch, which Beschermd never uses, so it's dead text.)

**1.3 The surfaces already disagree with each other, before "Alles van Zeker" is even
considered:**

1. **Familie-app.** The 2026-09-23 spec (§4) *removed* "Familie-app en meldingen" from the
   Beschermd card. The modal still lists the `familieapp` tile, and the table still ticks "App
   voor familie". The Mantelzorgdashboard badge on the same tab says "Bij alle Langer
   Thuis-pakketten: Inzicht, Zeker en Beschermd".
2. **Meldkamer type.** The card and table say "Nederlandse meldkamer, 24/7". The modal uses
   `zorgmeld`, "24/7 **Zorg**meldkamer — Professionals nemen bij een melding direct de
   opvolging over". "Zorgmeldkamer" is also the name of a separate Veilig Onderweg product
   (`liogo_guard`).
3. **Panic buttons.** The pricing config says "**keuze uit** 3 paniekknoppen" (choose one of
   three types). The card says "**3x** paniekknop naar keuze" and the modal shows "3×
   Draagbare paniekknop". Those are different quantities.
4. **Routine monitoring.** The table ticks Beschermd for "Beweging en routine", "Melding bij
   afwijking" and "24-uurs patroonherkenning". The card's hardware list has none of the NAMI
   activity sensors that Inzicht and Zeker use for this (`3x activiteiten sensor`). It is a
   Climax kit: centrale, codebedienpaneel, PIR and contacts.

**1.4 Climax/nami mix-up in the modal (flagged per the standing rules).** The Beschermd tier
uses the hardware entries `hub`, `pir` and `deursensor`. Their names and specs are NAMI's:

- `hub` = **"NAMI Hub"**: "De centrale die alle sensoren verbindt en met de meldkamer praat",
  wifi + 4G-backup.
- `pir` = "PIR-bewegingssensor · Thread", SKU ZV-P001.
- `deursensor` = "Magneetcontact · Thread", SKU ZV-P004.

So a customer who opens "Meer informatie" on the Climax Beschermd card sees NAMI Thread specs.
**The same happens on Protect** (`pkg.guard`, also Climax), which uses `hub`/`pir`/`deursensor`
too. The repo has no Climax hardware entries to swap in, so the correct specs have to come
from you or the supplier.

**1.5 Knock-on effect on the matcher (see Item 3).** The matcher scores each tile with the
*lowest tier that has it* and recommends the highest tier among the selected tiles. That only
works if Inzicht ⊂ Zeker ⊂ Beschermd, which is the same assumption "Alles van Zeker" makes. If
Beschermd doesn't do routine monitoring, then selecting "Melding wanneer een routine verandert"
(Zeker) plus "Snelle hulp wanneer het telt" (Beschermd) recommends Beschermd. That package
wouldn't cover the first tile.

### Proposed fix (card) and options (table and modal)

The card copy can be fixed without answering the product question. Proposed `care` copy in
`oplossingen.liquid:318-322`:

- `ltc_intro`: **remove** (set to `''`). The list then stands on its own.
- `ltc_bullets`, Climax-only, every line backed by the card's own hardware list:
  1. `Nederlandse [meldkamer](kc/hoe-werkt-een-meldkamer) 24/7` *(unchanged)*
  2. `Alarmknop met opvolging` *(unchanged)*
  3. `Rookmelders met doormelding naar de meldkamer` *(unchanged)*
  4. `Melding als een deur of raam opengaat` *(new; backed by "2x deur/raamsensor")*
- Leave out any "geen camera of microfoon" line. Climax pendants often have two-way voice, and
  the repo can't confirm either way.

**The table and modal need you to answer one product question first:** does Beschermd include
any routine or activity insight (for example Alarm.com Wellness on the Climax panel) and the
Familie-app / Mantelzorgdashboard?

- **Option A, no:** set the table to `n` for Beschermd on "Discrete sensoren", "Melding bij
  afwijking" and "Dag- en nachtinzicht". Set "App voor familie" according to your answer. Drop
  `familieapp` from the modal tier. Remove Beschermd from the Mantelzorgdashboard badge. The
  matcher's nesting model then breaks (see 1.5 and Item 3).
- **Option B, yes:** keep the table. Replace the intro with something accurate instead of
  removing it, e.g. "Dagritme-inzicht via de Familie-app, plus:". The matcher model holds.

Whichever option you pick, these also need doing:

- Resolve the meldkamer naming: `zorgmeld` versus `meldkamer` in the modal tier.
- Resolve the panic-button quantity: "keuze uit 3" versus "3x".
- Get Climax specs from you or the supplier to replace `hub`/`pir`/`deursensor` in the
  Beschermd and Protect modal tiers.

---

## ITEM 2 — L-04: false sensor claim on Zeker

### Findings

`grep -rni "medicijn\|medicat\|gegeten\|gedronken\|koelkast\|eten.*drinken"` across the theme
and `pricing/` (the literal "eten…drinken" pattern from the brief misses "gegeten of
gedronken", so the search was widened):

| # | Location | Text | User-facing? |
|---|---|---|---|
| 1 | `sections/oplossingen.liquid:315`, Zeker (`aware_plus`) card bullets | "Signalering als **medicijnen of koelkast** niet worden gebruikt" | Yes. Live on `/pages/oplossingen`, Langer Thuis → Zeker card |
| 2 | same line, next bullet | "Directe melding als er mogelijk **niet meer gegeten of gedronken** wordt" | Yes, same card |
| 3 | `sections/kc-hub.liquid:208`, Alarm.com card in "Meekijken zonder mee te kijken" | "Kleine sensoren op het bed, **de koelkast** en kastjes … **medicatie die blijft liggen** …" | Yes, `/pages/kenniscentrum`. It describes partner tech (links to alarm.com Wellness), not a Zo Veilig package, but the Mantelzorgdashboard says that platform is part of Langer Thuis. |
| 4 | Blog article `langer-thuis-wonen-met-dementie` (Shopify admin content, **not in the theme**) | "Blijft iemand 's ochtends in bed, of **wordt er een hele dag niet gegeten**, dan volgt een melding." | Yes. Only editable in Shopify admin. |

- **`pricing.config.json`: no occurrence.** The September note about unrendered add-on text
  still holds in general: `scripts/build_pricing.py` copies add-ons without their
  `description`. It just doesn't apply here, because the claim isn't in the config at all.
- **Why it's false:** Zeker's hardware is `3x activiteiten sensor | 1x deur/raamsensor | 2x
  locatiesensor` (`oplossingen.liquid:316`), and the modal places the 2 locatiesensors "voor
  slaapkamer en badkamer". No package has a sensor on a medicine cabinet or a fridge, so
  "niet gegeten of gedronken" could at most be guessed from kitchen activity.

### Proposed fix

- **#1 + #2** (`oplossingen.liquid:315`): replace both bullets with claims the existing Zeker
  modal copy already makes ("subtiele veranderingen in rustpatronen, badkamergebruik en
  nachtelijke routines", `oplossingen.liquid:865`):
  - `Signalering bij meer of minder bezoek aan badkamer, keuken of toilet` *(unchanged)*
  - `Inzicht in slaap- en rustpatronen` *(replaces the medicijnen/koelkast bullet)*
  - `Melding bij afwijkende nachtelijke routines` *(replaces the eten/drinken bullet)*
- **#3** needs your decision. **Option a:** leave it, since it describes Alarm.com's own
  product and links there. **Option b:** remove "de koelkast" and "medicatie die blijft
  liggen", e.g. "Kleine sensoren in huis leren het normale dagritme. Wijkt het patroon af, dan
  gaat er een seintje naar familie: een deur die 's nachts opengaat, of een dag met opvallend
  weinig activiteit."
- **#4** is outside the theme. You'd edit it in Shopify admin (Blog posts →
  langer-thuis-wonen-met-dementie). Suggested sentence: "Blijft iemand 's ochtends langer in
  bed dan normaal, dan volgt een melding."

---

## ITEM 3 — L-05: "Zorgpartner aan huis" and the Langer Thuis situatietegels

### Findings: "Zorgpartner aan huis"

`grep -rni "zorgpartner"`, 3 occurrences, all on the same tile (`s9`):

- `templates/page.oplossingen.json:189-190`: tile on the Oplossingen Langer Thuis tab. Live.
- `templates/page.vergelijk-pakketten.json:14`: tile on `/pages/vergelijk-pakketten`. Live
  (page returns 200, tile present).
- `sections/vergelijk-pakketten.liquid:292`: section preset. Only used when the section is
  added fresh in the editor. Not rendered.

History:

- First text (`dff103e`, 2026-09-09, the commit that built the matcher): "Als extra optie is
  een zorgpartner aan huis mogelijk." The same commit says **"The card->package mapping is a
  placeholder pending product sign-off"**, and CLAUDE.md repeats it ("guessed from the card
  wording, not confirmed").
- Shortened in the theme editor to "Zorgpartner aan huis mogelijk." (`80598a8`, 2026-09-22),
  then synced to Vergelijk pakketten (`5040c71`, 2026-09-23).
- The 2026-09-23 spec (from Robi's feedback) left `s7–s9 → beschermd (unchanged)`. Its
  addendum says s8 and s9 "stay two separate blocks". So the tile was reviewed and kept as
  copy.

**What the repo can't establish:** whether any home-visit care partner exists. Nothing in the
theme, the docs, `pricing.config.json` (no add-on, bundle or service) or any commit message
names a partner, a price or a process. The nearest real things are "24/7 Zorgmeldkamer"
(Securitas, in the Beschermd modal) and "Installatie aan huis" (a NAMI installation option).
Neither is a care visit. **It could be real, but it is undocumented.**

### Findings: the Langer Thuis situatietegels

This is the original Langer Thuis matcher (`scenario` blocks, scored by
`snippets/zv-pakket-matcher.liquid` + `assets/zv-vergelijk-pakketten.js`), not the Mijn Thuis
`scenario_mijn_thuis` instance. The same 9 tiles, with identical text and mapping, appear in
three places:

- `page.oplossingen.json` (blocks s1–s4, s10, s6–s9). Live.
- `page.vergelijk-pakketten.json`. Live.
- The `vergelijk-pakketten.liquid` preset. Not rendered.

`s5` ("Mogelijke val eerder signaleren") was removed on 2026-09-23 per the spec.

Scoring: each tile's `package` is the lowest tier that has the scenario (spec §8, confirmed
from the mockup's "Inzicht+"/"Zeker+" labels). Advice = the highest tier among the selected
tiles.

| Tile | Row | Title / quote (verbatim) | Assigned now | Proposed | Reasoning |
|---|---|---|---|---|---|
| s1 | 1 | "Weet dat de dag goed is begonnen" / "08:27 — opgestaan." | inzicht | **inzicht** | Inzicht bullet: "Mogelijkheid tot een melding bij de eerste beweging van de dag". |
| s2 | 1 | "Zie wanneer er iets verandert" / "Vannacht meerdere keren beweging." | inzicht *(was zeker until 2026-09-23)* | **inzicht or zeker: your call** | Inzicht: "melding bij afwijking van het normale patroon". But Zeker's modal copy owns "rustpatronen … nachtelijke routines", and a restless night is exactly that. |
| s3 | 1 | "Seintje als het stil blijft" / "Sinds 13:45 geen beweging." | inzicht | **inzicht** | Inzicht: "melding bij afwijking van het normale patroon". |
| s4 | 1 | "Waarschuwing bij iets onverwachts, zoals nachtelijk dwalen" / "03:18 — voordeur geopend." | inzicht *(was zeker until 2026-09-23)* | **inzicht** | Inzicht has "1x deur/raamsensor" and pattern alerts. |
| s10 | 2 | "Licht aan bij beweging in de nacht" / "02:14 — nachtlamp tien minuten aan, ter voorkoming van een val." | inzicht | **inzicht** | Inzicht bullet: "Automatische nachtverlichting bij beweging". |
| s6 | 2 | "Melding wanneer een routine verandert" / "09:15 — keuken nog niet bezocht." | zeker | **zeker** (quote: see note) | Room-level insight is Zeker's (locatiesensoren). Note: Zeker's standard placement is "slaapkamer en badkamer", not the kitchen. The Zeker bullet does claim "keuken", so the tile matches the card, but if Item 2's review tightens Zeker's claims, "badkamer nog niet bezocht" would be the safer quote. |
| s7 | 2 | "Snelle hulp wanneer het telt" / "04:40 — noodknop ingedrukt." | beschermd | **beschermd** | Only Beschermd has a panic button / alarmknop. |
| s8 | 3 | "Rook en brand op tijd ontdekt" / "06:38 — brandalarm geactiveerd." | beschermd | **beschermd** | Only Langer Thuis package with smoke detectors. |
| s9 | 3 | "Opvolging aan huis mogelijk" / "Zorgpartner aan huis mogelijk." | beschermd | **depends on whether the service exists** | See the options below. |

**Structural caveat (from Item 1.5):** the "lowest tier" model assumes Beschermd covers
everything Inzicht and Zeker do. If Item 1 goes Option A (Beschermd has no routine
monitoring), then s1–s4, s10 and s6 are *not* covered by Beschermd. Any mix of those tiles
with s7/s8 would then recommend a package that misses some of the selected scenarios. Fixing
that means a different scoring model (e.g. a tile can belong to several packages), not just
new `package` values.

### Options for s9

- **(a) Keep it**, if you confirm a home-visit care partner exists for Beschermd. Then add the
  service to the Beschermd card or modal too, so the tile isn't the only place it's promised.
- **(b) Rewrite it to something documented**, e.g. title "Meldkamer schakelt hulp in", quote
  "04:41 — meldkamer belt uw contactpersoon." This is close to s7, so it may feel redundant.
- **(c) Remove it** from both templates and the preset, leaving 8 tiles. The row 3 layout
  then holds only s8.

---

## ITEM 4 — L-07: jargon in "Ideaal voor"

### Findings

`grep -rni "Ideaal voor\|idealFor"`: the heading is rendered by `infoHtml()` at
`sections/oplossingen.liquid:2179` in the "Meer informatie" modal. The text comes from the
`#opl-modal-data` JSON island in the same file. It is **not** in `pricing.config.json`.

- **Inzicht** (`oplossingen.liquid:864`, `pkg.aware.info.idealFor`), verbatim:
  > Teleassistentie, mantelzorg-apps, verzekeraars en instap-inzichtdiensten die snel en
  > schaalbaar willen uitrollen.
- **Zeker** (`oplossingen.liquid:865`, `pkg.aware_plus.info.idealFor`), verbatim:
  > Professionele zorgdiensten, publieke programma's en geavanceerde
  > zorgtechnologieplatformen die ADL-inzicht willen, zonder ADL-complexiteit.
- Beschermd, Alert and Protect have no `info` block, so no "Ideaal voor".
- Origin: `d3d5860` (2026-07-29, veronica1nvest), ported from the design's `breakout.jsx`. It
  reads like NAMI's B2B positioning for aiAware/aiCare.

**Why it's jargon:** both texts address *businesses that resell the platform*, not a family
buying for a parent.

- Inzicht: "Teleassistentie" (sector term for telecare), "verzekeraars", "instap-
  inzichtdiensten", "snel en schaalbaar uitrollen" (deployment language).
- Zeker: "ADL" (care-sector abbreviation for *Activiteiten van het Dagelijks Leven*), "publieke
  programma's", "zorgtechnologieplatformen".

There is more of the same in the same modal blocks (adjacent, not in scope unless you say so):

- Zeker `introTitle` "…Activiteiten van het Dagelijks Leven…".
- Zeker body: "gedragsintelligentie", "eenvoudig uit te rollen", "zonder training".
- Inzicht body: "basislaag van algemeen activiteitsinzicht", "niet-intrusief".
- Both `deployment` lists: "~100 m² / 1.200 ft²", with imperial units.

### Proposed fix

Replace only the two `idealFor` strings (u-vorm; every claim is already made elsewhere on the
same card):

- **Inzicht:** "Familie en mantelzorgers die op afstand willen weten dat het dagritme van een
  dierbare normaal verloopt, zonder camera in huis."
- **Zeker:** "Mantelzorgers die veranderingen in slaap, badkamerbezoek en dagritme vroeg
  willen zien, voordat er iets misgaat."

---

## ITEM 5 — P-05: legacy package names in the Kenniscentrum

### Findings

**The legacy names are already gone.** Running
`grep -n "Pakket Meekijken\|Pakket Aware\|Pakket Vista\|Pakket Zorg Compleet\|Familie Plus" sections/kc-hub.liquid`
finds only `kc-hub.liquid:256`, and that line matches only on **"Pakket Vista"**, which is a
current Mijn Thuis package name.

- Commit `cd64dc1` (2026-09-09) replaced the old badges, mapping each by its own `finder_key`:
  - "Aware" / "Pakket Meekijken" (`aware`) → Inzicht
  - "Aware+" / "Pakket Aware Gerust" (`aware_plus`) → Zeker
  - "Care" / "Pakket Zorg Compleet" ×3 (`care`) → Beschermd
- That commit kept "Pakket Vista" deliberately, because its `finder_key` (`secure_plus`)
  really is Vista. "Familie Plus" was never in kc-hub. It exists only in
  `pricing.config.json`'s `retired` list and in `scripts/check_pricing.py`'s banned-terms
  check.
- **Live check:** the rendered `/pages/kenniscentrum` and all 12 Kenniscentrum articles
  contain none of Meekijken-as-package, Aware, Secure, Zorg Compleet or Familie Plus. Only the
  ordinary verb "meekijken" appears.

**"Maakt van Aware of Secure een bewaakt pakket"** is at `pricing/pricing.config.json:375`,
add-on `securitas-meldkamer`, field `description`. `build_pricing.py` (lines 350-362) doesn't
copy `description` into `pricing.generated.json` or `snippets/zv-pricing.liquid`, and the
phrase appears in no theme file. **It isn't rendered anywhere.** The add-on also isn't offered
on any card (`ltc_addons` holds only Videodeurbel, Afstandsbediening and Ontzorgpakket).

So P-05 as written seems to describe a state from before 2026-09-09, or the unrendered config
line. **What kc-hub does have is a mapping problem: several practice cases point at a package
that doesn't fit their story.** Here are the 8 cases as they are now, with what each one
implies and 2–3 candidate packages each:

| # | Persona / title | Story (abridged) | Now | What it describes | Candidates |
|---|---|---|---|---|---|
| 1 | Voor gezinnen / Gerust op vakantie | "Twee weken weg en de woning staat leeg … iemand meekijkt terwijl u er niet bent." | Beschermd *(added via theme editor `041cf39`, 2026-09-14)* | Burglary watch on an empty family home. A Mijn Thuis need, not Langer Thuis. | **Protect** (meldkamer) · Alert (self-monitored) · Vista (camera) |
| 2 | Na een inbraak in de straat / Niet afwachten… | "…welke maatregelen echt verschil maken" | Vista *(added `041cf39`)* | General burglary prevention, Mijn Thuis | **Protect** · Vista · Alert |
| 3 | Voor ouderen / Zelfstandig en gerust thuis | "Mevrouw (78) woont alleen … zonder camera in de woonkamer." | Inzicht *(was "Pakket Meekijken")* | Basic camera-free reassurance, Langer Thuis entry tier | **Inzicht** · Zeker |
| 4 | Voor mantelzorgers / Grip en rust in de zorg | "…'s nachts kunnen slapen, zonder constant te checken" | Zeker *(was "Pakket Aware Gerust")* | Proactive alerts for a caregiver, Langer Thuis middle tier | **Zeker** · Inzicht |
| 5 | Voor partners / Samen veilig ouder worden | "…zicht op wie er aan de deur staat en een meldkamer die meekijkt." | Vista | Elderly couple (Langer Thuis persona) but a camera/doorbell + meldkamer need (Mijn Thuis) | **Vista** (meldkamer optional) · Protect + Videodeurbel add-on · Beschermd + Videodeurbel add-on |
| 6 | Voor kinderen van ouderen / Op afstand toch dichtbij | "…iemand professioneel opvolgt als er iets gebeurt." | Beschermd *(was "Pakket Zorg Compleet")* | Professional follow-up for a parent, Langer Thuis top tier | **Beschermd** |
| 7 | Voor mensen met dementie / Langer thuis met steun | "…'s nachts onrustig. **Dwaaldetectie en een meldkamer** geven de familie rust." | Beschermd *(was "Zorg Compleet")* | Wandering detection (the matcher puts this at Inzicht, tile s4) **plus** meldkamer (Beschermd only). Whether Beschermd does both depends on Item 1's product question. | **Beschermd** · Zeker · (no single package if Item 1 = Option A) |
| 8 | Voor alleenwonenden / Niemand merkt het? Wij wel | "Als u alleen woont **en valt** … Het systeem signaleert en schakelt hulp in." | Beschermd *(was "Zorg Compleet")* | Automatic fall detection. No Langer Thuis package lists it (Beschermd needs a button press). It's Veilig Onderweg's valdetectie, which is "Binnenkort". | **Beschermd** with the story changed to the panic button ("…drukt u op de alarmknop") · Veilig Onderweg Zorgmeldkamer once available · leave as is |

### Options

- **The legacy names:** nothing to change in the theme.
- **The `pricing.config.json:375` description:** it isn't rendered. **Option a:** leave it.
  **Option b:** reword using `finder_key` → current names: "Maakt van Inzicht of Alert een
  bewaakt pakket" (literal: `aware` = Inzicht, `secure` = Alert). **Option c:** "Maakt van
  Inzicht, Zeker of Alert een bewaakt pakket" (every NAMI package without a meldkamer; Zeker
  also says "Geen meldkamer"). Changing it is a config change, so `build_pricing.py` and
  `check_pricing.py` would need to run, though the generated files won't change.
- **Cases 1, 2, 5, 7 and 8:** pick from the candidates above. I'd treat 1 and 8 as the real
  errors: an empty-house burglary case pointing at an elderly-care package, and a
  fall-detection claim no current package makes.

---

## ITEM 6 — P-03: links on Klantenservice

### Findings

Both buttons are in the "Nieuwe klant" band, `sections/klantenservice.liquid:150-151`. Their
URLs are `url`-type theme settings. The values set in `templates/page.klantenservice.json`
(lines 599-602) override the section defaults. Both have been unchanged since `b3672db`
(2026-08-17).

| Label | `href` now (template, and live HTML) | Resolves? | What's there |
|---|---|---|---|
| "Maak me wegwijs" | `/pages/oplossingen` | 200 | The full product page with all three lines. No guided step. |
| "Hoe het werkt" | `/pages/hoe-het-werkt` | 200 | Real page (`templates/page.hoe-het-werkt.json` → `sections/hoe-het-werkt.liquid`): "Van keuze tot een gerust gevoel, in vier stappen" and "Wat er gebeurt na een melding". |

Neither link is a 404 or a placeholder.

- **"Maak me wegwijs"** promises guidance but lands on a catalogue. Every other "help me
  choose" CTA in the theme goes to the Keuzehulp at `/#keuzehulp` (zv-route key `keuzehulp`):
  - Kenniscentrum "Keuzehulp" → `/#keuzehulp` (live)
  - Hoe het werkt "Doe de Keuzehulp" → `/#keuzehulp` (live)
  - Oplossingen hero `hero_cta_url` "Keuzehulp" → `/#keuzehulp`
  - Every Kenniscentrum article: "Doe de Keuzehulp"
- **"Hoe het werkt"**: label and target match, and I can't find what's wrong with it. If the
  audit had a specific complaint (e.g. it should open the homepage's own steps section), I
  need that detail. The only weakness is that it's a hard-coded path, because `zv-route` has no
  `hoe-het-werkt` key. Every other internal link goes through `zv-route`.

Adjacent: `/pages/klantenservice` (what `zv-route` outputs for `klantenservice`) redirects to
`/pages/klantenservice-veelgestelde-vragen`. It works, through a Shopify URL redirect.

### Proposed fix and options

- **"Maak me wegwijs" → `/#keuzehulp`.** It matches the label and every other guidance CTA.
  Set it in `page.klantenservice.json` (`cta1_url`). A `url` setting can't call `zv-route`. If
  you'd rather route it, change the section default to `{% render 'zv-route', key:
  'keuzehulp' %}` and blank the template value. The alternative is to keep
  `/pages/oplossingen` and relabel the button "Bekijk de oplossingen".
- **"Hoe het werkt": no change proposed.** Optionally add a `hoe-het-werkt` key to `zv-route`
  and route the default through it. That would be consistency work, not a bug fix.

---

## ITEM 7 — V-01: links on Veilig Onderweg

### Findings

**There is no separate Veilig Onderweg page.** `/pages/veilig-onderweg` returns **404**, and
there is no `page.veilig-onderweg` template or section. "Veilig Onderweg" is the
`veilig_onderweg` block / tab of `/pages/oplossingen` (`templates/page.oplossingen.json`,
anchor `veilig-onderweg`). The footer link "Veilig Onderweg" also just goes to
`/pages/oplossingen`. So the September Oplossingen check and today's Veilig Onderweg check
cover **the same block**. History of that link slot (`why_1_link_*`):

| Date | Commit | Label | Target |
|---|---|---|---|
| 2026-07-29 | `d3d5860` | "Bekijk Altijd Dichtbij" | `/#keuzehulp` |
| 2026-09-18 | `70119b4` | "Bekijk Altijd Dichtbij" | `/blogs/kenniscentrum/wat-is-alarm-com` |
| 2026-10-12 | `824f5b7` (sitewide terminology) | "Bekijk Veilig Onderweg" | same |
| 2026-10-12 | `5f3abf3` | "Blijf op de hoogte" | `/pages/oplossingen#veilig-onderweg-aanmelden` |

**Status today, with evidence:**

- **"Bekijk Altijd Dichtbij": missing**, on purpose. `grep -rni "altijd dichtbij"` over the
  theme finds nothing, and neither does the live `/pages/oplossingen` HTML. It was renamed on
  2026-10-12 and replaced the same day. The slot now reads "Blijf op de hoogte" and scrolls to
  the Veilig Onderweg signup box. The target id `veilig-onderweg-aanmelden` is present in the
  live HTML. **Present and working.**
- **"Hoe valdetectie werkt": present, but the target doesn't match the label.**
  - It's at `templates/page.oplossingen.json:110` (`why_2_link_label`), with
    `why_2_link_url` = `/blogs/kenniscentrum/alarm-met-of-zonder-meldkamer`. Both are in the
    live HTML, and the article returns 200.
  - That article mentions valdetectie once, in one FAQ answer ("Kan een meldkamer ook helpen
    bij een val? Ja. Wanneer leefstijlmonitoring of valdetectie is gekoppeld…"). None of its
    H2s is about fall detection.
  - None of the 12 articles explains Veilig Onderweg's fall detection (GPS button + impact
    sensor). The articles that cover falls most describe in-home sensing with a
    "privacy-silhouet":
    - `hoeveel-zorgtechnologie` (4 mentions, includes "Niveau 2: actieve risicosignalering en
      valdetectie")
    - `langer-thuis-wonen-met-dementie` (2)
    - `hoe-werkt-een-meldkamer` (practice example)

### Options

- **"Bekijk Altijd Dichtbij":** nothing to fix. If the audit expects it back, that would
  reverse the 2026-10-12 terminology decision ("Altijd Dichtbij" was retired as a name).
- **"Hoe valdetectie werkt":**
  - **(a)** Keep the target and relabel it to match: "Alarm met of zonder meldkamer".
  - **(b)** Keep the label and retarget to `/blogs/kenniscentrum/hoeveel-zorgtechnologie`. It
    explains valdetectie as a level of care, but it's not the LioGo product.
  - **(c)** Point it at the signup box like `why_1` (`#veilig-onderweg-aanmelden`), labelled
    e.g. "Blijf op de hoogte over valdetectie", until a Veilig Onderweg article exists.
  - **(d)** Remove the link until then.

  (a) is the smallest honest change. (c) fits a product that's still "Binnenkort".

---

## Summary

| Item | Code | Confidence | Status |
|---|---|---|---|
| 1 | L-03 | **Card: clear fix. Table/modal: needs your decision** | One literal at `oplossingen.liquid:320`, not config-generated. It reverses spec §4. Card/modal/table already disagree on familie-app, meldkamer type and panic-button count. The modal shows NAMI specs on Climax Beschermd **and Protect**. |
| 2 | L-04 | **Clear fix** (card). **Needs decision** (kc-hub partner card; admin blog text) | Two false Zeker bullets at `oplossingen.liquid:315`, live. Not in `pricing.config.json`. The same kind of claim is in `kc-hub.liquid:208` and one blog article. |
| 3 | L-05 | **Needs your decision** | "Zorgpartner aan huis" exists in 2 live templates + 1 preset. The repo can't confirm the service exists. Tile table above; s2 and s9 are open, the rest look right. The scoring model depends on Item 1. |
| 4 | L-07 | **Clear fix** | Two `idealFor` strings in the modal data island (`oplossingen.liquid:864-865`), B2B NAMI positioning. Replacement copy proposed. More jargon in the same blocks flagged. |
| 5 | P-05 | **Needs your decision** (case mapping only) | Legacy names already removed 2026-09-09 (`cd64dc1`), confirmed in the live hub + 12 articles. The "Aware of Secure" line isn't rendered. Cases 1 and 8 point at the wrong package or make a claim no package supports. |
| 6 | P-03 | **Clear fix** ("Maak me wegwijs"). **No change** ("Hoe het werkt") | Both links resolve. "Maak me wegwijs" → `/#keuzehulp` to match every other guidance CTA. "Hoe het werkt" is correct as far as the repo shows. |
| 7 | V-01 | **Needs your decision** ("Hoe valdetectie werkt") | No separate Veilig Onderweg page; it's the Oplossingen tab. "Bekijk Altijd Dichtbij" was removed on purpose 2026-10-12, and its slot now works. "Hoe valdetectie werkt" is live but its article barely mentions valdetectie. |
