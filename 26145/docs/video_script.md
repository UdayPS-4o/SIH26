# EKADHARA — Video Scripts
**PS-26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**
**NTRO · SIH 2026**

---

## SCRIPT 1: Visual Action Script

| Time | Screen | Action |
|------|--------|--------|
| 0:00 | Browser → `sih26145.udayps.com` | Operations Center loads. Dark theme. LIVE badge pulsing green. |
| 0:08 | Operations Center | Pan slowly across all 5 KPI cards: Active Connections, Threats Blocked, Total Flows, Throughput, Threat Alerts |
| 0:20 | Operations Center | Scroll down to the threat degradation matrix. Point to column headers: FULL-DUPLEX, DIODE-ONLY, ACK-SHADOW, FEATURES LOST, VALIDITY, SEV |
| 0:28 | Operations Center | Scroll through threat rows: ZAP DDOS (94%, CRITICAL), C2 BEACONING (91%, HIGH), DGA DOMAINS (88%, HIGH), DNS TUNNELING (86%, HIGH), PORT SCAN (92%, MEDIUM) |
| 0:38 | → click "Live Threats" | **Blank page** — empty state. "No threats detected yet." Let it breathe for 3 seconds. |
| 0:44 | → click "Network" | Network Map loads. Animated nodes and edges. Traffic topology with protocol distribution. |
| 0:52 | Network Map | Pan across the map. Show source-destination pairs, connection lines, protocol colors. |
| 0:58 | → click "Materials" | Materials page. Threat ingestion pipeline header. Progress bar: 40/40 processed. |
| 1:04 | Materials | Scroll through malware samples table. Point to Emotet-v2 row: confidence 92%, status APPROVED, source Hybrid-Analysis. Scroll down to show SHA-256 hash, description, activity signature. |
| 1:18 | → click "AI Analyzer" | AI Analyzer loads. Model confidence distributions. Threat type breakdown charts. |
| 1:24 | AI Analyzer | Point to confidence bars, detection accuracy metrics. Show how the ensemble model scores each threat class. |
| 1:30 | → click "Diode Lab" | Diode Lab. Air-gap integrity verification panel. |
| 1:34 | Diode Lab | Point to status indicators: NO RETURN PATH (green), PASSIVE ONLY (green), DECRYPTION: NONE (green). Enclave is verified. |
| 1:40 | → click "Attack Lab" | Attack Console. Four status cards at top. Preset buttons below. |
| 1:44 | Attack Console | Point to presets: DDoS Storm, C2 Channel, Full Assault, Stealth Exfil, Recon + Infiltrate. |
| 1:48 | Attack Console | Click "DDoS Storm". Button highlights. "Starting DDoS Storm simulator..." message appears. |
| 1:52 | Attack Console | Simulator active. Red border pulse. Tags show: syn_flood + udp_flood. |
| 1:56 | → click "Live Threats" | **Alerts flooding in.** Scroll down to show multiple fresh alerts. DDoS alerts with confidence 90%+. |
| 2:04 | Live Threats | Point to a CRITICAL severity alert. Show threat type, src IP, dst port, confidence score. |
| 2:10 | → click "Network" | Network Map. New red attack edges appearing on the topology. Real-time update. |
| 2:16 | Network Map | Point to a fresh red edge — that's the SYN flood traffic showing up live. |
| 2:20 | → click "Operations" | Operations Center. KPIs have all increased. Threat matrix shows updated detection rates. |
| 2:28 | Operations Center | Full view. Narrate closing statement over live dashboard. EKADHARA logo animates in. |
| 2:38 | End card | "EKADHARA · PS-26145 · NTRO · SIH 2026" |

---

## SCRIPT 2: Word-for-Word Narration (Subtitles)

```
[0:00]
EKADHARA is an AI-based threat detection system
built for unidirectional network monitoring.

[0:08]
Here's the Operations Center —
the main dashboard.

[0:12]
Real-time KPI cards show active connections,
threats blocked, total flows processed, throughput,
and threat alerts — all updating live.

[0:22]
The threat matrix below shows detection performance
across six attack types.
Each row shows full-duplex confidence,
diode-only confidence, ack-shadow coverage,
and validity status.

[0:32]
DDoS detection at 94 percent, critical severity.
C2 beaconing at 91 percent, high severity.
DGA domains, DNS tunneling, port scan —
all tracked with measured confidence scores.

[0:42]
Let's check the Live Threat Feed.
Right now, the feed is clean —
no threats detected yet.
This is what the dashboard looks like at rest.

[0:50]
The Network Map visualizes traffic topology —
source-destination pairs, protocol distribution,
and attack concentration across the monitored network.

[0:58]
The Materials page shows the threat ingestion pipeline.
Malware samples are processed and enriched —
Emotet, TrickBot, QakBot —
each with a SHA-256 hash, classification,
and confidence score from VirusTotal and AbuseIPDB.

[1:08]
The AI Analyzer shows model confidence distributions
and threat type breakdowns across the pipeline.
Stacking ensemble of Random Forest, XGBoost,
and deep neural network —
trained on CIC-IDS2017 with synthetic attack augmentation.

[1:18]
The Diode Lab confirms the enclave's air-gap integrity.
No return path. No decryption. Read-only monitoring.
The enclave is verified and operational.

[1:26]
And here's the Attack Console —
where operators generate controlled attack traffic
to test the detection pipeline.

[1:30]
One-click presets like DDoS Storm
simulate real attack traffic.
All attacks target localhost by default.

[1:36]
Launching a SYN flood now.

[1:40]
Switching back to Live Threats —
alerts are already appearing.

[1:44]
Each alert shows threat class, source IP,
destination port, confidence over 90 percent,
and severity marked critical.

[1:52]
The Network Map picks it up too —
new attack edges on the topology in real-time.
Red edges indicate active threat traffic.

[1:58]
And on Operations Center,
the KPIs have updated.
Threats blocked count has increased.
The degradation matrix reflects the new detections.

[2:06]
EKADHARA processes thousands of flows per second.
Every threat is classified, scored, and surfaced live —
DDoS, C2 beaconing, DNS tunneling, DGA domains,
port scans, and data exfiltration.
All from passive observation only.

[2:22]
EKADHARA.
Protecting critical infrastructure through
intelligent, passive threat detection.
No decryption. No return path. Just detection.

[2:32]
EKADHARA.
PS-26145 · NTRO · SIH 2026.
```
