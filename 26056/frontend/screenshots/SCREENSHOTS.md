# VIMAAN Frontend — Screenshots & Feature Inventory

## Setup snapshot

- **App title:** VIMAAN · APIx Airfare Price Index
- **Route prefix:** `/`
- **Entry:** `C:/Users/udayp/Documents/code/SIH26/26056/frontend/src/App.tsx`
- **Data layer:** `src/data/generate.ts` — mock factsheet / time series / elasticities / backtests / anomalies / decomposition / live fares / scraper config / proxy pool / audit events
- **Screenshots captured at:** `1440 × 900` via Playwright headless Chromium (`screenshot.ts`)

---

## Pages

| # | Route | File | Screenshot |
|---|-------|------|------------|
| 1 | `/login` | `src/pages/LoginPage.tsx` | `01-login.png` |
| 2 | `/` | `src/pages/DashboardPage.tsx` | `02-dashboard.png` |
| 3 | `/overview` | `src/pages/OverviewPage.tsx` | `03-overview.png` |
| 4 | `/trends` | `src/pages/TrendsPage.tsx` | `04-trends.png` |
| 5 | `/forecast` | `src/pages/ForecastPage.tsx` | `05-forecast.png` |
| 6 | `/elasticity` | `src/pages/ElasticityPage.tsx` | `06-elasticity.png` |
| 7 | `/backtest` | `src/pages/BacktestPage.tsx` | `07-backtest.png` |
| 8 | `/anomaly` | `src/pages/AnomalyPage.tsx` | `08-anomaly.png` |
| 9 | `/decomposition` | `src/pages/DecompositionPage.tsx` | `09-decomposition.png` |
| 10 | `/methodology` | `src/pages/MethodologyPage.tsx` | `10-methodology.png` |
| 11 | `/api` | `src/pages/ApiPage.tsx` | `11-api.png` |
| 12 | `/playground` | `src/pages/ApiPlaygroundPage.tsx` | `12-playground.png` |
| 13 | `/sectors` | `src/pages/SectorsPage.tsx` | `13-sectors.png` |
| 14 | `/cross-check` | `src/pages/CrossCheckPage.tsx` | `14-cross-check.png` |
| 15 | `/scraper-config` | `src/pages/ScraperConfigPage.tsx` | `15-scraper-config.png` |
| 16 | `/scraper-arch` | `src/pages/ScraperArchPage.tsx` | `16-scraper-arch.png` |
| 17 | `/proxy-pool` | `src/pages/ProxyPoolPage.tsx` | `17-proxy-pool.png` |
| 18 | `/audit` | `src/pages/AuditPage.tsx` | `18-audit.png` |
| 19 | `/model-management` | `src/pages/ModelManagementPage.tsx` | `19-model-management.png` |
| 20 | `/health` | `src/pages/HealthPage.tsx` | `20-health.png` |

---

## Page features

### 1. Login

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Role toggle | Tabs / segmented control | Switch between admin, analyst, and viewer roles |
| Username | Text input | Authentication identity |
| Password | Text input | Authentication secret |
| Submit | Button | Posts credentials to the auth context |
| Guarded nav | Route protection | Non-logged-in users cannot reach protected routes |

### 2. Dashboard (`/`)

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| APIx headline tile | StatTile | Today's headline index value with delta |
| Confidence band | MultiLine chart | 95% band around the compiled index |
| Movement attribution | Callout / badge | What moved the index today |
| Sector heatmap | Bar chart | 20 sectors, grouped by lead window |
| Recent anomaly list | Panel / table | Last flagged events |
| Quick links | Nav chips | Jump to forecast, elasticity, back-test, API |

### 3. Overview

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Published index line | MultiLine | 12-month headline trajectory |
| Band shading | Recharts area | Visual confidence envelope |
| What-moved-it panel | KeyValue / table | Top contributing sectors and weights |
| Date selector | Dropdown / pill | Change reference date |

### 4. Trends

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Route trend chart | MultiLine | 14 and 30 day ahead trend for selected route |
| Sector comparator | Toggle / checkbox | Overlay multiple routes |
| Download CSV | Action button | Export current view |

### 5. Forecast

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Forecast model selector | Dropdown | LSTM vs seasonal ARIMA |
| Horizon pills | Toggle | 14 days / 30 days ahead |
| Prediction chart | MultiLine with dots | Fitted path + forecast cone |
| Model diagnostics | Legend / callout | MAE / RMSE badges |
| Seasonal breakdown | Data table | Month-over-month seasonal factors |

### 6. Elasticity

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Lead-time curve | Line chart | Fare vs days-to-departure |
| Season split | Toggle | Peak vs off-peak |
| Zone toggle | Segmented control | Domestic vs international |
| Point tooltip | Chart tip | Exact fare and day at cursor |

### 7. Back-test

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Reference series | MultiLine | Compiled index vs injected true path |
| Bootstrap band | Area chart | 95% band from block bootstrap |
| Scatter panel | ChartScatter | Forecast vs actual residuals |
| Recovery metrics | StatTile | RMSE, bias, coverage |

