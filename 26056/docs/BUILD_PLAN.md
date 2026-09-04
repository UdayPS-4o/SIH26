# VIMAAN — Complete Build Plan
**SIH 2026 · Problem Statement #26056 · MoSPI / Data Informatics & Innovation Division (DIID)**
> *"Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and OTA Portals for Augmentation of the CPI"*

**VIMAAN** — *Validated Index for Monitoring Airfares, Automated & National* — is the platform.
**APIx** — the Airfare Price Index — is what it publishes.

---

## Table of Contents

1. [Part 1 — The Problem, The Solution, The Approach (Plain English)](#part-1--the-problem-the-solution-the-approach-plain-english)
2. [Part 2 — Detailed Technical Guide](#part-2--detailed-technical-guide)
3. [Part 3 — Research, Datasets & Reusable Codebases](#part-3--research-datasets--reusable-codebases)
4. [Part 4 — Day-by-Day Execution Plan](#part-4--day-by-day-execution-plan)
5. [Part 5 — Docker & Deployment](#part-5--docker--deployment)

---

## Part 1 — The Problem, The Solution, The Approach (Plain English)

### 1.1 What the Problem Actually Is

The RBI sets interest rates using CPI inflation. CPI's 'Transport and Communication' sub-group includes air fares. Air fares are currently priced by sending a person to a limited set of outlets and ticketing offices, at low frequency.

Meanwhile, this is what an actual DEL–BOM economy seat costs on one day, on one carrier:

| When you book | Fare |
|---|---|
| 45 days ahead | ₹4,180 |
| 15 days ahead | ₹7,412 |
| 7 days ahead | ₹11,900 |
| Tomorrow | ₹18,650 |

A 4.5× spread on the same physical seat. Over 90% of domestic tickets are sold online. Manual monthly collection sees roughly **one point** on that curve, from a channel almost nobody uses any more.

**The consequence is not academic.** If the air-fare component of CPI is measured from the wrong channel at the wrong frequency, the 'Transport and Communication' sub-index is wrong, and an input to monetary policy is wrong.

### 1.2 What We Are Building

**VIMAAN**, an end-to-end official-statistics platform that:

1. **Collects** fare quotes nightly across a DGCA-traffic-weighted basket of city pairs, from airline portals, OTAs and licensed fare APIs — every request passing a compliance gate
2. **Lands** raw payloads immutably as evidence, then normalises them into a comparable panel
3. **Decomposes** every fare into base · taxes & fees · UDF · convenience charge
4. **Cleans** with statistical-agency-grade methods: Tukey/Hidiroglou–Berthelot outlier edits on log price relatives, cell-mean imputation for sold-out inventory, and machine-checked data contracts
5. **Compiles APIx** — a Jevons elementary index aggregated with DGCA passenger-traffic weights, chain-linked and rebased to 2024 = 100, with a bootstrap confidence band on every point
6. **Validates** with a ≥30-day back-test against DGCA/MoCA fare references and the CPI air-fare item series
7. **Publishes** via a dashboard, an OpenAPI 3.1 REST API, and **SDMX-JSON** — the format statistical agencies actually exchange

### 1.3 How We Are Doing It — The Pipeline (Simple)

```
Stage 1: COMPLIANCE GATE
  robots.txt → Crawl-delay → token bucket → identifiable UA → kill-switch
  A source that says "no" is not defeated. It is re-routed to a licensed API.

Stage 2: COLLECT
  20 sectors × 5 lead windows (T+1/7/15/30/45) × N sources ≈ 3,000 quotes/night

Stage 3: CLEAN
  normalise → dedupe → decompose fare → outlier edit → impute sold-out → contracts

Stage 4: CELL ASSIGNMENT  ← the idea the whole project rests on
  (sector, carrier, lead_bucket, cabin, dep_dow_band)
  We never compare "DEL-BOM today" to "DEL-BOM yesterday".
  We compare "DEL-BOM, 15 days out, weekday, 6E, economy" across days.
  Constant lead time = constant quality.

Stage 5: INDEX
  Jevons per cell → weighted aggregation (DGCA weights) → chain-link
  → rebase 2024=100 → block bootstrap → 95% band

Stage 6: VALIDATE & PUBLISH
  back-test vs DGCA + CPI → PROVISIONAL → REVISED (T+7) → FROZEN (T+30)
```

**Why this beats "scrape and plot the average":** an average of scraped prices is not an index. It moves when the *mix* of what you scraped changes, which on airfares happens every night. The cell structure, the fixed lead time, the geometric elementary formula and the fixed weights exist precisely to make the number move only when *prices* move.

### 1.4 What We Are NOT Building

- ❌ Not a flight-booking site or a fare-comparison product for consumers
- ❌ Not a CAPTCHA-solving or anti-bot-evasion toolkit — sources that decline automated access get routed, not defeated
- ❌ Not a replacement for CPI — APIx **augments** one item within one sub-group
- ❌ Not a fare-prediction model — this is measurement, not forecasting (prediction is a roadmap item)
- ❌ Not dependent on any paid or proprietary API to function — the licensed-API path is a compliance fallback, not the spine
- ❌ Not a claim to observe transaction prices — we observe offer prices and say so, every time

### 1.5 Why This Will Win at SIH

| Criterion | What judges look for | What VIMAAN delivers |
|---|---|---|
| **Problem understanding** | Do they know whose problem this is? | Framed as official statistics, not scraping; knows the CPI 2024 rebase, COICOP 2018 and eSankhyiki |
| **Technical depth** | Something beyond CRUD | Index-number theory implemented and property-tested, not name-dropped |
| **Handles the hard part** | Do they dodge dynamic pricing? | Constant-lead-time cells — a real answer, on a slide |
| **Risk & ethics** | Will this get the ministry sued? | Compliance gate is stage 1 and a live screen; demote-don't-defeat routing |
| **Verifiability** | Can they prove it works? | 30-day back-test with ρ/RMSE/directional agreement, plus recovery of a known injected inflation path on synthetic data |
| **Honesty** | Do they know their limits? | Offer-vs-transaction price caveat conceded up front, with mitigations |
| **Consumability** | Can NSO/RBI actually use it? | OpenAPI 3.1 + **SDMX-JSON**, not just a dashboard |
| **Feasibility** | Buildable in the time? | Synthetic panel first, live collection swaps in behind one interface |

---

## Part 2 — Detailed Technical Guide

### 2.1 Technology Choices and Rationale

| Layer | Technology | Why |
|---|---|---|
| **JS-portal collection** | Playwright (Python) | Real Chromium; airline SPAs need a real renderer. One browser context per domain isolates sessions. |
| **Structured collection** | Scrapy | Mature scheduling, retry and throttling for JSON/HTML endpoints |
| **robots.txt** | `protego` | Scrapy's own parser; correct `Crawl-delay` and wildcard semantics |
| **Licensed fare source** | Amadeus Self-Service | Legally clean route for sources whose ToS declines scraping |
| **Orchestration** | Prefect | Flows map 1:1 to the daily collection / index / back-test cycle; readable UI for a demo |
| **Worker fan-out** | Celery + Redis | 600 independent tasks/night; Redis also carries token buckets and dedupe fingerprints |
| **Database** | PostgreSQL 16 + **TimescaleDB** | Hypertables for a growing fare time-series; **continuous aggregates** compute daily/weekly/monthly rollups incrementally instead of re-scanning |
| **Object store** | MinIO (S3 API) | Bronze zone keeps raw payloads as *evidence* — reproducibility and audit |
| **Processing** | Polars + pandas | Polars for the nightly panel; pandas where the stats libraries need it |
| **Statistics** | scipy, statsmodels | Outlier tests, seasonality diagnostics |
| **Index math** | Pure Python `indexer/` | No library owns the formulas — they are ours, readable and property-tested |
| **Contracts** | pandera + Great Expectations | Publication is *gated* on data quality, not merely monitored |
| **Backend** | FastAPI | OpenAPI 3.1 for free — the artefact NSO/RBI consume |
| **Exchange format** | SDMX-JSON 1.0 | What statistical agencies actually exchange; signals domain literacy |
| **Frontend** | React 18 + TypeScript + Tailwind | Standard, fast to build |
| **Charts** | Apache ECharts | Heatmaps and confidence bands are first-class; Recharts struggles with both |
| **Testing** | pytest, Hypothesis, vcrpy | Property tests on index math; recorded HTTP so CI never hits a live portal |
| **Observability** | Prometheus + Grafana | Scraper health is an operational concern, and a demo screen |
| **Deployment** | Docker Compose | One command, one host |

### 2.2 Backend Architecture

```
backend/
├── app/
│   ├── main.py                       # FastAPI app, CORS, lifespan, routers
│   ├── config.py                     # Pydantic Settings
│   ├── database.py                   # SQLAlchemy engine, session, Timescale init
│   ├── collectors/
│   │   ├── registry.py               # source catalogue + access-method routing
│   │   ├── robots.py                 # protego wrapper, 24h Redis cache
│   │   ├── politeness.py             # token bucket, backoff, kill-switch
│   │   ├── base.py                   # Collector ABC → RawQuote[]
│   │   ├── playwright_src.py         # JS-rendered airline/OTA portals
│   │   ├── scrapy_src.py             # structured/JSON endpoints
│   │   └── amadeus_src.py            # licensed Flight Offers Search
│   ├── pipeline/
│   │   ├── landing.py                # Bronze Parquet → fare_quotes_raw
│   │   ├── normalizer.py             # IATA, IST→UTC, INR, cabin/fare-class map
│   │   ├── dedupe.py                 # Redis fingerprint
│   │   ├── decomposer.py             # base | taxes | UDF | convenience
│   │   ├── outliers.py               # Tukey on log-relatives, H-B, winsorise
│   │   ├── imputation.py             # cell-mean relative imputation
│   │   └── quality.py                # pandera schemas + GE suite; publication gate
│   ├── indexer/
│   │   ├── cells.py                  # cell_key construction
│   │   ├── elementary.py             # Jevons (+ Dutot, Carli as diagnostics)
│   │   ├── weights.py                # DGCA traffic → stratum weights
│   │   ├── aggregation.py            # Young / modified Laspeyres
│   │   ├── chain.py                  # chain-link, linking factor, rebase 2024=100
│   │   ├── variance.py               # block bootstrap → 95% band
│   │   └── backtest.py               # vs DGCA/MoCA + CPI item series
│   ├── routers/
│   │   ├── auth.py                   # JWT login, roles
│   │   ├── index.py                  # /index/apix
│   │   ├── quotes.py                 # /quotes, /cells
│   │   ├── sectors.py                # /sectors, heatmap, elasticity
│   │   ├── backtest.py               # /backtest
│   │   ├── compliance.py             # /compliance — robots posture, audit log
│   │   ├── sdmx.py                   # /sdmx/v1/data/APIX
│   │   └── admin.py                  # basket, weights, reruns, seed
│   ├── orchestration/
│   │   └── flows.py                  # Prefect: daily_collection, daily_index, weekly_backtest
│   └── models/                       # SQLAlchemy ORM
├── scripts/
│   ├── seed_demo.py                  # 90-day synthetic panel, known ground truth
│   ├── load_basket.py                # 20-sector basket + DGCA-derived weights
│   └── fetch_dgca.py                 # pull + parse DGCA city-pair traffic
├── tests/
│   ├── test_index_math.py            # Hypothesis property tests
│   ├── test_pipeline.py
│   ├── test_compliance.py            # robots gate must refuse a DISALLOW fixture
│   └── cassettes/                    # vcrpy — CI never touches a live portal
├── requirements.txt
├── Dockerfile
└── .env.example
```

### 2.3 Database Schema

```sql
-- ---------- Reference ----------
CREATE TABLE airports (
    iata            CHAR(3) PRIMARY KEY,
    icao            CHAR(4),
    city            TEXT NOT NULL,
    name            TEXT,
    tz              TEXT NOT NULL DEFAULT 'Asia/Kolkata'
);

CREATE TABLE carriers (
    code            VARCHAR(3) PRIMARY KEY,     -- 6E, AI, IX, QP, SG
    name            TEXT NOT NULL,
    is_lcc          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE sources (
    id              SERIAL PRIMARY KEY,
    slug            TEXT UNIQUE NOT NULL,       -- 'ixigo', 'amadeus', ...
    kind            TEXT NOT NULL,              -- AIRLINE | OTA | LICENSED_API | MOU
    base_url        TEXT,
    access_method   TEXT NOT NULL,              -- PLAYWRIGHT | SCRAPY | API | FEED
    robots_posture  TEXT,                       -- ALLOW | DISALLOW | PARTIAL | N/A
    tos_posture     TEXT,                       -- PERMITS | PROHIBITS | SILENT | LICENSED
    rate_per_min    NUMERIC(6,2) NOT NULL DEFAULT 10,
    nightly_cap     INTEGER NOT NULL DEFAULT 400,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    demoted_reason  TEXT                        -- why it was routed off scraping
);

-- ---------- Basket & weights ----------
CREATE TABLE sectors (                          -- the city-pair basket
    id              SERIAL PRIMARY KEY,
    origin          CHAR(3) REFERENCES airports(iata),
    destination     CHAR(3) REFERENCES airports(iata),
    is_trunk        BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (origin, destination)
);

CREATE TABLE stratum_weights (
    id              SERIAL PRIMARY KEY,
    sector_id       INTEGER REFERENCES sectors(id),
    lead_bucket     SMALLINT NOT NULL,          -- 1, 7, 15, 30, 45
    weight          NUMERIC(10,8) NOT NULL,     -- Σ over all strata = 1
    weight_source   TEXT NOT NULL,              -- 'DGCA city-pair 2026-07'
    booking_share   NUMERIC(6,5),               -- lead-time share (estimated)
    valid_from      DATE NOT NULL,
    valid_to        DATE,
    CHECK (weight >= 0)
);

-- ---------- Silver: raw quotes ----------
CREATE TABLE fare_quotes_raw (
    id              BIGSERIAL,
    captured_at     TIMESTAMPTZ NOT NULL,
    capture_date    DATE NOT NULL,
    source_id       INTEGER REFERENCES sources(id),
    sector_id       INTEGER REFERENCES sectors(id),
    carrier         VARCHAR(3) REFERENCES carriers(code),
    flight_no       TEXT,
    departure_ts    TIMESTAMPTZ NOT NULL,
    lead_days       SMALLINT NOT NULL,
    lead_bucket     SMALLINT NOT NULL,
    cabin           TEXT NOT NULL DEFAULT 'ECONOMY',
    fare_class      TEXT,
    total_fare      NUMERIC(12,2) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'INR',
    is_sold_out     BOOLEAN NOT NULL DEFAULT FALSE,
    raw_payload_uri TEXT,                       -- MinIO bronze object
    fingerprint     TEXT NOT NULL,
    PRIMARY KEY (id, captured_at)
);
SELECT create_hypertable('fare_quotes_raw', 'captured_at');
CREATE UNIQUE INDEX ON fare_quotes_raw (fingerprint, capture_date);

-- ---------- Gold: cleaned quotes ----------
CREATE TABLE fare_quotes_clean (
    id              BIGSERIAL,
    captured_at     TIMESTAMPTZ NOT NULL,
    capture_date    DATE NOT NULL,
    cell_key        TEXT NOT NULL,              -- sector|carrier|lead|cabin|dow_band
    source_id       INTEGER REFERENCES sources(id),
    sector_id       INTEGER REFERENCES sectors(id),
    carrier         VARCHAR(3),
    lead_bucket     SMALLINT NOT NULL,
    cabin           TEXT NOT NULL,
    dep_dow_band    TEXT NOT NULL,              -- WEEKDAY | WEEKEND
    base_fare       NUMERIC(12,2) NOT NULL,
    taxes_fees      NUMERIC(12,2) NOT NULL DEFAULT 0,
    udf             NUMERIC(12,2) NOT NULL DEFAULT 0,
    convenience_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_fare      NUMERIC(12,2) NOT NULL,
    is_imputed      BOOLEAN NOT NULL DEFAULT FALSE,
    imputation_kind TEXT,                       -- CELL_MEAN | NONE
    was_winsorised  BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id, captured_at)
);
SELECT create_hypertable('fare_quotes_clean', 'captured_at');
CREATE INDEX ON fare_quotes_clean (cell_key, capture_date);

-- ---------- Index output ----------
CREATE TABLE elementary_index (
    id              BIGSERIAL PRIMARY KEY,
    ref_date        DATE NOT NULL,
    cell_key        TEXT NOT NULL,
    formula         TEXT NOT NULL DEFAULT 'JEVONS',   -- JEVONS | DUTOT | CARLI
    price_relative  NUMERIC(12,8) NOT NULL,
    index_level     NUMERIC(12,4) NOT NULL,
    n_quotes        INTEGER NOT NULL,
    n_imputed       INTEGER NOT NULL DEFAULT 0,
    UNIQUE (ref_date, cell_key, formula)
);

CREATE TABLE apix_series (
    id              BIGSERIAL PRIMARY KEY,
    ref_date        DATE NOT NULL,
    frequency       TEXT NOT NULL,              -- DAILY | WEEKLY | MONTHLY
    scope           TEXT NOT NULL DEFAULT 'ALL_INDIA',
    measure         TEXT NOT NULL DEFAULT 'TOTAL',    -- TOTAL | BASE
    index_value     NUMERIC(12,4) NOT NULL,     -- base 2024 = 100
    ci_low          NUMERIC(12,4),
    ci_high         NUMERIC(12,4),
    coverage_pct    NUMERIC(5,2) NOT NULL,
    status          TEXT NOT NULL,              -- PROVISIONAL | REVISED | FROZEN | SUPPRESSED
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ref_date, frequency, scope, measure)
);

CREATE TABLE backtest_results (
    id              BIGSERIAL PRIMARY KEY,
    window_start    DATE NOT NULL,
    window_end      DATE NOT NULL,
    reference       TEXT NOT NULL,              -- DGCA_TARIFF | CPI_AIRFARE_ITEM
    pearson_r       NUMERIC(6,4),
    rmse            NUMERIC(10,4),
    mape            NUMERIC(6,3),
    dir_agreement   NUMERIC(5,2),               -- % of days moving the same way
    n_obs           INTEGER NOT NULL
);

-- ---------- Compliance & audit ----------
CREATE TABLE robots_cache (
    source_id       INTEGER REFERENCES sources(id),
    fetched_at      TIMESTAMPTZ NOT NULL,
    body            TEXT NOT NULL,
    crawl_delay_s   NUMERIC(6,2),
    PRIMARY KEY (source_id, fetched_at)
);

CREATE TABLE request_audit (
    id              BIGSERIAL,
    requested_at    TIMESTAMPTZ NOT NULL,
    source_id       INTEGER REFERENCES sources(id),
    url_path        TEXT NOT NULL,              -- path only; never query with PII
    http_status     SMALLINT,
    latency_ms      INTEGER,
    robots_allowed  BOOLEAN NOT NULL,
    was_throttled   BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id, requested_at)
);
SELECT create_hypertable('request_audit', 'requested_at');

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'VIEWER',  -- VIEWER | NSO_ANALYST | ADMIN
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);
```

**Continuous aggregates** (the reason TimescaleDB earns its place):

```sql
CREATE MATERIALIZED VIEW apix_weekly_cagg
WITH (timescaledb.continuous) AS
SELECT time_bucket('7 days', captured_at) AS wk,
       cell_key,
       COUNT(*)                AS n_quotes,
       AVG(total_fare)         AS mean_total,
       EXP(AVG(LN(total_fare))) AS geo_mean_total
FROM fare_quotes_clean
GROUP BY wk, cell_key;
```

### 2.4 Frontend Architecture

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # routes, protected shell, ?demo detection
│   ├── index.css
│   ├── store/index.ts                # Zustand; demo-aware (fixtures vs API)
│   ├── api/client.ts                 # axios + JWT interceptor
│   ├── demo/data.ts                  # 90-day client-side fixtures for ?demo
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── StatCard.tsx
│   │   ├── IndexChart.tsx            # line + shaded bootstrap band
│   │   ├── SectorHeatmap.tsx         # 20 sectors × 5 lead windows
│   │   ├── ElasticityCurve.tsx       # log-y fare vs days-to-departure
│   │   ├── FareStack.tsx             # base | tax | UDF | convenience
│   │   └── StatusChip.tsx            # PROVISIONAL/REVISED/FROZEN/SUPPRESSED
│   └── pages/
│       ├── LoginPage.tsx
│       ├── IndexPage.tsx             # APIx headline
│       ├── HeatmapPage.tsx
│       ├── ElasticityPage.tsx
│       ├── MethodologyPage.tsx       # Jevons/Dutot/Carli live switch
│       ├── BacktestPage.tsx
│       ├── CompliancePage.tsx
│       └── HealthPage.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

### 2.5 API Endpoint Reference

All endpoints prefixed with `/api/v1` except the SDMX surface.

| Method | Endpoint | Description |
|---|---|---|
| **Auth** | | |
| POST | `/auth/login` | JWT login |
| GET | `/auth/me` | Current user + role |
| **Index** | | |
| GET | `/index/apix` | APIx series — `?frequency=daily\|weekly\|monthly&measure=total\|base&from=&to=` |
| GET | `/index/apix/latest` | Latest published point with band and status |
| GET | `/index/elementary` | Per-cell elementary index — `?cell_key=&formula=jevons\|dutot\|carli` |
| GET | `/index/contributions` | Stratum contributions to the latest movement |
| **Quotes & sectors** | | |
| GET | `/quotes` | Cleaned quotes, filterable and paginated |
| GET | `/quotes/raw` | Raw quotes with bronze evidence URI (ADMIN) |
| GET | `/sectors` | Basket with current weights |
| GET | `/sectors/heatmap` | Sector × lead-time change matrix |
| GET | `/sectors/{id}/elasticity` | Mean fare vs days-to-departure |
| GET | `/sectors/{id}/decomposition` | base/tax/UDF/convenience split over time |
| **Validation** | | |
| GET | `/backtest` | Metrics vs a reference — `?reference=dgca_tariff\|cpi_airfare_item&window=30` |
| GET | `/backtest/series` | Aligned APIx vs reference series for plotting |
| **Compliance** | | |
| GET | `/compliance` | Per-source posture, caps, kill-switch state |
| GET | `/compliance/robots/{source}` | Cached robots.txt with fetch timestamp |
| GET | `/compliance/audit` | Request audit log (CSV export) |
| **Health** | | |
| GET | `/health/coverage` | % expected cells filled, vs 70% gate |
| GET | `/health/scrapers` | Yield, block rate, p95 latency per source |
| **Admin** | | |
| POST | `/admin/basket` | Update sector basket |
| POST | `/admin/weights` | Load stratum weights from DGCA extract |
| POST | `/admin/rerun` | Re-run index for a date range |
| POST | `/admin/seed-demo` | Generate the 90-day synthetic panel |
| **SDMX** | | |
| GET | `/sdmx/v1/data/APIX/{key}` | SDMX-JSON 1.0 dataset |
| GET | `/sdmx/v1/dataflow/APIX` | Dataflow definition |
| GET | `/openapi.json` | OpenAPI 3.1 spec for NSO/RBI consumers |

### 2.6 Collection — Implementation Details

#### The Collector interface (`collectors/base.py`)

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date, datetime

@dataclass
class RawQuote:
    source_slug: str
    sector: tuple[str, str]          # (origin, destination)
    carrier: str
    flight_no: str | None
    departure_ts: datetime
    lead_days: int
    cabin: str
    fare_class: str | None
    total_fare: float
    components: dict[str, float]     # base, taxes_fees, udf, convenience
    is_sold_out: bool
    captured_at: datetime
    raw_payload: bytes               # persisted to bronze as evidence

class Collector(ABC):
    slug: str
    access_method: str               # PLAYWRIGHT | SCRAPY | API | FEED

    @abstractmethod
    async def collect(self, sector, departure: date) -> list[RawQuote]: ...

    async def preflight(self, gate) -> bool:
        """Every collector asks the gate first. No exceptions, no override flag."""
        return await gate.allows(self.slug)
```

Adding a source is implementing one class and one registry row. That is the whole extensibility story, and it is what makes "add 6 more OTAs" a Day-3 task rather than a rewrite.

#### The compliance gate (`collectors/politeness.py`)

```python
class ComplianceGate:
    """Every outbound request passes through here. There is no bypass path."""

    async def allows(self, source_slug: str, path: str = "/") -> bool:
        if await self.kill_switch.is_tripped(source_slug):
            return False
        rules = await self.robots.rules_for(source_slug)      # protego, 24h cache
        if not rules.can_fetch(self.user_agent, path):
            await self.demote(source_slug, reason="robots.txt DISALLOW")
            return False
        if await self.nightly_count(source_slug) >= self.cap(source_slug):
            return False
        return True

    async def acquire(self, source_slug: str) -> None:
        """Token bucket, seeded from Crawl-delay; sleeps rather than bursts."""
        delay = max(self.min_delay_s, await self.robots.crawl_delay(source_slug) or 0)
        await self.bucket(source_slug, delay).acquire()

    async def on_response(self, source_slug: str, status: int) -> None:
        if status in (429, 503):
            n = await self.consecutive_throttles.incr(source_slug)
            await asyncio.sleep(min(2 ** n, 900))             # cap 15 min
            if n >= 3:
                await self.kill_switch.trip(source_slug, hours=24)
        else:
            await self.consecutive_throttles.reset(source_slug)
```

`demote()` writes `sources.demoted_reason` and flips `access_method` to the licensed-API route. **A blocked source becomes a routing decision recorded in the database, visible on the compliance screen.** That is the whole argument, expressed as code.

### 2.7 Cleaning — Implementation Details

```python
# pipeline/decomposer.py
def decompose(quote: RawQuote) -> FareComponents:
    """
    Portals expose the split inconsistently. Three strategies, in order:
      1. structured components present  → use them
      2. total + tax line only          → base = total - taxes, allocate UDF by airport
      3. total only                     → apportion using the sector/carrier median
                                          split from the last 30 days, flag as ESTIMATED
    UDF is airport- and direction-specific; convenience fee is OTA-specific and is
    the reason the same flight costs more on an OTA than on the airline site.
    """

# pipeline/outliers.py
def edit_relatives(df: pl.DataFrame, k: float = 3.0) -> pl.DataFrame:
    r = (df["price"] / df["price_prev"]).log()
    q1, q3 = r.quantile(0.25), r.quantile(0.75)
    iqr = q3 - q1
    keep = (r >= q1 - k * iqr) & (r <= q3 + k * iqr)
    # Hidiroglou-Berthelot on the ratio distribution for skewed cells
    # then winsorise survivors at p1/p99 rather than deleting
    return winsorise(df.filter(keep), lo=0.01, hi=0.99)

# pipeline/imputation.py
def impute_cell_mean(cell: pl.DataFrame) -> pl.DataFrame:
    """
    Sold-out is NOT missing-at-random — it correlates with high demand, so dropping
    it biases the index DOWN exactly when fares are highest. The item inherits its
    cell's movement:
        r_hat = exp( mean over surviving j in cell of ln(p_j,t / p_j,t-1) )
    Never carry-forward (p_t := p_{t-1}) — it flattens the series and induces drift.
    """
```

### 2.8 Index Construction — Implementation Details

```python
# indexer/elementary.py
import numpy as np

def jevons(p_t: np.ndarray, p_prev: np.ndarray) -> float:
    """Geometric mean of price relatives. The published formula."""
    return float(np.exp(np.mean(np.log(p_t / p_prev))))

def dutot(p_t: np.ndarray, p_prev: np.ndarray) -> float:      # diagnostic
    return float(p_t.mean() / p_prev.mean())

def carli(p_t: np.ndarray, p_prev: np.ndarray) -> float:      # diagnostic
    return float(np.mean(p_t / p_prev))

def cell_key(sector: str, carrier: str, lead: int, cabin: str, dow_band: str) -> str:
    """Constant lead time is what holds quality fixed. This function is the thesis."""
    return f"{sector}|{carrier}|T+{lead}|{cabin}|{dow_band}"


# indexer/aggregation.py
def aggregate(cell_index: dict[str, float], weights: dict[str, float]) -> float:
    """APIx_t/APIx_0 = Σ_s w_s (I_s,t / I_s,0),  Σ w_s = 1  (Young / mod. Laspeyres)."""
    total_w = sum(weights.values())
    assert abs(total_w - 1.0) < 1e-9, f"weights must sum to 1, got {total_w}"
    return sum(weights[s] * cell_index[s] for s in weights)


# indexer/variance.py
def bootstrap_band(cells, weights, reps: int = 1000, alpha: float = 0.05):
    """
    Block bootstrap resampling quotes WITHIN cell (preserves within-cell correlation),
    recomputing the full aggregation each replicate.
    """
    draws = [aggregate(resample_within_cells(cells), weights) for _ in range(reps)]
    return np.quantile(draws, [alpha / 2, 1 - alpha / 2])
```

**Property tests that must pass** (`tests/test_index_math.py`, via Hypothesis):

| Property | Assertion |
|---|---|
| Identity | all prices unchanged ⇒ index = 1.0 exactly |
| Proportionality | all prices × λ ⇒ index × λ |
| **Time reversal** | `jevons(t/t-1) × jevons(t-1/t) == 1` (and Carli **fails** this — assert it does, that's the point) |
| Commensurability | rescaling units leaves Jevons unchanged |
| Mean value | index lies between min and max relative |
| Weight sanity | weights not summing to 1 raises, never silently renormalises |

Asserting that Carli *fails* time reversal turns a textbook fact into a passing test in your repo. That is a very good thing to be able to show a judge.

### 2.9 Back-Testing

```python
# indexer/backtest.py
def backtest(apix: pd.Series, reference: pd.Series) -> BacktestResult:
    """
    reference ∈ {DGCA/MoCA tariff-monitoring series, CPI air-fare item from eSankhyiki}.
    Both are LOWER frequency than APIx, so compare at the reference's frequency:
      - aggregate APIx to monthly (geometric mean of daily within month)
      - align on period, then compute:
          Pearson r on levels and on log-differences
          RMSE and MAPE in index points
          directional agreement: % of periods moving the same way
    """
```

Report **both** levels and log-differences. Levels correlation flatters everything trending; the log-difference correlation is the honest one, and knowing the difference is itself a signal of competence.

### 2.10 Security & Governance

- JWT (30-min expiry), bcrypt password hashing, three roles (`VIEWER` / `NSO_ANALYST` / `ADMIN`)
- Raw-quote and audit endpoints restricted to `ADMIN`
- Publication state machine: `PROVISIONAL → REVISED (T+7) → FROZEN (T+30)`; frozen points are immutable
- Every published point is reproducible: bronze payload → clean row → cell → index value
- Egress restricted to domains in `collectors/registry.py`; all egress logged
- No PII collected or stored — DPDP Act 2023 is not triggered

---

## Part 3 — Research, Datasets & Reusable Codebases

### 3.1 Official statistics sources

| Resource | What it gives | Use |
|---|---|---|
| MoSPI eSankhyiki (esankhyiki.mospi.gov.in) | Macro Indicators Module: CPI, NAS, IIP, ASI; download + API | CPI air-fare item series for back-test |
| `nso-india/mospi-esankhyiki` | Official Python client. Flow: `list_datasets()` → `get_indicators()` → `get_metadata()` → `get_data()`. **For CPI, `get_indicators()` returns base years, not indicator names.** | Programmatic pull of the comparison series |
| `nso-india/esankhyiki-mcp` | MoSPI's beta MCP server (Feb 2026) | Evidence that MoSPI is building machine-readable access — cite as alignment |
| DGCA city-pair-wise monthly domestic traffic | Passengers by city pair, monthly | **Basket selection + stratum weights** |
| DGCA monthly traffic report | Pax, share, PLF, OTP, complaints | Carrier shares. **Contains no fares** — see §3.4 |
| DGCA/MoCA tariff monitoring | Selected-route fare levels | Back-test reference |
| AAI traffic statistics | Airport passenger movements | Cross-check on weights |

### 3.2 Methodology references

| Resource | Why it matters |
|---|---|
| Eurostat HICP Methodological Manual, 2024 (KS-GQ-24-003) | The authority for elementary-formula choice and treatment of volatile items; COICOP 07.3.3 = passenger transport by air |
| CPI Manual: Concepts and Methods (ILO/IMF/OECD/UNECE/Eurostat/World Bank, 2020) | Chain-linking, substitution bias, elementary aggregate theory |
| Eurostat HICP ESMS metadata | Where national air-fare lead-time grids are actually documented |
| SDMX standards | The exchange format NSO/RBI systems speak |

### 3.3 Reusable libraries

| Component | What to reuse | Source |
|---|---|---|
| Browser automation | Playwright Python | https://playwright.dev/python/ |
| Crawl framework | Scrapy | https://scrapy.org |
| robots.txt | Protego | https://github.com/scrapy/protego |
| Orchestration | Prefect | https://www.prefect.io |
| Time-series storage | TimescaleDB | https://www.timescale.com |
| Dataframe contracts | pandera | https://pandera.readthedocs.io |
| Expectation suites | Great Expectations | https://greatexpectations.io |
| Property testing | Hypothesis | https://hypothesis.readthedocs.io |
| Recorded HTTP | vcrpy | https://vcrpy.readthedocs.io |
| Charts | Apache ECharts | https://echarts.apache.org |

### 3.4 Dead ends — do not burn hours here

| Thing | Reality |
|---|---|
| "DGCA monthly average-fare data" as a single downloadable file | The monthly *traffic* report has no fares. Fares live in separate tariff-monitoring outputs and Parliament Question tables. **Find the real reference series on Day 0.** |
| Public Indian airfare *transaction* data | Does not exist publicly. You observe offer prices. Say so. |
| Third-party "OTA API" marketplace listings | Not official; do not build a dependency on them |
| Bulk historical fare archives | No free source at the frequency this PS needs |

### 3.5 Development data strategy

Build the entire cleaning + index stack against a **synthetic 90-day panel with known ground truth** before a single live quote exists:

1. Generate a latent "true" fare surface per (sector, carrier, lead, dow) with a **known injected inflation path**
2. Add realistic contamination — festival surges, sold-out gaps, OTA convenience-fee spreads, occasional garbage prices, portal outages
3. Run the pipeline
4. **Assert the index recovers the injected path within the bootstrap band**

That last line is a far stronger claim than "the scraper ran". It also means the index module is fully testable on a laptop with no network — which is what saves you when venue Wi-Fi dies.

---

## Part 4 — Day-by-Day Execution Plan

### Sprint 0 — Preparation (before the event)

- [x] Repository, project structure, docs skeleton
- [x] Architecture, implementation-flow and demo docs (`docs/`)
- [ ] **Locate the real DGCA/MoCA fare reference series** — highest-value pre-work; do not discover on Day 2 that it isn't in the traffic report
- [ ] Fetch DGCA city-pair traffic; derive the 20-sector basket and draft weights
- [ ] Read robots.txt and ToS for all 11 sources; fill the compliance matrix
- [ ] Register an Amadeus Self-Service test key
- [ ] Write `seed_demo.py` — the synthetic panel with a known injected inflation path

### Day 1 — Spine (parallel tracks)

**Track A: Data platform (1 dev)**
```
Priority 1:
  [ ] docker-compose: postgres+timescale, redis, minio
  [ ] models/ + full schema, hypertables, continuous aggregates
  [ ] scripts/load_basket.py — basket + weights loaded
  [ ] scripts/seed_demo.py — 90-day synthetic panel in the DB
Priority 2:
  [ ] pipeline/landing.py — bronze write + silver insert
```

**Track B: Index engine (1 dev) — start here, it is the graded deliverable**
```
Priority 1:
  [ ] indexer/cells.py, elementary.py (Jevons/Dutot/Carli)
  [ ] indexer/weights.py, aggregation.py
  [ ] tests/test_index_math.py — all six properties green, incl. Carli failing reversal
Priority 2:
  [ ] indexer/chain.py, variance.py
  [ ] Recover the injected inflation path from the synthetic panel
```

**Track C: Collection + compliance (2 devs)**
```
Priority 1:
  [ ] collectors/base.py, registry.py
  [ ] collectors/robots.py + politeness.py  ← build the gate BEFORE the first scraper
  [ ] tests/test_compliance.py — a DISALLOW fixture must be refused
Priority 2:
  [ ] collectors/playwright_src.py — first working airline portal
  [ ] collectors/amadeus_src.py — licensed route
  [ ] vcrpy cassettes recorded
```

**Track D: Frontend shell (1 dev)**
```
Priority 1:
  [ ] Vite + React + TS + Tailwind, routing, sidebar, Zustand store
  [ ] demo/data.ts fixtures + ?demo detection
Priority 2:
  [ ] IndexChart with shaded band; IndexPage
```

**Milestone:** index math property-tested and recovering a known path; compliance gate refusing a DISALLOW; API on :8000, UI on :3000.

### Day 2 — Breadth and integration

**Track A: Cleaning pipeline (1 dev)**
```
  [ ] normalizer.py, dedupe.py, decomposer.py
  [ ] outliers.py (Tukey + H-B + winsorise)
  [ ] imputation.py (cell-mean; carry-forward implemented ONLY as the demo contrast)
  [ ] quality.py — pandera + GE, publication gate at 70% coverage
```

**Track B: More sources (2 devs)**
```
  [ ] 2 more airline portals, 2 OTAs (whichever the compliance matrix permits)
  [ ] Prefect flows: daily_collection, daily_index, weekly_backtest
  [ ] Celery fan-out; Prometheus metrics
```

**Track C: API surface (1 dev)**
```
  [ ] routers: index, quotes, sectors, backtest, compliance, health
  [ ] sdmx.py — SDMX-JSON serialiser
  [ ] OpenAPI 3.1 polish — this is the NSO/RBI deliverable, make it readable
```

**Track D: Dashboard pages (1 dev)**
```
  [ ] HeatmapPage, ElasticityPage, FareStack
  [ ] MethodologyPage — live Jevons/Dutot/Carli switch + imputation toggle
  [ ] CompliancePage — per-source cards with cached robots.txt
```

**Milestone:** end-to-end, one command; every dashboard page renders from live API and from `?demo`.

### Day 3 — Validation, polish, deck

**Track A: Back-test (1 dev)**
```
  [ ] indexer/backtest.py + BacktestPage
  [ ] 30-day window vs both references; ρ, RMSE, MAPE, directional agreement
  [ ] Levels AND log-difference correlation reported separately
```

**Track B: Hardening (1 dev)**
```
  [ ] Full docker compose up --build from clean
  [ ] Grafana scraper-health board
  [ ] Suppression path exercised (force a low-coverage day)
  [ ] Kill-switch exercised (force 3×429)
```

**Track C: Demo + deck (2 devs)**
```
  [ ] Rehearse the 5-minute script in ?demo mode with Wi-Fi OFF
  [ ] Screenshots per docs/DEMO_GUIDE.md
  [ ] Build PPTX from docs/ppt-content.md
  [ ] Render implementation-flow and architecture PNG/SVG assets
```

**Milestone:** demo-ready, deck built, back-test on screen, offline-safe.

---

## Part 5 — Docker & Deployment

### 5.1 Quick start

```bash
cd 26056
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API | http://localhost:8000 |
| OpenAPI docs | http://localhost:8000/docs |
| SDMX-JSON | http://localhost:8000/sdmx/v1/data/APIX/all |
| Prefect UI | http://localhost:4200 |
| Grafana | http://localhost:3001 |
| MinIO console | http://localhost:9001 |

### 5.2 Seed and run once

```bash
docker compose exec api python scripts/load_basket.py
docker compose exec api python scripts/seed_demo.py --days 90
docker compose exec api python -m app.orchestration.flows daily_index --date today
```

### 5.3 Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://vimaan:vimaan@postgres:5432/vimaan` | Postgres/Timescale DSN |
| `REDIS_URL` | `redis://redis:6379/0` | Broker, token buckets, robots cache |
| `MINIO_ENDPOINT` | `minio:9000` | Bronze object store |
| `SECRET_KEY` | *(generate)* | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token expiry |
| `SCRAPER_USER_AGENT` | `VIMAAN-APIx/1.0 (+https://…/about-vimaan)` | **Must** be identifiable and carry a contact URL |
| `MIN_REQUEST_DELAY_S` | `6` | Floor on per-domain spacing |
| `NIGHTLY_CAP_DEFAULT` | `400` | Per-domain nightly request cap |
| `KILL_SWITCH_THROTTLE_N` | `3` | Consecutive 429s before a 24h trip |
| `COVERAGE_PUBLISH_THRESHOLD` | `0.70` | Below this, the day is SUPPRESSED |
| `INDEX_BASE_YEAR` | `2024` | Rebase target (2024 = 100) |
| `BOOTSTRAP_REPS` | `1000` | Bootstrap replicates |
| `AMADEUS_CLIENT_ID` / `_SECRET` | — | Licensed fare API credentials |
| `COLLECTION_ENABLED` | `false` | **Global scraping off-switch. Ships OFF.** |

`COLLECTION_ENABLED=false` by default is deliberate: a fresh clone of this repo cannot make a single outbound request to any airline or OTA until someone consciously turns it on. Point at that line when a judge asks about safeguards.

### 5.4 Production notes

- Run collection from a single, static, attributable egress IP. **Do not** rotate residential proxies — an official statistics system must be identifiable, and rotation is the behaviour of a system trying not to be seen. This is the opposite of the posture we want.
- Timescale retention: keep clean quotes indefinitely (they are the index's evidence); expire bronze raw payloads after 180 days.
- Publish the revision policy alongside the series. Statistical agencies are judged on revision discipline as much as on level accuracy.

---

## Appendix A — Common Pitfalls & Solutions

| Problem | Solution |
|---|---|
| Portal changes its DOM overnight | Selectors in per-source YAML, not code; a source failing yields `SUPPRESSED`, never a wrong number |
| Playwright memory growth over 600 tasks | One browser context per domain, recycled every N tasks; `--disable-dev-shm-usage` |
| CI accidentally hits a live portal | All HTTP in tests goes through vcrpy cassettes; a network-access guard fails the suite |
| Index moves because the sample mix changed, not prices | Cell structure + fixed weights; never aggregate raw quotes directly |
| Outlier filter deletes a genuine festival surge | Winsorise instead of delete; expose `k` as a slider and show the sensitivity |
| Sold-out flights bias the index down | Cell-mean imputation, never drop; never carry-forward |
| Timezone bugs shifting lead-time buckets | Store `TIMESTAMPTZ`, compute `lead_days` in the airport's local calendar date |
| Weights don't sum to 1 after a basket edit | `aggregate()` asserts; it raises rather than silently renormalising |
| Judge asks "isn't this illegal?" | Compliance screen, demote-don't-defeat routing, statutory-channel production design |
| Judge asks "these aren't real prices paid" | Concede first, then show the mitigations and the back-test residual |
| Venue Wi-Fi dies | `?demo` mode needs no network at all — rehearse in it |

---

## Appendix B — Demo Script (5 minutes)

| Time | Action | Line |
|---|---|---|
| 0:00–0:20 | Open `?demo` | "MoSPI's 2024-base CPI already brought e-commerce and administrative data into price collection. This is the aviation instance of that shift." |
| 0:20–0:50 | APIx headline + band | "One number a day, base 2024 = 100, with a bootstrap confidence band." |
| 0:50–1:30 | Lead-time elasticity | "Same sector, same day. 45 days out: this. Tomorrow: this. Monthly manual collection sees one point on this curve. We see all five, every day." |
| 1:30–2:10 | Sector heatmap → drill in | "Festival week, DEL–CCU, T+7, up 34%. Four carriers, 62 quotes, no imputation needed." |
| 2:10–3:00 | Methodology console | "Carli sits above — upward-biased, fails time reversal. We publish Jevons, which is the standard elementary formula for volatile items. And here's naive carry-forward flattening the series — which is why we impute the cell-mean relative instead." |
| 3:00–3:45 | Back-test panel | "Thirty days back-tested. ρ, RMSE, directional agreement. The PS's acceptance criterion is a screen in the product, not a bullet on a slide." |
| 3:45–4:25 | Compliance console | "Every request passed a robots.txt gate. Identifiable user agent with a contact URL. Per-domain caps. Kill-switch. Where a site's terms say no, we don't scrape it — we route to a licensed API, and in production to a statutory channel." |
| 4:25–4:50 | `/docs` → SDMX endpoint | "NSO and RBI don't want a dashboard, they want a feed. OpenAPI 3.1 and SDMX-JSON." |
| 4:50–5:00 | Back to headline | "Daily. Route-specific. Reproducible. Defensible." |

---

## Appendix C — Resources & References

### Official statistics
- MoSPI eSankhyiki: https://esankhyiki.mospi.gov.in
- eSankhyiki Python client: https://github.com/nso-india/mospi-esankhyiki
- eSankhyiki MCP server: https://github.com/nso-india/esankhyiki-mcp
- PIB — new CPI/GDP/IIP series schedule: https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2226269
- NDAP: https://ndap.niti.gov.in
- SDMX: https://sdmx.org

### Methodology
- Eurostat HICP Methodological Manual 2024: https://ec.europa.eu/eurostat/documents/3859598/18594110/KS-GQ-24-003-EN-N.pdf
- HICP methodology overview: https://ec.europa.eu/eurostat/statistics-explained/index.php?title=HICP_methodology
- CPI Manual: Concepts and Methods (2020): https://www.imf.org/en/Data/Statistics/cpi-manual

### Aviation data
- DGCA DigiGov: https://www.dgca.gov.in/digigov-portal/?page=yearly/4267/5192/html
- DGCA city-pair monthly traffic: https://www.dgca.gov.in/digigov-portal/?page=monthlyStatistics%2F259%2F4751%2Fhtml&main259%2F4184%2Fservicename=
- AAI traffic: https://www.aai.aero/en/business-opportunities/aai-traffic-news
- Ministry of Civil Aviation: https://www.civilaviation.gov.in
- OurAirports: https://ourairports.com/data/

### Engineering
- Playwright Python: https://playwright.dev/python/ · Scrapy: https://scrapy.org · Protego: https://github.com/scrapy/protego
- Prefect: https://www.prefect.io · Celery: https://docs.celeryq.dev
- TimescaleDB: https://www.timescale.com · MinIO: https://min.io · Polars: https://pola.rs
- pandera: https://pandera.readthedocs.io · Great Expectations: https://greatexpectations.io
- Hypothesis: https://hypothesis.readthedocs.io · vcrpy: https://vcrpy.readthedocs.io
- FastAPI: https://fastapi.tiangolo.com · ECharts: https://echarts.apache.org
- Amadeus for Developers: https://developers.amadeus.com

### Legal
- Collection of Statistics Act, 2008: https://www.mospi.gov.in/collection-statistics-act-2008
- IT Act, 2000: https://www.meity.gov.in/content/information-technology-act-2000
- DPDP Act, 2023: https://www.meity.gov.in/data-protection-framework

---

*Built for SIH 2026 · VIMAAN · Daily. Route-specific. Reproducible. Defensible.*
