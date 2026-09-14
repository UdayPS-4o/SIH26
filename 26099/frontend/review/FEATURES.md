# CodeOne — Page Review

> ONECODE · National Unified Material Master
> Demo build — all 14 pages captured on 14 Sep 2026

---

## 1. Login — `/login`

**What it shows**

A clean centered card with the CodeOne brand mark and tagline "National Unified Material Master." An optional name field, a two-button role picker (Reviewer, Admin), and a Sign in button. Demo-mode notice at the bottom.

**Features**

- **Two roles for the demo.** Reviewer (view, search, approve/reject pairs, export) and Admin (full access, engine settings, threshold/weight configuration).
- **Demo gate, not a real gate.** Every input works without a backend. The chosen name and role are stored in `sessionStorage` so the rest of the console can read them.
- **Role badge in the top bar.** After sign-in, the top-right shows the chosen role alongside a theme toggle and the Simple/Technical mode switch.
- **Name persistence.** The operator name is read from `sessionStorage` on each session start, defaulting to "Steward" if nothing was stored.
- **No validation friction.** The name field is optional — clicking "Sign in" with an empty field stores "Steward" as the operator.

---

## 2. Dashboard — `/`

**What it shows**

A one-page standing report. A header strip shows the total items read and how many of the four government companies are loaded. Four stat tiles, a family bar chart, and a match-verdict donut chart fill the rest.

**Features**

- **"Where things stand" strip.** "20.34 lakh items read from 3 of 4 government companies." Every figure is counted from the loaded lists.
- **Live stat tiles:** Items read (total records in lakhs), Families (distinct categories), Matched pairs (scored by engine), Duplicates flagged (pairs at review threshold).
- **Family bar chart.** Bar chart of item families with exact counts below each bar.
- **Match verdict donut.** Breaks scored pairs into Accept (auto-approved), Review (needs human), Reject (different items).
- **Simple/Technical mode.** Toggle in the top bar switches between plain-language and technical labels.
- **Sidebar badge.** "Duplicate detection" link shows a count badge (e.g., "15") when pairs are waiting.
- **NothingLoaded state.** When no data is loaded, the dashboard shows a placeholder instead of empty tiles.

---

## 3. Overview — `/overview`

**What it shows**

A demo narrative page built in three numbered panels. Designed for live presentation — each panel walks the audience through one piece of the story, in order.

**Features**

- **Panel 01 — Add the fourth company.** Three masters are already loaded; the fourth is dragged onto the page and run through the pipeline live. The panel shows what the registry looked like before and after.
- **Panel 02 — One part, four names.** Four raw ERP strings for one physical part, pulled from the live registry. Three buttons let the audience take them apart at the visitor's pace. Every string is editable so the demo can be made to fail in public — when it does, it says which attribute disagreed.
- **Panel 03 — What it adds up to.** The same process measured across everything loaded. Totals come from the dashboard.
- **Live data.** Nothing on this page is a stored constant — strings come from the registry, scores from the match endpoint, codes from the minting function.
- **Editable fields.** Raw descriptions can be edited in front of the room to show real-time re-scoring.

---

## 4. Explorer — `/explorer`

**What it shows**

Item search and lookup. A search bar, family filter, and organisation chips at the top. Results table below shows records grouped by cluster.

**Features**

- **Free-text search.** Type a description in any shorthand form. The engine normalizes, scores, and returns matches with arithmetic visible.
- **Try-one shortcuts.** Four pre-loaded examples: abbreviated, spelled-out, one-size-apart, nothing-like-it.
- **Family filter.** Dropdown to filter by material family (Bearings, Pipes, Valves, Gaskets, etc.).
- **Organisation chips.** Toggle buttons per CPSE to show/hide records from that source.
- **Cluster grouping.** Results grouped by cluster — same item across companies shown as a "slice."
- **National code display.** Each cluster shows its assigned national code.
- **Share/Unique filters.** Toggle chips: "Shares a code with another company" vs "Unique to one company."
- **Descriptive context.** Explanatory text above the table explains how the slice was selected.

