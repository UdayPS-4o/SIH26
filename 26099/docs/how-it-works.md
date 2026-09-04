# NUMMF — how the matching actually works

**PS 26099 · AI-Driven Standardization and Harmonization of Material Codes Across CPSEs**

This is the document to read before facing a technical panel. The demo script tells
you what to click; this tells you what to say when somebody stops you and asks how
it works. Every number in here is produced by `npm run demo:numbers`,
`npm run check:truth` or `npm run check:masters`.

---

## 1. The problem, stated precisely

Four CPSEs hold separate material masters. The same physical part appears in all
four, written four different ways:

```
IOCL   BRG BALL DG 6205 2RS SKF                    NOS   4 1002400
NTPC   BALL,BEARING,DEEP,GROOVE,6205,2RS           EA    10 24100561
SAIL   BALL BEARING DEEP GROOVE 6205 2RS FAG       PCS   SL-MRO-40546
CIL    BRG/BALL/DG/6205/2RS                        NO    CIL/MM/11251
```

Four codes, four purchase orders, four separate stock positions, one bearing.
Nothing in any of the four systems can tell you the other three exist.

This is **entity resolution over short, abbreviated, domain-specific strings**.
It is not full-text search and it is not classification. The hard part is that
the same item is written differently by every organisation, while genuinely
different items are written almost identically — `6205` against `6206`, `100NB`
against `150NB`.

---

## 2. The pipeline, in seven stages

Each stage is a separate, inspectable step. The console on the Overview page
reports all seven with their own counters as a master loads.

```
connect → extract → normalize → block → score → cluster → mint
```

| stage | what it does | code |
|---|---|---|
| connect | Opens the source system | `CPSES[].connector` |
| extract | Reads the material master, maps its columns | `api/csv.ts` |
| normalize | Expands abbreviations, fills attribute slots, builds a signature | `engine/normalize.ts` |
| block | Reduces the comparison set from quadratic to tractable | `engine/cluster.ts` |
| score | Three sub-scores per candidate pair | `engine/score.ts` |
| cluster | Union-find over accepted pairs | `engine/cluster.ts` |
| mint | Hashes the winning signature into a national code | `engine/cluster.ts` |

---

## 3. Column mapping — reading four different exports

Every ERP exports different headers. Nobody maps them by hand.

| source | headers |
|---|---|
| IOCL (SAP ECC 6.0) | `Material, Material Description, Base Unit of Measure, Material Group, …` |
| NTPC (SAP S/4HANA) | `Product No., Product Description, Base UOM, Product Group, Annual Consumption, …` |
| SAIL (Oracle EBS 12.2) | `ITEM_NUMBER, ITEM_DESCRIPTION, PRIMARY_UOM, CATEGORY, ANNUAL_QTY, ITEM_COST, ONHAND_QTY` |
| CIL (in-house) | `Item Code, Item Name, Unit, Group, Annual Requirement, Rate, Balance Stock` |

The mapper runs **two passes and claims each column once**:

1. **Exact pass** — every field checks its list of known header names. A column
   claimed here cannot be taken by anything else.
2. **Fuzzy pass** — remaining fields look for substrings among the columns nobody
   has claimed, and are marked *Guessed* in the interface so an operator can
   correct them.

Two passes rather than one is load-bearing. In field order with a single pass,
`code` (which fuzzy-matches `"code"`) grabbed Oracle's `PRIMARY_UOM_CODE` before
`uom` ever saw it. Settling every exact name first removes that whole class of
error. Six of SAIL's seven columns resolve on the fuzzy pass and every one is
flagged.

`npm run check:masters` asserts all four files map without a human touching them.

---

## 4. Normalization — the part that does the real work

### 4.1 The dictionary

**156 rules**, each carrying its source (`MRO`, `SAP`, `IS`) so a rule can be
argued with rather than trusted.

```
BRG   → BEARING                 noun
DG    → DEEP GROOVE             variant
2RS   → DOUBLE RUBBER SEALED    grade
WCB   → CAST STEEL WCB          material
CL150 → CLASS 150               rating
NOS   → EACH                    (unit, contributes no words)
```

### 4.2 Attribute slots

Seven slots, in signature order:

