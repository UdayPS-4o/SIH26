# SIH 2026 — PS 26056: Real-time Airfare Price Index for India (APIx)

**Organization:** Ministry of Statistics and Programme Implementation (MoSPI) — Data Informatics & Innovation Division (DIID)
**Theme:** Smart Automation | **Category:** Software
**Project:** **VIMAAN** — *Validated Index for Monitoring Airfares, Automated & National* — the platform. **APIx** — the published index.

> **Verification convention used in this document.** Claims marked ✅ were checked against a live source during drafting (September 2026) and the source is linked in §7. Claims marked ⚠️ are reasoned inferences or standard practice that a team member should confirm before they go on a slide. Nothing here is presented as a measured result of our own system.

---

## 1. What they actually want (plain English)

A traveller books DEL–BOM. Depending on *when* they book and *where* they look, they pay wildly different amounts for the same seat on the same aircraft:

| Booked | Source | Carrier | Fare shown | What CPI's manual collector would record |
|---|---|---|---|---|
| 45 days out | Airline site | 6E | ₹4,180 | — |
| 15 days out | OTA A | 6E | ₹7,412 | — |
| 7 days out | OTA B | 6E | ₹11,900 | — |
| Tomorrow | Airline site | 6E | ₹18,650 | one price, one outlet, once a month |

Four prices, one "product", a 4.5× spread — and the current CPI collection process sees roughly one point on that curve. MoSPI's own modernisation direction acknowledges the gap: the new CPI series (base **2024 = 100**, released **12 February 2026**) adopted COICOP 2018, HCES 2023-24 weights, and explicitly brought **e-commerce and administrative data** into price collection ✅. This problem statement is the aviation instance of exactly that shift.

**What's wanted:** an automated system that collects what a real Indian traveller would actually be quoted — across airlines, OTAs, routes and booking windows — cleans it to a statistician's standard, and compiles it into a **published index number** at daily/weekly/monthly frequency, with an API that NSO and RBI can consume.

**The trap to avoid:** this is not a scraping project with a chart on top. It is an **official-statistics** project whose hardest problems are methodological. A scraper that returns 3,000 prices a night is a week of work. An index that a MoSPI statistician will defend in front of the RBI's Monetary Policy Committee is the actual deliverable.

### The one hard idea that makes it work

An airfare is not a fixed basket item. You cannot price "DEL–BOM" the way you price a kilo of rice, because tomorrow's DEL–BOM is a different product — different departure date, different remaining inventory, different fare bucket. Comparing today's DEL–BOM to yesterday's measures nothing.

The fix, and the spine of this whole design, is the **constant-lead-time cell**:

> We never track "the price of DEL–BOM". We track *"the price of DEL–BOM, departing exactly 15 days from the collection date, weekday departure, IndiGo, economy"* — and **that** is comparable across days.

Holding lead time constant holds quality constant. It is why the PS specifies T+1/T+7/T+15/T+30/T+45 as first-class dimensions rather than as nice-to-haves, and it is the first thing to say when a judge asks how you handle dynamic pricing.

## 2. The required capabilities (from the PS)

1. Multi-source automated collection from **5 airlines** (IndiGo, Air India, Air India Express, Akasa, SpiceJet) and **6 OTAs** (MakeMyTrip, Yatra, EaseMyTrip, Cleartrip, Ixigo, Goibibo)
2. Handling of JS-rendered pages, anti-bot measures, session management — **within** robots.txt and ToS compliance, with rate-limiting and ethical safeguards
3. A representative city-pair basket selected on **DGCA passenger-traffic** evidence
4. Capture across **five advance-purchase windows** (T+1, T+7, T+15, T+30, T+45)
5. A cleaning pipeline: outlier removal, missing-value handling, sold-out/cancelled handling, and **decomposition of base fare vs taxes vs UDF vs convenience charge**
6. A de-duplicated fare database with full metadata (origin, destination, carrier, window, fare class, base, taxes, total)
7. An **index-construction module** driven by given routes and weights
8. A dashboard: trends, sector heatmaps, lead-time elasticity curves — plus an **API consumable by NSO and RBI**
9. Documentation, automated testing, and **≥30 days of back-tested results** against publicly available DGCA fare data

Items 5, 7 and 9 are where the marks are. Items 1–4 are where the risk is.