---

## 5. AI Material Matching — `/matching`

**What it shows**

The core matching interface. User types a material description; the engine returns scored matches with sub-score breakdowns.

**Features**

- **Matching input.** Search field with unit-of-measure dropdown (NOS, METER, KG, etc.).
- **Match results with score breakdown.** Each match shows overall score (0–1), lexical score, attribute score, numeric score.
- **National code recommendation.** Shows existing national code if above acceptance threshold, or proposed new code for new items.
- **Cluster view.** Matches grouped by cluster — records the engine considers the same item.
- **Score explanation.** Arithmetic shown: how three sub-scores combine into the final score.
- **Simple/Technical mode.** Toggle between plain-language ("Found 3 items") and technical ("3 records, score 0.87").
- **Empty state.** "Nothing loaded" message when no corpus is available.
- **Threshold indicators.** Color-coded match strength: green (likely same), amber (needs review), red (likely different).

---

## 6. Duplicate Detection — `/duplicates`

**What it shows**

A decision queue. Each row is a pair of records from different organisations waiting for a human decision.

**Features**

- **Pair cards.** Two records side-by-side with proposed national code in the middle.
- **Score indicator.** Color-coded bar: green (likely same), amber (needs review), red (likely different).
- **Decision buttons.** "Same item" (approve) and "Different items" (reject). Approving assigns the national code; rejecting marks them distinct.
- **Batch workflow.** Work through pairs one at a time with keyboard shortcuts.
- **Pending counter.** Sidebar badge shows pairs waiting (e.g., "15 pairs waiting for a decision").
- **Progress tracking.** Shows decided vs. remaining count.
- **Sticky actions.** After decision, the card flips to show the outcome and advances.
- **Proposed code display.** Shows the national code that would be minted on approval.
- **View mode toggle.** Simple: "Same item"/"Different items." Technical: "Approve"/"Reject."
- **Endpoint tags.** In Technical mode, shows the API call (e.g., POST /review/PAIR-2847).
- **Consistent counts.** Summary strip derives from the same store fields as the Activity page.

---

## 7. Savings — `/savings`

**What it shows**

Financial projection. Estimates what consolidation would save in annual spend across loaded organisations.

**Features**

- **Savings calculator inputs.** Average unit price, handling cost percentage, expected consolidation rate.
- **Annual spend display.** Total annual spend across loaded organisations for matched items.
- **Estimated savings.** Calculates saving from joint tendering: reduced unit price + reduced handling costs.
- **Per-organisation breakdown.** Savings broken down by CPSE (IOCL, NTPC, SAIL, CIL).
- **Conservative/Aggressive mode.** Toggle between conservative (fewer pairs consolidated) and aggressive estimates.
- **Indian notation formatting.** Large numbers formatted as lakhs/crores for readability.
- **Simple/Technical mode.** Toggle between plain-language and technical labels.
- **Real-time recalculation.** Changing any input immediately recalculates all downstream figures.

---

## 8. Registry (Code Book) — `/registry`

**What it shows**

The national code book — the deliverable. Every national code, its meaning, which local codes it replaced, and which organisations use it.

**Features**

- **Cluster table.** Each row is a national code (e.g., CNMC-BE-6235-2RS) with standard description, family, and member list.
- **Standard description.** Canonical description normalizing variations from different organisations.
- **Family assignment.** Each code tagged with material family.
- **Member expansion.** Click a row to expand and see all member records across organisations with local codes and original descriptions.
- **CSV export.** Download the entire code book as CSV: national code, standard description, family, organisation, local code, local description.
- **Status chips.** ACTIVE (approved and minted), PENDING (waiting for review), HOLD (under human review).
- **Derivation display.** Shows how the code was derived from the canonical signature — reproducible, not allocated.
- **Search and filter.** Filter by family, search by description or code.
- **Paginated table.** Large registries paginated for performance.
- **Standards badges.** Auto-detects IS, ASTM, ISO, DIN, BS standards in descriptions and shows colored badges.

