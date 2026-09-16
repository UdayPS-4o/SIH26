# VIMAAN Video Script
## Title: VIMAAN — How It Works
## Duration: ~3 minutes

---

### SCENE 1 — Opening (0:00 – 0:20)
**Camera:** Wide shot of a dark cockpit-style dashboard. The VIMAAN APIx index line is rising gently across a 90-day chart.
**VO:** "VIMAAN builds an airline-fare index from real data. Here is how."

### SCENE 2 — Raw Quotes (0:20 – 0:45)
**Screen recording:**
1. Navigate to the Quotes panel.
2. Apply a filter: Sector = DEL-BOM, Lead = T+15.
3. The table updates instantly.
4. Point out the fare split: base, taxes, UDF, convenience fee.

**VO:** "Quotes are pulled from airline sites and OTAs every night. Each one is split into base fare, taxes, user development fee, and convenience fee. Sold-out seats are recorded, not dropped, because they carry pricing information."

### SCENE 3 — Compliance (0:45 – 1:10)
**Screen recording:**
1. Navigate to the Compliance panel.
2. Show the robots.txt table — one row per source, green check or red X.
3. Show the Kill Switch table — sources that hit 429s in the last 24 hours are quarantined.

**VO:** "Every scrape respects robots.txt. After three consecutive 429s from one domain, the kill-switch automatically quarantines that source for 24 hours. There is no bypass."

### SCENE 4 — Live Scrape (1:10 – 1:45)
**Screen recording:**
1. Navigate to the Quotes panel.
2. Click the **"Run live scrape"** button in the Live fare scrape panel.
3. Log shows: "Connecting to Cleartrip & MakeMyTrip via Playwright..."
4. Wait 15-30 seconds.
5. Quotes appear in the results table with fare breakdown.
6. If the button is disabled and shows "Scraping...", click it after completion to trigger again.

**VO:** "The live-scrape button kicks off a real-time Playwright session. Fingerprint-masking patches 20-plus automation signals: webdriver, user-agent data, webGL vendor, Chrome runtime, plugins, and languages. Requests are rate-limited at four seconds per domain. No CAPTCHA-bypass service is used."

### SCENE 5 — API Explorer (1:45 – 2:15)
**Screen recording:**
1. Navigate to the API Reference page.
2. Show the left sidebar: 46 endpoints across 18 tags.
3. Click **POST /api/v1/scraper/live-scrape**.
4. Press **Send** — response shows 5 live quotes with compliance metadata.
5. Show the compliance block: stealthActive, robotsChecked, rateLimitDelayS, killSwitch.

**VO:** "Every screen in VIMAAN is a client of these endpoints. The API explorer fires real requests to the backend with your JWT token. The live-scrape endpoint returns the same quotes you just saw, plus full compliance metadata."

### SCENE 6 — Index & Methodology (2:15 – 2:40)
**Screen recording:**
1. Navigate to the Methodology page.
2. Show the formula for APIx.
3. Navigate to the Index page — show the 90-day APIx line.
4. Point to the publication gate: 70 percent minimum coverage.

**VO:** "The APIx index uses cell-mean imputation for missing values, Winsorisation at the 5th and 95th percentiles, and a 70-percent coverage gate before any nightly number is published."

### SCENE 7 — Closing (2:40 – 3:00)
**Screen recording:**
1. Show the three-panel layout: Quotes on the left, Scraper status in the centre, Index on the right.
2. A single fare quote highlights, then expands to show its cell key.
3. The APIx line pulses once.
4. Fade to black. VIMAAN logo. "Built for Smart India Hackathon 2026."

**VO:** "From raw quotes to a national fare index — fully compliant, fully reproducible, fully transparent."

---

## Production notes
- Record screen at 1920 x 1080, 30 fps.
- Use the dev server at localhost:5173.
- Have backend running at localhost:8000 for live-scrape demo; fall back to mock if needed.
- Keep mouse movements smooth — use a cursor-highlighter tool if available.
- Mute system notifications before recording.
- Export as MP4 (H.264) for submission.
