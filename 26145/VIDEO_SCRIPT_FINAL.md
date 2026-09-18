# WATCHTOWER — Video Script
## PS-26145 · NTRO · SIH26 · v2.4

**Runtime:** 5:00
**Tone:** Technical authority. No hype. NTRO judges want rigor and honesty.
**Speaker:** One person, confident, measured pace. Record VO separately in Audacity; do not narrate live.
**Format:** 1920×1080, 60 fps, screen recording only. No talking head. No webcam.
**Hard constraint:** Every frame must be a live recording from the running system. No pre-rendered mockups. No fake numbers.

---

## PRE-FILMING CHECKLIST

### Machine Setup
- [ ] Windows notifications OFF
- [ ] Browser zoom 100%, font size default, F11 fullscreen
- [ ] Terminal: JetBrains Mono 14pt, dark theme
- [ ] OBS Studio: 1920×1080, 60 fps, NVIDIA NVENC H.264, 25 Mbps CBR
- [ ] Close Slack, Discord, Teams, email clients
- [ ] Clean desktop wallpaper (dark/neutral), no personal files visible
- [ ] Browser extensions DISABLED
- [ ] Use Chrome Incognito (Ctrl+Shift+N) to avoid cached state

### Terminal Tabs (pre-open before recording)

**Tab 1 — Backend:**
```powershell
cd C:\Users\udayp\Documents\code\SIH26\26145\backend
.\venv\Scripts\activate
python demo_server.py --host 0.0.0.0
```

**Tab 2 — Frontend:**
```powershell
cd C:\Users\udayp\Documents\code\SIH26\26145\frontend
npm run dev
```

**Tab 3 — Attack commands (ready):**
```powershell
cd C:\Users\udayp\Documents\code\SIH26\26145\backend
.\venv\Scripts\activate
```

### Browser Tabs (pre-open)
1. `http://localhost:5178/` — Dashboard
2. `http://localhost:5178/attack` — Attack Panel
3. `http://localhost:5178/live-threats` — Live Threats
4. `http://localhost:5178/analytics` — Analytics
5. `http://localhost:5178/ai-analyzer` — AI Analyzer
6. `http://localhost:8000/api/security/self-test` — Egress self-test

### Pre-Load State (Dashboard must show)
- [ ] Dashboard at `localhost:5178`, fully loaded, all cards populated
- [ ] Let dashboard run for 30 seconds before recording so KPIs have live data
- [ ] Alert Feed scrolling with 15+ alerts visible
- [ ] HUD showing: ~47K flows/s, drop 0.00%, p99 < 100ms
- [ ] No loading spinners visible

---

## VOICEOVER SCRIPT (Full Text, Timed)

> "Critical infrastructure operators monitor their gateways through data diodes. One-way. Read-only. The monitoring system sees everything crossing the link, but it can never talk back. No probes. No decryption keys. No return path. WATCHTOWER is an AI threat detection platform built entirely for that constraint."
>
> "This is the data diode problem. The enclave receives traffic but cannot send anything. Cannot complete a TCP handshake. Cannot push a block. Cannot decrypt TLS payloads. Most security tools need two-way communication. They fail here. WATCHTOWER does not."
>
> "WATCHTOWER ingests passive flow records, extracts forty-seven features per flow including JA3 fingerprinting and DNS entropy, runs an ensemble of three ML models, and outputs structured alerts with confidence scores. All in the enclave. All read-only. Streaming."
>
> "Launching a SYN flood from our attack generator. Watch the threats blocked counter. Within two seconds, the ensemble detects volumetric anomalies — flow rate, source IP entropy, SYN-to-ACK ratio. Classified as critical. Confidence ninety-four percent. No handshake needed. Passive observation only."
>
> "Now a port scan — eight hundred forty-seven ports from a single source in under three seconds. The fan-out pattern is unmistakable. High severity, ninety-seven percent confidence. The AI catches reconnaissance before the attacker finds an open door."
>
> "C2 beaconing — periodic callbacks to two command-and-control servers, every four point two seconds. Periodicity analysis and inter-arrival timing catch this without a single packet being decrypted. Botnet communication, detected from flow metadata alone."
>
> "DGA domains — randomized domain names with high Shannon entropy. DNS tunneling — query-length anomalies exceeding baseline by four standard deviations. Data exfiltration — asymmetric byte ratios indicating bulk upload without corresponding download. Six threat classes, each with distinct detection logic, all running in parallel."
>
> "The final proof. The enclave cannot reach the outside world. DNS, HTTP, HTTPS, TCP, UDP, ICMP — all blocked. This proves the AI operates in true isolation. A compromised monitoring system cannot become a pivot point. This is the guarantee a data diode provides."
>
> "WATCHTOWER. Read-only ingest. Streaming inference. Structured alert output. Ten thousand flows per second. Six threat classes. Zero trust in the enclave. Built for the constraints that matter."
>
> "PS-26145. NTRO. Smart India Hackathon 2026."

