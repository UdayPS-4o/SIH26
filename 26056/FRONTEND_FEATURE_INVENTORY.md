# VIMAAN – Page-by-Page Feature Inventory

_Generated from the working frontend (React + TypeScript + Vite, route at `/` through `/scraper-config`)._

---

## 1. Overview (`/`)

**Purpose:** The published APIx index — its current value, trend, panel health, and what moved it today.

**Features present:**
- **Hero panel** – Animated APIx headline number (total-fare index, base = 2024 = 100), day-on-day delta badge, 95% bootstrap confidence band (low–high), 30-day movement spark-line, base-fare index, wedge (total − base), mean band half-width.
- **Publication status strip** – Last 30 nights shown as colour-coded squares (Provisional / Revised / Suppressed) with a legend.
- **Six KPI stat tiles** – Quotes in cleaned panel, panel coverage % (with 70% gate indicator), elementary cells count, base-fare index, back-test correlation (ρ), days suppressed.
- **30-day spark tiles** – APIx last 30 days and base-fare index last 30 days, each with spark-line and 30-day % delta.
- **Published series chart** – `IndexBandChart` with configurable frequency (Daily / Weekly / Monthly), measure toggle (total fare / base fare), confidence band on/off, event markers on/off, all driven by a single data slice.
- **What moved the index today** – `DivergingBars` showing the top 6 and bottom 4 weighted stratum contributions (in index points) to the daily change, keyed by sector.
- **Carrier mix donut** – Share of the cleaned panel by marketing carrier (6 carriers), with a legend and count.
- **Publication gate meter** – Coverage tonight vs the 70% threshold, with a Callout explaining the honesty rationale (two suppressed days visible as breaks, not smoothed).
- **Annotated events section** – Four event cards (cost / capacity / conflict kinds) with dates, lift %, and notes.
- **Honesty disclaimer** – Callout clarifying these are offer prices, not transaction prices.

---

## 2. Heatmap (`/heatmap`)

**Purpose:** Sector-by-lead-window view of where fares moved most (and least) this week.

**Features present:**
- **Four summary stat tiles** – Hottest cell (sector + lead window, +%), coolest cell, cells painted (20 × 5 = 100), cells needing imputation.
- **Main heatmap grid** – 20 sectors × 5 lead-window columns, colour = week-on-week % change (diverging scale), clickable cells to drill in.
- **Sort control** – By weight, by move (hottest first), or A–Z.
- **Drill-in panel** – Clicking a cell shows: cell % change, imputation flag, quote count, mean fare now vs 7 days ago, Jevons price relative, sector weight, carrier count, sub-cells rolled up, contributing carrier breakdown with quote counts.
- **Lead-window summary bars** – `RankedBars` of mean week-on-week change by lead window across all 20 sectors.
- **Biggest movers list** – Top 8 cells by |move|, each clickable to select in the heatmap.
- **Colour legend** – Cool / neutral / warm arms explained.
- **Callout** – Why cell-vs-cell comparison holds quality constant (same departure date, same remaining inventory, same fare bucket).

---

## 3. Lead-time Elasticity (`/elasticity`)

**Purpose:** Show that the same seat is priced differently depending on how far in advance you book, and compare that against what a manual monthly collector sees.

**Features present:**
- **Live fare ladder** – Six rungs (T+0 / +1 / +7 / +15 / +30 / +45) for one non-stop flight (IndiGo 6E-6744 IDR→BLR), each showing price, airline, flight number, departure date, stops, a "Verify" link opening the live Cleartrip search, and a "Refreshed X ago" live badge.
- **Four KPI tiles** – 45-day-out fare, next-day fare, spread ratio (T+1 ÷ T+45), and a "points a monthly collector sees = 1 of 5" tile.
- **Live cabin comparison** – `RankedBars` + card grid showing cheapest fare per cabin (Economy, Premium Economy, Business) for the same route/date, each with a Verify link and live badge.
- **Fare curve chart** – `MultiLine` for a configurable primary sector with optional secondary overlay, log or linear Y scale, marked dots at the five collection windows, tooltips showing booking date.
- **Collection-method comparison** – Side-by-side panel showing what a manual monthly collector sees (one point) vs VIMAAN nightly (all five windows with mini progress bars).
- **Bucket comparison table** – `DataTable` of primary vs secondary sector fares at each lead window, with gap and ratio columns.
- **Callout** – Why the index is built on cells (mix of booking windows changes the sample average).

