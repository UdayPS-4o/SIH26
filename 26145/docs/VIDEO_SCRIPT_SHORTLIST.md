# EKADHARA — 3-Minute Shortlisting Video Script
**PS-26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**
**SIH26 · Software · Blockchain & Cybersecurity**

---
## OVERVIEW

| Attribute | Detail |
|---|---|
| **Duration** | 3 minutes exactly |
| **Pacing** | Fast cuts, every second counts |
| **Tone** | Confident, technical, precise |
| **Filmed with** | OBS / CapCut, 1080p60, no music, voiceover only |

---
## TIMING BREAKDOWN

```
0:00 — 0:20  │ HOOK — The Problem (data diode constraint)
0:20 — 0:50  │ LIVE DASHBOARD — Operations Center, real-time KPIs, alert feed
0:50 — 1:40  │ DETECTION SHOWCASE — 6 threat types on Live Threats page
1:40 — 2:30  │ DIODE LAB — Three-mode toggle, degradation matrix, ACK-Shadow
2:30 — 2:45  │ AI ANALYZER — Model architecture, feature vectors
2:45 — 3:00  │ CLOSING — Key numbers, impact statement
```

---
## PRE-PRODUCTION CHECKLIST

- [ ] Backend running on `localhost:8000` (generating live traffic + alerts)
- [ ] Frontend running on `localhost:5178`, browser at 1920×1080
- [ ] Browser at fullscreen (F11), dark theme active
- [ ] Close all other windows / notifications
- [ ] Have terminal ready for the egress self-test (`curl http://localhost:8000/api/self-test-egress`)
- [ ] Rehearse the timing 3 times before recording

---
## SCRIPT

---

### 0:00 — 0:20 · HOOK — THE PROBLEM

> **[VISUAL]**
> 1. Terminal window (full screen). Type and press Enter:
>    ```
>    curl http://localhost:8000/api/self-test-egress
>    ```
> 2. Terminal output appears:
>    ```
>    [egress-self-test] Attempting outbound connection to 8.8.8.8:53...
>    [egress-self-test] BLOCKED: seccomp denied sendto (errno 1)
>    [egress-self-test] Result: PASS — egress is structurally enforced
>    ```
> 3. Hold on the "PASS" line for 2 seconds.
> 4. Quick cut to browser — the EKADHARA dashboard loads. Sidebar shows the animated
>    data-diode SVG (packets flowing left→right through the diode symbol).

> **[VOICEOVER]**
> "Critical infrastructure networks are monitored through hardware data diodes —
> unidirectional optical links that copy traffic into a secure enclave, but
> physically prevent anything from coming back. No return path. No probes.
> No handshakes. The problem statement asks for a detection system that works
> under exactly these constraints. We built it."

> **[ON-SCREEN TEXT — 3 seconds]**
> ```
> THE CONSTRAINT
> Read-only. Unidirectional. No decryption.
> ```

---
### 0:20 — 0:50 · LIVE DASHBOARD — OPERATIONS CENTER

> **[VISUAL]**
> Browser is on the Operations tab (`/`). Show:
> 1. Top bar: "LIVE" indicator pulsing green, date/time stamp
> 2. Six KPI cards in a row:
>    - Active Connections: ~350
>    - Threats Blocked: ~1,400+
>    - Total Flows: ~55,000+
>    - Throughput: ~5,000 flows/s
>    - Threat Alerts: climbing number
>    - System Uptime: ticking up
> 3. Each card has a colored icon, trend arrow, and sparkline
> 4. Pull back to show the full page — degradation matrix on the left,
>    throughput timeline chart on the right, live threat feed scrolling at the bottom

> **[VOICEOVER]**
> "The Operations Center ingests live flow data via WebSocket, processes it
> through our detection pipeline, and surfaces structured alerts in real time.
> Throughput is five thousand flows per second sustained, with zero drops.
> Every alert carries a confidence score, severity rating, and the exact
> features that triggered the detection."