## 3. System architecture

```
Airline portals · OTA portals · Licensed fare APIs · MoU/statutory feed
        │
        ▼
1. COMPLIANCE GATE       robots.txt (protego, 24h cache) · Crawl-delay honoured
   (every request)       per-domain token bucket · identifiable UA + contact URL
                         no login-wall · no PII · kill-switch on 3×429
        │
        ▼
2. COLLECT               Playwright (JS portals) · Scrapy (structured) · Amadeus
   (Prefect + Celery)    fan-out: 20 sectors × 5 lead windows × N sources
                         ≈ 3,000 offer prices per night
        │
        ▼
3. LAND                  Bronze: raw HTML/JSON as Parquet on MinIO (evidence)
   (medallion)           Silver: fare_quotes_raw, TimescaleDB hypertable
        │
        ▼
4. CLEAN                 normalise (IATA, TZ, INR, fare class) → dedupe
                         → decompose (base | taxes | UDF | convenience)
                         → outliers (Tukey on log-relatives, H-B)
                         → impute sold-out (cell-mean, never carry-forward)
                         → quality contracts (pandera + Great Expectations)
        │
        ▼
5. INDEX                 cell assignment (constant lead time)
                         → Jevons elementary index per cell
                         → weighted aggregation with DGCA traffic weights
                         → chain-link + rebase to 2024 = 100
                         → block bootstrap → 95% confidence band
        │
        ▼
6. VALIDATE              back-test ≥30 days vs DGCA/MoCA fare reference
                         and vs the CPI air-fare item series (eSankhyiki)
        │
        ▼
7. SERVE                 dashboard · REST (OpenAPI 3.1) · SDMX-JSON for NSO/RBI
                         publication states: PROVISIONAL → REVISED → FROZEN
```

**Why a compliance gate as stage 1 rather than a footnote?** Because it is the single most likely reason this project gets challenged, and putting it structurally first — every request physically passes through it, and its state is a screen in the product — converts the biggest weakness into a governance strength. See §5.

## 4. What makes this statistically defensible

This section replaces the "do we need an LLM" analysis that the sibling problem statements need. Here the equivalent question is: **why should anyone believe your number?**

### 4.1 Elementary aggregation — use Jevons, and be able to say why

For each elementary cell *c* with *n* matched price pairs:

```
                  n
  Jevons:  I_c  = ∏ ( p_i,t / p_i,t-1 ) ^ (1/n)        ← what we publish
                 i=1

  Dutot:   I_c  = ( Σ p_i,t ) / ( Σ p_i,t-1 )          ← diagnostic only
  Carli:   I_c  = (1/n) Σ ( p_i,t / p_i,t-1 )          ← diagnostic only
```

Three reasons Jevons is right here, in ascending order of how much they impress:

1. **It is the standard for volatile, substitutable items.** Eurostat's HICP Methodological Manual (2024 edition, KS-GQ-24-003) treats the geometric mean as the standard elementary formula, with the arithmetic mean of price relatives admissible only exceptionally ✅.
2. **Carli fails the time-reversal test** — `Carli(t/t-1) × Carli(t-1/t) ≥ 1` always, with equality only if all relatives are identical. On airfares, where relatives routinely span 0.5–2.0, that upward bias is large, not academic. Our Methodology Console demonstrates this live: the three lines visibly diverge and Carli sits above.
3. **Jevons implies unit elasticity of substitution** — which is a *behaviourally reasonable* assumption for air travel, where consumers genuinely do shift dates, carriers and booking timing in response to price. Dutot implicitly weights by price level, which would let one expensive business-class cell dominate a cell mean.

### 4.2 Higher-level aggregation

```
  APIx_t / APIx_0  =  Σ_s  w_s · ( I_s,t / I_s,0 )        with  Σ_s w_s = 1
```

A Young / modified-Laspeyres form, consistent with MoSPI retaining the Laspeyres formula in the 2024-base CPI ✅. Strata *s* are (sector × lead-time band); weights **w_s** derive from **DGCA city-pair-wise monthly domestic passenger traffic** ✅ (see §6) crossed with a lead-time booking-share profile ⚠️ (booking-curve shares are not published; we estimate them and expose the assumption as a tunable input rather than hiding it).

### 4.3 Chain-linking and rebasing

