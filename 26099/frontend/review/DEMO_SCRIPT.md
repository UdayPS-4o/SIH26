# CodeOne — 2.5 Minute Demo Video Script
## AI-Driven Standardization & Harmonization of Material Codes Across CPSEs
### PS 26099 | CPCL | Smart Automation

**Style: Single continuous screen recording, voiceover throughout. One flow, no scene cuts. Start at Dashboard, end at Activity log.**

---

## Download these CSVs before recording

The script references real files served by the dev server. Download them before the shoot so they are ready on desktop:

| File | What it contains | Rows | Download link |
|---|---|---|---|
| `bhel-materials.csv` | BHEL MRO list — bearings, bolts, gaskets, pipes | 42 | `http://localhost:5173/samples/bhel-materials.csv` |
| `cil-materials.csv` | CIL in-house extract — cables, structural steel | 21 | `http://localhost:5173/samples/cil-materials.csv` |
| `gail-materials.csv` | GAIL pipeline list — pipes, valves, fittings | 38 | `http://localhost:5173/samples/gail-materials.csv` |
| `hal-messy.csv` | HAL ragged export — odd headers, messy rows | 34 | `http://localhost:5173/samples/hal-messy.csv` |
| `iocl-sap-ecc.csv` | IOCL SAP ECC extract (full master slice) | 96 | `http://localhost:5173/masters/iocl-sap-ecc.csv` |
| `ntpc-s4hana.csv` | NTPC SAP S/4HANA extract (full master slice) | 92 | `http://localhost:5173/masters/ntpc-s4hana.csv` |
| `sail-oracle-ebs.csv` | SAIL Oracle EBS extract (full master slice) | 98 | `http://localhost:5173/masters/sail-oracle-ebs.csv` |
| `cil-inhouse.csv` | CIL in-house system extract (full master slice) | 91 | `http://localhost:5173/masters/cil-inhouse.csv` |

The app seeds with IOCL, NTPC, and SAIL already loaded. You only need to upload `bhel-materials.csv` during the demo.

---

## The Flow (one continuous screen recording)

### [0:00 – 0:20] OPENING — Dashboard

**[Screen: `/` — Dashboard. Sidebar shows IOCL ✓, NTPC ✓, SAIL ✓, CIL ○ under ITEM LISTS]**

**VO:** "India's CPSEs each run their own ERP. The same bearing has four different codes, four different descriptions. CodeOne fixes that."

**VO:** "This is the Dashboard. Three companies are already loaded — IOCL, NTPC, SAIL. You see 20.34 lakh items, the family breakdown, and how many pairs the engine has already settled versus how many need a human to look at them."

**[Mouse hovers over the three stat tiles: Items Read → Families → Matched Pairs → Duplicates flagged]**

**VO:** "Every number is live. No mock data. This is what three real material masters look like when you put them on the same page."

---

### [0:20 – 0:40] THE PROBLEM — Overview, Panel 02

**[Click sidebar: Overview. Screen: `/overview`, Panel 02 — "One part, four names"]**

**VO:** "Here is the problem in one screen. One physical bearing. Four ERP systems. Four completely different descriptions."

**[Highlight the four raw strings]**

- IOCL: `BALL BRG 6205 2RS SKF`
- NTPC: `Bearing Ball 6205`
- SAIL: *(its version)*
- BHEL: *(its version)*

**VO:** "IOCL abbreviates it. NTPC spells it out. SAIL and BHEL write it differently again. Same part. Four names. A buyer cannot tell they are the same."

**VO:** "Now watch what the engine does."

**[Click the "Score" button — scores appear next to each pair]**

**VO:** "It normalizes every description, compares word by word and attribute by attribute, and returns a score. The arithmetic is visible — not a black box."

**[Cut back to Dashboard — `/`]**

---

### [0:40 – 1:05] THE LIVE DEMO — Import BHEL

**[Click sidebar: Import. Screen: `/import`]**

**VO:** "Now let's bring in a fourth company. BHEL arrives with its own material master."

**VO:** "The Import page has four ways in — paste rows, upload a file, type one line, or pick a sample. I'll use the sample."

**[Click: "Sample lists" tab → select "A tidy list with a high overlap" (BHEL)]**

**VO:** "BHEL materials — 42 rows of bearings, bolts, gaskets. Watch the column mapper."

**[Column mapping preview appears with auto-detected headers]**

**VO:** "The engine reads the headers and figures out what each column is. Material Code, Description, UOM, Organisation — all detected automatically. I can correct any mapping before we load."

**[Click: "Load and score"]**

**VO:** "The ingest pipeline runs now. Normalize every description, score each row against the existing corpus of 20 lakh items, cluster matches, mint national codes for anything new."

**[Progress indicator runs — three result groups appear]**

**VO:** "Three groups. Already known — the engine found an existing national code. Needs review — similar, but a person should confirm. New items — nothing matched, a new code was minted."

**[Point to each group]**

**VO:** "Look at the 'Already known' group. BHEL's `BEARING BALL DG 6205 2RS` matched against IOCL's `BALL BRG 6205 2RS SKF`. Score 0.91. Same item. Same national code assigned. That is the engine working."

**VO:** "And look — the sidebar ITEM LISTS now shows BHEL with a checkmark. The registry just grew."

**[Quick glance at sidebar]**

---

### [1:05 – 1:30] HUMAN REVIEW — Duplicates Queue

**[Click sidebar: Duplicates. Screen: `/duplicates`]**

**VO:** "Pairs the engine wasn't confident about — scores in the amber zone — go to the human review queue. This is the governance layer. The AI proposes. The human disposes."

**[Point to the first pair card — green bar, high score]**

