# VIMAAN — Page-by-Page Feature Map

> Airfare Price Index for India · APIx · MoSPI PS 26056
> 17 screens · last updated 2026-09-14

---

## 1. Overview (`/`)

**Purpose:** The landing page. One-number headline for the APIx with a full 90-day published series.

**Features:**
- **Hero stat tile** — animated count-up of the current APIx value (rebased 2024 = 100), daily delta, 95% bootstrap band range, 30-day movement, base-fare index, band half-width.
- **Publication status strip** — 30 miniature squares showing PROVISIONAL / REVISED / SUPPRESSED status per night.
- **Seven stat tiles** — Quotes in the cleaned panel, panel coverage, elementary cells count, base-fare index, back-test correlation, suppressed days, 30-day summary.
- **Published series chart** — Multi-line / IndexBandChart with toggleable confidence band and event markers. Segmented control for Daily / Weekly / Monthly frequency and Total / Base fare measure.
- **Diverging bars** — "What moved the index today" showing weighted stratum contributions in index points.
- **Donut + legend** — Carrier mix of the cleaned panel (share by marketing carrier).
- **Publication gate meter** — 70% coverage threshold with status.
- **Annotated events grid** — Cost, capacity, and other events with labels, dates, lift percentages, and explanatory notes.
- **Callout** — Distinguishes offer prices from transaction prices.

---

## 2. Heatmap (`/heatmap`)

**Purpose:** Week-on-week fare change for every sector × lead-time cell in the panel.

**Features:**
- **Four stat tiles** — Hottest cell, coolest cell, total cells painted, cells needing imputation.
- **Sortable heatmap grid** — 20 sectors × 5 lead windows (T+1, T+15, T+22, T+30, T+45). Sort by weight, largest move, or A→Z. Colour encodes week-on-week percentage change (diverging scale).
- **Drill-down panel** — Clicking any cell reveals: week-on-week %, imputed/clean badge, quote count, mean fare now vs. 7 days ago, Jevons price relative, sector weight, carrier count, sub-cells rolled up, and a per-carrier list with quote counts.
- **Ranked bars** — "Where the week's pressure sits": mean week-on-week change by booking window across all sectors.
- **Biggest movers list** — Top 8 cells by absolute change, each clickable to drill in.
- **Colour legend** — Cool arm (fares fell), neutral, warm arm (fares rose).
- **Callout** — Explains the cell-vs-cell comparison rationale.

---

## 3. Elasticity (`/elasticity`)

**Purpose:** Fare-as-a-function-of-days-to-departure (the booking curve), and how manual monthly collection misses it.

**Features:**
- **Four stat tiles** — 45-day-out fare, T+1 (tomorrow) fare, spread ratio (T+1 / T+45), "1 of 5 windows seen by manual collector".
- **Live fare ladder panel** — The same non-stop IndiGo flight (DEL-BLR), priced at each of the five collection windows. Shows departure date, airline, flight number, fare, and a "Verify" link opening the live search.
- **Live cabin comparison panel** — Cheapest fare per cabin class (Economy, Business, First) on the same route/date from Cleartrip, with bar chart and verify links.
- **Multi-line chart** — Fare against days-to-departure. Primary and secondary sectors overlay. Log or linear Y scale. Dots mark the five collection windows. Toggle overlay.
- **Bucket comparison** — DataTable comparing primary and secondary sectors at each lead window, with gap and ratio-to-T+45.
- **Collection method contrast** — Side-by-side: "Manual monthly: one observation" vs. "VIMAAN nightly: five windows" with progress bars.
- **Segmented controls** — Y-axis scale (log/linear), frequency, measure.
- **Select dropdowns** — Primary sector, overlay sector.
- **Toggle** — Compare a second sector.

---

## 4. Cross-Check (`/cross-check`)

**Purpose:** One real flight, priced across every aggregator — a quick sanity check that the index number sits where the market actually is.