---

## 9. Migration — `/migration`

**What it shows**

Code mapping and migration plan. Every record paired with its national code and the action needed to migrate it.

**Features**

- **Three action types:**
  - **MAP (Rename):** Local code becomes national code one-for-one. ERP team renames and moves on.
  - **MERGE (Combine):** Organisation holds multiple codes for same item. Two material numbers collapse into one. Stock, POs, and reservations must be moved first.
  - **HOLD (Not settled):** Record in a pair nobody has ruled on. Not safe for live master.
- **Per-organisation readiness.** Progress bars showing MAP+MERGE vs. HOLD per CPSE.
- **Filter by organisation.** Segmented control to view rows for a specific CPSE or all.
- **Summary stats:** Codes to move, Straight rename, Shared after migration (joint tendering opportunities), Held back.
- **CSV export.** Downloads migration mapping package: CPSE, local code, description, UOM, national code, standard description, family, action, merges with.
- **Audit log on export.** Every export writes an entry to the activity log.
- **Siblings display.** MERGE rows show which local codes are collapsing.
- **Shared-with display.** Shows which other organisations share the same national code post-migration.
- **Pagination.** 60 rows per page.

---

## 10. Integration — `/integration`

**What it shows**

Connector design for four source systems plus an illustrated traffic log.

**Features**

- **Connector cards per source:** ERP name, connector string, protocol badge (RFC/OData/JDBC/REST/SFTP), master size, loaded/not-loaded status.
- **Pulsing status dot.** Green when extract is "in hand" (loaded this session), amber when not.
- **Endpoint table.** Real BAPI/REST endpoints each connector would call, with illustrative latency budgets.
  - IOCL: `BAPI_MATERIAL_GETLIST`, `BAPI_MATERIAL_GET_DETAIL` (RFC)
  - NTPC: `API_PRODUCT_SRV/A_Product` (OData GET)
  - SAIL: `apps.mtl_system_items_b`, `apps.mtl_descriptive_elements` (SQL)
  - CIL: `material_master_nightly.csv` (SFTP)
- **Sync log.** Animated list of recent sync events with timestamp, CPSE, records, endpoint.
- **Traffic animation.** Flowing line animation simulating data between connectors (illustrative).
- **Honesty banner.** States explicitly: "Nothing in this prototype polls an ERP. The parts that are real are labelled real."
- **No fake connection dots.** Sidebar does not show green connection indicators per source.

---

## 11. Import — `/import`

**What it shows**

Data ingestion interface for loading new ERP extracts.

**Features**

- **Four input methods:** Paste rows, Upload a file, One item (type a line), Sample lists (pre-loaded CSVs for BHEL, CIL, GAIL, HAL).
- **Organisation selector.** Dropdown to choose CPSE (BHEL, IOCL, NTPC, SAIL, CIL, GAIL, HAL).
- **Column mapping preview.** Preview of first rows with column-to-schema mapping — auto-detects SAP MATNR/MAKTX, Oracle, hand-kept spreadsheet headers. Operator can correct mapping before ingest.
- **Validation.** Checks for required columns, duplicate local codes, empty descriptions. Shows error count.
- **Three result groups:** Already known (existing national code assigned), Needs review (similar but not settled), New items (minted new code).
- **Load button.** Triggers ingest pipeline — reads file, normalizes, scores against corpus, clusters, mints codes.
- **Progress indication.** Record count shown during processing.
- **Source list update.** Sidebar ITEM LISTS updates to show new source as LOADED.
- **Activity log entry.** Logs: "Loaded [CPSE] [ERP] extract — N records read from material master."

---

