# WATCHTOWER — Demo Video Script
**Smart India Hackathon 2026 | PS-26145 | NTRO**
**Duration: 3:00 | Format: 1080p 60fps**

---

## PRE-PRODUCTION SETUP

**Hardware:**
- Docker host laptop (16GB+ RAM, Docker Desktop)
- Windows attack PC (separate machine on same LAN)
- USB microphone
- OBS Studio on Docker host

**Software:**
- Docker Desktop running
- WATCHTOWER containers: `docker compose up -d`
- PowerShell 7 on Windows PC with `attack-trigger.ps1`
- Browser at `http://localhost:3000`

---

## ACT 1: THE PROBLEM (0:00 – 0:30)

**0:00** — BLACK SCREEN. Hex data scrolls upward like matrix rain. Packet counter ticks: `PKT/s: 10,247`.

> Voiceover: "Every second, ten thousand packets cross your network gateway. You can see them all. But you can never touch them."

**0:10** — Data diode diagram: physical device, one-way arrow, red X on reverse path. Labels: INGRESS YES / EGRESS BLOCKED.

> "Critical infrastructure operators use physical data diodes. One-way. Read-only. No probes. No handshakes. No going back."

**0:20** — Text appears: "But the enclave can see everything — and do nothing." Red X pulses.

> "The monitoring enclave can see everything crossing the link. And do absolutely nothing about it."

**0:28** — Beat of silence. PS-26145 slams in white on black.

> "This is Smart India Hackathon Problem Statement 26145."

**TRANSITION:** Terminal types `docker compose up -d` — containers spin up — WATCHTOWER dashboard materializes.

---

## ACT 2: THE SYSTEM (0:30 – 0:55)

**0:30** — Docker terminal spinning up containers. Browser opens to localhost:3000. Dashboard materializes with glitch effect. HUD shows: STATUS LIVE, ALERTS 0, THROUGHPUT 0/s.

> "We built WATCHTOWER. A containerized AI detection platform that operates entirely inside a read-only enclave."

**0:38** — Camera pans across dashboard: sidebar with 6 nav items, KPI row, pipeline diagram (4 stages), enclave constraints panel (COMPLIANT).

> "Six threat classes. Real-time streaming. Zero decryption. Zero return path. Pure passive observation."

**0:46** — Close-up on enclave constraints panel. Green checkmarks on each row: READ-ONLY, JA3/JA4 metadata only, Decryption disabled.

> "Every architectural constraint is enforced and verified. This isn't design fiction. It's how it actually runs."

**0:52** — Full dashboard. HUD updates: ALERTS 47, THROUGHPUT 12/s.

> "But here's the thing. It's quiet right now. Too quiet. Let's change that."

**TRANSITION:** Split screen — LEFT: Windows attack terminal, RIGHT: WATCHTOWER dashboard.

---

## ACT 3: THE KILL CHAIN (0:55 – 2:00)

### PHASE 1: RECONNAISSANCE (0:55 – 1:05)

**LEFT:** PowerShell: `.\attack-trigger.ps1` then `Start-PortScan`. Terminal shows port scan 1-1024 against target.
**RIGHT:** Network Map page lights up. RED dots appear across the topology. Alert fires: PORT SCAN DETECTED — 847 ports probed, 94% confidence.

> "Phase one: reconnaissance. Every port probed is a signal. WATCHTOWER sees the fan-out pattern immediately."

### PHASE 2: C2 BEACONING (1:05 – 1:15)

**LEFT:** `Start-C2Beacon -IntervalSec 5`. PowerShell shows periodic GET requests every 5 seconds.
**RIGHT:** Live Threats page: C2 BEACONING alert. Graph shows regular pulses. Mean IAT 5.1s, std 0.3s, CV 0.06.

> "Phase two: command and control. The infected host phones home every five seconds. The regularity IS the signature."

### PHASE 3: DGA DOMAINS (1:15 – 1:22)

**LEFT:** `Start-DgaBurst -DomainCount 100`. Terminal floods with random subdomain lookups.
**RIGHT:** DNS analytics spike. DGA DOMAIN DETECTED. Entropy meter maxes out.

> "Phase three: domain generation. High character entropy and unusual n-gram patterns give it away."

### PHASE 4: DNS TUNNELING (1:22 – 1:30)

**LEFT:** `Start-DnsTunnel -DataSizeKB 100`. DNS TXT record bursts.
**RIGHT:** Alert: DNS TUNNELING — queries averaging 180 characters. 47 tunnel events in 30 seconds.