**Features:**
- **Flight detail panel** — Airline, flight number, departure date/time, arrival time, non-stop badge, and the reference fare. Live refresh timestamp.
- **Segmented control** — Select departure window (T+1 through T+45) to re-anchor the search.
- **Cross-check DataTable** — Sorted cheapest first: aggregator name, fare shown, "Open" link to that site's search.
- **Ranked bars** — Same data as the table, visualised as horizontal bars.
- **Callout** — Reminds that fares fluctuate between page load and checkout.

---

## 5. Decomposition (`/decomposition`)

**Purpose:** Every quote split four ways (base fare, taxes, UDF, convenience charge) before it enters the index.

**Features:**
- **Four stat tiles** — Mean ticket (all-India), base fare share (with delta vs. start of window), levied-on-top total (with share delta), UDF per departure.
- **Segmented control** — Rupees or Share of ticket view.
- **Stacked area chart** — Four components stacked over the 90-day window. Toggle between absolute rupees and 100% share. Sparkline on the mean ticket tile.
- **Sector composition list** — Top 12 sectors, each with a stacked bar showing the four-way split, total fare, origin/destination.
- **Who charges what panel** — Horizontal stacked bar for the latest day's composition, plus four annotated cards explaining who sets each component (airline / statutory / airport / booking channel) and what moves it.
- **Callout** — Why the headline tracks total fare (CPI logic).

---

## 6. Methodology (`/methodology`)

**Purpose:** The formula choice, outlier fence, imputation strategy, and weights — all interactive and live-recomputed.

**Features:**
- **Four stat tiles** — Published index (Jevons), same quotes under Carli (with bias delta), time-reversal test result for Jevons, time-reversal test result for Carli.
- **Three-formula MultiLine chart** — Jevons, Dutot, Carli all from the same panel. Toggle all three or single. Formula display cards with LaTeX and explanatory notes.
- **Time-reversal test** — Forward × backward = 1? Shows Jevons passes, Dutot passes, Carli fails. Displays the actual price relatives used.
- **Tukey fence sensitivity slider** — Adjust k from 1 to 5. Live readout of: quotes edited, index level, effect vs. published level, Independence Day surge survival check, percentage of panel edited with a Meter.
- **Imputation panel** — Cell-mean imputation vs. naive carry-forward (toggle overlay). Shows drift between the two over 90 days.
- **Formula display** — LaTeX-rendered formula for cell-mean imputation of the relative.
- **Weights panel** — Five sliders for lead-time booking share (T+1 through T+45). Live recomputation of resulting stratum weights for top three sectors.
- **Callout** — Young / modified-Laspeyres aggregation formula at the stratum level.

---

## 7. Backtest (`/backtest`)

**Purpose:** Validation metrics and plots demonstrating the index holds up against external references.

**Features:**
- **Five stat tiles** — Correlation (levels, ρ), correlation (log differences, ρ), RMSE in index points, MAPE, directional agreement (fraction of days moving the same way).
- **Multi-line chart** — APIx vs. DGCA tariff reference, both indexed to 100 at the start of the window.
- **ScatterFit** — Reference vs. APIx with least-squares fit line.
- **IndexBandChart** — Recovery of a known inflation path: compiled index with 95% bootstrap band, and the injected true path as a dashed reference line.
- **CPI comparison DataTable** — Reference date, APIx value, CPI air-fare item, gap (with colour coding).
- **Residual gap panel** — KeyValue summary: RMSE, largest single-day gap, days APIx higher, days APIx lower. Callout about offer prices vs. transaction prices.

---

## 8. Compliance (`/compliance`)

**Purpose:** The compliance gate — every outbound request is routed through this logic.