## 12. Normalize — `/normalize`

**What it shows**

Material standardization results after loading an extract.

**Features**

- **Normalization summary.** Counts of short forms expanded, unit variants resolved, families assigned.
- **Before/after view.** Original raw description vs. normalized version side by side.
- **Short-form dictionary.** Shows which abbreviations were expanded (NB → MM, SCH → Schedule, etc.).
- **Unit normalization.** Shows which unit abbreviations were resolved.
- **Family classification.** Shows assigned family, marked whether read or guessed.
- **Confidence indicator.** Records with guessed families are visually distinct.
- **Filter by CPSE.** Filter results by source organisation.
- **Search.** Search within normalized records by description or local code.
- **Override capability.** For guessed families, user can override the classification.
- **Activity log entry.** Logs: "Normalized [CPSE] extract: expanded N short forms, resolved M unit variants."

---

## 13. Activity / Audit Trail — `/activity`

**What it shows**

Complete audit log of every action — every load, match, approve, reject, mint, config change, and export.

**Features**

- **Summary strip (4 tiles):**
  - Approved by a person / Approved this session
  - Rejected by a person / Rejected this session
  - Codes settled here / Codes confirmed this session
  - Still waiting on a person / Open for review
  - All derived from same store fields as the Duplicates page.
- **By-actor table.** Every person who has acted: Name, Agreed, Rejected, Other, Total, Agreement rate. Click to filter.
- **Filters:** Action type, Organisation, Actor, Free-text search across detail field.
- **CSV export.** Downloads filtered log with columns: entry, recorded_at_iso, recorded_at_local, action, actor, organisation, national_code, what_happened, endpoint.
- **Timestamp formatting.** ISO 8601 for CSV, Indian locale for table.
- **Color-coded action chips.** Approve (green), Reject (red), Others (neutral).
- **Seeded data.** Ships with 30 pre-seeded entries showing realistic session history.
- **Animation.** New entries slide in; existing entries are static.

---

## 14. Engine — `/engine`

**What it shows**

Scoring engine configuration and methodology.

**Features**

- **Four-step methodology panel:** Normalize → Ingest → Pair → Cluster. Each with cost indicators (endpoint, latency, records scanned).
- **Request log.** Live log of every API call with method, endpoint, latency, records scanned.
- **Weight sliders:** Lexical (shared tokens), Attribute (slot agreement), Numeric (shared numbers).
- **Threshold controls:** Accept threshold, Review threshold — with live-updating labels showing current values.
- **Reset to defaults.** Button to restore original values.
- **Health panel:** Records indexed, Distinct national codes, Codes with duplicates, Duplicate records.
- **Dictionary management.** View and add custom short-form expansion rules.
- **Pair scoring explanation.** Arithmetic: how sub-scores combine into final score.
- **Threshold histogram.** Visual distribution of scores across all pairs with Accept/Review/Reject zones.
- **Cluster count.** Number of connected components at current thresholds.
- **Simple/Technical mode.** Toggle between plain-language and technical labels.

---

## Screenshots

All 14 pages captured at 1400×900 viewport:

| # | File | Page |
|---|------|------|
| 1 | `01-login.png` | Login |
| 2 | `02-dashboard.png` | Dashboard |
| 3 | `03-overview.png` | Overview |
| 4 | `04-explorer.png` | Explorer |
| 5 | `05-matching.png` | AI Material Matching |
| 6 | `06-duplicates.png` | Duplicate Detection |
| 7 | `07-savings.png` | Savings |
| 8 | `08-registry.png` | Registry / Code Book |
| 9 | `09-migration.png` | Migration |
| 10 | `10-integration.png` | SAP / ERP Integration |
| 11 | `11-import.png` | Import / Ingestion |
| 12 | `12-normalize.png` | Normalization |
| 13 | `13-activity.png` | Activity / Audit Trail |
| 14 | `14-engine.png` | Engine |
