# EKADHARA PS-26145 — SIH Video Script
**Duration:** 1 min 45 sec — 2 min 00 sec
**Format:** Screen recording only. No animation. No diagrams.
**Setup before recording:**
- Laptop at 1080p, 30fps
- Chrome open to `https://sih26145.udayps.com` on the Operations Center tab
- Chrome 100% zoom, DevTools closed, address bar visible
- Microphone ready

---

## THE FLOW (overview)

1. Dashboard already open — calm, quiet, mostly empty threat feed
2. Narrator explains the problem while looking at the dashboard
3. Click "Attack Console" in sidebar — click ONE preset button to start attacks
4. Switch to Operations → Live Threats → Diode Lab → AI Analyzer
5. Watch alerts keep appearing while you narrate
6. Closing line

Total clicks: 6. After launching attacks, you never leave Chrome.

---

## PART 1 — DASHBOARD OPEN, SETTLED (0:00–0:25)

### Block 1 (0:00–0:12)

**On screen:** Chrome showing `sih26145.udayps.com` Operations Center. Loaded, calm, quiet. LIVE badge pulsing green. Threat feed at bottom mostly empty.

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:00 | **Do nothing.** Let the screen sit for 2 seconds. | *(silence — let the dashboard breathe)* |
| 0:02 | **Do nothing.** | "This is EKADHARA — an AI-based threat detection system built for unidirectional IP traffic." |
| 0:06 | **Do nothing.** | "The kind you find in critical infrastructure. Power grids. Telecom. Defense facilities." |
| 0:10 | **Do nothing.** | "These networks are monitored through hardware data diodes. One-way valves. Traffic flows in, but nothing can ever flow back out." |

### Block 2 (0:12–0:25)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:12 | **Scroll down** slowly to show the Live Threat Feed. It should be mostly empty — 0 or 1 alert. | "The monitoring enclave sees every packet. But it has no physical path back into the production network. No probes. No handshakes. No mitigation commands." |
| 0:16 | **Scroll back up** to the top. | "So the challenge is: how do you detect cyber threats when your sensor can never touch the attacker?" |
| 0:20 | **Do nothing.** | "That is the problem EKADHARA solves." |
| 0:23 | **Do nothing.** | "Let me show you." |

---

## PART 2 — ATTACK CONSOLE: START THE ATTACKS (0:25–0:42)

### Block 3 (0:25–0:42)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:25 | **Click "Attack Console"** in the sidebar. | "I'm going to launch three simulated attacks against the enclave. SYN flood, C2 beaconing, and DNS tunneling — all at once." |
| 0:28 | **Do nothing.** Let the page load. | "This is the Attack Console. It generates controlled attack traffic and pushes it through the exact same detection pipeline that real NetFlow would use." |
| 0:32 | **Click the "C2 Channel" preset button** (the one with beaconing + DNS tunnel). | "I'll use the C2 Channel preset — beaconing plus DNS tunneling. Continuous, low-and-slow, just like a real botnet." |
| 0:36 | **Watch** the simulator status update to "Active." | "The simulator is now generating flows at 10,000 per second. SYN flood, UDP flood, C2 beaconing, DNS tunnel, port scan — all running simultaneously." |
| 0:40 | **Do nothing.** | "The backend is processing every flow, extracting 25-plus features, running the ML ensemble, and pushing alerts to the dashboard in real time." |
| 0:42 | **Click "Operations"** in the sidebar. | "Let me show you the dashboard reacting." |

---

## PART 3 — DASHBOARD: WATCH THE ALERTS (0:42–1:10)

### Block 4 (0:42–0:57)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:42 | **Click "Operations"** in sidebar. Do nothing for 3 seconds. | "Now the dashboard is reacting in real time." |
| 0:45 | **Do nothing.** Watch the Live Threat Feed at the bottom. | "The first alerts are already appearing. SYN flood — critical severity, 96 percent confidence." |
| 0:48 | **Do nothing.** | "The detection engine is seeing a packet rate of over 3,000 packets per second from a single source, with source IP entropy above 7.5. That's a volumetric DDoS pattern." |
| 0:51 | **Do nothing.** Watch more alerts pop in. | "C2 beaconing — high severity. The beacon interval standard deviation is under 1.5 seconds, with 90 percent destination consistency. That's the fingerprint of an automated callback." |
| 0:55 | **Do nothing.** | "DNS tunneling — high severity. Query entropy above 4.5, average query length over 80 characters. Long subdomain labels carrying exfiltrated data." |
| 0:58 | **Do nothing.** | "All three attack types are running simultaneously. And the alerts keep coming. Watch." |