```
noun · variant · material · grade · dimension · rating · standard
```

The dictionary claims slots first, because an explicit rule is knowledge somebody
wrote down. Shape heuristics then fill what is left — regexes for thread and
nominal sizes (`M20X100`, `100NB`, `DN150`, `3CX240`), for ratings including
*ranges* (`0-10BAR`, `4-20MA`), and for grades (`8.8`, `SS316`, `E6013`).

Three ordering decisions that each fixed a real defect:

- **Dictionary before heuristics.** Otherwise `BALL BEARING` records `BALL` as its
  noun, because `BALL` is the first four-letter token in the string.
- **`OD` and `NB` take no slot.** They are qualifiers, not dimensions. Letting `OD`
  occupy the dimension slot made a 25MM tube and a 6MM tube record no conflict.
- **Ranges are ratings.** Without the range form, a 0–10 bar gauge and a 0–100 bar
  gauge fill no rating slot at all and score a perfect attribute match.

### 4.3 Variant is a set, not a value

One line reads `VALVE, GATE, 150NB, CL150, FLANGED`. Body style *and* end
connection are both variants and both identify the item. First-wins threw one
away, so a **gate** valve and a **check** valve of the same bore, class and
material filled identical slots and recorded no conflict at all.

Variants are now collected, sorted, and compared **as sets**:

- same set → match
- one is a **subset** of the other → *silence*, scores 0.5, not a contradiction
- each holds something the other lacks → **contradiction**

The subset rule matters. `GATE` against `GATE, FLANGED` is one line saying more,
not two lines disagreeing.

### 4.4 The signature

Slot values joined by `|`. This is the only thing hashed.

```
BEARING|BALL, DEEP GROOVE|DOUBLE RUBBER SEALED|6205
```

All four organisations' bearing lines normalize to exactly this, which is why
they score 1.000 against each other and land on one code.

---

## 5. Blocking — why 24 lakh records is tractable

Comparing 24.1 lakh records pairwise is **2.9 × 10¹²** comparisons. Nothing does
that.

Two records become candidates only when they share **a family and at least one
significant token** longer than two characters. A token appearing in more than
150 records of one family is behaving like a stop word and is not blocked on:
expanding it costs quadratic time for candidates the scorer rejects anyway. The
cap sits above the largest legitimate block, or true matches vanish silently.

Only cross-organisation pairs are generated. Duplication *within* one CPSE is a
different problem with a different owner.

Measured on the working slice: **1,287 candidate pairs** out of 69,378 possible.
The console reports comparisons skipped next to comparisons made on every load.

---

## 6. Scoring — three sub-scores, one combination

```
combined = 0.30 × lexical + 0.45 × attribute + 0.25 × numeric
```

| sub-score | what it measures |
|---|---|
| **lexical** | Token overlap over the union, after stop words and manufacturer names are removed |
| **attribute** | Agreement across the seven slots |
| **numeric** | Overlap of every number appearing anywhere in the record |

**Numeric is separate on purpose.** A 6205 bearing and a 6206 bearing read almost
identically to a token matcher; the numbers are what distinguish them.

**Manufacturer names are stripped.** `SKF`, `FAG`, `NBC`, `KIRLOSKAR`, `POLYCAB`
and thirty others. Two organisations naming different suppliers for the same part
are not describing different parts.

**Sub-scores are rounded to 2dp before combination**, so the arithmetic printed on
the card is the arithmetic that was performed. Anyone can check it by hand.

### Attribute scoring in detail

| case | score | counted as |
|---|---|---|
| both state a value, values agree | 1 | 1 |
| only one states a value | 0.5 | 1 |
| both state a value, values differ | 0 | **2** |

A contradiction counts double against the total. A storekeeper reading two lines
that agree on everything except the bore does not call it a near match.

---

## 7. The verdict — three rules, in order

This is the part worth being able to recite.

### Rule 1 — a contradiction on a stated fact is decisive

If both lines state a value for **dimension, rating, grade, material or standard**
and the values differ, the verdict is `different` **regardless of score**.

A 65NB gate valve and a 150NB gate valve agree on noun, body material, class, end
connection and standard. They still combined to 0.727 and landed in a queue asking
a human whether two different bores were the same item. Weighting the conflict
heavily inside the sub-score was not enough; it needed to be decisive.

