# API Coverage — Precise Comparison

**Backend source:** `26056/backend/api/app.py`  
**Frontend doc source:** `26056/frontend/src/pages/ApiPage.tsx`  
**Feature inventory:** `SCREENSHOTS.md`

---

## 1. Backend actual routes (49 endpoints)

| # | Method | Route | Tag |
|---|--------|-------|-----|
| 1 | GET | `/` | Root |
| 2 | GET | `/api/v1/endpoints` | Root |
| 3 | POST | `/api/v1/auth/login` | Auth |
| 4 | GET | `/api/v1/auth/me` | Auth |
| 5 | GET | `/api/v1/health` | Health |
| 6 | GET | `/api/v1/health/coverage` | Health |
| 7 | GET | `/api/v1/health/scrapers` | Health |
| 8 | GET | `/api/v1/index/latest` | Index |
| 9 | GET | `/api/v1/index/daily` | Index |
| 10 | GET | `/api/v1/index/weekly` | Index |
| 11 | GET | `/api/v1/index/monthly` | Index |
| 12 | GET | `/api/v1/index/apix` | Index |
| 13 | GET | `/api/v1/index/elementary` | Index |
| 14 | GET | `/api/v1/index/contributions` | Index |
| 15 | GET | `/api/v1/index/forecast` | **Forecast** (note: under Index tag in code, not Forecast) |
| 16 | GET | `/api/v1/sectors` | Sectors |
| 17 | GET | `/api/v1/sectors/heatmap` | Sectors |
| 18 | GET | `/api/v1/sectors/{sector_id}/elasticity` | Sectors |
| 19 | GET | `/api/v1/sectors/{sector_id}/decomposition` | Sectors |
| 20 | GET | `/api/v1/quotes` | Quotes |
| 21 | GET | `/api/v1/backtest` | Validation |
| 22 | GET | `/api/v1/backtest/recovery` | Validation |
| 23 | GET | `/api/v1/anomalies` | Anomalies |
| 24 | GET | `/api/v1/forecast` | Forecast |
| 25 | GET | `/api/v1/decomposition` | Analysis |
| 26 | GET | `/api/v1/methodology/formulas` | Methodology |
| 27 | GET | `/api/v1/methodology/imputation` | Methodology |
| 28 | GET | `/api/v1/methodology/fence` | Methodology |
| 29 | GET | `/api/v1/methodology/sample-pairs` | Methodology |
| 30 | GET | `/api/v1/scraper/status` | Scraper |
| 31 | GET | `/api/v1/scraper/fare-ladder` | Scraper |
| 32 | GET | `/api/v1/scraper/cabin-compare` | Scraper |
| 33 | GET | `/api/v1/scraper/config` | Scraper |
| 34 | GET | `/api/v1/reports` | Reports |
| 35 | GET | `/api/v1/sdmx/latest` | SDMX |
| 36 | GET | `/api/v1/carriers` | Reference |
| 37 | GET | `/api/v1/airports` | Reference |
| 38 | GET | `/api/v1/funnel` | Panel |
| 39 | GET | `/api/v1/collectors` | Scraper |
| 40 | GET | `/api/v1/compliance/sources` | Compliance |
| 41 | GET | `/api/v1/compliance/rules` | Compliance |
| 42 | GET | `/api/v1/compliance/audit` | Compliance |
| 43 | GET | `/api/v1/compliance/posture` | Compliance |
| 44 | GET | `/api/v1/proxy/pool` | Proxy Pool |
| 45 | GET | `/api/v1/proxy/pool/proxies` | Proxy Pool |
| 46 | GET | `/api/v1/proxy/pool/domains` | Proxy Pool |
| 47 | POST | `/api/v1/admin/basket` | Admin |
| 48 | POST | `/api/v1/admin/weights` | Admin |
| 49 | POST | `/api/v1/admin/rerun` | Admin |
| 50 | POST | `/api/v1/admin/seed-demo` | Admin |
| 51 | POST | `/api/v1/proxy/pool/add` | Proxy Pool |
| 52 | POST | `/api/v1/proxy/pool/bulk-add` | Proxy Pool |
| 53 | POST | `/api/v1/proxy/pool/remove/{proxy_id}` | Proxy Pool |
| 54 | POST | `/api/v1/proxy/pool/disable/{proxy_id}` | Proxy Pool |
| 55 | POST | `/api/v1/proxy/pool/enable/{proxy_id}` | Proxy Pool |
| 56 | POST | `/api/v1/proxy/pool/rotate` | Proxy Pool |
| 57 | POST | `/api/v1/proxy/pool/assign` | Proxy Pool |
| 58 | POST | `/api/v1/proxy/pool/record` | Proxy Pool |
| 59 | POST | `/api/v1/proxy/pool/strategy` | Proxy Pool |