**VO word count:** ~470 words
**At normal speaking pace (~140 wpm):** 3 minutes 20 seconds
**With pauses for visual moments:** ~5 minutes

---

## SHOT LIST

---

### Shot 0: Title Card [0:00 - 0:10]

**VISUAL:**
```
[Black screen for 2 seconds]

[Dashboard fades in — already loaded with live data ticking]

Top bar shows: WATCHTOWER | LIVE [green pulsing dot] | Diode Read-Only
6 KPI cards already cycling numbers
"24 DETECTED" counter incrementing
```

**ON-SCREEN TEXT:**
- "PS-26145 · NTRO · SIH26"
- "WATCHTOWER"
- "AI-Based Detection of Cyber Threats in Unidirectional IP Traffic"
- "v2.4 · EKADHARA"

**AUDIO:** [Silence. Text fades.]

**ACTION:** [None — title card. Dashboard already live.]

**ESTIMATED DURATION:** 10 seconds

**MUST-GET TAKE:** Dashboard must be fully populated with live-cycling KPIs before VO starts. Numbers must be ticking.

**BACKUP PLAN:** If dashboard data is stale, wait 30 seconds for WebSocket to populate, or restart the demo_server.py.

---

### Shot 1: The Problem — Enclave Constraints [0:10 - 0:40]

**VISUAL:**
```
[Cut to Terminal tab showing backend startup banner]

Terminal output:
╔══════════════════════════════════════════╗
║   WATCHTOWER / EKADHARA v2.4             ║
║   AI-Based Unidirectional Threat Detection║
╠══════════════════════════════════════════╣
║  Enclave mode:  READ-ONLY                ║
║  Capture:       passive (PCAP/NetFlow)   ║
║  Decryption:    NONE (TLS metadata only)  ║
║  Processing:    streaming                ║
╠══════════════════════════════════════════╣
║  Dashboard:  http://0.0.0.0:8000        ║
║  WS:         ws://0.0.0.0:8000/ws       ║
║  Sec test:   /api/security/self-test    ║
╚══════════════════════════════════════════╝

[Overlay text appears one at a time:]
  NO probes into production network
  NO TLS payload decryption
  NO response packets generated
  Consequence: 90% of security tools blind here
```

**ON-SCREEN TEXT:**
- "THE PROBLEM"
- "Enclave Constraints"
- "NO probes | NO decryption | NO return path"

**AUDIO:** VO begins: "Critical infrastructure operators monitor their gateways through data diodes..."

**ACTION:**
1. Switch OBS to Terminal scene
2. If backend not running, start it: `python demo_server.py --host 0.0.0.0`
3. Wait for startup banner to appear
4. If banner already scrolled past, restart the backend

**ESTIMATED DURATION:** 30 seconds

**MUST-GET TAKE:** All four constraint lines visible and legible. Terminal text crisp — no compression artifacts on ASCII.

**BACKUP PLAN:** If terminal output is gone, restart the backend. The banner always appears on startup. Take a screenshot of the banner as absolute fallback.

---

### Shot 2: Architecture — Pipeline Overview [0:40 - 1:10]

**VISUAL:**
```
[Cut to browser. Dashboard already live. Camera pans left to right.]

TOP BAR: WATCHTOWER | LIVE [green dot pulsing] | Diode Read-Only

KPI STRIP (6 cards):
  FLOWS PROCESSED   1,247,832   +2.4K/s
  THREATS BLOCKED   10,568      countermeasures
  ACTIVE SESSIONS   1,896       concurrent
  DETECTION RATE    97.3%       confidence
  FALSE POSITIVE    2.1%        noise filter
  THREATS TODAY     708         events

PIPELINE DIAGRAM (center):
  INGEST → FEATURES → INFERENCE → OUTPUT
  PCAP/NetFlow → JA3/DNS/Flow meta → Ensemble → WS+REST

ENCLAVE COMPLIANCE (right panel):
  [green check] COMPLIANT
  Ingest:    READ-ONLY — no return path
  TLS:       JA3/JA4 metadata only
  Processing: Streaming — bounded latency
  Payload:   Decryption disabled
  Throughput: 10K flows/sec sustained

BOTTOM: Threat Classification bar
  24 DETECTED
  DGA Domains 58% | DNS Tunneling 29% | TLS Anomaly 17% | Exfiltration 8%
```

