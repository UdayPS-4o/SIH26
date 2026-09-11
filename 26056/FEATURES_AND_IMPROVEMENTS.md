# VIMAAN — Features & Improvements
**SIH PS 26056 — Real-time Airfare Price Index for India**
> Comprehensive feature inventory and improvement roadmap for Smart India Hackathon 2026 judges

---

## Section 1: Complete Feature Inventory

### 1.1 Data Collection & Scraping

**Multi-source collection architecture (planned, designed, not yet live)**
- 14 registered sources with per-source compliance posture (5 airlines, 6 OTAs, 2 licensed APIs, 1 statutory feed)
- Three collector backends by access method:
  - **Playwright collectors** — for JS-rendered single-page-application portals (5 airline portals: IndiGo, Air India, Air India Express, Akasa Air, SpiceJet)
  - **Scrapy collectors** — for structured / JSON-endpoint crawls (6 OTAs: MakeMyTrip, Yatra, EaseMyTrip, Cleartrip, ixigo, Goibibo)
  - **Licensed API connectors** — Amadeus Self-Service (Flight Offers Search) and Duffel (test mode)
  - **Bulk statutory feed** — DGCA tariff monitoring unit feed via MoU / Collection of Statistics Act 2008 channel
- **Registry** (`collectors/registry.py`) — enumerates active sources x basket; 20 sectors x 5 lead-times x 6 active sources = 600 tasks per nightly run
- **Puppeteer fallback scraper** (live, running) — `scrape-cleartrip.mjs` drives a real Chromium instance to bypass Akamai bot-manager, reads Cleartrip's internal `flight/search/v2` API response, and generates:
  - `liveFareLadder.json` — same flight (6E-6744, IDR-BLR) priced at T+0, T+1, T+7, T+15, T+30, T+45
  - `liveCabinCompare.json` — cheapest fare in Economy, Premium Economy, Business for T+15

**Compliance gate (enforced in code)**
- `robots.txt` parsing via `protego`, cached 24 hours, re-checked per source per day
- `Crawl-delay` honoured — feeds directly into the per-domain token bucket
- Rate limit: at most one request every six seconds per domain, plus nightly per-domain request cap
- Identifiable user agent with contact URL (no spoofed browser string)
- No authentication — collectors refuse login-walled routes by design
- No personal data collected — fares, schedules and tax fields only (DPDP Act 2023 not engaged)
- Exponential backoff on 429/503 (capped at 15 minutes), retry recorded in audit log
- Kill-switch — manual, plus automatic trip on three consecutive 429s from one domain (24-hour quarantine)
- One fetch per cell per night — no duplicate fetches for (source, sector, lead window, date)
- Anti-bot measures are not defeated — a block is a routing decision, not an obstacle
- Source demotion path: when a source declines automated access, it is re-routed to a licensed API, and in production to a statutory data-sharing channel

**Orchestration (planned in architecture)**
- Prefect flows: `daily_collection`, `daily_index`, `weekly_backtest`
- Celery + Redis worker fan-out for concurrent scraping
- Scheduled collection window: 03:30 IST collection, 13:00 IST index publication

---

### 1.2 Data Processing Pipeline

**Medallion storage architecture (designed, not yet deployed)**
- **Bronze** — MinIO/S3, raw HTML + JSON payloads in Parquet, partitioned by run_date
- **Silver** — TimescaleDB, `fare_quotes_raw` hypertable
- **Gold** — TimescaleDB, `fare_quotes_clean`, `elementary_index`, `apix_series`

