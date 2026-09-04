# PRAHARI — Predictive Risk Analytics for Herd Alerting & Rapid Intervention
## SIH 2026 | Problem ID: 26109 | Category: **Hardware**

**Ministry of Fisheries, Animal Husbandry & Dairying** · Department of Animal Husbandry & Dairying (DAHD)
Theme: Agriculture, FoodTech & Rural Development

> *Prahari* (प्रहरी) — sentinel. The system watches so the farmer doesn't have to.

An early-warning system for bovine mastitis that predicts clinical onset **7–14 days ahead**, at animal and herd level, for **₹24 per animal** — by putting the hardware where India's milk already goes: the village collection point.

---

## Table of Contents

- [The problem](#the-problem)
- [What makes this entry different](#what-makes-this-entry-different)
- [The hardware decision](#the-hardware-decision)
- [The two ideas that carry the method](#the-two-ideas-that-carry-the-method)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Honest limitations](#honest-limitations)
- [Quick start](#quick-start)
- [Documentation map](#documentation-map)

---

## The problem

By the time a farmer can see mastitis, the money is already gone.

| | |
|---|---|
| Subclinical mastitis prevalence in India | **45%** — invisible without a test |
| Clinical prevalence | **18%** |
| Loss per affected lactation | **₹1,390** (49% milk value, 37% vet cost) |
| Daily loss, DAHD's own figure | **₹306–458/day** yield + **₹150–200/day** discarded milk |
| Yield reduction in India vs the US | **21% vs ~11%** |
| Post-milking teat-dip adoption in India | **2–25%** |

Sources for every figure: [`docs/domain-brief.md`](docs/domain-brief.md).

The last row is the real problem. The preventive measures are known, cheap, and unused. Decades of extension messaging produced 2–25% adoption. **Information has already failed.** What has not been tried is a specific, timed, named instruction delivered to the person actually holding the udder — who, 60–80% of the time in India, is a woman.

---

## What makes this entry different

| Most entries will | PRAHARI does |
|---|---|
| Present a conductivity sensor as the innovation | Open with the literature showing **EC alone is ~66% sensitive** ([PubMed 1532805](https://pubmed.ncbi.nlm.nih.gov/1532805/)), then show what actually fixes it |
| Design for a farm with a milking parlour | Design for **1–5 animals, hand-milked, no reliable power** — and put the hardware at the AMCU |
| Claim 95%+ accuracy | Cite [Zhou et al. 2026](https://doi.org/10.3390/ani16020204) — **AUC 0.789 at 14 days** — as the state of the art we measure against |
| Report AUC-ROC on a <1% positive rate | Report **AUC-PR**, precision@budget, and a lead-time IQR, cross-validated **by herd** |
| Alert on everything | Cap alerts at **5% of the herd per day**, with band hysteresis |
| Promise SMS alerts | Know what **TRAI DLT registration** is, and say why SMS is a post-hackathon step |
| Claim a live government API integration | Say plainly that **no public API exists**, and ship a working **ICAR ADE** export instead |
| Quietly train on a European dataset | State that **no public Indian mastitis dataset exists**, show the search, and label simulated data as simulated |

---

## The hardware decision

This is the choice the whole entry rests on.

Every credible commercial mastitis system in the world — DeLaval Herd Navigator, Lely MQC-C, Afimilk MPC — is an in-line sensor in a robotic or rotary parlour, installed for **$50,000–150,000**. They work, and they are irrelevant to India:

- **86% of Indian dairy farmers hold 1–5 animals**; the national average is **under two milking cows**
- **85.5% of milking is by hand**, twice a day
- The shed has no reliable power

**What India does have, at national scale, is the collection point.** 228,374 village Dairy Cooperative Societies, each with an **Automatic Milk Collection Unit** already measuring fat and SNF per farmer per shift — and whose [NDDB specification](https://www.nddb.coop/sites/default/files/pdfs/AMCU_Technical%20Specification_.pdf) explicitly designs for *"no regular power supply, non-IT-savvy operators, dusty environments."*

So our primary hardware is a **₹2,722 retrofit module on the AMCU sample path**, serving 100–500 animals per village.

```
TIER 0   no hardware       app + records + IMD weather                    ₹0/animal
TIER 1   existing AMCU     shift yield + FAT + SNF, already measured      ₹0/animal
TIER 2   AMCU module       + conductivity, milk temp, CMT-assist       ₹5–27/animal  ◀ primary
TIER 3   per-animal        + quarter wand ₹419 · collar ₹1,641      ₹419–1,641/animal
```

Every tier is scored by the same calibrated pipeline — the model simply sees more columns, with calibration re-fit per tier so a Tier-0 farm gets honest probabilities rather than confident nonsense. **A union deploys Tier 0/1 across every village on day one and buys Tier 2 modules out of the losses avoided.**

Full costed BOMs, every price sourced, every estimate flagged: [`docs/hardware.md`](docs/hardware.md).

---

## The two ideas that carry the method

### 1. The cow is her own control

Absolute conductivity, yield and activity vary enormously with breed (HF-cross vs Sahiwal vs Murrah buffalo), parity, days-in-milk and season. A global threshold on raw conductivity is exactly why the technique has a poor reputation in the literature.

PRAHARI never compares an animal to the herd. It compares **her today to her own trailing 10-milking baseline** for the same session, as a robust median/MAD z-score. Breed, stage and season fall out of the arithmetic instead of needing to be modelled and corrected.

### 2. Four quarters, one udder, one milking

Mastitis is a *quarter-level* event. The strongest early feature is not the level of anything — it is the **asymmetry across the four quarters at the same milking**:

```
    A_EC = max_q(EC_q) / median_q(EC_q)
```

Ambient temperature, milking vacuum, the operator, and the animal's stress that morning are all **shared by all four quarters**, so the ratio cancels every one of them. This is a matched-pairs design, and it is what buys the lead time.

---

## Architecture

Full diagrams — Mermaid system graph, sequence diagram, PlantUML component view, ASCII deployment, and the data flow through the prediction math — are in [`docs/architecture-diagram.md`](docs/architecture-diagram.md). The slide-sized flow panel is in [`docs/implementation-flow.md`](docs/implementation-flow.md).

```
  FIELD                        CLOUD (one 8 vCPU / 16 GB VM, ~500 herds)
  ─────                        ────────────────────────────────────────
  AMCU module  ┐                ┌─ Mosquitto ─ Valkey ─ TimescaleDB ─┐
  Quarter wand ├─ LoRa IN865 ─▶ │                                    │
  Collar       │  or BLE        │  feature builder → LightGBM hazard │
  Barn node    ┘                │  → isotonic → alert budget → SHAP  │
       │                        │  → template → FCM / vet console    │
  Gateway (solar,               └────────────┬───────────────────────┘
  72 h spool)                                │
                                  farmer PWA · vet console · district GIS
                                             │
                                    outcome ─┴─▶ nightly retrain
```

**The pipeline, in five stages:**

```
① INGEST     six adapters → one `observations` schema, idempotent
② BASELINE   per-animal robust z-scores + within-udder quarter asymmetry
③ PREDICT    LightGBM discrete-time hazard on cow-days
             positives ∈ [onset−14, onset−7];  (onset−7, onset] BLANKED
④ RESTRAIN   alert budget ≤5%/day · hysteresis · SHAP → intervention template
⑤ LEARN      one-tap outcome → nightly champion/challenger retrain
```

**The blanking window is the whole game.** Days immediately before onset carry obvious pre-clinical signal; including them as positives inflates every metric and produces a model that *detects* mastitis rather than *forecasting* it. We drop them rather than label them negative. If your metrics look wonderful, you have this bug.

---

## Technology stack

Every licence was verified during research. Where a well-known tool has a licence trap, we name it.

| Layer | Pick | Licence |
|---|---|---|
| Edge firmware | ESP32 + ESP-IDF | Apache-2.0 |
| LoRaWAN server | ChirpStack | MIT |
| MQTT broker | Eclipse Mosquitto | EPL-2.0 / EDL-1.0 |
| Stream buffer | **Valkey** — *not current Redis (SSPL/RSAL since 7.4)* | BSD-3 |
| Time-series + relational | TimescaleDB on PostgreSQL | Apache-2.0 core |
| Spatial | PostGIS + H3 (`h3-pg`) | GPL-2.0+ / Apache-2.0 |
| API | FastAPI + Pydantic | MIT |
| Jobs | Celery | BSD-3 |
| Model | LightGBM + isotonic calibration | MIT |
| Survival cross-check | lifelines, XGBoost AFT — *not scikit-survival (GPL-3.0)* | MIT / Apache-2.0 |
| Explainability | SHAP TreeExplainer | MIT |
| Online learning | River | BSD-3 |
| Client | React + TS + Tailwind, offline-first PWA | MIT |
| Maps | MapLibre GL + deck.gl — *not Mapbox GL v2+ (paid)* | BSD-3 / MIT |
| Boundaries | DataMeet — ***not GADM (non-commercial, non-redistributable)*** | CC BY |
| Languages | AI4Bharat IndicTrans2 / IndicConformer / Indic Parler-TTS | MIT / Apache-2.0 |
| Deploy | Docker Compose, one VM, no GPU | — |

**Also rejected, with reasons:** Kafka (6–8 GB RAM for a few thousand messages/day) · EMQX (BSL 1.1 since v5.9) · Moirai (CC BY-NC) · TimesFM 3.0 weights (non-commercial) · Lag-Llama (unmaintained since June 2024) · PySurvival (last release 2019) · LIME (last release 2020, slower than TreeSHAP) · RxDB premium plugins (paid annual licence). Full rationale: [`plan.md`](plan.md) §5.

**No LLM sits in the prediction path.** Recommendation text comes from a fixed, vet-reviewed template catalogue keyed by SHAP driver. The system never names an antibiotic — treatment decisions stay with the registered veterinarian. That is a deliberate architectural refusal, and it is also the antimicrobial-stewardship argument.

---

## Honest limitations

Stated here, on the roadmap slide, and volunteered in Q&A before anyone has to ask.

1. **Conductivity alone is a weak test.** ~66% sensitivity / ~94% specificity in meta-analysis; Kandeel et al. 2019 found AUC < 0.90 for every hand-held EC meter and concluded they are not clinically useful standalone. Our answer is fusion plus the per-animal baseline, not a better electrode.
2. **There is no public, animal-level, mastitis-labelled Indian sensor dataset.** We searched data.gov.in, ICAR, NDDB, NDRI, Kaggle, Mendeley, Zenodo, UCI and HuggingFace — the record is in [`plan.md`](plan.md) §6. We train on the one CC-BY dataset that exists plus a seeded simulator whose parameters are a citation-backed table. **Simulated data is labelled SIMULATED in the UI, the deck and here.**
3. **7–14 days is a distribution, not a guarantee.** The published state of the art at that horizon is AUC 0.789 with sensitivity 0.500. We report lead time as a median with an IQR and say how often we were early, on time, or too late.
4. **Buffaloes are not cows.** Murrah and Mehsana baseline conductivity and SCC behaviour differ from HF-crossbred cattle. The per-animal-baseline design handles this structurally; we still stratify every validation report by species.
5. **No live government integration.** INAPH, Bharat Pashudhan and NDLM have no public developer portal we could find. We key to the 12-digit Pashu Aadhaar, export ICAR ADE JSON, and state that live integration needs a DAHD/NDDB MoU.
6. **SMS and WhatsApp are not in the demo.** TRAI DLT registration (three layers, PAN/GST, 1–3 weeks, carrier-side template scrubbing) and Meta's verification/BSP/per-message pricing are both real and both outside a hackathon window.

---

## Quick start

```bash
docker compose up -d
docker compose exec api python -m app.seed --herds 3 --animals 300 --days 400
docker compose exec api python -m app.models.train --tier all
```

| Service | URL |
|---|---|
| Farmer PWA / dashboard | http://localhost:3000 |
| API + OpenAPI docs | http://localhost:8000/docs |
| ChirpStack | http://localhost:8080 |
| MLflow | http://localhost:5000 |
| Grafana | http://localhost:3001 |
| MQTT | localhost:1883 (8883 TLS) |

> **Set `LORA_REGION=IN865`, never `EU868`.** India's licence-exempt band is 865–867 MHz, not the 868 MHz baked into most LoRa tutorials. See [`docs/hardware.md`](docs/hardware.md) §3.2.

---

## Documentation map

| Document | What's in it |
|---|---|
| [`plan.md`](plan.md) | The whole plan in plain English — problem, capability mapping, stack with licence verification, datasets (what's real and what's a dead end), literature benchmarks, interoperability position, resource links |
| [`docs/domain-brief.md`](docs/domain-brief.md) | Vet and policy knowledge: clinical facts, Indian risk factors, economics, AMR, government systems, competitive landscape, **ten numbers for the deck**, and **five questions that would sink us** with the honest answer to each |
| [`docs/hardware.md`](docs/hardware.md) | Sensor research, three costed BOMs with sourced INR prices, deployment scenarios, IN865 regulatory rules, 3-day vs production comparison, and every UNVERIFIED item in one table |
| [`docs/architecture-diagram.md`](docs/architecture-diagram.md) | Mermaid system graph · sequence diagram · PlantUML component view · ASCII deployment · the data flow through the prediction math · threat model |
| [`docs/implementation-flow.md`](docs/implementation-flow.md) | The slide-sized flow panel, stage-to-code mapping, PS capability mapping, Mermaid source, and the caveats that belong on the slide |
| [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) | Repo layout, database schema, feature and label code, model configuration, API surface, day-by-day plan, deployment, and a pitfalls table |
| [`docs/ppt-content.md`](docs/ppt-content.md) | Seventeen slides of content, speaker notes, design guidelines, and the ten-slide budget for a 10-minute pitch |
| [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md) | How to run and rehearse the demo |

---

## Licence

Code: MIT. Documentation: CC BY 4.0. Third-party components retain their own licences as listed above.
