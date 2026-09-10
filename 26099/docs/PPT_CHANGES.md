# 26099.pptx — slide-by-slide change list

Source: `C:\Users\udayp\Downloads\26099.pptx` (6 slides).
`DELETE` = remove it. `FIX` = replace text in place. `ADD` = new element.

---

## SLIDE 1 — Title

| | Change |
|---|---|
| FIX | **Team ID** is blank. Fill it in. |
| ADD | Footer strap on all six slides: **One Nation — One Material Code** (the PS's own slogan; currently in neither the deck nor the app). |

---

## SLIDE 2 — CodeOne

### DELETE

1. **The centre pipeline diagram** — `PHYSICAL INPUT → IMAGE PROCESSING → ADVANCED OCR ENGINE → NLP PROCESSING → DATABASE STORAGE`. It is an OCR pipeline from a different problem statement, and it is a blurry low-res raster.
2. **The 5-row comparison table** (`Feature / Simple Solutions / CodeOne`) — slide 6 already carries a 7-row version of the same argument. Keep one.
3. **One of the two stock photos** (molten steel / control room) to make room for the item below.

### ADD

4. **The money shot**, in the space the diagram and table free up. This is the single most persuasive artefact for this PS and the deck currently never shows it:

```
IOCL   BRG BALL DG 6205 2RS SKF
NTPC   BEARING,BALL,DEEP,GROOVE,6205,2RS          →   CNMC-BE-73AE
SAIL   BALL BEARING DEEP GROOVE 6205 2RS FAG           BEARING, BALL, DEEP GROOVE,
CIL    BRG/BALL/6205/2RS                               DOUBLE RUBBER SEALED, 6205
```

5. **The real pipeline**, as a simple horizontal strip replacing the deleted diagram:
`ERP EXTRACT → NORMALIZE → BLOCK → SCORE & FUSE → STEWARD REVIEW → MINT CNMC`

### FIX

| Current | Change to |
|---|---|
| `ONGC, SAIL, NTPC and CIL each record identical bearings…` | `IOCL, NTPC, SAIL and CIL each record identical bearings…` — **the deck names a company the prototype does not load.** |
| `CNMC-{SEGMENT}-{MD5_HASH}` (Differentiators) | `CNMC-{SEGMENT}-{DIGEST}` — and make it match `CNMC-{SEGMENT}-{HASH}` in "Our Solution" two inches away. Same slide currently prints two formats. |
| `CNMC Generation with Semantic Hashing … stable, globally unique` | `CNMC generation from the canonical signature — the code is a pure function of the normalized attribute signature, so two runs over the same data produce the same code book on any machine.` (As written it describes the backend generator, which hashes the **raw description** and therefore gives IOCL and NTPC *different* codes for the same bearing.) |
| `extracts dimensions ("M20x100" → thread size)` | `keeps compound dimensions whole — M20x100 stays M20x100, so an M20x100 bolt never matches an M20x40` — **the deck currently describes a normalizer worse than the one you built.** |
| `Multi-Stage AI Pipeline — Lexical (30%) → Semantic (40%) → Numeric (30%) → Cross-Encoder Reranker` | `Multi-stage pipeline in the FastAPI service — RapidFuzz lexical → MiniLM bi-encoder → attribute/numeric → ms-marco cross-encoder re-rank. The public demo link runs the same pipeline shape deterministically in-browser, so every score can be re-added by hand with no server.` |
| `Multi-Model Architecture — Bi-Encoder … Cross-Encoder … 100x faster` | Replace with the two differentiators that are real, in the demo, and that nobody else will have: <br>• **Silence is not agreement** — a pair where one line says RISING STEM and the other says nothing is never auto-merged, however high it scores. <br>• **Decisive-conflict short circuit** — 65NB against 150NB is settled as *different* before any threshold is consulted, so the steward queue is never padded with unanswerable questions. |
| `80% Prototype is Complete` | `Working prototype — live link on the next slide`. "80%" invites "which 20%?". |

---

## SLIDE 3 — Technical Approach

### FIX — Methodology (5 numbered steps)

| Step | Current | Change to |
|---|---|---|
| 1 | `"Hex Bolt M20x100 SS304 Grade 8.8" → "hex bolt M20 SS304 8.8" + {thread_size: 20, grade: "8.8"}` | `"Hex Bolt M20x100 SS304 Grade 8.8" → tokens + slots {noun: BOLT, variant: HEX, material: STAINLESS STEEL 304, dimension: M20X100, grade: 8.8}`. The current example **silently drops the ×100 length.** |
| 2 | `Combined Score = 0.3×Lexical + 0.4×Semantic + 0.3×Numeric; threshold ≥0.65` | `Service path: 0.30 Lexical (RapidFuzz) + 0.40 Semantic (MiniLM) + 0.30 attribute/UOM. Demo path: 0.30 Lexical (token Jaccard) + 0.45 Attribute (slot-by-slot, contradictions weighted double) + 0.25 Numeric (numeral sets). Candidates come from a family:token blocking index — ~97% of comparisons never happen.` |
| 3 | `Cross-encoder re-ranking — ms-marco-MiniLM-L-6-v2` | Keep, but label **"(service path)"**, and add the step the demo actually runs: `Verdict — a decisive conflict on a measured attribute returns "different" before any threshold. Any pair with an unexplained token is capped at review however high it scored.` |
| 4 | `≥0.85 EXACT · ≥0.78 NEAR DUPLICATE · ≥0.65 EQUIVALENT · <0.65 PARTIAL` | Label as the **service** ladder, and add the demo's: `accept ≥0.88 · review ≥0.72 · below 0.72 different`. Two documents currently give two ladders for one system. |
| 5 | `Semantic Hash (MD5 of normalized description) → CNMC-{SEGMENT}-{HASH}` | `Digest of the canonical signature (FNV-1a-32, 4 hex) → CNMC-{SEGMENT}-{DIGEST}`. **Not MD5, and not of the description.** |

### FIX — Implementation Flow (right column)

**Five of its six steps describe an app that does not exist.**

| Current | Change to |
|---|---|
| `Step 1: User Login — CPSE Officer logs into the secure web portal` | **There is no login.** Either delete the step, or change to `Step 1: Steward identity — every action is stamped with the steward who took it and written to the audit trail.` |
| `Step 3B: Upload a bulk Excel or CSV file` | `Upload a bulk CSV file` — **there is no Excel reader**; `.xlsx` fails. |
| `Step 4A: AI Semantic Search — AI scans databases across all CPSEs` | `Step 4A: Search across all loaded CPSE masters — matches the raw description, the local code and the national code.` The Explorer's own on-screen text says it is not semantic. |
| `Step 5A: AI Recommendation — "50 surplus units available at IOCL warehouse"` | Does not exist. Either delete, or mark the branch **"roadmap"** in the diagram. |
| `Step 6A: Raise Request — send an inter-CPSE stock transfer request` | Does not exist. Same treatment. |
| `Step 5B: Update Catalog — sync records to the central master database` | `Step 5B: Update the registry — the new rows join existing national codes or mint fresh ones.` |

### FIX — everything else on the slide

| Current | Change to |
|---|---|
| Caption `Dashboard Interface` over all three screenshots | Only the first is the dashboard. Caption each: `Dashboard` / `Material explorer` / `National code book`. |
| Three stacked screenshots ~2in wide, 6pt UI text | **Illegible when projected.** Use one large screenshot with two callout arrows. |
| Tech stack row | See the table below — **6 of 16 logos are real.** |
| `Zero Third-Party Matching APIs / 100% In-House Intelligence` | Keep and **promote** — it gets stronger once the OpenAI logo comes off. |
| Prototype link `…/dashboard` | Keep the URL; the app is being changed to serve that route. |
| All three screenshots | **Re-take** after the app fixes land. |

### FIX — Tech Stack row

**Currently wrong:** Electron (not a dependency), Ollama, Meta, OpenAI (none in the repo), plus an unidentifiable green "C" and three unidentifiable Data logos. **OpenAI is the damaging one — it sits on the same slide as "Zero Third-Party Matching APIs."**

| Row | Replace with (all verified in the repo) |
|---|---|
| Frontend | React · TypeScript · Tailwind CSS · Vite |
| AI layer | PyTorch · Hugging Face · scikit-learn · NumPy |
| Backend | FastAPI · Python · Pydantic · Uvicorn |
| Data & infra | PostgreSQL · SQLAlchemy · Docker · Nginx |

Optional 5th row, and better use of the space than a fourth model vendor:
**Standards & data:** BIS · GeM · UNSPSC · NATO NSN

---

## SLIDE 4 — Impact and Benefits

### DELETE

1. **The stray textbox "NUMMF Dashboard"** at `left=0, top=−9525` — hanging off the top-left corner.
2. **The cost-saving chart** — `Graph of Cost Saving for Part-13236`, Times New Roman, unlabelled `Series1`/`Series2`, two different units on one axis (`Qty(pcs) & Cost`), dates **Jan'17–Mar'18**, low-res raster. It is lifted from a paper and is about a part that does not exist in this project.
3. **The factory photo** — it carries **Chinese safety signage** (警告 / 禁止伸入 / 注意安全) on a slide about Indian CPSEs.

### ADD

4. **The app's own measured chart** in place of the deleted one: top shared groups by annual spend, straight from the Savings page.
5. **Measured numbers.** The deck currently states not one figure from its own prototype: `283 records · 210 groups · 201 codes · 45% overlap · 673 pairs scored · 16 to a steward · Rs 67 cr modelled`.

### FIX — the four KPI cards

| Current | Change to |
|---|---|
| **`Lakhs`** / `of SKUs matched in real time via bi-encoder pre-filtering` | **`24.1 lakh`** / `records addressed. Family:token blocking removes ~97% of comparisons; a 283-record slice is published where every match can be checked by hand.` The headline is currently a *unit*, not a figure — it reads as an unfinished placeholder. And there is no ANN index, so "real time via bi-encoder pre-filtering" is not true of this code. |
| **`4`** / `confidence-scored match types — EXACT / NEAR / EQUIVALENT / PARTIAL` | **`3`** / `verdicts — same · needs a person · different — each with the arithmetic and the rule that fired printed on the card.` Pick one vocabulary and use it on every slide. |
| **`3-Stage`** / `fusion — lexical (RapidFuzz) + semantic + cross-encoder re-ranking` | **`3-signal`** / `fusion — lexical + attribute slots + numeric, then a cross-encoder re-rank on the service path.` The card currently **drops numeric and folds the re-ranker into the fusion**, contradicting every other slide. |
| **`₹0`** / `per-query API cost — open, self-hostable models throughout` | **`₹0`** / `per-query API cost — the demo path calls no model API at all; it is deterministic and runs locally.` |

### FIX — body text

| Current | Change to |
|---|---|
| `Mock SAP REST/OData endpoint — pilot without touching production ERP` | Not built. → `SAP/ERP integration designed per source — RFC BAPI_MATERIAL_GETLIST, OData API_PRODUCT_SRV, JDBC mtl_system_items_b, SFTP nightly extract.` All four connector strings are genuinely in `corpus.ts`. |
| `NUMMF Dashboard` (the surviving visible use) | `CodeOne`. NUMMF appears once, unexpanded, where everything else brands the product CodeOne. |
| `Where the value concentrates` pie: 30 / 26 / 18 / 16 / 10% | **Unsourced and suspiciously round.** Either cite a source or replace with figures measured off the slice. |

---

## SLIDE 5 — Feasibility and Viability

### DELETE

1. **The stray textbox "End of Session"** at 79%/97%. It renders.
2. **The stock "AI SOFTWARE SYSTEM: END-TO-END PROCESSING PIPELINE" graphic** — its stages don't match the build, and its **first card is clipped** by the panel edge (`"Data Ingestion / …ata is collected, …ted, and loaded…"`). Replace with a screenshot of the seven-stage load console, which shows a real pipeline running.

### FIX — the logic error

> `Matching accuracy — … anything under 0.65 always routes to a human steward.`
> Risk table: `confidence thresholds … route low-confidence matches to a human Review Queue`

**Both are backwards.** `_candidate_selection` keeps a pair only `if overall >= threshold`, so sub-0.65 pairs are **discarded**, not queued. As written, the slide says the *least* confident matches get human review — which would bury a steward in garbage.

Change to: `Pairs below the review line are dropped, not queued. What protects against false positives is the unexplained-token rule: a pair where one description states something the other does not is capped at review however high it scored — 9 pairs above the accept line are in the queue for exactly that reason.`

### FIX — the rest

| Current | Change to |
|---|---|
| `Aggressively scoped demo — one product category (bearings/valves/gaskets), four synthetic CPSE house-styles` | That is **three** categories, and the app has **12 families** — slide 3's own screenshot says "12 families". → `12 material families across four CPSE house-styles, each rendered in the punctuation and UOM conventions of a real SAP or Oracle export.` Drop the word **synthetic** — it invites a judge to discount every number in the deck. |
| Risk table row 1: `4-stage pipeline + confidence thresholds (EXACT/NEAR/EQUIVALENT/PARTIAL)` | The pipeline is described as **5 steps** on slide 3 and **3-stage** on slide 4. Pick one count. Use the unexplained-token rule as the mitigation, because it is the one that actually fires. |
| `0.3×Lexical + 0.4×Semantic + 0.3×Numeric … anything under 0.65` | Align with slide 3 — both engines, both ladders, labelled. |
| `Proven components — RapidFuzz, a MiniLM bi-encoder and a MiniLM cross-encoder` | Keep, labelled **(service path)**, and add: `Reproducible by construction — a national code is a pure function of the canonical signature, so two runs over the same data produce the same code book on any machine.` |

### ADD

**Cost, timeline and team.** SIH's Feasibility slide normally wants effort, schedule and cost, and this one has none of the three.

---

## SLIDE 6 — Research and References

| | Change |
|---|---|
| FIX | Label the four model/library citations **"(service path)"** — MiniLM, ms-marco, RapidFuzz and SBERT *are* in `backend/requirements.txt`, so they are legitimate; they are just not what the live link runs. |
| ADD | The demo path's foundations, currently uncited: **NATO Stock Number / NCS codification**, **UNSPSC** (the app assigns one per family today), **Jaccard token-set similarity**, **FNV-1a**, **union-find clustering**. |
| FIX | Heading reads **"RESEARCH AND DATASETS REFERENCES"** but cites **no dataset**, though the PS names one. Either add the dataset line or drop "DATASETS". |
| FIX | `(Stage 2)` / `(Stage 3)` labels refer to a stage numbering that appears nowhere else in the deck. |
| DELETE | The 7-row comparison table **or** slide 2's 5-row one — two comparison tables in a six-slide deck make the same argument twice. |
| FIX | Comparison table, `Matching Methodology` row — drop `semantic (embeddings)` if you keep the table on the demo-path framing. |

---

## Cross-cutting

| | Change |
|---|---|
| 1 | **Fix the stage count.** Slide 3 says 5 steps, slide 4 says "3-Stage", slide 5 says "4-stage". One pipeline, one number. |
| 2 | **Fix the match vocabulary.** `EXACT/NEAR/EQUIVALENT/PARTIAL` (service) vs three verdicts (demo). Pick one for the deck body, and footnote the other. |
| 3 | **Fix the code format.** `{HASH}` / `{MD5_HASH}` / `{DIGEST}` all appear. Pick one. |
| 4 | **Add a PS-capability checklist.** The PS lists 11 expected capabilities; nothing in the deck maps to them. A compact `capability → status → where to see it` table lets a judge tick boxes instead of inferring. Highest-value single addition available. |
| 5 | **Add the honest limitation, on purpose.** One line — *"the demo slice is curated to high-value MRO lines, so the rates it measures are an upper bound"* — buys more credibility with a technical panel than any additional claim, and pre-empts their strongest question. |
| 6 | **Re-screenshot** Dashboard, Explorer and Registry after the app fixes land. |
