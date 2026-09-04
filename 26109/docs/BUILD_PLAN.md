# PRAHARI — Complete Build Plan

**PS 26109** · AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis in Indian Dairy Farms
DAHD, Ministry of Fisheries, Animal Husbandry & Dairying · Category: **Hardware**

---

## Table of Contents

1. [Part 1 — The Problem, The Solution, The Approach (Plain English)](#part-1--the-problem-the-solution-the-approach-plain-english)
2. [Part 2 — Detailed Technical Guide](#part-2--detailed-technical-guide)
3. [Part 3 — The Data Problem, and How We Handle It Honestly](#part-3--the-data-problem-and-how-we-handle-it-honestly)
4. [Part 4 — Day-by-Day Execution Plan](#part-4--day-by-day-execution-plan)
5. [Part 5 — Docker & Deployment](#part-5--docker--deployment)
6. [Appendix A: Common Pitfalls](#appendix-a-common-pitfalls)
7. [Appendix B: Demo Script](#appendix-b-demo-script)
8. [Appendix C: Resources](#appendix-c-resources)

---

## Part 1 — The Problem, The Solution, The Approach (Plain English)

### 1.1 What the problem actually is

A farmer discovers mastitis when the udder is hot and the milk has clots. By then the yield for that lactation is gone, the milk is unsaleable through the withdrawal period, and someone reaches for an antibiotic — usually broad-spectrum, usually without a culture.

Three facts define the problem in India specifically:

- **Subclinical mastitis prevalence is 45%; clinical is 18%** (Krishnamoorthy et al. 2021, meta-analysis of Indian studies). Subclinical cases look completely normal and are found only by testing.
- **DAHD's own strategy document** puts the cost at ₹306–458/day in lost yield plus ₹150–200/day in discarded milk for an affected high-yielding cow.
- **The preventive measures are already known and already cheap, and adoption is 2–25%.** Information has already failed. See [`domain-brief.md`](domain-brief.md) §2.

### 1.2 What we are building

An early-warning system that predicts clinical mastitis **7–14 days before onset**, at animal and herd level, and turns each prediction into **one specific instruction for the person who does the milking**.

Three components:

1. **Hardware** — a ₹2,722 retrofit module on the village AMCU's sample path (conductivity, milk temperature, CMT-assist), plus optional per-animal wand and collar for larger herds.
2. **Prediction engine** — a discrete-time hazard model on cow-days, calibrated, explained, and restrained by a daily alert budget.
3. **Delivery** — an offline-first PWA in seven languages with voice, a vet triage console, a cooperative/district GIS view, and a one-tap outcome loop that retrains the model.

### 1.3 How we are doing it — the 5-stage pipeline

```
  ① INGEST      AMCU records · retrofit sensors · farm records
                lab SCC/culture · farmer app · IMD weather
                    ↓  one `observations` schema, six adapters

  ② BASELINE    per-animal trailing median + MAD → robust z-scores
                quarter asymmetry: max/median across one udder
                    ↓  the cow is her own control

  ③ PREDICT     LightGBM discrete-time hazard on cow-days
                positives from [onset−14, onset−7]; (onset−7, onset] BLANKED
                    ↓  isotonic calibration → an honest probability

  ④ RESTRAIN    alert budget ≤5% of herd/day · hysteresis on bands
                SHAP top-3 drivers → intervention template
                    ↓  one named animal, one named quarter, one action

  ⑤ LEARN       one-tap outcome capture → nightly champion/challenger
                promote only on held-out-HERD AUC-PR improvement
```

### 1.4 What we are NOT building

- **No LLM in the prediction path.** Gradient-boosted trees on tabular features. CPU-only.
- **No generative advice.** Recommendations come from a fixed, vet-reviewed template catalogue. The system never names an antibiotic.
- **No claim of live government API integration.** No public developer portal exists for INAPH or Bharat Pashudhan. We build schema compatibility and state the MoU path.
- **No per-cow hardware as the primary product.** See [`hardware.md`](hardware.md) §1.
- **No fabricated dataset provenance.** Simulated data is labelled SIMULATED in the UI, the deck and the README.

### 1.5 Why this can win

| Most entries will | We do |
|---|---|
| Put a conductivity sensor on a cow and call it innovation | Open with the literature showing EC alone gets ~66% sensitivity, then show what fixes it |
| Design for a farm with a robotic parlour | Design for 1–5 animals, hand-milked, no power — and put the hardware at the AMCU |
| Claim 95%+ accuracy | Cite Zhou et al. 2026 (AUC 0.789 at 14 days) as the state of the art we measure against |
| Report AUC-ROC on a <1% positive rate | Report AUC-PR, precision@budget, and a lead-time IQR |
| Alert on everything | Cap alerts at 5% of the herd per day, with hysteresis |
| Promise SMS alerts | Know what TRAI DLT registration is and say why SMS is a post-hackathon step |
| Claim a government API integration | Say plainly that no public API exists, and ship an ICAR ADE export instead |

---

## Part 2 — Detailed Technical Guide

### 2.1 Repository layout

```
26109/
├── firmware/
│   ├── amcu/            # ESP32 — AMCU retrofit module (PRIMARY)
│   ├── wand/            # ESP32 — handheld quarter wand, BLE
│   ├── collar/          # ESP32 — activity/rumination, LoRa
│   ├── station/         # MLX90614 udder-temp station
│   ├── gateway/         # LoRa concentrator + SQLite spool
│   └── common/          # AC-excited EC driver, temp compensation, packet codec
├── backend/
│   ├── app/
│   │   ├── ingest/      # mqtt.py amcu.py lab.py manual.py farm.py env.py
│   │   ├── pipeline/    # quality.py
│   │   ├── features/    # baseline.py asymmetry.py behaviour.py herd.py context.py
│   │   ├── labels/      # onset.py
│   │   ├── models/      # hazard.py tier0.py calibrate.py survival.py drift.py
│   │   ├── alerts/      # banding.py explain.py rules.py
│   │   ├── learn/       # feedback.py retrain.py
│   │   ├── routers/     # animals herds alerts gis ingest export
│   │   └── i18n/        # phrase catalogue, 7 languages
│   ├── datasets/
│   │   ├── real/        # Mendeley CC-BY set + MANIFEST.md
│   │   └── simulator/   # seeded Indian-context generator + PARAMS.md
│   └── tests/
├── frontend/            # React + TS + Tailwind PWA
├── docs/                # this folder
└── docker-compose.yml
```

### 2.2 Database schema

Two logical stores, one Postgres instance (TimescaleDB extension for the hypertables, PostGIS for geography).

```sql
-- ── Identity ────────────────────────────────────────────────────────────
CREATE TABLE farms (
  id              UUID PRIMARY KEY,
  dcs_id          UUID REFERENCES societies(id),
  owner_name      TEXT,
  village         TEXT,
  district        TEXT,
  geom            GEOMETRY(Point, 4326),   -- PostGIS
  h3_r7           TEXT                     -- hex bin for the hotspot layer
);

CREATE TABLE societies (              -- the village Dairy Cooperative Society
  id              UUID PRIMARY KEY,
  name            TEXT,
  union_id        UUID,
  amcu_serial     TEXT,
  tier            SMALLINT             -- 0..3, drives which model variant scores it
);

CREATE TABLE animals (
  id              UUID PRIMARY KEY,
  farm_id         UUID REFERENCES farms(id),
  pashu_aadhaar   CHAR(12),            -- national 12-digit ear tag; hashed at rest
  species         TEXT,                -- CATTLE | BUFFALO
  breed           TEXT,                -- HF_CROSS | JERSEY_CROSS | SAHIWAL | MURRAH | ...
  dob             DATE,
  parity          SMALLINT,
  last_calving    DATE,
  dry_off         DATE,
  status          TEXT                 -- MILKING | DRY | CULLED
);

-- ── Observations (TimescaleDB hypertables) ──────────────────────────────
CREATE TABLE observations (
  ts              TIMESTAMPTZ NOT NULL,
  animal_id       UUID,                -- NULL when the record is farmer-level (AMCU)
  farm_id         UUID NOT NULL,
  device_id       TEXT,
  channel         TEXT NOT NULL,       -- ec | milk_temp | yield | fat | snf |
                                       -- activity | rumination | udder_dt | ambient_t | rh
  quarter         TEXT,                -- LF | RF | LR | RR | NULL for composite
  value           DOUBLE PRECISION,
  quality         SMALLINT,            -- 0 ok, 1 interpolated, 2 suspect, 3 sensor fault
  UNIQUE (device_id, ts, channel, quarter)   -- ingest is idempotent
);
SELECT create_hypertable('observations', 'ts');

CREATE TABLE milkings (
  ts              TIMESTAMPTZ NOT NULL,
  animal_id       UUID,
  farm_id         UUID NOT NULL,
  session         TEXT,                -- AM | PM
  yield_total     DOUBLE PRECISION,
  yield_q         JSONB,               -- {"LF":2.9,"RF":3.1,"LR":2.7,"RR":1.8}
  ec_q            JSONB,
  milk_temp       DOUBLE PRECISION,
  fat             DOUBLE PRECISION,    -- from the AMCU
  snf             DOUBLE PRECISION,
  source          TEXT                 -- AMCU | MODULE | WAND | MANUAL
);
SELECT create_hypertable('milkings', 'ts');

-- ── Clinical events, the label source ───────────────────────────────────
CREATE TABLE health_events (
  id              UUID PRIMARY KEY,
  animal_id       UUID NOT NULL,
  ts              TIMESTAMPTZ NOT NULL,
  kind            TEXT,                -- CLINICAL_MASTITIS | CMT | SCC | CULTURE |
                                       -- TREATMENT | VACCINATION | DRY_OFF
  quarter         TEXT,
  cmt_score       SMALLINT,            -- 0..3
  scc             INTEGER,             -- cells/mL
  pathogen        TEXT,
  recorded_by     TEXT,                -- FARMER | PARAVET | VET | LAB
  confidence      TEXT                 -- CONFIRMED | PROBABLE  (labels use CONFIRMED)
);

-- ── Model output ────────────────────────────────────────────────────────
CREATE TABLE risk_scores (
  ts              TIMESTAMPTZ NOT NULL,
  animal_id       UUID NOT NULL,
  p_raw           DOUBLE PRECISION,
  p_calibrated    DOUBLE PRECISION,
  band            TEXT,                -- NONE | LOW | MODERATE | HIGH
  tier            SMALLINT,
  model_version   TEXT,
  drivers         JSONB                -- [{"feature":"ec_asym","shap":0.21}, ...]
);
SELECT create_hypertable('risk_scores', 'ts');

CREATE TABLE alerts (
  id              UUID PRIMARY KEY,
  animal_id       UUID NOT NULL,
  raised_at       TIMESTAMPTZ NOT NULL,
  band            TEXT,
  p_calibrated    DOUBLE PRECISION,
  drivers         JSONB,
  template_id     TEXT,                -- key into the intervention catalogue
  language        TEXT,
  delivered_via   TEXT[],              -- {push, sms, vet_console}
  outcome         TEXT,                -- CONFIRMED | NOT_CONFIRMED | TREATED | NO_RESPONSE
  outcome_at      TIMESTAMPTZ,
  outcome_by      TEXT
);
```

**Design notes worth defending:**
- `observations.animal_id` is nullable because Tier-1 AMCU data is **per farmer, not per animal**. For a 1–2 animal household these coincide; for larger households the model carries a `pooled_n` feature and the uncertainty that implies. Pretending farmer-level data is animal-level is a silent correctness bug.
- `UNIQUE (device_id, ts, channel, quarter)` makes ingest idempotent, which is what lets the gateway replay 72 hours of spool without creating duplicates.
- `health_events.confidence` exists because a farmer's report and a lab culture are not the same evidence. **Only `CONFIRMED` events generate training labels.**

### 2.3 Feature engineering — where the lead time comes from

```python
# app/features/baseline.py
def robust_z(series: pd.Series, window: int = 10) -> pd.Series:
    """Deviation from the animal's OWN recent history, in MAD units.

    Median + MAD rather than mean + SD because a single mastitic milking
    would inflate an SD-based baseline and hide the next one.
    """
    med = series.shift(1).rolling(window, min_periods=5).median()
    mad = (series.shift(1)
                 .rolling(window, min_periods=5)
                 .apply(lambda w: np.median(np.abs(w - np.median(w))), raw=True))
    return (series - med) / (1.4826 * mad + 1e-9)
```

```python
# app/features/asymmetry.py
QUARTERS = ("LF", "RF", "LR", "RR")

def quarter_asymmetry(ec_q: dict[str, float]) -> dict[str, float]:
    """Matched-pairs within one udder at one milking.

    Ambient temperature, vacuum, operator and the animal's stress are shared
    by all four quarters, so a ratio across them cancels every one of those
    confounders without having to model any of them.
    """
    vals = np.array([ec_q[q] for q in QUARTERS if ec_q.get(q) is not None])
    if len(vals) < 3:
        return {"ec_asym_max_med": np.nan, "ec_asym_range": np.nan, "ec_n_q": len(vals)}
    return {
        "ec_asym_max_med": float(vals.max() / np.median(vals)),
        "ec_asym_range":   float(vals.max() / vals.min()),
        "ec_n_q":          len(vals),
    }
```

**Feature families** (~120 columns; every one is a deviation, a ratio, or a stable covariate — almost nothing is a raw absolute sensor level, and that is deliberate):

| Family | Examples | Available from |
|---|---|---|
| Per-animal deviation | `ec_z`, `yield_z`, `milk_temp_z`, `fat_z`, `snf_z` over 1/3/7/14-day windows | Tier 1 |
| Quarter asymmetry | `ec_asym_max_med`, `ec_asym_range`, `yield_asym`, plus per-quarter history | Tier 3a |
| Composition | `fat_snf_ratio`, its 7-day slope, deviation from her own lactation curve | **Tier 1 — free** |
| Behaviour | `rumination_delta`, `activity_delta`, `lying_bout_len_delta` | Tier 3b |
| Context | parity, DIM, species, breed, days since calving/dry-off, prior mastitis **in this quarter** | Tier 0 |
| Environment | `THI`, `THI_lag3`, `THI_lag7`, monsoon indicator | Tier 0 |
| Management | teat-dip practice, milking order position, housing type, bedding | Tier 0 |
| Herd pressure | bulk-tank SCC 14-day slope, herd incidence, **milked-after-a-positive-cow flag** | Tier 0/1 |
| Missingness | one indicator per family — *"we don't know" is itself informative* | all |

### 2.4 Label construction — the part that decides whether any of this is real

```python
# app/labels/onset.py
LEAD_MIN, LEAD_MAX = 7, 14   # the horizon the PS asks for

def build_labels(cow_days: pd.DataFrame, events: pd.DataFrame) -> pd.DataFrame:
    """label = 1 in [onset-14, onset-7]; NaN in (onset-7, onset]; 0 otherwise.

    The blanking window is the whole game. Days immediately before onset carry
    obvious pre-clinical signal. Including them as positives inflates every
    metric and produces a model that detects mastitis rather than forecasting
    it. Dropping them (not labelling them 0) is what makes the 7-14 day claim
    honest — labelling them 0 would actively teach the model to ignore
    genuine early signal.
    """
    onsets = (events.query("kind in ('CLINICAL_MASTITIS','CMT','SCC') "
                           "and confidence == 'CONFIRMED'")
                    .pipe(_first_qualifying_onset_per_episode))

    cow_days = cow_days.merge(onsets, on="animal_id", how="left")
    days_to = (cow_days.onset_date - cow_days.date).dt.days

    cow_days["label"] = 0
    cow_days.loc[days_to.between(LEAD_MIN, LEAD_MAX), "label"] = 1
    cow_days.loc[days_to.between(0, LEAD_MIN - 1), "label"] = np.nan   # BLANKED
    return cow_days.dropna(subset=["label"])
```

**Onset is the first of:** a `CLINICAL_MASTITIS` record, a `CMT` score ≥ 2, or an `SCC` reading above the configured threshold (default 200,000 cells/mL) — see [`domain-brief.md`](domain-brief.md) §2 for why the threshold is configurable rather than constant, and why we ship a sensitivity analysis across 150k/200k/300k.

**Episode grouping.** A single infection produces several events over a fortnight. `_first_qualifying_onset_per_episode` collapses events within a 21-day window per quarter into one onset, otherwise one infection manufactures four "cases" and the prevalence estimate is nonsense.

### 2.5 The model

```python
# app/models/hazard.py
PARAMS = dict(
    objective="binary",
    metric="average_precision",     # AUC-PR, not AUC-ROC — prevalence is <1%
    learning_rate=0.03,
    num_leaves=31,
    min_data_in_leaf=200,           # high: the positive class is tiny
    feature_fraction=0.7,
    bagging_fraction=0.8, bagging_freq=1,
    lambda_l2=5.0,
    is_unbalance=False,             # we set scale_pos_weight explicitly
)

def fit(X, y, groups):
    """GroupKFold on HERD. Never on cow-day, never on animal.

    Splitting by cow-day leaks the same animal across folds. Splitting by
    animal still leaks the herd's management practices, season and pathogen
    population. Only herd-level grouping answers the question that matters:
    'does this work on a farm we have never seen?'
    """
    spw = (y == 0).sum() / max((y == 1).sum(), 1)
    ...
```

| Concern | Choice | Why |
|---|---|---|
| Primary model | LightGBM binary on cow-days | Fastest CPU GBM on tabular; MIT |
| Imbalance | `scale_pos_weight` first; SMOTE only if it demonstrably helps | Synthetic minority samples on real sensor data invent physiology that does not exist |
| Calibration | Isotonic if the calibration fold has >1,000 samples, else sigmoid/Platt | Isotonic overfits small calibration sets — a real trap |
| Cross-validation | `GroupKFold` on **herd** | Anything less leaks |
| Cold start | `tier0.py` — management-only model | The system must be useful before any hardware is bought |
| Survival cross-check | `lifelines` Cox PH + XGBoost `survival:aft` | Sanity-check the hazard framing; Cox gives interpretable hazard ratios for the report. **Not scikit-survival — GPL-3.0** |
| Online updating | River, per-herd, between nightly retrains | PS capability #5 |
| Explainability | SHAP `TreeExplainer` | Exact and fast for tree ensembles; MIT |

**Reported metrics, always:** AUC-PR (primary) · precision@k at the herd's alert budget · sensitivity at that budget · lead-time median and IQR · calibration slope and intercept · **all stratified by species (cattle vs buffalo) and by tier.**

### 2.6 The alert budget and banding

```python
# app/alerts/banding.py
ENTER_HIGH, EXIT_HIGH = 0.60, 0.45      # hysteresis
ENTER_MOD,  EXIT_MOD  = 0.30, 0.20

def daily_alerts(scores: pd.DataFrame, herd_size: int) -> pd.DataFrame:
    """Rank by calibrated probability, notify only the top k.

    k = max(1, ceil(0.05 * herd_size)).

    The failure mode of every agricultural alerting product is alert fatigue.
    Precision at the budget is the number the farmer actually experiences,
    so we optimise for it explicitly rather than hoping a good AUC implies it.
    Everyone below the cut goes to a silent watchlist and is re-scored at the
    next milking — nothing is discarded, it is just not shouted about.
    """
    k = max(1, math.ceil(0.05 * herd_size))
    return scores.nlargest(k, "p_calibrated")
```

Hysteresis matters more than it looks: without it an animal hovering at p≈0.60 flips band twice a day, and two days of that destroys the farmer's belief that the number means anything.

### 2.7 Explanation → recommendation

SHAP drivers are not decoration; the top driver is the **lookup key** into the intervention catalogue.

```yaml
# app/alerts/templates.yaml  (excerpt — every entry vet-reviewed)
ec_asym_max_med:
  band: [MODERATE, HIGH]
  action_key: strip_and_cmt
  en: "Strip the {quarter} quarter before the next milking and run a CMT.
       Milk her last. Post-milking teat dip on all four quarters.
       Do not start antibiotics — call the vet if the CMT scores 2 or more."
  hi: "अगली दुहाई से पहले {quarter} थन की धार निकालें और CMT करें। …"
  gu: "…"

milked_after_positive:
  band: [LOW, MODERATE, HIGH]
  action_key: milking_order
  en: "Move her ahead of Cow {positive_id} in the milking order, and
       disinfect the cloth and your hands between animals."

thi_lag7:
  band: [MODERATE, HIGH]
  action_key: heat_and_bedding
  en: "Heat stress this week. Add shade and clean, dry bedding;
       change wet bedding twice daily."
```

**Hard rules, enforced in code and worth a line on the slide:**
1. No template names an antibiotic. Ever.
2. Every HIGH-band template includes the vet escalation path.
3. Language is "risk", never "diagnosis".
4. Contagious-pattern drivers produce milking-hygiene advice; environmental-pattern drivers produce housing/bedding advice. See [`domain-brief.md`](domain-brief.md) §2.

### 2.8 API surface

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/ingest/mqtt` | Internal — broker bridge |
| POST | `/ingest/amcu` | Batch AMCU shift records (CSV or JSON) |
| POST | `/ingest/lab` | SCC, culture, antibiotic sensitivity |
| POST | `/ingest/manual` | Farmer/paravet app entries |
| GET | `/animals/{id}/risk` | Current band, calibrated probability, SHAP drivers, history |
| GET | `/animals/{id}/timeline` | Milkings, events, alerts, outcomes |
| GET | `/herds/{id}/summary` | Band distribution, bulk-tank SCC trend, incidence |
| GET | `/alerts?status=open` | Vet triage queue |
| POST | `/alerts/{id}/outcome` | **The learning loop.** One tap: confirmed / not / treated |
| GET | `/gis/hotspots?res=7` | H3 hex aggregation for the district view |
| GET | `/export/ade` | **ICAR Animal Data Exchange** JSON — the interoperability claim, live |
| GET | `/model/card` | Model version, training window, metrics, known limitations |

`/model/card` exists because a judge should be able to ask the running system what it knows about its own limitations, and get an answer.

### 2.9 Firmware — the AC excitation detail

```c
// firmware/common/ec.c — the one thing that must not be done naively
//
// DC excitation across electrodes in milk polarises the electrodes and
// electrolyses the milk: readings drift within minutes and the probe
// degrades. Every hobby "conductivity sensor" tutorial gets this wrong.
//
// Drive a square wave (~1 kHz), sample differentially on the ADS1115 across
// both half-cycles, and average the magnitude. Then temperature-compensate,
// because conductivity moves ~2%/°C and milk arrives anywhere from 25-38 °C.

static float ec_read_compensated(float milk_temp_c) {
    float raw = ec_read_ac_magnitude();               // 1 kHz square, both phases
    return raw / (1.0f + EC_TEMP_COEFF * (milk_temp_c - 25.0f));
}
```

This is also why `DS18B20` is not an optional extra in the BOM — without it the conductivity channel is uninterpretable.

---

## Part 3 — The Data Problem, and How We Handle It Honestly

### 3.1 The finding

**There is no public, animal-level, mastitis-labelled Indian sensor dataset.** Searched: data.gov.in, ICAR, NDDB, NDRI Karnal, Kaggle, Mendeley, Zenodo, UCI, HuggingFace. Full search record in [`plan.md`](../plan.md) §6.

This is a finding, not a failure — and stating it is worth more than pretending otherwise. Every other team facing this will either quietly train on a European AMS dataset and imply it is Indian, or invent provenance. Neither survives a follow-up question.

### 3.2 What we actually train on

| Source | Role |
|---|---|
| [Mendeley IoT udder dataset](https://data.mendeley.com/datasets/kbvcdw5b4m/1), **CC BY 4.0** | The one confirmed-downloadable, clearly-licensed, column-known set. Bootstraps the pipeline and sanity-checks feature distributions |
| [MmCows](https://github.com/neis-lab/mmcows) (NeurIPS 2024 D&B) | Real collar/UWB/behaviour data. **No mastitis labels** — used for behaviour feature engineering only |
| `datasets/simulator/` | Seeded Indian-context cow-day generator |

### 3.3 The simulator, and why it is defensible

`datasets/simulator/PARAMS.md` is a table where **every parameter carries a citation**:

| Parameter | Value | Source |
|---|---|---|
| Subclinical prevalence | 45% | Krishnamoorthy et al. 2021 |
| Clinical prevalence | 18% | same |
| Yield reduction, clinical | 21% (India) | Bardhan 2013 |
| EC rise on infection | +10–15% | physiology, §2.1 of `hardware.md` |
| Breed susceptibility ratio | crossbred 72.3% : indigenous 65.6% : nondescript 47.2% | Punjab study, `domain-brief.md` §2 |
| Seasonality | monsoon peak, summer trough | multiple Indian studies |
| Lactation-stage risk | mid 76.5% > early 67.3% > late 61.3% | buffalo study, `domain-brief.md` §2 |

A judge can read that table and audit exactly which assumption produced which number. That is a much stronger position than an unexplained dataset.

**Labelling discipline:** simulated data is marked `SIMULATED` in the database, shown as a persistent badge in the UI, stated on the deck's roadmap slide, and stated in the README. Screenshots for the deck include the badge rather than cropping it out.

### 3.4 The phase-1 data plan

Real validation needs a labelled corpus, which needs a partner: **ICAR-NIVEDI, NDRI Karnal, or a district milk union that already runs a CMT programme.** Many unions do informal CMT at the society already; digitising that record alongside the AMCU stream is a low-cost, high-value first field study. This goes on the roadmap slide as phase 1, not into the results slide as an accomplishment.

---

## Part 4 — Day-by-Day Execution Plan

### Sprint 0 — before the hackathon

- [ ] Order hardware: 2× ESP32, SS316 electrode pair, ADS1115, DS18B20, HX711 + load cell, MPU6050, RA-02, 18650 + TP4056, IP67 box. **Order the 865–867 MHz LoRa module, not the 433 MHz RA-02** — that price is the biggest unverified gap in [`hardware.md`](hardware.md) §7
- [ ] Download the Mendeley CC-BY dataset; confirm columns against `MANIFEST.md`
- [ ] **Read the [DAHD Mastitis Strategy Document](https://dahd.gov.in/sites/default/files/2025-02/StrategyDocumentonthePreventionandControlofMastitisV-Final.pdf) end to end.** Highest-value hour anyone on the team will spend
- [ ] Read the [NDDB AMCU Technical Specification](https://www.nddb.coop/sites/default/files/pdfs/AMCU_Technical%20Specification_.pdf) — it constrains the hardware
- [ ] Get one veterinarian to review `templates.yaml`. A real name on the slide is worth a lot
- [ ] Scaffold the repo; `docker compose up` bringing up Postgres/Timescale, Mosquitto, Valkey, FastAPI, Vite
- [ ] Pre-download the AI4Bharat distilled checkpoints — **do not discover a gated model at 2 a.m.**

### Day 1 — hardware + data spine (parallel tracks)

| Track | Owner | Deliverable |
|---|---|---|
| **A — Firmware** | HW | AC-excited EC read on ADS1115 + DS18B20 temp compensation, on the bench, in a beaker of salted milk, producing a plausible curve. **This is the demo-critical artefact — do it first** |
| **B — Ingest** | BE1 | `observations`/`milkings` hypertables, MQTT bridge, idempotent upsert, six adapters, pandera contracts |
| **C — Simulator** | ML | Seeded generator + `PARAMS.md` with citations. 500 animals × 400 days |
| **D — Frontend shell** | FE | PWA scaffold, routing, i18n wiring, offline queue, risk-band design tokens |

**End-of-day gate:** a real conductivity reading from real hardware lands in TimescaleDB via MQTT. If that works on day 1, the Hardware category is secured.

### Day 2 — model + UI

| Track | Deliverable |
|---|---|
| **A — Enclosure** | Module mounted in the IP67 box with potted probe wiring; **photograph it for the deck** |
| **B — Features + labels** | `baseline.py`, `asymmetry.py`, `herd.py`, `onset.py` with the blanking window; unit tests on the leakage guard |
| **C — Model** | LightGBM + isotonic; GroupKFold on herd; metrics report (AUC-PR, precision@budget, lead-time IQR); SHAP wired |
| **D — UI** | Animal detail with driver panel, vet triage queue, herd summary, MapLibre hotspot layer |

**End-of-day gate:** an end-to-end score for one animal, with three named SHAP drivers, rendering in the UI.

### Day 3 — loop, languages, polish

| Track | Deliverable |
|---|---|
| **A** | Alert budget + hysteresis + template rendering in 7 languages; outcome capture endpoint and the one-tap UI |
| **B** | Nightly retrain job, champion/challenger, `/model/card`, `/export/ade` |
| **C** | Voice path (IndicConformer in, Parler-TTS out) on the Hindi flow at minimum |
| **D** | Seed a believable demo herd; rehearse; screenshots; render `architecture.png` and `implementation-flow.png`; assemble the deck from `ppt-content.md` |

**Cut list if time runs short, in this order:** voice → GIS hotspot layer → collar firmware → pH channel → River online updates. **Never cut:** the blanking window, herd-grouped CV, calibration, the alert budget, or the SIMULATED badge. Those five are what make the entry honest, and honesty is the differentiator.

---

## Part 5 — Docker & Deployment

```bash
# 1. Bring everything up
docker compose up -d

# 2. Seed the demo herd (simulated, clearly labelled)
docker compose exec api python -m app.seed --herds 3 --animals 300 --days 400

# 3. Train the first model
docker compose exec api python -m app.models.train --tier all

# 4. Access
# Farmer PWA / dashboard : http://localhost:3000
# API + OpenAPI docs     : http://localhost:8000/docs
# MQTT broker            : localhost:1883  (8883 TLS)
# ChirpStack             : http://localhost:8080
# MLflow                 : http://localhost:5000
# Grafana                : http://localhost:3001
```

Services: `caddy` · `frontend` · `api` · `worker` (Celery) · `postgres` (TimescaleDB + PostGIS) · `valkey` · `mosquitto` · `chirpstack` · `minio` · `mlflow` · `prometheus` · `grafana`.

**Environment variables that matter:**

| Var | Default | Note |
|---|---|---|
| `SCC_THRESHOLD` | `200000` | Configurable on purpose — the cut-point is contested (`domain-brief.md` §2) |
| `LEAD_MIN` / `LEAD_MAX` | `7` / `14` | The PS horizon. Changing these changes the claim |
| `ALERT_BUDGET_FRAC` | `0.05` | Per-herd daily cap |
| `BAND_ENTER_HIGH` / `BAND_EXIT_HIGH` | `0.60` / `0.45` | Hysteresis |
| `LORA_REGION` | `IN865` | **Not EU868.** See `hardware.md` §3.2 |
| `DEMO_DATA_BADGE` | `true` | Renders the SIMULATED badge. Do not turn this off for screenshots |

Sizing: a single **8 vCPU / 16 GB / 200 GB** VM comfortably handles ~500 herds. No GPU anywhere.

---

## Appendix A: Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| **DC excitation on the EC probe** | Readings drift within minutes; probe corrodes | AC square wave ~1 kHz, sample both half-cycles (§2.9) |
| **No temperature compensation** | Conductivity tracks milk temperature, not mastitis | DS18B20 is mandatory, ~2%/°C correction |
| **Label leakage from the pre-clinical week** | AUC 0.97 at "14 days". Too good | The blanking window (§2.4). If your metrics look wonderful, you have this bug |
| **Cross-validating by cow-day** | Great CV, useless on a new farm | `GroupKFold` on **herd** |
| **Reporting AUC-ROC on a 0.3% positive rate** | 0.94 AUC, 4% precision | AUC-PR and precision@budget |
| **Isotonic calibration on a small fold** | Overfit, step-function probabilities | Sigmoid/Platt below ~1,000 calibration samples |
| **Global conductivity threshold** | Every Murrah buffalo flagged; every Sahiwal missed | Per-animal baseline (§2.3) |
| **Treating AMCU farmer-level data as animal-level** | Silently wrong for multi-animal households | Nullable `animal_id` + `pooled_n` feature |
| **EU868 LoRa defaults** | Illegal in India, and the gateway may not hear you | `LORA_REGION=IN865` |
| **Alerting on everything** | Demo looks impressive; product is uninstallable | Alert budget + hysteresis (§2.6) |
| **One infection counted as four cases** | Prevalence inflated fourfold | Episode grouping in `onset.py` |
| **Gated HuggingFace checkpoint** | Blocked at 2 a.m. on day 3 | Pre-download in Sprint 0; use IndicConformer, not gated IndicWhisper |
| **Cropping the SIMULATED badge out of screenshots** | One question ends the pitch | Leave it in. It is a strength |

---

## Appendix B: Demo Script

Full version in [`DEMO_GUIDE.md`](DEMO_GUIDE.md). The five-minute spine:

1. **(0:30) The hardware, in your hand.** Hold up the module. Dip the probe in normal milk, then in milk with a pinch of salt. The conductivity number moves live on screen. *"That's a ₹2,722 device serving three hundred animals. Twenty-four rupees each."*
2. **(1:00) The village view.** 300 animals, three bands. Two HIGH alerts today — not sixty. *"The alert budget is five percent. A system that flags a fifth of the village gets uninstalled by Friday."*
3. **(1:30) One animal.** Cow 47. Right-rear quarter. Three SHAP drivers with plain-language labels. Fourteen-day risk trajectory with the calibrated probability. *"She is not sick. Her right-rear quarter is 1.5× the other three, her rumination is down 38 minutes against her own baseline, and it has been heat-stress weather for a week."*
4. **(1:00) The instruction, in Gujarati, spoken aloud.** One animal, one quarter, one action. No antibiotic named. *"That's the whole product. Not a dashboard — a task."*
5. **(1:00) Close the loop.** Tap CONFIRMED. Show the outcome landing in the training set and the retrain job queued. *"Every alert is a new label. That's capability five of the problem statement, as a mechanism rather than a promise."*

**If asked for the honest weaknesses, volunteer them in this order:** conductivity alone is ~66% sensitive; there is no Indian labelled dataset and here is the partnership plan; the state of the art at 14 days is AUC 0.79 and we are measuring against it, not against a fantasy.

---

## Appendix C: Resources

### Primary documents — read these first
- [DAHD Strategy Document on the Prevention and Control of Mastitis](https://dahd.gov.in/sites/default/files/2025-02/StrategyDocumentonthePreventionandControlofMastitisV-Final.pdf)
- [NDDB AMCU Technical Specification](https://www.nddb.coop/sites/default/files/pdfs/AMCU_Technical%20Specification_.pdf)
- [Krishnamoorthy et al. 2021 — Indian prevalence meta-analysis](https://doi.org/10.1016/j.rvsc.2021.04.021)
- [Zhou et al. 2026 — the 7/14/21/28-day benchmark](https://doi.org/10.3390/ani16020204)
- [Kandeel et al. 2019 — why EC alone is not enough](https://pmc.ncbi.nlm.nih.gov/articles/PMC6766502/)

### Datasets
- [Mendeley IoT udder dataset (CC BY 4.0)](https://data.mendeley.com/datasets/kbvcdw5b4m/1)
- [MmCows](https://github.com/neis-lab/mmcows) · [MasPA reference implementation](https://github.com/naeemmrz/MasPA.py)
- [DataMeet India boundaries](https://github.com/datameet/maps) — **not GADM**

### Standards
- [ICAR Animal Data Exchange (Apache-2.0)](https://github.com/adewg/ICAR)
- [ICAR milk recording §2](https://www.icar.org/Guidelines/02-Overview-Cattle-Milk-Recording.pdf) · [milk analysis §12](https://www.icar.org/Guidelines/12-Milk-Analysis.pdf)
- [ISO 13366-1](https://www.iso.org/standard/40259.html) · [ISO 13366-2](https://www.iso.org/standard/40260.html) · [ISO 20966](https://www.iso.org/standard/37191.html)

### Libraries
- [LightGBM](https://github.com/microsoft/LightGBM) · [SHAP](https://github.com/shap/shap) · [lifelines](https://github.com/CamDavidsonPilon/lifelines) · [tsfresh](https://github.com/blue-yonder/tsfresh) · [River](https://github.com/online-ml/river) · [imbalanced-learn](https://github.com/scikit-learn-contrib/imbalanced-learn)
- [ChirpStack](https://www.chirpstack.io/project/) · [Mosquitto](https://mosquitto.org/) · [TimescaleDB licences](https://www.tigerdata.com/legal/licenses) · [MapLibre](https://github.com/maplibre/maplibre-gl-js) · [H3](https://github.com/uber/h3)

### Indian language AI
- [IndicTrans2](https://github.com/AI4Bharat/IndicTrans2) · [IndicConformer ASR](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual) · [Indic Parler-TTS](https://huggingface.co/ai4bharat/indic-parler-tts) · [Bhashini API docs](https://bhashini.gitbook.io/bhashini-apis)

### Regulatory
- [WPC 865–868 MHz exemption rules, 2021](https://thc.nic.in/Central%20Governmental%20Rules/use%20of%20low%20power%20Equipment%20in%20the%20frequency%20band%20865%20to%20868%20MHz%20for%20Short%20Range%20Devices%20Exemption%20from%20Licence%20Rules,2021.pdf)
- [TRAI DLT registration](https://trai.gov.in/government-entities)
- [NAP-AMR 2.0 (2025–2029)](https://ncdc.mohfw.gov.in/uploads/pdf/amr10.pdf)
