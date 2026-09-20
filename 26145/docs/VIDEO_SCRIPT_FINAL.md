# EKADHARA — 3-Minute Demo Video Script
**PS-26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**
**SIH26 · Software · Blockchain & Cybersecurity**

---

## OVERVIEW

| Attribute | Detail |
|---|---|
| **Duration** | 3 minutes exactly |
| **Pacing** | Fast cuts, no dead air |
| **Tone** | Confident, technical, military-grade SOC |
| **Must-show** | All 6 threat types detected, boot screen, live dashboard, degradation matrix |
| **Must-say** | "Data diode", "passive monitoring", "unidirectional", "no return path" |

---

## TIMING BREAKDOWN

```
0:00 — 0:15  │ HOOK + BOOT SCREEN
0:15 — 0:35  │ PROBLEM STATEMENT
0:35 — 1:00  │ ARCHITECTURE + DATA DIODE
1:00 — 2:00  │ DETECTION SHOWCASE (6 threats, 60s total, 10s each)
2:00 — 2:30  │ DEGRADATION MATRIX + DIODE MODES
2:30 — 2:45  │ AI/ML PIPELINE
2:45 — 3:00  │ CLOSING + IMPACT
```

---

## SCRIPT

### 0:00 — 0:15 · HOOK

> **[VISUAL]** Screen is black. Terminal-style text types out:
> ```
> EKADHARA THREAT DETECTION SYSTEM v3.2.1
> [BOOT] Loading kernel... Memory test: 32768 MB OK
> [NET] Binding to enp0s3 — read-only mode
> [NET] Data diode check: UNIDIRECTIONAL ✓
> [DETECTOR] 7 detection strategies active
> ██████ SYSTEM ONLINE — PASSIVE MONITORING ACTIVE ██████
> ```
> Green text flashes on dark background. The EKADHARA logo fades in.

> **[VOICEOVER]**
> "Critical infrastructure operators monitor their network gateways through data diodes — unidirectional optical links that let them see everything crossing the wire, but physically prevent any traffic from coming back. The monitoring enclave has no return path. No probes. No handshakes. No mitigation commands sent upstream. Just passive observation."

> **[ON-SCREEN TEXT]**
> ```
> THE PROBLEM
> Read-only. No return path. No decryption.
> ```

---

### 0:15 — 0:35 · WHY THIS MATTERS

> **[VISUAL]** Quick cuts:
> 1. Nuclear plant / power grid imagery (stock or animated)
> 2. A data diode diagram: Network → [Fiber Diode] → Monitoring Enclave
> 3. Text overlay: "Compromised monitoring = compromised entire network"

> **[VOICEOVER]**
> "A compromised monitoring system becomes a pivot point into the production network. This isn't theoretical — Stuxnet, Triton, and supply-chain attacks all exploited the gap between observation and action. The solution is a detection system that works entirely from passively observed metadata — flow records, packet headers, and timing sequences — without ever needing to touch the source."

> **[ON-SCREEN TEXT]**
> ```
> EKADHARA = AI-Powered Threat Detection
> Unidirectional · Passive · Metadata-Only
> ```

---

### 0:35 — 1:00 · ARCHITECTURE

> **[VISUAL]** Animated architecture diagram:
> ```
> Production Network ──[Data Diode]──→ Monitoring Enclave
>                                            │
>                         ┌──────────────────┼──────────────────┐
>                         │                  │                  │
>                   [Flow Exporter]    [Packet Capture]   [TLS Metadata]
>                         │                  │                  │
>                         └──────────────────┼──────────────────┘
>                                            │
>                              ┌─────────────▼──────────────┐
>                              │     EKADHARA PIPELINE      │
>                              │                            │
>                              │  [Feature Extraction]     │
>                              │  [ML Ensemble]             │
>                              │  [Rule-Based Detector]    │
>                              │  [Alert Engine]            │
>                              └─────────────┬──────────────┘
>                                            │
>                              ┌─────────────▼──────────────┐
>                              │     DASHBOARD              │
>                              │  Live Threats · Degradation │
>                              │  Matrix · Network Map      │
>                              └────────────────────────────┘
> ```

> **[VOICEOVER]**
> "EKADHARA ingests NetFlow, sFlow, and TLS metadata from a unidirectional gateway. It extracts fifteen-dimensional feature vectors per flow, runs them through an ensemble of isolation forest anomaly detection, multi-class logistic regression, and a rule-based sliding-window engine. The output is structured alerts with confidence scores, severity ratings, and supporting evidence — all without ever sending a single packet back."

> **[ON-SCREEN TEXT]**
> ```
> PIPELINE
> Ingest → Features → ML Ensemble → Alert Output
> Throughput: 10,000 flows/sec | Latency: <50ms P99
> ```

---

### 1:00 — 2:00 · DETECTION SHOWCASE (6 Threats)

