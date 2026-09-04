# VIMAAN — Validated Index for Monitoring Airfares, Automated & National
## SIH 2026 | Problem ID: 26056 | MoSPI — Data Informatics & Innovation Division (DIID)

**VIMAAN** is the platform. **APIx** — the Airfare Price Index — is what it publishes: a daily, route-specific, chain-linked price index for Indian domestic air travel, built to augment the CPI 'Transport and Communication' sub-group.

> **Daily. Route-specific. Reproducible. Defensible.**

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [The One Idea That Makes It Work](#the-one-idea-that-makes-it-work)
3. [Differentiators](#differentiators-why-we-win)
4. [Architecture](#architecture)
5. [Index Methodology](#index-methodology)
6. [Compliance Posture](#compliance-posture)
7. [Technology Stack](#technology-stack)
8. [Database Schema](#database-schema)
9. [Build Timeline](#build-timeline)
10. [Quick Start](#quick-start)
11. [API Endpoints](#api-endpoints)
12. [Demo Scenarios](#demo-scenarios)
13. [Testing](#testing)
14. [Future Extensions](#future-extensions)
15. [Documentation Map](#documentation-map)

---

## Problem Statement

The Consumer Price Index published by the National Statistical Office is India's primary measure of retail inflation, and the RBI's target under the flexible inflation-targeting framework. Within it, air fares are priced by **manual collection from a limited set of outlets and ticketing offices**.

Meanwhile, **over 90% of domestic tickets are sold online**, and Indian airfares are dynamically priced — the same sector can vary 200–400% within a single day:

| Booked | Fare (DEL–BOM, same flight, economy) |
|---|---|
| 45 days out | ₹4,180 |
| 15 days out | ₹7,412 |
| 7 days out | ₹11,900 |
| Tomorrow | ₹18,650 |

Manual monthly collection captures roughly one point on that curve, from a channel almost nobody uses.

### What the PS asks for

| # | Requirement | Where it lives in VIMAAN |
|---|---|---|
| 1 | Multi-source scraping engine (Scrapy/Selenium/Playwright), scheduled daily | `app/collectors/` |
| 2 | Handle JS rendering, anti-bot, sessions — **within** robots.txt and ToS | `app/collectors/robots.py`, `politeness.py` |
| 3 | Basket of city pairs from DGCA passenger-traffic data | `scripts/load_basket.py`, `sectors` table |
| 4 | Advance-purchase windows T+1, T+7, T+15, T+30, T+45 | `lead_bucket` — a first-class dimension |
| 5 | Cleaning: outliers, missing values, sold-out, fare decomposition | `app/pipeline/` |
| 6 | De-duplicated fare database with full metadata | `fare_quotes_raw` / `fare_quotes_clean` |
| 7 | Index-construction module from given routes and weights | `app/indexer/` |
| 8 | Dashboard + API consumable by NSO and RBI | `frontend/`, `app/routers/`, `sdmx.py` |
| 9 | Documentation, automated tests, ≥30 days back-tested vs DGCA | `docs/`, `tests/`, `app/indexer/backtest.py` |

---

## The One Idea That Makes It Work

An airfare is **not** a fixed basket item. Tomorrow's DEL–BOM is a different product — different departure date, different remaining inventory, different fare bucket. Comparing today's DEL–BOM to yesterday's measures nothing.

```
  ✗  "the price of DEL–BOM"

  ✓  "the price of DEL–BOM, departing exactly 15 days from the
      collection date, weekday departure, IndiGo, economy"

      cell_key = (sector, carrier, lead_bucket, cabin, dep_dow_band)
```

**Constant lead time holds quality constant.** Every design decision downstream — the schema, the cell table, the elementary index, the weights — follows from this one choice. It is also the direct answer to "how do you handle dynamic pricing?"

---

## Differentiators (Why We Win)

### 1. It produces an index, not an average

An average of scraped prices moves when the *mix* of what you scraped changes — which on airfares happens every single night. The cell structure, fixed lead times, geometric elementary formula and fixed weights exist precisely so the number moves only when **prices** move.

### 2. The formula choice is defended, and demonstrated live

```
Jevons  I = ∏ (p_t / p_t-1)^(1/n)      ← published
Dutot   I = Σp_t / Σp_t-1               ← diagnostic
Carli   I = (1/n) Σ (p_t / p_t-1)       ← diagnostic
```

The Methodology Console switches between all three on the same underlying quotes, live. Carli visibly sits above — because it fails the time-reversal test, an upward bias that is large (not academic) when price relatives span 0.5–2.0. **Our test suite asserts that Carli fails time reversal.**

### 3. Compliance is structural, not a paragraph in a README

Every outbound request physically passes through `ComplianceGate`. There is no bypass path in the code. A source that declines automated access is **demoted to a licensed API** — and in production to a statutory data-sharing channel under the Collection of Statistics Act, 2008. The gate's live state is a screen in the product.

We do not defeat anti-bot measures. We route around them, and we log the routing decision.

### 4. Every point carries uncertainty

A 95% block-bootstrap band (1,000 replicates, resampling within cell to preserve correlation) on every published value. Publishing an index without an uncertainty measure is the tell of a hackathon project.

### 5. Sold-out inventory is handled correctly

Sold-out is **not** missing-at-random — it correlates with high demand, so dropping it biases the index *downward* exactly when fares are highest. We impute the cell-mean price relative. Naive carry-forward is implemented **only** as an on-screen contrast, to show it flattening and drifting the series.

### 6. It is verifiable two ways

- A ≥30-day back-test against DGCA/MoCA tariff references and the CPI air-fare item series pulled from MoSPI's own eSankhyiki API — reporting ρ (levels *and* log-differences), RMSE, MAPE and directional agreement
- On a synthetic panel with a **known injected inflation path**, the index recovers that path within its bootstrap band — an estimator-correctness claim, not an "it ran" claim

### 7. It is consumable

OpenAPI 3.1 **and SDMX-JSON** — the format statistical agencies actually exchange. NSO and RBI don't want a dashboard; they want a feed.

### 8. It is honest about its limits

Scraped fares are **offer** prices, not **transaction** prices. We concede this before a judge raises it, publish total and base fare as parallel series, weight toward the lowest available bucket, and report the residual gap in the back-test rather than concealing it.

---

## Architecture

```
Airline portals · OTA portals · Licensed fare APIs · MoU/statutory feed
        │
        ▼
1. COMPLIANCE GATE       robots.txt (protego, 24h cache) · Crawl-delay
   (every request)       token bucket · identifiable UA · no PII · kill-switch
        │
        ▼
2. COLLECT               Playwright · Scrapy · Amadeus
   (Prefect + Celery)    20 sectors × 5 lead windows × N sources ≈ 3,000/night
        │
        ▼
3. LAND                  Bronze: raw payloads as Parquet on MinIO (evidence)
                         Silver: fare_quotes_raw (TimescaleDB hypertable)
        │
        ▼
4. CLEAN                 normalise → dedupe → decompose (base|tax|UDF|conv.)
                         → outlier edit (Tukey / Hidiroglou-Berthelot)
                         → impute sold-out (cell-mean) → data contracts
        │
        ▼
5. INDEX                 cell assignment → Jevons per cell
                         → DGCA-weighted aggregation → chain-link
                         → rebase 2024=100 → block bootstrap → 95% band
        │
        ▼
6. VALIDATE              ≥30-day back-test vs DGCA + CPI air-fare item
        │
        ▼
7. SERVE                 dashboard · OpenAPI 3.1 · SDMX-JSON
                         PROVISIONAL → REVISED (T+7) → FROZEN (T+30)
```

Full Mermaid, PlantUML, sequence and deployment diagrams: **[docs/architecture-diagram.md](docs/architecture-diagram.md)**
Stage-by-stage funnel with module mapping: **[docs/implementation-flow.md](docs/implementation-flow.md)**

---

## Index Methodology

### Elementary aggregate (per cell)

```
              n
  I_c   =    ∏  ( p_i,t / p_i,t-1 ) ^ (1/n)          Jevons
             i=1
```

Geometric mean of price relatives — the standard elementary formula for volatile, substitutable items (Eurostat HICP Methodological Manual, 2024 edition; COICOP 07.3.3 = passenger transport by air).

### Higher-level aggregation

```
  APIx_t / APIx_0  =  Σ_s  w_s · ( I_s,t / I_s,0 )        Σ_s w_s = 1
```

Young / modified-Laspeyres form, consistent with MoSPI retaining Laspeyres in the 2024-base CPI. Strata are (sector × lead-time band); weights derive from **DGCA city-pair-wise monthly domestic passenger traffic**, crossed with a lead-time booking-share profile that is exposed as a tunable input rather than hidden.

### Chain-linking and rebasing

```
  LF = GM(new series over overlap year) / GM(old series over overlap year)
```

Annual chain-link, rebased to **2024 = 100** to sit alongside the current CPI series.

### Outlier edits

Tukey fences on **log** price relatives (`k = 3`, exposed as a slider), Hidiroglou–Berthelot on the ratio distribution for skewed cells, then **winsorise** at p1/p99 rather than delete — so a genuine festival surge dampens instead of vanishing.

### Imputation

```
  r̂_i,t = exp( mean over surviving j in cell of ln(p_j,t / p_j,t-1) )
```

Cell-mean imputation of the relative. Never carry-forward.

### Publication gate

If a day fills **< 70%** of expected cells, publication is **SUPPRESSED** and revised at T+7. An honest gap beats a fabricated number.

### Uncertainty

Block bootstrap, 1,000 replicates, resampling quotes within cell → 95% band on every published point.

---

## Compliance Posture

| Rule | Implementation |
|---|---|
| Respect robots.txt | `protego`, fetched and cached 24h, re-checked per source daily |
| Honour `Crawl-delay` | Feeds directly into the per-domain token bucket |
| Conservative rate limit | ≤ 1 request / 6s / domain + nightly per-domain cap |
| Identifiable | Descriptive User-Agent carrying a contact URL — never browser spoofing |
| No login-wall content | Collectors refuse authenticated routes by design |
| No PII | Fare, schedule and tax fields only. **DPDP Act 2023 not triggered.** |
| Backoff | Exponential on 429/503, capped at 15 min |
| Kill-switch | Manual, plus automatic on 3 consecutive 429s (24h trip) |
| Auditability | Every request logged; `/compliance` exposes live state and the cached robots.txt |
| **Ships off** | `COLLECTION_ENABLED=false` by default — a fresh clone cannot make a single outbound request until someone turns it on |

**Where a source's terms decline automated access**, it is demoted to a licensed API (Amadeus Self-Service), and in production to a statutory channel — MoSPI can obtain price data from airlines under the **Collection of Statistics Act, 2008**. That is not a workaround; it is how official statistics is supposed to source data.

---

## Technology Stack

### Collection
| Component | Choice |
|---|---|
| JS-rendered portals | Playwright (Python), one browser context per domain |
| Structured crawls | Scrapy |
| robots.txt | Protego |
| Licensed fallback | Amadeus Self-Service (Flight Offers Search) |
| Orchestration | Prefect flows |
| Worker fan-out | Celery + Redis |

### Data
| Component | Choice |
|---|---|
| Database | PostgreSQL 16 + TimescaleDB (hypertables, continuous aggregates) |
| Object store | MinIO (S3 API) — bronze evidence zone |
| Processing | Polars + pandas |
| Statistics | scipy, statsmodels |
| Contracts | pandera + Great Expectations |

### Serving
| Component | Choice |
|---|---|
| API | FastAPI (OpenAPI 3.1) |
| Exchange format | SDMX-JSON 1.0 |
| Frontend | React 18 + TypeScript + Tailwind |
| Charts | Apache ECharts (heatmaps, confidence bands) |
| State | Zustand |

### Operations
| Component | Choice |
|---|---|
| Testing | pytest, Hypothesis (index properties), vcrpy (recorded HTTP) |
| Metrics | Prometheus + Grafana |
| Deployment | Docker Compose |

---

## Database Schema

```
airports              iata, icao, city, name, tz
carriers              code, name, is_lcc
sources               slug, kind, access_method, robots_posture, tos_posture,
                      rate_per_min, nightly_cap, is_active, demoted_reason
sectors               origin, destination, is_trunk
stratum_weights       sector_id, lead_bucket, weight, weight_source,
                      booking_share, valid_from, valid_to

fare_quotes_raw       [hypertable on captured_at]
                      source_id, sector_id, carrier, flight_no, departure_ts,
                      lead_days, lead_bucket, cabin, fare_class, total_fare,
                      is_sold_out, raw_payload_uri, fingerprint

fare_quotes_clean     [hypertable on captured_at]
                      cell_key, sector_id, carrier, lead_bucket, cabin,
                      dep_dow_band, base_fare, taxes_fees, udf,
                      convenience_fee, total_fare, is_imputed,
                      imputation_kind, was_winsorised

elementary_index      ref_date, cell_key, formula, price_relative,
                      index_level, n_quotes, n_imputed
apix_series           ref_date, frequency, scope, measure, index_value,
                      ci_low, ci_high, coverage_pct, status
backtest_results      window_start, window_end, reference, pearson_r,
                      rmse, mape, dir_agreement, n_obs

robots_cache          source_id, fetched_at, body, crawl_delay_s
request_audit         [hypertable] source_id, url_path, http_status,
                      latency_ms, robots_allowed, was_throttled
users                 email, hashed_password, role
```

Full DDL, including hypertable creation and continuous aggregates: **[docs/BUILD_PLAN.md §2.3](docs/BUILD_PLAN.md)**

---

## Build Timeline

### Sprint 0 — Preparation
- Repository, structure, documentation set
- **Locate the real DGCA/MoCA fare reference series** (highest-value pre-work — it is *not* in the monthly traffic report)
- DGCA city-pair traffic → 20-sector basket + draft weights
- Read robots.txt and ToS for all 11 sources; fill the compliance matrix
- Register Amadeus Self-Service test key
- Write `seed_demo.py` — synthetic panel with a known injected inflation path

### Day 1 — Spine
Data platform + schema · **index engine with property tests** · compliance gate *before* the first scraper · frontend shell
**Milestone:** index recovers a known inflation path; gate refuses a DISALLOW fixture

### Day 2 — Breadth
Full cleaning pipeline · more sources · Prefect flows · API surface incl. SDMX · dashboard pages
**Milestone:** end-to-end in one command; every page renders from live API and from `?demo`

### Day 3 — Validation & polish
Back-test panel · hardening · suppression and kill-switch paths exercised · demo rehearsal · deck
**Milestone:** demo-ready, offline-safe, back-test on screen

Full task-level plan: **[docs/BUILD_PLAN.md Part 4](docs/BUILD_PLAN.md)**

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- 8 GB RAM free (Playwright + Chromium + Timescale)

### Full stack

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

### Seed and compile once

```bash
docker compose exec api python scripts/load_basket.py
docker compose exec api python scripts/seed_demo.py --days 90
docker compose exec api python -m app.orchestration.flows daily_index --date today
```

### Frontend only — no backend, no network

```bash
cd 26056/frontend
npm install
npm run dev
# then open http://localhost:5173/?demo
```

`?demo` mode runs entirely on client-side fixtures. **This is the mode to present on** — it is immune to venue Wi-Fi.

> **Note:** `COLLECTION_ENABLED` ships as `false`. Live scraping does not start until it is explicitly enabled and the compliance matrix in `collectors/registry.py` has been reviewed.

---

## API Endpoints

All prefixed `/api/v1` except the SDMX surface.

### Index
```
GET  /index/apix            ?frequency=daily|weekly|monthly&measure=total|base&from=&to=
GET  /index/apix/latest     latest point with band and publication status
GET  /index/elementary      ?cell_key=&formula=jevons|dutot|carli
GET  /index/contributions   stratum contributions to the latest movement
```

### Quotes & sectors
```
GET  /quotes                cleaned quotes, filterable, paginated
GET  /quotes/raw            raw quotes + bronze evidence URI          [ADMIN]
GET  /sectors               basket with current weights
GET  /sectors/heatmap       sector × lead-time change matrix
GET  /sectors/{id}/elasticity
GET  /sectors/{id}/decomposition
```

### Validation
```
GET  /backtest              ?reference=dgca_tariff|cpi_airfare_item&window=30
GET  /backtest/series       aligned APIx vs reference for plotting
```

### Compliance & health
```
GET  /compliance            per-source posture, caps, kill-switch state
GET  /compliance/robots/{source}   cached robots.txt + fetch timestamp
GET  /compliance/audit      request audit log (CSV export)
GET  /health/coverage       % expected cells filled vs the 70% gate
GET  /health/scrapers       yield, block rate, p95 latency per source
```

### Admin
```
POST /admin/basket          update sector basket
POST /admin/weights         load stratum weights from DGCA extract
POST /admin/rerun           re-run index for a date range
POST /admin/seed-demo       generate the synthetic panel
```

### Statistical exchange
```
GET  /sdmx/v1/data/APIX/{key}     SDMX-JSON 1.0 dataset
GET  /sdmx/v1/dataflow/APIX       dataflow definition
GET  /openapi.json                OpenAPI 3.1 spec for NSO/RBI consumers
```

---

## Demo Scenarios

### Scenario 1 — Dynamic pricing made visible
Open the lead-time elasticity curve for DEL–BOM. The same sector on the same day costs ₹4,180 at T+45 and ₹18,650 at T+1. Monthly manual collection sees one point on this curve; VIMAAN sees all five, every night.

### Scenario 2 — Festival surge, detected and survived
Sector heatmap during a festival week: DEL–CCU at T+7 up 34%. Drill into the cell — four carriers, 62 quotes, no imputation needed. The outlier filter winsorised nothing away, because the surge is real and the filter is calibrated to keep it.

### Scenario 3 — Why the formula matters
Methodology Console: flip Jevons → Carli → Dutot on the same quotes. Three lines diverge; Carli sits visibly above. Then flip imputation to naive carry-forward and watch the series flatten and drift.

### Scenario 4 — A source says no
Compliance Console: one source card shows robots.txt DISALLOW, `access_method` flipped to the licensed API, `demoted_reason` recorded, and its quote yield served from Amadeus instead. Nothing was bypassed; something was re-routed.

### Scenario 5 — A day that shouldn't be published
Force a low-coverage night. Coverage gauge drops below 70%; the day is written as `SUPPRESSED` rather than published, and flagged for revision at T+7.

### Scenario 6 — Validation
Back-test panel, 30-day window: APIx monthly against the DGCA reference and the CPI air-fare item, with ρ (levels and log-differences), RMSE, MAPE and directional agreement.

---

## Testing

```bash
docker compose exec api pytest -q
```

| Suite | What it guarantees |
|---|---|
| `test_index_math.py` | Six index properties via Hypothesis: identity, proportionality, **time reversal**, commensurability, mean value, weight sanity — including an assertion that **Carli fails** time reversal |
| `test_pipeline.py` | Outlier edits, cell-mean imputation, fare decomposition fallbacks |
| `test_compliance.py` | A robots.txt DISALLOW fixture **must** be refused; the kill-switch must trip at 3×429 |
| `cassettes/` | All HTTP in tests is replayed through vcrpy — CI never touches a live portal |

The index engine is fully testable on a laptop with no network. That is deliberate.

---

## Future Extensions

| Phase | Extension |
|---|---|
| 2 | Statutory data-sharing channel with airlines — offer prices become transaction prices, and the headline caveat disappears |
| 3 | International sectors; multi-currency fare handling |
| 4 | Hedonic quality adjustment — baggage allowance, seat pitch, refundability, connection count |
| 5 | Seasonal adjustment and festival-calendar-aware modelling |
| 6 | Extend the method to rail (IRCTC) and intercity bus — the cell design generalises |
| 7 | Formal integration into CPI 'Transport and Communication' compilation |
| 8 | Public researcher API, mirrored on eSankhyiki / NDAP |

---

## Documentation Map

| Document | Contents |
|---|---|
| **[plan.md](plan.md)** | Research & strategy: plain-English problem, methodology defence, compliance posture, dataset reality check, resource links |
| **[docs/BUILD_PLAN.md](docs/BUILD_PLAN.md)** | Full build plan — technical guide, schema DDL, API reference, code sketches, day-by-day execution, deployment |
| **[docs/architecture-diagram.md](docs/architecture-diagram.md)** | Mermaid system graph, sequence diagram, PlantUML, ASCII deployment, ASCII index-math walkthrough |
| **[docs/implementation-flow.md](docs/implementation-flow.md)** | The narrowing funnel, stage-notes table mapping every box to a module |
| **[docs/ppt-content.md](docs/ppt-content.md)** | 16 slides with visual direction, speaker notes and design guidelines |
| **[docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md)** | How to run and present the demo, seeded-data summary, 5-minute script, screenshot list, presentation rules |

---

## Honest Limitations

Stated here, and on stage, before anyone has to ask:

1. **Offer prices, not transaction prices.** We observe what a traveller would be quoted, not what was paid, nor the mix of buckets actually sold. Mitigated by weighting toward the lowest available bucket, publishing base and total in parallel, and reporting the residual gap in the back-test.
2. **Lead-time booking shares are estimated.** Actual booking-curve distributions are not published. The assumption is exposed as a tunable input, not buried.
3. **Coverage depends on source cooperation.** Where a source declines automated access, coverage for that source comes from a licensed API with its own quota limits. Low-coverage days are suppressed, not fudged.
4. **Back-test references are lower-frequency than APIx.** Comparison is made at the reference's frequency, and both level and log-difference correlations are reported — the second being the honest one.

---

## License

Open source (MIT). All dependencies are MIT / Apache-2.0 / BSD. No proprietary API is required for the system to function.

---

*Built for SIH 2026 · VIMAAN · Daily. Route-specific. Reproducible. Defensible.*
