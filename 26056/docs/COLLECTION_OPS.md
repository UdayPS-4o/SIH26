# VIMAAN — Collection Operations, Scale & Cost

**SIH 2026 · PS 26056 · MoSPI / DIID**
Companion to [BUILD_PLAN.md](BUILD_PLAN.md). This document answers four operational questions:
**how often we collect, how much that is, what we run it on, and what it costs.**

> Pricing figures are approximate and were reasoned from published list prices at time of writing — **re-check current rates before quoting any number on a slide.** Volumes are derived from the basket definition and are exact given the stated assumptions.

---

## 1. The Constraint Everything Else Follows From

> **You cannot backfill a scraped fare.**

This is the single most important operational fact in the project, and it inverts normal ETL thinking.

If your ingestion job for a database table fails on Tuesday, you re-run it on Wednesday and Tuesday's rows appear. If your fare collection fails on Tuesday, **Tuesday's T+15 quote for DEL–BOM no longer exists anywhere in the world.** The flight has moved to T+14. The price you needed was an observation of a moment, and the moment is gone.

Three consequences that drive the whole design:

| Consequence | Design response |
|---|---|
| Retries must complete **the same night** | Retry budget is bounded by the collection window, not by "eventually". A task that exhausts retries writes a `SUPPRESSED` cell, never a queued backlog. |
| A missed night is permanent, structural missingness | Coverage gate at 70%; below it the *day* is suppressed rather than published with a hole. |
| Snapshot time must be stable | Fares move intraday. If you collect at 03:30 one day and 11:00 the next, the day-over-day relative contains a time-of-day effect masquerading as inflation. **Collection time is part of the cell definition.** |

That last row is the one teams get wrong. It is not enough to collect daily — you must collect at the *same time* daily, and treat drift in that time as a data-quality incident.

---

## 2. Collection Cadence

### 2.1 The nightly schedule

| Window | IST | UTC cron | Purpose |
|---|---|---|---|
| **Primary collection** | 03:30 | `0 22 * * *` | The published snapshot. Lowest traffic on target sites, lowest latency, most stable page structure. |
| **Secondary collection** *(optional)* | 15:30 | `0 10 * * *` | Intraday volatility measurement. Not used in the headline index; feeds the "fares vary 200–400% within a day" evidence the PS calls out. |
| **Cleaning + index** | 13:00 | `30 7 * * *` | Runs well after primary completes, with slack for retries. |
| **Back-test refresh** | Sun 14:00 | `30 8 * * 0` | Weekly; references update at monthly frequency anyway. |
| **Weight refresh** | 5th monthly | `0 4 5 * *` | New DGCA city-pair traffic release. |

**Why 03:30 IST and not "spread across the day":** because the snapshot must be a *cross-section*. Every quote in a night's panel should describe the same instant in the fare surface. Spreading collection across 12 hours means the DEL–BOM quote and the BOM–BLR quote describe different market states, and the weighted aggregate mixes them. A tight window is a statistical requirement, not an efficiency preference.

The window should be **as narrow as coverage allows** — target ≤ 90 minutes end to end.

### 2.2 Prefect flow structure

```
daily_collection  (03:30 IST)
├── preflight
│   ├── refresh robots.txt cache per source
│   ├── resolve access method per source (scrape | licensed API | feed)
│   └── abort if COLLECTION_ENABLED is false
├── fan-out: 1,100 tasks  (sector × lead_window × source)
│   ├── per-task: acquire token → fetch → parse → RawQuote[] → bronze + silver
│   └── retry: 3 attempts, exponential, ALL within the window
├── coverage report → % of expected cells filled
└── emit metrics

daily_index  (13:00 IST)
├── gate: coverage ≥ 70% else write SUPPRESSED and stop
├── clean → cell-assign → Jevons → aggregate → chain → bootstrap
└── publish PROVISIONAL

weekly_backtest  (Sun 14:00 IST)
└── vs DGCA tariff reference + CPI air-fare item
```

### 2.3 Retry policy

```python
RETRY = dict(
    attempts=3,
    backoff="exponential",     # 30s, 120s, 480s
    jitter=True,
    deadline="collection_window_end",   # HARD stop — no bleed into the next day
)
```

The `deadline` is the unusual part and the important one. A task that would retry past the window is abandoned and recorded as a missing cell, because a T+15 quote fetched at 09:00 is not the same observation as one fetched at 03:30 — it is a *different, silently wrong* number. Recording the gap honestly is strictly better.

---

## 3. Scale — The Actual Numbers

