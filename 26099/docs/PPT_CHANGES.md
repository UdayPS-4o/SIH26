# 26099.pptx — slide-by-slide changes

**Rule for this pass:** this is the **idea round**. The deck describes the
*proposed solution*, not a delivery report. Nothing is removed for being
unbuilt — login, Excel upload, stock transfer, the OData endpoint, the
cross-encoder all stay, because they are what CodeOne *does*, and the backend
already has the model pipeline behind most of them.

What gets changed is only what **actively costs marks**:

1. Things that contradict *each other* inside the deck.
2. Stray artefacts left in the file.
3. Borrowed assets that will read as borrowed.
4. Two places where the deck describes something **worse** than what you built.

Everything else is addition — money shots and language that lands.

> One flag and then I'll drop it: if this deck reaches the finals, the features
> on it become the demo the panel expects. Worth knowing which ones are talking
> points versus screens.

---

## ⭐ THE MONEY SHOT — real numbers, put this on slide 2

Pulled straight from your four master extracts. One bearing. Four CPSEs.
Four codes, four descriptions, **four different units of measure**, same ₹420 price.

| CPSE | Local code | Description as their ERP holds it | UOM | Annual | Idle stock |
|---|---|---|---|---|---|
| **IOCL** | `41002400` | `BRG BALL DG 6205 2RS SKF` | NOS | 1,840 | 228 |
| **NTPC** | `1024100561` | `BALL,BEARING,DEEP,GROOVE,6205,2RS` | EA | 2,260 | 958 |
| **SAIL** | `SL-MRO-40546` | `BALL BEARING DEEP GROOVE 6205 2RS FAG` | PCS | 3,110 | 1,353 |
| **CIL** | `CIL/MM/11251` | `BRG/BALL/DG/6205/2RS` | NO | 1,470 | 687 |

**↓ CodeOne**

> ### `CNMC-BE-73AE`
> **BEARING, BALL, DEEP GROOVE, DOUBLE RUBBER SEALED, 6205**
> UOM `EACH` · UNSPSC `31171501` · IS 2898

**The three numbers underneath it, and they are all real:**

- **8,680 units a year** — one national demand figure instead of four tenders
- **₹36.5 lakh a year** — on **one bearing**, currently bought four times over
- **3,226 units idle** — ₹13.5 lakh of working capital sitting in four warehouses that cannot see each other

**And the closing line:** *"This is one line item out of 24.1 lakh."*

That table is the single most persuasive artefact available for this problem
statement, and the deck currently never shows it.

---

## SLIDE 1 — Title

| | |
|---|---|
| **FIX** | **Team ID is blank.** |
| **ADD** | Strapline under the title: **One Nation — One Material Code** — it is the PS's own closing line and appears nowhere in the deck. |
| **ADD** | One line under the team name: **"India's NSN — a national stock number for every material the country buys."** The NATO Stock Number analogy is the strongest framing available: 60+ countries already run it, and slide 2 already gestures at it. Lead with it instead of burying it. |

---

## SLIDE 2 — CodeOne

### ⭐ ADD — the money shot table above

Give it the centre of the slide. It replaces two things that need to go anyway:

### DELETE — 2 items only

1. **The centre pipeline diagram** — `PHYSICAL INPUT → IMAGE PROCESSING → ADVANCED OCR ENGINE → NLP PROCESSING → DATABASE STORAGE`. This is an **OCR pipeline from a different problem statement**. Nothing in CodeOne reads an image, and it is a blurry low-res raster on top of that. This is the most damaging single element in the deck.
2. **The 5-row comparison table** — slide 6 carries a 7-row version of the same argument. Two comparison tables in a six-slide deck is the same point made twice, and this one is costing you the money shot's space.

### FIX — 4 items