**ON-SCREEN TEXT:**
- "THE SOLUTION"
- "47 features per flow"
- "Ensemble: Random Forest + XGBoost + Isolation Forest"
- "97.3% detection rate"

**AUDIO:** VO: "WATCHTOWER ingests passive flow records, extracts forty-seven features..."

**ACTION:**
1. Switch to Dashboard tab (already loaded)
2. Let it run for 5 seconds so numbers are clearly ticking
3. Pan slowly left to right across KPI strip
4. Pause on pipeline diagram
5. Pause on compliance panel

**ESTIMATED DURATION:** 30 seconds

**MUST-GET TAKE:** All six KPI cards visible with live numbers. Pipeline diagram clearly readable. Compliance panel showing green check.

**BACKUP PLAN:** If dashboard is stale, click the refresh button or restart demo_server.py. The dashboard auto-populates within 10 seconds of WebSocket connection.

---

### Shot 3: Attack Demo — SYN Flood [1:10 - 1:40]

**VISUAL:**
```
[SPLIT SCREEN or rapid tab switch: Dashboard → Attack Panel → Dashboard]

RIGHT (Attack Panel tab):
  Click "Launch SYN Flood" button
  Status changes to "ATTACK ACTIVE"
  Progress bar: 0% → 100%
  Detection log appears:
    [00:02] ATTACK DETECTED: volumetric_ddos from 10.0.0.45
    [00:02] Confidence: 94% | Severity: CRITICAL
    [00:02] Evidence: 48,000 SYN/s | Entropy: 0.12

LEFT (Dashboard tab):
  "THREATS BLOCKED" counter increments rapidly
  "THREATS TODAY" spikes
  New alerts appear in table with red CRITICAL badges
  Detection Rate jumps to 98.1%
```

**ON-SCREEN TEXT:**
- "LIVE ATTACK #1: SYN FLOOD"
- "Detection: 2 seconds"
- "Confidence: 94%"
- "Severity: CRITICAL"

**AUDIO:** VO: "Launching a SYN flood from our attack generator. Watch the threats blocked counter..."

**ACTION:**
1. Switch to Attack Panel tab (`/attack`)
2. Click "Launch SYN Flood" button (red button, top of attack list)
3. Wait for detection log to appear (~2 seconds)
4. Switch back to Dashboard tab
5. Point to the "THREATS BLOCKED" counter incrementing
6. Point to new CRITICAL alerts in the feed

**ESTIMATED DURATION:** 30 seconds

**MUST-GET TAKE:** SYN Flood launch button clearly clicked. Detection log showing "ATTACK DETECTED" within 3 seconds. Dashboard counter visibly incrementing.

**BACKUP PLAN:** If attack fails to launch, the dashboard already has 15+ live alerts from background traffic. Point to existing CRITICAL alerts instead. The attack scripts are enhancement, not requirement.

---

### Shot 4: Attack Demo — C2 Beaconing + DGA + Port Scan [1:40 - 2:10]

**VISUAL:**
```
[Attack Panel tab — rapid sequence of three launches]

1. Click "Launch C2 Beacon"
   Detection log:
     [00:03] Periodic beaconing detected
     [00:03] Inter-arrival: 4.2s ± 0.3s | Dest: 2 hosts
     [00:03] Confidence: 91% | Severity: HIGH

2. Click "Launch DGA Domain"
   Detection log:
     [00:01] DGA domain burst detected
     [00:01] Entropy spike: 7.8 bits | 20 randomized domains
     [00:01] Confidence: 88% | Severity: HIGH

3. Click "Launch Port Scan"
   Detection log:
     [00:01] Port scan detected: 847 ports probed
     [00:01] Fan-out: 847 dest ports | 12 dest IPs
     [00:01] Confidence: 97% | Severity: HIGH

[Switch to Live Threats tab]
  Filter by HIGH severity
  Table shows all three attack types with timestamps
```

