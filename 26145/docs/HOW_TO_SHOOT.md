# HOW TO SHOOT — EKADHARA Demo Video
**SIH26145 · NTRO · Smart India Hackathon 2026**

---

## What You're Making

A **2-minute screen recording** that makes judges lean forward in their seats. No webcam, no talking head, no animated intros. Just your dashboard looking so good they forget they're evaluating a prototype.

**Format:** 1080p, 60fps, MP4
**Length:** 2:00 exactly (120 seconds)
**Tool:** OBS Studio (free) or any screen recorder

---

## Pre-Shoot Checklist (15 minutes)

### 1. Prepare the machine
- [ ] Close ALL other apps (no notifications, no taskbar clutter)
- [ ] Set desktop wallpaper to solid black
- [ ] Disable Windows notifications (Settings → System → Notifications)
- [ ] Open Chrome in **Incognito** mode (Ctrl+Shift+N)
- [ ] Disable all Chrome extensions (chrome://extensions/)
- [ ] Hide bookmark bar (Ctrl+Shift+B)
- [ ] Resize browser to **1920×1080** (F11 for fullscreen)

### 2. Start the system
```bash
# Terminal 1 — Backend
cd C:/Users/udayp/Documents/code/SIH26/26145/backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn websockets numpy scikit-learn scipy
python main.py

# Terminal 2 — Frontend
cd C:/Users/udayp/Documents/code/SIH26/26145/frontend
npm install
npm run dev
```

### 3. Pre-load the dashboard
- Open `http://localhost:5178` in Chrome
- Wait for boot sequence to complete (~7 seconds)
- Wait 30 seconds for alerts to populate (you should see 20+ alerts in the feed)
- **Do NOT close the browser** — this is your starting state

### 4. Configure OBS
- **Resolution:** 1920×1080
- **FPS:** 60
- **Source:** Window Capture → Chrome
- **Hotkey:** Set record start/stop (e.g., Ctrl+R)
- **Audio:** None needed (no narration)

---

## The 8-Shot Script (2:00 total)

### SHOT 1 — Terminal Boot (0:00 – 0:15) ★ COLD OPEN

**Screen layout:** 2 terminals side-by-side (Windows Snap: Win+Left/Right)

**Left terminal — Backend:**
```
(venv) C:\...\26145\backend> python main.py
[ML] Loading ensemble models...
[ML]   IsolationForest (n=200, contamination=0.15)
[ML]   LogisticRegression (multi-class, 8 classes)
[ML]   Feature vector: 15 dimensions
[ML]   Training data: 5000 synthetic samples
[ML] Models loaded — v1.0
[DETECTOR] 7 detection strategies active
[SYSTEM] WebSocket server :8000/ws
[SERVER] Starting uvicorn on http://0.0.0.0:8000
[SERVER] Throughput target: 10,000 flows/sec
████████████████████████████████████████████████████
  BACKEND ONLINE — PASSIVE MONITORING ACTIVE
████████████████████████████████████████████████████
```

**Right terminal — Frontend:**
```
C:\...\26145\frontend> npm run dev

  VITE v6.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5178/
  ➜  Network: use --host to expose
```

**Action:** Type `python main.py` in left terminal. Wait for boot sequence output. Then `npm run dev` in right. Wait for "ready". Alt+Tab to Chrome. The dashboard loads automatically.

**Camera:** Start recording RIGHT BEFORE you type `python main.py`

---

### SHOT 2 — Boot Sequence (0:15 – 0:30)

**What's on screen:** The EKADHARA boot terminal fills the screen.

You see:
```
 ██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ ██╗   ██╗
 ██║ ██╔╝██║   ██║██╔══██╗██╔════╝██╔══██╗╚██╗ ██╔╝
 ...
 ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝

[BOOT] Initializing kernel...
[BOOT] Memory test: 32768 MB OK
[NET] Binding to enp0s3 (10.0.0.1/24)
[NET] Mirror port active — read-only mode
[NET] Data diode check: UNIDIRECTIONAL ✓
[NET] No return path — passive monitoring ONLY
[ML] Loading ensemble models...
[DETECTOR] 7 detection strategies active
  SYSTEM ONLINE — PASSIVE MONITORING ACTIVE
```

**Action:** Nothing. Just watch the boot sequence play out. This is the "hacker booting into the system" moment.

---

### SHOT 3 — Dashboard Load (0:30 – 0:45)

**What happens:** Boot screen fades → Dashboard materializes.

You see:
- **HUD bar** at top: `◈ EKADHARA // DASHBOARD` + `PS-26145 // NTRO` + `DIODE READ-ONLY` indicator (green pulsing dot)
- **ASCII logo** at top left
- **8 stat boxes** in a grid: TOTAL PROCESSED, FLOWS/SEC, ACTIVE THREATS, AVG CONFIDENCE, UPTIME, CONNECTIONS, CRITICAL, HIGH
- **Threat Level Meter** — red bar showing current threat level
- **Alert Timeline** — live line chart
- **Threat Distribution** — bar chart
- **Terminal Log** at bottom — scrolling alerts in real-time

**Action:** Let it sit for 5 seconds. Scroll down slowly to show the terminal log filling with alerts.

---

### SHOT 4 — Live Threat Feed (0:45 – 1:00)

**What's on screen:** The full Live Threats page.

Click the **"LIVE THREATS"** button in the sidebar.

You see:
- **Table of alerts** scrolling in real-time
- Columns: Severity, Timestamp, Threat Type, Source IP → Dest IP, Confidence, Protocol/Ports
- Each row color-coded: CRITICAL (red), HIGH (orange), MEDIUM (amber)
- **Live indicator** pulsing in the top-right corner
- Stats bar: FPS, ALERTS count, STATUS: LIVE

**Action:** Click the first alert row to expand it. Show the "Full Evidence Report" with all the key=value evidence fields. Then collapse it.

---

### SHOT 5 — Sidebar Navigation Tour (1:00 – 1:20)

**Action:** Click through each sidebar item, spending 2-3 seconds on each:

1. **DASHBOARD** — Back to main (2 sec)
2. **LIVE THREATS** — Alert feed (already here, 2 sec)
3. **NETWORK MAP** — Force-directed graph with threat nodes, red pulsing attackers, green internal nodes, blue servers (3 sec)
4. **ANALYTICS** — Charts, heatmaps, time-series (3 sec)
5. **AI ANALYZER** — Model performance metrics, confusion matrix, feature importance (3 sec)
6. **EVIDENCE REGISTRY** — Table of 35+ threat evidence items with hashes, severity, threat class (3 sec)
7. **ACTIVITY LOG** — Audit trail of all system events (2 sec)
8. **INTEGRATIONS** — API endpoints, SIEM connectors (2 sec)
9. **ADMINISTRATION** — System settings, throughput config (2 sec)

---

### SHOT 6 — Threat Detection Demo (1:20 – 1:40)

**Action:** Go back to **LIVE THREATS** page.

1. Point at the alert feed — new alerts appearing every 1-2 seconds
2. Click a **"TLS Anomaly"** alert — expand to show JA3 fingerprint in the evidence section
3. Click a **"DDoS"** alert — show packet_count, unique_src_ips evidence
4. Click a **"Beaconing"** alert — show inter-arrival data

**Key thing to show:** The alert expands and shows structured evidence. This proves the standardized alert schema works.

---

### SHOT 7 — Code Walkthrough (1:40 – 1:50)

**Screen layout:** Switch to VS Code window (Alt+Tab or click taskbar icon)

**Action:** Show 3 files, 3 seconds each:

1. `detector.py` — Scroll to `_detect_ddos` function, show the confidence calculation
2. `models.py` — Show `DetectionEnsemble` class, IsolationForest + LogisticRegression
3. `features.py` — Show `FlowFeatures` dataclass, 15 feature fields

**Text to highlight:** Point at the actual sklearn imports and model initialization code.

---

### SHOT 8 — Closing (1:50 – 2:00)

**Action:** Switch back to Chrome dashboard.

1. Point at the **HUD bar** — specifically the `DIODE READ-ONLY` indicator
2. Point at the **FLOWS/SEC** stat box showing live throughput
3. Show the terminal log filling with alerts
4. **FADE TO BLACK**

**Final text on screen (if you want to add in post):**
```
EKADHARA v2.1.0
PS-26145 · NTRO · SIH26
Passive. Real-time. Unidirectional.
```

---

## Post-Production (30 minutes)

### In OBS or any video editor:

1. **Trim** to exactly 2:00 (120 seconds)
2. **Add text overlays** at the bottom for each shot:
   - Shot 1: "Terminal boot — Backend + Frontend"
   - Shot 2: "Boot sequence — 7 detection strategies loading"
   - Shot 3: "Dashboard — 8 stat boxes, live data"
   - Shot 4: "Live threat feed — real-time alert streaming"
   - Shot 5: "9 pages — Network Map, Analytics, AI Analyzer, Evidence Registry"
   - Shot 6: "Structured alerts with evidence — OCSF schema"
   - Shot 7: "Real ML models — IsolationForest + LogisticRegression"
   - Shot 8: "Passive monitoring. No return path. No decryption."
3. **Add a subtle audio track** — dark ambient, -25dB max
4. **Export:** H.264, 1920×1080, 60fps, ~25Mbps bitrate

### Upload
- YouTube (unlisted) or Google Drive
- Link in the submission form
- Also embed in the README

---

## If Something Goes Wrong

| Problem | Fix |
|---------|-----|
| Backend won't start | Kill process on port 8000: `netstat -ano \| findstr :8000` then `taskkill /PID <id> /F` |
| Frontend won't compile | Delete `node_modules`, run `npm install` again |
| Dashboard looks broken | Hard refresh (Ctrl+Shift+R) |
| No alerts appearing | Wait 30 seconds — the simulator ramps up gradually |
| OBS captures black screen | Use "Display Capture" instead of "Window Capture" |
| Video is too long | Cut shots 5 and 7 first (they're least important) |
| Video is too short | Add 5 seconds to Shot 3 (let the stats breathe) |

---

## The 30-Second Version (if you only have time for one shot)

If you have literally 5 minutes:

1. Start recording
2. Type `python main.py` in terminal
3. Wait for boot sequence
4. Alt+Tab to Chrome
5. Let the dashboard run for 30 seconds
6. Stop recording
7. Trim to the best 60 seconds

That's enough. The boot sequence alone sells it.

---

**Good luck. Make it look like you're already running this in a SOC.**
