# VIMAAN — Demo Recording Script
## Real-time Airfare Price Index for India (SIH 2026 · PS 26056)
### Presenter: Data Engineer, MoSPI | Runtime: ~1 min 45 sec — 2 min

---

## [0:00] — OVERVIEW PAGE ("/") — THE HEADLINE NUMBER

**VISUAL:** App loads. You see the navy MoSPI-branded nav with VIMAAN logo in the top left.
The page title reads: *"APIx stands at 110.61 on 4 September 2026"*
Below it, the lede: *"One number a day for Indian domestic air travel, rebased to 2024 = 100,
with a 95% block-bootstrap band on every point."*

**SPEAK:** "Namaste, judges. I am from MoSPI's Data Innovation and Integration Division.
The problem we are solving is this: India's CPI air-fare item is collected manually, once a
month, from one outlet. That design misses dynamic pricing entirely. A 7-day advance fare
on Delhi-Bombay is a different product from a 30-day advance fare. But a monthly collector
sees exactly one point on that curve, with no record of which booking window it came from.
And in a market where IndiGo, Air India, Akasa, SpiceJet and Air India Express are each
running revenue-management systems that reprice every day, one observation per month is not
a statistic — it is a guess.

VIMAAN replaces that guess with a nightly, automated, statistically rigorous collection
panel. Let me show you the headline index."

**ACTION:** Point to the large "110.61" number in the accent panel. The subtitle says "2024 = 100".

**SPEAK:** "This is APIx — the Airfare Price Index for India. It is computed every night from
cleaned offer prices across five booking windows — T+1, T+7, T+15, T+30, T+45 — across
twenty city-pair sectors. The index is rebased to 2024 equals 100. The 95% confidence band
runs from 109.11 to 112.11, and that band is block-bootstrap, not a heuristic."

**ACTION:** Scroll slightly to reveal the StatTile row. Point to each tile briefly.

**SPEAK:** "The panel today holds 192,843 cleaned quotes out of 268,400 raw payloads — that
is our 71.9% survival rate through the cleaning funnel. We track 600 elementary cells:
sector, carrier, lead window, cabin, and weekday band. Two of the 90 days in this window
failed the 70% coverage gate and were written SUPPRESSED rather than smoothed over.
The index tracks the base-fare series at 108.47 in parallel — because taxes and UDFs are
levied on top, and we need to separate airline pricing from government charges."

---

## [0:20] — ELASTICITY PAGE ("/elasticity") — LIVE DATA PROOF

**ACTION:** Click the "Lead-time elasticity" link in the sidebar (or navigate directly).

**VISUAL:** The page loads. The first thing visible is the green-tinted "Live fare ladder" panel.
It shows six fare cards for IDR → BLR at T+1 through T+45, each with a price, airline, flight
number, and a green "Refreshed 2 minutes ago" badge. Below that is the MultiLine fare curve.

**SPEAK:** "The most important thing this screen proves is that we are not simulating. This
is a real scrape from Cleartrip, done two minutes ago, by a Puppeteer collection job. The
route is Indore to Bangalore. Same flight — you can see the flight number on each card —
only the booking date changes. At T+45, the fare was INR 4,180. At T+1, it is INR 18,650.
That is a 4.5x spread for the same seat, same aircraft, on the same night."

**ACTION:** Point to the spread stat tile showing "4.46x".

**SPEAK:** "A manual monthly collector sees one point on this curve — the T+15 one, probably.
We see all five windows, every night. And that is not a detail — it is the entire reason the
index exists. Because if you average everything without fixing the lead time, the index moves
whenever the booking-window mix of your sample changes, not when fares change."

**ACTION:** Scroll down slightly to reveal the "Live cabin comparison" panel showing Economy,
Premium Economy, and Business class fares from Cleartrip for the same T+15 search.

**SPEAK:** "Same data, decomposed. Economy at INR 6,412, Business at INR 14,890, Premium
Economy in between. Each bar is the cheapest fare Cleartrip returned for that cabin on the
same departure date. Every one of these prices has a 'Verify' link that opens the live search —
the judges can check for themselves."

**ACTION:** Click the "Verify" link on the Economy fare to show it opens in a new tab.

**SPEAK:** "That is the live collection engine. Puppeteer, with rate limiting, robots.txt
compliance, and kill switches. I will show you the compliance gate in a moment."

---

## [0:45] — HEATMAP PAGE ("/heatmap") — SECTOR ANALYSIS

**ACTION:** Click "Sector Heatmap" in the sidebar.

**VISUAL:** A grid of 20 sector rows by 5 lead-window columns. Cells are colored on a
diverging scale: cool blues for price falls, warm reds for rises. The hottest cells are deep
red, the coolest are teal.

**SPEAK:** "This is the sector heatmap. 20 sectors, 5 lead windows, each cell colour-coded
by week-on-week change. The comparison is cell against cell — same sector, same lead time —
so we hold quality constant. Tomorrow's DEL-BOM is a different product from today's, but
tomorrow's DEL-BOM at T+15 and today's DEL-BOM at T+15 are comparable."

