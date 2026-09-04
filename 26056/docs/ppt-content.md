# VIMAAN — SIH 2026 Presentation Content
## Problem ID: 26056 | MoSPI | Data Informatics & Innovation Division (DIID)

**VIMAAN** — *Validated Index for Monitoring Airfares, Automated & National*
Publishes **APIx** — the Real-time Airfare Price Index for India.

> **Deck strategy in one line:** every other team will present a scraper with a chart. Present an *official statistic*. The slides that win are 6 (methodology), 7 (compliance) and 9 (back-test) — build the rest to get there.

---

## Slide 1: Title

**Title:** VIMAAN — Real-time Airfare Price Index for India
**Subtitle:** APIx · Daily. Route-specific. Reproducible.

**Team:** [Your Team Name]
**Institute:** [Your Institute]
**Category:** Software | Smart Automation

**Problem Statement ID:** 26056
**Organization:** Ministry of Statistics and Programme Implementation — Data Informatics & Innovation Division

**Visual:** Deep navy gradient. A single elegant index line rising across the lower third with a translucent confidence band around it — the chart *is* the hero image. Thin saffron/green accent rule under the title. No aeroplane clip-art, no stock photos of airports; this is a statistics product, and the deck should look like a central-bank publication.

---

## Slide 2: The Problem

**Title:** The Same Seat, Four Prices — and CPI Sees One

**The core visual (make this big and centred):**

| Booked | Fare for DEL–BOM, same flight |
|---|---|
| 45 days out | ₹4,180 |
| 15 days out | ₹7,412 |
| 7 days out | ₹11,900 |
| Tomorrow | ₹18,650 |

**A 4.5× spread on one physical seat.**

**Content:**
- CPI's 'Transport and Communication' sub-group prices air fares by **manual collection from a limited set of outlets and ticketing offices**
- **Over 90%** of domestic tickets are sold online
- Manual monthly collection sees roughly **one point** on the curve above — from a channel almost nobody uses

**Why it matters:** CPI is the RBI's inflation target under the flexible inflation-targeting framework. A mismeasured component is a mismeasured input to monetary policy.

**Visual:** the four fares as ascending bars; a single small marker labelled "what manual collection captures" sitting on one bar, dwarfed by the rest.

---

## Slide 3: The Solution

**Title:** VIMAAN — An Index, Not a Scraper

**Core idea:** Collect what a real Indian traveller would actually be quoted — every route, every booking window, every night — then compile it to statistical-agency standards and publish it as a number NSO and RBI can consume.

**Six things it does:**
1. **Collect** — 20 DGCA-traffic-weighted sectors × 5 lead windows × 11 sources, nightly
2. **Comply** — every request through a robots.txt / rate-limit / kill-switch gate
3. **Clean** — outlier edits, sold-out imputation, machine-checked data contracts
4. **Decompose** — base fare · taxes · UDF · convenience charge, separated
5. **Compile** — Jevons elementary index, DGCA-weighted, rebased 2024 = 100, with a confidence band
6. **Publish** — dashboard + OpenAPI 3.1 + **SDMX-JSON**

**Tagline:** *"Daily. Route-specific. Reproducible. Defensible."*

**Visual:** the six steps as a horizontal pipeline, with the compliance gate drawn as a physical gate the flow must pass through — not a side note.

---

## Slide 4: The Hard Idea — Constant Lead Time

**Title:** An Airfare Is Not a Kilo of Rice

**The problem with the obvious approach:**
> Tomorrow's DEL–BOM is a *different product* — different departure date, different remaining inventory, different fare bucket. Comparing today's DEL–BOM to yesterday's measures nothing.

**What we do instead:**

```
  ✗  "the price of DEL–BOM"

  ✓  "the price of DEL–BOM, departing exactly 15 days from
      the collection date, weekday, IndiGo, economy"

      cell_key = (sector, carrier, lead_bucket, cabin, dep_dow_band)
```

**Constant lead time holds quality constant.** This is why the PS specifies T+1 / T+7 / T+15 / T+30 / T+45 as first-class dimensions, and it is the answer to "how do you handle dynamic pricing?"

**Visual:** two panels side by side. Left: a jagged meaningless line labelled "naive: DEL–BOM day over day". Right: five clean parallel lines, one per lead window, labelled "constant-lead-time cells". The contrast does the whole job.

**Speaker note:** *This is the single most important slide for a statistician judge. Do not rush it.*

---

## Slide 5: Collection Engine

**Title:** 3,000 Quotes a Night, Every Request Gated

**Scale:**
```
20 sectors × 5 lead windows × 11 sources ≈ 600 tasks → ~3,000 offer prices / night
```

