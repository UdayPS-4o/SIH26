# EKADHARA — WATCHTOWER
## Attack Narrative Video Script
### PS-26145 · NTRO · SIH26

**Total Duration:** 5:00
**Tone:** Urgent, technical authority. Judges should lean forward by 0:10.
**Speaker:** One person. Confident, measured pace. No hype — let the system speak for itself.
**Format:** 1920x1080, 60fps, screen recording only. No talking head. No webcam.
**Hard constraint:** Every frame must be a live recording from the running system.
**Premise:** The attack is already happening when the video starts.

---

## PRE-FILMING CHECKLIST

- [ ] Windows notifications OFF, F11 fullscreen
- [ ] Backend running: `python server.py` (port 8000)
- [ ] Frontend running: `npm run dev` (port 5178)
- [ ] Browser: Chrome Incognito, zoom 100%, no extensions
- [ ] Pre-load Dashboard for 60 seconds before recording so alerts populate
- [ ] Disable any screen dimming / power saving
- [ ] Close all other applications

### Browser Tabs (pre-open)
1. `localhost:5178/` — Dashboard
2. `localhost:5178/attack` — Attack Lab
3. `localhost:5178/diode-lab` — Diode Lab
4. `localhost:5178/ai-analyzer` — AI Analyzer
5. `localhost:5178/live-threats` — Live Threats

---

## COLD OPEN: 0:00 – 0:20

### VISUAL

**[Frame opens directly on the Dashboard. No black screen. No title card. The page is already loaded, live data cycling, alerts flowing in the threat ticker. The "LIVE" badge pulses green. Numbers tick up on the KPI cards. The threat ticker scrolls horizontally with red-bordered alert chips.]**

**Screen layout:**
- Top HUD bar: EKADHARA wordmark, "PS-26145 · NTRO · SIH26", LIVE [green pulsing dot], DIODE READ-ONLY badge, throughput counter, clock
- Row 1: 6 KPI cards — FLOWS PROCESSED (1,247,832, +2.4K/s), THREATS BLOCKED (10,568), ACTIVE SESSIONS (1,896), DETECTION RATE (97.3%), FALSE POSITIVE (2.1%), THREATS TODAY (708). Each card has a sparkline animating.
- Below KPI row: LIVE THREAT TICKER — horizontal scrolling strip. Red alert chips with severity badges, threat tags (DDoS, C2, SCAN, EXFIL), source/dest IPs, confidence percentages.
- Below ticker: Detection Pipeline (INGEST → FEATURES → INFERENCE → OUTPUT) with animated flow arrows.
- Right side of pipeline row: Degradation Matrix — 6 threat rows with green/orange/red bars.
- Below pipeline: Threat Classification donut chart + Severity Distribution bars.
- Bottom: Live Threat Feed table with alert rows fading in.

**What's moving:**
- Ticker scrolls right-to-left continuously
- Sparkline charts pulse subtly
- Alert count in HUD increments
- New alert rows flash into the Live Threat Feed table
- "LIVE" dot pulses

**[No text overlay. No intro graphic. Just the system, live.]**

### MOUSE ACTION

No interaction. Let the dashboard breathe for 3 full seconds before the voiceover begins. The camera/viewport is static — no scrolling, no clicking. Just observation.

### VOICEOVER

> "Your network is being attacked right now. You don't know it yet."

**[Pause. Let the ticker scroll for 2 seconds.]**

> "Traditional detection systems would miss half of these. They need full access. They need to decrypt. They need to talk back. In a military network — you can't do any of that."

**[Pause. One more second of the live dashboard.]**

### ON-SCREEN TEXT (tiny corner badge, bottom-right)

```
DEMO MODE
```

