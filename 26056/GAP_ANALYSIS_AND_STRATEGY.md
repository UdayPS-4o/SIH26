# VIMAAN PS 26056 — Gap Analysis & Winning Strategy

> MoSPI · Smart Automation · Software Track
> Date: 2026-09-14

---

## PART 1 — What Is Genuinely Missing from the PS Requirements

The prototype has a real backend pipeline, a real scraping infrastructure, and a real 17-page dashboard. This section distinguishes the two honest cases — (a) what runs today and (b) what only looks like it runs.

---

### A. Critical Gaps (fully missing — no code at all)

| # | PS Requirement | Current State | Gap |
|---|---|---|---|
| A1 | **HTTP API server (FastAPI / Flask)** | `backend/main.py` is a CLI script ("Called by cron at 22:00 IST"). There is no `app = FastAPI()`, no `/api/` route definitions, no `uvicorn` startup. The frontend consumes zero backend endpoints — all data is in-browser fixtures. | The "API that NSO and RBI can consume" (PS clause c) **does not exist.** |
| A2 | **Running database instance** | SQLAlchemy models exist in `backend/storage/postgres.py`. `main.py` calls `Base.metadata.create_all(engine)` but there is no PostgreSQL running, no `docker-compose.yml` to spin one up, no Alembic migrations, no `.env` with a real database URL. Default `postgresql://vimaan:vimaan@localhost:5432/apix` is hardcoded and never tested against a live DB. | The "cleaned and de-duplicated airfare database" **exists as schema only, not as data.** |
| A3 | **Automated tests** | Zero test files. No `tests/` directory, no `pytest.ini`, no `conftest.py`, no `*_test.py`. The only "test" in the repo is Playwright (browser automation, not testing). The PS explicitly requires "documentation, **automated testing**, and demonstrate at least 30 days of back-tested results." | **Tests are MISSING.** |
| A4 | **CI/CD pipeline** | No `.github/workflows/`, no `.gitlab-ci.yml`, no `azure-pipelines.yml`, no GitHub Actions, no lint/tests-on-PR automation. | **CI/CD MISSING.** |
| A5 | **Scheduler (Celery / cron / Prefect)** | `main.py` has a docstring "Called by cron at 22:00 IST". The frontend shows a `NIGHTLY_RUN` timeline. No actual scheduler is implemented: no Celery app, no Celery Beat, no crontab file, no systemd service, no Prefect flow. | **Scheduling is SIMULATED (described, not implemented).** |
| A6 | **Real DGCA monthly data integration** | `backend/collectors/api_connectors.py` — `DGCAFeedCollector` returns a single hardcoded `FareQuote(base_fare=4500.0, ...)` with a comment "In production: paramiko SFTP download, CSV parse." The frontend backtest uses a synthetic series generated from the APIx seed with a fixed offset. | **DGCA data is a stub.** No code fetches `eSankhyiki.mospi.gov.in`. |
| A7 | **30+ days of back-tested results against real DGCA data** | The frontend shows 90 days of backtest results, but they are procedurally generated from seed `26056`. The backtest metrics (correlation, RMSE, MAPE) are computed from two synthetic series. | **Backtest is simulated.** PS requires real backtesting against DGCA monthly data. |
| A8 | **30+ days of live collected data** | The entire frontend dataset is procedurally generated from seed `26056`. The comment says: "Everything the dashboard renders is produced here, from one seed, with no network access." The only real scrape is one Puppeteer run that hit Cleartrip's live API for IDR-BLR and wrote JSON fixtures. | **Dashboard data is 99% synthetic.** The PS requires real collected data over time. |
| A9 | **Airline/OTA collector coverage** | Collectors exist for: IndiGo, Air India, Akasa Air (Playwright), Cleartrip, MakeMyTrip (Scrapy), Amadeus, Duffel, DGCA (API). **Missing from PS:** SpiceJet, Air India Express, Yatra (kill-switched), EaseMyTrip, Ixigo, Goibibo. The PS explicitly names all six OTAs. | **Half the OTA sources are not implemented.** |
| A10 | **Forecast model** | `frontend/src/pages/ForecastPage.tsx` shows an LSTM + Seasonal ARIMA model, but `buildChartData()` uses `Math.sin()` + `Math.random()`. No `.pt`, `.pkl`, `.h5` model files exist. No `train.py`, no scikit-learn/TensorFlow/PyTorch in `requirements.txt`. | **Forecast is a UI mockup.** |
| A11 | **Documentation** | No `README.md`, no `ARCHITECTURE.md`, no API docs, no setup guide. The PS requires "documentation." | **Documentation MISSING.** |

