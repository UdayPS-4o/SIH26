# CodeOne — Demo Video Script
## AI-Driven Standardization & Harmonization of Material Codes Across CPSEs
### Problem Statement 26099 | Smart Automation | Ministry of Petroleum & Natural Gas | CPCL

---

## Opening (0:00 – 0:30)

**[Camera: Presenter standing before a screen showing the login page — `01-login.png`]**

**Presenter:** "Every year, India's public sector companies — IOCL, NTPC, SAIL, and others — buy thousands of similar materials but each company assigns its own code, description, and unit. The same bearing, the same valve, the same gasket has four different names and four different numbers. This is the problem we are solving."

**Presenter:** "What you are looking at is CodeOne — One Nation, One Material Code. A single platform that reads material masters from every CPSE, understands what they actually are, and assigns a Common National Material Code everyone can use."

**[Click: Sign in as Admin → Dashboard appears — `02-dashboard.png`]**

**Presenter:** "Let me show you how it works."

---

## Page 01 — Dashboard (0:30 – 1:00)

**[Screen: `02-dashboard.png` — Dashboard with stat tiles, family bar chart, donut chart]**

**Presenter (voiceover):** "The Dashboard is the standing report. At a glance, you see how many records are loaded, how many distinct material families have been identified, how many matched pairs the engine has scored, and how many are waiting for a human decision."

**Presenter (on camera):** "Right now, 20.34 lakh items from three government companies — IOCL, NTPC, and SAIL — are loaded into the engine. The family bar chart shows the breakdown by material type. The donut shows how many pairs the engine settled automatically versus how many need a reviewer to look at them."

**Presenter:** "This is not a mock-up. Every number here is calculated from the actual loaded records in real time."

**[Click sidebar: Overview — `03-overview.png`]**

---

## Page 02 — Overview / Demo Narrative (1:00 – 2:30)

**[Screen: `03-overview.png` — Three-panel narrative page]**

**Presenter (voiceover):** "The Overview page is the story. It is designed for live presentation, so the audience follows the logic step by step."

**Panel 01 — Add the fourth company:** "We start with three companies already in the system. The fourth company — say, CIL — arrives with its own material master. We load it right here, in front of you, and you can see exactly what the registry looked like before and after."

**Panel 02 — One part, four names:** "Here is the core of the problem. Four ERP systems, one physical bearing, four completely different descriptions. The engine takes them apart and shows you which words match, which clash, and why. And here is the key — every description is editable. I can change a word and watch the score update in real time."

**[Presenter edits a description on screen — score changes live]**

**Presenter:** "If it fails, it tells you exactly which attribute disagreed. This is transparency, not a black box."

**Panel 03 — What it adds up to:** "This is the same process measured across everything loaded. These totals come from the dashboard. Nothing here is hard-coded."

**[Click sidebar: Explorer — `04-explorer.png`]**

---

## Page 03 — Explorer (2:30 – 3:00)

**[Screen: `04-explorer.png` — Search interface with filters]**

**Presenter (voiceover):** "The Explorer is where a buyer or stores officer goes to find what already exists. They type a description in any shorthand form — 'brg' or 'bearing' or 'ball brg 6205' — and the engine normalizes, scores, and returns every match."

**Presenter (on camera):** "You can filter by material family, toggle individual companies on or off, and see whether an item is shared across companies or unique to one. The national code is right there on every result. This is the answer to the question: does anybody already buy this, and under what code?"

**[Click sidebar: AI Material Matching — `05-matching.png`]**

---

## Page 04 — AI Material Matching (3:00 – 3:45)

**[Screen: `05-matching.png` — Matching input with score breakdown]**

**Presenter (voiceover):** "The Matching page is the recommendation engine. A buyer stands at a counter and types in what they need. The engine returns the four closest things in the country with their scores."

**Presenter (on camera):** "Every match shows the overall score, broken down into three parts: lexical — how many words match; attribute — do the units, families, and specs agree; numeric — are the sizes and quantities compatible. The arithmetic is visible on screen."

**Presenter:** "If a match is above the acceptance threshold, it gets a national code automatically. If it is in the review zone, it goes to the queue for a human to decide. If nothing is close enough, a new code is minted."

**[Click sidebar: Duplicate Detection — `06-duplicates.png`]**

---

## Page 05 — Duplicate Detection (3:45 – 5:00)