> **[ON-SCREEN TEXT — 2 seconds]**
> ```
> PIPELINE
> Ingest → Feature Fabric → Detection Ensemble → Alert Output
> ```

---
### 0:50 — 1:40 · DETECTION SHOWCASE — 6 THREAT TYPES

> **[VISUAL]**
> Click "Live Threats" in the sidebar. The page loads with a filter bar at top
> (All / Critical / High / Medium / Low) and a scrolling alert table.
>
> While narrating, the table fills with new alerts. Each alert row shows:
> - Timestamp (HH:MM:SS)
> - Alert ID (LT-xxxxxxxx)
> - Threat type badge (color-coded)
> - Severity badge (Critical / High / Medium)
> - Source IP, Destination IP, Port
> - Confidence percentage
> - Validity chip (MEASURED / ESTIMATED / MISSING)
>
> **If alerts are already flowing, point to them as they appear.**
> **If not, wait — they generate automatically from the simulator.**

> **[VOICEOVER]**
> "Six threat classes, all detected in real time from passively observed metadata.
>
> One — volumetric DDoS. SYN floods and UDP reflection caught from flow rate
> explosion and source IP entropy. Confidence: ninety-four percent.
>
> Two — C2 beaconing. Regular inter-arrival times with low coefficient of
> variation, even with jitter. The FFT on the IAT sequence locks onto the period.
>
> Three — DGA domains. Shannon entropy above three bits, trigram deviation from
> legitimate distributions. Algorithmically generated names stand out immediately.
>
> Four — DNS tunnelling. Query lengths above fifty characters, hex encoding
> patterns, byte-volume asymmetry between queries and responses.
>
> Five — port scanning. Fan-out ratio across unique destination ports from a
> single source. Sequential probing patterns trigger within seconds.
>
> Six — data exfiltration. Outbound-to-inbound byte ratio anomaly. Under the
> diode, inbound bytes are estimated via ACK-Shadow — and that's where it gets
> interesting."

> **[ON-SCREEN TEXT — 3 seconds]**
> ```
> 6 / 6 THREAT CLASSES DETECTED
> Average confidence: 89%+
> ```

---
### 1:40 — 2:30 · DIODE LAB — THE CORE DIFFERENCE

> **[VISUAL]**
> Click "Diode Lab" in the sidebar. The page loads with:
> 1. A data-flow diagram at top (SVG): Production Network → [Data Diode] →
>    Monitoring Enclave, with animated packets flowing
> 2. The three-mode toggle: **FULL** | **DIODE** | **ACK** — currently on FULL
>    (green highlight)
> 3. The Degradation Matrix table with 6 rows:
>
>    | Threat       | Full | Diode | ACK   | Lost Feature      |
>    |--------------|------|-------|-------|-------------------|
>    | DDoS         | 94%  | 92%   | 93%   | —                 |
>    | C2 Beaconing | 91%  | 73%   | 90%   | Return volume     |
>    | DGA Domains  | 88%  | 85%   | 87%   | —                 |
>    | DNS Tunnel   | 86%  | 85%   | 85%   | —                 |
>    | Port Scan    | 92%  | 84%   | 91%   | RST validation    |
>    | Data Exfil   | 83%  | 0%    | 78%   | Entire return ch  |
>
> 4. Validity chips on each row: MEASURED, ESTIMATED, or MISSING

> **[ACTION — On camera]**
> Click **DIODE** mode. The flow diagram dims the return path. The matrix updates —
> highlight the Data Exfiltration row dropping to 0%. Narrate the loss.
>
> Click **ACK** mode. The return path comes back as a dashed line. Data Exfiltration
> recovers to 78%. Narrate the recovery.