### 3.1 Request volume

Basket: **20 sectors × 5 lead windows (T+1/7/15/30/45)**.

The airline/OTA asymmetry matters for the arithmetic:

| Source class | Count | Searches/night | Offers per search | Quotes/night |
|---|---:|---:|---:|---:|
| OTA (returns all carriers) | 6 | 20 × 5 × 6 = **600** | ~30 | ~18,000 |
| Airline (own flights only) | 5 | 20 × 5 × 5 = **500** | ~12 | ~6,000 |
| **Total** | **11** | **1,100 searches** | — | **~24,000 quotes** |

> Note: `BUILD_PLAN.md` and the demo docs quote *~3,000 quotes/night*, which was a deliberately conservative figure for the seeded demo panel. **~24,000 is the realistic live number** for the full 11-source basket. Both are defensible; just don't quote the two in the same breath.

After dedupe (the same physical flight appears across multiple OTAs) expect **~8,000–12,000 distinct (flight, fare-class) observations**, landing in **~600 elementary cells**.

### 3.2 Time and concurrency

Fare-search SPAs are slow — progressive result rendering, multiple XHR round-trips:

| Quantity | Estimate |
|---|---|
| Playwright page load + results settle | 8–20 s (assume **15 s**) |
| Single-threaded total | 1,100 × 15 s ≈ **4.6 hours** — far too slow |
| Per-domain serial time at 1 req/6 s | 100 searches × 6 s ≈ **10 min** |
| **All 11 domains in parallel** | **~12–15 min wall clock** |

**The key insight: parallelism across domains is free; parallelism within a domain is what gets you blocked.** Eleven domains running concurrently at a polite per-domain rate finishes the entire night in under 15 minutes. You do not need to be aggressive to be fast — you need to be *wide*.

If you narrow the per-domain delay to 2 s, you save ~7 minutes on a 90-minute budget and materially raise block risk. That trade is not worth making.

### 3.3 Resource footprint

| Resource | Per unit | At concurrency 11 |
|---|---|---|
| Chromium browser context | 300–500 MB RSS | **4–6 GB** |
| vCPU per active render | ~0.5 | **~5 vCPU peak** |
| Network egress | ~2–5 MB per search | ~4 GB/night |

**Sizing verdict: 8 vCPU / 16 GB is comfortable; 4 vCPU / 8 GB works if you cap concurrency at 6 and accept ~25 min.** Memory, not CPU, is the binding constraint — Chromium contexts are the whole cost.

Mitigations that actually help:
- one browser **context** per domain, not one browser process (contexts are ~10× cheaper)
- recycle the context every ~25 tasks to bound leak growth
- `--disable-dev-shm-usage`, block images/fonts/analytics via route interception (**cuts page weight 60–70%** and is the single highest-leverage optimisation)

### 3.4 Storage growth

| Zone | Per night | Per year | Notes |
|---|---:|---:|---:|
| `fare_quotes_raw` + `_clean` | ~24k + ~10k rows | ~12M rows ≈ **2.5 GB** | Trivial. Timescale compression → ~600 MB. |
| Bronze raw HTML (uncompressed) | ~550 MB | **200 GB** | The real cost driver |
| Bronze, gzipped | ~55 MB | **20 GB** | Always compress |
| Bronze, 30-day retention | — | **~2 GB steady** | **Recommended** |