### 8. Anomaly

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Anomaly timeline | Panel / table | Ranked flagged events |
| Severity filter | Dropdown | Critical / warning / info |
| Flight selector | Autocomplete | Drill to one flight |
| Score chart | Bar | Anomaly score by route |
| Alert acknowledge | Action button | Mark as reviewed |

### 9. Decomposition

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Stacked bar chart | Recharts stacked bar | Base fare / YQ fuel surcharge / UDF / GST / convenience fee |
| Route selector | Dropdown | One O&D at a time |
| Time toggle | Pill | Today vs 30-day average |
| Share table | Data table | Percentage of total by component |

### 10. Methodology

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Formula selector | Tabs / dropdown | Jevons / Dutot / Carli |
| Live formula demo | Panel with inputs | Modify sample basket and recompute |
| Index band chart | IndexBandChart | Bootstrap CI demo |
| Coverage gate | StatTile | 70% coverage threshold |
| Source cards | Info / Callout | DGCA, OAG, Radixx, Pros, GoAir, etc. |

### 11. API

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Endpoint list | Data table | Path, method, auth, description |
| Response schema | Code block | Example JSON |
| Auth scopes | Badge | reader / analyst / admin |
| SDMX note | Callout | Mapping to SDMX 2.1 |
| Quick copy | Button | Copy cURL snippet |

### 12. API Playground

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Endpoint dropdown | Select | Pick `/api/v1/...` route |
| Parameter form | Inputs | Query params and body |
| Request method | Segmented control | GET / POST / PUT / DELETE |
| Send request | Button | Calls the local backend |
| Response viewer | Code block | Status, latency, body |
| History | Panel | Last N requests |

### 13. Sectors

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Sector selector | Dropdown | 20 sectors |
| Lead window toggle | Segmented control | T+1 / T+7 / T+15 / T+30 |
| Change chart | Bar | MoM % change by sector |
| Rank table | Data table | Full sortable list |
| Highlight toggle | Switch | Show top 5 only |

### 14. Cross-check

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Flight selector | Autocomplete / dropdown | One flight at a time |
| Aggregator grid | Table | IXIGO / EaseMyTrip / MMT / Goibibo / SpiceJet / Akasa |
| Fare ladder | JSON viewer | Cheapest option from each source |
| Discrepancy alert | Callout | Delta > threshold |
| Cabin selector | Dropdown | Economy / Business |

### 15. Scraper Config

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Global toggles | Toggle switch | Rate limit, schedule, kill-switch |
| Source cards | Panel | Per-source limits, cooldown, retry count |
| Schedule picker | Time input | Daily run window |
| Override form | Form inputs | Per-domain robots.txt override |
| Save / reset | Action buttons | Persist to mock backend |
| Dry run | Action button | Test without publishing |

### 16. Scraper Architecture

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Pipeline timeline | Ordered list | Collector → Normalizer → Validator → Deduplicator → Index |
| Layer diagram | Flex / ArchLayer | Ingestion, collectors, storage, index engine |
| Collector status | Data table | Active / standby / disabled by source family |
| Anti-bot rules | Panel | robots.txt, crawl-delay, user-agent, IP rotation |
| Kill-switch panel | Toggle | Emergency stop per source |

### 17. Proxy Pool

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Pool stats | StatTile | Total, active, cooldown, banned |
| IP table | Data table | IP, port, country, last used, latency |
| Cooldown control | Slider | Minutes before reuse |
| Sticky domain toggle | Toggle | Keep same IP per domain |
| Test request | Action button | Run latency probe |

### 18. Audit

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Event stream | Data table | Timestamp, user, action, resource, IP |
| Filter bar | Inputs | User, action, date range |
| Search | Text input | Full text across event payload |
| Export | Action button | JSON / CSV download |

### 19. Model Management

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Model registry | Data table | Name, version, accuracy, status, actions |
| Promote | Action button | Staging → production |
| Rollback | Action button | Revert to previous version |
| Accuracy chart | Line / bar | Historical precision and recall |
| Retrain trigger | Action button | Kick off new training run |
| Drift alert | Callout | Data drift threshold warning |

### 20. Collection Health

| Feature | Component / Control | Purpose |
|---------|---------------------|---------|
| Yield tile | StatTile | Successful / attempted |
| Coverage tile | StatTile | Routes with data / required universe |
| Block rate tile | StatTile | 403 / 429 ratio |
| Latency tile | StatTile | p50 / p95 response time |
| Trend sparkline | Mini chart | Last 24 hours per metric |
| Source breakdown | Table | Per-source success rate |

---

## Notes

- Screenshot labels `03`-`20` reflect the current route map. The same numbers previously mapped to different pages before the route cleanup.
- Screenshots are stored under `C:\Users\udayp\Documents\code\SIH26\26056\frontend\screenshots`.
- Pages that require backend endpoints are shown with synthetic data when the backend is offline.