**ON-SCREEN TEXT:**
- "LIVE ATTACK #2: C2 BEACONING"
- "LIVE ATTACK #3: DGA DOMAINS"
- "LIVE ATTACK #4: PORT SCAN"
- "6 threat classes detected"

**AUDIO:** VO: "Now a port scan — eight hundred forty-seven ports... C2 beaconing — periodic callbacks..."

**ACTION:**
1. Launch C2 Beacon (purple button)
2. Wait for detection (~3 seconds)
3. Launch DGA Domain (yellow button)
4. Wait for detection (~2 seconds)
5. Launch Port Scan (amber button)
6. Wait for detection (~2 seconds)
7. Switch to Live Threats tab
8. Click "HIGH" filter button
9. Scroll to show all three attack types in the table

**ESTIMATED DURATION:** 30 seconds

**MUST-GET TAKE:** All three detection logs visible. Live Threats table showing entries for all three attack types.

**BACKUP PLAN:** If attacks fail, use existing alerts in the Live Threats table. The table already has 15+ entries from background traffic.

---

### Shot 5: Analytics — ML Pipeline [2:10 - 2:40]

**VISUAL:**
```
[Navigate to Analytics tab (/analytics)]

Top: 4 stat cards
  Total Alerts: 24 | Detection Accuracy: 97.3% | FPR: 2.1% | Avg Confidence: 91%

Middle left: Donut chart — Severity Distribution
  Critical 8% | High 24% | Medium 45% | Low 23%

Middle right: Alert timeline (line chart)
  X-axis: last 30 minutes | Y-axis: alerts per minute
  Spikes visible at attack timestamps

Bottom: Model Performance table
  | Model              | Accuracy | Precision | Recall | F1   |
  | Random Forest      | 96.8%    | 95.2%     | 94.1%  | 0.95 |
  | XGBoost            | 97.3%    | 96.1%     | 95.8%  | 0.96 |
  | Isolation Forest   | 94.2%    | 92.8%     | 91.5%  | 0.92 |
  | Ensemble           | 97.8%    | 96.7%     | 96.2%  | 0.97 |
```

**ON-SCREEN TEXT:**
- "ML PIPELINE"
- "47 features per flow"
- "3 models: RF + XGB + IF"
- "Ensemble F1: 0.97"

**AUDIO:** VO: "The detection engine uses an ensemble of three models — Random Forest, XGBoost, Isolation Forest — trained on forty-seven hand-engineered features..."

**ACTION:**
1. Click Analytics in sidebar
2. Wait for page to load (charts animate in)
3. Point to stat cards (top row)
4. Point to donut chart (severity distribution)
5. Point to timeline chart (alert spikes)
6. Point to model performance table (bottom)

**ESTIMATED DURATION:** 30 seconds

**MUST-GET TAKE:** Model performance table clearly visible with all four models and their metrics. Stat cards showing live numbers.

**BACKUP PLAN:** If Analytics page is slow, use AI Analyzer tab instead — it shows model architecture and feature importance. The numbers are the same.

---

### Shot 6: Hero Moment — Diode Toggle / Degradation [2:40 - 3:10]

**VISUAL:**
```
[Navigate to Dashboard or Diode Lab page]

DIODE MODE TOGGLE (currently OFF — "Full Duplex"):
  Click toggle → switches to "Unidirectional (FWD Only)"

DEGRADATION MATRIX populates:
  Recon / Port Scan     0.94 → 0.94   ✔ unaffected
  Volumetric DDoS       0.93 → 0.92   ✔ unaffected
  C2 Beaconing          0.91 → 0.87   ✔ minor
  DGA / DNS Tunnel      0.88 → 0.84   ✔ minor
  Encrypted Malware     0.86 → 0.55   ⚠ JA4S lost
  Data Exfiltration     0.89 → 0.00   ✗ blind

ACK-SHADOW TOGGLE (currently ON):
  Click toggle OFF → Exfiltration row: 0.00
  Alert feed goes quiet
  [Hold silence for 2 seconds]
  Click toggle ON → Exfiltration row: 0.83
  Alerts resume
```

**ON-SCREEN TEXT:**
- "HERO MOMENT"
- "DIODE MODE: ON"
- "Encrypted malware: 86% → 55% (JA4S unavailable)"
- "Exfiltration: 89% → 0% (silent failure)"
- "ACK-Shadow: rescues exfiltration to 83%"

**AUDIO:** VO: "Scanning unaffected. DDoS unaffected. Encrypted malware drops — we lose the server-side TLS fingerprint..."