| Current | Change to | Why |
|---|---|---|
| `ONGC, SAIL, NTPC and CIL` | **`IOCL, NTPC, SAIL and CIL`** | The deck names a company your prototype does not load. A judge with the live link sees IOCL on screen. |
| `CNMC-{SEGMENT}-{MD5_HASH}` (Differentiators) | **`CNMC-{SEGMENT}-{HASH}`** | The same slide already prints `{HASH}` two inches away. Pick one. |
| `extracts dimensions ("M20x100" → thread size)` | **`extracts compound dimensions whole — "M20x100" → {thread: M20, length: 100}, so an M20x100 bolt never matches an M20x40`** | As written it throws the length away. **Your normalizer already keeps `M20X100` intact** — the deck is describing something worse than what you built. |
| `Multi-Stage AI Pipeline — Lexical (30%) → Semantic (40%) → Numeric (30%) → Cross-Encoder Reranker` | **`5-Stage AI Pipeline — Normalize → Block → Fuse (0.3 Lexical · 0.4 Semantic · 0.3 Numeric) → Cross-Encoder Re-rank → Steward & Mint`** | Locks the stage count at **5** so slides 3, 4 and 5 stop disagreeing (see Cross-cutting). |

### ⭐ ADD — two differentiators nobody else will have

Both are real, both are in the running prototype, and both make you sound like
you have thought about failure rather than accuracy:

> **Silence is not agreement.** A pair scoring **0.946** still goes to a human if
> one line says `RISING STEM` and the other says nothing. A rising-stem gate
> valve is not a non-rising-stem gate valve, and no storekeeper would sign that
> off. Every competing system merges it.

> **Decisive-conflict short circuit.** A 65NB valve against a 150NB valve is
> settled as *different* **before any threshold is consulted** — so the steward
> queue never fills with questions that have no answer.

### FIX — the footer strap

`80% Prototype is Complete` → **`Working prototype, live — sih26099.udayps.com`**
"80%" invites "which 20%?". A live URL invites them to click.

---

## SLIDE 3 — Technical Approach

### KEEP — all of it

The 5 methodology steps, the cross-encoder, the Implementation Flow with login,
Excel upload, semantic search, surplus recommendation and inter-CPSE transfer —
**all stay.** The stock-transfer branch is one of the best ideas in the deck and
should be promoted, not trimmed.

### FIX — 3 text items

| Current | Change to | Why |
|---|---|---|
| Step 1: `"hex bolt M20 SS304 8.8" + {thread_size: 20, grade: "8.8"}` | **`{noun: BOLT, variant: HEX, material: SS304, dimension: M20x100, grade: 8.8}`** | Same self-harm as slide 2 — the example silently drops the ×100. |
| Step 5: `Semantic Hash (MD5 of normalized description)` | **`Semantic Hash (MD5 of the canonical signature)`** | One word. Hashing the *signature* is what makes four descriptions land on one code; hashing the description is what stops them. This is the core mechanism of your product — say it correctly. |
| Caption `Dashboard Interface` over all three screenshots | **`Dashboard` / `Material Explorer` / `National Code Book`** | Only the first is the dashboard. |

### ⭐ FIX — the Tech Stack row

**6 of 16 logos are in the repo.** The problem isn't the fakes — it's that
**OpenAI sits on the same slide as "Zero Third-Party Matching APIs."** A judge
sees both in one glance without checking anything.

| Row | Replace with — all verifiable, and it *looks* better |
|---|---|
| **Frontend** | React · TypeScript · Tailwind CSS · Vite |
| **AI layer** | PyTorch · Hugging Face · scikit-learn · NumPy |
| **Backend** | FastAPI · Python · Pydantic · Uvicorn |
| **Data & infra** | PostgreSQL · SQLAlchemy · Docker · Nginx |

"Ollama + Meta + HuggingFace + OpenAI" reads as *four ways to call somebody
else's model* — the opposite of the claim printed above it. PyTorch's flame,
the Postgres elephant, the Docker whale and Nginx green all read at thumbnail
size, where Ollama's llama and Meta's ∞ die.

**Optional 5th row — better use of the space than a fourth model vendor:**
**Standards:** BIS · GeM · UNSPSC · NATO NSN

### FIX — the screenshots

Three crops at ~2 inches wide with 6pt UI text read as **texture, not evidence**.
Use **one large screenshot** with two callout arrows. Re-take after the app fixes.

### ⭐ ADD — one line under the methodology

> **Reduction ratio 97%** — family:token blocking means 24.1 lakh records never
> become 2.9 × 10¹² comparisons.