**Features:**
- **Compliance badge** — COLLECTION_ENABLED = false (off in this build).
- **Callout** — "Read the posture column carefully": all real sources are pending review; only one illustrative row has a recorded verdict.
- **Four stat tiles** — Sources in registry, postures pending review, requests throttled, kill-switches tripped.
- **Source registry DataTable** — 12+ sources with: label, kind, robots.txt posture (badge), terms posture (badge), access route, nightly cap. Clickable rows with activeKey highlighting.
- **Source detail panel** — Dynamic: shows illustrative source (demoted from Scrapy → Amadeus) or pending-review source. Includes KeyValue rows, robots.txt cache view, request-vs-cap meter.
- **Ten standing rules** — Grid layout: robots.txt, crawl-delay, rate limit, identifiable requests, no login, no personal data, exponential backoff, kill-switch, one fetch per cell, anti-bot measures not defeated.
- **Request audit log DataTable** — Timestamp, source, path, HTTP status (badge), latency, robots allowed (badge), throttled (badge). Export CSV button.

---

## 9. Health (`/health`)

**Purpose:** Whether tonight's panel was good enough to publish, and why coverage moved.

**Features:**
- **Badge** — Tonight cleared the gate at X%.
- **Live scrape log** — Every real Cleartrip / cabin / ladder request this build made, most recent first, with age, fare, and verify link.
- **Five stat tiles** — Coverage tonight (with sparkline), quotes collected, mean yield, worst p95 latency, mean block rate.
- **Coverage chart** — Nightly coverage % over the 90-day window, with 70% publication gate horizontal line.
- **Per-source health DataTable** — Six sources: yield % with meter, quotes/expected, block rate badge, p95 latency, kill-switch badge.
- **Last night's run** — Seven-stage timeline with duration bars, status badges, and detail text.
- **Cleaning funnel** — Six stages from raw payloads to index quotes, with keep/remove counts and progress bars.
- **Panel quality panel** — KeyValue summary: raw quotes, quotes reaching index, survival rate, imputed share, winsorised quotes, nights suppressed. Callout about winsorisation.

---

## 10. Quotes (`/quotes`)

**Purpose:** The cleaned panel, row by row. Every quote is inspectable.

**Features:**
- **Four stat tiles** — Rows matching filters, mean total fare, imputed rows count, sold-out observations count.
- **Multi-filter panel** — Sector (Select), Carrier (Select), Lead window (Select), Source (Select), Flight/sector search (text input), Imputed-only toggle, Sold-out-only toggle. Clear filters button.
- **DataTable** — All filtered quotes with columns: captured time, sector, flight number, lead window, weekday band, source, base fare, taxes, UDF, convenience charge, total fare, flags (imputed / winsorised / sold out / clean badges). Max height 520px. Export CSV button.
- **Callout** — This is a sample (X rows) of the full panel, not all of it.

---

## 11. Anomaly (`/anomaly`)

**Purpose:** AI ensemble model detecting unusual fare movements worth a human look.

**Features:**
- **Four stat tiles** — Anomalies detected today (3), model accuracy 94.2%, false positive rate 5.8%, average detection lag 2.4 h.
- **Active alerts** — Five alerts with severity badges (CRITICAL/WARN/INFO), sector, lead window, description, confidence %, cause, status badge, detection timestamp. Critical alerts highlighted in red.
- **Model performance DataTable** — Isolation Forest, Statistical Fence, Pattern Match, Ensemble: precision, recall, F1, latency ms, status.
- **Detection rules engine** — Five rules: single-sector jump, cross-sector correlation break, fare reversal, CAPTCHA/block pattern, lead-time curve distortion. Each with threshold, sensitivity, last triggered, auto-action.
- **Anomaly score timeline** — 30-day MultiLine chart with WARN (0.45) and CRITICAL (0.70) threshold lines.
- **Callout** — All figures are simulated for demonstration; production design described.

---

## 12. API (`/api`)

**Purpose:** The publication surface — OpenAPI and SDMX-JSON feeds for NSO/RBI consumers.

