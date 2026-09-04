# NUMMF frontend rewrite plan

Problem statement 26099. Full replacement of `frontend/src`, plus a real computation engine
underneath so that every page reads from one source of truth.

---

## 1. What is wrong today

### 1.1 It looks generated

Ten pages, one visual language, and that language is the default LLM dashboard:

- Gradient-filled rounded icon tiles at the corner of every panel.
- Six accent hues in play at once (blue, indigo, purple, emerald, amber, red) with no semantic
  meaning attached to any of them.
- White cards on near-white background, `rounded-xl`, soft shadow, repeated about forty times.
- Sparklines with no time axis, no scale and no underlying series. They are decoration.
- A live IST clock, an `ONLINE · READY` pill, a `v1.0` chip, a `SIH 26099` chip and a refresh
  icon competing in a 64px header.
- An auto-scrolling "Pipeline Audit Log" that streams four hardcoded lines.
- "AI" used as an adjective on six different labels.

### 1.2 It is not a demo, it is a screenshot with one button

`RUN AI PIPELINE` runs `setTimeout` five times over 3.2 seconds and then writes back the same
constants it started with. Every KPI is byte-identical before and after. Nothing else on any page
responds to anything the visitor does. A judge cannot touch the system.

### 1.3 The numbers do not survive inspection

These are real defects, not cosmetic ones, and a technical judge will find them:

| Defect | Where | Detail |
|---|---|---|
| Codes assigned by row index | Explorer | All 240 rows resolve to 3 CNMC codes. Bolts get a `PT` (pipes) prefix. |
| Sub-scores do not reconcile | Matching | Sem 10 / Lex 92 / Num 70 under `0.4/0.3/0.3` is 52.6%, the card shows 18%. Only the hardcoded pairs reconcile. |
| Upload matches against itself | Import | Each uploaded row pairs with the next row in the same file, circularly, and the last wraps to the first. Target org is `<ORG>-NODE2`, never one of the four connected CPSEs, even though the correct counterparts are already in the seed data. |
| Chart renders empty | Savings | The confidence donut draws two sectors and reads as an empty box with a legend. |
| Log contradicts the queue | Activity | Logs `0 duplicates flagged` in the same run that pushed five proposals into review. |
| Header title never changes | All pages | `PAGE_META` in `components/Header.tsx` has no entry for `/upload`, `/normalize`, `/audit` or `/registry`, so all four render "Harmonization Dashboard". |
| Three contradictory method claims | Dashboard / Normalize / Import | Sentence-BERT, spaCy EntityRuler, and TF-IDF + Jaccard. The code runs token Jaccard. |

---

## 2. Design direction

**Design read:** internal console for a government procurement audience and a technical jury, with a
document-like, instrument-like language, leaning toward a Carbon-influenced system built on Tailwind.

A note on scope: this is a dense product UI, which the frontend taste skill explicitly routes to a
real enterprise design system (Carbon, Fluent, Carbon being the closest fit here) rather than to its
landing-page rules. Migrating to `@carbon/react` would fight the existing Vite and Tailwind build for
little visible gain, so the plan borrows Carbon's density principles and IBM Plex type into a small
explicit token layer, and labels that honestly. The skill's transferable parts (anti-tells, colour
discipline, content density, motivated motion, copy audit, pre-flight) are applied in full.

The reference document at `nummf-view-modes.html` already carries this language, so the two agree.

### Dials

`DESIGN_VARIANCE: 3` · `MOTION_INTENSITY: 3` · `VISUAL_DENSITY: 7`

Public-sector preset. Motion is nudged to 3 from 2 because state transitions have real work to do
here (a list reordering when you move a weight slider is information, not decoration). Density is
high because this is a cockpit, which under the skill's own rule means panels give way to 1px rules
and every number is set in tabular mono.

### Tokens