### Block 5 (0:58–1:10)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:58 | **Do nothing.** Let 2-3 more alerts appear. | "The backend is processing flows incrementally — streaming, not batch. Each flow gets 25-plus features extracted, scored by the ML ensemble, and if it crosses the threshold, an alert goes out." |
| 1:02 | **Do nothing.** | "This is all happening inside the monitoring enclave. Read-only ingest. No payload decryption. The system has never sent a single packet back." |
| 1:06 | **Scroll up** slightly to show the KPI cards. | "The KPI cards up top are updating in real time. Active connections, threats blocked, total flows — all climbing as the simulator generates traffic." |
| 1:09 | **Scroll back down** to the threat feed. | "And the throughput timeline is animating. Each new sample is a delta of total flows over time." |

---

## PART 4 — LIVE THREATS PAGE (1:10–1:30)

### Block 6 (1:10–1:30)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:10 | **Click "Live Threats"** in the sidebar. | "Let me show you the Live Threats page for a cleaner view of every detection." |
| 1:12 | **Do nothing** for 2 seconds. | "You can see all the alerts here, sorted by time. SYN floods at the top — critical severity. C2 beaconing — high severity. DNS tunneling — high severity." |
| 1:15 | **Hover over the first alert card** (most recent SYN Flood). | "Each card shows the threat type, severity badge, confidence score, source and destination IPs, and the forensic evidence." |
| 1:18 | **Move mouse** to hover over a C2 Beaconing card. | "This C2 beaconing alert — the evidence shows a beacon interval standard deviation of 0.82 seconds across 18 flows. That regularity is the signature of machine-driven callbacks." |
| 1:22 | **Move mouse** to hover over a DNS Tunnel card. | "The DNS tunneling alert — query entropy of 5.72, average query length of 87 characters, 47 unique domains in the 60-second window. The subdomain labels are carrying encoded data." |
| 1:26 | **Do nothing.** Let 2 more alerts scroll in. | "And they keep coming. The simulator is still running. The backend is still processing. Every new detection appears here within seconds." |
| 1:30 | **Do nothing.** | "Every alert carries a validity tag — MEASURED, ESTIMATED, or MISSING. Under a true data diode, features needing the return path are MISSING. Everything else is MEASURED from the forward path alone." |

---

## PART 5 — DIODE LAB + AI ANALYZER (1:30–1:50)

### Block 7 (1:30–1:45)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:30 | **Click "Diode Lab"** in the sidebar. | "Now the part that's unique to EKADHARA. The Diode Lab." |
| 1:32 | **Do nothing** for 3 seconds. Let the degradation matrix render. | "Every detection exists as a triplet — full duplex, diode-only, and ACK-Shadow reconstructed. We score identical models across all three to show exactly what the system loses when the return path is blocked." |
| 1:36 | **Point at the Diode column** for DDoS. | "DDoS detection drops from 94 percent to 41 percent under diode constraints. That's a 53 percent degradation." |
| 1:39 | **Point at the ACK-Shadow column.** | "But ACK-Shadow reconstruction recovers most of it — up to 78 percent. We use TCP acknowledgement numbers observed in the forward path to estimate the unseen reverse volume." |
| 1:42 | **Point at the bottom warning.** | "Two threats drop below 50 percent detection — silent failure risk. The system flags that honestly instead of pretending it can see everything." |
| 1:45 | **Do nothing.** | "That honesty about what the system can and cannot see is what makes it trustworthy for critical infrastructure." |

### Block 8 (1:45–1:55)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:45 | **Click "AI Analyzer"** in the sidebar. | "The detection pipeline itself — six streaming specialists, one per threat class. DDoS, beaconing, DGA, DNS tunneling, TLS anomaly, data exfiltration. Each with its own model." |
| 1:48 | **Do nothing** for 3 seconds. Scroll down slightly if needed. | "Random Forest for volumetric attacks. Isolation Forest plus LSTM for beaconing periodicity. Character CNN for DGA domains. XGBoost for DNS tunneling. Transformer encoder for exfiltration." |
| 1:52 | **Do nothing.** | "All processing is local. No traffic or metadata leaves the deployment boundary." |

### Block 9 (1:55–2:00)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:55 | **Click "Operations"** in the sidebar. | "The entire pipeline runs inside the monitoring enclave. Read-only ingest. No payload decryption. Streaming inference." |
| 1:57 | **Do nothing** for 3 seconds. Full Operations Center visible. | "Six threat classes. Structured alerts with evidence. Real-time dashboard over WebSocket. And the unique degradation matrix that tells you exactly what a real data diode costs." |
| 2:00 | **Do nothing.** | "EKADHARA. Built for the enclave that can never strike back — but must always see the threat coming." |
| 2:03 | **Do nothing.** | "PS-26145. National Technical Research Organisation. Smart India Hackathon 2026." |
| 2:06 | **Stop recording.** | *(end)* |

---

## SUMMARY OF CLICKS

1. Click "Attack Console" in sidebar
2. Click "C2 Channel" preset button
3. Click "Operations" in sidebar
4. Click "Live Threats" in sidebar
5. Click "Diode Lab" in sidebar
6. Click "AI Analyzer" in sidebar
7. Click "Operations" in sidebar — back to main dashboard

