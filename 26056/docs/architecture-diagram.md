# VIMAAN Architecture Diagram

**VIMAAN** — *Validated Index for Monitoring Airfares, Automated & National*
Publishes **APIx** — the Real-time Airfare Price Index for India.
SIH 2026 · PS 26056 · MoSPI / Data Informatics & Innovation Division (DIID)

---

## 1. Mermaid — Full System (`graph TB`)

Renders in GitHub, Notion, Obsidian and the [Mermaid Live Editor](https://mermaid.live).

```mermaid
graph TB
    subgraph SOURCES["Tier-1 Sources — Access Method Decided Per-Source by the Compliance Matrix"]
        AL["Airline portals<br/>IndiGo · Air India · AIX<br/>Akasa · SpiceJet"]
        OTA["OTA portals<br/>MakeMyTrip · Yatra · EaseMyTrip<br/>Cleartrip · Ixigo · Goibibo"]
        API["Licensed fare APIs<br/>Amadeus Self-Service<br/>Duffel (test mode)"]
        GOV["Statutory / MoU channel<br/>DGCA TMU · airline data-sharing<br/>Collection of Statistics Act 2008"]
    end

    subgraph GATE["Compliance Gate — Every Request Passes Through Here"]
        ROBOTS["robots.txt gate<br/>protego · 24h cache<br/>Crawl-delay honoured"]
        BUDGET["Per-domain token bucket<br/>≤1 req / 6s · nightly cap<br/>exp. backoff on 429/503"]
        UA["Identifiable User-Agent<br/>+ contact URL<br/>no login-wall · no PII"]
        KILL["Kill-switch<br/>manual + auto on 3× 429"]
    end

    subgraph COLLECT["Collection Layer — collectors/"]
        PW["playwright_src.py<br/>JS-rendered SPA portals<br/>headless Chromium"]
        SCR["scrapy_src.py<br/>structured / JSON-endpoint crawls"]
        AMA["amadeus_src.py<br/>Flight Offers Search"]
        POL["politeness.py · robots.py<br/>registry.py"]
    end

    subgraph ORCH["Orchestration — Prefect"]
        DAG["daily_collection flow<br/>fan-out: sector × carrier × lead-time<br/>T+1 · T+7 · T+15 · T+30 · T+45"]
        CEL["Celery + Redis<br/>worker fan-out · retries · dedupe"]
        SCHED["03:30 IST collection window<br/>13:00 IST index window"]
    end

    subgraph LAKE["Medallion Storage"]
        BRONZE[("Bronze — MinIO/S3<br/>raw HTML + JSON payloads<br/>Parquet, partitioned by run_date")]
        SILVER[("Silver — TimescaleDB<br/>fare_quotes_raw hypertable")]
        GOLD[("Gold — TimescaleDB<br/>fare_quotes_clean<br/>elementary_index · apix_series")]
    end

    subgraph PIPE["Cleaning Pipeline — pipeline/"]
        NORM["normalizer.py<br/>carrier/airport codes · TZ · INR<br/>cabin & fare-class mapping"]
        DEDUP["dedupe.py<br/>Redis fingerprint<br/>(source,flight,dep_ts,fare_class,captured_date)"]
        DEC["decomposer.py<br/>base fare | taxes | UDF<br/>| convenience fee"]
        OUT["outliers.py<br/>Tukey fences on log-relatives<br/>Hidiroglou-Berthelot · winsorise 1/99"]
        IMP["imputation.py<br/>cell-mean imputation<br/>sold-out / cancelled handling"]
        QC["quality.py<br/>pandera contracts<br/>Great Expectations suite"]
    end

    subgraph INDEX["Index Engine — indexer/"]
        CELL["elementary.py<br/>Jevons geometric mean<br/>(Dutot & Carli as diagnostics)"]
        WT["weights.py<br/>DGCA pax traffic → stratum weights"]
        AGG["aggregation.py<br/>Young / modified Laspeyres"]
        CHAIN["chain.py<br/>annual chain-link · rebase 2024=100<br/>linking factor (GM of overlap year)"]
        VAR["variance.py<br/>block bootstrap · 1000 reps<br/>95% confidence bands"]
        BT["backtest.py<br/>vs DGCA traffic-weighted fares<br/>vs CPI 07.3.3 air fare item"]
    end

    subgraph SERVE["Serving — FastAPI :8000"]
        RIDX["/index/apix<br/>daily · weekly · monthly"]
        RQ["/quotes · /sectors"]
        RBT["/backtest"]
        RC["/compliance"]
        SDMX["/sdmx/v1/data/APIX<br/>SDMX-JSON 1.0"]
        OAS["OpenAPI 3.1 spec<br/>for NSO · RBI consumers"]
    end

    subgraph UI["Dashboard — React + TS + Tailwind :3000"]
        D1["APIx headline chart<br/>+ bootstrap bands"]
        D2["Sector heatmap<br/>route × lead-time"]
        D3["Lead-time elasticity curve"]
        D4["Sector drill-down<br/>carrier split · fare decomposition"]
        D5["Back-test validation panel<br/>RMSE · ρ · directional agreement"]
        D6["Compliance & scraper health<br/>robots posture · quote yield"]
    end

    subgraph OBS["Observability"]
        PROM["Prometheus<br/>quote yield · block rate · latency"]
        GRAF["Grafana<br/>scraper health dashboards"]
    end

    AL --> ROBOTS
    OTA --> ROBOTS
    API --> AMA
    GOV --> SILVER

    ROBOTS --> BUDGET --> UA --> KILL
    KILL --> PW
    KILL --> SCR
    POL -.governs.-> PW
    POL -.governs.-> SCR

    DAG --> CEL
    SCHED --> DAG
    CEL --> PW
    CEL --> SCR
    CEL --> AMA

    PW --> BRONZE
    SCR --> BRONZE
    AMA --> BRONZE
    BRONZE --> SILVER

    SILVER --> NORM --> DEDUP --> DEC --> OUT --> IMP --> QC --> GOLD

    GOLD --> CELL --> AGG
    WT --> AGG
    AGG --> CHAIN --> VAR --> GOLD
    GOLD --> BT

    GOLD --> RIDX
    GOLD --> RQ
    BT --> RBT
    POL --> RC
    RIDX --> SDMX
    RIDX --> OAS

    RIDX --> D1
    RQ --> D2
    RQ --> D3
    RQ --> D4
    RBT --> D5
    RC --> D6

    PW --> PROM
    CEL --> PROM
    PROM --> GRAF

    classDef src fill:#0e7490,stroke:#155e75,color:#fff;
    classDef gate fill:#b45309,stroke:#92400e,color:#fff;
    classDef coll fill:#1d4ed8,stroke:#1e3a8a,color:#fff;
    classDef pipe fill:#7c3aed,stroke:#5b21b6,color:#fff;
    classDef idx fill:#be123c,stroke:#9f1239,color:#fff;
    classDef store fill:#065f46,stroke:#064e3b,color:#fff;
    classDef serve fill:#4338ca,stroke:#3730a3,color:#fff;

    class AL,OTA,API,GOV src;
    class ROBOTS,BUDGET,UA,KILL gate;
    class PW,SCR,AMA,POL,DAG,CEL,SCHED coll;
    class NORM,DEDUP,DEC,OUT,IMP,QC pipe;
    class CELL,WT,AGG,CHAIN,VAR,BT idx;
    class BRONZE,SILVER,GOLD store;
    class RIDX,RQ,RBT,RC,SDMX,OAS serve;
```

---

## 2. Mermaid — Sequence Diagram of One Daily Collection Run

This is the diagram to put on the "how it actually works" slide. It shows the compliance gate as a first-class actor, not an afterthought.

```mermaid
sequenceDiagram
    autonumber
    participant SCH as Prefect Scheduler
    participant REG as collectors/registry.py
    participant ROB as collectors/robots.py
    participant POL as collectors/politeness.py
    participant WRK as Celery Worker (Playwright)
    participant SRC as Source Portal
    participant S3 as MinIO (Bronze)
    participant TS as TimescaleDB
    participant PIP as pipeline/*
    participant IDX as indexer/*
    participant API as FastAPI

    Note over SCH: 03:30 IST — daily_collection flow starts
    SCH->>REG: enumerate active sources × basket
    REG-->>SCH: 20 sectors × 5 lead-times × 6 sources = 600 tasks

    loop per source, before first request of the day
        SCH->>ROB: allowed(source, path)?
        ROB->>SRC: GET /robots.txt (cached 24h)
        SRC-->>ROB: robots.txt
        ROB-->>SCH: ALLOW + Crawl-delay=10s
        Note right of ROB: DISALLOW ⇒ source is demoted<br/>to the licensed-API route<br/>and flagged in /compliance
    end

    SCH->>WRK: dispatch task(sector=DEL-BOM, lead=T+15, source=S3)

    loop per request
        WRK->>POL: acquire token (bucket: 1 req / 6s / domain)
        POL-->>WRK: token granted (or sleep)
        WRK->>SRC: GET search page (identifiable UA + contact URL)
        alt HTTP 200
            SRC-->>WRK: JS-rendered results
            WRK->>WRK: extract offers → RawQuote[]
        else HTTP 429 / 503
            SRC-->>WRK: throttled
            WRK->>POL: exponential backoff (2^n, cap 15 min)
            Note right of POL: 3 consecutive 429s ⇒ kill-switch<br/>trips for that domain for 24h
        end
    end

    WRK->>S3: write raw payload (Parquet, run_date partition)
    WRK->>TS: INSERT fare_quotes_raw (hypertable)

    Note over SCH: 13:00 IST — daily_index flow starts
    SCH->>PIP: normalize → dedupe → decompose → outliers → impute → QC
    PIP->>TS: UPSERT fare_quotes_clean
    PIP-->>SCH: quality report (coverage %, imputation %, outlier %)

    alt coverage ≥ 70% of expected cells
        SCH->>IDX: compute elementary (Jevons) per cell
        IDX->>IDX: aggregate (Young / modified Laspeyres) with DGCA weights
        IDX->>IDX: chain-link, rebase to 2024=100
        IDX->>IDX: block bootstrap → 95% bands
        IDX->>TS: INSERT apix_series (status = PROVISIONAL)
    else coverage < 70%
        IDX->>TS: INSERT apix_series (status = SUPPRESSED)
        Note right of IDX: publication suppressed;<br/>revision policy applies at T+7
    end

    API->>TS: SELECT apix_series
    API-->>API: serve /index/apix and /sdmx/v1/data/APIX
```

---

## 3. PlantUML — Component View

Paste into [plantuml.com/plantuml](https://www.plantuml.com/plantuml/uml/).

```plantuml
@startuml VIMAAN_Architecture
skinparam backgroundColor #0b1220
skinparam defaultTextAlignment center
skinparam ArrowColor #94a3b8
skinparam shadowing false
skinparam roundcorner 12

package "Source Tier" as SRC #0f2f3d {
    [Airline portals\n(IndiGo, AI, AIX, Akasa, SpiceJet)] as AL
    [OTA portals\n(MMT, Yatra, EMT, Cleartrip, Ixigo, Goibibo)] as OTA
    [Amadeus Self-Service /\nDuffel test mode] as APIS
    [DGCA TMU / airline MoU\n(Collection of Statistics Act 2008)] as GOV
}

package "Compliance Gate" as GATE #3b2205 {
    [robots.py\nprotego + 24h cache] as ROB
    [politeness.py\ntoken bucket, backoff] as POL
    [Identifiable UA + contact URL] as UA
    [Kill-switch] as KILL
}

package "Collection — collectors/" as COL #10214a {
    [playwright_src.py] as PW
    [scrapy_src.py] as SCR
    [amadeus_src.py] as AMA
    [registry.py] as REG
}

package "Orchestration" as ORC #10214a {
    [Prefect: daily_collection] as F1
    [Prefect: daily_index] as F2
    [Prefect: weekly_backtest] as F3
    [Celery + Redis workers] as CEL
}

package "Storage (Medallion)" as ST #063d2f {
    database "Bronze — MinIO\nraw Parquet" as BRZ
    database "Silver — fare_quotes_raw\nTimescale hypertable" as SLV
    database "Gold — fare_quotes_clean\napix_series" as GLD
}

package "Cleaning — pipeline/" as PIP #2e1065 {
    [normalizer.py] as N1
    [dedupe.py] as N2
    [decomposer.py] as N3
    [outliers.py] as N4
    [imputation.py] as N5
    [quality.py] as N6
}

package "Index Engine — indexer/" as IDX #4c0519 {
    [elementary.py\nJevons] as I1
    [weights.py\nDGCA pax traffic] as I2
    [aggregation.py\nYoung/mod. Laspeyres] as I3
    [chain.py\nchain-link + rebase] as I4
    [variance.py\nblock bootstrap] as I5
    [backtest.py] as I6
}

package "Serving — FastAPI" as SRV #26216b {
    [/index/apix] as E1
    [/quotes, /sectors] as E2
    [/backtest] as E3
    [/compliance] as E4
    [/sdmx/v1/data/APIX] as E5
}

package "Dashboard — React" as UI #26216b {
    [APIx chart + bands] as U1
    [Sector heatmap] as U2
    [Lead-time elasticity] as U3
    [Back-test panel] as U4
    [Scraper health] as U5
}

AL --> ROB
OTA --> ROB
APIS --> AMA
GOV --> SLV
ROB --> POL
POL --> UA
UA --> KILL
KILL --> PW
KILL --> SCR
REG --> ROB
F1 --> CEL
CEL --> PW
CEL --> SCR
CEL --> AMA
PW --> BRZ
SCR --> BRZ
AMA --> BRZ
BRZ --> SLV
F2 --> N1
SLV --> N1
N1 --> N2
N2 --> N3
N3 --> N4
N4 --> N5
N5 --> N6
N6 --> GLD
GLD --> I1
I1 --> I3
I2 --> I3
I3 --> I4
I4 --> I5
I5 --> GLD
F3 --> I6
GLD --> I6
GLD --> E1
GLD --> E2
I6 --> E3
POL --> E4
E1 --> E5
E1 --> U1
E2 --> U2
E2 --> U3
E3 --> U4
E4 --> U5

@enduml
```

---

## 4. ASCII — Deployment Diagram (Docker Compose, single host)

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  HOST  (8 vCPU / 16 GB RAM / 250 GB SSD — a single MoSPI DIID VM is enough)        │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │ docker network: vimaan_net                                                  │  │
│  │                                                                             │  │
│  │  ┌──────────────┐   ┌──────────────────┐   ┌───────────────────────────┐   │  │
│  │  │  nginx       │   │  api             │   │  postgres + timescaledb   │   │  │
│  │  │  :3000       │──▶│  FastAPI :8000   │──▶│  :5432                    │   │  │
│  │  │  SPA + /api  │   │  uvicorn x4      │   │  hypertables:             │   │  │
│  │  │  gzip, cache │   │  OpenAPI 3.1     │   │   fare_quotes_raw         │   │  │
│  │  └──────────────┘   │  SDMX-JSON out   │   │   fare_quotes_clean       │   │  │
│  │         ▲           └──────────────────┘   │  continuous aggregates:   │   │  │
│  │         │                    ▲             │   apix_daily, apix_weekly │   │  │
│  │  ┌──────┴───────┐            │             │   apix_monthly            │   │  │
│  │  │  frontend    │            │             └───────────────────────────┘   │  │
│  │  │  React build │            │                          ▲                   │  │
│  │  │  (static)    │            │                          │                   │  │
│  │  └──────────────┘            │             ┌────────────┴──────────────┐   │  │
│  │                              │             │  worker (Celery)          │   │  │
│  │  ┌───────────────────────┐   │             │  Playwright + Chromium    │   │  │
│  │  │  scheduler (Prefect)  │───┼────────────▶│  concurrency = 4          │   │  │
│  │  │  daily_collection     │   │             │  1 browser ctx / domain   │   │  │
│  │  │  daily_index          │   │             └───────────────────────────┘   │  │
│  │  │  weekly_backtest      │   │                          ▲                   │  │
│  │  └───────────────────────┘   │                          │                   │  │
│  │                              │             ┌────────────┴──────────────┐   │  │
│  │  ┌───────────────────────┐   │             │  redis :6379              │   │  │
│  │  │  minio :9000          │◀──┘             │  broker · token buckets   │   │  │
│  │  │  bronze/ raw parquet  │                 │  quote-fingerprint dedupe │   │  │
│  │  │  + raw HTML evidence  │                 │  robots.txt cache         │   │  │
│  │  └───────────────────────┘                 └───────────────────────────┘   │  │
│  │                                                                             │  │
│  │  ┌───────────────────────┐   ┌───────────────────────┐                     │  │
│  │  │  prometheus :9090     │──▶│  grafana :3001        │                     │  │
│  │  │  scraper + API metrics│   │  scraper health board │                     │  │
│  │  └───────────────────────┘   └───────────────────────┘                     │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  Volumes:  pgdata (Timescale) · miniodata (bronze) · redisdata                    │
│            pw_cache (Playwright browsers) · grafana_data                          │
│                                                                                   │
│  Egress:   only to the source domains in collectors/registry.py                    │
│            all egress logged; per-domain nightly request cap enforced              │
└───────────────────────────────────────────────────────────────────────────────────┘

                    ▼ consumed by ▼
        ┌──────────────────┬──────────────────┬──────────────────┐
        │  NSO / MoSPI     │  RBI (MPD/DEPR)  │  Public / press  │
        │  SDMX-JSON pull  │  OpenAPI + CSV   │  dashboard + CSV │
        └──────────────────┴──────────────────┴──────────────────┘
```

---

## 5. ASCII — Data Flow Through the Index Math

The one diagram that answers "is this statistically defensible?".

```
  RAW QUOTE  (one row of fare_quotes_raw)
  ──────────────────────────────────────────────────────────────────────────
  captured_at 2026-09-04T03:41Z │ source ixigo │ sector DEL-BOM
  carrier 6E │ flight 6E-2134 │ departure 2026-09-19T06:10 (= T+15)
  cabin ECONOMY │ fare_class SAVER │ total ₹7,412
  ──────────────────────────────────────────────────────────────────────────
                                 │
                                 ▼
  ① NORMALISE  ─ IATA codes, IST→UTC, INR, cabin & fare-class mapping
                                 │
                                 ▼
  ② DECOMPOSE  ─ ₹7,412 = base 5,150 + taxes/fees 1,432 + UDF 236
                            + convenience 594
                 →  the index tracks TOTAL (what the traveller pays)
                    and BASE (the airline's own price signal) in parallel
                                 │
                                 ▼
  ③ CELL ASSIGNMENT — the elementary aggregate
     cell_key = (sector, carrier, lead_bucket, cabin, dep_dow_band)
              = (DEL-BOM, 6E, T+15, ECON, WEEKDAY)
     Constant lead time is what holds quality fixed. We never compare
     "DEL-BOM yesterday" to "DEL-BOM today"; we compare
     "DEL-BOM, 15 days out, weekday, 6E, economy" across days.
                                 │
                                 ▼
  ④ OUTLIER FILTER on log price relatives r_i = ln(p_i,t / p_i,t-1)
     Tukey:  keep r_i ∈ [Q1 − 3·IQR , Q3 + 3·IQR]
     Hidiroglou-Berthelot on the ratio distribution for skewed cells
     Winsorise survivors at the 1st / 99th percentile
                                 │
                                 ▼
  ⑤ IMPUTATION for sold-out / missing cells
     cell-mean imputation:  r̂_i,t = exp( mean over surviving j in cell
                                          of ln(p_j,t / p_j,t-1) )
     NOT carry-forward (p_i,t := p_i,t-1) — see §4 of plan.md
                                 │
                                 ▼
  ⑥ ELEMENTARY INDEX — Jevons (geometric mean of price relatives)
                        n
     I_c(t/t-1)  =  ∏  ( p_i,t / p_i,t-1 ) ^ (1/n)
                       i=1
     Matches MoSPI's own CPI 2024 choice for elementary aggregates.
                                 │
                                 ▼
  ⑦ STRATUM AGGREGATION — Young / modified Laspeyres
     APIx_t / APIx_0  =  Σ_s  w_s · ( I_s,t / I_s,0 )        Σ_s w_s = 1
     w_s from DGCA domestic passenger traffic × lead-time share
     Matches MoSPI's own CPI 2024 choice for higher-level aggregation.
                                 │
                                 ▼
  ⑧ CHAIN-LINK + REBASE to 2024 = 100
     LF = GM(new series, overlap year) / GM(old series, overlap year)
     (the same linking-factor construction MoSPI published for CPI 2024)
                                 │
                                 ▼
  ⑨ VARIANCE — block bootstrap over quotes within cell, 1000 replicates
     → 95% band around every published APIx point
                                 │
                                 ▼
  ⑩ PUBLISH — apix_series (PROVISIONAL → REVISED at T+7 → FROZEN at T+30)
     + /sdmx/v1/data/APIX for NSO/RBI, + dashboard, + CSV
```

---

## 6. How to Render These

```bash
# Mermaid → PNG/SVG
npm i -g @mermaid-js/mermaid-cli
mmdc -i architecture-diagram.md -o architecture.png -w 3200 -H 1800 -b transparent

# Or: paste the mermaid block into https://mermaid.live and export

# PlantUML → PNG
# paste into https://www.plantuml.com/plantuml/uml/
# or: java -jar plantuml.jar architecture.puml

# The ASCII blocks are meant to be screenshotted from a monospace editor
# at ~13pt for the PPT — they render more legibly than a re-drawn box diagram.
```

---

## 7. Diagram Assets Referenced Elsewhere

| Filename | Status | Used in |
|---|---|---|
| `architecture.png` | **not yet generated** — render from §1 | README, PPT slide 11 |
| `implementation-flow.svg` / `.png` | **not yet generated** — see `implementation-flow.md` | PPT slide 5, README |
| `implementation-flow-full.svg` / `.png` | **not yet generated** | appendix / report |
| `sequence-daily-run.png` | **not yet generated** — render from §2 | PPT slide 5 speaker panel |

None of the raster/vector assets exist in this folder yet; all four are reproducible from the source blocks above.