**[Screen: `06-duplicates.png` — Pair decision queue]**

**Presenter (voiceover):** "The Duplicates page is the human review queue. The engine has found pairs of records that might be the same item. A reviewer makes the final call."

**Presenter (on camera):** "Each card shows two records side by side, with the proposed national code in the middle. The color bar tells you how confident the engine is. Green — it is almost certainly the same item. Amber — needs a human eye. Red — these are different things."

**[Presenter clicks "Same item" on a pair]**

**Presenter:** "One click. The pair is approved, the national code is assigned, and the card flips to show the outcome. The sidebar badge updates instantly. This is the governance layer — the AI proposes, the human disposes."

**[Click sidebar: Savings — `07-savings.png`]**

---

## Page 06 — Savings (5:00 – 5:45)

**[Screen: `07-savings.png` — Financial calculator with per-organisation breakdown]**

**Presenter (voiceover):** "The Savings page answers the money question. If we consolidate these codes and let companies buy together, how much do we save?"

**Presenter (on camera):** "Three inputs drive everything: average unit price, handling cost, and the expected consolidation rate. I can switch between conservative and aggressive estimates. The numbers are formatted in lakhs and crores so they are immediately readable."

**[Presenter adjusts a slider]**

**Presenter:** "Every change recalculates instantly. The per-organisation breakdown shows what each CPSE saves individually. This is the business case for the project in one screen."

**[Click sidebar: Registry — `08-registry.png`]**

---

## Page 07 — Registry / Code Book (5:45 – 6:45)

**[Screen: `08-registry.png` — Code book table with expandable rows]**

**Presenter (voiceover):** "The Registry is the deliverable. This is the National Code Book — every national code, its standard description, the family it belongs to, and every local code it replaced."

**Presenter (on camera):** "Every code is derived from the canonical signature of the cluster — it is reproducible, not allocated. That means if you run the engine again with the same inputs, you get the same codes. No randomness, no guesswork."

**[Presenter expands a row]**

**Presenter:** "Click any row and you see every member record — the original local code from each company, the original description. Status chips show whether a code is ACTIVE, PENDING, or HOLD. You can filter by family, search by description, and export the entire code book as CSV for the ERP team to load."

**[Click sidebar: Migration — `09-migration.png`]**

---

## Page 08 — Migration (6:45 – 7:30)

**[Screen: `09-migration.png` — Migration plan with three action types]**

**Presenter (voiceover):** "The Migration page tells every company exactly what to do with their existing codes. Three actions, no ambiguity."

**Presenter (on camera):** "MAP — the local code becomes the national code, one for one. The ERP team renames and moves on. MERGE — this company has two codes for the same item. They need to collapse them into one. Stock, purchase orders, and reservations have to be moved first. HOLD — this pair has not been settled yet. Not safe for the live master."

**[Presenter switches organisation filter]**

**Presenter:** "Each company sees its own readiness — how many are ready to move versus how many are held back. And the export downloads the complete mapping package: local code, national code, action required, what to merge with."

**[Click sidebar: Integration — `10-integration.png`]**

---

## Page 09 — SAP / ERP Integration (7:30 – 8:15)

**[Screen: `10-integration.png` — Four connector cards with endpoint table]**

**Presenter (voiceover):** "Integration is where we show how CodeOne talks to the systems companies already use. Four connectors, four protocols."

**Presenter (on camera):** "IOCL uses SAP RFC — BAPI_MATERIAL_GETLIST and BAPI_MATERIAL_GET_DETAIL. NTPC uses OData — the standard S/4HANA product service. SAIL uses JDBC against Oracle EBS. CIL uses SFTP — a nightly CSV drop."

**[Presenter points to the endpoint table]**

**Presenter:** "Each row shows the exact endpoint, the protocol, and the latency budget. This is not a concept — these are the real endpoints a systems integrator would call. The traffic animation shows data flowing between connectors. And we are honest about what this prototype does and does not do — the banner at the top says it plainly."

**[Click sidebar: Import — `11-import.png`]**

---

## Page 10 — Import / Ingestion (8:15 – 9:30)

**[Screen: `11-import.png` — Four input methods with column mapping]**

**Presenter (voiceover):** "The Import page is how a new company gets its data into the system. Four ways in, because every company's export is different."