`noun` and `variant`… — **`noun` is deliberately excluded.** Nouns are vocabulary.
Two organisations genuinely do say STRAINER and FILTER, HOOTER and SIREN, BULB and
LAMP. A contradiction there is a real question and belongs in front of a person.

### Rule 2 — silence is not agreement

`unexplained` is the set of words on one line and not the other, after stop words
and manufacturer names are gone. **While it is non-empty, the verdict is capped at
`review` however high the score.**

A plain gate valve and a `RISING STEM` gate valve contradict on nothing. Every
slot they both fill matches, every number matches, they scored **0.946** and were
merged. But one says RISING STEM and the other says nothing at all, and no
storekeeper would sign that off without looking.

### Rule 3 — then the score decides

```
≥ 0.88  same
≥ 0.72  review
        different
```

### And the clusterer merges on the verdict, not the score

`buildClusters` reads `pair.verdict === 'same'`. Reading the raw score here walked
straight past Rule 2: pairs showed as pending in the review queue while the
clusterer had already merged them, so the code book carried merges nobody had
agreed to.

---

## 8. Clustering and the national code

Union-find over accepted pairs; a cluster is a connected component. A human
rejection **holds** — it is never overridden by a later score change.

The representative is the member with the **longest signature**, since the most
completely described line is the best basis for a standard description.

### The code

```
CNMC - <family> - <hash>
        │          └── FNV-1a of the canonical signature, hex, first 4
        └── two-letter family prefix
```

```
family(BE) + hash("BEARING|BALL, DEEP GROOVE|DOUBLE RUBBER SEALED|6205")
  → CNMC-BE-73AE
```

**The code is a pure function of the signature.** It is not assigned by row order
and it is not stored in a table. Give the same signature twice and you get the
same code twice, on any machine, in any state, in any order. That property is
what lets eighty organisations mint codes concurrently without a central
allocator. The code book page shows the derivation rather than asserting it.

FNV-1a specifically because it is short enough to print next to the code it
produced, which is the whole point of showing a derivation.

---

## 9. Where the machine learning is — and is not

**Be straight about this. It is the question you will be asked.**

### What is running in the demo

A scored ensemble over a rule-based normalizer, with **learned weights** and a
human above the review threshold. It is deterministic and auditable, which is
what a national code book has to be — a registry that gives different answers on
different runs is not a registry.

### What is trained but not wired in

A fine-tuned sentence transformer at `backend/app/data/nummf-minilm/`.

- Base: `all-MiniLM-L6-v2`
- Training: `CosineSimilarityLoss`, 4 epochs, seed 20260904
- **40% of items held out permanently** — 96 of 241 items the model never sees
- The shipped model is the held-out-honest one. There is no retrain-on-everything.

| | same | different | separation | AUC |
|---|---|---|---|---|
| off-the-shelf MiniLM | 0.756 | 0.699 | 0.35 sd | **0.616** |
| fine-tuned | 0.440 | 0.167 | 1.28 sd | **0.824** |

**Off-the-shelf embeddings measurably added nothing** — average precision went
0.9949 → 0.9951, and a cross-encoder made it worse. The reason is that MiniLM has
never seen an MRO string. It had to be fine-tuned on the domain to be worth
anything, and that is a finding worth reporting rather than hiding.

### What the model is for

The 13 pairs at the bottom of `check:truth` are the ones no dictionary reaches:

```
0.688  GUMBOOT SAFETY PVC STEEL TOE IS 5852  ||  WELLINGTON SAFETY PVC STEEL TOE IS 5852
0.625  BUSH GUNMETAL 50MM                    ||  SLEEVE GUNMETAL 50MM
0.612  SWITCH LEVEL FLOAT 230V 1NO 1NC       ||  SENSOR LEVEL FLOAT 230V 1NO 1NC
0.600  BULB LED 12W B22 6500K                ||  LAMP LED 12W B22 6500K
0.592  PENSTOCK CAST IRON 300NB MANUAL       ||  SLUICE GATE CAST IRON 300NB MANUAL
0.579  HOOTER ELECTRONIC 230V IP65           ||  SIREN ELECTRONIC 230V IP65
```

