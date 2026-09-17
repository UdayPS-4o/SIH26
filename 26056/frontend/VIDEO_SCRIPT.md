# VIMAAN Demo Video — Scene-by-Scene Script
## Duration: ~3 min | Format: 1920×1080 MP4 (H.264)
## Voiceover style: natural, narrated while screen-recording

---

### TITLE CARD — 0:00 – 0:15
**Visual:** Black screen. VIMAAN wordmark fades in.
**VO:** "VIMAAN builds a transparent, reproducible airline-fare index from real public data. Here is how it works."

---

### SCENE 1 — The Raw Quotes Table — 0:15 – 0:50
**Action:**
1. Browser opens to `localhost:5173/quotes`.
2. Show the filter row at the top. Select Sector = `DEL-BOM`, Lead window = `T+15`.
3. The table updates instantly. Scroll down.
4. Hover over one row — highlight the four-way fare split (Base, Taxes, UDF, Convenience).
5. Point out the Flags column — imputed, winsorised, sold-out badges.

**VO:** "Quotes are collected nightly from airline websites and OTAs. Each row stores its four-way fare split: base fare, fuel surcharge and other taxes, the user development fee, and the OTA convenience charge. Sold-out seats are recorded, not dropped, because they carry pricing signal."

---

### SCENE 2 — Compliance & Kill Switch — 0:50 – 1:15
**Action:**
1. Click the Compliance tab.
2. Scroll through the robots.txt table — show green checkmarks for compliant sources.
3. Scroll to the Kill Switch table — point to a quarantined source (red badge).
4. Hover to show the reason: "Three consecutive 429s in the last 24 hours."

**VO:** "Every scrape respects robots.txt. If a domain returns three consecutive 429 errors, the kill-switch quarantines that source for 24 hours. No bypass, no exception."

---

### SCENE 3 — Live Scrape Button — 1:15 – 1:50
**Action:**
1. Navigate back to Quotes (click the Quotes tab or sidebar link).
2. Scroll to the **Live fare scrape** panel below the stat tiles.
3. Click **Run live scrape**.
4. The button becomes disabled and shows "Scraping..."
5. Watch the log box update: "Connecting to Cleartrip & MakeMyTrip via Playwright..." → "Processing responses..." → "Done — 5 quotes from 2 sources"
6. Quotes populate the results table with fare breakdowns.
7. Point out the Stealth column (100% green meter) and the Playwright note.

**VO:** "The live-scrape button fires a real Playwright session with 20-plus stealth fingerprint patches: webdriver flag, user-agent data, webGL vendor, Chrome runtime, plugin list, and language headers. Requests are rate-limited to four seconds per domain. No CAPTCHA-bypass service is used."

*(If backend is unavailable, say: "The mock fallback shows the same data shape so the video still demonstrates the flow.")*

---

### SCENE 4 — API Explorer — 1:50 – 2:20
**Action:**
1. Click the API Reference tab.
2. Show the left sidebar — scroll through tags: Auth, Index, Sectors, Quotes, Compliance, Anomalies, Forecast, Analysis, Methodology, Scraper, Reports, Exchange, Reference, Admin.
3. Click **POST /api/v1/scraper/live-scrape**.
4. Press Send.
5. The response panel shows the live-scrape result JSON — scroll through the `results` array.
6. Show the compliance block in the response: stealthActive, robotsChecked, rateLimitDelayS, killSwitch: ARMED.

**VO:** "Every screen in VIMAAN is a client of these 46 endpoints. The API explorer fires real requests with your JWT token. Here is the live-scrape endpoint — the same quotes you just saw, plus full compliance metadata in the response."

---

### SCENE 5 — Methodology — 2:20 – 2:40
**Action:**
1. Click the Methodology tab.
2. Show the formula for APIx — the cell-mean imputation formula and the Winsorisation bounds.
3. Click to the Index page — show the 90-day APIx line.
4. Hover to show the publication status: FROZEN, REVISED, PROVISIONAL.
5. Point to the 70% coverage gate badge.

**VO:** "The APIx index uses cell-mean imputation for missing values, Winsorisation at the 5th and 95th percentiles, and a 70-percent minimum coverage gate before any nightly number is published."

---

### SCENE 6 — Closing — 2:40 – 3:00
**Action:**
1. Split screen: left shows Quotes table with filters active, centre shows the API explorer with the live-scrape endpoint selected, right shows the 90-day APIx chart trending up.
2. A single fare row highlights — it pulses once.
3. Fade to black.
4. "VIMAAN · Smart India Hackathon 2026" + team name.

**VO:** "From raw quotes to a national fare index — fully compliant, fully reproducible, and fully transparent. Thank you."

---

## Pre-recording checklist
- [ ] Backend running at `localhost:8000` (or mock fallback will activate)
- [ ] Dev server running at `localhost:5173`
- [ ] Logged in with a non-mock JWT token
- [ ] Screen recording tool ready (OBS Studio, Camtasia, or built-in)
- [ ] Cursor highlighter enabled
- [ ] Notifications muted
- [ ] Browser at 1920×1080 resolution

## Post-production checklist
- [ ] Add chapter markers at each scene transition
- [ ] Add background music at low volume (VO should remain primary)
- [ ] Export as MP4 (H.264, 1920×1080, 30fps)
- [ ] File size under 500MB for submission platform