> "Phase four: exfiltration through DNS. 100KB of data encoded into domain queries. The exfil channel is visible."

### PHASE 5: DATA EXFILTRATION (1:30 – 1:38)

**LEFT:** `Start-DataExfil -SizeMB 20`. Large POST requests stream out.
**RIGHT:** Alert: DATA EXFILTRATION. Outbound/inbound ratio 47:1. CRITICAL.

> "Phase five: direct exfiltration. Twenty megabytes. The byte ratio screams."

### PHASE 6: VOLUMETRIC DDOS (1:38 – 1:50)

**LEFT:** `Start-SynFlood -Intensity high` AND `Start-UdpFlood -Intensity high`. Two terminals running simultaneously. Packet counter explodes.
**RIGHT:** Dashboard erupts. Throughput spikes past 10K/s. HUD: ALERTS 3,847. CRITICAL alerts flood the feed. Detection Rate: 98.3%.

> "Phase six: volumetric DDoS. SYN floods and UDP amplification. Ten thousand packets per second. 98.3% detection. Under two percent false positives."

---

## ACT 4: THE DEEP DIVE (1:50 – 2:30)

Full-screen dashboard navigation. Camera clicks through each page.

| TIME | PAGE | SHOW THIS | SAY THIS |
|------|------|-----------|----------|
| 1:50 | Dashboard | KPI sweep: 1.2M flows, 3,847 threats, 1,840 sessions, 98.3% detection, 1.2% FP | "After the kill chain: over three thousand threats. Sub-second latency." |
| 1:58 | Live Threats | Auto-scrolling feed, severity filters, IP search | "Every alert is structured JSON. Timestamp, flow ID, threat class, confidence, evidence." |
| 2:04 | Network Map | 21 nodes, 20 edges, red attack paths, enclave pulsing | "Every node, every edge, every attack path. Enclave sees everything, touches nothing." |
| 2:10 | Analytics | Severity donut, 30-min timeline, protocol bars | "Severity distribution, protocol breakdown, attack timeline. All from passive observation." |
| 2:16 | AI Analyzer | 7 models, 2.6M samples, 10K pred/sec, 93.4% accuracy, 12ms p99 | "Seven threat-specific models. 93.4% accuracy. 10,000 predictions per second. 12ms latency." |
| 2:22 | Attack Panel | 6 attack cards, kill chain button, live detection monitor | "Six attack vectors. One platform. Real detection." |

---

## ACT 5: THE CLOSE (2:30 – 3:00)

**2:30** — Egress self-test terminal: `curl google.com` → BLOCKED. `connect 8.8.8.8` → BLOCKED.

> "The most important test: egress. The enclave cannot initiate outbound connections. Period."

**2:38** — Docker terminal: `docker compose ps`. All services healthy.

> "Containerized. Isolated. Deploy anywhere."

**2:45** — Terminal: `docker compose down`. Containers stop.

> "Shut it down. Zero trace on the host."

**2:50** — Black screen. Three lines fade in:

> PS-26145
> NTRO · Smart India Hackathon 2026
> WATCHTOWER — See everything. Touch nothing.

**2:58** — WATCHTOWER logo on dark background. Cyan accent sweeps across.

**FADE TO BLACK. END.**

---

## EXECUTION CHECKLIST

### Before Recording
- [ ] Docker Desktop installed and running
- [ ] Windows attack PC has PowerShell 7 + attack-trigger.ps1
- [ ] Both machines on same LAN
- [ ] Browser at localhost:3000
- [ ] OBS at 1080p 60fps
- [ ] Docker images built: `docker compose build`
- [ ] Full kill chain tested — ~90 seconds

### Recording Day
1. `cd docker && docker compose up -d`
2. Wait for health checks
3. Open browser, verify LIVE + data flowing
4. Start OBS recording
5. Run attack-killchain.ps1 on Windows PC
6. Narrate live
7. Navigate dashboard pages
8. Stop recording
9. Save as `WATCHTOWER_Demo_SIH26.mp4`

### Post-Production
- [ ] Add intro title card
- [ ] Sync narration
- [ ] Add threat-type text overlays
- [ ] Split-screen at 0:55
- [ ] Color grade (dark, cyan contrast)
- [ ] Export 1080p H.264, under 100MB
- [ ] Upload YouTube (unlisted)
- [ ] Submit
