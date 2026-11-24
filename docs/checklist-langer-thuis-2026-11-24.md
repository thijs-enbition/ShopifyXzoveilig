# Checklist "Hoe veilig woont iemand die u lief is?" — capture side (2026-11-24)

Capture page merged to `main` as PR #190 (2026-11-24). **Update 2026-11-24: the 10 missing questions
are in** (branch `feature/checklist-langer-thuis-questions-2026-11-24`, only
`templates/page.checklist-langer-thuis.json` changes). The page is still **not published** (see "Shopify
Page" and the open items below).

**Status: structure and all 11 questions done and tested.** The field spec arrived as the full page
template JSON (4 groups, 11 `question` blocks `lt_vr01` ... `lt_vr11`, settings unchanged) and is
committed verbatim (see "Field spec").

## What is in the branch

| File | What |
|---|---|
| `sections/zv-checklist.liquid` | Generic checklist section: hero, Ja / Nee / Weet ik niet rows, naam + e-mail + consent, submit through `ZVLeadWebhook.send()`, on-page confirmation. |
| `templates/page.checklist-langer-thuis.json` | The config for the Langer Thuis checklist (settings + `group` / `question` blocks). |
| This file | Contract and open items. |

No change to `assets/zv-lead-webhook.js`, `snippets/zv-form-copy.liquid`, `supabase/`, `config/` or any generated pricing file.

## "Driven by a JSON config file": how, and why not literally

Liquid in this theme cannot parse a JSON string (`parse_json` is not a known filter in the theme-check
data and nothing in the repo uses it). So the config is the page's **JSON template**, which Shopify
and `theme check` validate and which renders server-side (no client fetch, no empty-form flash):

| Brief's JSON | Where it lives |
|---|---|
| `checklist_id` | section setting `checklist_id` (`langer-thuis`) |
| `title`, `intro` | section settings `title`, `intro` |
| `groups[].heading` | a `group` block, setting `heading` |
| `groups[].questions[]` `{field,label}` | `question` blocks after that group block, settings `field`, `label` |

A question belongs to the nearest `group` block above it. Order = `block_order`. Groups without
questions are not rendered. Empty-field and duplicate-field questions are skipped (two questions with
the same `name` would share one radio group), each leaving an HTML comment. A checklist with no valid
question renders no form at all (and an editor-only notice).

The brief asked for `templates/page.checklist-langer-thuis.liquid`; it is `.json` because section
blocks can only live in a JSON template, and every other page template here is JSON.

**Reuse (Mijn Thuis, Veilig Onderweg):** add `templates/page.checklist-<id>.json` with
`"type": "zv-checklist"`, `checklist_id` `<id>`, its own blocks, then a Page with that template suffix.
Nothing in the section is Langer-Thuis-specific. `lead_type` = `checklist-<id>`, failure-log source =
`checklist_<id>` with `-` replaced by `_`.

Do not rename a question's `field` in the theme editor: those names are an Odoo contract.

## Payload sent to `ZV_LEAD_ENDPOINT` (Odoo)

Built with `ZVMeasurement.buildCallbackLead(ctx)` like `contact-page` and `herroepen-page`, then
`ZVLeadWebhook.send(rec, 'checklist_langer_thuis')`. POST, `text/plain`, no-cors (the shared layer).

| Key | Value |
|---|---|
| `lead_type` | `checklist-langer-thuis` |
| `<field>` ×N | `ja` \| `nee` \| `weet_niet` (verbatim from the block's `field`; `""` only if "Alle vragen verplicht" is switched off) |
| `naam` | trimmed name, as in the brief |
| `name` | same value. Every other lead form sends `name`, which is what the existing Odoo lead mapping reads. Drop one of the two once Odoo's side is decided |
| `email` | trimmed |
| `consent` | boolean `true` (the form cannot be submitted without it) |
| `cta_location` | `checklist_langer_thuis` |
| from `buildCallbackLead` | `lead_source: "website"`, `lead_temperature: "hot"`, `page_url`, `timestamp`, attribution (utm/gclid, only if marketing consent was given elsewhere) |

Identity keys are written after the answers, so an answer field can never overwrite `lead_type`,
`email` or `consent`. The honeypot field and the checkbox's own name never reach the payload.

## Field spec (received 2026-11-24)

The spec is the finished template JSON, committed as `templates/page.checklist-langer-thuis.json`.
Group → question order, `field` = Odoo key:

| Group | Fields |
|---|---|
| Dagelijks ritme | `lt_vr01_ochtendritme`, `lt_vr02_later_opstaan`, `lt_vr03_keukengebruik`, `lt_vr04_minder_actief` |
| Overdag en 's nachts | `lt_vr05_vier_uur_inactief`, `lt_vr06_nachts_actiever` |
| Veiligheid en contact | `lt_vr07_rook_brand_melding`, `lt_vr08_regelmatig_bezoek` |
| En uzelf | `lt_vr09_belt_zelf_controle`, `lt_vr10_ritme_verandering_merkbaar`, `lt_vr11_afstand_zonder_camera` |

The question wording is in the template. The answers are `ja` / `nee` / `weet_niet`, all 11 required
(`require_answers`). Before the spec arrived this section said it was missing, and the 15 candidate questions
in the marketing review (`Zo_Veilig_marketingreview_Robi_Woeler.docx`, "kies 10-12") were deliberately not
turned into config; the final 11 are not that list, so don't reconcile the two.

The print PDF was not available, so the row layout follows the pakket-matcher's pill pattern
(`.zvm-opt`) rather than the PDF's layout.

## Odoo: needs work on Robi's side (not assumed to be handled)

- The Automation Rule's `record_getter` must handle `lead_type = checklist-langer-thuis`. Whether it
  tolerates unknown keys is **unknown**; earlier additions needed an explicit mapping before they
  landed (`contact_subject`/`message`, `order_number`..., see `docs/contact-odoo-dual-write-2026-09-16.md`).
- Map the 11 `lt_vr01` ... `lt_vr11` answer fields (see "Field spec"), `naam`/`name`, `email`, `consent`.
- `lead_temperature` arrives as `hot` for every `buildCallbackLead` lead, including this one. If a
  checklist download should not be a hot lead, that is a decision for Odoo or a one-line override here.
- The personalised results e-mail / PDF is Odoo's job. The page promises it ("binnen enkele minuten").

## Failure visibility: only half works until the backend allows the source

The theme side is done: a send that never leaves the browser (network error, timeout, exception) calls
`log-webhook-failure` with `source: "checklist_langer_thuis"` and no PII (tested with the network
intercepted). **The backend will reject that source:**

- `supabase/functions/log-webhook-failure/index.ts` `SOURCE_CODES` = `vista, camera_hardware,
  onderweg_coming_soon, chatbot` (`chatbot` is stale since the shelved chatbot).
- `webhook_failures_source_check` per migrations 008–010 allows only `vista`, `camera_hardware`,
  `onderweg_coming_soon`.

So a failed checklist send returns 400 `invalid_fields` and leaves no row. Same pre-existing gap as
`contact_page`, `herroepen_page` and `zelf_samenstellen`. It was not patched here: the deployed
constraint may differ from the migrations (hand edits) and nothing here can deploy or verify it. Fix =
add `checklist_langer_thuis` to `SOURCE_CODES` **and** to the check constraint (new migration, copying the
*live* list plus the new value), then deploy.

## Behaviour worth knowing

- `ZVLeadWebhook.send()` is fire-and-forget (`no-cors`, returns nothing). The visitor therefore sees the
  confirmation even if the POST failed; the failure only shows up in the failure log (see above). Same as
  every other lead form.
- One deliberate difference: if `window.ZVLeadWebhook` or `ZV_LEAD_ENDPOINT` is missing (setting blank,
  script not loaded), nothing was sent, so the form shows the "Er ging iets mis… bel 088 122 11 11" banner
  instead of promising an e-mail. The other forms would show success there. The banner is scrolled into view
  and focused: it sits at the top of a ~2000px card while the visitor is at the button (found in QA).
- Button label is "Ontvang mijn resultaten", not "Bekijk mijn resultaten": results are e-mailed, nothing
  is shown on the page. Setting `submit_label`.
- "Alle vragen verplicht" (default on) keeps every field to exactly three values. Setting `require_answers`.
- Honeypot (`website`) like contact/herroepen: a filled field looks successful and sends nothing.
- Consent text and its error come from `zv-form-copy` (`consent`, `consent_error`), as in the Vista and
  camera-hardware forms: "Ik geef toestemming dat Zo Veilig contact met mij opneemt over mijn aanvraag…".
  That wording covers being contacted about a request. The marketing review's own pre-publication list
  still says "Controleer AVG-toestemming voor marketingopvolging van checklistdownloads", and the answers
  describe a third party's daily routine and a carer's worries, so legal sign-off on the consent copy is an
  open item before this goes public.
- No dataLayer / ad-conversion event is fired for this form (none was requested; the Meta/Google ads point
  at this page, so marketing will probably want one).

## Shopify Page

Created through the Admin API on 2026-11-24, **unpublished**: `Page/701028073853`, title "Checklist Langer
Thuis", handle `checklist-langer-thuis`, template suffix `checklist-langer-thuis`, empty body. The template is
on the live theme since PR #190 (with 1 question); once the 11-question branch is merged it is complete, so
publishing no longer waits for the question list. It still needs a decision on the open items (Odoo `record_getter` for the new
`lead_type` and fields, the `log-webhook-failure` source, consent copy sign-off): until Odoo maps them a lead
may not land. Rename the title if wanted (it feeds `<title>`; the visible h1 is the section's `title`).

## Validation (2026-11-24)

- `check_pricing.py`: 2 failures (`langer-thuis-landing.liquid` and `zv-infrarood-installatie.liquid` literal
  prices), output byte-identical to a detached `origin/main` (2e609e4). Neither file is touched here; this
  change has no prices. `build_pricing.py` + `git diff --exit-code`: no generated-file drift.
- `shopify theme check`: 0 errors / 576 warnings, same as `origin/main`, no new offense and nothing in the
  new files. (A first draft raised 3 `UnclosedHTMLElement` for the lazily opened group wrapper; the wrapper
  tags are `echo`'d now, see the comment in the section.)
- Shopify's server-side validator: both files pushed to a disposable unpublished theme without error.
- Browser QA (headless Chromium, 29 checks, 1440 and 390 wide) against a throw-away fixture template with 11
  fake `qa_qNN_fixture` questions (never committed), with the Odoo and Supabase endpoints intercepted so no
  lead and no failure row left the machine: empty / partial / bad-email / no-consent submits blocked with
  nothing sent; valid submit sends exactly one POST with the payload above (11 answers verbatim, name trimmed,
  `consent === true`); success box in the viewport with the exact brief copy; aborted POST logs
  `checklist_langer_thuis` / `network_error` with no PII; blank endpoint shows the error banner in view, no
  success; honeypot; no `ZVMeasurement` fallback; arrow-key / Tab behaviour of the radios; no horizontal
  overflow at either width; duplicate and empty-field blocks skipped; wrapper divs balanced.
- The real template (1 question) was rendered on the disposable theme: only "Dagelijks ritme" shows.

### Validation of the 11-question template (2026-11-24, `feature/checklist-langer-thuis-questions-2026-11-24`)

- `shopify theme check`: 580 warnings / 0 errors on this branch and on `origin/main` 25a29d3, identical (no new offense, nothing in the checklist files).
- Shopify's server-side validator: the worktree was pushed to a disposable unpublished theme without error.
- Server render of the real template (`/pages/contact?view=checklist-langer-thuis` on that theme): 11 radio groups, 33 options; groups, fields and labels equal the template in order; success text and button label as configured.
- Browser (headless Chromium, 17 checks, Odoo and `log-webhook-failure` intercepted, nothing left the machine): 11 rows + 4 group headings + the details heading; no horizontal overflow at 1440 / 390; empty submit and 10 of 11 answered send nothing; the valid submit sends exactly one POST with `lead_type: checklist-langer-thuis`, all 11 real `lt_vr*` keys with the answers verbatim, `naam`/`name` trimmed, `email`, `consent: true`; success box shown; no failure-log call.
- Not re-tested here (unchanged section code, covered by the 29 checks above): arrow-key behaviour, honeypot, aborted POST, blank-endpoint banner. Still untested: a real lead into Odoo, Safari / Firefox, a screen reader.

**Not tested:** a real lead into Odoo (deliberately none sent); the real `log-webhook-failure` endpoint;
Safari / Firefox; a screen reader (the markup is `role="radiogroup"` + `aria-labelledby`, `role="alert"` /
`role="status"` banners, untested with AT); comparison with the print PDF.

Observation, not changed (site-wide): the contact FAB at the bottom-left can cover the left-aligned submit
button while it sits in the bottom ~80px of the viewport, and the mobile FAB overlaps content the same way.