**Features:**
- **Four stat tiles** — Endpoints published (18), series points available (daily + weekly + monthly counts), latest published value, revision horizon (T+30).
- **Endpoint catalogue** — Six groups (Index, Quotes and sectors, Validation and health, Compliance, Statistical exchange, Administration). Each endpoint shows method badge (GET green / POST amber), path, note, admin badge where applicable.
- **SDMX-JSON viewer** — Live-generated SDMX-JSON payload for the last 6 observations. Switchable frequency (Daily/Weekly/Monthly). Copy and Download buttons. Pre-formatted code block.
- **Publication lifecycle** — Three stages: PROVISIONAL (on the morning after), REVISED (T+7), FROZEN (T+30). Plus a 28-day status strip (colour-coded squares).
- **Consuming the feed** — Curl examples for the daily series and SDMX endpoint. Callout about MoSPI eSankhyiki alignment.

---

## 13. Forecast (`/forecast`)

**Purpose:** 14-day and 30-day fare forecasts using LSTM + Seasonal ARIMA ensemble.

**Features:**
- **Four stat tiles** — 14-day forecast value (+2.3 pts), 30-day forecast value (+6.6 pts), model type (LSTM + Seasonal ARIMA), forecast accuracy / MAPE 3.2%.
- **APIx forecast chart** — 60-day history with 14-day and 30-day ahead projections. Confidence bands widen with horizon. Dashed forecast lines. Dots at T+14 and T+30 forecast points. Legend with band labels.
- **Sector-level 30-day forecast DataTable** — Top 8 sectors: current fare, 7-day forecast, 14-day forecast, 30-day forecast, trend badge (Rising/Falling/Stable), confidence badge (high/medium/low).
- **Festival and event impact** — Three event cards (Diwali, Winter peak, Summer holidays): expected surge %, affected sectors, confidence, description.
- **Model architecture panel** — Visual LSTM layer diagram (Input → LSTM×2 → Dropout → Dense → Output). Seasonal ARIMA params. Ensemble weighting note (0.65 LSTM + 0.35 ARIMA).
- **Features and training panel** — KeyValue rows: training window, lead-time features, day-of-week, carrier encoding, sector encoding, seasonality, fuel price, festival proximity, retraining frequency, validation split.
- **Model info panel** — Key formula code block, six-step data flow, back-test note.

---

## 14. Reports (`/reports`)

**Purpose:** Automated report generation, distribution, and download.

**Features:**
- **Four stat tiles** — Reports generated (270 in 90 days), report templates (6), auto-distribution list (12), average generation time (3.2 s).
- **Report templates grid** — Six cards: Daily Brief, Weekly Summary, Monthly Release, Sector Deep-dive, Anomaly Alert, Compliance Report. Each with page count badge, formats (PDF/HTML/CSV/JSON), audience, generation time.
- **Latest daily brief preview** — Fake PDF layout with: VIMAAN header, APIx value, change, 95% CI, coverage, band width, previous value, top 3 gainers/losers, methodology note, data quality indicators. Download PDF button.
- **Report generation queue DataTable** — Eight entries: report type, generated time, format, size, status badge (Completed/Generating/Queued), Download button for completed.
- **Auto-distribution channels** — Six channels (eSankhyiki, RBI Data Warehouse, DGCA bulletin, data.gov.in, Email digest, SDMX endpoint) with frequency and active status.
- **Sample report downloads** — Six buttons: Daily Brief, Weekly Summary, Monthly Release, Data as CSV, SDMX-JSON, OpenAPI Spec. All trigger real file downloads.
- **Callout** — PDF/A-2b, SDMX 2.1, UTF-8 BOM, digital signature.

---

## 15. Scraper (`/scraper`)

**Purpose:** Collection engine architecture, collector status, scraping technologies, and nightly pipeline.