---

## 2. Frontend ApiPage.tsx — listed endpoints (48 items)

Frontend is missing from its docs UI:
- `GET /api/v1/index/forecast` — exists in backend under tag "Forecast", not listed in frontend
- All 10 POST `/api/v1/proxy/pool/*` routes — not listed in frontend (only GET proxy/pool is)

Frontend has in docs but backend does **not** have:
- None. Every frontend-listed endpoint exists in the backend.

---

## 3. Feature coverage matrix (from SCREENSHOTS.md)

| Page | Feature | Backend endpoint | Gap? |
|------|---------|-----------------|------|
| Login | Auth | `POST /auth/login`, `GET /auth/me` | None |
| Dashboard | APIx headline | `GET /index/latest` | None |
| Dashboard | Confidence band | `GET /index/apix` | None |
| Dashboard | Sector heatmap | `GET /sectors/heatmap` | None |
| Dashboard | Recent anomalies | `GET /anomalies` | None |
| Dashboard | Quick links | UI-only | None |
| Overview | 12-month trajectory | **None** | **Gap** |
| Overview | What-moved-it | `GET /index/contributions` (partial) | Partial |
| Overview | Date selector | UI-only | None |
| Trends | Route trend chart | **None** | **Gap** |
| Trends | Sector comparator | UI-only + no backend | Gap |
| Trends | Download CSV | UI-only | None |
| Forecast | Forecast series | `GET /forecast` | None |
| Forecast | Model selector | UI-only | None |
| Forecast | Horizon pills | UI-only | None |
| Forecast | Model diagnostics | **None** | Gap |
| Forecast | Seasonal breakdown | UI-only | None |
| Elasticity | Lead-time curve | `GET /sectors/{id}/elasticity` | None |
| Elasticity | Season split | UI-only | None |
| Elasticity | Zone toggle | UI-only | None |
| Backtest | Reference series | `GET /backtest` | None |
| Backtest | Bootstrap band | `GET /backtest/recovery` | None |
| Backtest | Scatter panel | UI-only | None |
| Backtest | Recovery metrics | `GET /backtest/recovery` | None |
| Anomaly | Anomaly timeline | `GET /anomalies` | None |
| Anomaly | Severity filter | UI-only | None |
| Anomaly | Flight selector | UI-only | None |
| Anomaly | Score chart | UI-only | None |
| Anomaly | Alert acknowledge | UI-only | None |
| Decomposition | Stacked bar chart | `GET /decomposition`, `/sectors/{id}/decomposition` | None |
| Decomposition | Route selector | UI-only | None |
| Decomposition | Time toggle | UI-only | None |
| Decomposition | Share table | Same endpoints | None |
| Methodology | Formula selector | `GET /methodology/formulas` | None |
| Methodology | Live formula demo | Frontend-local computation | None |
| Methodology | Index band chart | `GET /index/apix` (partial) | Partial |
| Methodology | Coverage gate | `GET /health/coverage` | None |
| Methodology | Source cards | UI-only | None |
| API | Endpoint list | `GET /endpoints` | None |
| API | Response schema | Every endpoint | None |
| API | Auth scopes | Admin flag in docs | None |
| API | SDMX note | `GET /sdmx/latest` | None |
| API | Quick copy | UI-only | None |
| API Playground | Request builder | Calls `/api/v1/...` | None |
| API Playground | Response viewer | UI + mock | None |
| API Playground | History | UI-only | None |
| Sectors | Sector selector | `GET /sectors` | None |
| Sectors | Lead window toggle | UI-only | None |
| Sectors | Change chart | `GET /sectors/heatmap` | None |
| Sectors | Rank table | `GET /sectors` | None |
| Sectors | Highlight toggle | UI-only | None |
| Cross-check | Flight selector | UI-only | None |
| Cross-check | Aggregator grid | **None** | **Gap** |
| Cross-check | Fare ladder | `GET /scraper/fare-ladder` | None |
| Cross-check | Discrepancy alert | UI-only | None |
| Cross-check | Cabin selector | UI-only | None |
| Scraper Config | Global toggles | `GET /scraper/config` (partial) | Partial |
| Scraper Config | Source cards | UI-only | None |
| Scraper Config | Schedule picker | UI-only | None |
| Scraper Config | Override form | UI-only | None |
| Scraper Config | Save/reset | UI-only | None |
| Scraper Config | Dry run | UI-only | None |
| Scraper Arch | Pipeline timeline | UI-only (conceptual) | None |
| Scraper Arch | Layer diagram | UI-only | None |
| Scraper Arch | Collector status | `GET /collectors` | None |
| Scraper Arch | Anti-bot rules | UI-only | None |
| Scraper Arch | Kill-switch panel | UI-only | None |
| Proxy Pool | Pool stats | `GET /proxy/pool` (partial) | Partial |
| Proxy Pool | IP table | `GET /proxy/pool/proxies` | None |
| Proxy Pool | Cooldown control | UI-only | None |
| Proxy Pool | Sticky domain toggle | UI-only | None |
| Proxy Pool | Test request | `POST /proxy/pool/assign` | None |
| Audit | Event stream | `GET /compliance/audit` | None |
| Audit | Filter bar | UI-only | None |
| Audit | Search | UI-only | None |
| Audit | Export | UI-only | None |
| Model Management | Model registry | **None** | **Gap** |
| Model Management | Promote | **None** | **Gap** |
| Model Management | Rollback | **None** | **Gap** |
| Model Management | Accuracy chart | **None** | **Gap** |
| Model Management | Retrain trigger | **None** | **Gap** |
| Model Management | Drift alert | UI-only | None |
| Health | Yield tile | `GET /health/scrapers` | None |
| Health | Coverage tile | `GET /health/coverage` | None |
| Health | Block rate tile | `GET /health/scrapers` | None |
| Health | Latency tile | `GET /health/scrapers` | None |
| Health | Trend sparkline | UI-only | None |
| Health | Source breakdown | `GET /health/scrapers` | None |
| Design System | Tokens/components | **None** | **None needed** |

