# SIH 2026 — PS 26099: AI-Driven Standardization and Harmonization of Material Codes Across CPSEs

**Organization:** Ministry of Petroleum & Natural Gas — Chennai Petroleum Corporation Limited (CPCL)
**Theme:** Smart Automation | **Category:** Software

---

## 1. What they actually want (plain English)

Different CPSEs (ONGC, SAIL, NTPC, Coal India, CPCL, etc.) buy the same physical items but record them differently in their own SAP/ERP systems:

| CPSE | Material Code | Description |
|------|---------------|-------------|
| ONGC | 4500012876 | BRG,BALL,SKF 6205-2RS,25MM ID |
| SAIL | MM-88-19243 | BEARING BALL SINGLE ROW 6205 2RS |
| NTPC | 1176-BRG-005 | SKF BALL BEARING 6205-2RS/C3 |
| CIL  | 90887123 | BALL BRG 6205 SEALED |

Same bearing, four codes, four descriptions. Consequences: no bulk-buying leverage, no cross-CPSE stock visibility (NTPC buys new stock while SAIL's identical item sits unused in a warehouse), and every company's own material master is full of internal duplicates too.

**What's wanted:** an AI system that reads these messy descriptions, recognizes equivalent/duplicate items across CPSEs, assigns each a single **Common National Material Code** (déjà vu of the **NATO Stock Number** system — 60+ countries, one code per item), keeps a mapping back to every CPSE's legacy code (so no one's SAP breaks), and requires a human steward to review and approve every AI suggestion before it goes live.

## 2. The 8 required capabilities (from the PS)

1. AI matching of material descriptions/specs across CPSEs
2. Duplicate / near-duplicate / functionally-equivalent detection
3. Automated standardization of descriptions & technical attributes
4. Intelligent classification into a taxonomy
5. Generation of a Common National Material Code
6. Mapping of legacy CPSE codes ↔ national code (with migration support)
7. Human validation/approval workflow for every AI recommendation
8. Dashboard, analytics, audit trail, and SAP/ERP integration capability

## 3. System architecture

```
CPSE Data (CSV/SAP export)
        │
        ▼
1. INGEST & CLEAN        normalize units (NOS/EA/PC → EA), expand
   (rules)               abbreviations (BRG→BEARING, SS→STAINLESS STEEL)
        │
        ▼
2. ATTRIBUTE EXTRACTION  parse each description into
   (rules + NER + LLM)   {noun, modifier, brand, size, spec, standard}
        │
        ▼
3. MATCHING ENGINE (3-layer funnel)
   a) embeddings + vector search  → top-K candidate matches (fast, cheap)
   b) Splink probabilistic scoring → explainable match/no-match score
   c) LLM adjudication            → only for genuinely ambiguous pairs
        │
        ▼
4. CLASSIFY + CODE       classify into UNSPSC → mint National Material Code
        │
        ▼
5. STEWARD REVIEW UI     side-by-side compare, Approve/Reject/Merge
   (human-in-the-loop)   → writes golden record + mapping table
        │
        ▼
6. SERVE                 dashboard (savings, dupes found), audit log,
                         mock SAP REST/OData integration endpoint
```

**Why a 3-layer funnel instead of "LLM compares everything"?** At 100k items there are ~5 billion possible pairs — too many for pairwise LLM calls. Embeddings retrieve a shortlist per item cheaply; classical scoring (Splink) filters with full explainability (important for a government audit trail); the LLM only touches the small number of genuinely hard cases. This design signals real engineering judgment to judges, not just "we called an API."

## 4. Do we need an LLM? Can this run 100% offline?

**Yes, fully offline — and it should be, for this use case.** CPSE procurement data (what a refinery/power plant buys, and how much) is commercially sensitive; sending it to a cloud API is a real objection a government judge will raise. Answer it by design.

| Layer | What it is | Size | Offline? |
|---|---|---|---|
| Text cleanup / abbreviation expansion | Rules + dictionary, no ML | — | Yes |
| Attribute extraction | spaCy rules; optional fine-tuned DistilBERT NER | 0–250 MB | Yes |
| Embeddings (candidate retrieval) | Pretrained sentence-transformer (all-MiniLM / BGE-small) | ~80–130 MB, CPU-friendly | Yes |
| Match scoring | **Splink** — classical Fellegi-Sunter statistics, trained unsupervised via EM, no neural net | tiny | Yes |
| Hard-case pairwise verdict | Fine-tuned cross-encoder (small BERT) | ~100–400 MB | Yes |
| UNSPSC classification | Embedding nearest-neighbor vs. category titles | reuses embedder | Yes |
| LLM (optional, for 3 specific jobs below) | Local 7–8B model via Ollama/llama.cpp, quantized | ~5 GB | Yes |

**Where an LLM genuinely helps (and can be fully local):**
1. Generating the final standardized golden-record description from extracted attributes.
2. Explaining *why* two records matched, in plain language, for the steward review screen.
3. Reasoning about functional equivalence across brands (e.g., SKF 6205 ≈ FAG 6205 — same spec, different manufacturer).

None of these require accuracy beyond what a local 7B model (Qwen 2.5 7B / Llama 3.1 8B, quantized, via Ollama) provides. Matching accuracy itself does **not** depend on an LLM — embeddings + Splink + a fine-tuned cross-encoder is the standard research-grade pipeline (~85–90% F1 on benchmark data), and anything still ambiguous goes to the human steward queue by design — that's the point of the approval workflow the PS requires.

**Presentation angle:** "Fully air-gapped deployment — every model is open-weight and runs on-premises inside CPSE data centers. No data ever leaves government infrastructure, no per-token API costs, MeitY/data-sovereignty compliant by design."

## 5. Tech stack (final pick — all MIT/Apache/BSD, no GPU cluster required)

| Layer | Choice | Why |
|---|---|---|
| Backend | FastAPI + PostgreSQL + **pgvector** | one DB holds items, embeddings, audit trail — zero extra infra |
| Candidate retrieval | **BGE-small** or **all-MiniLM** embeddings → pgvector ANN | fast, CPU-only, good short-text performance |
| Hybrid keyword search | Meilisearch (or OpenSearch) | exact part-number matching alongside semantic search |
| Match scoring | **Splink** (UK Ministry of Justice, MIT) | unsupervised, ~1M records/min on a laptop, built-in match-quality visualizations — great demo material |
| Hard-case adjudication | Local LLM, "select-best-candidate" prompting (ComEM-style) | cheaper & more accurate than pairwise yes/no prompting |
| Attribute extraction | spaCy EntityRuler + regex + custom MRO abbreviation dictionary | **no open-source MRO abbreviation dictionary exists** — building one for Indian PSU conventions is genuine, defensible project IP |
| Classification | Embedding nearest-neighbor vs. UNSPSC titles (DistilBERT fine-tune if time allows) | no pretrained UNSPSC classifier exists publicly; this is the standard DIY pattern |
| Review/approval UI | Custom React queue (or Label Studio to save dev time) | human-in-the-loop is explicitly required by the PS |
| Frontend | React + Tailwind + Recharts | dashboard, KPIs, audit trail |

**Avoid:** Pimcore (quietly stopped being open source at v12, 2025 — do not claim it), py_entitymatching / DeepMatcher (dormant since ~2023), Zingg (AGPL license — complicates any productization claim).

## 6. Datasets — what's real, what's a dead end (all verified live)

**Bad news, confirmed:** no public Indian material-master dataset exists anywhere.
- Kaggle "sku-dataset" — verified dead end (one unrelated JPG, 16 downloads).
- data.gov.in "procurement" tag — verified: only agricultural MSP data (wheat, paddy, milk), nothing item-code related.
- GeM (gem.gov.in) — no bulk download/API, browse-only.
- Coal India / SAIL / NTPC / ONGC — no public stores catalogs found.
- IREPS / Indian Railways — no item master downloadable without login (only the IR-USSOR 2021 civil-works rate schedule is free — useful for narrative, not training data).

**This is actually good news for you:** since the official PS also says data will only be "provided by participating CPSEs" (i.e., not available pre-hackathon), everyone is in the same boat — and you can turn synthetic data into a strength by controlling ground truth.

**What to actually use, verified free & downloadable today:**

| Resource | What it is | Use |
|---|---|---|
| **DLA PUB LOG** (dla.mil) | Free monthly ZIP, no login — millions of real US federal supply items with names, characteristics, and 13-digit NSN codes | Seed realistic item names/specs (filter to bearings, valves, gaskets, pumps — CPCL's world) |
| SAP Help Portal sample Item Master CSV schema | Official SAP field template (material ID, description, UOM, category) | Template for realistic column structure when generating synthetic multi-CPSE data |
| **UNSPSC** | Free PDF codeset, 8-digit 4-level hierarchy (Segment→Family→Class→Commodity), free for commercial embedding | Backbone taxonomy for the Common National Material Code |
| **GS1 GPC** | Fully free download (JSON/XML/XLSX), ~40,000 "bricks," 4-level hierarchy | Alternate/secondary taxonomy |
| **ETIM** (English master) | Free CSV/Excel, 5,145 classes, technical features | Secondary taxonomy for electrical/mechanical specs |
| eCl@ss | Browsing free, **bulk data is paywalled** | Reference only — don't build on it |
| Magellan / DeepMatcher benchmark sets (Abt-Buy 9,575 pairs, Amazon-Google 11,460, Walmart-Amazon 10,242) — `pages.cs.wisc.edu/~anhai/data1/deepmatcher_data/` | Labeled product-matching pairs | Train/tune your matcher and **report real precision/recall/F1** — no other team will have measured this |
| WDC Product Data Corpus v2 | 16M offer clusters (site was down at check time — recheck) | Larger-scale benchmark if available |

**Demo data strategy:** take real PUB LOG item names/specs → programmatically "corrupt" each into 4 different CPSE house styles (abbreviations, reordering, typos, unit differences, SAP short-text truncation) using the SAP schema as the column template. Because you generated the duplicates yourself, you know ground truth — your dashboard can report exact detection accuracy with receipts.

## 7. Resource links

### Datasets & taxonomies
- DLA PUB LOG (free NSN/federal supply data, monthly ZIP, no login): https://www.dla.mil/Information-Operations/PUBLOG/
- SAP sample Item Master CSV schema (field template): https://help.sap.com/docs/buying-invoicing/procurement-data-import-and-administration-guide/sample-item-master-csv-file-formats
- UNSPSC codeset (free PDF): https://www.unspsc.org/
- UNSPSC unofficial CSV mirror (verify against official before use): https://data.ok.gov/dataset/unspsc-codes
- GS1 GPC browser & downloads (free JSON/XML/XLSX): https://gpc-browser.gs1.org/
- ETIM International downloads (free English master): https://www.etim-international.com/downloads/
- eCl@ss (bulk data paywalled, browse free): https://eclass.eu/
- Magellan Data Repository (benchmark index): https://sites.google.com/site/anhaidgroup/useful-stuff/the-magellan-data-repository
- DeepMatcher/Magellan dataset downloads (Abt-Buy, Amazon-Google, Walmart-Amazon, etc.): https://github.com/anhaidgroup/deepmatcher/blob/master/Datasets.md (direct files at `pages.cs.wisc.edu/~anhai/data1/deepmatcher_data/{Structured|Textual|Dirty}/<Name>/<name>_exp_data.zip`)
- WDC Product Data Corpus v2 (recheck availability): https://webdatacommons.org/largescaleproductcorpus/v2/
- data.gov.in (procurement search — dead end for item codes, useful only to double-check): https://data.gov.in/
- GeM (browse-only, no bulk API): https://gem.gov.in/
- Indian Railways IREPS: https://www.ireps.gov.in/
- IR-USSOR 2021 unified rate schedule (PDF, narrative precedent only): https://indianrailways.gov.in/railwayboard/uploads/directorate/civil_engg/pdf/2022/IRUSSOR%20-%202021%20(SOR)%2028_07_2022.pdf

### Matching / entity-resolution libraries
- Splink (recommended core matcher): https://github.com/moj-analytical-services/splink
- Zingg (AGPL — reference only): https://github.com/zinggAI/zingg
- dedupe: https://github.com/dedupeio/dedupe
- RecordLinkage: https://github.com/J535D165/recordlinkage
- py_entitymatching / Magellan (dormant — reference only): https://github.com/anhaidgroup/py_entitymatching
- JedAI: https://github.com/scify/JedAIToolkit
- Ditto (BERT-based EM): https://github.com/megagonlabs/ditto
- DeepMatcher (dormant — reference only): https://github.com/anhaidgroup/deepmatcher
- AnyMatch (zero-shot LLM EM): https://github.com/Jantory/anymatch
- MatchGPT (LLM prompting recipes for EM): https://github.com/wbsg-uni-mannheim/MatchGPT
- ComEM (LLM "select" strategy, COLING 2025): https://github.com/tshu-w/ComEM

### Embeddings & vector search
- all-MiniLM-L6-v2 (sentence-transformers): https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
- BGE-small-en-v1.5: https://huggingface.co/BAAI/bge-small-en-v1.5
- BGE-M3 (dense+sparse hybrid): https://huggingface.co/BAAI/bge-m3
- GTE-multilingual-base: https://huggingface.co/Alibaba-NLP/gte-multilingual-base
- pgvector: https://github.com/pgvector/pgvector
- FAISS: https://github.com/facebookresearch/faiss
- Qdrant: https://github.com/qdrant/qdrant
- Meilisearch: https://github.com/meilisearch/meilisearch
- OpenSearch: https://github.com/opensearch-project/OpenSearch

### Attribute extraction & classification
- spaCy (EntityRuler, Matcher): https://spacy.io/
- OpenTag unofficial reimplementation: https://github.com/lumiqai/UOI-1806.01264
- NeuralNLP-NeuralClassifier (hierarchical text classification, adaptable to UNSPSC levels): https://github.com/Tencent/NeuralNLP-NeuralClassifier
- ClassiCore-Public (UNSPSC-style classifier reference architecture): https://github.com/Shakeel77-creator/ClassiCore-Public

### Review UI & local LLM serving
- Label Studio (human-in-the-loop review queues): https://github.com/HumanSignal/label-studio
- Ollama (run local LLMs — Qwen2.5, Llama 3.1, etc.): https://ollama.com/
- Pimcore (no longer fully open source since v12 — reference architecture only): https://pimcore.com/