Every number matches. Every specification matches. Only the noun differs, and no
dictionary written in advance contains every synonym two engineers might pick.
**That is precisely the gap a semantic model closes**, and it is why the roadmap
puts it in the `noun` slot specifically rather than over the whole string.

Say that as the next step. Do not claim it is running.

---

## 10. How we know it is right

The corpus generator knows which records came from the same physical item. That
ground truth is held in a **side map, never on the record**, so it cannot leak
into the interface. Every merge is graded rather than eyeballed.

`npm run check:truth` reports four things and exits non-zero on the first two:

| | count | meaning |
|---|---|---|
| **FALSE MERGES** | **0** | two different items given one code |
| **CONTAMINATED CODES** | **0** | one code covering more than one item |
| **POINTLESS QUESTIONS** | **0** | a review-queue pair contradicting on a stated fact |
| MISSED MATCHES | 18 | two records of one item that did not resolve together, 13 rejected outright |

`npm run check:masters` reads the four CSVs through the same parser the app uses
and asserts they reproduce the corpus field by field, then that the same
1,287 / 176 / 22 / 1,089 / 256 come out.

Splits for the model are **item-level, not pair-level**, because two records of
one item are not independent observations.

---

## 11. Current numbers

| | |
|---|---|
| Working slice | 373 records (IOCL 95 · NTPC 91 · SAIL 97 · CIL 90) |
| Full corpus | 24.1 lakh across four masters |
| Dictionary rules | 156 |
| Candidate pairs | 1,287 — 176 same · 22 review · 1,089 different |
| National codes | 256 — 69 shared by 2+ organisations, 187 single |
| Duplicate records | 117 (31.4%) |
| Largest group | 4 |
| Thresholds | accept 0.88 · review 0.72 |
| Weights | lexical 0.30 · attribute 0.45 · numeric 0.25 |
| What the fourth master adds | records 283→373 · codes 210→256 · shared 54→69 · review 16→22 |
| Annual saving | Rs 96.6 crore |

---

## 12. Questions, with answers

**"Is this real CPSE data?"**
No, and none is public — the problem statement says the CPSEs supply it. This is a
generated corpus of real MRO lines to actual IS and DIN standards, where each
organisation writes the same item the way that kind of master really writes it.
The method does not care where the strings came from.

**"So how do I know it isn't hardcoded?"**
The fourth master is dragged in from disk during the demo. You can open the file.
Edit a line and drop it again — the numbers change. `check:masters` asserts the
files reproduce the corpus.

**"You read 3.76 lakh records in 24 seconds?"**
About 15,700 a second, which is what a bulk ERP extract with normalization behind
it costs. And the panel says on screen that it is projected from the 90-row
extract in the demo — we are not pretending the room watched 3.76 lakh rows go past.

**"Why not just use embeddings for everything?"**
We measured it. Off-the-shelf embeddings added 0.0002 average precision, and a
cross-encoder made it worse, because a general-purpose model has never seen
`BRG BALL DG 6205 2RS`. Fine-tuned on the domain it reaches 0.824 AUC on unseen
items and closes the synonym gap the dictionary cannot. A code book also has to be
deterministic and explainable, so the model advises the noun slot rather than
replacing the pipeline.

**"What happens when two organisations disagree?"**
It goes to the review queue with the specific reason attached, a person decides,
and the decision is written to the audit trail against their name. A rejection
holds even if the score later rises.

**"How does this scale to eighty CPSEs?"**
Blocking keeps the comparison count linear-ish in practice rather than quadratic,
and the code is a pure function of the signature, so no central allocator is
needed and organisations can mint concurrently without collision.

**"What is the failure mode?"**
Missed matches, not wrong ones. The three verdict rules are all biased toward
refusing to merge. That is the correct bias for a registry: a missed match leaves
money on the table, a wrong merge puts a wrong answer in a national code book.

**"What would you need from the ministry to make this real?"**
Extracts from the participating CPSEs, a nominated reviewer per organisation for
the queue, and agreement on the family taxonomy. The dictionary is the asset that
grows — every rule an operator adds is permanent and helps every organisation
after them.