---

## 4. Cross-check (`/cross-check`)

**Purpose:** Verify one flight's fare across every aggregator for a sanity check.

**Features present:**
- **Flight header** – Flight number, route, date/time, departure window, live badge.
- **Aggregator table** – Sorted cheapest first, columns: rank, aggregator name, fare shown, "Open" link (external). 8 aggregators.
- **Ranked bar chart** – Same data visualised as bars, cheapest to most expensive.
- **Lead-window selector** – Segmented control to switch between T+0 / +1 / +7 / +15 / +30 / +45 departure windows.
- **Callout** – Disclaimer that fares change between looking and booking.

---

## 5. Decomposition (`/decomposition`)

**Purpose:** Split every quote four ways (base fare, taxes, UDF, convenience charge) and show how each component moves.

**Features present:**
- **Four KPI tiles** – Mean ticket (all-India), base-fare share, levied-on-top (taxes + UDF + convenience) with delta, UDF per departure.
- **Stacked area chart** – Time series of the four components, switchable between rupees and % share (100% stacked).
- **Composition by sector** – Top 12 sectors with mini horizontal stacked bars showing base / taxes / UDF / convenience split.
- **Who charges what** – Legend + proportional bar + four explainer cards for each component (who sets it, why it moves, share of ticket).
- **Callout** – Why the headline tracks total fare (CPI measures what households spend).

---

## 6. Methodology (`/methodology`)

**Purpose:** Make every methodological choice visible, tunable, and recomputed live from the same panel.

**Features present:**
- **Four KPI tiles** – Published index (Jevons), same quotes under Carli with upward-bias delta, time-reversal test pass/fail for Jevons and Carli.
- **Three-formula chart** – `MultiLine` showing Jevons (published), Dutot (diagnostic), Carli (diagnostic) from the same quotes; toggle to show all three or one at a time.
- **Formula display** – Each formula rendered with a caption explaining why Jevons was chosen (standard for volatile substitutable items, unit elasticity of substitution).
- **Time-reversal test panel** – Forward × backward = 1 test results for all three formulas, with pass/fail badges and the raw price relatives shown.
- **Tukey fence sensitivity slider** – Adjust k from 1 to 5, see quotes edited, resulting index level, and whether the Independence Day surge survives. Meter showing share of panel edited vs 2% warning threshold. Callout on the calibrated fence value.
- **Imputation method comparison** – `MultiLine` comparing cell-mean imputation (used) vs naive carry-forward (contrast only). Toggle to overlay carry-forward. Formula displayed. Callout showing the drift when carry-forward is used.
- **Weights editor** – Five sliders for lead-time booking shares (T+0 through T+45), editable in real time, with resulting stratum weights shown for top 3 sectors. Footnote explaining DGCA data loading.
- **Callout** – Aggregation formula (Laspeyres form) with chain-linking and rebasing note.

---

## 7. Back-test (`/backtest`)

**Purpose:** Validate the index against a reference series and a known synthetic path.

**Features present:**
- **Five KPI tiles** – Correlation (levels, ρ), correlation (log differences, ρ), RMSE (index points), MAPE (%), directional agreement (days / total, %).
- **APIx vs reference chart** – `MultiLine` of APIx and DGCA tariff reference, both indexed to 100 at window start.
- **Scatter plot with fit** – `ScatterFit` showing reference vs APIx paired daily observations with least-squares fit line.
- **Recovery test chart** – `IndexBandChart` with injected true path (dashed) inside the bootstrap band; footnoted with days inside band count.
- **CPI comparison table** – `DataTable` of APIx vs CPI air-fare item by date, with gap column and colour coding.
- **Residual gap panel** – `KeyValue` of RMSE, largest single-day gap, days APIx higher, days APIx lower, with a Callout about offer vs transaction prices.

---

## 8. Compliance (`/compliance`)

**Purpose:** Show the compliance gate as a live, auditable screen.

