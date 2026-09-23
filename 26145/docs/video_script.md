# EKADHARA — 3-Minute Video Prototype Script
**PS-26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**
**NTRO · SIH 2026**

---

## Shot List

| # | Shot | Duration | Visual |
|---|------|----------|--------|
| 1 | Dashboard Tour | 0:00–1:30 | Live dashboard screen recording — Operations Center → Live Threats → Network Map → Attack Console |
| 2 | Detection Demo | 1:30–2:15 | Launch attacks from Attack Console, watch detections appear live |
| 3 | Results & Closing | 2:15–3:00 | Throughput timeline, threat stats, detection coverage, closing statement |

---

## Detailed Script

### SHOT 1: Dashboard Tour (0:00–1:30)

**[Visual: Browser opens directly to `sih26145.udayps.com` — no intro, no diagrams]**

**[Page loads — Operations Center is visible immediately]**

**Narration:**
"EKADHARA is an AI-based threat detection system built for unidirectional network monitoring. Here's the Operations Center — the main dashboard."

**[Point to KPI cards at the top]**
"Real-time KPI cards show active connections, threats blocked, total flows processed, throughput, and threat alerts. All updating live."

**[Scroll down to degradation matrix / threat table]**
"The threat matrix shows detection performance across attack types — DDoS, C2 beaconing, DNS tunneling, port scanning, and more. Each row shows full-duplex confidence, diode-only confidence, and validity status."

**[Navigate to: Live Threats — click sidebar link]**

**Narration:**
"The Live Threat Feed. Every detected alert appears here in real-time — threat class, source and destination IPs, ports, confidence score, and validity."

**[Scroll through alerts — point to a critical one]**
"Each alert is timestamped and tagged with severity. Critical threats are flagged immediately."

**[Navigate to: Network Map]**

**Narration:**
"The Network Map visualizes traffic topology — source-destination pairs, protocol distribution, and attack concentration across the monitored network."

**[Navigate to: Attack Console]**

**Narration:**
"And here's the Attack Console — where operators can generate controlled attack traffic to test the detection pipeline."

**[Point to the preset buttons]**
"One-click presets like DDoS Storm, C2 Channel, and Full Assault cover common attack scenarios. Or configure a single attack manually."

---

### SHOT 2: Detection Demo (1:30–2:15)

**[Visual: Still on Attack Console page]**

**Narration:**
"Let me demonstrate. I'll launch a SYN flood attack."

**[Click "DDoS Storm" preset — or click Launch on a single SYN Flood]**

**[Wait for alerts to appear — then switch to Live Threats tab]**

**Narration:**
"Within seconds, the detection pipeline identifies the attack. Here we see multiple DDoS alerts — each with source IP, destination port, confidence over 90 percent, and severity marked critical."

**[Point to a specific alert — highlight confidence score and severity]**

**[Switch back to Operations Center]**

**Narration:**
"Back on the Operations Center, the KPI cards have updated. Threats blocked count has increased. The degradation matrix reflects the new detections."

**[Point to throughput timeline if visible]**
"Throughput is climbing as attack traffic flows through the detection pipeline."

---

### SHOT 3: Results & Closing (2:15–3:00)

**[Visual: Operations Center — full view with populated data]**

**Narration:**
"EKADHARA processes thousands of flows per second. Every threat is classified, scored, and surfaced in real-time — DDoS, C2 beaconing, DNS tunneling, DGA domains, port scans, and data exfiltration. All from passive observation only."

**[Point to detection coverage section on Attack Console or stats]**
"Detection coverage spans volumetric DDoS, C2 beaconing, DNS threats, TLS anomalies, reconnaissance, and data exfiltration."

**[Visual: EKADHARA logo/brand mark appears briefly]**

**Narration:**
"EKADHARA. Protecting critical infrastructure through intelligent, passive threat detection. No decryption. No return path. Just detection."

**[Text on screen: EKADHARA · PS-26145 · NTRO · SIH 2026]**

---

## Production Notes

1. **Screen recording**: Use OBS Studio at 1920x1080, 30fps
2. **Theme**: Keep dark mode throughout for consistency
3. **Pre-load data**: Before recording, hit reset then launch attacks for 15 seconds so dashboard is alive but not cluttered
4. **Browser**: Chrome, zoom 100%, no extensions visible
5. **Narration**: Record in a quiet environment with a good microphone. Pace at ~150 words/minute
6. **Music**: Subtle ambient electronic track underneath at -20dB
7. **Transitions**: Simple cuts between pages. No flashy effects — this is a technical demo

## Pre-Recording Checklist

- [ ] **Reset dashboard**: Visit `POST https://sih26145.udayps.com/api/reset` — clears all flows/alerts for a clean slate
- [ ] Wait 5 seconds, then launch attacks: Attack Lab → click "DDoS Storm" preset
- [ ] Let simulator run for 15 seconds to populate the dashboard naturally
- [ ] Open browser to `sih26145.udayps.com` — Operations Center should show live data
- [ ] Navigate through pages: Operations → Live Threats → Network Map → Attack Console
- [ ] Theme set to dark mode (default)
- [ ] Browser cache cleared
- [ ] Desktop notifications disabled
- [ ] Recording software ready (OBS at 1920x1080, 30fps)
- [ ] Microphone tested

## Demo Flow (for recording)

1. Open `sih26145.udayps.com` — starts at Operations Center with live data
2. Scroll through KPI cards, point out the threat matrix
3. Navigate to **Live Threats** — scroll through alerts, highlight a critical one
4. Navigate to **Network Map** — show traffic visualization
5. Navigate to **Attack Console** — point out the preset buttons
6. Click **DDoS Storm** preset — watch the alert
7. Switch to **Live Threats** — show new alerts appearing in real-time
8. Close with Operations Center full view + narration

## Reset URL

- **Live**: `POST https://sih26145.udayps.com/api/reset` — use this before recording to clear everything for a fresh start
