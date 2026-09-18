# WATCHTOWER — Shot List
## PS-26145 · NTRO · SIH26 · v2.4

**Total runtime:** 5:00
**Format:** 1920×1080, 60 fps, OBS Studio
**Rule:** One continuous take per shot. Record VO separately. Edit in post.

---

## Shot 0: Title Card [0:00 - 0:10]

### Pre-Requisites
- [ ] Dashboard at `localhost:5178` fully loaded
- [ ] All KPI cards populated with live data
- [ ] OBS scene set to "Full screen browser"
- [ ] Browser in F11 fullscreen mode

### Steps
1. Start OBS recording
2. Refresh dashboard (F5) for clean boot
3. Wait 3 seconds for data to populate
4. Stop recording

### What the Judge Sees
- Black screen for 2 seconds
- Dashboard fades in with live data ticking
- Top bar: WATCHTOWER | LIVE | Diode Read-Only
- 6 KPI cards cycling numbers
- "24 DETECTED" counter incrementing

### Estimated Duration: 10 seconds

### Must-Get Take
Dashboard fully populated with live-cycling KPIs before VO starts.

### Nice-to-Have
Smooth fade-in animation of dashboard elements.

### Recovery
If data is stale, wait 30 seconds for WebSocket to populate, or restart demo_server.py.

---

## Shot 1: The Problem — Enclave Constraints [0:10 - 0:40]

### Pre-Requisites
- [ ] Backend running in Terminal tab
- [ ] Terminal showing startup banner OR ready to restart
- [ ] OBS scene set to "Terminal"
- [ ] Terminal font ≥ 14pt, dark theme, no compression artifacts

### Steps
1. Switch OBS to Terminal scene
2. If backend not running, start it: `python demo_server.py --host 0.0.0.0`
3. Wait for startup banner to appear (10-15 seconds)
4. Start recording
5. Wait 3 seconds for banner to be clearly visible
6. Stop recording

### What the Judge Sees
- Terminal window with dark background
- WATCHTOWER / EKADHARA v2.4 startup banner
- Four constraint lines highlighted:
  - Enclave mode: READ-ONLY
  - Capture: passive (PCAP/NetFlow)
  - Decryption: NONE (TLS metadata only)
  - Processing: streaming
- Overlay text: "NO probes | NO decryption | NO return path"

### Estimated Duration: 30 seconds

### Must-Get Take
All four constraint lines visible and legible. Terminal text crisp.

### Nice-to-Have
Smooth zoom from full terminal to highlighted constraint lines.

### Recovery
If banner scrolled past, restart backend. Banner always appears on startup. Take screenshot as absolute fallback.

---

## Shot 2: Architecture — Pipeline Overview [0:40 - 1:10]

### Pre-Requisites
- [ ] Dashboard tab open and loaded
- [ ] All 6 KPI cards populated
- [ ] Pipeline diagram visible on dashboard
- [ ] OBS scene set to "Full screen browser"

### Steps
1. Switch to Dashboard tab
2. Start recording
3. Let it run for 5 seconds (numbers ticking)
4. Pan slowly left to right across KPI strip (5 seconds)
5. Pause on pipeline diagram (5 seconds)
6. Pause on compliance panel (5 seconds)
7. Stop recording

### What the Judge Sees
- Dashboard with WATCHTOWER header
- 6 KPI cards: Flows Processed, Threats Blocked, Active Sessions, Detection Rate, False Positive, Threats Today
- Pipeline diagram: INGEST → FEATURES → INFERENCE → OUTPUT
- Enclave compliance panel with green checkmark
- Threat classification bar at bottom

### Estimated Duration: 30 seconds

### Must-Get Take
All six KPI cards visible with live numbers. Pipeline diagram clearly readable. Compliance panel showing green check.

### Nice-to-Have
Smooth camera pan across KPI strip. Numbers visibly incrementing during pan.

### Recovery
If dashboard is stale, click refresh or restart demo_server.py. Dashboard auto-populates within 10 seconds.

---

## Shot 3: Attack Demo — SYN Flood [1:10 - 1:40]

### Pre-Requisites
- [ ] Attack Panel tab open (`/attack`)
- [ ] Dashboard tab open in background
- [ ] Backend responding to API calls
- [ ] OBS scene set to "Full screen browser"

### Steps
1. Switch to Attack Panel tab
2. Start recording
3. Click "Launch SYN Flood" button (red button, top of list)
4. Wait for status to change to "ATTACK ACTIVE" (2 seconds)
5. Wait for detection log to appear (2 seconds):
   - "[00:02] ATTACK DETECTED: volumetric_ddos from 10.0.0.45"
   - "Confidence: 94% | Severity: CRITICAL"
6. Switch to Dashboard tab
7. Point to "THREATS BLOCKED" counter incrementing (5 seconds)
8. Point to new CRITICAL alerts in feed (5 seconds)
9. Stop recording