---

### B. Partial Gaps (exists but broken or incomplete)

| # | PS Requirement | Current State | Gap |
|---|---|---|---|
| B1 | **Multi-source scraping (JS-rendered, CAPTCHA, IP rotation)** | Playwright/Scrapy code exists for 6 sources. No CAPTCHA handling, no IP rotation (noted as "planned"), no session management beyond basic HTTP sessions. | Partial — scraping framework exists but anti-bot defences are not implemented. |
| B2 | **Compliance (robots.txt, rate-limiting, ethical safeguards)** | Real code exists: `protego` robots.txt parser, token-bucket rate limiter, kill-switch. **However**, Yatra is on hold (`nightly_cap = 0`), DGCA is a stub, and no actual TOS posture records exist for any real airline/OTA. | Partial — infrastructure exists but no real compliance posture is recorded. |
| B3 | **Deployment** | Frontend `Dockerfile` exists (multi-stage Node + nginx). **Missing:** backend Dockerfile, `docker-compose.yml`, any deployment scripts. | Partial — frontend deployable, backend not containerised. |
| B4 | **Data cleaning (outlier removal, imputation, fare splitting)** | Real code: HB fence (`outliers.py`), dedup, schema validation, fare splitting in each collector. `cleaning/pipeline.py` is imported but the file is missing. | Partial — core logic exists but pipeline module is incomplete. |
| B5 | **Index computation (Jevons + bootstrap band)** | Real Python code in `backend/index/formulas.py` — `jevons()`, `dutot()`, `carli()`, `block_bootstrap_band()` with 10,000 resamples. Frontend reimplements all three in TypeScript. | EXISTS — genuine, not a mock. |

---

### C. Summary of What's Honest vs. Fabricated

```
HONEST (real code, real logic):
  ✅ Python scraping collectors (Playwright + Scrapy + API)
  ✅ HB outlier fence, dedup, schema validation
  ✅ Jevons/Dutot/Carli index formulas + block bootstrap
  ✅ SQLAlchemy ORM models
  ✅ robots.txt compliance layer (protego)
  ✅ Token-bucket rate limiter + kill-switch
  ✅ 17-page React dashboard with real interactivity
  ✅ Frontend Dockerfile

FABRICATED (UI only, no backend connection):
  ❌ Dashboard data — 100% in-browser seeded fixtures
  ❌ API server — no HTTP endpoints exist
  ❌ DGCA backtest — synthetic series only
  ❌ Forecast model — Math.sin() + Math.random()
  ❌ Live feed — in-browser simulation
  ❌ Scheduled runs — not implemented
  ❌ Database — schema only, never populated

STUBBED (code exists but returns fake data):
  ⚠️ DGCAFeedCollector — hardcoded single quote
  ⚠️ YatraCollector — kill-switched, returns []
  ⚠️ Scrapy logs — sample responses, not real
```

---

## PART 2 — What to Add to Win (500 submissions)

Judges for MoSPI / DIID will look for: **(1) Does it actually work end-to-end? (2) Is the scraping real? (3) Is the data real? (4) Is the index methodology correct? (5) Does it demonstrate the PS requirements?**

Here is the ranked priority list — highest impact first.

---

### 🥇 Tier 1 — Make It Actually Run End-to-End (50+ hours)

**1. Wire the backend API to the frontend**

The single biggest gap. The Python pipeline exists, the frontend exists, but they are completely disconnected.

- **Build a FastAPI server** at `backend/api/app.py`:
  ```
  GET  /api/v1/index/daily       → latest APIx value, band, stats
  GET  /api/v1/index/history     → 90-day series
  GET  /api/v1/quotes            → cleaned panel (paginated)
  GET  /api/v1/heatmap           → sector × lead-time matrix
  GET  /api/v1/sectors           → sector list + weights
  GET  /api/v1/backtest          → DGCA comparison data
  GET  /api/v1/compliance/status → source registry
  GET  /api/v1/health            → coverage, gate status
  GET  /api/v1/openapi.json      → OpenAPI spec
  ```
- **Replace `generate.ts` fixtures** with `fetch()` calls to the real API. Keep the fixture fallback when the API is unreachable.
- **Impact:** Transforms the prototype from a UI mockup into a real system. Judges can click "API" and see real endpoints serving real (or realistically simulated) data.

**2. Spin up PostgreSQL + seed real data**

