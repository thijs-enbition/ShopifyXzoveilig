# Liever zelf samenstellen (2026-11-02)

Branch `feature/zelf-samenstellen-2026-11-02`. Files: `sections/oplossingen.liquid` (the pill),
`snippets/zv-route.liquid` (key `zelf-samenstellen`), `sections/zelf-samenstellen.liquid` and
`templates/page.zelf-samenstellen.json` (the page).

## Before this goes live: create the Page in Admin

There is no Shopify page with handle `zelf-samenstellen` yet (Admin API, 2026-11-02). Create it
(Online Store > Pages, handle `zelf-samenstellen`, template `zelf-samenstellen`). The pill is wrapped
in `pages['zelf-samenstellen'] != blank`, so until the page exists nothing shows on Oplossingen and
a merge to main can't put a 404 link on live. Preview a theme without the page with
`/pages/camera-hardware?view=zelf-samenstellen&preview_theme_id=<id>`.

## Pill

A plain `<a class="catnav__t catnav__t--link">` after the three tabs: same outline as an inactive tab,
same height (56 px), no `data-opl-tab`, so `show()` never sees it. `role="tablist"` moved from `.catnav`
to `.catnav__tabs`, so the link is not a child of the tablist. Label and sublabel are section settings
(`zelf_label`, `zelf_sublabel`); an empty label hides it.

## Page

A copy of `camera-hardware.liquid`'s Winkelgrid, scoped `.zv-zelf`. Same conversion: phone
(`tel:`) or callback, nothing touches the cart, so no new checkout entry point. The lead keeps
`lead_type: 'camerahardware'`; `source_page` is `zelf-samenstellen`, `cta_location`
`zelf_samenstellen_page`, webhook source `zelf_samenstellen` (check Odoo's mapping if it keys on those).

Rows are the camera page's rows, verbatim, with a `cat` and the verified handles (`kh`, `hh`; nothing
in the grid reads them). Differences from the camera page: Afstandsbediening Huren is the live
EUR 0,80 (the camera page still says 1,28), and the 730 card's name has no "(Koop) " prefix. The trust
strip has only the two confirmed claims (14 dagen bedenktijd, gratis installatieadvies).

| Category | Rows (Koop handle / Huur handle) |
|---|---|
| Sensoren | Magneetcontact CL001 (`koop-magneetcontact` / `huur-magneetcontact-dc-23`), PIR CL002 (`koop-pir-bewegingsdetector` / `huur-pir-bewegingsdetector`), Rookmelder CL005 (`koop-rookmelder` / `huur-rookmelder`), Watersensor CL020 (`koop-watersensor` / `huur-watersensor`) |
| Camera's | Binnencamera 516 ADC-516 (`koop-binnencamera-516` / `huur-binnencamera`), 730 Buitencamera ADC-730 (`koop-730-buitencamera-met-spotlight`, Koop only), Dome 826 ADC826 (`koop-buitencamera-bedraad-dome-826` / `huur-dome-camera`), 729 Floodlight ADC-MM (`koop-729-wifi-camera-floodlight-mickey` / `huur-729-wifi-camera-floodlight-mickey`) |
| Videodeurbel | 750 ADC-750 (`koop-video-deurbel-750` / `huur-video-deurbel-750`), 780 ADC-780 (`koop-video-deurbel-780` / `huur-video-deurbel-780-accu`) |
| Bediening | Afstandsbediening CL004 (`koop-afstandsbediening` / `huur-afstandsbediening`, H0010) |

## Not on the page

- **Basis/hub:** no hub, panel or centrale product is ACTIVE in Shopify (Admin API, 2026-11-02: a title
  search for centrale/hub/basis/paneel/gateway/alarm/starter, and the full list of active products
  that aren't Koop, Huur, Nami or Ontzorg; the "Climax basis" product type holds only sensors and
  the remote). Gap.
- **Ontzorgpakket:** one product per package (MOIOH, MOZOH, MOAOH, OHC012; `check_pricing.py` §16),
  prepaid at the package quantity. There is no standalone one to pick. Not added.
- **Woning (N0008 / E001):** a surcharge on a package line; the cart guard removes a Woning line
  without a package (target 0). Never standalone.

## Stock and publication (Admin API, 2026-11-02), for the day this page sells online

The page is phone/callback only, so none of this blocks it, but it would block a buy button:
- `koop-pir-bewegingsdetector`, `koop-rookmelder`, `koop-watersensor` are ACTIVE but **not published
  to the Online Store**, tracked with DENY and 0 stock. `koop-magneetcontact-dc-23` (the CL001
  duplicate) is the same; `koop-magneetcontact` (also CL001) is published with CONTINUE.
- Every Huur product above is published with CONTINUE. All Koop cameras and doorbells, and
  `koop-afstandsbediening`, are published with CONTINUE.