**Stack:**
| Need | Tool |
|---|---|
| JS-rendered airline SPAs | Playwright (Python), one browser context per domain |
| Structured / JSON endpoints | Scrapy |
| robots.txt + `Crawl-delay` | Protego, 24h cache |
| Scheduling & fan-out | Prefect flows → Celery + Redis workers |
| Licensed fallback | Amadeus Self-Service (Flight Offers Search) |
| Raw evidence | Bronze Parquet on MinIO — every published number traces back to its payload |

**Visual:** the sequence diagram from `architecture-diagram.md` §2, cropped to the collection half. Show the compliance gate as an actor in the swim lanes.

---

## Slide 6: Methodology — Why You Should Believe the Number

**Title:** Jevons, and Why It Has to Be Jevons

**The three candidate elementary formulas:**
```
Jevons  I = ∏ (p_t / p_t-1)^(1/n)     ← published
Dutot   I = Σp_t / Σp_t-1              ← diagnostic
Carli   I = (1/n) Σ (p_t / p_t-1)      ← diagnostic
```

**Three reasons, ascending:**
1. Geometric mean is the standard elementary formula for volatile, substitutable items (Eurostat HICP Methodological Manual, 2024 edition)
2. **Carli fails the time-reversal test** — `Carli(t/t-1) × Carli(t-1/t) ≥ 1` always. On airfares, where relatives span 0.5–2.0, that upward bias is large
3. Jevons implies unit elasticity of substitution — behaviourally reasonable for air travel, where people genuinely shift dates, carriers and booking timing

**Aggregation:** `APIx_t/APIx_0 = Σ_s w_s (I_s,t / I_s,0)`, weights from DGCA city-pair traffic, chain-linked, rebased **2024 = 100** — matching the base year of MoSPI's current CPI series.

**Every point carries a 95% bootstrap band.**

**Visual:** screenshot of the **Methodology Console** with all three lines drawn on the same quotes and Carli visibly sitting above. One screenshot that proves statistical literacy.

**Speaker note:** *"Carli fails time reversal" is asserted as a passing property test in our repo. We can show it.*

---

## Slide 7: Compliance — Demote, Don't Defeat

**Title:** The Ethical Scraping Question, Answered Structurally

**We never say "we bypass CAPTCHAs."** A source that declines automated access is a **routing decision**, not an obstacle.

| Rule | Enforced by |
|---|---|
| robots.txt + `Crawl-delay` | Protego gate, re-checked daily, cached copy shown in the UI |
| ≤ 1 req / 6s / domain + nightly cap | Redis token bucket |
| Identifiable User-Agent + contact URL | No browser spoofing, ever |
| No login-wall content, no PII | Collectors refuse authenticated routes by design |
| Exponential backoff; kill-switch on 3×429 | Automatic, 24h trip |
| Full request audit, CSV-exportable | `/compliance` endpoint |

**Where a site's terms say no:** demoted to a **licensed API** (Amadeus), and in production to a **statutory data-sharing channel** — MoSPI can obtain price data from airlines under the Collection of Statistics Act, 2008.

**Legal posture, stated honestly:** DPDP Act 2023 not triggered (no personal data). Browsewrap ToS enforceability in India is unsettled — which is exactly why the default posture is conservative and production assumes a statutory feed.

**Visual:** screenshot of the **Compliance Console**, one source card expanded showing its cached robots.txt with fetch timestamp, and one source visibly marked *DEMOTED → licensed API*.

**Speaker note:** *Put this slide before the demo, not after. It pre-empts the first question every government judge asks.*

---

## Slide 8: The Dashboard

**Title:** What NSO Would Actually Use

| Panel | What it shows |
|---|---|
| **APIx headline** | Daily index, base 2024=100, shaded 95% band, total-vs-base toggle, status chips (PROVISIONAL / REVISED / FROZEN / SUPPRESSED) |
| **Sector heatmap** | 20 sectors × 5 lead windows, coloured by weekly change; click to drill into the elementary cell |
| **Lead-time elasticity** | Mean fare vs days-to-departure, log-y, overlay two sectors |
| **Fare decomposition** | Stacked base · taxes · UDF · convenience — how much of "airfare inflation" isn't the airline |
| **Methodology console** | Live formula and imputation switches |
| **Back-test validation** | APIx vs DGCA and vs CPI item, with metrics strip |
| **Compliance console** | Per-source posture, caps, kill-switch, audit log |
| **Scraper health** | Yield, block rate, coverage gauge with the 70% publication threshold drawn on it |

**Visual:** the APIx headline chart full-bleed, dark theme. It should look like something the RBI would publish.

---

## Slide 9: Validation — The 30-Day Back-Test

**Title:** The Acceptance Criterion, As a Screen