**VO:** "Each card shows two records side by side. The color bar tells you how confident the engine is. Green — almost certainly the same. Amber — needs a human eye."

**[Point to the proposed national code in the middle of the card]**

**VO:** "The proposed national code sits right between them. Approve it, and both records carry that code from this point forward."

**[Click: "Same item" (approve)]**

**VO:** "One click. Approved. The card flips, the sidebar badge drops by one, and the decision is logged."

**[Point to the flipped card]**

**VO:** "Both records now carry the same national code. If I go to the Registry, I can expand that code and see every company holding it."

---

### [1:30 – 1:50] GOVERNANCE — Activity / Audit Trail

**[Click sidebar: Activity. Screen: `/activity`]**

**VO:** "Every action is logged here. Every load, every match, every approve, every reject — timestamped, attributed, searchable."

**[Point to the summary strip at the top]**

**VO:** "The summary strip shows the session totals. Approved this session, rejected this session, codes confirmed, still waiting."

**[Point to the new entry at the top of the log]**

**VO:** "There it is. The approval we just made. Action: approved. Actor: the reviewer name. Detail: which pair, which code, what was decided. Endpoint: the API call. Timestamped to the second."

**[Click the CSV export button]**

**VO:** "Export the entire log as CSV. Board-ready. Compliance-ready."

---

### [1:50 – 2:10] THE ENGINE — How Scoring Works

**[Click sidebar: Engine. Screen: `/engine`]**

**VO:** "Let me show you this is not magic. The Engine page exposes everything."

**[Point to the four-step methodology panel]**

**VO:** "Four steps: Normalize, Ingest, Pair, Cluster. Each with its own cost profile. These are the real stages the pipeline runs through when you click Load."

**[Point to the weight sliders]**

**VO:** "Three weights control the score. Lexical — how many words match. Attribute — do the units, families, and specs agree. Numeric — are the sizes compatible."

**[Drag the Lexical slider slightly — histogram shifts]**

**VO:** "Watch the histogram. The Accept zone, the Review zone, the Reject zone. Change a weight and every score in the system moves with it. One engine, one set of rules — the Matching page and the Duplicates queue cannot contradict each other."

**[Point to the dictionary section]**

**VO:** "And here — the short-form dictionary. 'NB' expands to 'MM.' 'SCH' to 'Schedule.' You can add rules at runtime. If a company uses an abbreviation the engine does not know, you add it here and it applies to every record from then on."

---

### [2:10 – 2:25] THE DELIVERABLE — Registry + Migration

**[Click sidebar: Registry. Screen: `/registry`]**

**VO:** "The Registry is the deliverable. The National Code Book."

**[Click a row to expand it]**

**VO:** "Every code derived from the canonical signature of the cluster — reproducible, not allocated. Run the engine again with the same inputs, you get the same codes."

**[Point to the expanded member list]**

**VO:** "Here are the members — IOCL's original code, NTPC's original code, BHEL's. All mapped to one national code. Export as CSV. The ERP team loads it. Done."

**[Click sidebar: Migration. Screen: `/migration`]**

**VO:** "The Migration page tells every company exactly what to do. MAP — rename the code. MERGE — collapse duplicates. HOLD — wait for a decision. Export the mapping package."

---

### [2:25 – 2:40] CLOSING

**[Click sidebar: Dashboard. Screen: `/`]**

**VO:** "That is CodeOne. Dashboard, Overview, Import, Normalize, Matching, Duplicates, Registry, Migration, Integration, Explorer, Savings, Activity, Engine. Thirteen pages. One pipeline."

**VO:** "Eight problem statement requirements, eight working pages. Real scoring, real clustering, real normalization. The import actually works — paste a CSV, upload a file, or pick a sample. The audit trail logs everything. And the engine is not a black box — the weights, the thresholds, the arithmetic, all visible."

**VO:** "One Nation. One Material Code."

**[Text overlay: CodeOne — ONECODE | PS 26099 | CPCL | Ministry of Petroleum & Natural Gas]**

**[Fade out]**

---

## Timing Breakdown

| Segment | Duration | Pages | What to show |
|---|---|---|---|
| Opening hook | 0:00 – 0:20 | Dashboard | Stat tiles, sidebar ITEM LISTS (3 loaded) |
| The problem | 0:20 – 0:40 | Overview → Dashboard | Four names panel, score button, back |
| **Live import** | **0:40 – 1:05** | **Import** | **Pick BHEL sample → Load → three result groups → sidebar update** |
| **Human review** | **1:05 – 1:30** | **Duplicates** | **Approve a pair, see card flip, badge update** |
| **Audit trail** | 1:30 – 1:50 | Activity | New approval entry, CSV export |
| Engine internals | 1:50 – 2:10 | Engine | Weights, histogram shift, dictionary |
| Deliverable | 2:10 – 2:25 | Registry → Migration | Expand row, mapping table |
| Closing | 2:25 – 2:40 | Dashboard | Full screen, text overlay |
| **Total** | **~2:35** | | |

## Presenter Notes

- **One continuous screen recording.** No scene cuts. Navigate with clicks. The story flows from problem → import → review → audit → engine → deliverable.
- **The live import is the hero moment.** This is where judges see the app actually work. Let it breathe — show the column mapping, the three result groups, the sidebar updating.
- **The approve click is the second hero moment.** One click, card flips, badge drops, log entry appears. Show the chain of consequence.
- **Do not skip the Activity page.** It is the proof that every decision is logged. This is what separates a demo from a product.
- **End on Dashboard.** Full numbers, full charts. Leaves the impression of a complete system.
- **If the import takes more than 10 seconds, narrate over it.** "The engine is normalizing, scoring, and clustering 42 rows against 20 lakh records — all in your browser, no server."