| Token | Light | Dark |
|---|---|---|
| paper | `#F1F3F4` | `#0F151A` |
| surface | `#FFFFFF` | `#171F25` |
| ink | `#141B21` | `#E7EDF0` |
| ink-2 | `#56646E` | `#9EABB4` |
| rule | `#DCE2E5` | `#29343C` |
| accent (steel) | `#1D4E79` | `#84B6DE` |
| attention (ochre) | `#8F5406` | `#E4A85D` |
| negative | `#9C2E20` | `#E88875` |

Three semantic colours, no more. Steel is the single accent and carries interaction. Ochre means one
thing only: needs a human decision. Negative means one thing only: rejected or conflicting. No purple,
no emerald, no cyan, no gradient anywhere.

- **Type:** IBM Plex Sans for interface, IBM Plex Mono for every code, score, identifier and rupee
  figure, Archivo for display. Self-hosted through `@fontsource`, not a Google Fonts `<link>`.
- **Radius:** 2px, everywhere, including buttons. No pills.
- **Elevation:** 1px rules and whitespace by default. A bordered panel only where grouping is real.
- **Icons:** Phosphor at a single stroke weight, replacing `lucide-react`.
- **Numerals:** `font-variant-numeric: tabular-nums` globally. Lakh and crore, not K and M.
- **Both themes** built and checked from the start, driven by CSS variables. The current 190-line
  `!important` override block in `index.css` goes away.

### Deleted globally

Live clock, `ONLINE · READY` pill, version chips, refresh icon, gradient icon tiles, glass panels,
decorative status dots, sparklines, auto-scrolling log rail, and "AI" as a prefix.

---

## 3. The engine

The reason nothing currently reconciles is that there is no single place where a number is computed.
Constants live in `store/demo.ts`, a second unrelated set lives in `store/index.ts`, a third in
`demo/data.ts`, and `utils/harmonizer.ts` computes a fourth set that disagrees with the labels
printed next to it.

New `src/engine/`, deterministic, synchronous, in the browser:

```
corpus.ts      ~220 hand-authored records across IOCL, NTPC, SAIL, CIL, with real attributes
dictionary.ts  MRO abbreviation rules, inspectable and extensible at runtime
normalize.ts   tokenize, expand, extract attribute slots, emit a canonical signature
score.ts       lexical, attribute and numeric sub-scores + the weighted combination
cluster.ts     mutual-match grouping, then CNMC code = family prefix + hash(signature)
savings.ts     four named inputs, arithmetic out
```

Four consequences that fix section 1.3:

1. **The combined score is computed from the sub-scores that are displayed**, so the arithmetic can
   be checked on screen. The card prints `0.40x0.92 + 0.30x0.88 + 0.30x0.71 = 0.85`.
2. **The CNMC code is derived from the canonical signature**, so 220 records produce a realistic
   spread of codes and a bolt cannot receive a pipes prefix.
3. **Uploaded rows are matched against the corpus**, not against the rest of the upload.
4. **When a pair falls short, the blocking attribute is named.** `body material: SS304 vs cast steel
   WCB`. This is the most convincing single element in the product and it currently does not exist.

State is one store: `corpus + weights + threshold + approvals + savings inputs`. Everything else is
derived. Change any input and every page moves, because there is nothing left to go stale.

### One method story

The app currently claims three different techniques on three different pages. Recommendation: state
one true thing, once. **Rule-based normalization against an MRO dictionary, then weighted lexical,
attribute and numeric scoring, computed in the browser.** No model names, because no model runs.
The FastAPI backend in `backend/app/ml/` can be wired later as an upgrade; it is not a claim to make
now. See the open question in section 6.

---

## 4. Pages

Nine pages, down from ten. Matching Matrix and Review Queue merge, because to anyone who is not an
engineer they are one thing: pairs the system thinks are the same, some of which need a decision.

Each page below states the one thing a visitor can manipulate and what recomputes when they do. That
is the answer to "not a single click run pipeline": there is no global run button at all. The pipeline
is exposed as instruments, one per page.

---

### 4.1 Overview `/`

**Job:** in twenty seconds, prove the problem is real and that this resolves it.

**Interactive centre: the resolver.** Four raw ERP strings for the same physical bearing, as each
CPSE actually stores it, sit stacked on the left:

```
IOCL   BRG,BALL,SKF 6205-2RS,25MM ID,GREASE SEAL,IS:6305
NTPC   Ball Bearing 6205 2RS ISO 281
SAIL   DEEP GROOVE BALL BEARING 6205
CIL    BALL BEARING 6205-2RS SKF
```

Three buttons, stepped at the visitor's pace, never on a timer:

1. **Normalize** - abbreviations expand in place, the token that fired the rule is marked, the
   dictionary entry responsible is shown.
2. **Match** - the pairwise scores draw in, with the sub-score breakdown.
3. **Mint** - the canonical signature is assembled and hashed in front of you, yielding
   `CNMC-BE-5E91`.

**Any of the four strings is editable.** Type your own, press re-run, watch it re-resolve. If you
break it (type "hydraulic pump" into slot three) the match fails and the page says why. A demo that
can fail in public is a demo the audience believes.

**Also on the page:** four KPI figures derived from the corpus, in tabular mono, no sparklines. They
move when approvals change, because they are derived, not stored.

**Cut:** connector cards with adapter versions, the four tabs, the log rail, the KPI card that reads
`Connected CPSEs 4/4`.

---

### 4.2 Explorer `/explorer`

**Job:** show that identical items scattered across four organisations now sit together.

**Interaction:** a group-by switch. Flat is the familiar table. **Grouped by national code is the
default and is the entire point of the page**, and it is currently invisible. A group header carries
the code, member count, how many distinct CPSEs contribute, and combined annual spend. Expanding a
group shows the member rows with the attribute that differs between them highlighted.

Search and CPSE filter chips. Selecting a row opens the record with its normalized form beside its raw form.

**Header metric, stated honestly:** `218 items · 74 distinct codes · largest cluster 6`. If clustering
degrades, this number exposes it rather than hiding it, which is the correct incentive to build under.

**Cut:** internal material code column and technical standard column from the default view (both
available in the record detail), status chips, the `Auto-normalized via Sentence-BERT` caption.

---

### 4.3 Duplicates `/duplicates`

Merges the Matching Matrix and the Review Queue.

**Job:** show the judgement, and let a human make it.

**Interaction A, the weight sliders.** These currently sit buried in an admin page where nobody will
find them. They belong here. Three weights that renormalize to sum to 1, and moving any of them
**re-scores every pair and re-orders the list in real time**, with the rows animating to their new
positions. This is the single most convincing interaction available: it demonstrates the scores are
computed rather than typed, and it takes one gesture to show.

**Interaction B, the threshold.** Drag the accept threshold and watch pairs cross between
`same item`, `needs a check` and `different items`. The counts in the sidebar update as you drag.

**Interaction C, the decision.** Approve or reject, individually or in batch. An approval writes to
Activity, adds the mapping to the Code Book, and moves the coverage figure on Overview and Savings.

**Each pair shows:** both records with differing tokens marked, the three sub-scores, the combined
score with its arithmetic printed inline, and for anything below threshold **the named blocking
attribute in the negative colour**.

**Cut:** proposal IDs, HIGH/MEDIUM/LOW chips, and the four match-type labels. The verdict and the
score already say all of it.

---

### 4.4 Savings `/savings`

**Job:** make the rupee figure defensible instead of asserted.

**Interaction: the four assumptions are input fields.** Duplicate line items, average unit price,
annual volume, negotiated bulk discount. Type into any one and the waterfall redraws and the headline
recomputes on the keystroke. A reset link restores the defaults.

**Visual:** one waterfall stepping from duplicate line items down to the annual figure, every bar
labelled with the assumption that produced it. Below it, per-CPSE contribution as a plain horizontal
bar set.

**Cut:** the confidence donut, which currently renders as an empty box. Confidence distribution is
not a decision-support number for this audience and the chart does not work. The family bar chart
also goes; family volume already lives on Explorer where it can be filtered.

---

### 4.5 Code Book `/registry`

The strongest page today. It needs the least change.

**Job:** the payoff. One agreed entry, four legacy names.