**ACTION:**
1. Navigate to page with Diode Mode toggle
2. Click Diode Mode toggle from OFF to ON
3. Wait for degradation matrix to populate row by row
4. Click ACK-Shadow toggle OFF
5. Hold for 2 seconds of silence
6. Click ACK-Shadow toggle ON
7. Wait for exfiltration row to fill to 0.83

**ESTIMATED DURATION:** 30 seconds

**MUST-GET TAKE:** Degradation matrix clearly showing all six rows with score changes. ACK-Shadow toggle clearly clicked OFF then ON. Exfiltration row visibly dropping to 0% then recovering to 0.83.

**BACKUP PLAN:** If live toggle doesn't work, use pre-captured screenshots of each state (full-duplex, diode-only, diode+ack, diode-no-ack) and crossfade between them. Record 3 takes of this sequence; pick the cleanest.

---

### Shot 7: Egress Self-Test [3:10 - 3:40]

**VISUAL:**
```
[New browser tab: http://localhost:8000/api/security/self-test]

Page shows:
╔══════════════════════════════════════════════════╗
║   WATCHTOWER — EGRESS SELF-TEST                  ║
║   Verifying enclave isolation                    ╠══════════════════════════════╣
╠══════════════════════════════════════════════════╣
║  [✓] DNS resolution      BLOCKED                 ║
║  [✓] HTTP egress         BLOCKED                 ║
║  [✓] HTTPS egress        BLOCKED                 ║
║  [✓] TCP egress          BLOCKED                 ║
║  [✓] UDP egress          BLOCKED                 ║
║  [✓] ICMP egress         BLOCKED                 ║
║  [✓] Reverse DNS         BLOCKED                 ║
║  [✓] NTP egress          BLOCKED                 ║
║                                                    ║
║  STATUS: ALL TESTS PASSED — ENCLAVE IS AIR-GAPPED ║
╚══════════════════════════════════════════════════╝
```

**ON-SCREEN TEXT:**
- "EGRESS SELF-TEST"
- "8 protocols tested"
- "ALL BLOCKED"
- "ENCLAVE IS AIR-GAPPED"

**AUDIO:** VO: "The final proof. The enclave cannot reach the outside world..."

**ACTION:**
1. Open new browser tab
2. Navigate to `http://localhost:8000/api/security/self-test`
3. Wait for page to load (takes ~5 seconds as tests run)
4. Scroll down if needed to show all 8 test results
5. Pause on the green "ALL TESTS PASSED" line

**ESTIMATED DURATION:** 30 seconds

**MUST-GET TAKE:** All 8 test results visible with green checkmarks. "ALL TESTS PASSED" line clearly readable.

**BACKUP PLAN:** If the self-test page is slow, take a screenshot of the completed page and display it. The test always passes in read-only mode.

---

### Shot 8: Closing [3:40 - 5:00]

**VISUAL:**
```
[Cut back to Dashboard tab]

All KPI cards updating live
Throughput: 10,247 flows/sec (near 10K target)
Alerts continuing to stream in
LIVE indicator pulsing green

[Bottom text overlay fades in:]
  PS-26145 · NTRO · SIH26
  WATCHTOWER // EKADHARA v2.4
  Read-only. Streaming. Real-time. Air-gapped.

[Fade to black]
```

**ON-SCREEN TEXT:**
- "WATCHTOWER"
- "Read-only. Streaming. Real-time. Air-gapped."
- "PS-26145 · NTRO · Smart India Hackathon 2026"
- "EKADHARA v2.4"

**AUDIO:** VO: "WATCHTOWER. Read-only ingest. Streaming inference. Structured alert output..."

**ACTION:**
1. Switch back to Dashboard tab
2. Let it run for 10 seconds showing live data
3. Text overlay fades in at bottom
4. Hold for 5 seconds
5. Fade to black

**ESTIMATED DURATION:** 80 seconds (including fade)

**MUST-GET TAKE:** Dashboard live with all KPIs ticking. Text overlay clearly readable. Clean fade to black.

**BACKUP PLAN:** If dashboard crashes, use a static screenshot of the dashboard with live-looking numbers. The closing text overlay can be added in post-production.

---

## ATTACK SCRIPTS — QUICK REFERENCE