**Features present:**
- **Four KPI tiles** – Sources in registry (with breakdown by kind), postures pending review, throttled requests, kill-switches tripped.
- **Source registry table** – Full routing table with columns: source name, kind, robots.txt posture badge, terms posture badge, route label, nightly cap. Clickable rows.
- **Source detail panel** – Per-source: route, rate limit, nightly cap, robots.txt cache state, kill-switch, coverage meter (simulated). For illustrative source: shows robots.txt verbatim, demote path (Scrapy → Amadeus Self-Service), zero requests issued.
- **Ten standing rules** – Grid of compliance rules (robots.txt, crawl-delay, rate limit, identifiable UA, no login, no personal data, backoff, kill-switch, one fetch per cell, anti-bot demotion) each with rule name and enforcement description.
- **Request audit log** – `DataTable` with timestamp, source, path, HTTP status, latency, robots allowed, throttled. Export CSV button.
- **Legal position panel** – DPDP Act 2023 not engaged, unsettled Indian law on scraping, production design assumes statutory feed.
- **What this system does not do** – CAPTCHA solving, residential proxies, spoofed fingerprints, login reads, personal data collection.

---

## 9. Health (`/health`)

**Purpose:** Operational health — whether tonight's panel was good enough to publish.

**Features present:**
- **Live scrape log** – Every actual Cleartrip request (fare ladder rungs + cabin compare runs), most recent first, with price, relative timestamp ("Refreshed X ago"), and Verify link.
- **Five KPI tiles** – Coverage tonight (with spark-line), quotes collected, mean yield, worst p95 latency, mean block rate.
- **Coverage chart** – `MultiLine` of nightly coverage % with 70% publication gate horizontal line.
- **Per-source health table** – 6 sources with yield bar (meter), block rate badge, p95 latency, kill-switch state.
- **Last night's run** – 7-stage pipeline timeline with duration meters, status badges, and detail text.
- **Cleaning funnel** – 5 stages (raw → deduped → validated → cleaned → indexed) with keep counts, removal badges, progress bars, and stage descriptions.
- **Panel quality at a glance** – `KeyValue` of raw quotes, cleaned quotes, survival rate, imputed share, winsorised quotes, nights suppressed. Callout on winsorisation.

---

## 10. Quotes (`/quotes`)

**Purpose:** The cleaned panel, row by row, with full filter and export.

**Features present:**
- **Four KPI tiles** – Rows matching, mean total fare, imputed rows, sold-out observations.
- **Filter bar** – Selects for sector (20), carrier (15), lead window (5), source (10), text search by flight number/sector, toggles for imputed-only and sold-out-only. Clear-filters button.
- **Data table** – 14 columns: captured time, sector, flight, lead window (chip), band, source, base fare, taxes, UDF, convenience charge, total fare, flags (imputed / winsorised / sold-out / clean). Export CSV button with dynamic row count.
- **Callout** – This is a sample slice; full window holds 2,700+ quotes.

---

## 11. Anomaly (`/anomaly`)

**Purpose:** AI/ML anomaly detection on the fare panel.

**Features present:**
- **Four KPI tiles** – Anomalies detected today (3), model accuracy / backtested F1 (94.2%), false positive rate (5.8%), average detection lag (2.4h).
- **Active alerts panel** – 5 alerts with severity badges (CRITICAL/WARN/INFO), sector, lead window, description, confidence %, cause label, status badge (Open/Investigating/Resolved), detection timestamp.
- **Model performance table** – 4 models (Isolation Forest, Statistical Fence, Pattern Match, Ensemble) with precision, recall, F1, latency, status.
- **Detection rules engine** – 5 rules with threshold, sensitivity, last triggered, auto-action description.
- **Anomaly score timeline** – `MultiLine` of 30-day anomaly score with WARN (0.45) and CRITICAL (0.70) threshold lines.
- **Callout** – Simulated for demo; production design described.

---

## 12. API / Publication Surface (`/api`)

**Purpose:** Show the machine-readable surfaces (OpenAPI + SDMX) and the endpoint catalogue.

**Features present:**
- **Four KPI tiles** – Endpoints published (23), series points available, latest published value, revision horizon (T+30).
- **Endpoint catalogue** – 6 groups (Index, Quotes & sectors, Validation & health, Compliance, Statistical exchange, Administration) with method badges (GET/POST), paths, notes, admin badges.
- **SDMX-JSON viewer** – Live-generated SDMX 2.1 payload with frequency selector (Daily / Weekly / Monthly), Copy to clipboard, Download JSON. Shows structure, observation attributes (status), and dataSets.
- **Publication lifecycle** – Three-step visual (PROVISIONAL → REVISED at T+7 → FROZEN at T+30) with colour-coded badges.
- **28-day status strip** – Colour squares per day showing Provisional / Revised / Frozen / Suppressed.
- **Consuming the feed** – Code snippet showing curl commands, plus Callout about MoSPI eSankhyiki alignment.

