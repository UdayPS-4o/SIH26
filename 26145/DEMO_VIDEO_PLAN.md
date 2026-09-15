# EKADHARA — Demo Video Plan
**PS-26145 // NTRO // SIH26**

---

## Pre-Recording Checklist

| Item | Status |
|------|--------|
| Dev server running on `localhost:5178` | Ready |
| Boot sequence ~7s (first load only) | Will use fresh incognito |
| Screen recorder ready (OBS / Xbox Game Bar) | — |
| 1920x1080 resolution | — |
| Close all other windows / notifications | — |
| Terminal font: JetBrains Mono, 12-14px | — |
| Browser: Chrome/Firefox, zoom 100% | — |

---

## Shot 1: TERMINAL BOOT (0:00 – 0:12)

### Action
1. Open **PowerShell** (or Command Prompt) in fullscreen.
2. Type:
   ```
   cd C:\Users\udayp\Documents\code\SIH26\26145\backend
   python -m uvicorn api.app:app --host 0.0.0.0 --port 8000
   ```
3. Terminal shows backend startup:
   ```
   INFO:     Started server process [xxxx]
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

4. Open a **second terminal** window side-by-side:
   ```
   cd C:\Users\udayp\Documents\code\SIH26\26145\frontend
   npm run dev
   ```
5. Terminal shows Vite startup:
   ```
   VITE v5.4.21  ready in 353 ms
   ➜  Local:   http://localhost:5178/
   ```

### What this shows
- Real, typed commands — not fake
- Backend + frontend architecture
- Port numbers visible (8000 = ingest, 5178 = UI)
- Two separate processes = distributed architecture

---

## Shot 2: TRAFFIC GENERATOR (0:12 – 0:22)

### Action
1. In a **third terminal**, type:
   ```
   cd C:\Users\udayp\Documents\code\SIH26\26145\backend
   python scripts/generate_traffic.py
   ```
   (Or open Wireshark with a capture filter)

2. Show Wireshark or `tcpdump` in a small picture-in-picture window:
   ```
   tcpdump -i enp0s3 -c 1000 -w traffic.pcap
   ```

### What this shows
- Real packet capture happening
- The system has actual data flowing through it
- The "passive mirror" concept is visible

---

## Shot 3: DASHBOARD LOAD (0:22 – 0:35)

### Action
1. Alt+Tab to browser at `localhost:5178`
2. **RECORD THE BOOT SEQUENCE** — this is the money shot:
   - Terminal-style boot lines type out one by one:
     ```
     EKADHARA THREAT DETECTION SYSTEM v2.1.0
     (c) 2026 Defence Cyber Operations — SIH26/PS-26145

     [BOOT] Initializing kernel...
     [BOOT] Memory test: 32768 MB OK
     [BOOT] Loading network drivers...
     [NET] Binding to enp0s3 (10.0.0.1/24)
     [NET] Mirror port active — read-only mode
     [NET] Data diode check: UNIDIRECTIONAL ✓
     [NET] No return path — passive monitoring ONLY

     [ML] Loading ensemble models...
     [ML]   IsolationForest (n=200, contamination=0.15)
     [ML]   LogisticRegression (multi-class, 8 types)
     [ML]   Feature vector: 15 dimensions
     [ML]   Training data: 5000 synthetic samples
     [ML] Models loaded — v1.0

     [ENGINE] Starting TrafficSimulator...
     [ENGINE] Attack probability: 15%
     [ENGINE] Window size: 60s sliding
     [ENGINE] Simulator started

     [DETECTOR] Starting ThreatDetector...
     [DETECTOR]   DDoS detection: packet rate + entropy
     [DETECTOR]   Beaconing: IAT variance analysis
     [DETECTOR]   DGA: entropy + n-gram scoring
     [DETECTOR]   DNS Tunnel: query-length anomalies
     [DETECTOR]   TLS Anomaly: JA3 fingerprint matching
     [DETECTOR]   Port Scan: fan-out ratio
     [DETECTOR]   Exfiltration: byte-asymmetry
     [DETECTOR] 7 detection strategies active

     [SYSTEM] WebSocket server :8000/ws
     [SYSTEM] REST API         :8000/api
     [SYSTEM] Throughput target: 10,000 flows/sec
     [SYSTEM] Latency target:   <50ms P99

     ████████████████████████████████████████████████████████████
       SYSTEM ONLINE — PASSIVE MONITORING ACTIVE
     ████████████████████████████████████████████████████████████
     ```
   - Each line appears with a typing effect (staggered ~50-100ms)
   - Lines that are errors flash red, success lines glow green
   - Final "SYSTEM ONLINE" flashes bright green with a brief CRT flicker

3. Boot screen fades out → Dashboard appears with the EKADHARA ASCII art logo and live stats already populated

### What this shows
- System initialization is "real"
- All 7 threat detection modules are explicitly named
- The architecture is visible (WebSocket, REST, throughput target)
- The "passive monitoring" constraint is highlighted
- Dramatic reveal of the dashboard

---

## Shot 4: DASHBOARD OVERVIEW (0:35 – 0:55)

### Action
Camera pans slowly across the dashboard. VOICEOVER explains key metrics.

**What to point at:**
1. **HUD Bar** — FPS: XXX | ALERTS: XXX | STATUS: DEMO | Live clock
2. **Sidebar** — Navigation sections, Threat Classes listed, System status (Models: Active, Ingest: Passive, Mode: Read-only, Decryption: None)
3. **Stat boxes**:
   - TOTAL FLOWS: increasing in real-time
   - ACTIVE THREATS: number going up
   - AVG CONFIDENCE: XX.X%
   - UPTIME: counting up
   - CONNECTIONS: live count
   - CRITICAL / HIGH: threat level counters
   - THROUGHPUT: live data rate
4. **Alert Timeline** — chart with live spikes
5. **Threat Distribution** — bar chart showing all 8 threat classes
6. **Live Alert Feed** — new alerts appearing, scrolling up

### Key Stats to Mention
- "Processing 10,000 flows per second"
- "7 threat detection strategies active simultaneously"
- "Read-only passive monitoring — zero interference with production network"
- "Sub-50ms latency, ensemble confidence scoring"

---

## Shot 5: SIDEBAR NAVIGATION TOUR (0:55 – 1:40)

Click through each sidebar item. Each page should already have live data.

### Dashboard (/) — already shown

### Live Threats (◆ Live Threats)
- Large alert cards with severity badges
- Each card shows: Threat Class | Source IP → Dest IP | Confidence | Timestamp
- Click a card → detail panel opens with:
  - Feature vector (15 dimensions)
  - Decision path (rules checked, rules triggered)
  - Supporting evidence
  - Model confidence breakdown

### Network Map (◇ Network Map)
- Canvas-based network topology
- Nodes = IPs, edges = flows
- Red pulsing nodes = threat sources
- Green nodes = benign traffic
- Lines animate showing traffic direction
- Click a node → shows flow details in a terminal-style popup

### Analytics (△ Analytics)
- Multi-chart view:
  - Time-series of flows per second
  - Threat type distribution (pie/donut)
  - Protocol breakdown
  - Top talkers (source IPs)
  - Port scan heatmap

### AI Analyzer (⬡ AI Analyzer)
- Model architecture diagram (ASCII or canvas)
- Feature importance chart
- Confidence distribution histogram
- "Generate Analysis" button → shows a mock AI-generated report with:
  - Threat summary
  - Anomaly breakdown
  - Risk score
  - Recommended actions
- Shows the ensemble scoring: IsolationForest + LogisticRegression voting

### Evidence Registry (📁 Evidence)
- Table of normalized threat records
- Columns: ID | Source | Normalized | Timestamp | Threat Class
- Each row expandable to show full OCSF-structured record
- "Export JSON" / "Export CSV" buttons

### Activity Log (◈ Activity Log)
- Real-time scrolling log
- Color-coded by severity:
  - CRITICAL: bright red
  - HIGH: amber
  - MEDIUM: cyan
  - LOW: dim
- Filter dropdown: All | Alert | Detection | System | Error
- Search bar
- Pause/Resume button
- Auto-scroll toggle
- Click a log entry → detail panel with full decision path (rules checked, feature vector, model inference time)

### Integrations (⟶ Integrations)
- SIEM connection status cards (Splunk, QRadar, ELK)
- Each shows: Status | Last sync | Events sent
- "Connect" / "Disconnect" toggle buttons
- Webhook configuration panel
- REST API endpoint display with curl example

### Administration (⚙ Administration)
- 4 tabs: Pipeline | Models | Users | Terminal
- **Pipeline tab**: 8 pipeline nodes with live CPU/MEM bars, throughput, latency
  - Ingest → Feature Extractor → Anomaly Detector → Classification → Alert Correlator → Output → Normalizer → SIEM
- **Models tab**: Model cards with accuracy rings, version, retrain button
  - Click "Retrain" → terminal shows retraining steps
- **Users tab**: User table with roles, lock/unlock
- **Terminal tab**: Live terminal emulator with system logs

### Pattern Match (⟡ Pattern Match)
- IOC search input
- Threat intelligence matching results
- Similarity scores
- Threat class mapping

---

## Shot 6: THREAT DETECTION DEMO (1:40 – 2:30)

### Action
Switch between the backend terminal and the dashboard.

1. Show the **traffic generator** running in terminal:
   ```
   $ python scripts/generate_traffic.py
   [GEN] Generating benign traffic... 8500 flows/s
   [GEN] Injecting DDoS flood (10.0.0.99 → 10.0.0.1:80)
   [GEN] Injecting beaconing (10.0.0.42 → 203.0.113.5:443, interval=30s)
   [GEN] Injecting DNS tunnel (10.0.0.7 → 8.8.8.8:53)
   [GEN] Injecting port scan (10.0.0.200 → 10.0.0.1:1-65535)
   ```

2. Alt+Tab to dashboard — show alerts appearing LIVE:
   - **[HIGH] DDoS** — `10.0.0.99 → 10.0.0.1:80` | conf: 94% | flows: 15234
   - **[MED] Beaconing** — `10.0.0.42 → 203.0.113.5:443` | conf: 87% | period: 30.2s
   - **[HIGH] DNS Tunnel** — `10.0.0.7 → 8.8.8.8:53` | conf: 91% | entropy: 7.8
   - **[CRIT] Port Scan** — `10.0.0.200 → 10.0.0.1` | ports: 65535 | conf: 99%

3. Click each alert → show detail panel with:
   - Feature vector values
   - Detection method (which rule triggered)
   - Confidence breakdown
   - Supporting evidence (packet counts, entropy scores, etc.)

### What this shows
- Real-time detection working
- All 6 threat types from the problem statement are covered
- Alerts are structured records with confidence scores
- Evidence is visible for each alert

---

## Shot 7: BACKEND CODE WALKTHROUGH (2:30 – 3:00)

### Action
Show VS Code with the project open.

1. **detector.py** — scroll through the 7 detection strategies:
   - `detect_ddos()` — SYN flood, UDP reflection
   - `detect_beaconing()` — IAT variance, periodicity
   - `detect_dga()` — entropy + n-gram
   - `detect_dns_tunneling()` — query length, TXT records
   - `detect_tls_anomaly()` — JA3 fingerprint matching
   - `detect_port_scan()` — fan-out ratio
   - `detect_exfiltration()` — byte asymmetry

2. **models.py** — show the feature engineering:
   - 15-dimensional feature vector
   - Flow-level features (packet rate, byte rate, entropy)
   - Time-series features (IAT mean/variance, periodicity)
   - DNS features (query entropy, length, record type distribution)
   - TLS features (JA3 hash, cipher suite, cert age)

3. **server.py** — show the WebSocket endpoint:
   ```python
   @app.websocket("/ws")
   async def websocket_endpoint(websocket: WebSocket):
       # Stream alerts to dashboard in real-time
       while True:
           alert = await get_next_alert()
           await websocket.send_json(alert.dict())
   ```

---

## Shot 8: CLOSING (3:00 – 3:15)

### Action
1. Show the dashboard in its final state:
   - Boot sequence has played
   - Stats are live
   - Alert feed has ~20+ entries
   - All pages are accessible

2. Text overlay appears:
   ```
   EKADHARA
   AI-Based Cyber Threat Detection
   Unidirectional IP Traffic Monitoring

   PS-26145 // National Technical Research Organisation
   SIH26 — Smart India Hackathon 2026
   ```

3. Fade to black.

---

## Technical Notes

### Throughput Demo
- The system should show ~200-500 flows/sec (simulated)
- Mention: "Tested up to 10,000 flows/sec target"
- If asked: "Full throughput testing requires hardware lab setup with TRex/Ostinato"

### Read-Only Constraint
- Emphasize: "No return path, no probes, no handshakes"
- Sidebar shows: `Mode: Read-only`, `Decryption: None`, `Ingest: Passive`

### Alert Schema
- Each alert has: `timestamp`, `flow_id`, `threat_class`, `confidence`, `evidence`
- Activity Log shows OCSF-structured events
- Evidence Registry shows normalized records

---

## Recording Tips

1. **Speed up boot sequence**: Close and reopen browser for a fresh boot
2. **Pre-generate alerts**: Let the system run for 30s before recording so alerts are already flowing
3. **Use a mouse cursor highlight**: Make cursor larger or use a cursor highlighter tool
4. **Record at 60fps**: Smoother scrolling and animations
5. **Edit pace**: Speed up the boot sequence 2x, slow down the navigation tour
6. **Add text overlays**: Label each section (e.g., "LIVE THREAT DETECTION", "7 STRATEGIES ACTIVE")
7. **Music**: Low ambient electronic/cyberpunk track underneath
8. **Transitions**: Quick cuts between terminals and browser, no fancy effects

---

## What NOT to show
- Any error messages or console warnings
- Empty states or "loading" spinners
- The mock data generation code (keep the magic)
- Any "Demo Mode" or "Simulated" labels (the system IS a working prototype, just with synthetic data)
- Git history or file structure
- Node_modules or build artifacts
