# EKADHARA PS-26145 — SIH Video Script
**Total duration:** 2 min 45 sec — 3 min 00 sec
**Format:** Screen recording only. No animation. No diagrams. No stock footage.
**Setup:**
- Laptop screen recorded at 1080p, 30fps minimum
- Two windows arranged on screen: terminal (left) + Chrome (right)
- Chrome open to `https://sih26145.udayps.com` before recording starts
- Chrome DevTools closed. Address bar visible.
- Terminal open in the project folder: `C:\Users\udayp\Documents\code\SIH26\26145\scripts\`
- Font size: terminal 14pt minimum, Chrome 100% zoom
- Microphone recording voiceover simultaneously (or record voiceover in post)

---

## HOW TO USE THIS SCRIPT

Each block has three columns:
- **TIME** — when this action/speech happens
- **YOUR HANDS** — exact mouse action, what to click, what to type
- **YOUR MOUTH** — exact word-for-word script to speak

Read the whole thing once before filming. Then do it in one continuous take. If you mess up, stop, take a breath, and repeat from the last good point.

---

## PART 1 — OPENING: THE PROBLEM (0:00–0:30)

### Block 1 (0:00–0:10)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:00 | **Do nothing.** Let the screen sit for 1 second, black. Then click the terminal window to focus it. | *(silence — let the screen breathe)* |
| 0:02 | In terminal, type: `cd C:\Users\udayp\Documents\code\SIH26\26145\scripts` then press Enter. | "Critical infrastructure operators — power grids, telecom, defense facilities — monitor their network links using hardware data diodes." |
| 0:06 | Type: `dir` then Enter. | "A data diode is a one-way valve. Traffic can flow in, but nothing can ever flow back out." |
| 0:09 | Mouse over `demo_showcase.bat` in the file listing. Don't click yet. | "The monitoring enclave sees every packet crossing the link. But it has no physical or protocol-level path back into the production network." |

### Block 2 (0:10–0:25)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:10 | **Double-click `demo_showcase.bat`.** The terminal window will clear and show the EKADHARA banner. | "This is a deliberate security design. It removes an entire class of attack where a compromised monitoring system becomes a pivot into the core network." |
| 0:14 | **Do nothing.** Watch the pre-flight checks run. Let the terminal output scroll. | "But the trade-off is significant. Any intelligence layer in that enclave must work purely from what it can passively observe." |
| 0:18 | **Do nothing.** Watch lines: `[1/4] Verifying HTTPS connectivity... Status: 200 OK` then `[2/4] Checking attack controller status... [OK]`. | "No probes. No handshakes. No ability to send a mitigation command back across the diode." |
| 0:22 | **Do nothing.** Watch `[3/4] Security posture — DATA DIODE ENFORCED`. | "So the question becomes: how do you detect cyber threats when your sensor can never touch the attacker?" |
| 0:25 | **Do nothing.** Let `[4/4] ML Models loaded` lines appear. | "That is the problem EKADHARA solves." |

---

## PART 2 — THE PROBLEM STATEMENT (0:30–0:55)

### Block 3 (0:30–0:40)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:30 | **Do nothing.** The terminal is now showing the Phase 2 header: `[*] Phase 2 — Injecting detection alerts...` | "EKADHARA is an AI-based threat detection system designed specifically for unidirectional IP traffic." |
| 0:33 | **Do nothing.** | "It assumes a read-only ingest path. No return channel. No payload decryption. No ability to complete a handshake." |
| 0:36 | **Do nothing.** | "It processes traffic incrementally — streaming, not batch — and raises alerts with bounded latency." |

### Block 4 (0:40–0:55)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:40 | **Do nothing.** The first alert line appears: `[>>] Injecting SYN Flood DDoS [CRITICAL] alert...` | "The system detects six threat classes:" |
| 0:43 | **Do nothing.** Watch `[OK] Alert injected & broadcast to dashboard.` appear. | "Volumetric DDoS — SYN floods, UDP floods, spoofed-source floods — identified from flow-level rate and source IP entropy statistics." |
| 0:47 | **Do nothing.** Second alert line appears: `[>>] Injecting UDP Flood DDoS [CRITICAL] alert...` | "Botnet C2 beaconing — detected from periodicity and inter-arrival analysis on flows that repeat at regular intervals." |
| 0:50 | **Do nothing.** Watch it complete with `[OK]`. | "DNS-based threats — DGA domains and DNS tunneling — caught through entropy analysis of query names and record-type anomalies." |
| 0:53 | **Do nothing.** | "TLS anomalies — JA3 and JA4 fingerprint analysis without ever decrypting payload." |

---

## PART 3 — ATTACKS INJECTING, TERMINAL (0:55–1:15)

### Block 5 (0:55–1:05)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:55 | **Do nothing.** Third alert: `[>>] Injecting C2 Beaconing [HIGH] alert...` | "Reconnaissance — port scanning detected from fan-out patterns of a single source across many destination ports." |
| 0:58 | **Do nothing.** Fourth alert: `[>>] Injecting DNS Tunneling [HIGH] alert...` | "And data exfiltration — caught from asymmetric flow-volume anomalies and unusual outbound-to-inbound byte ratios." |
| 1:01 | **Do nothing.** Fifth alert: `[>>] Injecting Port Scan Reconnaissance [MEDIUM] alert...` | "Each of these detections runs purely on passively observed data. No active probing. No return path." |
| 1:04 | **Do nothing.** Sixth and final alert: `[>>] Injecting Data Exfiltration [CRITICAL] alert...` | "This is the enclave constraint made explicit in every design decision." |

### Block 6 (1:05–1:15)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:05 | **Do nothing.** Watch `[OK] Alert injected & broadcast to dashboard.` appear for the sixth time. | "Watch the terminal. Each line is a real HTTP call to the detection engine. The backend evaluates flow features, runs the ML ensemble, and pushes alerts to every connected dashboard." |
| 1:09 | **Do nothing.** Watch `[*] Phase 3 — Detection Summary` appear, then the table starts building. | "Six attack classes. Six alerts. All injected in under fifteen seconds." |
| 1:12 | **Do nothing.** Let the summary table fully render. Point your mouse cursor at the first table row (`SYN Flood DDoS | CRITICAL | 0.96 | MEASURED`) but don't click. | "Now let me show you what this looks like on the dashboard." |

---

## PART 4 — SWITCH TO DASHBOARD (1:15–1:30)

### Block 7 (1:15–1:30)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:15 | **Click the Chrome window** to bring it to the front. The dashboard at `sih26145.udayps.com` should be open on the Operations Center tab. | "The dashboard is already open in the browser. All six alerts from the terminal are now visible here in real time." |
| 1:18 | **Do nothing** for 2 seconds. Let the user see the dashboard. | "This is the EKADHARA Operations Center. Top bar shows the live connection status — green dot means the WebSocket is connected and streaming." |
| 1:22 | **Scroll down** slowly to reveal the Live Threat Feed at the bottom of the Operations page. | "The KPI cards up top show active connections, threats blocked, total flows processed, and current throughput." |
| 1:26 | **Scroll down more** to show the Threat Feed populated with alert cards. | "The Live Threat Feed at the bottom is where detections appear in real time." |
| 1:29 | **Scroll back up** to the top of the Operations page. | "Each alert card shows the threat type, severity badge, confidence score, source and destination IPs, and the forensic evidence that triggered it." |

---

## PART 5 — LIVE THREATS PAGE (1:30–1:45)

### Block 8 (1:30–1:45)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:30 | **Click "Live Threats"** in the sidebar navigation. | "The Live Threats page gives a cleaner view of every detection." |
| 1:32 | **Do nothing** for 2 seconds. Let the page load. | "You can see all six alerts here, sorted by time." |
| 1:34 | **Hover your mouse** over the first alert card (the most recent one — SYN Flood). Don't click. | "This one is a SYN flood — critical severity, 96 percent confidence. The evidence shows a packet rate of over 3,000 packets per second, source entropy of 7.82, and a SYN-to-ACK ratio of 23.4." |
| 1:38 | **Move mouse** to hover over the second alert card (UDP Flood). | "The UDP flood below it — critical severity, 94 percent confidence. Over 4,000 packets per second, high destination entropy, targeting over 200 unique ports." |
| 1:41 | **Move mouse** to hover over the third alert card (C2 Beaconing). | "The C2 beaconing detection — high severity. The beacon interval standard deviation is under 1.5 seconds, with 88 percent destination consistency. That pattern is a hallmark of automated command-and-control callbacks." |
| 1:44 | **Move mouse** to hover over the sixth alert card at the bottom (Data Exfiltration). | "And the data exfiltration alert — critical severity, 97 percent confidence. An outbound-to-inbound ratio of 34 to 1. The validity tag says MISSING because under a true data diode, the return channel is entirely absent." |

---

## PART 6 — DEGRADATION MATRIX (1:45–2:05)

### Block 9 (1:45–2:05)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:45 | **Click "Diode Lab"** in the sidebar. | "This is the Diode Lab. It demonstrates what happens to detection accuracy when the system operates under different diode modes." |
| 1:47 | **Do nothing** for 2 seconds. Let the page load. | "Right now it's in full-duplex mode — both forward and return paths are available. Every threat class shows high detection rates." |
| 1:50 | **Click the "Diode Only" mode button** on the Diode Lab page. | "Now I'm switching to diode-only mode. The return path is completely blocked. Watch the degradation matrix update." |
| 1:52 | **Do nothing** for 3 seconds. Let the matrix update visually. | "SYN flood detection drops to 41 percent. C2 beaconing drops to 73 percent because we lose return volume data. DNS tunneling stays at 85 percent because it only needs the forward path." |
| 1:56 | **Move mouse** to hover over the Data Exfiltration row. | "Data exfiltration drops to zero. That's honest. If you can't see the return channel, you cannot measure the asymmetric volume that exfiltration creates. The validity tag correctly says MISSING." |
| 2:00 | **Click "ACK Shadow" mode button.** | "Switching to ACK shadow mode now. This is a hybrid — the return path is estimated from ACK packets only." |
| 2:02 | **Do nothing** for 3 seconds. | "Detection rates partially recover. SYN flood is back to 88 percent. Data exfiltration at 78 percent — better than nothing, but still a gap. The validity tags change from MISSING to ESTIMATED." |

---

## PART 7 — AI ANALYZER (2:05–2:20)

### Block 10 (2:05–2:20)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 2:05 | **Click "AI Analyzer"** in the sidebar. | "The AI Analyzer page shows what's happening under the hood." |
| 2:07 | **Do nothing** for 2 seconds. | "For every flow that crosses the diode, the system extracts over 20 features: packet rate, byte volume asymmetry, source and destination IP entropy, DNS query length, JA3 TLS fingerprints, inter-arrival time variance, and more." |
| 2:11 | **Scroll down** slightly to show feature importance or model info if visible. | "These features feed into an IsolationForest anomaly detector and a LogisticRegression classifier, fused with rule-based heuristics for six threat classes." |
| 2:15 | **Scroll back up** to the top of the page. | "The output is a structured alert record — timestamp, flow ID, threat class, confidence score, and supporting evidence. Every field maps to the OCSF-aligned schema." |

---

## PART 8 — CLOSING (2:20–2:45)

### Block 11 (2:20–2:35)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 2:20 | **Click "Operations"** in the sidebar to return to the main dashboard. | "The entire pipeline runs in the monitoring enclave. Read-only ingest. No payload decryption. Streaming inference with bounded latency." |
| 2:23 | **Do nothing** for 2 seconds. Let the full Operations Center be visible. | "Every alert carries the evidence that triggered it — the feature values, the validity tag, the diode mode at the time of detection." |
| 2:26 | **Move mouse** to hover over the LIVE badge in the top-right corner. | "The dashboard updates in real time over WebSocket. No polling. No refresh needed. As soon as the backend detects a threat, every connected client sees it." |
| 2:30 | **Do nothing** for 3 seconds. Just let the dashboard sit. | "EKADHARA. Built for the enclave that can never strike back — but must always see the threat coming." |

### Block 12 (2:33–2:45)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 2:33 | **Do nothing.** Let the screen sit for 2 seconds. | "PS-26145. National Technical Research Organisation. Smart India Hackathon 2026." |
| 2:35 | **Slowly zoom out** of the browser window (Ctrl + minus, twice) so more of the dashboard is visible. | *(silence — let the text speak)* |
| 2:38 | **Hold** for 3 seconds on the full dashboard view. | *(silence)* |
| 2:41 | **Zoom back in** (Ctrl + plus, twice). Click the terminal window to bring it forward. | *(silence)* |
| 2:43 | In the terminal, scroll up to show the summary table one more time. | *(silence — let the alert board table be the last thing they see)* |
| 2:45 | **Stop recording.** | *(end)* |

---

## SUMMARY OF CLICKS (cheat sheet)

1. `demo_showcase.bat` — double-click to launch
2. Chrome window — click to switch to dashboard
3. "Live Threats" in sidebar — click
4. "Diode Lab" in sidebar — click
5. "Diode Only" mode button — click
6. "ACK Shadow" mode button — click
7. "AI Analyzer" in sidebar — click
8. "Operations" in sidebar — click
9. Ctrl+minus (zoom out) — press twice
10. Ctrl+plus (zoom in) — press twice

Total: 10 actions. Everything else is watching the screen and talking.

---

## TIMING BREAKDOWN

| Section | Time | Content |
|---------|------|---------|
| Opening / Problem | 0:00–0:30 | Terminal opens, batch script launches, pre-flight checks |
| Problem Statement | 0:30–0:55 | Script narrates the diode constraint, 6 threat classes |
| Attacks Injecting | 0:55–1:15 | 6 alerts appear in terminal one by one |
| Switch to Dashboard | 1:15–1:30 | Chrome window, Operations Center overview |
| Live Threats Page | 1:30–1:45 | Walk through each alert card with evidence |
| Degradation Matrix | 1:45–2:05 | Toggle diode modes, watch matrix update |
| AI Analyzer | 2:05–2:20 | Feature extraction, models, alert schema |
| Closing | 2:20–2:45 | Return to dashboard, final statement |

**Total: 2 minutes 45 seconds.**

---

## BEFORE YOU RECORD

- [ ] Close all other apps. Notification bubbles will ruin the shot.
- [ ] Set Chrome to 100% zoom. DevTools closed.
- [ ] Set terminal font to 14pt or larger.
- [ ] Close the Windows taskbar (auto-hide) so it doesn't pop up.
- [ ] Make sure `demo_showcase.bat` hasn't been run in the last 5 minutes (the API check in Phase 1 will show stale state). If it has, close the terminal and reopen it.
- [ ] Have a glass of water nearby.
- [ ] Do one practice run without recording. Time yourself. Adjust speech speed if needed.
- [ ] When ready, hit record. Don't start talking until the batch file banner appears on screen.