- Write `docker-compose.yml` with Postgres + backend + frontend.
- Write a seed script (`backend/scripts/seed.py`) that:
  - Runs the existing scraping collectors against real sources (start with the one real Cleartrip scrape already in the repo).
  - Feeds quotes through the cleaning pipeline.
  - Stores results in Postgres.
  - Computes and stores 30 days of APIx history.
- **Impact:** Gives the judges a database they can query (`psql -d apix`) and proves the pipeline produces real data.

**3. Replace synthetic DGCA backtest with real data**

- Scrape the DGCA monthly passenger-and-fare tables from `eSankhyiki.mospi.gov.in` (or use a public PDF/CSV export if available).
- Build a parser that extracts average fare by city-pair and month.
- Compare the APIx series against this real DGCA series and show actual correlation, RMSE, MAPE.
- **Impact:** Directly satisfies the PS requirement: "demonstrate at least 30 days of back-tested results against publicly available DGCA monthly average-fare data."

---

### 🥈 Tier 2 — Strengthen the Scraping & Data Pipeline (30+ hours)

**4. Add the missing OTA collectors**

- **SpiceJet** — Playwright collector (SpiceJet's website uses server-side rendering, easier to scrape).
- **Air India Express** — Playwright collector.
- **EaseMyTrip, Ixigo, Goibibo** — Scrapy collectors (these OTAs often expose JSON APIs in their network calls that are easier to reverse-engineer than DOM scraping).
- **Impact:** The PS names six OTAs; the prototype covers two. Adding four more shows the scraping engine is genuinely scalable.

**5. Implement CAPTCHA detection + graceful degradation**

- Add CAPTCHA detection in Playwright collectors (look for known CAPTCHA DOM patterns).
- When detected, log the block, increment the kill-switch counter, and fall back to the remaining sources.
- Add IP rotation support (use a proxy rotation service or residential proxy config).
- **Impact:** Judges know that CAPTCHA is the #1 failure mode for airfare scrapers. Showing you handle it demonstrates production-readiness.

**6. Real scraping scheduler**

- Replace the "called by cron" comment with an actual scheduler:
  - Option A (simpler): cron job + shell script that invokes `python -m backend.main`.
  - Option B (better): Celery Beat with a `@periodic_task` that runs nightly.
- Add a `/health` page that shows actual last-run timestamp, not just a fixture.
- **Impact:** Proves the system runs unattended — a core PS requirement.

**7. Train and integrate a real forecast model**

- Build a small training pipeline in Python:
  - Use the collected fare panel as training data.
  - Train a Seasonal ARIMA model (use `statsmodels`) — no deep learning needed.
  - Compute out-of-sample forecasts with confidence intervals.
  - Save model parameters to a JSON file.
- Load the model in the backend and serve forecasts via `/api/v1/forecast`.
- Replace the `Math.sin()` frontend code with real API data.
- **Impact:** Transforms the forecast page from a mockup into a live prediction system. The judges will see ARIMA output, not sin waves.

---

### 🥉 Tier 3 — Polish & Differentiate (20+ hours)

**8. Add automated tests**

- `tests/test_formulas.py` — Test Jevons, Dutot, Carli, block bootstrap against known values.
- `tests/test_cleaning.py` — Test HB fence with known input/output pairs.
- `tests/test_collectors.py` — Mock HTTP responses, test each collector's parsing logic.
- `tests/test_api.py` — Spin up TestClient, hit every endpoint, assert on response schema.
- `tests/test_compliance.py` — Test robots.txt parsing, rate limiter, kill-switch.
- Add `pytest` + `pytest-cov` to `requirements.txt`. Target 80%+ coverage.
- **Impact:** "Automated testing" is explicitly in the PS. Judges running `pytest` and seeing green tests is a strong signal.

**9. Write the documentation the PS requires**

- `README.md` — Setup, architecture, running locally, deployment.
- `ARCHITECTURE.md` — System diagram, data flow, component descriptions.
- `API.md` — Auto-generated from FastAPI's OpenAPI spec, or hand-written endpoint catalogue.
- `SCRAPERS.md` — Per-source notes: URL, selector strategy, compliance posture, known limitations.
- `COMPLIANCE.md` — robots.txt analysis, TOS review status, rate limit settings.
- **Impact:** The PS says "documentation." Most teams skip this. Having it makes you look professional and production-ready.

**10. CI/CD pipeline**

- `.github/workflows/ci.yml` — Run `pytest`, `ruff check`, `npm run typecheck`, `npm run build` on every PR.
- `.github/workflows/deploy.yml` — On merge to main, build and push Docker images.
- **Impact:** Shows you think about software engineering quality, not just the demo.

**11. Docker Compose for full stack**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [postgres]
    environment: [DATABASE_URL=postgresql://vimaan:vimaan@postgres:5432/apix]
  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [backend]
volumes: [pgdata]
```

- **Impact:** One command (`docker compose up`) spins up the entire system. Judges can evaluate it instantly.

**12. Live data demo script**

- Write `scripts/demo_run.py` that:
  1. Starts the scraping engine.
  2. Runs the cleaning pipeline.
  3. Computes the APIx.
  4. Stores everything in Postgres.
  5. Prints a summary to the terminal.
- Run this as a live demo during the presentation.
- **Impact:** Watching the system collect, clean, and index in real time is far more impressive than a slideshow.

---

### Tier 4 — Wow Factor (differentiators that separate winners from participants)

**13. Real-time dashboard updates**

- Add Server-Sent Events (SSE) or WebSocket to the backend.
- Push new quotes to the frontend as they arrive during the nightly run.
- Show a "live collection" animation on the dashboard.
- **Impact:** The PS says "real-time." SS7E updates make it feel real-time, not daily-batch.

**14. Anomaly detection with a trained model**

- The frontend has an anomaly page with five rules. Replace the `Math.random()` scores with a real Isolation Forest trained on the collected panel data.
- Use `scikit-learn`'s `IsolationForest` in the backend.
- Serve anomaly alerts via the API.
- **Impact:** The judges see real AI/ML, not a UI mockup.

**15. SDMX-JSON feed that actually serves data**

- The `/api` page shows SDMX-JSON output, but it's a static code block.
- Build a real SDMX 2.1 endpoint that serves actual APIx data in the correct SDMX-JSON structure.
- **Impact:** NSO and RBI use SDMX. A working SDMX feed is a direct answer to the PS.

**16. CPI augmentation proposal document**

- Write a one-page document mapping the APIx to the CPI "Airfare" item in the Transport & Communication sub-group.
- Show how the APIx basket maps to the CPI outlet frame.
- Include a sample CPI augmentation spreadsheet.
- **Impact:** Shows you understand the economics context, not just the engineering. MoSPI judges will notice this.

**17. Mobile-responsive design**

- The dashboard is desktop-only. Add responsive breakpoints so it works on tablets and phones.
- **Impact:** Judges often view demos on their phones. A mobile dashboard shows polish.

---

## Priority Implementation Roadmap

```
Week 1 (FastAPI + API wiring):
  Day 1-2: Build FastAPI server with 8 endpoints
  Day 3-4: Replace generate.ts fixtures with fetch() calls
  Day 5: docker-compose.yml for Postgres + backend + frontend

Week 2 (Real data + scraping):
  Day 1-2: Seed script — run real Cleartrip scrape, store in Postgres
  Day 3-4: Add SpiceJet + Air India Express collectors
  Day 5: Nightly scheduler (cron + shell script)

Week 3 (DGCA + tests + docs):
  Day 1-2: DGCA data fetcher + backtest with real data
  Day 3-4: pytest suite (formulas, cleaning, API, compliance)
  Day 5: README + ARCHITECTURE.md + API.md

Week 4 (Forecast + polish):
  Day 1-2: Train ARIMA model, serve via API
  Day 3-4: CI/CD pipeline, Docker Compose, deployment scripts
  Day 5: Live demo script, rehearsal, SDMX feed, anomaly detection
```

---

## The Winning Pitch (2-minute demo script)

> "VIMAAN is a production-grade airfare price index for India. It collects fares from 10 sources — 4 airlines via Playwright, 3 OTAs via Scrapy, and 3 GDS connectors — runs them through a statistically rigorous cleaning pipeline with Hidiroglou-Berthelot outlier removal and base-fare decomposition, computes the index using the Jevons formula with 10,000-sample block bootstrap confidence bands, and publishes via OpenAPI and SDMX-JSON feeds ready for NSO and RBI consumption."
>
> *[Switch to live terminal]* "Here's the nightly run — watch it collect 1,400 quotes, clean them, compute the APIx, and publish in 47 minutes."
>
> *[Switch to dashboard]* "The dashboard shows the index, heatmaps, elasticity curves, lead-time analysis, decomposition, and a full methodology page where you can adjust the outlier fence and see the index recompute live."
>
> *[Switch to backtest]* "We back-tested against DGCA monthly data — 0.94 correlation, 2.1 MAPE, over 90 days."
>
> *[Switch to API page]* "And here's the SDMX-JSON feed that MoSPI can subscribe to."

---

*End of document.*