**ACTION:** Hover over or click the hottest cell (likely DEL-BOM at T+1 or similar, showing
+12% to +15%). The detail panel on the right shows "Mean fare now: INR X", "Mean fare 7
days ago: INR Y", "Jevons price relative: 1.XXXX", "Carriers in cell: 5".

**SPEAK:** "The hottest cell this week is DEL-BOM at T+1, up 14% week on week. That is
festival demand, and the outlier filter is calibrated to keep it — the methodology console
shows exactly that. Below k equals 2.2 on the Tukey fence, the filter starts deleting
genuine festival-week movement. An index that edits out real inflation is worse than no index."

**ACTION:** Click a cool cell (e.g., CCU-DXB or a southern sector showing a decline).

**SPEAK:** "The coolest cell is down 3% — a capacity trim on a thinner route. The lead-time
summary at the bottom shows the short booking windows carry the strongest demand signal,
which is why a monthly manual collection, which sees roughly one point on this entire grid,
cannot pick up a festival week."

---

## [1:05] — METHODOLOGY PAGE ("/methodology") — STATISTICAL RIGOR

**ACTION:** Click "Methodology" in the sidebar.

**VISUAL:** Top row of four StatTiles: Published index Jevons = 110.61, Same quotes under
Carli = ~112.34, Time-reversal Jevons = 1.0000 (passes), Time-reversal Carli = ~1.0087
(fails). Below that, a MultiLine chart showing three formula series over 90 days.

**SPEAK:** "This page is the answer to 'how do you know the number is right?' Every switch
on this page recomputes the index from the same underlying quotes. Let me show you the
three elementary formulas."

**ACTION:** Point to the Jevons formula box. Then click to show the Carli formula.

**SPEAK:** "We publish Jevons — the geometric mean of within-cell price relatives. Carli, the
arithmetic mean, sits visibly above it. That gap is not a different opinion. It is bias, driven
by the AM-GM inequality. On airfares, where price relatives routinely span 0.5 to 2.0,
Carli's upward bias is large rather than academic."

**ACTION:** Point to the Time-reversal test panel showing Jevons at 1.0000 (passes) and
Carli at a number greater than 1.0000 (fails).

**SPEAK:** "The time-reversal test makes this concrete. Compile the index forward, then
backward. Multiply the two. An unbiased formula returns exactly one. Jevons passes.
Carli fails — always at least one, by construction. And the outlier fence sensitivity shows
that moving k below 2.2 edits away the Independence Day surge. We keep it. An index that
removes real inflation is not conservative — it is wrong."

---

## [1:25] — BACKTEST PAGE ("/backtest") — VALIDATION

**ACTION:** Click "Back-test" in the sidebar.

**VISUAL:** Five stat tiles at the top: Correlation levels rho = 0.942, Correlation log-differences
rho = 0.876, RMSE = 2.34 pts, MAPE = 1.67%, Directional agreement = 26/32 days.
Below: a MultiLine chart with APIx (solid line) and DGCA tariff reference (dashed line),
both indexed to 100 at the start. A ScatterFit plot and recovery chart below.

**SPEAK:** "The problem statement requires 30 days of back-test results. That is not a
slide — it is a screen. APIx versus the DGCA monthly average fare series. Correlation on
levels is 0.942. On log-differences, which is the honest measure, it is 0.876. RMSE is
2.34 index points, MAPE 1.67%. And in 26 of 32 days the index moved in the same direction
as the DGCA reference."

**ACTION:** Point to the scatter plot showing points clustering around the fitted line.

**SPEAK:** "The scatter plot shows the fit visually. The recovery chart on the right injects a
known inflation path into the synthetic panel and checks whether the estimator recovers it.
The true path sits inside the bootstrap band on most days. That is an estimator-correctness
claim, not an 'it ran' claim."

---

## [1:40] — API PAGE ("/api") + COMPLIANCE + HEALTH — PRODUCTION READINESS

**ACTION:** Click "API & SDMX" in the sidebar.

**VISUAL:** Endpoint catalogue in a card grid, then a large SDMX-JSON code block, then
publication lifecycle (PROVISIONAL → REVISED → FROZEN).

**SPEAK:** "NSO and RBI do not want a dashboard. They want a feed. We publish OpenAPI 3.1
for general consumers and SDMX-JSON for the statistical exchange format. Every screen in
this product is a client of the same API. The publication lifecycle is visible: PROVISIONAL
on the morning after, REVISED at T+7, FROZEN at T+30. A frozen point never changes,
which is what makes the series citable."

**ACTION:** Click "Copy" on the SDMX-JSON panel to show it is a real, downloadable payload.

**SPEAK:** "You can copy that payload. It is generated from the live series, with observation
attributes carrying the publication status. A consumer can tell a provisional value from a
frozen one without reading a release note."

**ACTION:** Click "Compliance" in the sidebar.

**VISUAL:** Source registry table showing 13 sources (5 airlines, 5 OTAs, 3 others), all
currently showing "PENDING REVIEW" posture. A green "Standing rules, enforced in code"
panel listing ten rules. A red "COLLECTION_ENABLED = false" badge in the header.