Annual chain-link with a linking factor computed as the ratio of geometric means over the overlap year:

```
  LF = GM(new series over overlap year) / GM(old series over overlap year)
```

Rebased to **2024 = 100** to sit alongside the current CPI series ✅. Chain-drift risk is real for high-frequency price data with strong seasonality (the classic "price bounce" problem); we mitigate by chaining annually rather than daily, and we report the drift diagnostic in the back-test panel.

### 4.4 Outliers

Airfare price relatives are heavy-tailed and right-skewed, so a plain ±3σ rule is wrong.

- **Tukey fences on log relatives**: keep `r_i = ln(p_i,t / p_i,t-1)` within `[Q1 − k·IQR, Q3 + k·IQR]`, default `k = 3`, exposed as a slider so sensitivity is visible.
- **Hidiroglou–Berthelot** on the ratio distribution for skewed cells — the method official statistical agencies actually use for price and business-survey ratio edits ⚠️ (standard practice; cite the agency manual you use).
- **Winsorise** survivors at the 1st/99th percentile rather than deleting, so a genuine surge dampens instead of vanishing.

A real festival-week surge must survive the filter. If your outlier rule deletes Diwali, your index is useless — that trade-off is exactly what the slider exists to make visible.

### 4.5 Missing and sold-out cells

Sold-out is **not** missing-at-random — it correlates with high demand, so dropping it biases the index *downward* precisely when fares are highest.

- **Cell-mean imputation of the relative**: `r̂_i,t = exp( mean_{j surviving in cell} ln(p_j,t / p_j,t-1) )` — the item inherits its cell's movement.
- **Not naive carry-forward** (`p_i,t := p_i,t-1`), which flattens the series and induces drift, and which the Methodology Console demonstrates by toggling.
- **Coverage gate:** if a day fills < 70% of expected cells, publication is **SUPPRESSED** and revised at T+7. An honest gap beats a fabricated number.

### 4.6 The caveat to concede before a judge raises it

**Scraped fares are *offer* prices, not *transaction* prices.** We do not observe what was actually paid, the mix of fare buckets actually sold, or seats sold at zero marginal revenue. Mitigations, stated plainly:

