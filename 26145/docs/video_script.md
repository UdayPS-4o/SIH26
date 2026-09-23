# EKADHARA — Video Scripts
**PS-26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**
**NTRO · SIH 2026**

---

## SCRIPT 1: Visual Action Script
*(What appears on screen, what you click, what the viewer sees)*

| Time | Screen | Action |
|------|--------|--------|
| 0:00 | Browser opens to `sih26145.udayps.com` | Operations Center. Dark theme. LIVE badge pulsing. |
| 0:05 | Operations Center | Pan across KPI cards: Active Connections, Threats Blocked, Total Flows, Throughput, Threat Alerts |
| 0:12 | Operations Center | Scroll down to threat matrix table |
| 0:18 | Operations Center | Scroll through rows: ZAP DDOS (94%), RADIO C2 BEACONING (91%), GLOBE DGA DOMAINS (88%), SERVER DNS TUNNELING (86%), SEARCH PORT SCAN (92%) |
| 0:25 | Operations Center → click "Live Threats" | Live Threats page opens. **Empty state** — "No threats detected yet" message visible. This is the blank slate. |
| 0:30 | Live Threats | Point to the empty state. "The feed is clean — no threats detected yet." |
| 0:35 | Live Threats → click "Attack Lab" | Attack Console loads. Status cards: Backend ONLINE, WebSocket CONNECTED, Flows Processed, Alerts Generated. |
| 0:40 | Attack Console | Point to preset buttons: DDoS Storm, C2 Channel, Full Assault, Stealth Exfil, Recon + Infiltrate. |
| 0:45 | Attack Console → click "DDoS Storm" | Preset highlights. "Starting DDoS Storm..." message. Simulator activates. |
| 0:50 | Attack Console | Show simulator active state — red border, attack type tags: syn_flood + udp_flood. |
| 0:55 | Attack Console → click "Live Threats" | Switch to Live Threats. **Alerts are now appearing** — scroll to show fresh DDoS alerts. |
| 1:00 | Live Threats | Point to a newly arrived alert. Confidence score visible. Severity: CRITICAL. |
| 1:05 | Live Threats → click "Network" | Network Map updates. New attack edges appearing on the topology in real-time. |
| 1:10 | Network Map | Point to a new red edge — that's the attack traffic showing up live. |
| 1:15 | Network Map → click "Operations" | Operations Center. KPI numbers have increased. Threat matrix updated with new detections. |
| 1:25 | Operations Center (full view) | Full dashboard. Narrate closing statement. EKADHARA logo appears. |
| 1:35 | End card | "EKADHARA · PS-26145 · NTRO · SIH 2026" |

---

## SCRIPT 2: Word-for-Word Narration (Subtitles)
*(Read this exactly as written for audio recording)*

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
where operators generate controlled attack traffic
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