**The PS asks for ≥30 days back-tested against publicly available DGCA fare data. We report:**

| Metric | What it answers |
|---|---|
| **Pearson ρ** — on levels *and* on log-differences | Do we track the reference? (log-diff is the honest one; levels flatter anything trending) |
| **RMSE** (index points) | How far off, in the unit people read |
| **MAPE** | Scale-free error |
| **Directional agreement %** | Do we move the same way, period over period? |

**Two reference series:** DGCA/MoCA tariff-monitoring route fares, and the **CPI air-fare item series pulled from MoSPI's own eSankhyiki API**.

**Plus a stronger test that costs nothing:** on a synthetic panel with a **known injected inflation path**, the index recovers that path within its bootstrap band. Not "the scraper ran" — "the estimator is correct".

**One correction worth making out loud:** DGCA's *monthly traffic report* contains passengers, market share, load factor, OTP and complaints — **not fares**. The fare reference lives in separate tariff-monitoring outputs. Most teams will assume wrongly. We didn't.

**Visual:** dual-axis chart (APIx monthly vs reference) plus a scatter with fitted line and the metrics strip beneath.

---

## Slide 10: Innovation & Differentiation

**Title:** What Makes VIMAAN Different

| Aspect | Typical hackathon solution | VIMAAN |
|---|---|---|
| Output | Average of scraped prices | A chain-linked, weighted **index number** |
| Dynamic pricing | Ignored or averaged away | **Constant-lead-time cells** hold quality fixed |
| Formula | Arithmetic mean | Jevons, with Dutot/Carli as on-screen diagnostics |
| Uncertainty | None | 95% block-bootstrap band on every point |
| Missing data | Dropped, or carried forward | Cell-mean imputation; carry-forward shown as a *contrast*, not used |
| Blocked sources | Rotate proxies, solve CAPTCHAs | **Demote to licensed API / statutory channel** |
| Compliance | A paragraph in the README | A gate every request passes, and a screen in the product |
| Validation | "It works" | 30-day back-test + recovery of a known injected path |
| Consumability | A dashboard | OpenAPI 3.1 **+ SDMX-JSON** |
| Honesty | Silent on limitations | Offer-vs-transaction price caveat conceded up front |

**Four novel contributions:**
1. Constant-lead-time cell design applied to Indian domestic airfares
2. A compliance gate as a structural, auditable component rather than a policy statement
3. Fare decomposition (base / taxes / UDF / convenience) as a published parallel series
4. Property-tested index mathematics — including a test asserting that Carli *fails* time reversal

---

## Slide 11: Architecture

**Title:** System Architecture

```
Sources → COMPLIANCE GATE → Collectors → Bronze (MinIO)
   → Silver (TimescaleDB) → Clean pipeline → Gold
   → Index engine → Back-test → FastAPI (REST + SDMX) → Dashboard
```

**Stack:** Playwright + Scrapy · Prefect + Celery + Redis · PostgreSQL 16 + TimescaleDB · MinIO · Polars · FastAPI · React + TypeScript + ECharts · Prometheus + Grafana · Docker Compose

**Interfaces that matter:**
- `Collector` ABC — adding an OTA is one class and one registry row
- `ComplianceGate` — no bypass path exists in the code
- `indexer/` — pure Python, property-tested, no library owns our formulas

**Visual:** the Mermaid `graph TB` from `architecture-diagram.md` §1, rendered wide. Keep the compliance gate band visually distinct (amber) so the eye lands on it.

---

## Slide 12: Scalability & Deployment

**Title:** Runs on One VM. Scales to All of It.

| Stage | Footprint | Scope |
|---|---|---|
| Demo | Single Docker Compose, 8 vCPU / 16 GB | 20 sectors, 90 days |
| Pilot (DIID) | Same host + Timescale retention policy | 100 sectors, all carriers |
| Production | K8s workers, Timescale multi-node, read replicas | Full domestic network + international |

**Scaling levers:**
- Collection is embarrassingly parallel — one Celery task per (sector, lead, source)
- TimescaleDB **continuous aggregates** compute rollups incrementally instead of re-scanning history
- The index engine is O(cells), not O(quotes) — adding sources deepens each cell without slowing compilation
- Adding a source = one `Collector` subclass + one registry row

**One command:** `docker compose up --build`

**Safeguard worth showing:** `COLLECTION_ENABLED` ships **`false`**. A fresh clone cannot make a single outbound request to any airline or OTA until someone consciously turns it on.

---

## Slide 13: Roadmap

**Title:** Beyond the Prototype