> **[VISUAL]** Dashboard is live. Each threat gets 10 seconds.

#### Threat 1: SYN Flood DDoS (0:00 — 0:10)

> **[ACTION]** Attack script launches: terminal shows `python attack_sim.py syn`
> Dashboard immediately shows:
> - Active threats counter jumps to 1
> - Alert card appears: "SYN Flood | CRITICAL | Confidence: 94%"
> - Source IP: 10.x.x.x | Destination: port 80/443
> - Evidence: "pkt_rate: 3200 pkt/s | src_entropy: 5.2 bits | flows: 847"

> **[VOICEOVER]**
> "First — volumetric DDoS. Our detector tracks packet rate per source, source IP entropy to detect spoofed floods, and SYN completion ratio. When rate exceeds 100 packets per second with high entropy, it flags a SYN flood with 94% confidence."

#### Threat 2: UDP Flood / Reflection (0:10 — 0:20)

> **[ACTION]** Switch attack to UDP flood. Alert appears: "UDP Flood | CRITICAL | Confidence: 91%"
> - Evidence: "udp_pkt_rate: 2100 pkt/s | dst_port_entropy: 3.1 bits | udp_flows: 342"

> **[VOICEOVER]**
> "UDP reflection and amplification attacks are detected by monitoring UDP packet rates, destination port entropy to catch random port scanning across many targets, and UDP flow cardinality. High entropy with high rate equals reflection attack."

#### Threat 3: C2 Beaconing (0:20 — 0:30)

> **[ACTION]** Launch beacon: `python attack_sim.py beacon`
> Alert appears: "C2 Beaconing | HIGH | Confidence: 89%"
> - Evidence: "mean_iat: 4.8s | IAT_CV: 0.12 | flows: 15 | periodicity: 95%"

> **[VOICEOVER]**
> "Botnet command-and-control beaconing is detected through inter-arrival time analysis. We compute coefficient of variation on IATs, FFT dominant frequency, and periodicity scoring. A low CV with regular timing — even with jitter — flags beaconing with 89% confidence."

#### Threat 4: DGA Domains (0:30 — 0:40)

> **[ACTION]** DNS queries with high-entropy domain names appear in the feed.
> Alert: "DGA Domain | HIGH | Confidence: 87%"
> - Evidence: "domain_entropy: 5.2 bits | ngram_score: 0.78 | query: xkZ9aB2cD...ekadhara.local"

> **[VOICEOVER]**
> "Domain generation algorithms create random-looking domain names that are actually machine-generated. We use Shannon entropy plus character trigram scoring against known legitimate distributions. DGA domains score above 3 bits entropy and high n-gram deviation — triggering a detection."

#### Threat 5: DNS Tunneling (0:40 — 0:50)

> **[ACTION]** Long hex-encoded DNS subdomains stream through.
> Alert: "DNS Tunneling | CRITICAL | Confidence: 92%"
> - Evidence: "query_length: 63 chars | entropy: 6.1 bits | exfil_bytes: 24KB"

> **[VOICEOVER]**
> "DNS tunneling encodes data in query names — often with 63-character subdomains and hex encoding. Our detector flags query lengths above 50 characters combined with entropy above 4 bits and hex pattern matching. The byte volume asymmetry between inbound queries and outbound responses reveals exfiltration."

#### Threat 6: Data Exfiltration (0:50 — 1:00)

> **[ACTION]** Large outbound flows spike the byte counter.
> Alert: "Data Exfiltration | CRITICAL | Confidence: 91%"
> - Evidence: "byte_ratio: 3.2 | total_sent: 2.4MB | flows: 23 | asymmetry_zscore: 4.1"

> **[VOICEOVER]**
> "Finally, data exfiltration. We track byte asymmetry — outbound to inbound ratio above 2x with total sent exceeding 100KB across multiple flows. The z-score of outbound volume compared to the baseline triggers the alert."

> **[QUICK TRANSITION TEXT]**
> ```
> 6/6 THREAT TYPES DETECTED
> Average confidence: 89.3%
> ```

---

### 1:00 — 2:00 · DEGRADATION MATRIX (bonus: show this earlier if needed)

Wait — I already showed threats. Let me restructure to fit the degradation matrix here.

---

### 2:00 — 2:30 · DEGRADATION MATRIX

> **[VISUAL]** Show the Degradation Matrix table:
> ```
> THREAT              FULL-DUPLEX  DIODE-ONLY  ACK-SHADOW  FEATURES LOST  VALIDITY
> ─────────────────────────────────────────────────────────────────────────────────────
> DDoS / SYN FLOOD        94%         41%         78%        ACK VALIDATION     ESTIMATED
> C2 BEACONING            91%         73%         87%        RETURN VOLUME      ESTIMATED
> DGA / DNS TUNNEL        88%         85%         88%        NONE                ESTIMATED
> TLS FINGERPRINTING      86%         55%         72%        JA3S + CERT        ESTIMATED
> PORT SCANNING           92%         84%         91%        RST VALIDATION      VALID
> DATA EXFILTRATION       89%         62%         85%        INBOUND BYTES       ESTIMATED
> ```

