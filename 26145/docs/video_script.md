# EKADHARA — Video Scripts
**PS-26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**
**NTRO · SIH 2026**

---

## SCRIPT 1: Visual Action Script
*(What appears on screen, what you click, what the viewer sees)*

| Time | Screen | Action / Narration cue |
|------|--------|------------------------|
| 0:00 | Browser opens to `sih26145.udayps.com` | Operations Center loads. Dark theme. "LIVE" badge pulsing green top-left. |
| 0:05 | Operations Center | Pan across KPI cards: Active Connections (318), Threats Blocked (755), Total Flows (6,377), Throughput (0/s), Threat Alerts (7,439) |
| 0:15 | Operations Center | Point to the DEGRADATION WARNING banner. Then scroll down to threat matrix table. |
| 0:25 | Operations Center | Scroll down through table rows: ZAP DDOS (94%), RADIO C2 BEACONING (91%), GLOBE DGA DOMAINS (88%), SERVER DNS TUNNELING (86%), SEARCH PORT SCAN (92%) |
| 0:35 | Operations Center → click "Live Threats" in sidebar | Page transitions. Live Threats feed loads with alert cards. |
| 0:40 | Live Threats | Scroll through alerts. Point to a CRITICAL severity alert — show threat type, src IP, dst IP, confidence score, validity badge. |
| 0:50 | Live Threats → click "Network" in sidebar | Network Map loads. Nodes and edges visible. Traffic topology. |
| 0:55 | Network Map | Brief pan across the map. Show src-dst pairs, protocol distribution. |
| 1:00 | Network Map → click "Attack Lab" in sidebar | Attack Console loads. Status cards at top: Backend ONLINE, WebSocket CONNECTED, Flows Processed, Alerts Generated. |
| 1:05 | Attack Console | Point to preset buttons: DDoS Storm, C2 Channel, Full Assault, Stealth Exfil, Recon + Infiltrate. |
| 1:10 | Attack Console → click "DDoS Storm" preset | Button highlights. "Starting DDoS Storm simulator..." message appears. Wait 5 seconds. |
| 1:15 | Attack Console | Point to the simulator active state — red border, attack type tags showing syn_flood + udp_flood. |
| 1:20 | Attack Console → click "Live Threats" in sidebar | Switch to Live Threats. New alerts are appearing — scroll to show fresh DDoS alerts. |
| 1:25 | Live Threats | Point to a newly arrived alert. Show confidence score climbing. |
| 1:30 | Live Threats → click "Operations" in sidebar | Back to Operations Center. KPI numbers have increased. Threat matrix updated. |
| 1:40 | Operations Center (full view) | Full dashboard visible. Narrate closing statement over the live dashboard. EKADHARA logo/brand appears. |
| 1:50 | End card | Text: "EKADHARA · PS-26145 · NTRO · SIH 2026" |

---

## SCRIPT 2: Word-for-Word Narration (Subtitles)
*(Read this exactly as written for audio recording. Each line is a subtitle segment.)

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
The threat matrix shows detection performance
across attack types —
DDoS, C2 beaconing, DNS tunneling, port scanning,
and more.

[0:30]
Each row shows full-duplex confidence,
diode-only confidence, and validity status.

[0:36]
Let's look at the Live Threat Feed.

[0:40]
Every detected alert appears here in real-time —
threat class, source and destination IPs,
ports, confidence score, and validity.

[0:48]
Each alert is timestamped and tagged with severity.
Critical threats are flagged immediately.

[0:54]
The Network Map visualizes traffic topology —
source-destination pairs, protocol distribution,
and attack concentration.

[1:01]
And here's the Attack Console —
where operators can generate controlled attack traffic
to test the detection pipeline.

[1:08]
One-click presets like DDoS Storm, C2 Channel,
and Full Assault cover common attack scenarios.

[1:14]
Let me demonstrate.
I'll launch a SYN flood attack.

[1:20]
Within seconds, the detection pipeline
identifies the attack.

[1:24]
Here we see multiple DDoS alerts —
each with source IP, destination port,
confidence over 90 percent,
and severity marked critical.

[1:32]
Back on the Operations Center,
the KPI cards have updated.
Threats blocked count has increased.
The degradation matrix reflects the new detections.

[1:40]
EKADHARA processes thousands of flows per second.
Every threat is classified, scored, and surfaced
in real-time —
DDoS, C2 beaconing, DNS tunneling,
DGA domains, port scans, and data exfiltration.
All from passive observation only.

[1:52]
EKADHARA.
Protecting critical infrastructure through
intelligent, passive threat detection.
No decryption. No return path. Just detection.

[1:58]
EKADHARA.
PS-26145. NTRO. SIH 2026.
```