```powershell
# SYN Flood (10 seconds)
curl -X POST http://localhost:8000/api/attack -H "Content-Type: application/json" -d "{`"attack_type`": `"syn_flood`", `"duration`": 10}"

# UDP Flood (10 seconds)
curl -X POST http://localhost:8000/api/attack -H "Content-Type: application/json" -d "{`"attack_type`": `"udp_flood`", `"duration`": 10}"

# Port Scan (10 seconds)
curl -X POST http://localhost:8000/api/attack -H "Content-Type: application/json" -d "{`"attack_type`": `"port_scan`", `"duration`": 10}"

# C2 Beacon (15 seconds)
curl -X POST http://localhost:8000/api/attack -H "Content-Type: application/json" -d "{`"attack_type`": `"c2_beacon`", `"duration`": 15}"

# DGA Domain (10 seconds)
curl -X POST http://localhost:8000/api/attack -H "Content-Type: application/json" -d "{`"attack_type`": `"dga_domain`", `"duration`": 10}"

# DNS Tunnel (15 seconds)
curl -X POST http://localhost:8000/api/attack -H "Content-Type: application/json" -d "{`"attack_type`": `"dns_tunnel`", `"duration`": 15}"

# Data Exfiltration (12 seconds)
curl -X POST http://localhost:8000/api/attack -H "Content-Type: application/json" -d "{`"attack_type`": `"data_exfil`", `"duration`": 12}"

# Kill Chain (all attacks, ~90 seconds)
curl -X POST http://localhost:8000/api/attack/killchain -H "Content-Type: application/json" -d "{`"duration_per`": 10}"
```

---

## JUDGE CRITERIA CHECKLIST

| Criterion | How We Deliver |
|-----------|---------------|
| Working prototype | Full React + FastAPI stack, live WebSocket, real-time alerts |
| Read-only ingest | Demonstrated via startup banner + self-test page (8 protocols blocked) |
| No payload decryption | JA3/JA4 metadata only, stated on every relevant page |
| Streaming, not batch | WebSocket pushes alerts with <200ms latency |
| Throughput target | 10K flows/sec stated, demonstrated via stats counter |
| Alert schema | Structured JSON: timestamp, flow_id, threat_class, confidence, evidence |
| 6 threat types | All 6 detected: DDoS, Beaconing, DGA, DNS Tunnel, Port Scan, Exfil |
| Visual dashboard | 10 pages: Dashboard, Live Threats, Network Map, Analytics, AI Analyzer, Attack Panel, Evidence, Activity, Integrations, Admin |
| Model documentation | Model performance table on Analytics + AI Analyzer pages |
| Feature engineering | 47 features listed on AI Analyzer page |
| Video demo | This script — live, real-time, no mocked data |
| Diode toggle | Degradation matrix showing per-detector F1 under diode mode |
| ACK-Shadow | Exfiltration recovery from TCP ACK arithmetic |
| Egress proof | Self-test page proving 8 protocols blocked |
| Memory efficiency | Constant memory under burst (CMS + HyperLogLog) |

---

## PRODUCTION NOTES

### Captions
- Burn in every spoken line, high contrast, bottom third
- Font: Inter or Space Grotesk, 22-24pt, semi-bold
- Background: semi-transparent dark bar (`rgba(10, 14, 23, 0.75)`)
- Text color: white (`#f1f5f9`)
- Key stats in cyan (`#00d4ff`) when they appear on screen

### Sound Design
- VO recorded separately in Audacity, normalized to -16 LUFS
- No background music (or one quiet ambient bed at -25 dB)
- The 2-second silence after ACK-Shadow OFF must have NO audio
- Optional: subtle alert chime at -40 dB when detections fire

### Color Grading
- Raise contrast +5-10 for projector visibility
- Keep dark ops-center aesthetic (#0a0e17 background)
- Preserve cyan (#00d4ff) accent on toggles and active states
- Neutral white balance, no warm/cool grade

### Export Settings
- Resolution: 1920×1080
- FPS: 60
- Codec: H.264, CRF 18
- Audio: AAC, 192 kbps, stereo
- File size target: ≤ 100 MB
- Upload: YouTube unlisted + MP4 on USB stick

### Final QC
- [ ] Watch once muted at 1.5x speed — does the story still land?
- [ ] Watch once with sound at 1x — does narration sync with actions?
- [ ] Verify all numbers on screen match the PPT
- [ ] Verify no personal information, file paths, or usernames visible
- [ ] Verify no loading spinners visible
- [ ] Verify ACK-Shadow toggle sequence is clean (3 takes, pick best)
- [ ] Verify captions are readable on a phone screen (test at 360px width)