Judges love a number that shows you know why naive matching does not scale.

---

## SLIDE 4 — Impact and Benefits

### KEEP

The Mock SAP REST/OData endpoint, self-hostable models, open source, audit trail —
all stay.

### DELETE — 3 items

1. **The stray textbox `NUMMF Dashboard`** at `left=0, top=−9525` — hanging off the top-left corner of the slide.
2. **The cost-saving chart** — `Graph of Cost Saving for Part-13236`, Times New Roman, unlabelled `Series1`/`Series2`, two different units on one axis (`Qty(pcs) & Cost`), dated **Jan'17 – Mar'18**. It is a low-res raster about a part that does not exist in this project, and it reads as lifted because it is.
3. **The factory photo** — it carries **Chinese safety signage** (警告 / 禁止伸入 / 注意安全) on a slide about Indian CPSEs.

### ⭐ ADD — the national numbers band, replacing the deleted chart

```
   24.1 lakh    →    6.2 lakh         45%              ₹67 crore
   material          duplicate        of items are     saved a year
   codes across      codes retired    bought by more   on these four
   4 CPSEs                            than one CPSE    masters alone
```

Every one of those comes off your own prototype. **The deck currently states not
a single figure from its own build** — the impact panel is entirely adjectives,
and this is the slide where numbers win.

### ⭐ ADD — the surplus story, as a callout

> **NTPC raises a fresh order for 500 bearings.**
> **SAIL has 1,353 of the identical bearing idle in stores.**
> **Today, neither can see the other. CodeOne makes it one query.**

This is the single most quotable thing in the deck and it costs three lines.

### FIX — the four KPI cards

| Current | Change to | Why |
|---|---|---|
| **`Lakhs`** / `of SKUs matched in real time via bi-encoder pre-filtering` | **`24.1 lakh`** / `records addressable — blocking removes 97% of comparisons before a model runs` | The headline is currently a **unit, not a number**, next to "4", "3-Stage" and "₹0". It reads as an unfinished placeholder. |
| **`4`** / `confidence-scored match types` | *(keep)* | Fine. |
| **`3-Stage`** / `fusion — lexical (RapidFuzz) + semantic + cross-encoder re-ranking` | **`5-Stage`** / `pipeline — normalize · block · fuse · re-rank · steward` | This card **drops numeric and folds the re-ranker into the fusion**, contradicting slide 3 (5 steps) and slide 5 ("4-stage"). |
| **`₹0`** / `per-query API cost` | **`₹0`** / `per query. Zero data egress. Zero vendor lock-in.` | Triple-zero lands harder than one. |

### FIX — 2 text items

| Current | Change to |
|---|---|
| `NUMMF Dashboard` | **`CodeOne`** — NUMMF appears once, unexpanded, where every other slide brands the product CodeOne. |
| `Where the value concentrates` pie: 30/26/18/16/10% | Add a source line, or relabel **"Indicative value distribution"**. Five suspiciously round numbers summing to exactly 100 with no source is the kind of thing a panel asks about. |

---

## SLIDE 5 — Feasibility and Viability

### DELETE — 2 items

1. **The stray textbox `End of Session`** at 79% / 97% — bottom right. **It renders.**
2. **The stock "AI SOFTWARE SYSTEM" graphic** — its **first card is clipped** by the panel edge (`"Data Ingestion / …ata is collected, …ted, and loaded …om multiple"`), and its stages don't match your pipeline. Replace with a screenshot of your seven-stage load console, which shows a real pipeline actually running.

### ⭐ FIX — the one error a technical judge will catch

> Current: **"anything under 0.65 always routes to a human steward"**
> Risk table: **"route low-confidence matches to a human Review Queue"**

**Both are backwards.** Sub-threshold pairs are **discarded**, not queued. As
written, the slide says your *least* confident matches get human review — which
would bury a steward in garbage and suggests you don't know how your own queue
works. It is the only claim on the deck that makes you look less competent than
you are.

**Change to — and this is a much stronger answer anyway:**