**[This stays visible but unobtrusive for the entire video — per the user's memory rule about fixture mode disclosure.]**

### DURATION: 20s

---

## TEAM INTRO: 0:20 – 0:35

### VISUAL

**[Quick cut. The sidebar navigation is visible on the left. Click "Attack Lab" in the sidebar — the page transitions with a fade.]**

**[The Attack Lab page loads. Left side: 8 attack buttons in a 4x2 grid — SYN Flood, UDP Flood, C2 Beacon, DGA Domains, DNS Tunnel, Port Scan, Data Exfil, TLS Beacon. Right side: Passive Flow Stream panel with flow records scrolling.]**

**Quick cut back to Dashboard. Hover over the EKADHARA wordmark for 1 second — no click needed, just hover to show the brand.**

### MOUSE ACTION

1. From Dashboard, move cursor to sidebar, click "Attack Lab" (0:22)
2. Let page load (0:23)
3. Click "Dashboard" in sidebar to return (0:26)
4. Let dashboard sit for 2 seconds (0:27–0:29)

### VOICEOVER

> "We're Team EKADHARA. This is WATCHTOWER — an AI system that catches attacks in a network you can't probe, can't decrypt, and can't touch."

### ON-SCREEN TEXT

**[Overlay appears for 4 seconds, then fades]**

```
TEAM EKADHARA
PS-26145 · NTRO · SIH26
```

### DURATION: 15s

---

## THE SETUP: 0:35 – 1:00

### VISUAL

**[Click "Diode Lab" in sidebar. Page loads.]**

**Diode Lab page layout:**
- Header: EKADHARA | PS-26145 · DIODE LAB | Diode Read-Only badge
- Section 1: "Enclave Transmission Mode" label with the DiodeToggle component — three buttons: FULL (green), DIODE (orange), ACK (cyan)
- Section 2: Network Topology SVG — Attacker node → Diode node → Enclave node, with animated flow dots on the forward path. The return path line is bright (full-duplex mode).
- Section 3: Detection Degradation Matrix table — 6 threat rows (DDoS, C2 Beaconing, DGA Domains, DNS Tunneling, Port Scan, Data Exfiltration). Each row has 3 animated bars: FULL-DUPLEX (green), DIODE-ONLY (orange), ACK-SHADOW (purple). Features Lost column. Validity chips (MEASURED/ESTIMATED/MISSING). Severity badges.
- Section 4: Two-column streams — "Full-Duplex Alert Stream" (green header) and "Diode-Only Alert Stream" (orange header)
- Section 5: Mini attack panel with dropdowns and Launch button

### MOUSE ACTION

1. Click "Diode Lab" in sidebar (0:35)
2. Wait for page to fully render (0:37)
3. Click the DIODE button in the DiodeToggle (0:38)
4. Watch the Degradation Matrix update — bars shrink, "DEGRADATION WARNING" banner appears at top of matrix (0:40)
5. Specifically watch the "Data Exfiltration" row — the diode bar drops from 83% to 0%, the row gets a red tint, and "▼ -83%" delta label appears above the bar (0:42)
6. Click the ACK button (0:44)
7. Watch exfiltration bar recover from 0% to 83%, "▲ +83%" delta appears (0:46)
8. Click FULL button to reset (0:48)

### VOICEOVER

> "Traditional detection systems need full network access. They install probes, decrypt traffic, run active scans. In a military or critical infrastructure network — you can't do any of that. The data diode only lets traffic flow one way."

**[Pause]**

> "So we built detection that works in read-only mode. And we measured exactly how much it degrades — so you always know what you're missing."

**[Pause, let the matrix sit for 2 seconds]**

> "No other system will tell you what it CAN'T see. We do."

### ON-SCREEN TEXT

**[Brief overlay, 0:40–0:48, during the diode toggle sequence]**

```
DIODE MODE
Exfiltration: 83% → 0%
ACK-Shadow: 0% → 83%
```

### DURATION: 25s

---

## THE ATTACK — HERO SECTION: 1:00 – 2:30

### SECTION 4A: SYN FLOOD (1:00 – 1:30)

#### VISUAL

**[Click "Attack Lab" in sidebar. Page loads.]**

**Attack Lab layout:**
- Header: EKADHARA | ATTACK LAB | Backend Online badge
- Left panel: 8 attack buttons in 4x2 grid (SYN Flood, UDP Flood, C2 Beacon, DGA Domains, DNS Tunnel, Port Scan, Data Exfil, TLS Beacon). Each has an icon, label, MITRE ID, severity, and when running shows a pulsing border with "INJECTING..." then "INJECTED" status.
- Right panel: Passive Flow Stream — terminal-style scrolling list of flow records with timestamps, IPs, protocols, packet counts.
- Middle row: Injection Log (left) + Live Detections (right) — detection alerts appear via WebSocket with severity badges, confidence bars, source IPs.
- Bottom: Terminal Output panel with green "›" prefixes, timestamps, and color-coded log entries.

#### MOUSE ACTION

1. Click "Attack Lab" sidebar (1:00)
2. Move cursor to the SYN FLOOD button — the red button with Zap icon (1:02)
3. Click SYN FLOOD button (1:03)
4. Watch the button state change: border pulses red, "INJECTING..." text appears with animated dots (1:04)
5. Observe the Passive Flow Stream on the right — flow records start appearing rapidly, scrolling upward: `14:32:01 203.0.113.10:45123 → 10.0.0.1:80 TCP SYN len=60`, `14:32:01 203.0.113.10:45124 → 10.0.0.1:80 TCP SYN len=60`, etc. (1:05–1:08)
6. Watch the Injection Log card populate: "SYN FLOOD · 203.0.113.10 · T1498 · 847 flows injected · INJECTED" (1:09)
7. Watch the Live Detections panel — after ~3 seconds, an alert card appears:
   - Severity: CRITICAL (red badge)
   - Threat: Volumetric DDoS
   - MITRE: T1498
   - Confidence bar fills to ~94%
   - Source IP: 203.0.113.10
   - Timestamp appears (1:12)
8. Watch the Terminal Output: new entries appear with timestamps:
   - `[14:32:01] › Injecting SYN FLOOD flows...`
   - `[14:32:01] ✓ 847 flows injected from 203.0.113.10`
   - `[14:32:08] ⚠ Detection triggered: DDoS Attack (T1498) confidence: 0.94`
   - `[14:32:08] › Alert emitted via WebSocket from 203.0.113.10` (1:14)
9. SYN FLOOD button transitions from "INJECTING..." to "INJECTED" with green checkmark (1:15)
10. After 8 seconds total, button shows "DONE" (1:16)

#### VOICEOVER

> "Let me show you what WATCHTOWER catches. Right now."

**[Click the SYN FLOOD button]**

> "SYN flood. Twelve hundred packets per second. The pipeline ingests flows, extracts features, runs the ensemble — and fires. Critical severity. MITRE T1498. Ninety-four percent confidence. In under eight seconds. No handshake needed. Passive observation only."

### ON-SCREEN TEXT

**[Flashes briefly when detection fires, 1:12–1:15]**

```
CRITICAL DETECTION
Volumetric DDoS · T1498
203.0.113.10 → 10.0.0.1
Confidence: 94%
```

### DURATION: 30s

---

### SECTION 4B: C2 BEACONING (1:30 – 1:55)

#### VISUAL

**[From Attack Lab, SYN Flood is now DONE. Click the C2 BEACON button — purple button with Radio icon.]**

#### MOUSE ACTION

1. Click C2 BEACON button (1:30)
2. Button pulses purple, shows "INJECTING..."
3. Passive Flow Stream shows periodic flow records at regular intervals — the inter-arrival pattern is visible in the timestamps (1:32–1:35)
4. Live Detections panel: new alert card appears:
   - Severity: HIGH (orange badge)
   - Threat: C2 Beaconing
   - MITRE: T1071.001
   - Confidence: ~91%
   - Source IP visible (1:37)
5. Terminal shows: beacon periodicity analysis, inter-arrival variance detection (1:38)
6. Button transitions to INJECTED → DONE (1:40)

#### VOICEOVER

> "C2 beaconing. Periodic callbacks every four seconds. The inter-arrival timing pattern is unmistakable. High severity. T1071.001. Ninety-one percent confidence. We caught it without decrypting a single packet."

### ON-SCREEN TEXT

```
C2 BEACONING DETECTED
Periodic beacon: 4.2s interval
T1071.001 · Confidence: 91%
```

### DURATION: 25s

---

### SECTION 4C: PORT SCAN (1:55 – 2:15)

#### VISUAL

**[Click PORT SCAN button — yellow/amber button with Scan icon.]**

#### MOUSE ACTION

1. Click PORT SCAN button (1:55)
2. Button pulses amber, "INJECTING..."
3. Passive Flow Stream shows rapid-fire connections to sequential ports — 203.0.113.40 hitting ports 22, 23, 25, 53, 80, 443, 8080, 3306, and so on — the unique destination port count climbing fast (1:57–2:00)
4. Live Detections: alert card appears:
   - Severity: MEDIUM (amber badge)
   - Threat: Port Scanning
   - MITRE: T1046
   - Confidence: ~97%
   - Evidence: "47 unique ports in 8 seconds" (2:02)
5. Terminal logs show fan-out analysis (2:03)
6. Button transitions to DONE (2:05)

#### VOICEOVER

> "Port scan. One source. Forty-seven unique ports in eight seconds. The fan-out pattern is unmistakable. Medium severity. T1046. Ninety-seven percent confidence. The AI catches reconnaissance before the attacker finds an open door."

### ON-SCREEN TEXT

```
PORT SCAN DETECTED
47 unique ports · 8 seconds
T1046 · Confidence: 97%
203.0.113.40
```

### DURATION: 20s

---

### SECTION 4D: DATA EXFILTRATION (2:15 – 2:30)

#### VISUAL

**[Click DATA EXFIL button — red button with Download icon.]**

#### MOUSE ACTION

1. Click DATA EXFIL button (2:15)
2. Button pulses red, "INJECTING..."
3. Passive Flow Stream shows large outbound transfers — bytes_sent >> bytes_recv
4. Live Detections: alert card:
   - Severity: CRITICAL
   - Threat: Data Exfiltration
   - MITRE: T1041
   - Confidence: ~83% (2:20)
5. Terminal logs show byte asymmetry ratio (2:21)
6. Button transitions to DONE (2:25)

#### VOICEOVER

> "Data exfiltration. Asymmetric outbound traffic. Critical severity. T1041. Caught before the data leaves."

**[Pause, let the detection sit for 3 seconds.]**

### ON-SCREEN TEXT

```
DATA EXFILTRATION DETECTED
Outbound byte spike · T1041
Confidence: 83%
```

### DURATION: 15s

---

## THE DIODE ADVANTAGE: 2:30 – 3:30

### VISUAL

**[Click "Diode Lab" in sidebar. Page loads. The Degradation Matrix is visible with all bars in FULL-DUPLEX mode (green, all high percentages).]**

**Diode Lab — Full-Duplex mode (current state):**
- Degradation Matrix: All 6 threat rows show high green bars in all three columns.
- Data Flow Diagram: Bright forward + return path lines. Return path dots flowing back.
- No degradation warning banner.

**[Click the DIODE button in the DiodeToggle.]**

**Diode Lab — Diode-Only mode:**
- DiodeToggle highlight slides to DIODE (orange glow).
- Data Flow Diagram: Return path line dims to near-invisible, forward path gets dashed pattern. "RETURN PATH BLOCKED" text appears below the diode node in red.
- Degradation Matrix: Bars animate and update.
  - DDoS: green 94% → orange 41% (▼ -53% delta appears)
  - C2 Beaconing: 91% → 73% (▼ -18%)
  - DGA Domains: 88% → 85% (minimal change)
  - DNS Tunneling: 86% → 85% (minimal change)
  - Port Scan: 92% → 84% (▼ -8%)
  - Data Exfiltration: 83% → **0%** (▼ -83%, row turns red-tinted, "SILENT FAILURE" text appears)
- DEGRADATION WARNING banner flashes at top: "3 threats below 50% detection — silent failure risk"

**[Click the ACK button in the DiodeToggle.]**

**Diode Lab — ACK-Shadow mode:**
- DiodeToggle highlight slides to ACK (cyan glow).
- Data Flow Diagram: Return path shows faint dashed line with "SHADOW ACK CHANNEL" label in cyan.
- Degradation Matrix: ACK-SHADOW column bars animate.
  - DDoS: 41% → 78% (▲ +37%)
  - C2 Beaconing: 73% → 87% (▲ +14%)
  - Data Exfiltration: **0% → 83%** (▲ +83%, the row un-tints from red, "▲ +83%" delta appears)
- Degradation Warning banner changes to: "Detection rates degraded — ACK-Shadow recommended"

### MOUSE ACTION

1. Click "Diode Lab" in sidebar (2:30)
2. Let page render fully, show the clean FULL-DUPLEX state for 3 seconds (2:32)
3. Click DIODE button in toggle (2:35)
4. Pan slightly right to follow the Degradation Matrix update — watch the bars animate and shrink (2:36–2:40)
5. Hover over the Data Exfiltration row briefly to emphasize the 0% → red row transition (2:40)
6. Let the DEGRADATION WARNING banner sit for 2 seconds (2:42)
7. Click ACK button (2:44)
8. Watch exfiltration bar recover from 0% to 83% — this is the money shot. Hold for 3 seconds (2:45–2:48)
9. Click FULL button to reset (2:50)

### VOICEOVER

> "But here's what no other team will show you."

**[Click DIODE toggle]**

> "In diode-only mode, we can't see return traffic. ACK packets are missing. Our detection degrades gracefully — DDoS drops from ninety-one percent to seventy-three percent. C2 beaconing holds at seventy-three. But exfiltration goes completely blind. Zero percent. Silent failure."

**[Click ACK toggle — watch the exfiltration bar recover]**

> "With ACK-Shadow inference, we recover exfiltration detection from zero to eighty-three percent. No other system will tell you what it CAN'T see. We do."

**[Pause, let the matrix sit for 2 seconds]**

> "Look at these validity chips. Green means we measured it in the lab. Amber means we estimated it. Red means it's missing entirely — and we TELL you that. That honesty is the point."

### ON-SCREEN TEXT

**[Overlay during the ACK recovery moment, 2:46–2:50]**

```
EXFILTRATION RECOVERED
0% → 83% via ACK-Shadow
The gap we close that others ignore
```

### DURATION: 60s

---

## IMPACT & CLOSE: 3:30 – 4:30

### SECTION 5A: DASHBOARD STATS (3:30 – 3:50)

#### VISUAL

**[Click "Dashboard" in sidebar. Page loads with live data.]**

**Focus on:**
- HUD bar: throughput counter showing ~10K flows/s
- 6 KPI cards with live numbers
- LIVE THREAT TICKER scrolling
- Detection Pipeline showing all 4 stages active

### MOUSE ACTION

1. Click Dashboard in sidebar (3:30)
2. Slowly pan the viewport down to show: KPI cards → Ticker → Pipeline → Degradation Matrix (3:32–3:38)
3. Stop on the Detection Pipeline section, point at the 4 nodes (3:38)

### VOICEOVER

> "Ten thousand flows per second. Sub-five millisecond detection latency. Eight threat types. Three detection modes. All running on read-only traffic. The system never sends a packet. Never decrypts a payload. Never touches the enclave."

### ON-SCREEN TEXT

```
10K FLOWS/SEC
<5MS LATENCY
8 THREAT TYPES
3 DETECTION MODES
ZERO OUTBOUND
```

### DURATION: 20s

---

### SECTION 5B: AI ANALYZER (3:50 – 4:10)

#### VISUAL

**[Click "AI Analyzer" in sidebar. Page loads.]**

**AI Analyzer layout:**
- Header: EKADHARA | AI ANALYZER
- Pipeline Stages: 4 cards in a row — INGEST (10K flows/s), FEATURES (127 features), INFERENCE (8 models), OUTPUT (<5ms)
- KPI row: Avg Accuracy 93.4%, Avg F1 92.6%, Active Models 7, Training Samples 2.6M, Inference Latency 12ms
- Threat Models table: 8 rows — DDoS (RF, 96.8%), C2 Beaconing (Isolation Forest + LSTM, 93.4%), DGA (Char CNN + RNN, 95.1%), DNS Tunnel (XGBoost, 91.2%), Port Scan (K-means + SVM, 89.7%), Data Exfil (Transformer, 94.5%), TLS Anomaly (Isolation Forest, 87.3%), Malware (GBT, 95.8%)
- Feature Importance: horizontal bar chart — JA3 hash entropy (94%), Flow byte ratio (87%), Inter-arrival variance (82%), etc.
- Confidence Histogram: distribution of confidence scores
- Live Inference Stats: Predictions/sec (~9K/s), Avg Latency (12ms), Queue Depth (~100), GPU Utilization (~75%) with sparkline

### MOUSE ACTION

1. Click "AI Analyzer" in sidebar (3:50)
2. Point at the Pipeline Stages row — briefly touch each of the 4 cards (3:52)
3. Scroll down slightly to show the Threat Models table (3:55)
4. Point at the C2 Beaconing row — "Isolation Forest + LSTM, 93.4% accuracy" (3:57)
5. Scroll down more to show Feature Importance chart (4:00)
6. Point at JA3 hash entropy bar (top bar, 94%) (4:02)
7. Scroll to bottom, point at Live Inference Stats — the predictions/sec number ticking (4:05)

### VOICEOVER

> "Our ensemble classifier was trained on CIC-IDS2017 — two point six million labeled samples. Random Forest for DDoS. Isolation Forest plus LSTM for beaconing. Character CNN for DGA domains. Transformer encoder for exfiltration. Each model specialized for its threat class. Ninety-three point four percent average accuracy."

### ON-SCREEN TEXT

```
CIC-IDS2017
2.6M SAMPLES · 8 MODELS
93.4% AVG ACCURACY
127 FEATURES / FLOW
```

### DURATION: 20s

---

### SECTION 5C: COMPARISON & CLOSE (4:10 – 4:30)

#### VISUAL

**[Scroll back to the top of the AI Analyzer, or switch to Dashboard.]**

**[On Dashboard, the Degradation Matrix is visible. The three columns (FULL / DIODE / ACK) show the comparison clearly.]**

**Show:**
- Degradation Matrix on the Dashboard — 6 threat rows with 3-bar comparisons
- Key contrast visible: Data Exfiltration goes from 83% → 0% → 83%

### MOUSE ACTION

1. Click Dashboard in sidebar (4:10)
2. Scroll down slightly to center the Degradation Matrix (4:12)
3. Point at the exfiltration row — the dramatic drop and recovery (4:14)
4. Let the matrix sit for 8 seconds as the final visual (4:16–4:24)

### VOICEOVER

> "A baseline threshold system drops fifty-seven percent in diode mode and doesn't tell you. WATCHTOWER drops fifteen percent on average — and shows you exactly where. Every gap. Every recovery. Every threat we can't catch and why."

**[Pause for 3 seconds. The Degradation Matrix is the last thing the judges see.]**

> "Built for the real constraints of national security networks. EKADHARA. Read-only ingest. Streaming inference. Structured alert output. Thank you."

### ON-SCREEN TEXT (fades in over the Degradation Matrix)

```
EKADHARA — WATCHTOWER
PS-26145 · NTRO · SIH26
```

### DURATION: 20s

---

## TECHNICAL SPECS: 4:30 – 5:00

### VISUAL

**[The text overlay expands to fill the screen over the Degradation Matrix background. The matrix fades slightly behind the text.]**

**Text appears line by line, each fading in sequentially:**

```
┌─────────────────────────────────────────────┐
│  8 THREAT TYPES DETECTED                    │
│                                             │
│  DDoS Flood  ·  C2 Beaconing  ·  DGA Domains│
│  DNS Tunneling  ·  Port Scanning  ·  Exfil  │
│  TLS Anomaly  ·  Malware Detection          │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  3 TRANSMISSION MODES                       │
│  Full-Duplex  ·  Diode-Only  ·  ACK-Shadow  │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  10,000 FLOWS / SECOND                      │
│  < 5MS P99 LATENCY                          │
│                                             │
│  CIC-IDS2017 TRAINED MODELS                 │
│  2.6M SAMPLES · 8 MODELS · 93.4% ACCURACY  │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  ZERO OUTBOUND CONNECTIONS                  │
│  READ-ONLY INGEST                           │
│  NO PAYLOAD DECRYPTION                      │
│                                             │
│  EKADHARA · PS-26145 · NTRO · SIH26        │
└─────────────────────────────────────────────┘
```

### MOUSE ACTION

No interaction. The text overlay appears automatically. The mouse is not visible.

### VOICEOVER

> "Eight threat types. Three transmission modes. Ten thousand flows per second. Sub-five millisecond p99 latency. CIC-IDS2017 trained models. Zero outbound connections. Built for the real constraints of national security networks."

**[Pause for 2 seconds]**

> "EKADHARA. Thank you."

### DURATION: 30s

**[Fade to black. Hold for 2 seconds.]**

---

## COMPLETE TIMING SUMMARY

| Section | Time | Duration |
|---------|------|----------|
| COLD OPEN | 0:00 – 0:20 | 20s |
| TEAM INTRO | 0:20 – 0:35 | 15s |
| THE SETUP | 0:35 – 1:00 | 25s |
| SYN FLOOD | 1:00 – 1:30 | 30s |
| C2 BEACONING | 1:30 – 1:55 | 25s |
| PORT SCAN | 1:55 – 2:15 | 20s |
| DATA EXFILTRATION | 2:15 – 2:30 | 15s |
| DIODE ADVANTAGE | 2:30 – 3:30 | 60s |
| DASHBOARD STATS | 3:30 – 3:50 | 20s |
| AI ANALYZER | 3:50 – 4:10 | 20s |
| COMPARISON & CLOSE | 4:10 – 4:30 | 20s |
| TECHNICAL SPECS | 4:30 – 5:00 | 30s |
| **TOTAL** | **0:00 – 5:00** | **5:00** |

---

## RECORDING INSTRUCTIONS

### Setup

1. **Resolution:** 1920x1080, 60fps
2. **Tool:** OBS Studio (Display Capture, not Window Capture — avoids scaling artifacts)
3. **Browser:** Chrome Incognito, zoom 100%, DevTools closed, bookmarks bar hidden (Ctrl+Shift+B)
4. **Backend:** `python server.py` in one terminal, `npm run dev` in another
5. **Pre-warm:** Let Dashboard run for 60 seconds before hitting record — ensures KPI cards, ticker, and pipeline are fully populated with live data

### Page Navigation During Recording

Use the sidebar clicks only. Do NOT use browser back/forward. Each page click should be clean — wait for the page transition animation to complete (~150ms) before proceeding.

### Attack Sequence

Record attacks in this exact order. Each attack takes ~8 seconds from click to DONE state. Do not rush between attacks — wait for the "DONE" status before clicking the next one.

**Critical:** If the backend is not running, the attacks will show errors. Have the backend running and tested before recording begins.

### The Diode Toggle Sequence (MOST IMPORTANT 60 SECONDS)

Record 3 takes of this section. Pick the cleanest one in post-production. The timing must be precise:

- 0:00–0:05: Full-Duplex state, matrix bars all green/high
- 0:05–0:10: Click DIODE, watch bars animate
- 0:10–0:20: Hold on Diode-Only, emphasize the exfiltration drop to 0%
- 0:20–0:25: Click ACK, watch exfiltration recover to 83%
- 0:25–0:30: Hold on ACK-Shadow recovery, let it breathe

### Post-Production

1. **Captions:** White text, semi-transparent black background (#000000CC), JetBrains Mono or Inter font, 20pt, bottom third of screen. Burn in all spoken lines. Time captions to match VO precisely.
2. **Alert chime:** Subtle alert sound when detections fire. Keep at -40dB. Use a short, clean tone — not a siren.
3. **Speed adjustments:** Speed up the Passive Flow Stream scrolling by 1.3x in post. This makes the attack section feel more dynamic without being unrealistic.
4. **Scanline overlay:** Add a very subtle scanline effect (5% opacity, horizontal lines at 2px spacing) across the entire video for the ops-center aesthetic.
5. **Color grading:** Slight contrast boost (+5) for projector visibility. Keep the dark navy/black theme intact.
6. **Export:** H.264 CRF 18, 1920x1080, 60fps. Target file size under 100MB.
7. **Upload:** YouTube unlisted + MP4 backup drive.

### What NOT to do

- DON'T spend more than 5 seconds on any page without interaction or data movement
- DON'T do a tour-guide "and here's the analytics page, and here's the settings"
- DON'T show any page that's empty or half-populated
- DON'T say "let me click on this" — just click. The mouse movement is narration enough.
- DON'T show the "DEMO MODE" disclaimer prominently — the corner badge is sufficient
- DON'T use the browser address bar for navigation — sidebar only
- DON'T zoom in/out during recording
- DON'T scroll the page unnecessarily — let the layout breathe
- DON'T record more than 3 takes of any section. Pick and move on.

---

## JUDGE CRITERIA DELIVERY MAP

| Criterion | Where Delivered | How |
|-----------|----------------|-----|
| Working prototype | Attack Lab section | Live attacks, real WebSocket alerts, 8-second detection cycle |
| Read-only ingest | Diode Lab + Dashboard | Diode toggle demo, READ-ONLY badges, no outbound shown |
| No payload decryption | Setup section + AI Analyzer | JA3/JA4 metadata only stated, no decryption shown |
| Streaming, not batch | Dashboard pipeline | 4-stage pipeline with <5ms output, WebSocket alerts |
| 10K throughput | Dashboard KPI + AI Analyzer | Throughput counter, Live Inference Stats |
| Alert schema | Attack Lab detections | Structured cards: timestamp, severity, MITRE, confidence, evidence, source IP |
| 8 threat types | Attack Lab grid + AI Analyzer table | All 8 shown in attack grid, all 8 in model table |
| Dashboard | Cold open + Close | Live dashboard as bookend |
| Model documentation | AI Analyzer section | CIC-IDS2017, 8 models, F1 scores, training samples |
| Feature engineering | AI Analyzer Feature Importance | 10 features with importance scores |
| Video demo | Entire video | Live recording, real timing, no mocked data |
| Diode degradation | Diode Lab (hero section) | Full toggle sequence, degradation matrix, validity chips |
| MITRE ATT&CK | Every detection | T1498, T1071.001, T1046, T1041 on every alert |
| Honest degradation | Validity chips + DEGRADATION WARNING | MEASURED/ESTIMATED/MISSING chips, warning banner, exfiltration 0% |
| ACK-Shadow recovery | Diode Lab ACK toggle | Exfiltration 0% → 83% recovery |
| Air-gap proof | Implied throughout | Zero outbound, diode read-only, no return path |

---

## ATTACK SEQUENCE FOR RECORDING

The Attack Lab is manual. Click each attack and let the pipeline run:

1. **SYN Flood** → CRITICAL, T1498, ~94% confidence, ~847 flows injected
2. **C2 Beacon** → HIGH, T1071.001, ~91% confidence, periodic pattern
3. **Port Scan** → MEDIUM, T1046, ~97% confidence, 47 unique ports
4. **Data Exfil** → CRITICAL, T1041, ~83% confidence, byte asymmetry

Record each attack as a separate pass if needed. In post, interleave them into the narrative sequence.