**Phase 1 (now):** Domestic APIx, 20 sectors, 5 lead windows, daily/weekly/monthly
**Phase 2:** Statutory data-sharing channel with airlines — offer prices become transaction prices, and the headline caveat disappears
**Phase 3:** International sectors; INR/USD fare handling
**Phase 4:** Hedonic quality adjustment (baggage allowance, seat pitch, refundability, connection count)
**Phase 5:** Seasonal adjustment and a festival-calendar-aware model for the published series
**Phase 6:** Extend the method to rail (IRCTC) and intercity bus — the same cell design generalises
**Phase 7:** Formal integration into the CPI 'Transport and Communication' compilation workflow
**Phase 8:** Public API for researchers, mirrored on eSankhyiki/NDAP

**Visual:** a timeline where Phase 2 is highlighted — it is the phase that upgrades the whole product's epistemic status.

---

## Slide 14: Impact

**Title:** Why This Matters

**For MoSPI / NSO:**
- Air-fare prices collected from the channel where 90%+ of tickets are actually sold
- Daily frequency instead of monthly — the 'Transport and Communication' sub-group gains a high-frequency input
- Reproducible: every published point traces to its raw payload
- Auditable: full request log, revision policy, suppression rules

**For RBI:**
- A high-frequency, route-level read on a volatile CPI component, ahead of the monthly release
- Confidence bands, so the signal can be weighed rather than merely read

**For the public:**
- The first published, methodologically transparent measure of what Indians actually pay to fly
- Lead-time elasticity curves make dynamic pricing legible to a general audience

**Framing to use:** this doesn't replace CPI. It **augments one item within one sub-group** — and it demonstrates a reusable pattern for every other item where prices moved online.

---

## Slide 15: Demo Plan

**Title:** Live Demo (5 minutes)

1. **APIx headline** — daily index, base 2024=100, confidence band
2. **Lead-time elasticity** — the T+1 spike that monthly collection cannot see
3. **Sector heatmap** — festival week, drill into a hot cell
4. **Methodology console** — flip Jevons → Carli → Dutot live; flip imputation to carry-forward and watch the series flatten
5. **Back-test panel** — ρ, RMSE, directional agreement over 30 days
6. **Compliance console** — cached robots.txt, per-source caps, a demoted source
7. **OpenAPI + SDMX-JSON** — the feed NSO and RBI would actually consume

**Backup:** `?demo` mode runs entirely client-side with **no network at all**. Pre-recorded video and screenshot deck also on hand.

**Discipline for the demo:**
- Never say "we bypass CAPTCHAs"
- Never present seeded numbers as live results — say "on the seeded run"
- Concede the offer-vs-transaction price caveat *before* a judge raises it

---

## Slide 16: Team & Contact

**Title:** Built for Smart India

**Team:**
- [Member 1]: Index methodology & statistics
- [Member 2]: Collection engine & compliance
- [Member 3]: Data pipeline & storage
- [Member 4]: Backend & API
- [Member 5]: Frontend & visualisation
- [Member 6]: DevOps & validation

**Contact:**
- Email: [team-email]
- GitHub: [repo-link]
- Demo: [live-demo-link]

**"Daily. Route-specific. Reproducible. Defensible."**

---

## Design Guidelines

### Colour Palette
- **Primary:** `#0b1220` → `#1e293b` (deep navy background gradient)
- **Index line:** `#38bdf8` (sky) with band at 18% opacity
- **Compliance / gate:** `#b45309` (amber) — used *only* for the compliance layer, so the eye learns it
- **Success / approved:** `#10b981`
- **Warning / suppressed:** `#f59e0b`
- **Danger / blocked:** `#ef4444`
- **Reference series (back-test):** `#a78bfa` (violet), always dashed
- **Text:** `#f8fafc` primary, `#94a3b8` secondary

### Typography
- Headers: Bold, 36–44pt
- Subheaders: Semi-bold, 24–28pt
- Body: 18–20pt
- Table text: 16pt
- Formulas: monospace (JetBrains Mono / Consolas), 18pt
- Captions & sources: 13pt, `#94a3b8`

### Visual Rules
- **The chart is the hero.** Screenshots of the real product beat redrawn diagrams on every slide except 4 and 11.
- Every number on a slide is either sourced or labelled *illustrative*. No unattributed figures.
- Formulas get their own monospace block with breathing room — never inline in a bullet.
- One idea per slide. Slides 4, 6, 7 and 9 each carry exactly one argument.
- Consistent 24px padding; 12px card radius; subtle border `#1e293b`, no drop shadows.
- Charts: dark theme, gridlines at 8% opacity, axis labels at 14pt, always label the base year.
- Never use aeroplane clip-art. This is a statistics product.

### Slide-Count Discipline
16 slides, ~20 seconds each in a 6-minute pitch. If you must cut, cut 12 and 13 — never 4, 6, 7 or 9.