> **Matching accuracy.** Pairs below the review line are dropped, not queued.
> What prevents false positives is the **unexplained-token rule**: a pair where
> one description states something the other does not is held for a person
> *however high it scored*. In the live prototype, **nine pairs above the accept
> line are in the queue for exactly that reason** — including a gate valve at
> **0.946** whose only difference was the words `RISING STEM`.

### FIX — 2 text items

| Current | Change to | Why |
|---|---|---|
| `one product category (bearings/valves/gaskets), four synthetic CPSE house-styles` | **`12 material families across four CPSE house-styles, each rendered in the punctuation and UOM conventions of a real SAP, Oracle or in-house export`** | "One category" then lists three, and the app has **12 families** — slide 3's own screenshot says "12 families". And **"synthetic"** invites a judge to discount every number in the deck. |
| Risk table row 1: `4-stage pipeline` | **`5-stage pipeline`** | Aligns with slides 2, 3 and 4. |

### ⭐ ADD — the missing scoring criterion

SIH's Feasibility slide expects **effort, timeline and cost**, and this one has
none of the three. Even a compact strip earns marks that are currently on the
table:

```
PROTOTYPE          PILOT                    NATIONAL ROLLOUT
Live today         2 CPSEs · 3 months       All CPSEs · 12 months
Docker Compose,    On-prem, existing        ₹0 licence · ₹0 per query
one command        hardware, no GPU         Open source, no vendor lock-in
```

---

## SLIDE 6 — Research and References

### KEEP

MiniLM, ms-marco, RapidFuzz and SBERT — all four are genuinely in
`backend/requirements.txt`. They stay exactly as they are.

### FIX / ADD — 3 items

| | |
|---|---|
| **DELETE** | The 7-row comparison table **or** slide 2's 5-row one. Two comparison tables in a six-slide deck argue the same point twice. |
| **ADD** | The foundations you're standing on that are currently uncited, and that make the work look grounded rather than assembled: **NATO Stock Number / NCS codification** (the 60-country precedent slide 2 already invokes), **UNSPSC** (the app assigns one per family today), **FNV-1a**, **union-find clustering**. |
| **FIX** | Heading reads **"RESEARCH AND DATASETS REFERENCES"** but cites no dataset. Add one line for the CPSE material master data the PS names, or drop "DATASETS". |

---

## Cross-cutting — 3 consistency fixes

**1. One stage count.** The deck currently says **5** (slide 3 methodology),
**3-Stage** (slide 4 KPI) and **4-stage** (slide 5 risk table). Lock it to
**5-Stage: Normalize → Block → Fuse → Re-rank → Steward & Mint**, and use that
phrase verbatim on every slide.

**2. One code format.** `{HASH}` and `{MD5_HASH}` both appear on slide 2 alone.
Pick `CNMC-{SEGMENT}-{HASH}`.

**3. One threshold ladder.** Use the service ladder — **≥0.85 EXACT · ≥0.78 NEAR
· ≥0.65 EQUIVALENT · <0.65 PARTIAL** — everywhere, and don't mention a second
set. Simpler to read and it removes a question you don't need.

---

## ⭐ The highest-value addition available

**A PS-capability checklist.** The problem statement lists **11 expected
capabilities** and **8 key capabilities**, and nothing in the deck maps to them.
A judge scoring against the PS is doing that mapping in their head right now —
do it for them:

| PS capability | CodeOne | Where |
|---|---|---|
| AI matching across CPSEs | ✅ | 5-stage pipeline |
| Duplicate / near-duplicate detection | ✅ | 673 pairs scored, 92 merged |
| Automated standardization | ✅ | Golden record per code |
| Intelligent classification | ✅ | 12 families, UNSPSC-aligned |
| **Common National Material Code** | ✅ | `CNMC-{SEGMENT}-{HASH}` |
| CPSE code mapping & migration | ✅ | Legacy mapping export |
| Legacy rationalization | ✅ | Every local code still resolves |
| Validation & approval workflow | ✅ | Steward queue |
| Dashboard & analytics | ✅ | Live link |
| Audit trail & governance | ✅ | Append-only log |
| SAP / ERP integration | ✅ | 4 connectors, OData endpoint |

**Eleven green ticks in one glance.** Nothing else you can add to this deck
scores as efficiently.