---

## 13. Forecast (`/forecast`)

**Purpose:** 14-day and 30-day fare forecasting with sector breakdown and festival impact.

**Features present:**
- **Four KPI tiles** – 14-day forecast index, 30-day forecast index, model type (LSTM + Seasonal ARIMA ensemble), forecast accuracy MAPE (3.2%).
- **APIx forecast chart** – `MultiLine` with 60-day historical actuals, 14-day forecast (dashed), 30-day forecast (dashed), confidence bands widening with horizon, forecast dots at day 14 and 30, festival annotation (Diwali).
- **Sector forecast table** – 8 sectors with current fare, 7/14/30-day forecasts, trend badge, confidence badge.
- **Festival impact cards** – 3 events (Diwali, Winter peak, Summer holidays) with date range, expected surge %, affected sectors (chips), confidence, description.

---

## 14. Design System (`/design-system`)

**Purpose:** Token reference and component gallery for the VIMAAN design system.

**Features present:**
- **Surface tokens** – 5 levels (bg → inset) shown as swatches with roles.
- **Ink tokens** – 3 text weights + 2 border strengths.
- **Semantic tokens** – Accent, gate, good, warn, serious, critical with roles.
- **Categorical palette** – 6 series colour slots (s1–s6) with role assignments, validator results (lightness band, chroma floor, CVD separation, normal-vision ΔE, contrast against surface) for both dark and light modes.
- **Value ramps** – Sequential (one hue) and diverging (two hues, neutral midpoint) colour ramps.
- **Type specimen** – Display (Space Grotesk), body (IBM Plex Sans), numeric/formula (IBM Plex Mono) with sample text and rhythm tokens.
- **Component gallery** – Buttons (primary/secondary/ghost/disabled), badges (5 tones), publication status chips, segmented control, select, toggle, slider, meter, stat tiles (with spark), callouts, loading skeleton, empty state.

---

## 15. Scraper Architecture (`/scraper`)

**Purpose:** Explain the collection engine and show collector status.

**Features present:**
- **Four KPI tiles** – 14 sources configured, 6 active collectors, 1,440 nightly quote target, 47 min average collection time.
- **7-layer architecture diagram** – Sources → Collectors → Compliance gate → Processing pipeline → Cleaning → Storage → Index engine, each with nodes.
- **Collector status table** – 9 collectors (IndiGo, Air India, SpiceJet, Cleartrip, MakeMyTrip, Yatra, Amadeus, Duffel, DGCA Feed) with type badge (Playwright/Scrapy/API/Feed), status, last run, quotes, success rate, avg latency, notes.
- **Scraping technologies** – Playwright 1.40+, Scrapy 2.11+, Puppeteer (backup), Requests + BeautifulSoup.
- **Infrastructure** – PostgreSQL, Redis, Celery + Redis, Prometheus + Grafana, Docker Compose.
- **Nightly pipeline timeline** – 10 stages from 22:00 pre-flight checks to 23:00 publish, each with duration, detail, and proportional duration bar.

---

## 16. Scraper Configuration (`/scraper-config`)

**Purpose:** Tune collection pipeline parameters without code.

**Features present:**
- **Five KPI tiles** – Active sources / total, rate limit, max concurrent browsers, timeout, publication gate %.
- **Global settings** – Collection ON/OFF toggle, rate limit slider (1–60 req/min), max concurrent browsers slider (1–10), request timeout slider (10–120 s), retry attempts slider (0–5), backoff base slider (1–60 s), collection window start/end time inputs, publication gate slider (50–90%). Export config button.
- **Per-source configuration table** – All sources with enable/disable toggle, rate limit, nightly cap, crawl delay, timeout, retries, kill-switch badge (ARMED / DISARMED / TRIGGERED).
- **Scheduled jobs** – 6 cron entries (daily collection 22:00, weekly aggregation Mon 06:00, monthly release 5th 08:00, backtest 04:00, report generation 23:30, data purge Sun 02:00) with schedule, description, icon, and tone.
- **Configuration audit log** – 6 entries showing who changed what, when, old value → new value, and reason.

