# VIMAAN — Page-by-Page Feature Catalogue

> Application: **VIMAAN – Fare Index Intelligence Platform**  
> Domain: Airfare analytics / yield-management  
> Stack: React 18 + TypeScript + Vite + Tailwind CSS + Recharts + React Router  
> Backend simulation: in-memory mock server (`src/mock.ts`, route prefix `/api/v1/...`)  
> Auth: simple admin login (user: `admin` / pass: `admin123`)  
> Total pages: **20** (1 login + 19 authenticated routes)

---

## Table of Contents

1. [Login Page](#1-login-page)
2. [Dashboard (Home)](#2-dashboard-home)
3. [Heatmap](#3-heatmap)
4. [Elasticity](#4-elasticity)
5. [Cross Check](#5-cross-check)
6. [Decomposition](#6-decomposition)
7. [Methodology](#7-methodology)
8. [Backtest](#8-backtest)
9. [Compliance](#9-compliance)
10. [Health](#10-health)
11. [Quotes](#11-quotes)
12. [Anomaly](#12-anomaly)
13. [API Inspector](#13-api-inspector)
14. [Forecast](#14-forecast)
15. [Design System](#15-design-system)
16. [Scraper Architecture](#16-scraper-architecture)
17. [Reports](#17-reports)
18. [Scraper Config](#18-scraper-config)
19. [Sectors](#19-sectors)
20. [Model Management](#20-model-management)

---

## 1. Login Page

| File | `src/pages/LoginPage.tsx` |
|------|--------------------------|

**Purpose:** Single-entry authentication gate. All other routes are behind this screen.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Username field** | Text input with `User` icon, placeholder "Enter username" |
| 2 | **Password field** | Password input with `Lock` icon, placeholder "Enter password" |
| 3 | **Submit button** | Calls `AuthContext.login()` with hard-coded admin credentials check |
| 4 | **Branding** | "VIMAAN" logo tile (accent-coloured square) + platform tagline "Fare Index Intelligence" |
| 5 | **Error display** | Shown inline when credentials are wrong |
| 6 | **Auto-focus** | Username field auto-focused on mount |
| 7 | **Keyboard submit** | Enter key triggers form `onSubmit` |

### Visual Layout

- Centered card on dark background, max-width 420 px.
- Inputs styled with `ring-1 ring-line`, hover/focus ring transitions.
- Submit button full-width, accent background.

---

## 2. Dashboard (Home)

| File | `src/pages/DashboardPage.tsx` |
|------|-------------------------------|

**Purpose:** At-a-glance operational overview with KPIs, event calendar, and trend line chart.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Hero stat tiles** | Row of `StatTile` components: APIx Today, Weekly Change, Routes Covered, Data Freshness |
| 2 | **APIx Today tile** | Shows current aggregate fare index value with trend arrow |
| 3 | **Weekly Change tile** | Percentage change vs. 7 days ago, colour-coded (green up / red down) |
| 4 | **Routes Covered tile** | Count of active O&D pairs being tracked |
| 5 | **Data Freshness tile** | Timestamp of most recent scrape across all sources |
| 6 | **Route Calendar Heatmap** | Compact calendar-view heatmap showing daily index values per route |
| 7 | **Index Trend Chart** | `IndexBandChart` line chart with 95 % confidence band, showing APIx over selected date range |
| 8 | **Route selector** | Dropdown to pick which origin-destination pair to view on the trend chart |
| 9 | **Date range picker** | Preset ranges (7d, 30d, 90d, 1y) that re-fetch data |
| 10 | **Event markers** | Vertical dashed lines on the trend chart for known events (fare sales, fuel spikes) with tone colours |

### Visual Layout

- Top: KPI row (4 tiles).
- Left column (wide): trend chart.
- Right column (narrow): route calendar heatmap.

---

## 3. Heatmap

| File | `src/pages/HeatmapPage.tsx` |
|------|-----------------------------|

**Purpose:** Calendar heatmap visualising the fare index across every origin-destination pair over time — a "GitHub-contribution" style view for fares.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Calendar grid** | Rows = O&D pairs, columns = dates; each cell coloured by index value |
| 2 | **Colour scale** | Low fares = cool (blue), high fares = warm (orange/red) |
| 3 | **Origin filter** | Select which origin airport to show |
| 4 | **Destination filter** | Select which destination airport to show |
| 5 | **Date range selector** | 7d / 30d / 90d / 1y presets |
| 6 | **Tooltip on hover** | Shows exact date, route, fare index value |
| 7 | **Legend** | Colour gradient bar with min/max values |
| 8 | **Empty state** | "No data available" when selected route has no coverage |
| 9 | **Route grouping** | Routes grouped by origin for navigation within the heatmap |

### Visual Layout

- Full-width heatmap grid with sticky row/column headers.
- Controls bar above the grid.

---

## 4. Elasticity

| File | `src/pages/ElasticityPage.tsx` |
|------|-------------------------------|

**Purpose:** Price-demand elasticity analysis — scatter plot of price vs. demand with a fitted curve.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Scatter plot** | Each point = a price observation (x) vs. seats-booked (y) for a route |
| 2 | **Fitted curve** | `ScatterFit` component draws a least-squares regression line through the scatter |
| 3 | **Elasticity coefficient** | Computed slope displayed as a stat card |
| 4 | **Route selector** | Pick which O&D pair to analyse |
| 5 | **Date range picker** | 30d / 90d / 1y presets |
| 6 | **Hover tooltip** | Shows date, price, and seats-booked for each point |
| 7 | **Elasticity interpretation** | Helper text: "elastic" (|ε| > 1) vs "inelastic" (|ε| < 1) |
| 8 | **Compare toggle** | Optionally overlay a second route's scatter on the same chart |

### Visual Layout

- Wide scatter chart with fitted line.
- Stat cards below: elasticity value, R², sample size.

---

## 5. Cross Check

| File | `src/pages/CrossCheckPage.tsx` |
|------|--------------------------------|

**Purpose:** Compares the platform's computed **APIx** index against raw prices scraped from individual GDS / OTA sources to spot divergences.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Multi-series line chart** | `MultiLine` chart overlaying APIx (solid) and each individual source (dashed) |
| 2 | **Source toggles** | Checkboxes to show/hide individual GDS sources on the chart |
| 3 | **Deviation stat** | Mean absolute deviation (MAD) between APIx and each source, shown as a table |
| 4 | **Route selector** | Choose O&D pair |
| 5 | **Date range** | 7d / 30d / 90d presets |
| 6 | **Highlight divergences** | Periods where source price deviates > threshold from APIx are shaded (bands) |
| 7 | **Source table** | Ranked list of sources by fidelity (correlation with APIx) |

### Visual Layout

- Chart area on top, deviation table below.
- Source toggle chips in a toolbar.

---

## 6. Decomposition

| File | `src/pages/DecompositionPage.tsx` |
|------|-----------------------------------|

**Purpose:** Time-series decomposition of the APIx index into **trend**, **seasonal**, and **residual** components using STL-style additive decomposition.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Original series** | Raw APIx line chart |
| 2 | **Trend component** | Smoothed long-term trend extracted from the series |
| 3 | **Seasonal component** | Repeating intra-week / intra-month pattern |
| 4 | **Residual component** | What remains after removing trend + seasonality (noise + shocks) |
| 5 | **Stacked area chart** | `StackedArea` showing additive reconstruction = trend + seasonal + residual |
| 6 | **Route selector** | Choose O&D pair |
| 7 | **Period selector** | Daily / weekly aggregation |
| 8 | **Date range** | 30d / 90d / 1y presets |
| 9 | **Component toggle** | Show/hide individual decomposed series |

### Visual Layout

- Four chart panels stacked vertically (original, trend, seasonal, residual).
- Controls bar at top.

---

## 7. Methodology

| File | `src/pages/MethodologyPage.tsx` |
|------|---------------------------------|

**Purpose:** Static informational page explaining the **APIx** pricing methodology, data pipeline, and statistical approach.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Methodology narrative** | Markdown-style prose describing APIx computation |
| 2 | **Data sources section** | Lists all GDS / OTA sources, their weights, and update frequencies |
| 3 | **Index formula** | Mathematical formula for APIx = weighted median of source prices |
| 4 | **Quality scoring** | How source reliability is scored (freshness, CAPTCHA pass rate, TDS compliance) |
| 5 | **Adjustment factors** | Lead-time, cabin-class, and fare-class adjustments applied |
| 6 | **Visual diagram** | Architecture diagram (SVG) showing data flow from sources → scraper → index engine → API |
| 7 | **FAQ accordion** | Collapsible Q&A section |

### Visual Layout

- Long-form scrollable page with section headings, diagrams, and code/math blocks.
- Left sidebar navigation (TOC).

---

## 8. Backtest

| File | `src/pages/BacktestPage.tsx` |
|------|-------------------------------|

**Purpose:** Historical backtesting framework — re-runs the APIx model over past periods to measure predictive accuracy.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Backtest configuration** | Select date range, model version, and granularity (daily / weekly) |
| 2 | **Run backtest button** | Triggers simulation (mock) |
| 3 | **Results table** | Per-route metrics: MAE (Mean Absolute Error), RMSE, MAPE, R² |
| 4 | **Error distribution chart** | Histogram of prediction errors |
| 5 | **Scatter plot (predicted vs actual)** | Perfect-prediction line + scatter of model outputs |
| 6 | **Route drill-down** | Click a route in the table to see its individual backtest chart |
| 7 | **Model version selector** | Compare results across different APIx model versions |
| 8 | **Export CSV** | Download backtest results as CSV |

### Visual Layout

- Configuration panel at top.
- Results summary stats (MAE, RMSE, MAPE) as KPI cards.
- Charts + table below.

---

## 9. Compliance

| File | `src/pages/CompliancePage.tsx` |
|------|--------------------------------|

**Purpose:** Monitors scraper compliance with target websites — CAPTCHA rates, Terms of Service adherence, rate-limiting.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Compliance scorecard** | Per-source health: CAPTCHA rate, TDS violation count, avg response time |
| 2 | **CAPTCHA rate gauge** | Visual indicator (coloured bar) of CAPTCHA encounter rate per source |
| 3 | **TDS violations table** | List of detected Terms of Service violations with severity |
| 4 | **Rate-limit monitor** | Requests-per-minute vs. configured throttle ceiling |
| 5 | **Route before/after comparison** | `KeyValue` blocks showing: "Route before: Scrapy" → "Route after: Amadeus Self-Service" with tone badges |
| 6 | **Historical trend** | Line chart of compliance score over time per source |
| 7 | **Alerts list** | Recent compliance alerts / warnings |
| 8 | **Source filtering** | Filter by individual GDS / OTA source |

### Visual Layout

- Scorecard grid at top.
- Charts + tables below.
- Route comparison callout blocks.

---

## 10. Health

| File | `src/pages/HealthPage.tsx` |
|------|-----------------------------|

**Purpose:** Real-time API and scraper health monitoring — latency, error rates, uptime.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Uptime indicators** | Per-source status: healthy / degraded / down (colour-coded) |
| 2 | **Latency chart** | Line chart of p95/p99 response latency per source over time |
| 3 | **Error rate chart** | Line chart of HTTP 4xx/5xx rates per source |
| 4 | **Request volume chart** | Bar or line chart of requests per minute |
| 5 | **Source health table** | Columns: source name, uptime %, avg latency, error rate, last check |
| 6 | **Refresh cadence** | Auto-refresh every N seconds (configurable) |
| 7 | **Time range** | 1h / 6h / 24h / 7d presets |
| 8 | **Alert threshold config** | Set latency / error-rate thresholds that trigger alerts |

### Visual Layout

- Health status row (coloured badges).
- Charts grid (latency, error rate, volume).
- Detail table below.

---

## 11. Quotes

| File | `src/pages/QuotesPage.tsx` |
|------|-----------------------------|

**Purpose:** Latest fare quotes pulled from all sources, displayed as a sortable/filterable table with per-route detail.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Quotes table** | Columns: route, date, cabin, source, fare, currency, APIx delta, fetched-at |
| 2 | **Route filter** | Filter by origin, destination, or both |
| 3 | **Date filter** | Filter by travel date range |
| 4 | **Source filter** | Filter by GDS / OTA source |
| 5 | **Cabin filter** | Economy / Premium Economy / Business / First |
| 6 | **Sort** | Click column headers to sort by fare, date, etc. |
| 7 | **Row expansion** | Click a row to expand and see full quote details + booking URL |
| 8 | **APIx delta column** | Shows how each quote compares to the computed index (above/below) with colour |
| 9 | **Refresh button** | Manually trigger fresh scrape for selected route |
| 10 | **Export** | Download filtered quotes as CSV |

### Visual Layout

- Filter toolbar at top.
- Data table (virtualised if many rows).
- Expandable rows for detail view.

---

## 12. Anomaly

| File | `src/pages/AnomalyPage.tsx` |
|------|------------------------------|

**Purpose:** Detects and displays anomalous fare movements — sudden spikes/drops that deviate from the expected pattern.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Anomaly chart** | Line chart of APIx with shaded anomaly regions |
| 2 | **Anomaly list** | Table of detected anomalies: date, route, direction (spike/drop), magnitude, probable cause |
| 3 | **Severity levels** | Low / Medium / High / Critical colour coding |
| 4 | **Threshold tuning** | Sliders to adjust z-score / IQR thresholds for anomaly detection |
| 5 | **Route selector** | Focus on a specific O&D pair |
| 6 | **Date range** | 7d / 30d / 90d presets |
| 7 | **Cause labels** | Auto-tagged probable causes (seasonal, demand shock, error, etc.) |
| 8 | **Dismiss / Acknowledge** | Mark anomalies as reviewed |

### Visual Layout

- Chart area with anomaly bands highlighted.
- Anomaly table below with severity badges.

---

## 13. API Reference

| File | `src/pages/ApiPage.tsx` |
|------|--------------------------|

**Purpose:** Live interactive API explorer — select an endpoint, hit Send, inspect the real JSON response. Falls back to mock data when the backend is down so the page always works.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Endpoint browser** | Collapsible tag groups (Auth, Index, Sectors, Quotes, Validation, Health, Compliance, Anomalies, Forecast, Analysis, Methodology, Scraper, Reports, Exchange, Reference, Pipeline, Admin) |
| 2 | **Live request execution** | Sends real HTTP requests to `localhost:8000/api/v1` with JWT auth; falls back to simulated data if backend is unreachable |
| 3 | **Response viewer** | Syntax-highlighted JSON with dark-theme colours (keys, strings, numbers, booleans) |
| 4 | **Status + timing** | HTTP status badge (colour-coded) and response time in ms |
| 5 | **Copy / Download** | One-click copy to clipboard or download as `.json` file |
| 6 | **Query parameter inputs** | Editable inputs per endpoint (e.g. `origin`, `destination`, `frequency`, `horizon`) |
| 7 | **Curl example** | Auto-generated `curl` snippet per endpoint |
| 8 | **Mock mode indicator** | Stat tile and callout showing whether responses are live or simulated |
| 9 | **Endpoint count stats** | Total endpoints, tag count, admin-only count |
| 10 | **Admin warnings** | Admin endpoints flagged with lock icon and warning callout |

### Visual Layout

- Left sidebar: collapsible endpoint tree grouped by tag (~37 endpoints).
- Right panel: endpoint detail with Send button, params, curl example, and response viewer.
- Top: stat tiles (endpoints, tags, admin-only, mock mode).

---

## 14. Forecast

| File | `src/pages/ForecastPage.tsx` |
|------|-------------------------------|

**Purpose:** Price forecasting using time-series models — projects the APIx index into the future.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Forecast chart** | `ComposedChart` showing historical APIx (solid line) + forecasted values (dashed line) |
| 2 | **Confidence bands** | Shaded area showing upper / lower confidence intervals |
| 3 | **Horizon selector** | Choose forecast horizon: 7d, 14d, 30d, 90d |
| 4 | **Model selector** | Prophet / ARIMA / naive baseline |
| 5 | **Route selector** | Pick which O&D pair to forecast |
| 6 | **Metrics** | MAPE on the hold-out period displayed as stat cards |
| 7 | **Regressor toggles** | Optionally include/exclude lead-time and seasonality regressors |
| 8 | **Scenario overlays** | "Bull / Base / Bear" scenario lines with user-adjustable assumptions |

### Visual Layout

- Forecast chart (wide).
- Configuration panel (sidebar or top bar).
- Metrics cards below.

---

## 15. Design System

| File | `src/pages/DesignSystemPage.tsx` |
|------|-----------------------------------|

**Purpose:** Live documentation of the internal component library — primitives, tokens, and chart components.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Color tokens** | Grid of all CSS custom properties (`--vm-bg`, `--vm-fg`, `--vm-accent`, etc.) with hex values |
| 2 | **Typography scale** | Display of font sizes, weights, and families used |
| 3 | **Spacing scale** | Visual representation of the spacing/sizing system (`rounded-control`, `gap-*`) |
| 4 | **Button variants** | Primary, secondary, ghost, destructive — all sizes |
| 5 | **Input variants** | Text, select, checkbox, toggle switches |
| 6 | **Badge / tag variants** | Status badges with tone colours (good / warn / neutral / critical) |
| 7 | **Card / panel variants** | Surface levels (bg-surface, bg-surface-2, bg-surface-inset) |
| 8 | **Chart components** | Live demos of `IndexBandChart`, `MultiLine`, `StackedArea`, `ScatterFit`, `DivergingBar` with mock data |
| 9 | **Icon reference** | Grid of all Phosphor icons used in the app |
| 10 | **Animation tokens** | Duration, easing, transition tokens |

### Visual Layout

- Scrollable single-page with sections for each category.
- Each section has a title, description, and live rendered examples.

---

## 16. Scraper Architecture

| File | `src/pages/ScraperArchPage.tsx` |
|------|----------------------------------|

**Purpose:** Visual architecture diagram and monitoring dashboard for the web-scraping pipeline.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Architecture diagram** | SVG diagram showing: Sources → Scrapers → Parsers → Index Engine → API |
| 2 | **Pipeline stages** | Each stage labelled: `Fetch`, `Parse`, `Validate`, `Store`, `Index` |
| 3 | **Node status** | Each pipeline node shown as a coloured block (green = healthy, red = down) |
| 4 | **Throughput chart** | Line chart of scrape throughput (pages/minute) per source |
| 5 | **Success rate chart** | Line chart of scrape success rate over time |
| 6 | **Source cards** | Per-source cards showing: last run status, pages scraped, avg latency, error count |
| 7 | **Refresh cadence config** | Set how often each source is scraped |
| 8 | **Run now button** | Manually trigger a scrape cycle |
| 9 | **Log viewer** | Tail of recent scraper log output with severity colouring |
| 10 | **Queue depth** | Current scrape queue depth per source |

### Visual Layout

- Architecture diagram centered at top.
- Source cards in a grid below.
- Charts in a row below cards.
- Log viewer at the bottom.

---

## 17. Reports

| File | `src/pages/ReportsPage.tsx` |
|------|------------------------------|

**Purpose:** Generate, schedule, and export analytical reports (PDF / CSV) on fare data.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Report templates** | Pre-built templates: Weekly Market Summary, Route Analysis, Source Comparison, Anomaly Digest |
| 2 | **Custom report builder** | Select sections, date range, routes, and sources to include |
| 3 | **Generate button** | Triggers report generation (mock) |
| 4 | **Preview pane** | Shows a rendered preview of the report before export |
| 5 | **Export formats** | PDF (via print) and CSV download |
| 6 | **Scheduled reports** | Set up recurring reports (daily / weekly / monthly) |
| 7 | **Report history** | Table of previously generated reports with download links |
| 8 | **Section toggles** | Include/exclude: summary stats, charts, raw data tables |
| 9 | **Email delivery** | Option to email the report to stakeholders (mock) |

### Visual Layout

- Template cards in a grid.
- Configuration form.
- Preview pane on the right.
- History table at the bottom.

---

## 18. Scraper Config

| File | `src/pages/ScraperConfigPage.tsx` |
|------|------------------------------------|

**Purpose:** Configure per-source scraper settings — URLs, selectors, throttles, and proxy settings.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Source list** | All configured scraper sources listed with status badges |
| 2 | **Add / Edit source** | Form to configure a new scraper source |
| 3 | **Base URL** | Target website URL for the scraper |
| 4 | **CSS selectors** | Fare price selector, cabin selector, date selector, route selector |
| 5 | **Throttle settings** | Requests per minute, delay between requests, jitter |
| 6 | **Proxy config** | Proxy host/port per source |
| 7 | **Headers config** | Custom HTTP headers (User-Agent, Accept, etc.) |
| 8 | **CAPTCHA handling** | Enable/disable CAPTCHA solving, provider selection |
| 9 | **Schedule config** | Cron-like schedule for when this source is scraped |
| 10 | **Test scraper button** | Runs a one-off scrape to validate the config |
| 11 | **Config import/export** | Export config as JSON, import from JSON |
| 12 | **Validation feedback** | Real-time validation of CSS selectors with preview |

### Visual Layout

- Source list on the left sidebar.
- Configuration form in the main panel.
- Test results / validation feedback inline.

---

## 19. Sectors

| File | `src/pages/SectorsPage.tsx` |
|------|------------------------------|

**Purpose:** Sector-wide fare analysis — aggregate trends by aviation sector (domestic, international, regional, LCC vs. FSC).

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Sector selector** | Choose sector: Domestic, International, Regional, LCC, FSC |
| 2 | **Sector trend chart** | `MultiLine` chart showing average fare index per sector over time |
| 3 | **Sector comparison table** | Side-by-side comparison of sectors: avg fare, change %, route count |
| 4 | **Route breakdown** | Drill-down to see individual routes within a sector |
| 5 | **Top routes** | "Top 5 most expensive" and "Top 5 cheapest" routes within the sector |
| 6 | **Heatmap (sector)** | Heatmap of fares within the selected sector |
| 7 | **Share chart** | Stacked area showing each source's contribution to the sector index |

### Visual Layout

- Sector selector chips at top.
- Trend chart (wide).
- Comparison table + top/bottom routes below.

---

## 20. Model Management

| File | `src/pages/ModelManagementPage.tsx` |
|------|--------------------------------------|

**Purpose:** ML model lifecycle management — register, version, deploy, and monitor forecasting / classification models.

### Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Model registry** | Table of all registered models with name, version, status, accuracy |
| 2 | **Model status badges** | `STATUS_TONE`: training / staging / production / deprecated (good/warn/neutral/critical) |
| 3 | **Register new model** | Form to upload / register a new model version |
| 4 | **Version comparison** | Side-by-side comparison of two model versions |
| 5 | **Deploy / Rollback** | Actions to promote a model to production or roll back |
| 6 | **Performance metrics** | Per-model: MAE, RMSE, MAPE, R², inference latency |
| 7 | **Drift monitor** | Chart showing prediction drift over time |
| 8 | **Feature importance** | Bar chart of feature importances for the current production model |
| 9 | **A/B test panel** | Run A/B test between two model versions, show results |
| 10 | **Model card** | Detailed view for a model: training data, hyperparameters, evaluation results |

### Visual Layout

- Model registry table (full width).
- Performance cards above the table.
- Detail / comparison panels as modals or expanded rows.

---

## Shared UI Components (used across pages)

| Component | File | Purpose |
|-----------|------|---------|
| `StatTile` | `src/ds/StatTile.tsx` | KPI card with label, value, and optional trend arrow |
| `IndexBandChart` | `src/ds/charts.tsx` | Line chart with 95 % confidence band + event markers |
| `MultiLine` | `src/ds/charts.tsx` | Multi-series line chart with optional bands/dots |
| `StackedArea` | `src/ds/charts.tsx` | Stacked area chart (absolute or percent) |
| `ScatterFit` | `src/ds/charts.tsx` | Scatter plot with least-squares fitted line |
| `DivergingBar` | `src/ds/charts.tsx` | Diverging horizontal bar chart |
| `ChartTip` | `src/ds/charts.tsx` | Shared Recharts tooltip component |
| `Heatmap` | `src/ds/Heatmap.tsx` | Calendar heatmap component |
| `KeyValue` | `src/ds/primitives.tsx` | Key-value display pair |
| `Legend` | `src/ds/primitives.tsx` | Legend component for charts |
| `Callout` | `src/ds/primitives.tsx` | Info/warning/error callout banner |

---

## Screenshots

All screenshots are stored in `frontend/screenshots/`:

| # | File | Route |
|---|------|-------|
| 1 | `01-login.png` | `/login` |
| 2 | `02-dashboard.png` | `/` |
| 3 | `03-heatmap.png` | `/heatmap` |
| 4 | `04-elasticity.png` | `/elasticity` |
| 5 | `05-cross-check.png` | `/cross-check` |
| 6 | `06-decomposition.png` | `/decomposition` |
| 7 | `07-methodology.png` | `/methodology` |
| 8 | `08-backtest.png` | `/backtest` |
| 9 | `09-compliance.png` | `/compliance` |
| 10 | `10-health.png` | `/health` |
| 11 | `11-quotes.png` | `/quotes` |
| 12 | `12-anomaly.png` | `/anomaly` |
| 13 | `13-api.png` | `/api` |
| 14 | `14-forecast.png` | `/forecast` |
| 15 | `15-design-system.png` | `/design-system` |
| 16 | `16-scraper.png` | `/scraper` |
| 17 | `17-reports.png` | `/reports` |
| 18 | `18-scraper-config.png` | `/scraper-config` |
| 19 | `19-sectors.png` | `/sectors` |
| 20 | `20-model-management.png` | `/model-management` |

---

*Generated by reviewing `src/pages/*.tsx` source code and `src/ds/*` component library. Screenshots captured via Playwright (1440×900, full page).*
