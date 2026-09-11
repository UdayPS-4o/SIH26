# APIx · Smart India Hackathon 2026 · Video Demo Script

**Total runtime:** ~1 minute 45 seconds
**Tone:** confident, matter-of-fact, technical but accessible
**Speaker:** one person, front of camera or voice-over with screen recording
**Format:** screen capture of the live dashboard, with speaker camera overlay in bottom-right (optional)

---

## Shot 1 · Opening hook — 0:00 – 0:15

**VISUAL:** Start on the **Dashboard** home page. The KPI strip is in view —
"Overall APIx 104.42", "24/24 Routes Covered", "2h ago — last scrape".
The system health callout reads "12 of 12 sources active, 2,847 fresh quotes".

**SPEAKER (VO or camera):**
> "Every day, over ninety percent of domestic air tickets in India are sold online — yet
> the official Consumer Price Index still collects airfare data manually. APIx closes that gap.
> It continuously scrapes eight airlines and four online travel aggregators, cleans the data,
> and publishes a real-time Airfare Price Index updated twice daily."

---

## Shot 2 · Source registry & scraping engine — 0:15 – 0:40

**VISUAL:** Navigate to **Scraper Config** in the sidebar. The "Source registry"
table shows all twelve sources — IndiGo, Air India, Akasa Air, SpiceJet, Air India Express,
MakeMyTrip, Yatra, EaseMyTrip, Cleartrip, Ixigo, Goibibo, and one OTA partner.
Each row has a toggle, a throttle slider, a kill-switch, and a success-rate indicator.
Below it, the "Scheduling" card shows the next run countdown and the daily 06:00 IST window.

**SPEAKER:**
> "Our multi-source scraping engine covers all major Indian airlines and the top four OTAs.
> Each source has its own throttle, retry policy, and kill-switch so operators can pause any
> source instantly without touching the rest. The scheduler runs twice daily at six in the morning
> and again in the evening, with full cron control for festival windows."

---

## Shot 3 · Anti-bot & ethical safeguards — 0:40 – 0:55

**VISUAL:** Scroll down within Scraper Config to the "Anti-bot and ethical measures" card.
Ten rules are listed: robots.txt compliance, 4-second minimum delay, jittered intervals,
User-Agent rotation, CAPTCHA detection with auto-pause, IP rotation via proxy pool,
session cookie management, respectful crawl-depth limits, robots.txt re-validation on every deploy,
and explicit ToS review for each new source.

**SPEAKER:**
> "Ethical scraping is non-negotiable. Every request respects robots.txt, enforces a minimum
> four-second delay between hits, rotates user agents, and pauses automatically on CAPTCHA detection.
> The proxy pool rotates IPs to avoid throttling, and every new source undergoes a legal terms-of-service
> review before it's added."

---

## Shot 4 · Data pipeline — 0:55 – 1:10

**VISUAL:** Switch to the **Scraper Architecture** page. The five-stage pipeline
is shown as a vertical timeline — Fetch → Parse → Clean → Normalise → Index —
with per-stage timing. The quality gate card lists: outlier removal (3-sigma),
duplicate detection, fare-component split (base fare, taxes, UDF, convenience fee),
sold-out and cancellation handling, and missing-value imputation.

**SPEAKER:**
> "Raw quotes go through a five-stage pipeline before they touch the index. We split every
> fare into base fare, fuel surcharge, user development fee, and convenience fee — because those
> components move differently and the index needs to track each one."

---

## Shot 5 · Index & sector heatmap — 1:10 – 1:35

**VISUAL:** Navigate to the **Index** page. The main APIx chart shows 90 days of
historical values with the current daily, weekly, and monthly index readings.
Below it, the sector heatmap grid — rows and columns are cities, cell colour intensity
shows the price level for each city-pair. Click a cell to expand a tooltip with
the exact value, trend, and confidence band.

**SPEAKER:**
> "The core of the platform is the APIx index itself — computed at daily, weekly, and monthly
> frequencies using the Paasche-Superial-Dorbis formula with weights derived from DGCA passenger-traffic
> data. The heatmap gives MoSPI and RBI analysts an at-a-glance view of how fares move across
> every route in the basket."

---

## Shot 6 · Forecast & backtest — 1:35 – 1:55

**VISUAL:** Navigate to **Forecast**. The chart shows the last 60 days of
actual index values and a 30-day forward projection with a shaded confidence band.
A table below shows per-sector 7-day, 14-day, and 30-day forecasts with confidence
ratings. Festival events card shows Diwali and Christmas surge projections.

**SPEAKER:**
> "APIx also forecasts fare movements up to thirty days out, factoring in lead-time elasticity,
> day-of-week patterns, and upcoming festivals. Our backtest module validates each forecast against
> actual data, and we maintain thirty days of back-tested results against DGCA published averages."

---

## Shot 7 · Reports & closing — 1:55 – 2:00

**VISUAL:** Navigate to **Reports**. Show the report-template gallery —
"Daily Brief", "Weekly Summary", "Monthly Analysis", "Sector Deep Dive".
Click "Generate" on the Daily Brief — a progress bar fills, then a download button
appears for PDF and HTML. Cut to a wide shot of the full sidebar showing all modules.

**SPEAKER:**
> "Reports are auto-generated in PDF and HTML for MoSPI's eSankhyiki portal and direct
> consumption by the RBI. Thank you. This is APIx — real-time airfare intelligence for India."

---

## Production checklist

| Item | Status |
|---|---|
| Record at 1080p, 60 fps | ☐ |
| Enable "show clicks" cursor highlight | ☐ |
| Zoom in on table cells and chart tooltips | ☐ |
| Add background music (low, instrumental) | ☐ |
| Burn in team name + problem ID at start | ☐ |
| Export as MP4, max 200 MB for Smart India Hackathon portal | ☐ |
