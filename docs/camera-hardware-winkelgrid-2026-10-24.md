# Camera-hardware: Winkelgrid layout (2026-10-24)

Branch `feature/camera-hardware-winkelgrid-2026-10-24`. `sections/camera-hardware.liquid` and
`templates/page.camera-hardware.json` only.

## Layout

Hero (eyebrow badge, h1, lead, "Bekijk alle camera's" → `#winkel`, "Vraag advies aan" →
Contact) → trust strip → filter chips → product grid (3 / 2 / 1 columns) → `#grotere-woning` →
sticky setup bar → "Uw camera-setup" (summary + terugbelverzoek, `#uw-setup`) → "Niet gevonden
wat u zocht?" band → FAQ (3 questions, the `.fq-item` accordion from `veelgestelde-vragen.liquid`).

Kept unchanged in behaviour: the `HW` array (byte-identical), per-card Kopen/Huren chips and
stepper, the summary, "Bel om te bestellen" (tel: + `zv_addons_intake`), the callback lead
payload, and `#grotere-woning` with `?pakket=beschermd|protect`.

## Why the cards don't use Shopify product data

Admin API, 2026-10-24: none of the hardware products has an image (`featuredMedia: null`) or
any tags, their `productType` is only `ADC_VIDEO_DEVICES` / `Climax basis` / `Climax hardware`,
and most aren't published to the Online Store, so `all_products` can't see them. The grid
stays on the `HW` array: a category icon instead of a photo, and filter chips driven by each
row's `type` (split on "+"). "Met meldkamer-koppeling" matches rows with `meldkamer:true`; no row
has it, so the chip is hidden until someone decides which hardware it applies to.

## Huren/Kopen

The Oplossingen Huren/Kopen toggle (PR #141, `feature/huren-kopen-toggle-2026-10-23`) covers
the package cards and their Videodeurbel/Afstandsbediening add-ons only. This page keeps its own
per-card Kopen/Huren chips; no second toggle was added.

## Trust strip

Four `trust` blocks in the template (label + zv-route key). The copy came from the brief: no
existing theme file carried these four claims together. Only "14 dagen bedenktijd" and a free
adviesgesprek already appear elsewhere on the site. "BORG-gecertificeerd" and "Gekoppeld aan de
meldkamer" need confirming for camera hardware (NAMI packages have no meldkamer).

## Data gaps found (Admin API, 2026-10-24)

- Placeholder titles in Shopify (ACTIVE): `(Koop) Binnencamera 516 ***` (ADC-516) and
  `(Koop) Video Deurbel 750  ***` (ADC-750). The page shows its own names without the markers.
- `(Koop) Binnencamera 516` is not missing: ADC-516 is ACTIVE and published to the Online Store.
  Its row has no specs or full product name yet (see `303e2ec`).
- ARCHIVED but still listed with a price on the page: CL003A `(Koop) Foto bewegingsdetector 868`
  (also in the Protect "Grotere woning" set), CL007 `(Koop) Glasbreukmelder`, CL2212
  `(Koop) Magneetcontact met shocksensor`. All three were archived at the 2026-10-23 reimport
  (19:59-20:00 UTC) and not restored.
- Two ACTIVE products each for CL001 (`koop-magneetcontact-dc-23`, `koop-magneetcontact`) and
  ROL (`koop-sa-220-roldeur-behuizing`, `koop-roldeurmagneetcontact`, different titles).
- No specs on most rows: only cam_724, cam_730, cam_727, vdb_750 and vdb_780 carry spec sheets,
  and those are the stale placeholder rows (`docs/camera-hardware-stale-placeholder-rows-2026-10-24.md`).
  ADC826 has neither specs nor a desc.
- No product photos anywhere; the cards are ready for an image once there is a source.
