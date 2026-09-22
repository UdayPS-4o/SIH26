# EKADHARA PS-26145 — SIH Video Script
**Duration:** 1 min 45 sec — 2 min 00 sec
**Format:** Screen recording only. No animation. No diagrams.
**Setup before recording:**
- Laptop at 1080p, 30fps
- Two windows side by side: terminal (left) + Chrome (right)
- Chrome open to `https://sih26145.udayps.com` on the Operations Center tab
- Chrome 100% zoom, DevTools closed, address bar visible
- Terminal open to any folder, font size 14pt+
- Microphone ready

---

## THE FLOW (overview)

1. Dashboard already open — calm, quiet, mostly empty threat feed
2. Narrator explains the problem while looking at the dashboard
3. Switch to terminal — type ONE command that starts all 3 attacks running
4. Switch to dashboard — never go back to terminal
5. Watch alerts keep appearing in the threat feed while you narrate
6. Walk through Operations Center KPIs, threat feed, and Live Threats page
7. Closing line

Total clicks: 3 (terminal → Chrome → Live Threats sidebar)

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

## PART 2 — TERMINAL: START THE ATTACKS (0:25–0:40)

### Block 3 (0:25–0:40)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:25 | **Click the terminal window** to bring it to the front. | "I'm going to launch three simulated attacks against the enclave. SYN flood, C2 beaconing, and DNS tunneling — all at once." |
| 0:28 | **Type this command** (type it out, don't paste):

```
curl -X POST https://sih26145.udayps.com/api/demo/start -H "Content-Type: application/json" -d "{\"attack_mix\":{\"syn_flood\":50,\"c2_beaconing\":50,\"dns_tunnel\":50}}"
```

Press Enter. | "This starts the traffic simulator with all three attack types running simultaneously. The backend will generate flows, run detection, and push alerts to the dashboard in real time." |
| 0:36 | **Wait** for the JSON response. It should show `"status": "started"`. | *(wait for the response — that's your cue)* |
| 0:38 | **Do nothing.** | "The attacks are now running. The simulator is generating traffic, the ML models are scoring every flow, and alerts are being broadcast to every connected client." |

---

## PART 3 — DASHBOARD: WATCH THE ALERTS (0:40–1:10)

### Block 4 (0:40–0:55)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:40 | **Click the Chrome window** to bring it forward. | "Now let me show you the dashboard reacting in real time." |
| 0:42 | **Do nothing** for 3 seconds. Watch the Live Threat Feed at the bottom. | "The first alerts are already appearing. SYN flood — critical severity, 96 percent confidence." |
| 0:45 | **Do nothing.** | "The detection engine is seeing a packet rate of over 3,000 packets per second from a single source, with source IP entropy above 7.5. That's a volumetric DDoS pattern." |
| 0:48 | **Do nothing.** Watch more alerts pop in. | "C2 beaconing — high severity. The beacon interval standard deviation is under 1.5 seconds, with 90 percent destination consistency. That's the fingerprint of an automated callback." |
| 0:52 | **Do nothing.** | "DNS tunneling — high severity. Query entropy above 4.5, average query length over 80 characters. Long subdomain labels carrying exfiltrated data." |
| 0:55 | **Do nothing.** | "All three attack types are running simultaneously. And the alerts keep coming. Watch." |

### Block 5 (0:55–1:10)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:55 | **Do nothing.** Let 2-3 more alerts appear in the feed. Don't touch the mouse. | "The backend is processing flows incrementally — streaming, not batch. Each flow gets 20-plus features extracted, scored by the ML ensemble, and if it crosses the threshold, an alert goes out." |
| 0:59 | **Do nothing.** | "This is all happening inside the monitoring enclave. Read-only ingest. No payload decryption. The system has never sent a single packet back." |
| 1:03 | **Scroll up** slightly to show the KPI cards at the top while alerts continue appearing below. | "The KPI cards up top are updating in real time. Active connections, threats blocked, total flows — all climbing as the simulator generates traffic." |
| 1:06 | **Scroll back down** to the threat feed. | "The throughput timeline is animating. Each new sample is a delta of total flows over time." |
| 1:09 | **Do nothing.** | "And the threat feed just keeps growing. Every detection is timestamped, severity-coded, and tagged with the evidence that triggered it." |

---

## PART 4 — LIVE THREATS PAGE (1:10–1:35)

### Block 6 (1:10–1:35)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:10 | **Click "Live Threats"** in the sidebar. | "Let me show you the Live Threats page for a cleaner view of every detection." |
| 1:12 | **Do nothing** for 2 seconds. Let the page load. | "You can see all the alerts here, sorted by time. SYN floods at the top — critical severity. C2 beaconing — high severity. DNS tunneling — high severity." |
| 1:15 | **Hover over the first alert card** (most recent SYN Flood). | "Each card shows the threat type, severity badge, confidence score, source and destination IPs, and the forensic evidence." |
| 1:18 | **Move mouse** to hover over a C2 Beaconing card. | "This C2 beaconing alert — the evidence shows a beacon interval standard deviation of 0.82 seconds across 18 flows. That regularity is the signature of machine-driven callbacks." |
| 1:22 | **Move mouse** to hover over a DNS Tunnel card. | "The DNS tunneling alert — query entropy of 5.72, average query length of 87 characters, 47 unique domains in the 60-second window. The subdomain labels are carrying encoded data." |
| 1:26 | **Do nothing.** Let 2 more alerts scroll in while you watch. | "And they keep coming. The simulator is still running. The backend is still processing. Every new detection appears here within seconds." |
| 1:30 | **Do nothing.** | "Every alert carries a validity tag — MEASURED, ESTIMATED, or MISSING. Under a true data diode, features that need the return path are marked MISSING. Everything else is MEASURED from the forward path alone." |
| 1:34 | **Do nothing.** | "That honesty about what the system can and cannot see is what makes it trustworthy for critical infrastructure." |

---

## PART 5 — CLOSING (1:35–1:50)

### Block 7 (1:35–1:50)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:35 | **Click "Operations"** in the sidebar to return. | "The entire pipeline runs inside the monitoring enclave. Read-only ingest. No payload decryption. Streaming inference." |
| 1:38 | **Do nothing** for 3 seconds. Full Operations Center visible. | "Six threat classes. Structured alerts with evidence. Real-time dashboard over WebSocket." |
| 1:41 | **Move mouse** to hover over the LIVE badge in the top-right. | "The simulator is still running right now. The alerts are still being generated. The dashboard is still updating." |
| 1:45 | **Do nothing** for 3 seconds. Let the dashboard sit. | "EKADHARA. Built for the enclave that can never strike back — but must always see the threat coming." |
| 1:48 | **Do nothing.** | "PS-26145. National Technical Research Organisation. Smart India Hackathon 2026." |
| 1:50 | **Stop recording.** | *(end)* |

---

## SUMMARY OF CLICKS

1. Click terminal window — switch to terminal
2. Type ONE curl command and press Enter
3. Click Chrome window — switch to dashboard (stay here forever)
4. Click "Live Threats" in sidebar
5. Click "Operations" in sidebar — back to main dashboard

Total: 5 clicks. After step 3, you never leave Chrome again.

---

## THE ONE COMMAND

```bash
curl -X POST https://sih26145.udayps.com/api/demo/start \
  -H "Content-Type: application/json" \
  -d "{\"attack_mix\":{\"syn_flood\":50,\"c2_beaconing\":50,\"dns_tunnel\":50}}"
```

This starts the TrafficSimulator with all 3 attack types running at weight 50 each. The simulator generates flows continuously until you stop it with:

```bash
curl -X POST https://sih26145.udayps.com/api/demo/stop
```

The response looks like:
```json
{"status":"started","simulator_running":true,"attack_mix":{"syn_flood":50,"c2_beaconing":50,"dns_tunnel":50}}
```

---

## TIMING BREAKDOWN

| Section | Duration | Content |
|---------|----------|---------|
| Dashboard open, settled | 0:00–0:25 | Calm Operations Center, explain the diode problem |
| Terminal: start attacks | 0:25–0:40 | Type ONE curl command, hit Enter |
| Watch dashboard react | 0:40–1:10 | Switch to Chrome, watch alerts stream in, narrate |
| Live Threats walkthrough | 1:10–1:35 | Hover alert cards, read evidence |
| Closing | 1:35–1:50 | Back to Operations, final line |

**Total: 1 minute 50 seconds.**

---

## TIPS

- The dashboard should already be open and calm before you hit record. The contrast between the quiet start and the alerts flooding in is the impact moment.
- Type the curl command at a natural pace. The typing itself looks technical on camera.
- After hitting Enter, wait for the JSON response before switching to Chrome.
- When you switch to Chrome, give it 3-4 seconds before talking. Let the viewer see the first alerts pop in.
- After switching to Chrome, you never go back to the terminal. The attacks keep running. The alerts keep coming. You just narrate over the dashboard.
- If you make a typo in the curl command, backspace and fix it. It looks natural.
- The simulator runs until you stop it. If you need to stop it after filming: `curl -X POST https://sih26145.udayps.com/api/demo/stop`