**Presenter (on camera):** "Paste rows — copy from a spreadsheet and drop it in. Upload a file — drag and drop a CSV. One item — just type a single line. Or pick from our sample lists — BHEL, CIL, GAIL, HAL, each with a realistic extract."

**[Presenter selects a sample file]**

**Presenter:** "Watch the column mapping. The engine reads the headers and auto-detects what each column is. SAP MATNR, MAKTX — it knows these names. Oracle ITEM_NUMBER, ITEM_DESCRIPTION — same thing. Even a messy export from HAL with ragged rows."

**[Presenter clicks Load]**

**Presenter:** "The ingest pipeline runs: normalize, score against the existing corpus, cluster, mint codes. Three result groups appear — already known, needs review, and genuinely new. Each row gets a national code or a recommendation."

**[Click sidebar: Normalize — `12-normalize.png`]**

---

## Page 11 — Normalize (9:30 – 10:15)

**[Screen: `12-normalize.png` — Before/after normalization view]**

**Presenter (voiceover):** "Normalization is the first step of the pipeline, and it is where the AI does its quietest, most important work."

**Presenter (on camera):** "Every raw description from every company is run through the normalizer. Short forms are expanded — 'NB' becomes 'MM', 'SCH' becomes 'Schedule'. Unit variants are collapsed — 'PCS', 'NOS', 'EA' all resolve to a canonical UOM. And every record is assigned a material family."

**[Presenter shows before/after]**

**Presenter:** "Before: 'BH-100241, BALL BRG 6205 2RS SKF, NOS.' After: 'Ball Bearing 6205 2RS, Number.' Every abbreviation resolved, every unit canonical, family tagged as Bearings. And if the engine is not sure about a family, it flags it — the reviewer can override with one click."

**[Click sidebar: Activity — `13-activity.png`]**

---

## Page 12 — Activity / Audit Trail (10:15 – 10:45)

**[Screen: `13-activity.png` — Audit log with actor table and filters]**

**Presenter (voiceover):** "Governance is not optional in a system that assigns codes to materials used across government companies. Every action is logged here."

**Presenter (on camera):** "Every load, every match, every approve, every reject, every config change, every export — timestamped, attributed, searchable. The summary strip at the top shows the session totals. The by-actor table shows who did what and their agreement rate."

**[Presenter applies a filter]**

**Presenter:** "Filter by action type, by organisation, by person. Export the filtered log as CSV. This is your audit trail for the board, for compliance, for any audit."

**[Click sidebar: Engine — `14-engine.png`]**

---

## Page 13 — Engine Configuration (10:45 – 11:30)

**[Screen: `14-engine.png` — Four-step methodology with weight sliders and threshold histogram]**

**Presenter (voiceover):** "The Engine page is where the scoring logic lives. This is not a black box — the methodology is visible, the weights are adjustable, and the math is shown on screen."

**Presenter (on camera):** "Four steps: Normalize, Ingest, Pair, and Cluster. Each with its own cost profile. The weight sliders control how much the engine values word similarity versus attribute agreement versus numeric match."

**[Presenter adjusts a weight slider]**

**Presenter:** "Watch the threshold histogram shift. The Accept zone, the Review zone, the Reject zone — all update live. If you change a weight, every score on the Matching page and every verdict in the Duplicates queue moves with it. One engine, one set of rules, no contradictions."

**[Presenter points to the dictionary section]**

**Presenter:** "And here — the short-form dictionary. You can add new rules at runtime. If a company uses an abbreviation the engine does not know, you add it here and it applies to every record from that point on."

---

## Closing (11:30 – 12:00)

**[Camera: Presenter returns to full frame. Behind them: the Dashboard on the big screen — `02-dashboard.png`]**

**Presenter:** "That is CodeOne. Fourteen pages, one pipeline, one engine. Let me be direct about what this delivers."

**Presenter:** "One — AI-based matching of material descriptions across companies, with visible scoring arithmetic. Two — duplicate and near-duplicate detection, with a human review queue. Three — automated standardization of descriptions and attributes. Four — intelligent classification into material families. Five — a Common National Material Code, derived reproducibly from the data, not allocated by hand. Six — migration mapping for every existing code. Seven — a full audit trail for governance. And eight — integration connectors for SAP, Oracle, and other ERP systems."

**Presenter:** "The result is what the problem statement asked for: One Nation, One Material Code. Every code traceable to its source. Every decision logged. Every number real."