- weight quote observations toward the lowest available fare bucket, which is what a price-sensitive household actually faces;
- publish **total fare** (what the household pays) and **base fare** (the airline's own signal) as parallel series;
- calibrate against realised averages in the back-test and report the residual gap as a known quantity rather than concealing it.

Conceding this first is worth more than defending it later. It is also honest: no scraping-based index anywhere in the world escapes this limitation.

### 4.7 Uncertainty

Every published point carries a **95% band** from a block bootstrap (1,000 replicates, resampling quotes within cell to preserve within-cell correlation). Publishing an index without an uncertainty measure is the tell of a hackathon project; publishing one with a band is the tell of a statistics product.

## 5. Legal & ethical scraping posture

**Never say "we bypass CAPTCHAs."** The PS says *handle* anti-bot measures; the defensible reading is that a system encountering a block treats it as a **routing decision**, not an obstacle to defeat.

**Standing rules, enforced in code, not in a policy document:**

| Rule | Implementation |
|---|---|
| Respect robots.txt | `protego`, fetched and cached 24h, re-checked per source per day |
| Honour `Crawl-delay` | feeds directly into the per-domain token bucket |
| Conservative rate limit | ≤ 1 request / 6s / domain, plus a nightly per-domain request cap |
| Identifiable | descriptive User-Agent carrying a contact URL — no browser spoofing |
| No login-wall content | collectors refuse authenticated routes by design |
| No PII | fare, schedule and tax fields only; no passenger or session data retained |
| Backoff | exponential on 429/503, capped at 15 min |
| Kill-switch | manual, plus automatic on 3 consecutive 429s from a domain (24h) |
| Cache | never re-fetch a (source, sector, lead, date) cell twice in a night |
| Auditability | every request logged and exportable; `/compliance` exposes live state |

**Per-source compliance matrix** — the routing table. Fill the middle columns by *actually reading* each robots.txt and ToS before the event; the shape below is the deliverable, the verdicts are a team task ⚠️.

| Source | robots.txt posture | ToS posture | Access method | Rate |
|---|---|---|---|---|
| Airline portal A | *check* | *check* | Playwright, gated | 1/6s, cap 400/night |
| Airline portal B | *check* | *check* | Playwright, gated | 1/6s, cap 400/night |
| OTA A | *check* | *check* | Scrapy, gated | 1/10s, cap 250/night |
| OTA B | disallows automated search ⚠️ | prohibits scraping ⚠️ | **demoted → licensed API** | n/a |
| Amadeus Self-Service | n/a | licensed test tier | official API | quota-bound |
| DGCA / airline MoU | n/a | statutory | bulk feed | n/a |

**Where a source says no, we don't scrape it.** It is demoted to a licensed API route, and in production to a statutory channel — MoSPI can obtain price data from airlines under the **Collection of Statistics Act, 2008** ⚠️ (confirm the applicable section before citing it on a slide). That is not a workaround; it is how official statistics is *supposed* to source data, and saying so out loud is the strongest possible answer to "isn't this scraping illegal?"

**Indian legal context, accurately and without overclaiming:** IT Act 2000 §43 covers unauthorised access to a computer resource; browsewrap/clickwrap ToS enforceability under the Indian Contract Act is unsettled ⚠️; the **DPDP Act 2023 is not triggered** — no personal data is collected. Scraping publicly displayed prices is not settled law in India, which is precisely why the posture is conservative by default and why the production design assumes a statutory feed.

## 6. Datasets — what's real, what's a dead end

**The single most important correction to the PS's own framing:** the DGCA *monthly traffic report* does **not** publish average fares ✅ — it publishes passengers carried, market share, load factor, OTP and complaints. Fare data comes from a different place: DGCA/MoCA **tariff-monitoring** outputs for selected routes, and Parliament Question answers that tabulate route fares ⚠️. Say this out loud in the deck. Knowing where the back-test reference actually lives — and that most teams will assume wrongly that it is in the traffic report — is a credibility moment.

| Resource | What it is | Use | Status |
|---|---|---|---|
| **DGCA city-pair-wise monthly domestic passenger traffic** (digigov portal) | Monthly passengers by city pair | **Basket selection + stratum weights w_s** — the core input | ✅ exists |
| DGCA monthly traffic report | Pax, share, PLF, OTP, complaints — **no fares** | Weights, carrier shares | ✅ exists |
| DGCA / MoCA tariff-monitoring & PQ route-fare tables | Selected-route fare levels | **Back-test reference series** | ⚠️ verify format/coverage |
| **MoSPI eSankhyiki** (esankhyiki.mospi.gov.in) | Macro Indicators Module; CPI, NAS, IIP, ASI; downloadable + API | CPI air-fare item series for back-test; the integration target | ✅ launched 29 Jun 2024 |
| **`nso-india/mospi-esankhyiki`** (GitHub) | Official Python client — `list_datasets` → `get_indicators` → `get_metadata` → `get_data`; for CPI, `get_indicators()` returns base years | Pull the CPI comparison series programmatically | ✅ exists |
| **`nso-india/esankhyiki-mcp`** (GitHub) | MoSPI's beta MCP server, launched 6 Feb 2026 | Shows MoSPI is actively building machine-readable access — cite it as alignment | ✅ exists |
| AAI traffic statistics | Passenger movements by airport | Cross-check on weights | ⚠️ |
| OurAirports / OpenFlights | Airport & route reference data | IATA/ICAO reference tables | ⚠️ |
| Amadeus Self-Service APIs | Flight Offers Search, free test tier | Legally-clean fare source for demoted sources | ⚠️ verify current tier |
| Duffel / Kiwi Tequila | Commercial fare APIs, test modes | Alternate licensed route | ⚠️ |
| Kaggle Indian domestic flight-fare datasets | Historic scraped fare snapshots | **Offline development** of the cleaning + index modules before live data exists | ⚠️ quality varies |
| Eurostat HICP Methodological Manual 2024 (KS-GQ-24-003) | The methodology bible; COICOP 07.3.3 = passenger transport by air | Defends every formula choice in §4 | ✅ exists |

**Dead ends to not waste hours on** ⚠️: there is no bulk public download of Indian airfare transaction data; OTA "APIs" surfaced by third-party marketplaces are not official; and no public dataset gives you the fare *actually paid*. Assume you will generate your own panel.

**Development strategy:** build and test the entire cleaning + index stack against a **synthetic 90-day panel** with known ground truth (`scripts/seed_demo.py`) *before* a single live quote exists. Because you generate the truth, you can prove the index recovers a known injected inflation path — a stronger claim than "it ran". Live collection then swaps in behind the same interface.

## 7. Resource links

### MoSPI / official statistics
- MoSPI eSankhyiki portal: https://esankhyiki.mospi.gov.in
- eSankhyiki official Python client: https://github.com/nso-india/mospi-esankhyiki
- eSankhyiki MCP server (beta, Feb 2026): https://github.com/nso-india/esankhyiki-mcp
- PIB — eSankhyiki launch (29 June 2024): https://www.pib.gov.in/PressReleasePage.aspx?PRID=2029708
- PIB — new GDP/CPI/IIP series release schedule (CPI 12 Feb 2026): https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2226269
- MoSPI: https://mospi.gov.in
- National Data & Analytics Platform (NDAP): https://ndap.niti.gov.in

### Index methodology
- Eurostat HICP Methodological Manual, 2024 edition (KS-GQ-24-003): https://ec.europa.eu/eurostat/documents/3859598/18594110/KS-GQ-24-003-EN-N.pdf
- Eurostat HICP methodology overview: https://ec.europa.eu/eurostat/statistics-explained/index.php?title=HICP_methodology
- Eurostat HICP ESMS metadata (national lead-time grids live here): https://ec.europa.eu/eurostat/cache/metadata/en/prc_hicp_esms.htm
- ILO/IMF/OECD/UNECE/Eurostat/World Bank *Consumer Price Index Manual: Concepts and Methods* (2020): https://www.imf.org/en/Data/Statistics/cpi-manual
- SDMX standards (the exchange format statistical agencies actually use): https://sdmx.org

### Aviation data
- DGCA DigiGov data & reports: https://www.dgca.gov.in/digigov-portal/?page=yearly/4267/5192/html
- DGCA city-pair-wise monthly domestic passenger traffic: https://www.dgca.gov.in/digigov-portal/?page=monthlyStatistics%2F259%2F4751%2Fhtml&main259%2F4184%2Fservicename=
- DGCA Indian city-wise passenger traffic: https://www.dgca.gov.in/digigov-portal/?page=yearly%2F4267%2F7261%2Fhtml&main4267%2F4210%2Fservicename=
- Airports Authority of India traffic statistics: https://www.aai.aero/en/business-opportunities/aai-traffic-news
- Ministry of Civil Aviation: https://www.civilaviation.gov.in
- OurAirports data: https://ourairports.com/data/
- OpenFlights: https://openflights.org/data.html

### Licensed fare APIs
- Amadeus for Developers (Self-Service, free test tier): https://developers.amadeus.com
- Duffel: https://duffel.com/docs
- Kiwi Tequila: https://tequila.kiwi.com

### Scraping, compliance & orchestration
- Playwright for Python: https://playwright.dev/python/
- Scrapy: https://scrapy.org
- Protego (robots.txt parser, Scrapy's own): https://github.com/scrapy/protego
- Crawlee for Python: https://crawlee.dev/python/
- Prefect: https://www.prefect.io
- Apache Airflow: https://airflow.apache.org
- Celery: https://docs.celeryq.dev

### Storage, processing, quality
- TimescaleDB: https://www.timescale.com
- PostgreSQL: https://www.postgresql.org
- MinIO: https://min.io
- Polars: https://pola.rs
- statsmodels: https://www.statsmodels.org
- pandera (dataframe contracts): https://pandera.readthedocs.io
- Great Expectations: https://greatexpectations.io
- Hypothesis (property-based testing for the index math): https://hypothesis.readthedocs.io
- vcrpy (recorded HTTP fixtures — no live calls in CI): https://vcrpy.readthedocs.io

### Serving & frontend
- FastAPI: https://fastapi.tiangolo.com
- Apache ECharts (heatmaps, band charts): https://echarts.apache.org
- Recharts: https://recharts.org
- Prometheus: https://prometheus.io · Grafana: https://grafana.com

### Legal reference
- Collection of Statistics Act, 2008: https://www.mospi.gov.in/collection-statistics-act-2008
- Information Technology Act, 2000: https://www.meity.gov.in/content/information-technology-act-2000
- Digital Personal Data Protection Act, 2023: https://www.meity.gov.in/data-protection-framework