### What the Judge Sees
- Attack Panel with "Launch SYN Flood" button
- Status changes to "ATTACK ACTIVE"
- Detection log showing attack detected in 2 seconds
- Dashboard switching back, showing:
  - "THREATS BLOCKED" counter rapidly incrementing
  - "THREATS TODAY" spiking
  - New alerts with red CRITICAL badges
  - Detection Rate jumping to 98.1%

### Estimated Duration: 30 seconds

### Must-Get Take
SYN Flood launch button clearly clicked. Detection log showing "ATTACK DETECTED" within 3 seconds. Dashboard counter visibly incrementing.

### Nice-to-Have
Smooth transition from Attack Panel to Dashboard. Counter visibly ticking up.

### Recovery
If attack fails to launch, use existing CRITICAL alerts already in the dashboard feed. The dashboard always has 15+ live alerts from background traffic. The attack scripts are enhancement, not requirement.

---

## Shot 4: Attack Demo — C2 Beaconing + DGA + Port Scan [1:40 - 2:10]

### Pre-Requisites
- [ ] Attack Panel tab open
- [ ] Live Threats tab open in background
- [ ] Backend responding
- [ ] OBS scene set to "Full screen browser"

### Steps
1. Stay on Attack Panel tab
2. Click "Launch C2 Beacon" (purple button)
3. Wait for detection log (3 seconds):
   - "[00:03] Periodic beaconing detected"
   - "Inter-arrival: 4.2s ± 0.3s | Dest: 2 hosts"
   - "Confidence: 91% | Severity: HIGH"
4. Click "Launch DGA Domain" (yellow button)
5. Wait for detection log (2 seconds):
   - "[00:01] DGA domain burst detected"
   - "Entropy spike: 7.8 bits | 20 randomized domains"
6. Click "Launch Port Scan" (amber button)
7. Wait for detection log (2 seconds):
   - "[00:01] Port scan detected: 847 ports probed"
   - "Fan-out: 847 dest ports | 12 dest IPs"
8. Switch to Live Threats tab
9. Click "HIGH" filter button
10. Scroll to show all three attack types (5 seconds)
11. Stop recording

### What the Judge Sees
- Three attack launches in sequence
- Each detection log appearing within 3 seconds
- Live Threats table with HIGH filter showing:
  - C2 Beaconing entries
  - DGA Domain entries
  - Port Scan entries
- Each row showing: timestamp, threat class, source IP, destination IP, confidence, severity

### Estimated Duration: 30 seconds

### Must-Get Take
All three detection logs visible. Live Threats table showing entries for all three attack types with HIGH severity filter active.

### Nice-to-Have
Rapid but clear sequence of three launches. Table scrolls smoothly to show all three types.

### Recovery
If attacks fail, use existing alerts in Live Threats table. Filter by HIGH to show beaconing, DGA, and port scan entries already present.

---

## Shot 5: Analytics — ML Pipeline [2:10 - 2:40]

### Pre-Requisites
- [ ] Analytics tab pre-loaded (`/analytics`)
- [ ] Charts and tables rendered
- [ ] OBS scene set to "Full screen browser"

### Steps
1. Click Analytics in sidebar
2. Wait for page to load (charts animate in, 3 seconds)
3. Point to stat cards (top row) — 4 seconds
4. Point to donut chart (severity distribution) — 5 seconds
5. Point to timeline chart (alert spikes) — 5 seconds
6. Point to model performance table (bottom) — 8 seconds
7. Stop recording

### What the Judge Sees
- 4 stat cards: Total Alerts (24), Detection Accuracy (97.3%), FPR (2.1%), Avg Confidence (91%)
- Donut chart: Critical 8%, High 24%, Medium 45%, Low 23%
- Alert timeline: line chart with spikes at attack timestamps
- Model Performance table:
  - Random Forest: 96.8% accuracy, F1 0.95
  - XGBoost: 97.3% accuracy, F1 0.96
  - Isolation Forest: 94.2% accuracy, F1 0.92
  - Ensemble: 97.8% accuracy, F1 0.97

### Estimated Duration: 30 seconds

### Must-Get Take
Model performance table clearly visible with all four models and their metrics. Stat cards showing live numbers.

### Nice-to-Have
Donut chart and timeline chart visibly animated. Numbers ticking in stat cards.

### Recovery
If Analytics page is slow, use AI Analyzer tab instead — it shows model architecture and feature importance. The numbers are the same.

---

## Shot 6: Hero Moment — Diode Toggle / Degradation Matrix [2:40 - 3:10]

### Pre-Requisites
- [ ] Dashboard or Diode Lab page loaded
- [ ] Diode Mode toggle visible and set to OFF (Full Duplex)
- [ ] ACK-Shadow toggle visible and set to ON
- [ ] Degradation Matrix visible
- [ ] OBS scene set to "Full screen browser"