**Cleaning pipeline (all stages implemented as fixtures, with real logic)**
- **Normaliser** (`normalizer.py`) — IATA airport/carrier codes, timezone (IST to UTC), currency (INR), cabin and fare-class mapping
- **Deduplicator** (`dedupe.py`) — Redis fingerprint on `(source, flight, dep_ts, fare_class, captured_date)`
- **Fare decomposer** (`decomposer.py`) — splits every quote into four components:
  - Base fare (airline's own price)
  - Taxes and fees (statutory levies, GST)
  - User Development Fee (UDF, per-departure airport charge)
  - Convenience charge (OTA booking channel fee)
- **Outlier removal** (`outliers.py`) — Tukey fences on log price relatives, Hidiroglou-Berthelot on skewed cells, winsorisation at 1st/99th percentile (not deletion)
- **Imputation** (`imputation.py`) — cell-mean imputation of the price relative for sold-out or missing cells (never naive carry-forward)
- **Quality contracts** (`quality.py`) — pandera schema contracts, Great Expectations suite

**Seeded fixture panel (fully built)**
- 90 days of internally consistent synthetic data (seed 26056)
- Geometric aggregation for weekly/monthly from daily (suppressed days excluded)
- Event calendar with 4 annotated events (monsoon capacity trim, ATF revision, Independence Day weekend, Onam travel peak)
- Two suppressed days in the window (coverage below 70% gate)

---

### 1.3 Index Computation

**Elementary index formula**
- **Jevons (published)** — geometric mean of within-cell price relatives: `I_c = product(p_i,t / p_i,t-1)^(1/n)`
- **Dutot (diagnostic)** — ratio of mean prices, kept as diagnostic only
- **Carli (diagnostic)** — arithmetic mean of relatives, kept as diagnostic only (fails time-reversal test)

**Stratum weighting**
- DGCA city-pair passenger traffic crossed with lead-time booking profile
- 20 sectors with individual weights derived from monthly passenger volumes (placeholders for the real DGCA extract)
- 5 lead-time booking share weights (T+1: 12%, T+7: 23%, T+15: 27%, T+30: 24%, T+45: 14%)
- Weights exposed as editable sliders on the Methodology console

**Aggregation**
- Young / modified Laspeyres form: `APIx_t / APIx_0 = sum(s) w_s * (I_s,t / I_s,0)`
- Consistent with the Laspeyres formula retained in the 2024-base CPI
- Chain-linked annually with linking factor = GM(new series, overlap year) / GM(old series, overlap year)
- Rebased to 2024 = 100

**Variance estimation**
- Block bootstrap over quotes within cell (1000 replicates)
- 95% confidence bands around every published APIx point
- Band half-width scales inversely with coverage (wider band when fewer cells filled)

**Parallel series**
- Total fare index (what the household actually pays) — the published headline
- Base fare index (the airline's own price signal) — published alongside total so cost attribution is possible

---

### 1.4 Validation & Quality

**Back-test against DGCA reference series**
- Last 30 days of paired daily observations
- Pearson correlation on levels
- Pearson correlation on log-differences (the "honest" correlation)
- RMSE in index points
- MAPE (mean absolute percentage error)
- Directional agreement (% of days where APIx and reference moved in the same direction)

**Scatter plot (APIx vs DGCA reference)**
- Least-squares fit line
- Paired observations with reference on x-axis, APIx on y-axis

**Recovery of a known inflation path**
- Synthetic panel with injected true price path
- Index compiled and checked against the known path
- Bootstrap band containment metric (what fraction of days the true path sits inside the 95% band)

**CPI comparison**
- APIx vs MoSPI CPI air-fare item (07.3.3)
- Side-by-side table with gap computation
- Data pulled nightly from eSankhyiki API and DGCA tariff-monitoring extract

**Time-reversal test**
- Compile forward (yesterday to today) and backward (today to yesterday), multiply the two
- An unbiased formula returns exactly 1.0
- Tested on all three formulas (Jevons passes, Dutot passes, Carli fails with value > 1)

**Publication gate**
- 70% cell coverage threshold for publication
- Days below threshold written as SUPPRESSED and revised at T+7
- Live gate indicator on Overview and Health pages

**Coverage tracking**
- Nightly coverage percentage (cells filled / cells expected)
- 30-day sparkline of coverage vs the 70% gate line
- Suppressed day count (2 of 90 in the current window)

**Cleaning funnel**
- Itemised 5-stage funnel: Raw landed → Normalised → Decomposed → Deduplicated → Clean (to index)
- Each stage shows count kept, count removed, and percentage of raw
- ~77% survival rate from raw to clean

**Panel quality metrics**
- Raw quotes landed count
- Quotes reaching the index count
- Survival rate (%)
- Cell-days imputed (%)
- Quotes winsorised count
- Nights suppressed count

**Outlier fence sensitivity**
- Interactive slider for Tukey fence k-parameter (1.0 to 5.0, default 3.0)
- Shows quotes edited, index level, and effect of moving the fence at each setting
- Independence Day surge survival test at each fence level

---

### 1.5 Dashboard & Visualization

#### Overview Page
- **Hero stat tile** — APIx headline index with animated count-up, daily delta, monthly delta, 95% confidence band range
- **Publication status strip** — 30-day calendar strip colour-coded by PROVISIONAL / REVISED / SUPPRESSED
- **6 KPI tiles** — Quotes in panel, Panel coverage, Elementary cells, Base-fare index, Back-test correlation, Days suppressed, 30-day sparkline
- **IndexBandChart** — published series with toggleable 95% bootstrap confidence band, event markers, frequency switch (daily/weekly/monthly), measure switch (total/base fare)
- **DivergingBars** — weighted stratum contributions to today's move (top 6 + bottom 4 sectors)
- **Donut chart** — carrier mix share of the cleaned panel (5 carriers)
- **Publication gate meter** — coverage vs 70% threshold with colour-coded status
- **Event calendar** — 4 annotated events with kind (demand/cost/capacity/ops), date range, lift percentage, and explanatory note

#### Heatmap Page
- **20x5 heatmap grid** — sector (rows) x lead window (columns), colour-coded by week-on-week % change
- **Diverging colour scale** — cool arm (fares fell) to neutral to warm arm (fares rose), with documented CVD-safe palette
- **Sort controls** — by weight, by move, or alphabetically
- **Cell drill-down panel** — click any cell to see mean fare now, mean fare 7 days ago, Jevons price relative, sector weight, carriers in cell, sub-cells rolled up
- **Contributing carriers list** — per-cell quote count per carrier
- **Hottest/coolest stat tiles** — top movers with sector and lead window
- **Cells needing imputation count** — flagged with warning badge
- **Lead-window summary ranked bars** — mean week-on-week change by booking window across all sectors
- **Biggest movers list** — top 8 cells by week-on-week change, clickable to drill in
- **Legend** — diverging scale explanation

#### Elasticity Page
- **Live fare ladder** — real Cleartrip data via Puppeteer, same flight (6E-6744 IDR-BLR) at T+0, T+1, T+7, T+15, T+30, T+45 with departure date, price, airline, flight number, stops, and "Verify" link to Cleartrip
- **Live cabin comparison** — real Cleartrip data, cheapest fare in Economy/Premium Economy/Business for T+15, ranked bars + card grid with "Verify" links
- **Fare vs days-to-departure curve** — MultiLine chart with log/linear Y scale toggle, secondary sector overlay toggle, 5 bucket markers, sector selectors (primary + overlay)
- **Manual monthly vs VIMAAN nightly comparison** — side-by-side showing what a single monthly collection sees (1 point) vs VIMAAN's 5 windows
- **Bucket comparison table** — fare at each lead window for two sectors with gap and T+45 ratio columns
- **4 KPI tiles** — booked 45 days out, booked 1 day out, spread across curve (T+1/T+45 ratio), monthly collection points seen
- **Relative timestamp badge** — "Refreshed X ago" with live ping animation

#### Cross-Check Page
- **Flight detail panel** — flight number, route, departure date/time, arrival time, non-stop status, VIMAAN price
- **Cross-check table** — same flight priced across 8 aggregators (Cleartrip, MakeMyTrip, Goibibo, Yatra, ixigo, EaseMyTrip, Google Flights, Skyscanner), sorted cheapest to most expensive, with "Open" links to each site
- **Ranked bars** — visual comparison of fares across all 8 aggregators
- **Departure window selector** — switch between T+1, T+7, T+15, T+30, T+45 lead windows
- **Multiplier-based pricing** — each aggregator shows a realistic convenience-fee spread over the Cleartrip base

#### Decomposition Page
- **4-way stacked area chart** — base fare, taxes, UDF, convenience charge stacked over time, switchable between rupees and percentage share view
- **4 KPI tiles** — mean ticket (all-India), base fare share (with start-of-window comparison), levied-on-top amount with share delta, UDF per departure
- **Sector composition list** — 12 sectors with horizontal stacked bars showing the 4-way split, sized proportionally to mean ticket
- **"Who charges what" panel** — 4 component cards with icon, amount, % of ticket, setter (airline/airport/exchequer/booking channel), and explanatory note
- **Component legend** — colour-coded to the 4 series

#### Methodology Page
- **Formula comparison chart** — Jevons, Dutot, Carli plotted simultaneously or individually, toggleable
- **Time-reversal test results** — pass/fail badges for each formula, with numeric values
- **Sample price relatives display** — the raw relatives the test ran on
- **Outlier fence sensitivity slider** — Tukey k-parameter (1.0–5.0), showing quotes edited, index level, and Independence Day surge survival at each setting
- **Imputation comparison** — cell-mean imputation vs naive carry-forward, with toggleable overlay
- **Carry-forward warning** — when overlay is on, shows drift in points below cell-mean
- **Weights editor** — 5 sliders for lead-time booking shares with real-time recomputed stratum weights for top 3 sectors
- **Formula display** — LaTeX-style formula rendering with captions for each formula

#### Back-Test Page
- **5 KPI tiles** — correlation (levels), correlation (log differences), RMSE, MAPE, directional agreement
- **MultiLine chart** — APIx vs DGCA tariff reference, both indexed to 100 at start of window
- **ScatterFit plot** — APIx vs reference with least-squares fit line, 30 paired observations
- **Recovery chart** — IndexBandChart with injected true path, bootstrap band, and compiled index overlay; containment metric
- **CPI comparison table** — APIx vs CPI air-fare item side by side with gap column
- **Residual gap panel** — RMSE, largest single-day gap, days APIx read higher, days APIx read lower
- **30-day validation window** — explicitly meets the problem statement requirement

#### Compliance Page
- **4 KPI tiles** — Sources in registry, Postures pending review, Requests throttled, Kill-switches tripped
- **Source registry table** — 14 sources with columns: source name, kind, robots.txt posture, terms posture, access route, nightly cap; clickable rows showing per-source detail panel
- **Per-source detail panel** — planned route, rate limit, nightly cap, robots.txt cache status, kill-switch state, requests vs cap meter
- **Illustrative demote path** — Portal F (synthetic) showing the full demote narrative: robots.txt Disallow → re-routed to Amadeus Self-Service → 0 requests issued
- **10 standing rules grid** — robots.txt, crawl-delay, rate limit, identifiable UA, no login, no PII, backoff, kill-switch, one-fetch-per-cell, anti-bot not defeated
- **Request audit log table** — timestamp, source, URL path, HTTP status, latency, robots allowed, throttled flag; exportable to CSV
- **Legal position panel** — DPDP Act 2023, Indian law on scraping, statutory feed assumption
- **What this system does not do** — explicit negative list (no CAPTCHAs, no proxies, no spoofed fingerprints, no login, no personal data)

#### Health Page
- **5 KPI tiles** — Coverage tonight, Quotes collected, Mean yield, Worst p95 latency, Mean block rate
- **Live scrape log** — every Puppeteer request with relative timestamp, price, and verify link
- **Coverage sparkline** — 30-day nightly coverage with 70% gate reference line
- **Per-source health table** — 6 active sources with yield meter, block rate badge, p95 latency, kill-switch state
- **Nightly run stages** — 7-stage timeline (collect, normalise, decompose, outlier, impute, QC, publish) with duration, status badge, and progress meter
- **Cleaning funnel** — 5-stage itemised funnel (raw → normalised → decomposed → deduplicated → clean) with counts, removal counts, and survival bars
- **Panel quality panel** — raw landed, reaching index, survival rate, imputed share, winsorised count, nights suppressed
- **Winsorised not deleted** callout — explaining the conservative winsorisation approach

#### Quotes Page
- **Filter bar** — sector (select), carrier (select), lead window (select), source (select), flight/sector search (text input), imputed-only toggle, sold-out-only toggle
- **Clear filters button** — appears when any filter is active
- **4 KPI tiles** — rows matching (of total), mean total fare, imputed rows, sold-out observations
- **Filterable DataTable** — columns: captured time, sector, flight, window, band, source, base fare, taxes, UDF, convenience, total, flags (imputed/sold-out/clean)
- **CSV export** — "Export N rows" button downloads filtered view as CSV
- **4-way fare split visible in every row** — base, taxes, UDF, convenience charge as separate columns
- **Cell key explained** — every row's key = (sector, carrier, lead window, cabin, departure weekday band)

#### API Page
- **4 KPI tiles** — Endpoints published (23), Series points available, Latest published value, Revision horizon (T+30)
- **Endpoint catalogue** — 23 endpoints across 6 groups:
  - Index: `/index/apix`, `/index/apix/latest`, `/index/elementary`, `/index/contributions`
  - Quotes and sectors: `/quotes`, `/quotes/raw` (admin), `/sectors`, `/sectors/heatmap`, `/sectors/{id}/elasticity`, `/sectors/{id}/decomposition`
  - Validation and health: `/backtest`, `/backtest/series`, `/health/coverage`, `/health/scrapers`
  - Compliance: `/compliance`, `/compliance/robots/{source}`, `/compliance/audit`
  - Statistical exchange: `/sdmx/v1/data/APIX/{key}`, `/sdmx/v1/dataflow/APIX`, `/openapi.json`
  - Administration (admin): `/admin/basket`, `/admin/weights`, `/admin/rerun`, `/admin/seed-demo`
- **SDMX-JSON sample** — live-generated from the series, frequency-switchable (daily/weekly/monthly), copy-to-clipboard and download-as-JSON buttons
- **Publication lifecycle** — PROVISIONAL (morning after), REVISED (T+7), FROZEN (T+30), with visual 28-day status strip
- **Consumer guide** — curl examples for both the REST and SDMX surfaces
- **MoSPI alignment note** — explains why SDMX-JSON puts APIx in the same exchange format as MoSPI's own eSankhyiki portal

#### Design System Page
- **Token catalogue** — all CSS custom properties documented by role (surface, ink, semantic, categorical, chart chrome, sequential ramp, diverging ramp, elevation)
- **Accessibility validator results** — 5-check report (lightness band, chroma floor, CVD separation, normal-vision floor, contrast against surface) for both dark and light modes
- **Categorical series palette** — 6 validated colour slots with both dark and light mode values
- **Sequential ramp** — 7-step sequential scale (for heatmap intensity)
- **Diverging ramp** — 8-step diverging scale (for heatmap direction)
- **Component showcase** — every primitive rendered with its variants (tone, size, state)
- **Chart skeleton** — loading state component
- **Formula component** — LaTeX-style formula rendering
- **Theme support** — dark and light themes, both authored independently (dark is not an inverted light theme)

---

### 1.6 Compliance & Operations

**Source registry (14 entries)**
- Per-source: slug, label, domain, kind (AIRLINE/OTA/LICENSED_API/MOU), access method (Playwright/Scrapy/API/Feed/Not routed), robots.txt posture, terms posture, rate limit (/min), nightly cap, illustrative flag, demotion target, demotion reason, panel participation flag
- 6 posture states: Pending review, Allow, Disallow, Partial, Licensed, Statutory
- 4 access methods: Playwright, Scrapy, Licensed API, Bulk feed

**robots.txt management**
- Parsed with protego library
- 24-hour cache with fetch timestamp
- Per-source posture displayed in the registry
- Illustrative source (Portal F) with full demote narrative

**Rate limiting**
- Per-domain token bucket (1 request / 6 seconds)
- Nightly per-domain request cap
- Crawl-delay from robots.txt feeds into the token bucket

**Kill switches**
- Manual kill-switch per source
- Automatic kill-switch on 3 consecutive 429 responses (24-hour quarantine)
- Kill-switch state displayed per source in the health table

**Audit log**
- Every outbound request logged: timestamp, source, URL path, HTTP status, latency (ms), robots allowed flag, throttled flag
- Simulated nightly run with ~30 logged requests
- Exportable to CSV

**Posture tracking**
- Live posture column in the source registry
- Routing decision is the posture value (not decoration)
- Demotion path visible: blocked source → licensed API → statutory feed

**DPDP Act 2023 compliance**
- No personal data collected
- Fare, schedule, tax fields only
- No account creation, no session maintenance

**Legal position**
- Explicit statement that scraping publicly displayed prices is unsettled in Indian law
- Conservative posture by default
- Production design assumes statutory feed (Collection of Statistics Act 2008)

---

### 1.7 API & Publication

**REST API (23 endpoints)**
- Index endpoints (4): daily/weekly/monthly series, latest point, elementary per-cell, contributions
- Quotes and sectors (6): cleaned panel, raw quotes (admin), sector basket, heatmap, elasticity, decomposition
- Validation and health (4): back-test, back-test series, coverage, scraper health
- Compliance (3): per-source posture, cached robots.txt, audit log
- Administration (4, admin-gated): update basket, load weights, re-run index, seed demo

**SDMX-JSON 1.0**
- Full SDMX-JSON payload generated from live series
- Frequency switchable: daily, weekly, monthly
- Sender: MoSPI-DIID
- Observation attributes carry publication status (A=Normal, P=Provisional, M=Missing/Suppressed)
- Dataset ID: APIX-{frequency}-{date}
- Copy-to-clipboard and download-as-JSON

**OpenAPI 3.1**
- Full OpenAPI specification served at `/openapi.json`
- Available for NSO and RBI consumers

**Publication lifecycle**
- PROVISIONAL — published morning after collection, once 70% gate clears
- REVISED — re-compiled at T+7 with late-arriving quotes and back-filled cells; suppressed days get first value here
- FROZEN — sealed at T+30, never changes again

**CSV export**
- Quotes table: full cleaned panel export with all 13 columns
- Audit log: request-by-request CSV with 7 columns

**JSON export**
- SDMX-JSON download
- Index series JSON download

---

### 1.8 Design System

**Token architecture**
- CSS custom properties as the single source of truth
- No hard-coded hex values in components
- Role-based consumption: components reference tokens by semantic role

**Two authored themes**
- Dark mode (default): deep navy plane (#070d18 → #16233a surface stack)
- Light mode: cool grey-blue plane (#e9eef6 → #e3eaf4 surface stack)
- Both authored independently — light is not an inverted dark theme

**Token categories**
- Radius: 3 tiers (chip 999px, control 10px, panel 14px)
- Spacing: tight (8px), default (14px), loose (22px)
- Type: 3 font families (Space Grotesk display, IBM Plex Sans body, IBM Plex Mono data)
- Motion: 3 durations (120ms fast, 220ms default, 420ms slow) with spring easing
- Status: 5 fixed states (good, warn, serious, critical, gate) with paired icons — never themed

**Surface stack**
- 5 surfaces: background, panel, raised control, hover/pressed, recessed well
- Elevation shadows tinted to the plane colour

**Ink stack**
- 4 levels: primary text, body copy, axis labels/metadata, hairline borders
- Plus inverted ink for text on dark surfaces

**Categorical series palette**
- 6 validated colour slots (s1 through s6) + "other" fallback
- 5-check accessibility validator: lightness band, chroma floor, CVD separation (protan/deutan), normal-vision floor, contrast against surface
- Worst adjacent pair: ΔE 10.1 (dark, protan) / ΔE 8.7 (light, deutan)

**Sequential ramp**
- 7-step single-hue ramp for heatmap intensity
- Near-zero recedes toward the surface

**Diverging ramp**
- 8-step diverging scale (4 cool + 4 warm + neutral midpoint)
- Used for heatmap direction: cool = fares fell, warm = fares rose

**Components (30+)**
- Layout: Panel, PageHeader, AppShell (sidebar + topbar navigation)
- Data display: StatTile, Badge, StatusChip, Callout, KeyValue, DataTable, Legend, Meter
- Controls: SegmentedControl, Toggle, Slider, Select, Button
- Charts: IndexBandChart, MultiLine, Heatmap, RankedBars, DivergingBars, StackedArea, ScatterFit, Donut, Pie (via Recharts)
- Feedback: ChartSkeleton, EmptyState, Formula, LiveBadge (relative timestamp with ping animation)
- Utilities: cx (class merger), useChartTokens, useTheme, useCountUp, useRelativeTime
- Download: downloadCsv, downloadJson, copyText

**Icon system**
- Phosphor icons throughout (consistent weight, size, and duotone usage)

---

### 1.9 Data Infrastructure

**Seeded fixture panel**
- 90 days of data (2026-06-07 to 2026-09-04), internally consistent
- Deterministic seed with seeded PRNG
- Daily, weekly, and monthly series auto-aggregated
- Event calendar with 4 real-world events (monsoon, ATF revision, Independence Day, Onam)
- Two suppressed days demonstrating the publication gate

**Reference data**
- 14 airports (DEL, BOM, BLR, CCU, HYD, MAA, PNQ, GOI, GAU, AMD, SXR, LKO, COK, BBI)
- 5 carriers with LCC flag and seat-share weights (IndiGo 61%, Air India 16%, AIX 9%, Akasa 7%, SpiceJet 7%)
- 20 city-pair sectors with DGCA-order-magnitude passenger volumes, trunk flag, and seasonality classification
- 5 lead-time buckets (T+1, T+7, T+15, T+30, T+45)
- 2 departure day-of-week bands (weekday, weekend)
- 6 panel sources (3 airlines + 2 licensed APIs + 1 statutory feed)
- 8 cross-check aggregators with realistic convenience-fee multipliers and real deep-link URL builders

**Live data pipeline (Puppeteer)**
- `scrape-cleartrip.mjs` — Node.js script using Puppeteer
- Scrapes Cleartrip IDR-BLR route (Indore to Bangalore)
- Target flight: 6E-6744 (daily non-stop IndiGo)
- Fetches at T+0, T+1, T+7, T+15, T+30, T+45 lead times
- Also fetches cabin comparison (Economy, Premium Economy, Business) at T+15
- Handles Akamai bot-manager by driving real Chromium
- Writes output to frontend's `src/data/` as JSON
- Includes error handling per rung (failed fetches logged but don't crash the run)

**Formatting library**
- `fmtRupee` — Indian currency formatting (lakh/crore-aware)
- `fmtIndex` — index point formatting
- `fmtPct` — percentage with configurable decimals
- `fmtSigned`, `fmtSignedPct` — signed deltas with directional awareness
- `fmtInt` — integer with thousands separator
- `fmtDay`, `fmtDayFull`, `fmtMonth` — date formatting
- `fmtLead` — lead window display (T+7)
- `fmtClock` — time-of-day formatting

**Download utilities**
- CSV export with proper escaping (RFC 4180)
- JSON download
- Clipboard copy with fallback

---

## Section 2: Potential Improvements

### 2.1 High Priority (can demo convincingly)

#### 2.1.1 AI-Powered Anomaly Detection
**Description:** Implement an Isolation Forest algorithm trained on the 90-day fare panel to automatically flag unusual fare patterns. The model would learn normal price-relative distributions per cell (sector x carrier x lead window) and surface outliers that the Tukey fence might miss — particularly cross-cell anomalies like a single carrier on a single route moving while all others stay flat. The dashboard would show anomaly scores, flagged cells with explanation, and a timeline of detected anomalies overlaid on the published series.

**Why it matters for the hackathon:** Judges at a government tech hackathon will recognise that statistical indices need both rules-based and ML-based quality control. Showing an Isolation Forest running on the actual panel data (even the seeded fixture) demonstrates that the team thinks beyond the index formula to operational monitoring. It directly addresses the question "how do you know a number is right?" at a deeper level than outlier fences alone.

**Implementation complexity:** Medium. scikit-learn's IsolationForest is a one-line fit/predict. The challenge is feature engineering (log-relatives, cell-mean residuals, booking-window shape deviation) and presenting results without overclaiming. The seeded fixture already has injected events (festival spikes) that make good training/test splits.

#### 2.1.2 Automated PDF Report Generation
**Description:** A report generation module that produces daily briefs and monthly releases as formatted PDF documents. Daily briefs would contain the headline APIx value, the 95% band, day-over-day and month-over-month movement, the 5 hottest and 5 coolest cells, publication status, and a coverage summary. Monthly releases would include the full decomposition, carrier mix, sector ranking, methodology notes, and the back-test correlation. Reports would be generated from the same data the dashboard renders, so they are guaranteed to agree with what's on screen.

**Why it matters for the hackathon:** A government statistics agency does not publish indices through dashboards — it publishes them through PDF releases. Having a working report generator shows that the team understands the actual publication workflow MoSPI follows. The judge who asks "how does this reach a journalist or policy maker?" gets an immediate answer. It also makes the demo more tangible — a printed report is something a judge can take away mentally.

**Implementation complexity:** Low. Use a server-side library (jsPDF on the frontend, or WeasyPrint/reportlab on a backend endpoint). The data is already computed; the report just needs layout. A single-page daily brief is achievable in an afternoon. Multi-page monthly release is a weekend.

#### 2.1.3 Multi-Source Data Consolidation Engine Visualization
**Description:** A visual pipeline diagram showing the flow from 14 sources through the compliance gate, into the medallion storage, through the cleaning pipeline, and into the index engine. Make it interactive — hovering over each stage shows the actual counts (raw quotes landed, quotes after dedup, quotes after outlier removal, quotes reaching the index). Add a source selector that shows which sources are active, which are pending review, which have been demoted, and their current health metrics.

**Why it matters for the hackathon:** The architecture diagram in the docs is thorough but static. An interactive, data-driven version that shows live counts from the seeded fixture makes the pipeline feel real rather than theoretical. It directly answers the judge's question "where does the data come from and what happens to it?" in a way that is both technically impressive and easy to understand in 30 seconds.

**Implementation complexity:** Low. The data is all in the fixture. Build a custom React component that renders the pipeline as a horizontal flow with animated counters. Use the existing Panel and Badge components for consistency.

#### 2.1.4 Fare Forecasting (LSTM + ARIMA Ensemble)
**Description:** A forecasting module that projects the APIx series 7, 14, and 30 days forward using an ensemble of LSTM (for pattern learning) and ARIMA (for trend and seasonality). The forecast would be shown as a continuation of the existing IndexBandChart with widening confidence intervals. A separate page or panel would show per-sector forecasts, with the lead-time elasticity curve extended into the future.

**Why it matters for the hackathon:** Forecasting is the natural next step after publishing an index. Judges from MoSPI and RBI will immediately ask "can this help with policy?" — a forecast of where airfares are heading is directly useful for inflation targeting, consumer protection, and capacity planning. The ensemble approach (LSTM + ARIMA) is a credible, non-trivial technique that shows technical depth.

**Implementation complexity:** Medium-High. TensorFlow.js or a lightweight Python backend with Prophet/statsmodels. The 90-day series is short for LSTM, so the model needs careful architecture (few layers, dropout, the series needs to be stationary). ARIMA handles the short series better. The ensemble weights could be optimised on a rolling 30-day holdout. Alternatively, use Prophet (Facebook's forecasting library) which handles short series with seasonality very well and is easier to demo convincingly.

#### 2.1.5 Scraper Architecture Diagram / Pipeline Visualization
**Description:** An animated, interactive version of the architecture diagram showing a daily collection run in real time. Start with the Prefect scheduler firing, show the 600 tasks fanning out to 6 sources, show the compliance gate checking each source, show requests going out and responses coming back, show data flowing through bronze/silver/gold, through the cleaning pipeline, into the index engine, and finally being published. Use animated particles or flow lines to make the data movement visible.

**Why it matters for the hackathon:** The current architecture diagram is thorough but static and text-heavy. An animated version is dramatically more compelling in a live demo — it shows the system "breathing" rather than just existing. It also makes the compliance gate visible as a first-class component, which is a key differentiator from any generic price tracker.

**Implementation complexity:** Low-Medium. Use a React component with CSS animations or a lightweight canvas library. The flow is linear and well-defined. The Mermaid diagrams already exist — this is about making them animated and data-driven.

#### 2.1.6 Admin Configuration Console
**Description:** A web-based admin panel that lets an operator configure the collection system without touching code or config files. Features: toggle collection on/off, set rate limits per source, adjust nightly caps, review and update source postures (robots.txt, terms), trigger a manual re-run for a specific date range, regenerate the seeded fixture panel with new parameters, adjust the outlier fence k-value, and edit the lead-time booking shares. Every change is logged to the audit trail.

**Why it matters for the hackathon:** Judges from MoSPI will recognise that a production statistical agency needs operational control. An admin console transforms the project from a "dashboard that shows data" to a "system that an organisation can actually run." It directly addresses the operational reality of publishing a government statistics product.

**Implementation complexity:** Medium. The backend endpoints already exist in the endpoint catalogue (`/admin/basket`, `/admin/weights`, `/admin/rerun`, `/admin/seed-demo`). The frontend needs form screens wired to those endpoints. Rate limits and source postures can be edited in-place. The tricky part is the auth layer (simple role check for demo purposes).

---

### 2.2 Medium Priority (impressive but more complex)

#### 2.2.1 Geographic Heatmap of India
**Description:** An SVG or canvas-based map of India with each state/region colour-coded by the average fare index for routes departing from or arriving at that region. Trunk sectors (DEL-BOM, BOM-BLR) would show as high-intensity corridors. Hovering over a region would show the contributing sectors, average fare, and week-on-week change. Could be layered with the existing sector heatmap data by mapping each of the 20 sectors to its origin and destination states.

**Why it matters:** India-specific visualizations resonate strongly with Indian hackathon judges. A fare map of India is immediately intuitive — anyone can see where fares are high and where they are rising. It also makes the 20-sector basket feel like a national coverage story rather than a random selection of routes.

**Implementation complexity:** Medium. Need an India SVG map (readily available as open data). Map each of the 20 sectors to origin/destination states/UTs. Colour each region by the mean fare index of departing routes. Tooltip with sector details. The data is already computed; this is purely a presentation layer addition.

#### 2.2.2 Real-Time Alerting System
**Description:** A configurable alerting engine that monitors the collection pipeline and the published index for anomalies. Alert types: coverage drops below 70% (publication gate breach), source yield drops below threshold, kill-switch tripped, index moves more than X% in a day (potential data error vs real event), scraping latency exceeds threshold, DGCA comparison gap exceeds Y points. Alerts can be delivered via webhook (to Slack/Teams), email, or SMS. Each alert includes a link to the relevant dashboard page and the data that triggered it.

**Why it matters:** Alerting is what makes an index operationally useful rather than just informative. A statistics agency needs to know the moment something goes wrong — not the next morning when someone opens the dashboard. Webhook integration with Slack/Teams is immediately demoable and shows production-readiness thinking.

**Implementation complexity:** Medium-High. The trigger conditions are straightforward (threshold checks on existing metrics). The delivery channels (webhook, email, SMS) each need a connector. For the hackathon, a webhook to Slack + email via a simple SMTP relay is sufficient. SMS requires a gateway integration (Twilio or equivalent).

#### 2.2.3 Mobile-Responsive Field Inspection Mode
**Description:** A simplified, mobile-first view of the dashboard optimised for field inspectors and on-the-go monitoring. Features: condensed overview with headline index and coverage gate, simplified heatmap, alert feed, and quick compliance check. The layout would use a bottom navigation bar, larger touch targets, and reduced chart complexity. A "field report" mode would let an inspector generate a one-page summary of the current state for upload to a central system.

**Why it matters:** Government officials and inspectors are often in the field, not at a desk. A mobile-responsive version shows that the team has thought about real-world usage contexts beyond the control room. It also addresses accessibility and inclusivity — not everyone accesses data from a desktop.

**Implementation complexity:** Medium. The existing components are already built with Tailwind responsive classes. The challenge is identifying which charts simplify well on small screens (heatmap becomes scrollable, line charts keep their axes, stat tiles stack) and creating the bottom navigation. The field report mode is a print-optimised view of the overview page.

#### 2.2.4 Role-Based Access Control
**Description:** A three-tier RBAC system: Admin (full access including configuration, source management, re-runs), Analyst (read-only access to all pages, can export data, can adjust methodology sliders), Viewer (read-only access to Overview, Heatmap, and Elasticity pages only, no export). Authentication via simple email/password for the demo, with the architecture supporting SSO/LDAP for production. Each role sees a tailored navigation sidebar.

**Why it matters:** A government statistics product has different audiences. The Minister's office needs a high-level view (Viewer). The economics division needs analytical access (Analyst). The technical team needs operational control (Admin). RBAC shows that the team understands multi-stakeholder government software, not just a single-user dashboard.

**Implementation complexity:** Medium. Simple role checking in the React router and sidebar. Three navigation configurations. Auth context with role state. For the hackathon, a login screen with role selection is sufficient — no need for real auth backend.

#### 2.2.5 Historical Trend Analysis with Seasonal Decomposition
**Description:** Extend the time-series visualization to show classical seasonal decomposition (trend, seasonal, residual) of the APIx series. Add year-over-year comparison mode where the current 90-day window is overlaid with the same window from the previous year. Include a moving average overlay (30-day, 90-day) and the ability to annotate specific dates with policy events (tax changes, festival dates, capacity adjustments).

**Why it matters:** Seasonal decomposition is a standard tool in economic analysis. Showing that the index can be decomposed into trend + seasonal + residual demonstrates statistical maturity. Year-over-year comparison is what a policy analyst actually wants — "are airfares higher this August than last August?" — and it is not currently possible with only a 90-day window.

**Implementation complexity:** Medium. Classical decomposition is straightforward (statsmodels has a ready-made function). Year-over-year overlay is a matter of shifting the series by 365 days. The challenge is the 90-day window is too short for meaningful seasonal decomposition — the demo would need to either extend the window (more seeded data) or show the technique with a note that it becomes more powerful with longer histories.

#### 2.2.6 Carrier-Specific Performance Tracking
**Description:** A dedicated page (or set of panels) that tracks each carrier's contribution to the index separately. Show per-carrier: mean fare by sector, fare trend over the 90-day window, market share of the cleaned panel, lead-time curve by carrier, and the carrier's contribution to the latest index movement. IndiGo's 61% seat share means it dominates the index — this page would make that dominance visible and allow analysts to understand whether index movements are driven by one carrier or broad-based.

**Why it matters:** The current dashboard shows carrier mix as a donut chart on the Overview page. A dedicated analysis shows deeper engagement with the data. It answers "is the index moving because IndiGo raised fares, or because the whole market moved?" — a question that any aviation economist or competition authority would ask.

**Implementation complexity:** Medium. The data is already decomposed by carrier in the fixture. The challenge is building the per-carrier aggregation logic and designing the visualisation (5 carrier lines on a shared chart, per-carrier contribution bars, carrier heatmap overlay).

#### 2.2.7 Fuel Price Correlation Analysis
**Description:** A panel that overlays the ATF (aviation turbine fuel) price series on the APIx chart, showing the correlation between fuel costs and airfares over time. Include a scatter plot of ATF price vs base fare index, a rolling correlation metric, and an annotation on dates where ATF price changes are known to have driven fare changes (the July 1 ATF revision is already in the event calendar).

**Why it matters:** Fuel is the largest variable cost for airlines (30-40% of operating costs). Showing the ATF-to-fare transmission mechanism makes the index more interpretable for policy audiences. When the Finance Minister asks "why did airfares go up?", the answer "ATF rose 5% in July" backed by a chart is more compelling than "the index rose 2.3 points."

**Implementation complexity:** Medium. Need an ATF price series (can be seeded as fixture data from public MoPNG data). The correlation computation is simple Pearson. The chart overlay is straightforward. The narrative framing (ATF revision event already exists) makes this easy to demo.

#### 2.2.8 Capacity vs Demand Visualization
**Description:** A dual-axis chart showing flight capacity (seats available, from DGCA data) alongside the APIx series. When capacity drops (monsoon trim, aircraft maintenance) and fares rise simultaneously, the chart makes the causal link visible. Include a supply-demand ratio metric and annotate periods where capacity constraints drove price movements.

**Why it matters:** Airfare economics 101: when supply drops and demand stays constant, prices rise. Showing capacity alongside fare makes the index interpretable as an economic signal rather than just a number. It directly supports the narrative that VIMAAN is not just a price tracker but an economic indicator.

**Implementation complexity:** Medium. DGCA capacity data is publicly available (weekly frequency-wise domestic passenger data). Need to add capacity fixture data. The dual-axis chart is a standard Recharts pattern. The causal annotation requires some editorial judgement but the data speaks for itself.

---

### 2.3 Nice to Have

#### 2.3.1 Natural Language Query Interface
**Description:** A search bar that accepts plain-English queries like "show me DEL-BOM fares last week" or "what happened to fares during Onam?" and returns the relevant chart, data table, or insight. Powered by a simple intent classifier that maps queries to page navigation, filter settings, and date ranges. For the demo, a rule-based approach (keyword matching on sectors, carriers, events, and time expressions) is sufficient. For production, integrate with a lightweight LLM API.

**Why it matters:** Natural language interfaces are the most immediately impressive UI pattern for non-technical judges. A Minister's office user who can type "BOM fares August" and get the right chart feels like the product is designed for them. It also sidesteps the learning curve of navigating 12 dashboard pages.

**Implementation complexity:** Medium. Rule-based intent parsing is achievable with regex patterns for known sectors, carriers, events, and date expressions. LLM-powered would need an API call (Claude, GPT) with structured output. The output is always one of the existing pages with pre-set filters — no new visualisation needed.

#### 2.3.2 Integration with External Data Sources
**Description:** Enrich the index with external data series: ATF prices from MoPNG, USD/INR exchange rate (RBI), Jet fuel spot prices (international markets), weather data (monsoon severity by region), and crude oil prices. Show these as overlay series or correlation panels alongside the fare index. For example, a 4-panel dashboard showing APIx, ATF, USD/INR, and crude oil over the same time axis with rolling correlations.

**Why it matters:** An index that explains itself is more useful than one that does not. When airfares rise, being able to show "ATF rose 4.2% and USD weakened 1.1% in the same period" transforms the index from a number into an analytical tool. It also demonstrates data integration capability, which is relevant for a government platform that will eventually ingest many data feeds.

**Implementation complexity:** Medium-High. External APIs need to be integrated (MoPNG, RBI, weather APIs). Data needs to be normalised to the same time axis. Correlation computation is simple. The challenge is data freshness — most of these sources update weekly or monthly, not daily, so the integration needs to handle different frequencies gracefully.

#### 2.3.3 Predictive Capacity Reduction Alerts
**Description:** Use the DGCA weekly capacity data (flight frequency and seat count) to predict upcoming capacity constraints. When a carrier announces schedule reductions or when historical patterns suggest an upcoming capacity drop (monsoon season, aircraft maintenance cycles), the system generates an alert with the predicted impact on fares. The alert would be shown on the Heatmap page as a "forecast" overlay and delivered via the alerting system.

**Why it matters:** Capacity reduction is the most common cause of short-term fare spikes in India (monsoon trims, festival surges, aircraft grounding). Predicting these events before they hit the fare panel is genuinely useful for travellers, policy makers, and competition authorities. It transforms VIMAAN from a historical record into a forecasting and early-warning system.

**Implementation complexity:** High. Requires DGCA weekly schedule data integration, a time-series forecasting model for capacity, and a mapping from capacity reduction to expected fare impact. The model needs to be calibrated on historical capacity-fare pairs. For the hackathon, a simpler version that flags known seasonal patterns (monsoon, festival) with expected fare impact would be sufficient.

#### 2.3.4 What-If Scenario Modeling
**Description:** An interactive "what if" tool that lets users model hypothetical scenarios and see their impact on the index. Scenarios: "What if a new entrant adds 10% capacity on DEL-BOM?" (index impact from increased competition), "What if Jet Airways returns to domestic operations?" (capacity increase on trunk routes), "What if ATF rises 10%?" (cost-push fare increase), "What if the monsoon capacity trim extends by 2 weeks?" (supply shock duration). Each scenario shows the projected APIx movement and the affected sectors.

**Why it matters:** Scenario modeling is what turns an index into a policy tool. A government analyst can ask "what would happen to the airfare index if we introduced a fare cap on trunk routes?" and see the modelled outcome. It directly addresses the "what can we do with this data?" question that judges from policy backgrounds will ask.

**Implementation complexity:** High. Requires a structural model of the Indian domestic aviation market (supply elasticities, demand elasticities, cost pass-through rates). For the hackathon, simplified proportional models (10% more capacity → 3% lower fares on that sector) with clear assumptions stated are sufficient. The UI is an interactive form with sliders and a results panel.

#### 2.3.5 Blockchain Audit Trail for Data Provenance
**Description:** Every quote in the cleaned panel is recorded on a lightweight blockchain (or a hash-chained log) that creates an immutable provenance trail. Each record includes: source, timestamp, raw payload hash, cleaned value, processing steps applied, and the final index value derived from it. An auditor can verify that a published index point was computed from specific, unmodified raw quotes by tracing the hash chain.

**Why it matters:** For a government statistics product, provability is everything. "Can you prove this number was computed correctly from these specific quotes?" is the question a parliamentary committee or audit office will ask. A blockchain-style audit trail provides cryptographic proof of data lineage. Even if the full blockchain is overkill for the demo, a hash-chained log (each entry includes the hash of the previous entry) provides the same assurance with simpler technology.

**Implementation complexity:** High. Requires a hash-chaining mechanism on every quote record, a verification endpoint that can trace a published index point back to its source quotes, and a visual audit trail in the compliance page. For the hackathon, a simplified version that hashes each quote and shows the chain on the compliance page is achievable. A full blockchain (even a private one) is over-engineering for a demo.

#### 2.3.6 Voice-Enabled Report Reading for Visually Impaired Users
**Description:** Accessibility enhancement that adds screen-reader optimisation throughout the dashboard and a voice-output mode for the key insights. The Overview page's headline index, the heatmap's hottest/coolest cells, and the compliance status could be read aloud via the Web Speech API. All interactive elements would have ARIA labels, all charts would have text alternatives, and the page structure would be optimised for screen-reader navigation.

**Why it matters:** Accessibility is a government mandate (GIGW — Guidelines for Indian Government Websites). Showing that VIMAAN is accessible by design, not as an afterthought, demonstrates maturity. The voice-output feature is particularly relevant for a statistics product — being able to ask "what is the airfare index today?" and hear the answer is a genuinely useful accessibility feature.

**Implementation complexity:** Low-Medium. ARIA labels and semantic HTML are good practices that should be applied regardless. The Web Speech API is a single function call. The main work is auditing every component for accessibility (keyboard navigation, focus management, alt text for charts) — this is table-stakes for a government product.

---

## Appendix: Technology Stack Summary

| Layer | Technology | Status |
|---|---|---|
| Frontend framework | React + TypeScript | Built |
| Styling | Tailwind CSS + CSS custom properties | Built |
| Charts | Recharts (Line, Bar, Area, Scatter, Pie, Heatmap) | Built |
| Icons | Phosphor Icons | Built |
| Build tool | Vite | Built |
| Scraper (live) | Puppeteer (Cleartrip only) | Built |
| Planned scrapers | Playwright (airlines), Scrapy (OTAs) | Designed |
| Backend API | FastAPI (planned) | Endpoint catalogue designed |
| Database | TimescaleDB (planned) | Schema designed |
| Object storage | MinIO/S3 (planned) | Architecture designed |
| Orchestration | Prefect + Celery + Redis (planned) | Architecture designed |
| Observability | Prometheus + Grafana (planned) | Architecture designed |
| Index format | SDMX-JSON 1.0 | Sample generated |
| API spec | OpenAPI 3.1 | Endpoint catalogue |
| PDF reports | jsPDF / WeasyPrint (not yet) | Proposed |
| Forecasting | LSTM + ARIMA ensemble (not yet) | Proposed |
| Alerting | Webhook + Email + SMS (not yet) | Proposed |
| Auth | Role-based (not yet) | Proposed |
| Mobile | Responsive redesign (not yet) | Proposed |