**Features:**
- **Four stat tiles** — Sources configured (14), active collectors (6), nightly quote target (1,440), average collection time (47 min).
- **Seven-layer architecture diagram** — Sources → Collectors → Compliance gate → Processing pipeline → Cleaning → Storage → Index engine. Each layer is a labelled chip panel with an arrow to the next.
- **Collector status DataTable** — Nine collectors (IndiGo, Air India, SpiceJet, Cleartrip, MakeMyTrip, Yatra, Amadeus, Duffel, DGCA Feed): type badge, status badge, last run time, quotes, success rate, avg latency, notes.
- **Scraping technologies** — Four tech cards: Playwright, Scrapy, Puppeteer (backup), Requests+BeautifulSoup.
- **Infrastructure** — Five cards: PostgreSQL, Redis, Celery+Redis, Prometheus+Grafana, Docker Compose.
- **Nightly run pipeline** — Ten stages in a vertical timeline (22:00 → 23:00 IST): pre-flight checks, Playwright launch, Scrapy start, API connectors, raw data lands, compliance audit, cleaning, index computation, publication gate, publish. Each with duration bar.
- **Anti-bot and ethical measures** — Ten rules in a two-column grid: robots.txt, crawl-delay, rate limiting, user-agent, no CAPTCHA solving, exponential backoff, kill-switch, IP rotation (planned), session management, DPDP Act 2023.

---

## 16. Scraper Config (`/scraper-config`)

**Purpose:** Interactive console for tuning the collection pipeline without touching code.

**Features:**
- **Demo mode callout** — Controls wired to local state for the live demo.
- **Five stat tiles** — Active sources count, global rate limit, concurrent browsers, request timeout, publication gate.
- **Global settings panel** — Collection ON/OFF toggle, global rate limit slider, max concurrent browsers slider, request timeout slider, retry attempts slider, backoff base slider, collection window start/end time inputs, coverage publication gate slider. Export config button.
- **Per-source configuration DataTable** — All sources with: enabled toggle, rate/min, nightly cap, crawl delay, timeout, retries, kill-switch badge.
- **Scheduled jobs grid** — Six cron entries: Daily collection (22:00), Weekly aggregation (06:00 Mon), Monthly release (08:00 5th), Backtest run (04:00), Report generation (23:30), Data purge (02:00 Sun).
- **Configuration audit log DataTable** — Six entries with timestamp, changed by, parameter, old → new value, reason. Export CSV button.
- **Emergency controls** — Four action buttons: Pause all collection, Resume all collection, Trigger manual run, Purge and reseed (with two-click confirmation and warning callout).

---

## 17. Design System (`/design-system`)

**Purpose:** One token set, two authored modes, six validated series colours. The visual system documentation.

**Features:**
- **Mode badge** — Currently rendering in dark/light mode.
- **Three token panels** — Surfaces (5 CSS variables, page plane to recessed well), Ink and lines (5 variables, text weights to border strengths), Semantic colour (6 variables: accent, gate, good, warn, serious, critical).
- **Categorical series palette** — Six colour swatches (--vm-s1 through --vm-s6) with role descriptions. Validator results table: lightness band, chroma floor, CVD separation, normal-vision floor, contrast against surface — all PASS for both dark and light modes.
- **Value ramps** — Sequential ramp (one hue) and diverging ramp (two hues with neutral midpoint) displayed as horizontal bar charts.
- **Type and rhythm** — Three font families: Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (numbers/formulas). Radius system (panels 14px, controls 10px, chips full). Motion tokens (fast 120ms, default 220ms, entrance 420ms, easing curve).
- **Component gallery** — All primitive components in their real states: Buttons (primary, secondary, ghost, disabled), Badges (all five tones + status chips), SegmentedControl, Select, Toggle, Slider, Meter, StatTile (with spark and delta), Callouts, ChartSkeleton, EmptyState.
- **Rules panel** — Five design rules (one accent, colour follows entity, never two vertical scales, legend for multi-series, both modes authored).
- **How to extend it** — Formula showing how to add a new token in both mode blocks. Callout about running the validator before adding a seventh series colour.

---

## Navigation Structure (from AppShell)

The sidebar groups pages into four sections:

| Section | Pages |
|---|---|
| **Index** | Overview, Heatmap, Elasticity, Cross-check, Decomposition |
| **Validation** | Methodology, Back-test, Compliance, Health |
| **Tools** | Quotes, Anomaly, API, Forecast |
| **System** | Design system, Scraper, Reports, Scraper config |

The header bar includes: page title, reference date ticker, live APIx with delta, "Live data" badge, export-series button, and theme toggle (dark/light).