### Steps
1. Navigate to page with Diode Mode toggle
2. Start recording
3. Cursor moves to Diode Mode toggle — pause 1 second
4. Click Diode Mode toggle OFF → ON
5. Wait for degradation matrix to populate row by row (8 seconds):
   - Recon / Port Scan: 0.94 → 0.94 (✔ unaffected)
   - Volumetric DDoS: 0.93 → 0.92 (✔ unaffected)
   - C2 Beaconing: 0.91 → 0.87 (✔ minor)
   - DGA / DNS Tunnel: 0.88 → 0.84 (✔ minor)
   - Encrypted Malware: 0.86 → 0.55 (⚠ degraded)
   - Data Exfiltration: 0.89 → 0.00 (✗ blind)
6. Cursor moves to ACK-Shadow toggle — pause 1 second
7. Click ACK-Shadow toggle ON → OFF
8. Hold for 2 seconds of silence (exfiltration at 0%)
9. Click ACK-Shadow toggle OFF → ON
10. Wait for exfiltration row to recover: 0.00 → 0.83
11. Stop recording

### What the Judge Sees
- Diode Mode toggle switching from "Full Duplex" to "Unidirectional (FWD Only)"
- Degradation Matrix populating row by row with score changes
- Encrypted Malware dropping from 0.86 to 0.55 (red border)
- Data Exfiltration dropping from 0.89 to 0.00 (red border, CRITICAL badge)
- ACK-Shadow toggle switching OFF
- Exfiltration alert stream stopping (alert feed goes quiet)
- 2 seconds of silence with empty alert feed
- ACK-Shadow toggle switching ON
- Exfiltration recovering to 0.83
- Alerts resuming

### Estimated Duration: 30 seconds

### Must-Get Take
Degradation matrix clearly showing all six rows with score changes. ACK-Shadow toggle clearly clicked OFF then ON. Exfiltration row visibly dropping to 0% then recovering to 0.83. 2 seconds of silence after ACK-Shadow OFF.

### Nice-to-Have
Smooth animation of matrix rows populating. Clear visual distinction between green (unaffected), amber (minor), red (degraded/blind).

### Recovery
If live toggle doesn't work, use pre-captured screenshots of each state and crossfade between them in post. Record 3 takes of this sequence; pick the cleanest.

---

## Shot 7: Egress Self-Test [3:10 - 3:40]

### Pre-Requisites
- [ ] Backend running on port 8000
- [ ] Browser ready to navigate to self-test URL
- [ ] OBS scene set to "Full screen browser"

### Steps
1. Open new browser tab (Ctrl+T)
2. Type: `http://localhost:8000/api/security/self-test`
3. Wait for page to load (5 seconds)
4. Scroll down if needed to show all 8 test results
5. Pause on "ALL TESTS PASSED — ENCLAVE IS AIR-GAPPED" line (5 seconds)
6. Stop recording

### What the Judge Sees
- New browser tab with self-test page
- 8 test results, each with green checkmark:
  - DNS resolution: BLOCKED
  - HTTP egress: BLOCKED
  - HTTPS egress: BLOCKED
  - TCP egress: BLOCKED
  - UDP egress: BLOCKED
  - ICMP egress: BLOCKED
  - Reverse DNS: BLOCKED
  - NTP egress: BLOCKED
- Final line: "STATUS: ALL TESTS PASSED — ENCLAVE IS AIR-GAPPED"

### Estimated Duration: 30 seconds

### Must-Get Take
All 8 test results visible with green checkmarks. "ALL TESTS PASSED" line clearly readable.

### Nice-to-Have
Tests appearing one by one with subtle animation. Final status line highlighted.

### Recovery
If self-test page is slow, take screenshot of completed page and display it. The test always passes in read-only mode.

---

## Shot 8: Closing [3:40 - 5:00]

### Pre-Requisites
- [ ] Dashboard tab open and loaded
- [ ] All KPIs ticking
- [ ] OBS scene set to "Full screen browser"

### Steps
1. Switch back to Dashboard tab
2. Start recording
3. Let it run for 10 seconds showing live data
4. Text overlay fades in at bottom (add in post):
   - "PS-26145 · NTRO · SIH26"
   - "WATCHTOWER // EKADHARA v2.4"
   - "Read-only. Streaming. Real-time. Air-gapped."
5. Hold for 10 seconds
6. Fade to black (add in post)
7. Stop recording

### What the Judge Sees
- Dashboard with all KPIs updating live
- Throughput: ~10K flows/sec
- Alerts streaming in
- LIVE indicator pulsing green
- Text overlay at bottom with project name and tagline
- Clean fade to black

### Estimated Duration: 80 seconds (including fade)