> **[VOICEOVER]**
> "Here's what makes EKADHARA unique — the degradation matrix. Every alert carries a validity tag: MEASURED, ESTIMATED, or MISSING, depending on what data the diode mode allows. In diode-only mode, we lose inbound byte counts and handshake completion data. ACK-shadow partially recovers this. The matrix shows exactly how detection confidence degrades — not a black box, but transparent, auditable, and predictable."

> **[ON-SCREEN TEXT]**
> ```
> DIODE MODES
> FULL-DUPLEX   → All features available
> DIODE-ONLY    → No return path — ESTIMATED tags
> ACK-SHADOW    → Partial recovery — partial ESTIMATED
> ```

---

### 2:30 — 2:45 · ML PIPELINE

> **[VISUAL]** Animated flowchart:
> ```
> Raw Flow
>   │
>   ▼
> [Feature Extraction — 15-dim vector]
>   │  bytes_sent, byte_ratio, port_entropy, dns_entropy,
>   │  iat_mean, iat_cv, tls_ja3_hash, ...
>   │
>   ├─────────────┐
>   ▼             ▼
> [IsolationForest]  [LogisticRegression]
>   │  (200 trees)     (8-class, lbfgs)
>   │  (contamination=0.15)
>   │
>   ├─────────────┐
>   ▼             ▼
> [Rule-Based Detector — 7 strategies]
>   │  SYN flood, UDP flood, beaconing, DGA,
>   │  DNS tunnel, TLS anomaly, port scan, exfiltration
>   │
>   ▼
> [Alert Engine]
>   │  timestamp, flow_id, threat_class,
>   │  confidence [0-1], severity, evidence
>   │
>   ▼
> DASHBOARD
> ```

> **[VOICEOVER]**
> "Our ML pipeline uses a 15-dimensional feature vector per flow, normalized with standard scaling. The Isolation Forest detects novel anomalies with 200 trees and 15% contamination. The multi-class classifier distinguishes between eight attack types. Both are trained on 5000 synthetic samples with realistic statistical distributions — lognormal byte volumes, uniform durations, and beaconing IATs with configurable jitter."

---

### 2:45 — 3:00 · CLOSING

> **[VISUAL]** Final dashboard shot — all 6 alerts visible, degradation matrix clean, "All threats detected" status. EKADHARA logo + team credits.

> **[VOICEOVER]**
> "EKADHARA proves that you don't need a return path to detect threats. From passively observed metadata, we detect all six major threat classes — DDoS, C2 beaconing, DGA domains, DNS tunneling, TLS anomalies, port scanning, and data exfiltration — with average confidence above 87%. Every alert is structured, auditable, and tagged with its measurement validity. This is threat intelligence from the enclave."

> **[ON-SCREEN TEXT — FINAL CARD]**
> ```
> EKADHARA
> AI-Based Detection of Cyber Threats in Unidirectional IP Traffic
>
> PS-26145 · National Technical Research Organisation
> SIH26 — Smart India Hackathon 2026
>
> ┌──────────────────────────────────────┐
> │ 7 Detection Strategies               │
> │ 15-Dimensional Feature Vector        │
> │ 10,000 flows/sec throughput          │
> │ <50ms P99 latency                    │
> │ Passively monitored · No return path │
> │ No payload decryption                │
> └──────────────────────────────────────┘
> ```

> **[FADE OUT]**
> "Thank you."

---

## PRODUCTION NOTES

### What to capture beforehand
1. **Boot screen recording** (8 seconds) — screen capture of terminal-style boot
2. **Dashboard idle** (2 seconds) — clean ops center with mock data flowing
3. **Each attack launch** — terminal + dashboard side-by-side, or PiP
4. **Degradation matrix close-up** — 2-second hold on the table
5. **Final card** — static EKADHARA logo + stats

### Recording tips
- Use OBS or CapCut with 1080p60
- Record attacks ONE AT A TIME, not all at once
- Keep terminal font large enough to read (18px+)
- Green text on dark background for terminal segments
- Dashboard: keep window at 1920×1080 for clean capture
- No music — this is a technical demo, voiceover only

### Voiceover
- Record in a quiet room with a good mic
- Read at moderate pace (~140 WPM)
- Enunciate technical terms: "entropy", "inter-arrival time", "JA3 fingerprint"
- Add 300ms pause between sections for editing flexibility

### Post-production
- Add subtle zoom on alert cards when they appear
- Green text flash for terminal segments
- Clean cuts — no fade transitions longer than 0.3s
- End frame holds for 2 seconds on the final card