**Presenter:** "Thank you. Questions?"

---

## Feature Gap Analysis

### What the PS asked for vs what we built

| PS Requirement | Status | Where |
|---|---|---|
| AI-based matching of material descriptions and specs across CPSEs | **DONE** | Matching page, Explorer page — engine scores lexical + attribute + numeric |
| Identification of duplicate, near-duplicate, equivalent materials | **DONE** | Duplicates page — pair queue with Accept/Review/Reject verdicts |
| Automated standardization of descriptions and technical attributes | **DONE** | Normalize page — short-form expansion, unit normalization, family classification |
| Intelligent classification and categorization | **DONE** | Engine normalizer assigns families from a labelled corpus |
| Common National Material Code generation | **DONE** | Registry page — codes derived from canonical signatures, reproducible |
| Mapping of existing CPSE codes to national code | **DONE** | Migration page — MAP, MERGE, HOLD actions with CSV export |
| Legacy code rationalization and migration support | **DONE** | Migration page — merge sequencing, sibling display, progress bars |
| User validation and approval workflow | **DONE** | Duplicates page — approve/reject per pair, activity log records every decision |
| Dashboard for analytics and duplicate detection | **DONE** | Dashboard page — stat tiles, family chart, donut, sidebar badges |
| Audit trail and governance | **DONE** | Activity page — full log with filters, actor table, CSV export |
| SAP/ERP integration capability | **DONE** | Integration page — connector cards, endpoint table, protocol badges |
| Ingest/load new material masters | **DONE** | Import page — four input methods, column mapping, three-result ingest pipeline |

### What is real vs illustrative

| Component | Status | Notes |
|---|---|---|
| Normalization engine | **REAL** | Runs in-browser, expands short forms, resolves units, assigns families |
| Scoring engine | **REAL** | Three sub-scores (lexical, attribute, numeric), weighted, thresholded |
| Clustering | **REAL** | Builds pairs, connected components, derives national codes from canonical signatures |
| CSV parsing | **REAL** | Two-pass column mapping with exact + fuzzy header detection |
| Column mapping | **REAL** | Handles SAP MATNR/MAKTX, Oracle EBS, hand-kept spreadsheets, ragged rows |
| Ingest pipeline | **REAL** | Reads CSV, normalizes, scores, clusters, mints — all in-browser |
| Activity log | **REAL** | Every action recorded in service state, visible on Activity page |
| Sample data | **REAL** | Ships with IOCL, NTPC, SAIL material records — no backend needed |
| ERP connectors | **ILLUSTRATIVE** | Interface shows endpoint design and protocol; no live ERP polling |
| Traffic animation | **ILLUSTRATIVE** | Visual effect only, labelled as such |
| Latency numbers | **ILLUSTRATIVE** | Budget numbers shown for design reference |

### What is NOT in the prototype (and why)

| Missing | Reason | Mitigation |
|---|---|---|
| Live ERP polling | No backend; prototype runs entirely in-browser | Integration page shows exact endpoints and protocol badges; honest banner states this |
| Per-CPSE login/auth | Demo console for a central team; not a multi-tenant system | Two-role model (Reviewer, Admin) covers the decision workflow |
| Persistent storage | sessionStorage only; clears on tab close | Seeded sample data ensures demo works every time without setup |
| Backend API | Prototype architecture; all engine logic in-browser | Endpoints module mirrors real API paths so swap is a config change |
| Real-time multi-user | Single-session demo | Not needed for PS evaluation; architecture supports backend swap |

### Why this wins

1. **Completeness.** Every PS requirement is addressed on a dedicated page. Not a wireframe — working software with real scoring, real clustering, real normalization.
2. **Transparency.** The scoring arithmetic is visible on screen. Codes are derived, not allocated. The audit trail records every decision. Judges can verify every number.
3. **Working import/CSV parsing.** The Import page accepts pasted rows, file upload, single lines, and sample CSVs. The column mapper auto-detects SAP, Oracle, and generic headers. The ingest pipeline normalizes, scores, clusters, and mints — all in the browser.
4. **Live demo capability.** The Overview page is designed for presentation. Editable fields, live re-scoring, before-and-after panels. A 5-minute demo tells the complete story.
5. **Production path.** The API layer is already abstracted. The endpoint module names real BAPI/REST paths. The architecture is a configuration change away from a FastAPI backend.