> **[VOICEOVER]**
> "This is what makes EKADHARA different. Every other team will show detection
> on a slide. We show you exactly what the diode costs.
>
> In full-duplex mode, all six threat classes sit above eighty percent.
> Switch to diode-only — the same traffic, forward direction only. DGA and DNS
> tunnelling are barely affected because the queries carry everything we need.
> Port scanning is barely affected because the probes go out.
> But data exfiltration drops to zero — we lost the inbound byte counts.
>
> Now ACK-Shadow. TCP acknowledgement numbers tell us how much the server sent
> back, even though we never saw those packets. Exfiltration recovers to
> seventy-eight percent.
>
> Every feature in our pipeline carries a validity tag — MEASURED, ESTIMATED,
> or MISSING. The models know when they're reasoning about inferred data.
> No silent degradation. No black box."

> **[ON-SCREEN TEXT — 3 seconds]**
> ```
> DIODE MODES
> FULL-DUPLEX → All features observed
> DIODE-ONLY  → Return path blocked, ESTIMATED tags
> ACK-SHADOW  → Partial recovery via TCP ACK inference
> ```

---
### 2:30 — 2:45 · AI ANALYZER — MODEL ARCHITECTURE

> **[VISUAL]**
> Click "AI Analyzer" in the sidebar. Show:
> 1. The model architecture diagram — Isolation Forest + Logistic Regression +
>    rule-based ensemble
> 2. Feature vector breakdown — 15 dimensions listed:
>    bytes_sent, byte_ratio, duration, packets, avg_packet_size,
>    bytes_per_sec, packets_per_sec, port stats, DNS entropy, TLS flags
> 3. Per-class performance table if visible

> Keep this segment tight — 15 seconds max on screen.

> **[VOICEOVER]**
> "Our ML pipeline uses a fifteen-dimensional feature vector per flow, normalized
> and fed to an Isolation Forest for anomaly detection and a multi-class
> classifier for attack-type identification. These sit behind a rule-based
> sliding-window engine that catches rate-based and behavioral patterns.
> The ensemble fuses all three — ML provides sensitivity, rules provide
> specificity, and every alert carries the supporting evidence the problem
> statement requires."

---
### 2:45 — 3:00 · CLOSING — IMPACT

> **[VISUAL]**
> Cut back to the Operations Center dashboard. Full view — KPI cards,
> degradation matrix, throughput chart, live threat feed scrolling.
> Let it run for 3 seconds so the judge sees the system alive.
>
> Then a clean title card (hold 5 seconds):

> ```
> EKADHARA
> AI-Based Detection of Cyber Threats in Unidirectional IP Traffic
>
> PS-26145 · National Technical Research Organisation
> Smart India Hackathon 2026
>
> ┌──────────────────────────────────────────┐
> │ 6 Threat Classes Detected                │
> │ 15-Dimensional Feature Vector            │
> │ 5,000+ flows/sec sustained throughput    │
> │ <50ms P99 detection latency              │
> │ Directionality-aware with validity tags   │
> │ ACK-Shadow reverse-path estimation       │
> │ Egress enforced by kernel seccomp        │
> │ No payload decryption · No return path    │
> └──────────────────────────────────────────┘
> ```

> **[VOICEOVER]**
> "EKADHARA detects six threat classes from unidirectional traffic —
> DDoS, C2 beaconing, DGA domains, DNS tunnelling, TLS anomalies,
> port scanning, and data exfiltration. Five thousand flows per second,
> sub-fifty-millisecond latency, and every feature tagged with its
> measurement validity. The kernel enforces our read-only constraint.
> The degradation matrix tells you exactly what the diode costs.
> This is threat intelligence from the enclave. Thank you."

> **[FADE OUT]**

---
## PRODUCTION NOTES

### What to capture

| Shot | Duration | How |
|---|---|---|
| Egress self-test in terminal | 20s | Full-screen terminal, font 18px+, green/white text |
| Dashboard load (sidebar + KPI cards) | 15s | Browser at 1920×1080, F11 fullscreen |
| Degradation matrix + throughput chart | 10s | Scroll-free, both panels visible |
| Live Threat feed scrolling | 20s | Let alerts flow naturally |
| Diode toggle: Full → Diode → ACK | 25s | Click each mode, hold 3s on each |
| AI Analyzer page | 15s | Architecture diagram + feature list |
| Final title card | 10s | Static, clean typography |