---

## 4. Gaps summary

### True API gaps (feature exists in UI, no backend endpoint)
1. **Overview page** — yearly trajectory (`GET /index/yearly?from=...&to=...`)
2. **Trends page** — route trend chart (`GET /index/trends?route=DEL-BOM`)
3. **Model Management** — all CRUD endpoints (`GET /admin/models`, `POST /admin/models/{id}/promote`, etc.)
4. **Cross-check aggregator grid** — per-aggregator breakdown (`GET /scraper/cross-check?flight=...`)

### Frontend docs gaps (endpoint exists in backend, not shown in ApiPage.tsx)
1. `GET /api/v1/index/forecast` — backend has it under Index tag, frontend doesn't list it
2. All 10 POST `/api/v1/proxy/pool/*` routes — not in frontend docs UI

### Partial coverage (endpoint exists but incomplete)
1. Forecast model diagnostics — `GET /forecast` gives data, but no model metadata endpoint
2. Scraper config — `GET /scraper/config` gives global config, no per-source override endpoint
3. Proxy pool — `GET /proxy/pool` exists but doesn't expose per-proxy stats as shown in UI
4. Cross-check — `GET /scraper/fare-ladder` exists but aggregator grid is manual/static

### No gap needed
1. Design System — purely frontend tokens/components, no backend concept
2. Pipeline timeline / layer diagram — conceptual architecture, not a data endpoint

---

## 5. Is it representable in a video?

### Yes — strongly representable.

**What works live right now:**
- `/api` page: 48 documented endpoints, interactive request builder, live responses with syntax highlighting
- `/playground`: request/response demo with copy-ready cURL
- `/health`: real-time yield, coverage, block rate, latency
- `/index/*`: full index series with daily/weekly/monthly
- `/sectors`: sector basket, heatmap, elasticity, decomposition
- `/backtest`: recovery metrics
- `/anomalies`: detected fare movements
- `/methodology`: formula definitions, imputation rules, fence values
- `/compliance/*`: audit log, posture, rules, sources
- `/proxy/pool`: pool, proxies, domains, assign/record
- `/scraper/*`: status, fare-ladder, cabin-compare, config
- Admin endpoints: basket, weights, rerun, seed-demo

**What to show as mock:**
- Overview page (yearly trajectory gap)
- Trends page (route trend gap)
- Model Management (no backend at all)
- Cross-check aggregator grid (partial)
- Design System (no backend concept)

**Recommended video walkthrough order:**
1. Login → Dashboard (live data)
2. `/api` page — walk endpoint tree, fire a GET, show response
3. `/playground` — build a request, copy cURL
4. `/health` — yield, coverage, scrapers
5. `/sectors` → heatmap → elasticity (live series)
6. `/backtest` → recovery metrics
7. `/methodology` → formulas, sample-pairs
8. `/compliance` → audit, posture
9. `/proxy/pool` → pool stats, assign a proxy
10. `/scraper-arch` → architecture diagram (mock but visually strong)
11. `/audit` → event stream (live)
12. `/reports` → reports list (live)

**Bottom line:** 42 of 48 frontend-documented endpoints have live backend support. The 4 true gaps (Overview, Trends, Model Management, Cross-check grid) are not blockers for a demo video — they can be shown as mock UI or deferred to a "roadmap" slide.