**Retention policy:** keep parsed quotes forever (they are the index's evidence). Keep raw HTML **30 days** — long enough to debug a parser regression and re-parse a bad night, short enough to stay free. Keep a payload **hash** forever so reproducibility claims still hold.

---

## 4. Where To Run It

### 4.1 Option A — Single VM (recommended)

Everything on one box via Docker Compose: Postgres/Timescale, Redis, MinIO, API, worker, scheduler, frontend.

| Provider | Spec | ~Monthly |
|---|---|---:|
| Hetzner CX32 | 4 vCPU / 8 GB / 80 GB | **~$8** |
| Hetzner CX42 | 8 vCPU / 16 GB / 160 GB | **~$18** |
| DigitalOcean | 4 vCPU / 8 GB | ~$48 |
| AWS t3.large (on-demand) | 2 vCPU / 8 GB | ~$60 |
| AWS t3.xlarge (1yr reserved) | 4 vCPU / 16 GB | ~$85 |
| **NIC / government cloud (MeghRaj)** | comparable | *procurement-dependent* |

✅ Simplest, cheapest, fully air-gappable, one `docker compose up`
✅ Matches the on-prem posture a ministry deployment will actually want
❌ Single point of failure — acceptable when a missed night is a suppressed day, not a catastrophe

### 4.2 Option B — Serverless (Cloud Run / Lambda / Fargate)

Worth costing honestly, because the instinct to reach for it here is strong and **wrong**.

**Compute is genuinely cheap.** Cloud Run at 1 vCPU / 2 GiB, 1,100 invocations × 15 s:

```
vCPU:   1,100 × 15 s × $0.000024/vCPU-s   ≈ $0.40/night  ≈ $12/mo
Memory: 1,100 × 15 s × 2 GiB × $0.0000025 ≈ $0.08/night  ≈ $2.5/mo
Requests: negligible
                                          ─────────────────────────
                                          ~$15/mo compute
```

**But the stateful tier cannot scale to zero**, and it dominates:

| Component | Managed cost/mo |
|---|---:|
| Cloud Run workers | ~$15 |
| Cloud SQL Postgres (smallest usable) | ~$25–50 |
| *or* Timescale Cloud | ~$50–100 |
| Managed Redis (Upstash / Memorystore) | ~$10–30 |
| Object storage (R2 / S3, 20 GB) | ~$1–5 |
| **Total** | **~$55–150/mo** |

**Verdict: serverless costs 3–10× more than a VM and buys nothing here.** Serverless wins when load is spiky and unpredictable and idle time dominates. This workload is *one predictable 15-minute burst per day* — the textbook case where a small always-on box is cheaper and simpler.

Platform-specific gotchas if you go this way anyway:

| Platform | Verdict |
|---|---|
| **AWS Lambda** | ❌ Painful. Chromium needs a container image; cold start 3–10 s; 15-min cap is survivable but the memory/duration billing on browser workloads is punitive. |
| **Google Cloud Run** | ✅ Best serverless fit. Container-native, up to 60 min, 32 GB, scales to zero, generous free tier. |
| **AWS Fargate** | ⚠️ Fine for long-lived browser workers, but no scale-to-zero benefit for a nightly batch — you're paying for a VM with extra steps. |

**Where serverless *does* make sense:** if collection must run from **multiple geographic regions** (fares can vary by point-of-sale), running the same worker image in 3–4 regions on Cloud Run is genuinely elegant and still ~$40/mo. That is a real reason. "It's serverless" is not.

### 4.3 Option C — Hybrid (the production answer)

```
Stateful tier   →  one VM or managed Postgres (always on)
Collection tier →  Cloud Run jobs, N regions, triggered by Cloud Scheduler
Index tier      →  runs on the stateful box; it's 30 seconds of NumPy
```

Adopt this only when multi-region point-of-sale coverage becomes a requirement. Until then, Option A.

---

## 5. Cost Model at Three Scales

### 5.1 Hackathon / demo

| Item | Cost |
|---|---:|
| Laptop (`?demo` mode needs no network at all) | **₹0** |
| Optional Hetzner CX32 for a live URL | ~$8/mo |
| Amadeus Self-Service test tier | **₹0** |
| **Total** | **~₹0–700/mo** |

### 5.2 MoSPI pilot — 20 sectors, 11 sources, daily

| Item | Monthly |
|---|---:|
| Hetzner CX42 (8 vCPU / 16 GB) | ~$18 |
| Backups + snapshots | ~$4 |
| Object storage (30-day bronze retention) | ~$2 |
| Domain + TLS | ~$1 |
| Licensed API (demoted sources, low volume) | $0–100 |
| **Total** | **~$25–125/mo** (**₹2,000–10,000**) |

The whole system runs for less than the cost of a single field price-collector's monthly travel budget. **That is the economic argument, and it is the one that lands with a ministry.**

### 5.3 National production — 200 sectors, all carriers, multi-region

| Item | Monthly |
|---|---:|
| Compute: 11,000 searches/night, ~2 hr window, 3 regions | ~$120 |
| Managed Timescale (or self-hosted on a big VM) | ~$100 |
| Redis | ~$25 |
| Object storage (~200 GB steady, compressed) | ~$10 |
| Observability | ~$25 |
| Licensed API volume | $200–800 |
| **Total** | **~$480–1,080/mo** (**₹40,000–90,000**) |

Scaling 10× the basket costs roughly **4×**, not 10× — because the index engine is O(cells) not O(quotes), storage compresses well, and per-domain politeness time is amortised across more sectors per source.

### 5.4 What actually dominates cost

Ranked, and it surprises people:

1. **Licensed API volume** — the only line that scales badly. Every source demoted from scraping to a paid API moves cost from ~$0 to per-call pricing. *This is the real budget lever, and it is decided by the compliance matrix.*
2. **Managed database** — 2–4× a self-hosted equivalent
3. **Raw HTML retention** — free if you compress and expire at 30 days, expensive if you hoard
4. **Compute** — genuinely minor at any realistic basket size

---

## 6. Coverage Risk — Why Politeness Is a Measurement Decision

The instinct is that scraping harder yields more data. For an *index*, the opposite is true, and this is worth internalising because it is the strongest argument in the project.

**Blocks are not random.** They correlate with exactly the things the index is trying to measure:

| You get blocked more... | Which biases... |
|---|---|
| on high-traffic routes (more of your requests go there) | trunk sectors — the highest-weight strata |
| at peak periods (when you're hammering hardest) | festival and surge windows — the movements that matter most |
| on the sources with the best anti-bot (usually the biggest OTAs) | the sources with the deepest inventory |

Missing-not-at-random data in the highest-weight cells during the highest-movement periods is the worst possible failure mode for a price index. It doesn't add noise — it adds **bias**, in an unknown direction, that no amount of downstream cleaning can remove.

Compare the two postures on what you actually care about:

| | Polite (1 req/6 s, 11 domains parallel) | Aggressive (1 req/1 s, high concurrency) |
|---|---|---|
| Wall clock | ~15 min | ~4 min |
| Expected coverage | 92–98% | **highly variable, degrades over time** |
| Missingness pattern | ~random (transient failures) | **systematic, correlated with demand** |
| Sources surviving to week 4 | ~all | fewer — blocks tend to become permanent |
| Index validity | defensible | **unquantifiable** |
| PS requirement met | ✅ | ❌ |

You save eleven minutes and pay for it with the credibility of the number. On a system whose only output is one number a day, that is a bad trade.

**The engineering way to raise coverage is width, not speed:**
- more **sources** per cell (each contributes independent observations)
- more **sectors** (more cells, better weighting)
- a **second daily snapshot** (intraday volatility, and a free retry surface)
- **licensed API** for anything that declines scraping — full coverage, zero block risk, known cost

All four raise coverage without raising block risk. That is where the effort should go.

---

## 7. Monitoring — The Four Signals That Matter

| Signal | Alert threshold | Why |
|---|---|---|
| **Coverage %** | < 85% warn, < 70% suppress | The publication gate. The only metric that gates output. |
| **Block rate** (429/403 per source) | > 2% | Leading indicator of a source about to be lost entirely |
| **Parse yield** (offers per successful search) | drop > 30% vs 7-day median | Detects a silent DOM change — the failure mode that produces *wrong numbers rather than no numbers*, and therefore the dangerous one |
| **Window duration** | > 90 min | Snapshot integrity — a stretched window means the cross-section is smearing across time |

Parse yield is the one people forget. A blocked scraper is loud and obvious. A scraper that still returns HTTP 200 and silently parses 3 offers instead of 30 because a CSS class was renamed will quietly corrupt the index for weeks. **Alert on yield, not just on errors.**

Grafana board: coverage gauge with the 70% line drawn, per-source yield sparklines, block-rate heatmap by source × hour, window-duration histogram.

---

## 8. Summary — The Operational Answer

| Question | Answer |
|---|---|
| **How often?** | Nightly at 03:30 IST, ≤ 90-min window, same time every day. Optional second snapshot at 15:30. Index at 13:00. |
| **How much?** | 1,100 searches → ~24,000 quotes → ~600 cells, per night |
| **How long?** | ~15 min wall clock at 11 domains in parallel |
| **How big?** | 8 vCPU / 16 GB; memory-bound on Chromium contexts |
| **Serverless?** | **No.** 3–10× the cost for a predictable nightly batch, because the stateful tier can't scale to zero. Revisit only for multi-region point-of-sale coverage. |
| **What does it cost?** | **~$25/mo pilot**, ~$500–1,000/mo at national scale. Cheaper than one field collector's travel budget. |
| **Biggest cost lever?** | Licensed API volume — set by the compliance matrix, not by engineering |
| **Biggest technical risk?** | Silent parser drift (HTTP 200, wrong data). Alert on parse yield. |
| **Biggest statistical risk?** | Non-random missingness from blocks. Mitigated by width, not speed. |
| **Hard constraint?** | **You cannot backfill a fare.** Same-night retries, hard window deadline, suppress rather than fabricate. |

---

*VIMAAN · Operations companion to the build plan · Daily. Route-specific. Reproducible. Defensible.*