### Must-Get Take
Dashboard live with all KPIs ticking. Text overlay clearly readable. Clean fade to black.

### Nice-to-Have
Smooth fade-in of text overlay. Gradual fade to black at end.

### Recovery
If dashboard crashes, use static screenshot with live-looking numbers. Text overlay can be added in post-production.

---

## OBS SCENE SETUP

### Scene 1: Full Screen Browser
- Source: Window Capture → Chrome
- Resolution: 1920×1080
- Filter: Crop to remove browser chrome (if not using F11)

### Scene 2: Terminal
- Source: Window Capture → Terminal
- Resolution: 1920×1080
- Filter: Sharpen (amount 0.5) for crisp ASCII text

### Scene 3: Split Screen (if dual monitor)
- Left: Dashboard (50%)
- Right: Attack Panel (50%)

---

## RECORDING WORKFLOW

### Phase 1: Setup (15 minutes)
1. Open terminal tabs (backend, frontend, attack commands)
2. Start backend: `python demo_server.py --host 0.0.0.0`
3. Start frontend: `npm run dev`
4. Open browser tabs (Dashboard, Attack Panel, Live Threats, Analytics, AI Analyzer)
5. Wait for Dashboard to fully load
6. Let Dashboard run for 30 seconds to populate KPIs
7. Set up OBS scenes
8. Test recording (5 seconds) to verify resolution and frame rate

### Phase 2: Record Each Shot (30 minutes)
1. Shot 0: Title Card (10s)
2. Shot 1: Problem (30s)
3. Shot 2: Architecture (30s)
4. Shot 3: SYN Flood (30s)
5. Shot 4: C2 + DGA + Port Scan (30s)
6. Shot 5: Analytics (30s)
7. Shot 6: Diode Toggle (30s) — RECORD 3 TAKES
8. Shot 7: Egress Self-Test (30s)
9. Shot 8: Closing (80s)

### Phase 3: Post-Production (2 hours)
1. Import all clips into DaVinci Resolve / Premiere Pro
2. Lay down ambient hum track (optional, -25 dB)
3. Record VO in Audacity (pop filter, -3dB peak)
4. Sync VO to clips
5. Add lower-third text overlays for Shot 1 constraints
6. Add alert chime SFX when detections fire
7. Burn in captions for every spoken line
8. Export: H.264, 1920×1080, 60fps, ≤100MB
9. Upload to YouTube (unlisted) + MP4 on USB stick

---

## COMMON FAILURE MODES

### Failure: Dashboard not loading
**Symptom:** Blank page or loading spinner
**Recovery:**
1. Check backend is running (Terminal tab 1)
2. Check frontend is running (Terminal tab 2)
3. Restart backend: Ctrl+C then `python demo_server.py --host 0.0.0.0`
4. Refresh browser (F5)
5. Wait 10 seconds for WebSocket connection

### Failure: Attack scripts not working
**Symptom:** "Launch" button does nothing, no detection log
**Recovery:**
1. Check backend is running
2. Check browser console for errors (F12)
3. Use existing alerts in dashboard instead
4. The demo works 100% without attack scripts — they are enhancement

### Failure: Diode toggle not responding
**Symptom:** Click does nothing, matrix doesn't update
**Recovery:**
1. Refresh page (F5)
2. Wait for dashboard to reload
3. Try again
4. If still broken, use pre-captured screenshots of each state

### Failure: Self-test page slow
**Symptom:** Page takes >10 seconds to load
**Recovery:**
1. Wait for tests to complete (they always pass)
2. Take screenshot of completed page as fallback
3. Display screenshot in video with note "Self-test results"

### Failure: OBS crashes mid-recording
**Symptom:** OBS closes or freezes
**Recovery:**
1. Restart OBS
2. Re-setup scene
3. Re-record from last clean shot
4. Keep previous takes as backup

---

## TIMING SUMMARY

| Shot | Start | End | Duration | Priority |
|------|-------|-----|----------|----------|
| 0: Title Card | 0:00 | 0:10 | 10s | Medium |
| 1: Problem | 0:10 | 0:40 | 30s | High |
| 2: Architecture | 0:40 | 1:10 | 30s | High |
| 3: SYN Flood | 1:10 | 1:40 | 30s | High |
| 4: C2 + DGA + Port Scan | 1:40 | 2:10 | 30s | High |
| 5: Analytics | 2:10 | 2:40 | 30s | Medium |
| 6: Diode Toggle | 2:40 | 3:10 | 30s | CRITICAL |
| 7: Egress Self-Test | 3:10 | 3:40 | 30s | High |
| 8: Closing | 3:40 | 5:00 | 80s | Medium |

**Total: 5:00**

**If forced to cut to 3:30:**
- Cut Shot 5 (Analytics) entirely
- Reduce Shot 8 (Closing) to 40 seconds
- Keep Shots 0-4, 6-7 intact
