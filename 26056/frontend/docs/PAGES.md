# VIMAAN Frontend — Pages & Features

Comprehensive documentation of every page in the VIMAAN frontend application.

---

## Table of Contents

1. [Dashboard](#1-dashboard)
2. [Overview](#2-overview)
3. [Heatmap](#3-heatmap)
4. [Elasticity](#4-elasticity)
5. [Cross-Check](#5-cross-check)
6. [Quotes Explorer](#6-quotes-explorer)
7. [Forecast](#7-forecast)
8. [Backtest](#8-backtest)
9. [Compliance Gate](#9-compliance-gate)
10. [Collection Health](#10-collection-health)
11. [Reports](#11-reports)
12. [Scraper Architecture](#12-scraper-architecture)
13. [Scraper Configuration](#13-scraper-configuration)
14. [Decomposition](#14-decomposition)
15. [Methodology Console](#15-methodology-console)
16. [Anomaly Detection](#16-anomaly-detection)
17. [API & Endpoints](#17-api--endpoints)
18. [API Playground](#18-api-playground)
19. [Design System](#19-design-system)

---

## 1. Dashboard

**Route:** `/`

The landing page — a real-time command center showing live system state.

### Features

| Feature | Description |
|---|---|
| **Live clock** | Real-time IST clock in the header, updating every second |
| **System health callout** | "All clear" banner with quote ingestion count and source count |
| **4 KPI stat tiles** | Overall APIx (104.42), YoY Inflation (8.4%), Routes Covered (24/24), Data Freshness (Live) |
| **Live collection feed** | Real-time simulated quote ticker showing source/sector/window/fare/cabin/age |
| **Sector overview table** | Top 6 routes by passenger traffic with index value, 30d change, trend icon (up/down/stable), and confidence badge (high/medium) |
| **Trend icons** | Phosphor icons (TrendUp, TrendDown) with color coding (warn = rising = dearer, good = falling) |

### Data
- Uses `DEMO_DATE` from `generate.ts`
- LiveFeed component from `lib/liveFeed.ts` with 2-second interval simulation

---

## 2. Overview

**Route:** `/overview`

The main index page — the published APIx number with all supporting statistics.

### Features

| Feature | Description |
|---|---|
| **Headline stat tile** | Animated count-up of APIx total fare index value (rebased to 2024 = 100) |
| **Day delta badge** | Shows today's change (positive = critical/warn tone since dearer airfare = cost to households) |
| **95% band badge** | Shows the confidence interval [low, high] |
| **Key-value pairs** | 30-day movement, base-fare index, wedge (total over base), mean band half-width |
| **Publication status strip** | Last 30 nights color-coded: Provisional (accent), Revised (good), Frozen (neutral), Suppressed (critical) |
| **7 stat tiles** | Quotes in panel, panel coverage (with meter at 70% gate), elementary cells, base-fare index with sparkline, back-test correlation (rho), days suppressed, last 30 days APIx with sparkline |
| **Published series chart** | IndexBandChart with frequency toggle (Daily/Weekly/Monthly), measure toggle (Total/Base), confidence band toggle, event markers toggle |
| **What moved today** | DivergingBars showing weighted stratum contributions in index points |
| **Carrier mix donut** | Donut chart + legend showing share of cleaned panel by marketing carrier |
| **Publication gate meter** | Coverage meter with 70% threshold, explanatory callout about honest gaps |
| **Annotated events calendar** | Grid of events with type badges (cost/capacity/warn), date range, lift percentage, explanatory notes |
| **CSV export** | From the shell (AppShell) |
| **Footer disclaimer** | Explains these are offer prices, not transaction prices |

### Data
- `generate.ts`: DAILY, WEEKLY, MONTHLY, LATEST, PREVIOUS, CONTRIBUTIONS, CARRIER_MIX, EVENTS, CELL_COUNT, CLEAN_QUOTES, RAW_QUOTE_COUNT, SUPPRESSED_COUNT, MEAN_BAND_HALFWIDTH, BACKTEST_METRICS
- `reference.ts`: SECTORS (via sectorOf)
- Deterministic via `seriesFor(freq)`

---

## 3. Heatmap

**Route:** `/heatmap`

Sector-by-lead-window heatmap showing week-on-week percentage changes.

### Features

| Feature | Description |
|---|---|
| **Sortable heatmap** | Sort by weight, move, or A-Z |
| **4 stat tiles** | Hottest cell (Thermometer icon), coolest cell (Circle), cells painted (100), cells needing imputation (Warning) |
| **20x5 grid** | 20 sectors x 5 lead windows (T+1, T+7, T+15, T+30, T+45) |
| **Cell drill-down panel** | Click any cell to see: mean fare now, mean fare 7 days ago, Jevons price relative, sector weight, carrier count, sub-cells rolled up |
| **Contributing carriers list** | Per-cell breakdown showing carrier codes with quote counts |
| **Lead window summary bars** | RankedBars showing mean week-on-week change by booking window across all sectors |
| **Biggest movers list** | Top 8 cells by week-on-week change, clickable to drill in |
| **Color legend** | Cool arm (fares fell), neutral, warm arm (fares rose) |
| **Imputation badges** | Per-cell flag for contains imputed quotes vs no imputation needed |
| **Explanatory callout** | Why comparison is cell against cell, not sector against sector (holding lead time constant holds quality constant) |

### Data
- `generate.ts`: HEATMAP (100 rows), CELLS (800 rows), SECTOR_WEIGHT, fareAtLead, heatAt
- `reference.ts`: SECTORS, LEAD_BUCKETS, carrierOf, sectorOf

---

## 4. Elasticity

**Route:** `/elasticity`

Lead-time elasticity — the fare curve across booking windows for the same flight.

### Features

| Feature | Description |
|---|---|
| **Live fare ladder** | Real Cleartrip scrape data for a non-stop IndiGo flight, showing fare at each of 5 lead windows (T+1 to T+45) with depart date, airline, flight number, and "Verify" deep link |
| **Live badge** | Animated pulse dot with "Refreshed X ago" timestamp |
| **4 stat tiles** | Fare booked 45 days out (cheapest), fare booked 1 day out (most expensive), spread ratio (x spread), "points a monthly collector sees" (1 of 5) |
| **Live cabin comparison** | RankedBars + detail cards showing cheapest fare in each cabin class (Economy, Business, First) from Cleartrip with Verify links |
| **Elasticity curve chart** | MultiLine chart with log/linear Y-scale toggle, dual-sector overlay with dots at bucket leads |
| **Sector selectors** | Primary + overlay sector selectors for dual comparison (trunk vs short-haul) |
| **Manual vs VIMAAN comparison** | Side-by-side panel showing what a manual monthly collection sees vs VIMAAN's 5 windows |
| **Bucket comparison table** | DataTable with 5 lead windows, showing primary/secondary fare, gap, and ratio against T+45 |
| **Scale toggle** | Log scale (percentage equal distance) vs Linear scale (rupee equal distance) |

### Data
- `generate.ts`: elasticityCurve, fareAtLead, leadSpread
- `liveFareLadder.ts`: LIVE_FARE_LADDER (real Cleartrip scrape), LIVE_FARE_LADDER_ROUTE
- `liveCabinCompare.ts`: LIVE_CABIN_COMPARE, LIVE_CABIN_COMPARE_ROUTE
- `useRelativeTime.ts` hook for "refreshed X ago" badges

---

## 5. Cross-Check

**Route:** `/cross-check`

Verification page — same flight priced across every aggregator.

### Features

| Feature | Description |
|---|---|
| **Flight detail card** | Shows the exact flight (airline, flight number, route, departure date, time) with the reference fare |
| **Lead window selector** | SegmentedControl to switch between T+1, T+7, T+15, T+30, T+45 |
| **Cross-check table** | 8 aggregators (Cleartrip, Goibibo, MakeMyTrip, Ixigo, EaseMyTrip, Yatra, Akasa, Air India Express) sorted cheapest-first, each with price and "Open" deep link to that aggregator's site |
| **RankedBars chart** | Visual comparison of fare across all 8 aggregators |
| **Live badge** | "Refreshed X ago" from the scrape timestamp |
| **Disclaimer** | Fares change between looking and booking; always confirm at checkout |

### Data
- `liveFareLadder.ts`: LIVE_FARE_LADDER, LIVE_FARE_LADDER_ROUTE
- `crossCheck.ts`: AGGREGATORS (8 OTAs/metasearch with deep-link builders via `buildUrl`)

---

## 6. Quotes Explorer

**Route:** `/quotes`

Row-by-row view of the cleaned panel — every quote with its full 4-way fare split.

### Features

| Feature | Description |
|---|---|
| **6-dimension filters** | Sector (24), Carrier (5), Lead window (5), Source (14), Search text (flight number/sector), Imputed-only toggle, Sold-out-only toggle |
| **Clear filters button** | Appears when any filter is active |
| **4 stat tiles** | Rows matching (of total), mean total fare, imputed rows count, sold-out observations count |
| **DataTable** | 420 rows with columns: captured_at, sector, flight, lead window, weekday band, source, base fare, taxes, UDF, convenience fee, total fare, flags |
| **Flag badges** | imputed (warn), winsorised (serious), sold out (critical), or "clean" |
| **CSV export** | Downloads matching rows with full fare split columns |
| **Footnote** | Cell key explanation (sector, carrier, lead, cabin, weekday band — the unit the index compares) |
| **Sample note** | Disclaimer that this loads a slice from the latest night |

### Data
- `generate.ts`: QUOTES (420 rows), CLEAN_QUOTES
- `reference.ts`: SECTORS, CARRIERS, LEAD_BUCKETS, PANEL_SOURCES

---

## 7. Forecast

**Route:** `/forecast`

Fare forecasting — 14-day and 30-day ahead projections with confidence bands.

### Features

| Feature | Description |
|---|---|
| **4 stat tiles** | 14-day forecast value (108.4), 30-day forecast (112.7), model type (LSTM + Seasonal ARIMA), forecast accuracy/MAPE (3.2%) |
| **APIx forecast chart** | MultiLine chart with 60-day history + 14-day forecast (dashed, narrower band) + 30-day forecast (dashed, wider band), confidence bands that widen with horizon |
| **Forecast dots** | Marked points on the chart for the 14d and 30d forecast horizons |
| **Forecast zone bands** | Colored background bands distinguishing the 14-day window from the 30-day window |
| **Sector forecast table** | DataTable of top 8 sectors by passenger volume with 7d/14d/30d fare forecasts, trend arrows (Rising/Falling/Stable), and confidence badges |
| **Festival events panel** | 3 cards for Diwali (+15-25%), Winter peak (+8-12%), Summer holidays (+10-18%) with affected sectors, confidence levels, and descriptions |
| **Model architecture diagram** | Visual layer stack: Input → LSTM×2 → Dropout → Dense → Output |
| **Legend** | Historical actual, 14-day forecast, 30-day forecast, confidence bands |

### Data
- `buildChartData()`: Deterministic sin-wave based history + forecast
- `buildSectorForecasts()`: Sector-level forecasts (uses Math.random() — non-deterministic)
- `reference.ts`: SECTORS

---

## 8. Backtest

**Route:** `/backtest`

Validation page — 30-day back-tested results against reference series.

### Features

| Feature | Description |
|---|---|
| **5 metric tiles** | Correlation levels (rho), correlation log-differences (rho), RMSE (points), MAPE (%), directional agreement (X/Y days) |
| **APIx vs reference chart** | MultiLine series, both indexed to 100 at window start |
| **Scatter plot with fit line** | ScatterFit chart: reference on X, APIx on Y, with least-squares regression line |
| **Recovery of known path** | IndexBandChart showing the estimated index vs the injected true path on a synthetic panel |
| **CPI comparison table** | APIx vs CPI air-fare item, with gap column (color-coded when gap > 1.5) |
| **Residual gap analysis** | KeyValue panel with RMSE, largest single-day gap, days APIx read higher/lower |
| **Honest gap callout** | Explains offer prices vs transaction prices as a source of residual gap |

### Data
- `generate.ts`: BACKTEST (30 days), BACKTEST_METRICS, RECOVERY, RECOVERY_INSIDE_BAND

---

## 9. Compliance Gate

**Route:** `/compliance`

Legal and ethical scraping compliance — every outbound request passes through here.

### Features

| Feature | Description |
|---|---|
| **COLLECTION_ENABLED badge** | Red critical badge showing collection is currently OFF |
| **Warning callout** | States that no robots.txt or terms have been read for real portals; all read "Pending review" |
| **4 stat tiles** | Sources in registry (14), postures pending review, requests throttled, kill-switches tripped (0) |
| **Source registry table** | 14 sources with columns: label, kind, robots.txt posture badge, terms posture badge, route (access method), nightly cap. Clickable to select and see detail |
| **Per-source detail panel** | Selected source shows: route, rate limit, nightly cap, robots.txt cache status, kill-switch state, request meter vs cap |
| **Illustrative source demo** | One synthetic source shows the full demote path: robots.txt disallows → route changed to licensed API → 0 requests issued → robots.txt displayed |
| **10 standing rules grid** | Two-column grid: robots.txt respected, crawl-delay honoured, conservative rate limit, identifiable requests, no login/personal data, exponential backoff, kill-switch, one fetch per cell, anti-bot measures not defeated |
| **Request audit log table** | 140 rows with: timestamp, source, URL path, HTTP status (color badge), latency, robots allowed (yes/no), throttled (yes/no) |
| **CSV export** | Export full audit log |
| **Legal position panel** | DPDP Act 2023 not engaged, unsettled Indian law on scraping, production assumes statutory feed |
| **What this system does not do** | No CAPTCHA solving, no residential proxies, no login, no spoofed browser, no personal data |

### Data
- `generate.ts`: AUDIT (140 rows), SOURCE_HEALTH, DEMO_DATE
- `reference.ts`: SOURCES (14), POSTURE_LABEL, ACCESS_LABEL, type Posture, type SourceDef

---

## 10. Collection Health

**Route:** `/health`

Operational health dashboard — coverage, yield, latency, block rates.

### Features

| Feature | Description |
|---|---|
| **Live scrape log** | Real Cleartrip collection runs (from liveFareLadder + liveCabinCompare), sorted most-recent first, with "Refreshed X ago" badges and Verify links |
| **5 health stat tiles** | Coverage tonight (with sparkline of last 30 days), quotes collected (total), mean yield (%), worst p95 latency (ms), mean block rate (%) |
| **Coverage chart** | MultiLine of nightly coverage with horizontal dashed line at 70% publication gate |
| **Per-source health table** | 6 sources with yield progress bar, block rate badge, p95 latency, kill-switch state |
| **Nightly run timeline** | 7 pipeline stages with start time, duration, status badge, duration bar, and detail text |
| **Cleaning funnel** | 4 stages with progress bars: raw payloads → dedup → outlier removal → cleaned panel, with keep/remove counts |
| **Panel quality key-value** | Raw quotes, clean quotes, survival rate, cell-days imputed, winsorised quotes, nights suppressed |

### Data
- `generate.ts`: DAILY, FUNNEL, LATEST, NIGHTLY_RUN, SOURCE_HEALTH, IMPUTED_SHARE, CLEAN_QUOTES, RAW_QUOTE_COUNT, WINSORISED_QUOTES, SUPPRESSED_COUNT
- `liveFareLadder.ts`, `liveCabinCompare.ts`: LIVE_RUNS for scrape log
- `useRelativeTime.ts` hook

---

## 11. Reports

**Route:** `/reports`

Automated report generation and distribution management.

### Features

| Feature | Description |
|---|---|
| **4 stat tiles** | Reports generated (270 in 90 days), report templates (6), auto-distribution list (12), average generation time (3.2s) |
| **6 report template cards** | Daily Brief (1pg, PDF/HTML), Weekly Summary (4pg, PDF), Monthly Release (8pg, PDF/HTML), Sector Deep-dive (2pg, PDF/CSV), Anomaly Alert (1pg, PDF/JSON/HTML), Compliance Report (3pg, PDF/CSV/JSON) — each with audience and gen time |
| **Daily brief preview** | Fake PDF rendering showing: header with reference number, APIx value (107.83), change (+1.24/+1.17%), 95% CI, coverage, band width, top 3 gainers, top 3 losers, methodology note |
| **Download PDF button** | Generates a text file with the daily brief content |
| **Report queue table** | 8 queue rows with report type, timestamp, format, size, status (completed/generating/queued), and download button |
| **6 distribution channels** | eSankhyiki portal, RBI Data Warehouse, DGCA bulletin, data.gov.in, Email digest, SDMX endpoint |
| **OpenAPI spec download** | Mentioned in the lede |
| **Sample CSV/SDMX builders** | In the ApiPage (see below) |

### Data
- Synthetic constants: REPORT_TEMPLATES, QUEUE_ROWS, DISTRIBUTION_CHANNELS
- `generate.ts`: DEMO_DATE
- Download helpers produce text/CSV/JSON blobs

---

## 12. Scraper Architecture

**Route:** `/scraper-arch`

Visual architecture of the collection engine — how quotes flow from sources to index.

### Features

| Feature | Description |
|---|---|
| **4 stat tiles** | Sources configured (14), active collectors (6), nightly quote target (1,440), average collection time (47 min) |
| **7-layer architecture diagram** | Sources → Collectors → Compliance Gate → Processing Pipeline → Cleaning → Storage → Index Engine, with arrows and color-coded nodes |
| **Collector status table** | 9 collectors (IndiGo, Air India, SpiceJet, Cleartrip, MakeMyTrip, Yatra, Amadeus, Duffel, DGCA Feed) with type badge, status, last run, quotes, success rate, avg latency, notes |
| **Technology stack panels** | Scraping: Playwright, Scrapy, Puppeteer, Requests+BS4; Infrastructure: PostgreSQL, Redis, Celery+Redis, Prometheus+Grafana, Docker Compose |
| **10 anti-bot rules grid** | robots.txt compliance, crawl-delay enforcement, rate limiting, UA identification, no CAPTCHA solving, exponential backoff, kill-switch, IP rotation (planned), session management, DPDP compliance |

### Data
- All synthetic constants: COLLECTORS, PIPELINE_STEPS, ANTI_BOT_RULES

---

## 13. Scraper Configuration

**Route:** `/scraper-config`

Full operational control panel for the collection pipeline.

### Features

| Feature | Description |
|---|---|
| **Demo mode callout** | Warns that controls are wired to local state for demo |
| **5 stat tiles** | Active sources (X/13), rate limit (req/min), concurrent browsers, timeout (s), publication gate (%) |
| **Global settings panel** | Collection enabled toggle, rate limit slider (1-60 req/min), max concurrent browsers (1-10), request timeout (10-120s), retry attempts (0-5), backoff base (1-60s), collection window start/end time inputs, coverage publication gate slider (50-90%) |
| **Per-source config table** | All 14 sources with per-row: enable/disable toggle, rate limit, nightly cap, crawl delay, timeout, retries, kill-switch state (ARMED/DISARMED/TRIGGERED) |
| **6 scheduled jobs** | Daily collection (22:00), Weekly aggregation (Mon 06:00), Monthly release (5th 08:00), Backtest run (04:00), Report generation (23:30), Data purge (Sun 02:00) — each with schedule, description, icon, tone |
| **Config change audit log** | 6 entries showing who changed what parameter, old/new values, and reason (e.g., "Reduced rate limit after 429 blocks") |
| **Emergency controls** | Pause collection, resume collection, manual run (with 2s simulated delay), purge old data (with two-click confirmation) |
| **Export config button** | Downloads configuration |

### Data
- `reference.ts`: SOURCES (for per-source defaults)
- All other state is local React state with synthetic audit log

---

## 14. Decomposition

**Route:** `/decomposition`

Fare decomposition — every quote split into base fare, taxes, UDF, and convenience charge.

### Features

| Feature | Description |
|---|---|
| **4 stat tiles** | Mean ticket all-India (with sparkline), base fare share (with comparison to window start), levied on top (absolute + delta), UDF per departure |
| **Stacked area chart** | 4-series stacked area (base fare, taxes, UDF, convenience charge) across the window |
| **Rupees vs share toggle** | Switch between absolute rupees and percentage-of-ticket view |
| **Sector composition bars** | Top 12 sectors with horizontal stacked bars showing the 4-component split |
| **Who charges what cards** | 4 component explainer cards: Base fare (airline), Taxes & fees (statutory), UDF (airport operator), Convenience charge (OTA/channel) — each with icon, amount, share percentage, and explanatory note |
| **Overall composition bar** | Stacked bar of the mean ticket showing all 4 components with legend |
| **Callout** | Why the headline tracks total fare (CPI measures what households spend) |

### Data
- `generate.ts`: DECOMPOSITION, SECTOR_DECOMPOSITION
- `reference.ts`: SECTORS (via sectorOf)

---

## 15. Methodology Console

**Route:** `/methodology`

Interactive methodology page — the formula choice made visible, not asserted.

### Features

| Feature | Description |
|---|---|
| **4 stat tiles** | Published index (Jevons), same quotes under Carli (showing upward bias), time-reversal Jevons (passes, =1.0000), time-reversal Carli (fails) |
| **Three formulas panel** | Side-by-side display of Jevons, Dutot, Carli with LaTeX rendering; series toggle (show all three or selected one); explanatory notes for each formula choice |
| **Time-reversal test** | Forward index × backward index = 1 test for each formula; Jevons passes exactly, Dutot passes, Carli fails; shows the actual price relatives that drove the test |
| **Tukey fence sensitivity slider** | Adjustable k from 1 to 5; live recomputation of quotes edited, index level, effect of moving the fence, share of panel edited with meter |
| **Independence Day callout** | Green/red callout explaining whether a real demand week survives the fence at current k |
| **Imputation comparison** | Cell-mean imputation (used) vs naive carry-forward (contrast) toggle; chart showing the two series; drift callout when carry-forward is shown |
| **Cell-mean formula display** | LaTeX: r̂_i,t = exp(mean over surviving j in cell of ln(p_j,t / p_j,t-1)) |
| **Editable booking-share sliders** | 5 sliders for T+1, T+7, T+15, T+30, T+45 booking shares; live computation of resulting stratum weights for top 3 sectors |
| **Formula notes** | Jevons: standard for volatile substitutable items; Dutot: implicit price-level weighting, diagnostic only; Carli: fails time-reversal, upward bias |

### Data
- `generate.ts`: FORMULA_SERIES, IMPUTATION_SERIES, SAMPLE_PAIRS, SAMPLE_RELATIVES, LATEST, CLEAN_QUOTES, indexAtFence, timeReversal
- `reference.ts`: BOOKING_SHARE, LEAD_BUCKETS, SECTORS

---

## 16. Anomaly Detection

**Route:** `/anomaly`

AI-powered anomaly detection — ensemble model flagging unusual fare movements.

### Features

| Feature | Description |
|---|---|
| **Disclaimer** | All data on this page is simulated for demonstration |
| **4 stat tiles** | Anomalies detected today (3), model accuracy/backtested (94.2%), false positive rate (5.8%), average detection lag (2.4h) |
| **5 active alerts** | Each with severity badge (CRITICAL/WARN/INFO), sector, lead window, description, confidence %, cause (Data error/Demand shock/Fuel surcharge/Festival), status (Open/Investigating/Resolved), detected timestamp |
| **Model performance table** | 4 models (Isolation Forest, Statistical Fence, Pattern Match, Ensemble) with precision, recall, F1, latency (ms), status |
| **5 detection rules** | Single-sector jump (>30% in 24h), cross-sector correlation break (divergence >10% over 48h), fare reversal (drop then spike within 72h), CAPTCHA/block pattern (zero yield >4h), lead-time curve distortion — each with threshold, sensitivity, last triggered, auto-action |
| **30-day anomaly score timeline** | MultiLine chart of ensemble probability output (0-1) with WARN threshold line at 0.45 and CRITICAL at 0.70 |
| **Ensemble badge** | "Trained on 90-day panel" in the header |
| **Alert cadence** | "Every 15 minutes; critical pages analyst, warn batched for morning" |

### Data
- All synthetic/hardcoded constants: ANOMALY_ALERTS, MODEL_PERFORMANCE, DETECTION_RULES, TIMELINE_DATA
- Explicitly marked as "fabricated for demo purposes"

---

## 17. API & Endpoints

**Route:** `/api`

Publication surface — OpenAPI 3.1 + SDMX-JSON for NSO/RBI integration.

### Features

| Feature | Description |
|---|---|
| **4 stat tiles** | Endpoints published (22), series points available (daily + weekly + monthly counts), latest published value, revision horizon (T+30) |
| **6 endpoint groups** | Index (4 endpoints), Quotes/Sectors (6), Validation/Health (4), Compliance (3), Statistical Exchange/SDMX (3), Admin (4, with lock badges) |
| **Endpoint cards** | Each with method badge (GET green, POST amber), path, note, admin badge for admin endpoints |
| **SDMX-JSON payload** | Generated live from the series with frequency toggle (Daily/Weekly/Monthly); shows last 6 observations with observation attributes (status: A/P/M) |
| **Copy to clipboard** | Copies the JSON payload |
| **JSON download** | Downloads the SDMX payload as a file |
| **Publication lifecycle** | 3-step visual: Provisional (morning after) → Revised (T+7) → Frozen (T+30) |
| **Status strip** | Last 28 days color-coded by publication status |
| **Consuming the feed** | curl examples for both the REST API and SDMX-JSON endpoint |
| **MoSPI alignment note** | Callout about alignment with MoSPI's eSankhyiki portal and MCP server |

### Data
- `generate.ts`: DAILY, WEEKLY, MONTHLY, LATEST, DEMO_DATE
- All endpoint definitions are hardcoded constants

---

## 18. API Playground

**Route:** `/api/playground`

Interactive API explorer for NSO/RBI integration teams.

### Features

| Feature | Description |
|---|---|
| **Disclaimer callout** | "Sample response — no backend required yet" |
| **Request builder** | Endpoint selector (GET /api/v1/apix), frequency dropdown (daily/weekly/monthly), sector dropdown, date range inputs (from/to) |
| **Send request button** | Does nothing (no real backend) |
| **Response viewer** | Pre-built JSON response showing APIx value, YoY change, 6 sectors with index values and changes, metadata (sources, quotes ingested, last scrape, basket size, advance purchase windows) |
| **Copy response** | Copies the JSON to clipboard |
| **cURL snippet** | Pre-formatted curl command with Authorization header placeholder |

### Data
- All synthetic: SAMPLE_RESPONSE constant
- Explicitly marked as "No real backend yet"

---

## 19. Design System

**Route:** `/design-system`

Full design token documentation and component gallery.

### Features

| Feature | Description |
|---|---|
| **3 surface token panels** | Surfaces (5 steps from page plane to recessed well), Ink and lines (3 text weights, 2 border strengths), Semantic colour (accent, gate, good, warn, serious, critical) |
| **Token swatches** | Color swatches with CSS variable name and role description |
| **6-series categorical palette** | --vm-s1 through --vm-s6 with hex values and assigned roles; validator results table (lightness band, chroma floor, CVD separation, normal-vision floor, contrast against surface — all PASS in both dark and light modes) |
| **Value ramps** | Sequential ramp (one hue, for magnitude) and diverging ramp (two hues with neutral midpoint, for polarity) with visual displays |
| **Typography specimens** | Space Grotesk (display/headings), IBM Plex Sans (body), IBM Plex Mono (numbers/formulas) with role descriptions |
| **Motion tokens** | Fast 120ms, Default 220ms, Entrance 420ms, easing cubic-bezier(.16,1,.3,1), reduced-motion fallback |
| **Radius system** | Panel 14px, Control 10px, Chip full — with visual samples |
| **Component gallery** | Live interactive examples of: Buttons (primary/secondary/ghost/disabled), Badges (5 tones), StatusChips (4 states), SegmentedControl, Select, Toggle, Slider, Meter, StatTile (with spark), Callouts (accent, gate), ChartSkeleton, EmptyState |
| **Mode toggle** | Currently rendering in dark/light mode badge |

### Data
- No data — pure token documentation
- Uses `useTheme()` hook for current mode display
- Uses `seriesScale()`, `sequentialScale()`, `divergingScale()` from design system

---

## Route Summary

| Route | Page Component | Data Source |
|---|---|---|
| `/` | DashboardPage | DEMO_DATE, LiveFeed simulation |
| `/overview` | OverviewPage | generate.ts (deterministic) |
| `/heatmap` | HeatmapPage | generate.ts + reference.ts |
| `/elasticity` | ElasticityPage | generate.ts + liveFareLadder + liveCabinCompare |
| `/cross-check` | CrossCheckPage | liveFareLadder + crossCheck |
| `/quotes` | QuotesPage | generate.ts + reference.ts |
| `/forecast` | ForecastPage | Own synthetic (sin-wave + Math.random) |
| `/backtest` | BacktestPage | generate.ts |
| `/compliance` | CompliancePage | generate.ts + reference.ts |
| `/health` | HealthPage | generate.ts + liveFareLadder + liveCabinCompare |
| `/reports` | ReportsPage | Own synthetic constants |
| `/scraper-arch` | ScraperArchPage | Own synthetic constants |
| `/scraper-config` | ScraperConfigPage | reference.ts + local state |
| `/decomposition` | DecompositionPage | generate.ts + reference.ts |
| `/methodology` | MethodologyPage | generate.ts + reference.ts |
| `/anomaly` | AnomalyPage | Own synthetic constants (hardcoded) |
| `/api` | ApiPage | generate.ts |
| `/api/playground` | ApiPlaygroundPage | Own synthetic constant (no backend) |
| `/design-system` | DesignSystemPage | No data (token docs) |

## Shared Components Used Across Pages

| Component | Purpose |
|---|---|
| `PageHeader` | Kicker, title, lede, actions |
| `Panel` | Bordered content container with icon, title, meta, footnote, bleed |
| `StatTile` | KPI card with value, delta, sparkline, icon, tone |
| `Callout` | Themed callout box (accent, good, warn, critical, gate, neutral) |
| `Badge` | Status/type badge with optional icon and tone |
| `DataTable` | Sortable/filterable data table |
| `MultiLine` | Multi-series line chart |
| `IndexBandChart` | Line chart with confidence band |
| `ScatterFit` | Scatter plot with least-squares fit line |
| `RankedBars` | Horizontal bar chart |
| `DivergingBars` | Diverging bar chart (positive/negative) |
| `Donut` | Donut/ring chart |
| `StackedArea` | Stacked area chart with percent mode |
| `Heatmap` | Grid heatmap with color scaling |
| `Legend` | Chart legend with color swatches |
| `Meter` | Progress bar with optional threshold marker |
| `Slider` | Range slider with readout |
| `SegmentedControl` | Segmented button group |
| `Toggle` | On/off toggle switch |
| `Select` | Dropdown selector |
| `KeyValue` | Key-value row list |
| `Formula` | LaTeX formula display |
| `StatusChip` | Publication status chip (PROVISIONAL/REVISED/FROZEN/SUPPRESSED) |
| `ChartSkeleton` | Loading skeleton for charts |
| `EmptyState` | Empty/filtered state display |
| `useChartTokens` | Hook for chart color tokens |
| `useCountUp` | Animated number counter |
| `useTheme` | Current theme mode (dark/light) |
| `useRelativeTime` | "Refreshed X ago" time formatter |
