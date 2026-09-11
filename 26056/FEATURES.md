# APIx · Feature Inventory & Gap Analysis

> Generated from source review of `26056/frontend/src/` — September 2026
> Problem Statement ID 26056 · MoSPI / DIID · Smart Automation

---

## 1 · Features Present (implemented or scaffolded)

### A · Data Collection Layer

| Feature | Status | File / Notes |
|---|---|---|
| Source registry (12 sources) | ✅ Scaffolded | `data/sources.ts` — IndiGo, Air India, Akasa, SpiceJet, Air India Express, MMT, Yatra, EaseMyTrip, Cleartrip, Ixigo, Goibibo, OTA partner |
| Per-source throttle & rate-limit | ✅ UI present | `ScraperConfigPage.tsx` — throttle slider, retry count, delay config |
| Kill-switch per source | ✅ UI present | `ScraperConfigPage.tsx` — toggle ARMED / DISARMED |
| Scheduling (cron) | ✅ UI present | `ScraperConfigPage.tsx` — daily 06:00 IST default, full cron expression editor |
| JS-rendered page handling | 🔶 Mentioned | `ScraperArchPage.tsx` — Playwright engine noted in architecture |
| CAPTCHA detection & auto-pause | ✅ UI listed | `ScraperArchPage.tsx` — anti-bot rule #3 |
| IP rotation & proxy pool | ✅ UI listed | `ScraperArchPage.tsx` — anti-bot rule #4 |
| Session & cookie management | ✅ UI listed | `ScraperArchPage.tsx` — anti-bot rule #5 |
| robots.txt compliance | ✅ UI listed | `ScraperArchPage.tsx` — anti-bot rule #1, re-validation on deploy |
| Ethical-scraping safeguards | ✅ 10 rules | `ScraperArchPage.tsx` — full compliance card |
| Architecture diagram | ✅ Built | `ScraperArchPage.tsx` — 5-layer visual |

### B · Data Pipeline & Storage

| Feature | Status | File / Notes |
|---|---|---|
| Raw payload ingestion | ✅ UI scaffolded | `ScraperConfigPage.tsx` — payload table with metadata |
| 5-stage pipeline (fetch→parse→clean→normalise→index) | ✅ Visual | `ScraperArchPage.tsx` — timeline with per-stage timings |
| Outlier removal (3-sigma) | ✅ Mentioned | `ScraperArchPage.tsx` — quality gate card |
| Duplicate detection | ✅ Mentioned | `ScraperArchPage.tsx` — quality gate |
| Fare-component split (base / taxes / UDF / convenience) | ✅ Mentioned | `ScraperArchPage.tsx` |
| Sold-out & cancellation handling | ✅ Mentioned | `ScraperArchPage.tsx` |
| Missing-value imputation | ✅ Mentioned | `ScraperArchPage.tsx` |
| 30-day back-test validation | ✅ UI + data | `BacktestPage.tsx` — scatter plot + RMSE/MAE/MAPE stats |
| Data quality gate | ✅ UI present | `ScraperConfigPage.tsx` — quality-gate panel |

### C · Index Construction

| Feature | Status | File / Notes |
|---|---|---|
| PSD formula implementation | 🔶 Mentioned | `IndexPage.tsx` — formula card shown |
| Daily / weekly / monthly frequencies | ✅ UI present | `IndexPage.tsx` — frequency tabs |
| City-pair basket (24 sectors) | ✅ Data present | `data/reference.ts` — `SECTORS` array |
| Advance-purchase windows (T+1, T+7, T+15, T+30, T+45) | ✅ Mentioned | `data/reference.ts` / `data/generate.ts` |
| Sector weights (DGCA passenger-traffic derived) | ✅ Mentioned | `MethodologyPage.tsx` |
| Index value + YoY inflation | ✅ KPI | `DashboardPage.tsx` — KPI strip |
| Sector heatmap | ✅ Built | `IndexPage.tsx` — interactive grid |
| Lead-time elasticity curves | ✅ Built | `ElasticityPage.tsx` — multi-series chart + table |

### D · Dashboard & Visualisation

