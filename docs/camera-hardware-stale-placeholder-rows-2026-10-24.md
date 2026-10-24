# Camera-hardware: stale placeholder rows (2026-10-24)

`cam_730` / `vdb_750` / `vdb_780` / `vdb_755` in `sections/camera-hardware.liquid` (`var HW`) look
like stale placeholder rows: their SKUs (CAM-730, VDB-750, VDB-780, VDB-755) don't match any
Shopify product, active or archived (Admin API, 2026-10-24).

Three of them duplicate the real Koop rows added on `feature/camera-hardware-koop-2026-10-24`:
same hardware, same koop price.

| Placeholder row | Real row | Real product (ACTIVE) | Koop |
|---|---|---|---|
| `cam_730` (CAM-730) | `cam_730_adc` (ADC-730) | `koop-730-buitencamera-met-spotlight` | € 325,00 |
| `vdb_750` (VDB-750) | `vdb_750_adc` (ADC-750) | `koop-video-deurbel-750` | € 299,00 |
| `vdb_780` (VDB-780) | `vdb_780_adc` (ADC-780) | `koop-video-deurbel-780` | € 425,00 |
| `vdb_755` (VDB-755) | none | none: no product has 755 in its SKU or title | — |

The placeholder rows carry the spec sheets (`model`/`specs`) and a huur price with no huur SKU;
the ADC-* rows have no specs yet ("Specificaties volgen.").

Decision deferred (Thijs, 2026-10-24): leave as-is until real spec sheets are ready to move
over, then delete `cam_730`, `vdb_750` and `vdb_780` and port their specs onto the ADC-* rows.
`vdb_755` has no real product to fold into, so whether it goes too is part of that decision.

Not yet actioned — do not remove these rows without checking this note first.