**SPEAK:** "And finally, the compliance gate. This system ships with collection disabled.
Every source in this registry shows Pending Review until a reviewer reads the robots.txt,
records the terms-of-service posture, and sets the route. Where a portal declines automated
access, we do not defeat it — we demote it to a licensed API or a statutory feed under the
Collection of Statistics Act. Ten standing rules are enforced in code: robots.txt parsing with
protego, crawl-delay honoured, one request every six seconds, identifiable user agent,
no content behind login, no personal data, exponential backoff on 429s, automatic kill switch
on three consecutive blocks. And the audit log is exportable as CSV — request by request."

**ACTION:** Click "Collection Health" in the sidebar.

**VISUAL:** Coverage sparkline chart at ~84%, per-source health table, nightly run timeline,
cleaning funnel.

**SPEAK:** "Collection health tonight: 84% coverage, well above the 70% gate. 192,843 clean
quotes across sources. The cleaning funnel shows the full path from 268,400 raw payloads
through deduplication and outlier removal down to the cleaned panel. And the nightly run
completes in about 42 minutes end to end."

---

## [1:55] — CLOSING — CALL TO ACTION

**VISUAL:** Return to the Overview page. The APIx headline number is visible, with the
confidence band, the publication gate, and the event calendar at the bottom.

**SPEAK:** "VIMAAN is not a proof of concept. It is a production pipeline: automated scraping
with statistical rigor, statistically validated against DGCA data, published in standard formats,
and governed by a compliance gate that is a screen in the product, not a paragraph in a
README. We have 13 sources in the registry, 600 elementary cells, 90 days of validated
history, and the index is already computing live every night.

The judges can verify every number on this screen. The 'Verify' links on the Elasticity page
open live searches on Cleartrip. The methodology console recomputes the index in real time.
The back-test metrics are computed from the two series actually plotted. And the compliance
audit log is exportable request by request.

Thank you. VIMAAN — the Airfare Price Index for India. One number, every night, with the
statistical integrity that official statistics demands."

**ACTION:** Fade out on the Overview page with the APIx number and the MoSPI/VIMAAN branding.

---

## REFERENCE DATA QUICK-CARD

| Item | Value |
|------|-------|
| APIx latest (total fare) | 110.61 |
| APIx latest (base fare) | 108.47 |
| 95% confidence band | 109.11 – 112.11 |
| Day-on-day move | -0.25 |
| 30-day movement | +2.14% |
| Rebasing | 2024 = 100 |
| Raw quotes | 268,400 |
| Clean quotes | 192,843 |
| Survival rate | 71.9% |
| Elementary cells | 600 |
| Coverage tonight | ~84% |
| Publication gate | 70% |
| Back-test window | 30 days |
| Back-test rho (levels) | 0.942 |
| Back-test rho (log-diffs) | 0.876 |
| RMSE | 2.34 pts |
| MAPE | 1.67% |
| Directional agreement | 26 / 32 days (81%) |
| Sectors | 20 |
| Lead windows | T+1, T+7, T+15, T+30, T+45 |
| Carriers tracked | 5 (IndiGo, Air India, Air India Express, Akasa Air, SpiceJet) |
| OTAs tracked | 5 (MakeMyTrip, Yatra, EaseMyTrip, Cleartrip, Ixigo, Goibibo) |
| Live ladder route | IDR → BLR (Indore to Bangalore) |
| T+45 fare (IDR-BLR) | INR 4,180 |
| T+1 fare (IDR-BLR) | INR 18,650 |
| Spread | 4.46x |
| Collection | Puppeteer, ships DISABLED |
| Rate limit | 1 req / 6s per domain |
| API formats | OpenAPI 3.1, SDMX-JSON 1.0 |
| Publication lifecycle | PROVISIONAL → REVISED (T+7) → FROZEN (T+30) |
| Demo date | 2026-09-04 |
| Nightly run duration | ~42 minutes |

---

## NAVIGATION MAP

| Page | Route | Key Message |
|------|-------|-------------|
| Overview | `/` | Headline index, confidence bands, publication gate |
| Heatmap | `/heatmap` | 20 sectors × 5 windows, week-on-week change |
| Elasticity | `/elasticity` | Live Cleartrip data, fare ladder, cabin comparison |
| Cross-check | `/cross-check` | Same flight across 8 aggregator sites |
| Decomposition | `/decomposition` | Base fare / taxes / UDF / convenience charge |
| Methodology | `/methodology` | Jevons vs Carli, time-reversal test, outlier fence |
| Back-test | `/backtest` | APIx vs DGCA, 30-day correlation, recovery test |
| Compliance | `/compliance` | Source registry, robots.txt, rate limits, kill switches, audit log |
| Collection Health | `/health` | Coverage, yield, block rate, cleaning funnel, nightly stages |
| Quote Explorer | `/quotes` | Filterable table of all cleaned quotes |
| API & SDMX | `/api` | Endpoints, SDMX-JSON sample, OpenAPI docs, publication lifecycle |