| Feature | Status | File / Notes |
|---|---|---|
| Dashboard home (KPI strip) | ✅ Built | `DashboardPage.tsx` |
| System health callout | ✅ Built | `DashboardPage.tsx` |
| Sector overview table | ✅ Built | `DashboardPage.tsx` |
| Index page (90-day chart) | ✅ Built | `IndexPage.tsx` |
| Frequency selector (daily / weekly / monthly) | ✅ Built | `IndexPage.tsx` |
| Anomaly detection | ✅ Built | `AnomalyPage.tsx` — deviation chart + event table |
| Forecast (7 / 14 / 30 day) | ✅ Built | `ForecastPage.tsx` — chart + table + festival impact |
| Backtest results | ✅ Built | `BacktestPage.tsx` — scatter + metrics |
| Elasticity analysis | ✅ Built | `ElasticityPage.tsx` |
| Methodology & PSD formula explainer | ✅ Built | `MethodologyPage.tsx` |
| Scraper architecture diagram | ✅ Built | `ScraperArchPage.tsx` |
| Scraper configuration (per-source) | ✅ Built | `ScraperConfigPage.tsx` |
| Health / uptime monitoring | ✅ Built | `HealthPage.tsx` |
| Reports (PDF / HTML) | ✅ UI scaffolded | `ReportsPage.tsx` — templates, download buttons |
| Responsive layout with sidebar nav | ✅ Built | `App.tsx`, `nav.ts`, `Layout.tsx` |

### E · API & Export

| Feature | Status | Notes |
|---|---|---|
| REST API for NSO / RBI consumption | 🔶 Mentioned | Methodology text references it; no endpoint implementation yet |
| CSV / JSON export | ✅ Scaffolded | `lib/download.ts` — `downloadCsv`, `downloadJson` used in Reports |
| PDF report generation | 🔶 Mentioned | `ReportsPage.tsx` UI exists; backend generation pending |

---

## 2 · Features Missing or Incomplete (improvement roadmap)

### Critical gaps (judges will notice these)

| # | Gap | Why it matters | Estimated effort |
|---|---|---|---|
| 1 | **No real scraping backend** — everything is synthetic | The whole premise is automated data collection | 2–3 days for a PoC Python scraper |
| 2 | **No database layer** — data is generated on-the-fly | Needs Postgres / TimescaleDB for historical storage | 1 day schema + seed |
| 3 | **No API server** — frontend-only | NSO/RBI need an API endpoint to consume the index | 1–2 days FastAPI |
| 4 | **No authentication / RBAC** | Judges will ask who can change scraper settings | 4–6 hrs |
| 5 | **No real CAPTCHA solver** | Anti-bot rules are listed but not implemented | 1 day (2Captcha / Anti-Captcha integration) |

### Important gaps

| # | Gap | Notes |
|---|---|---|
| 6 | **ErrorPage.tsx missing** | ForecastPage imports `ErrorPage`; nav may reference it |
| 7 | **MultiLine `xFormat` prop type** | Some pages pass `string`; component accepts `string \| number` — fix needed |
| 8 | **TrendUp import unused in DashboardPage** | DashboardPage imports TrendUp but uses TrendingDown only |
| 9 | **No alerting / notification system** | Slack / email alerts on scrape failures would impress |
| 10 | **No user-facing settings page** | Users can't change email, timezone, etc. |
| 11 | **Reports generation is UI-only** | Backend PDF generation (WeasyPrint / Playwright PDF) needed |
| 12 | **No multi-language support** | Hindi / regional language labels would help for MoSPI audience |
| 13 | **No data-download-as-CSV from index chart** | Only report-level export exists |
| 14 | **No comparison tool** | Compare APIx vs DGCA published fares side-by-side |

### Nice-to-have

| # | Gap | Notes |
|---|---|---|
| 15 | Dark mode toggle | Already has ThemeContext; toggle UI missing |
| 16 | Mobile app / PWA | Dashboard is responsive but not installable |
| 17 | Role-based dashboard customisation | Admin vs analyst vs public views |
| 18 | A11y audit | ARIA labels, keyboard nav, screen-reader testing |

---

## 3 · Quick-win improvements to add before demo

These can be added in a single parallel session:

1. **Fix the two TypeScript warnings** (TrendUp import, ErrorPage)
2. **Add a "Live Scrape" animation button** in ScraperConfig — when clicked, show a progress
   animation with fake source names flashing green as they "complete"
3. **Add a "Last updated" ticking clock** in the Dashboard header
4. **Add a "Compare with DGCA" toggle** on the Index page — overlays a DGCA average line
5. **Add a data-freshness ring** (circular progress) next to each source in the registry
6. **Add an "API Playground" mini-page** — a curl-command box that shows a sample API response
   (hard-coded JSON, but looks real)
7. **Add a team / about modal** with team names, college, problem ID

---

*End of feature inventory.*