**Interaction: "show derivation".** Expands to reveal
`family(BE) + hash("BEARING|BALL|DEEP GROOVE|6205-2RS|BORE 25MM") -> CNMC-BE-5E91`,
which proves the code is computed rather than assigned. Legacy mapping rows link through to Explorer
filtered to that code.

Golden record keeps standard description, unit, estimated annual spend, and the full legacy mapping
list, which is the payoff of the entire product and should be the largest block on the page.

---

### 4.6 Import `/import`

**Job:** the interactive proof. Bring your own data.

**Four ways in, in increasing order of friction**, because a judge holding a phone has no CSV file:

1. Type a single description into one field.
2. Paste rows into a textarea.
3. Load one of three bundled samples.
4. Drop a CSV.

**Interaction:** the detected column mapping is shown and is **correctable by the visitor** when
auto-detection guesses wrong. Then it runs the real engine against the four-CPSE corpus and reports
per row: matched, against which existing record, in which CPSE, at what score; or unmatched, new code
minted, with the derivation shown.

Results persist into Explorer, Code Book and Activity, so the demo compounds rather than resetting.

**Cut:** the format chips, the four-step stepper with fabricated timings, the
`Real-time Client Parser Active` badge.

---

### 4.7 Normalization `/normalize`

**Job:** the explainer that makes a non-engineer understand the problem in ten seconds.

**Interaction: a free text field.** Type any raw ERP-style description and, debounced as you type,
the panel below shows the tokens, each abbreviation expanded with the dictionary rule that fired,
the attributes extracted into their slots, and the canonical signature that comes out.

Today this page offers a `Run Normalization` button over five fixed samples. It becomes an instrument
you can point at anything.

Beside it, the abbreviation dictionary is browsable and searchable, so the rules are inspectable
rather than asserted.

---

### 4.8 Activity `/activity`

**Job:** accountability, which is exactly what a government audience wants to see and what most
competing teams will not have.

Every action taken during the session appears with timestamp, actor and a plain-English description:
`Approved that IOCL's hex bolt and NTPC's hexagonal bolt are the same item.` Filter chips, CSV export.

Reads from the same engine result as the review queue, which fixes the current contradiction where
the log records zero duplicates in the same run that produced five proposals.

---

### 4.9 Engine `/engine`

Replaces the CPSE Connectors and admin page.

Weights and threshold, mirrored from the Duplicates page against the same store so the two surfaces
cannot disagree. The formula readout set large and live. The abbreviation dictionary is editable:
**add a rule and Normalization changes behaviour immediately**. Connector registry with adapter and
sync status.

Operator-tunable weights with a visible effect on ranking is a genuine governance feature. Very few
teams will have one.

---

## 5. Build order

| Step | Work |
|---|---|
| 1 | Token layer, fonts, Tailwind config, `App` shell, sidebar, header. Delete the `!important` block. |
| 2 | `src/engine/*` with the corpus, plus unit checks that the combined score reconciles with the sub-scores. |
| 3 | Overview, including the resolver. The centrepiece, so it gets built while attention is fresh. |
| 4 | Duplicates, including the weight and threshold sliders. |
| 5 | Explorer, Code Book. |
| 6 | Import, Normalization. |
| 7 | Savings, Activity, Engine. |
| 8 | Both themes verified, reduced-motion verified, pre-flight pass, dead code removed. |

Old files removed at the end, not the start, so there is always something running.

---

## 6. Open questions

Two forks where different answers mean materially different work. Both are asked in chat.

1. **Simple / Technical view toggle.** The reference HTML specifies one, and it is the strongest
   differentiator in the document: same data, two audiences, flipped on camera at 1:40 in the video.
   It roughly doubles the copy surface, since every string needs both registers, held in one
   `copy.ts`. Recommendation: build it, because the demo value is high and the cost is copy rather
   than architecture.

2. **Client engine or wired backend.** The plan above computes in the browser, which is deterministic,
   works with no network in a demo room, and is honest about what it does. The FastAPI backend exists
   and is unwired. Recommendation: client engine for the demo path, and keep the backend reachable
   behind the existing proxy so the architecture story stays true.