Total: 7 clicks. One URL, one session, one continuous demo.

---

## WHAT TO SAY (word-for-word reference)

> "This is EKADHARA — an AI-based threat detection system built for unidirectional IP traffic."
>
> "The kind you find in critical infrastructure. Power grids. Telecom. Defense facilities."
>
> "These networks are monitored through hardware data diodes. One-way valves. Traffic flows in, but nothing can ever flow back out."
>
> "The monitoring enclave sees every packet. But it has no physical path back into the production network. No probes. No handshakes. No mitigation commands."
>
> "So the challenge is: how do you detect cyber threats when your sensor can never touch the attacker?"
>
> "That is the problem EKADHARA solves. Let me show you."
>
> [Click Attack Console]
>
> "I'm going to launch simulated attacks against the enclave. SYN flood, C2 beaconing, and DNS tunneling — all at once."
>
> [Click C2 Channel preset]
>
> "The simulator is now generating flows at 10,000 per second. The backend processes every flow, extracts 25-plus features, runs the ML ensemble, and pushes alerts to the dashboard in real time."
>
> [Click Operations]
>
> "Now the dashboard is reacting. SYN flood — critical, 96 percent confidence. The detection engine sees a packet rate of over 3,000 packets per second from a single source. That's a volumetric DDoS pattern."
>
> "C2 beaconing — high severity. Beacon interval standard deviation under 1.5 seconds, 90 percent destination consistency. That's the fingerprint of automated callbacks."
>
> "DNS tunneling — high severity. Query entropy above 4.5, average query length over 80 characters. Long subdomains carrying encoded data."
>
> "All running simultaneously. And the alerts keep coming."
>
> [Click Live Threats]
>
> "Each alert carries the threat type, severity, confidence, source and destination IPs, and forensic evidence."
>
> "Every alert also carries a validity tag — MEASURED, ESTIMATED, or MISSING. Under a true data diode, features needing the return path are MISSING. Everything else is MEASURED from the forward path alone."
>
> [Click Diode Lab]
>
> "Now the part that's unique to EKADHARA — the Diode Lab. Every detection exists as a triplet: full duplex, diode-only, and ACK-Shadow reconstructed."
>
> "DDoS detection drops from 94 percent to 41 percent under diode constraints. But ACK-Shadow recovers it to 78 percent by estimating reverse-path volume from forward-path ACK numbers."
>
> "Two threats drop below 50 percent — silent failure risk. The system flags that honestly."
>
> [Click AI Analyzer]
>
> "Six streaming specialists — one per threat class. Random Forest for volumetric attacks. Isolation Forest plus LSTM for beaconing. Character CNN for DGA domains. XGBoost for DNS tunneling. Transformer encoder for exfiltration."
>
> [Click Operations]
>
> "EKADHARA. Built for the enclave that can never strike back — but must always see the threat coming."
>
> "PS-26145. National Technical Research Organisation. Smart India Hackathon 2026."

---

## SIMULATOR PRESETS (for the Attack Console)

| Preset | Attack Mix | Best For |
|--------|-----------|----------|
| DDoS Storm | SYN flood 60%, UDP flood 40% | Volumetric DDoS demo |
| C2 Channel | Beaconing 60%, DNS tunnel 40% | Persistence + exfil demo |
| Full Assault | All 6 classes weighted | Maximum visual impact |
| Stealth Exfil | DGA 40%, Exfil 40%, TLS 20% | Low-and-slow demo |
| Recon + Infiltrate | Port scan 40%, DGA 30%, Beacon 30% | Kill chain narrative |

For the video, use **C2 Channel** or **Full Assault** for the most visual impact.

---

## WHAT MAKES THIS WIN

1. **Same URL, one session** — proves the pipeline is real, not stitched together
2. **Attack Console is part of the dashboard** — the judge sees you launch attacks INSIDE the app, not in a hidden terminal
3. **Diode Lab degradation matrix** — no other submission will have this. It's your intellectual contribution
4. **Validity tags on every alert** — MEASURED/ESTIMATED/MISSING shows constraint-aware design
5. **Honest narration** — you say "this is simulated" in plain language. Judges trust transparency

---

## TIPS

- The dashboard should already be open and calm before you hit record. The contrast between the quiet start and the alerts flooding in is the impact moment.
- Click the preset button at a natural pace. One click, watch it activate, then move on.
- After launching attacks, give the dashboard 3-4 seconds before talking. Let the viewer see the first alerts pop in.
- On the Diode Lab, point at specific numbers. "94 to 41 percent." That specificity makes it credible.
- If you need to stop the simulator after filming: go to Attack Console and click "Stop Simulator", or use `curl -X POST https://sih26145.udayps.com/api/demo/stop`
- Keep the cursor steady when reading evidence. Move deliberately between alert cards.