### Recording setup

- **Tool:** OBS Studio or CapCut screen recorder
- **Resolution:** 1920×1080 at 60fps
- **Audio:** Record voiceover separately in Audacity or your phone
  (a laptop mic in a quiet room is fine — clarity matters more than quality)
- **Pacing:** Read at ~140 WPM. Pause 0.5s between sections.
- **No music.** This is a technical submission — voiceover only.

### Voiceover script (word-for-word)

Practice this out loud. It should take about 2:45 with natural pacing.

> "Critical infrastructure networks are monitored through hardware data diodes —
> unidirectional optical links that copy traffic into a secure enclave, but
> physically prevent anything from coming back. No return path. No probes.
> No handshakes. The problem statement asks for a detection system that works
> under exactly these constraints. We built it.
>
> The Operations Center ingests live flow data via WebSocket, processes it
> through our detection pipeline, and surfaces structured alerts in real time.
> Throughput is five thousand flows per second sustained, with zero drops.
> Every alert carries a confidence score, severity rating, and the exact
> features that triggered the detection.
>
> Six threat classes, all detected in real time from passively observed metadata.
> One — volumetric DDoS. SYN floods and UDP reflection caught from flow rate
> explosion and source IP entropy. Confidence: ninety-four percent.
> Two — C2 beaconing. Regular inter-arrival times with low coefficient of
> variation, even with jitter. The FFT on the IAT sequence locks onto the period.
> Three — DGA domains. Shannon entropy above three bits, trigram deviation from
> legitimate distributions. Algorithmically generated names stand out immediately.
> Four — DNS tunnelling. Query lengths above fifty characters, hex encoding
> patterns, byte-volume asymmetry.
> Five — port scanning. Fan-out ratio across unique destination ports.
> Six — data exfiltration. Outbound-to-inbound byte ratio anomaly. Under the
> diode, inbound bytes are estimated via ACK-Shadow — and that's where it
> gets interesting.
>
> This is what makes EKADHARA different. Every other team will show detection
> on a slide. We show you exactly what the diode costs. In full-duplex mode,
> all six threat classes sit above eighty percent. Switch to diode-only — the
> same traffic, forward direction only. DGA and DNS tunnelling barely affected.
> Port scanning barely affected. But data exfiltration drops to zero — we lost
> the inbound byte counts. Now ACK-Shadow. TCP acknowledgement numbers tell us
> how much the server sent back, even though we never saw those packets.
> Exfiltration recovers to seventy-eight percent. Every feature carries a
> validity tag — MEASURED, ESTIMATED, or MISSING. The models know when they're
> reasoning about inferred data. No silent degradation.
>
> Our ML pipeline uses a fifteen-dimensional feature vector per flow, normalized
> and fed to an Isolation Forest for anomaly detection and a multi-class
> classifier for attack-type identification, behind a rule-based sliding-window
> engine. The ensemble fuses all three.
>
> EKADHARA detects six threat classes from unidirectional traffic — DDoS, C2
> beaconing, DGA domains, DNS tunnelling, TLS anomalies, port scanning, and
> data exfiltration. Five thousand flows per second, sub-fifty-millisecond
> latency, and every feature tagged with its measurement validity. The kernel
> enforces our read-only constraint. The degradation matrix tells you exactly
> what the diode costs. This is threat intelligence from the enclave.
> Thank you."

### Post-production checklist

- [ ] Cut dead air at start and end (first and last 2 seconds)
- [ ] Add subtle zoom on alert cards when new threats appear
- [ ] Green text flash for the terminal segment
- [ ] Clean cuts only — no fade transitions longer than 0.3s
- [ ] End frame holds for 3 seconds on the final card
- [ ] Export as MP4 (H.264, 1080p, <50MB for SIH upload)
- [ ] Add subtitles if the platform requires them (NTRO SIH usually does)