---

## 17. Reports (`/reports`)

**Purpose:** Automated report generation and distribution.

**Features present:**
- **Four KPI tiles** – 270 reports generated (90 days), 6 report templates, 12 auto-distribution list, 3.2 s average generation time.
- **Report templates** – 6 types (Daily Brief, Weekly Summary, Monthly Release, Sector Deep-dive, Anomaly Alert, Compliance Report) with page count, formats, audience, generation time, and tone badge.
- **Latest daily brief preview** – Fake PDF layout showing APIx value, 95% CI, coverage, band width, top 3 gainers, top 3 losers, methodology note, download button.
- **Report queue table** – 8 queued/generating/completed items with type, timestamp, format, size, status badge, download button.
- **Distribution channels** – 6 channels (eSankhyiki, RBI Data Warehouse, DGCA bulletin, data.gov.in, email digest, SDMX endpoint) with frequency and status.

---

## Gaps and What's Needed to Win

### Critical gaps (missing pages / features that judges will notice)

1. **No authentication / login screen** – The system needs a login page for MoSPI / RBI analysts and admin users. Currently anyone can access every page. A `/login` route with role-based access would make this production-ready.

2. **No real authentication / role system** – There's no concept of viewer vs analyst vs admin. The admin endpoints in the API page (`POST /admin/*`) have no corresponding admin UI. A role-based admin panel is expected.

3. **No real data pipeline wired up** – The scraper runs and produces `liveFareLadder.json` and `liveCabinCompare.json`, but these feed into static mock data. The rest of the pages (overview, heatmap, etc.) use synthetic `generate.ts` data, not the live scraped data. The judges will see the live data on the elasticity page but stale synthetic data everywhere else.

4. **No backend API** – The backend folder exists but is empty (just `__init__.py`). There's no FastAPI server, no database, no actual API endpoints. Every page reads from frontend mock data.

5. **No real database** – No PostgreSQL, no Redis. The architecture page describes it but nothing connects to it.

### Important gaps (feature completeness)

6. **No data import / upload** – For a statistics office, being able to upload DGCA extracts, load new sector baskets, and update weights is essential. The methodology page has editable sliders but no persistence.

7. **No real anomaly detection model** – The anomaly page has hardcoded synthetic alerts and model metrics. No actual ML model, no training pipeline, no model registry.

8. **No real forecasting model** – The forecast page shows synthetic LSTM output. No actual model, no training, no model versioning.

9. **No user management** – No ability to create users, assign roles, manage permissions.

10. **No notification system** – The anomaly page mentions "pages an analyst immediately" but there's no actual notification mechanism (email, SMS, webhook).

### What would make this a clear winner

- **Wire the live scraper data through to all pages** – Right now only the Elasticity page shows real data. Every other page shows synthetic data. The simplest win: replace `generate.ts` mock data with a live data hook that reads from the scraper outputs or from a backend API.
- **Add a login page and role-based routing** – Even a simple demo login (admin / analyst / viewer) would make the product feel complete.
- **Show the backend working** – Even a minimal FastAPI server with the endpoints shown in the API page, backed by SQLite or even JSON files, would demonstrate the full stack.
- **Add a "live data" indicator everywhere** – The health page shows real scrape logs, but the overview and heatmap pages show synthetic data without any indicator that it's simulated.
- **Connect the compliance gate to actual scraper config** – The scraper config page has interactive sliders, but they don't control anything real.
- **Add a sector basket management screen** – Allow adding/removing sectors, updating weights, viewing DGCA traffic data. This is the core data-management task for a statistics office.
- **Add a model management / retraining screen** – Show the anomaly detection and forecasting models, their versions, training dates, and accuracy metrics. Allow triggering retraining.

### Summary

The frontend is remarkably polished — 17 pages, consistent design system, interactive charts, live data on one page. But it's a **frontend demo of a backend that doesn't exist yet**. To win, the key is to either:
1. **Show the full stack working** (backend + database + real data flowing through), or
2. **Make the frontend honest about what's live vs simulated** and add the missing production features (auth, roles, real data pipeline, model management).

The scraper already works. The single highest-leverage fix is wiring its output through the rest of the app so every page shows real scraped data instead of synthetic fixtures.
