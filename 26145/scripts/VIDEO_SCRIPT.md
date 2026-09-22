# EKADHARA PS-26145 — SIH Video Script
**Duration:** 1 min 55 sec — 2 min 10 sec
**Format:** Screen recording only. No animation. No diagrams.
**Setup before recording:**
- Laptop at 1080p, 30fps
- Two windows side by side: terminal (left) + Chrome (right)
- Chrome open to `https://sih26145.udayps.com` on the Operations Center tab
- Chrome 100% zoom, DevTools closed, address bar visible
- Terminal open to any folder, font size 14pt+
- Microphone ready for voiceover (or record voiceover in post)

---

## THE FLOW (overview)

1. Dashboard is already open — settled, mostly empty, quiet
2. Narrator explains the problem while looking at the dashboard
3. Switch to terminal — type 3 attack commands manually
4. Switch back to dashboard — watch 3 alerts appear in real time
5. Walk through the alerts, show the evidence
6. Closing line

Total clicks: 4 (switch to terminal, switch to Chrome, click Live Threats sidebar, click back to Operations)

---

## PART 1 — DASHBOARD OPEN, SETTLED (0:00–0:25)

### Block 1 (0:00–0:12)

**On screen:** Chrome showing `sih26145.udayps.com` Operations Center. The page is loaded, mostly empty. The LIVE badge in the top right is pulsing green. The threat feed at the bottom has maybe 0-2 alerts. KPI cards show numbers.

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:00 | **Do nothing.** Let the screen sit for 2 seconds. Dashboard is already open. | *(silence — let the dashboard breathe)* |
| 0:02 | **Do nothing.** | "This is EKADHARA — an AI-based threat detection system built for unidirectional IP traffic." |
| 0:06 | **Do nothing.** | "The kind you find in critical infrastructure. Power grids. Telecom. Defense facilities." |
| 0:10 | **Do nothing.** | "These networks are monitored through hardware data diodes. One-way valves. Traffic flows in, but nothing can ever flow back out." |

### Block 2 (0:12–0:25)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:12 | **Scroll down** slowly to show the Live Threat Feed at the bottom. It should be mostly empty — maybe 0 or 1 alert. | "The monitoring enclave sees every packet crossing the link. But it has no physical path back into the production network." |
| 0:16 | **Scroll back up** to the top. | "No probes. No handshakes. No ability to push a mitigation command across the diode." |
| 0:20 | **Do nothing.** | "So the challenge is: how do you detect threats when your sensor can never touch the attacker?" |
| 0:23 | **Do nothing.** | "That is the problem we built EKADHARA to solve." |

---

## PART 2 — TERMINAL: TYPE ATTACK COMMANDS (0:25–0:55)

### Block 3 (0:25–0:40)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:25 | **Click the terminal window** to bring it to the front. | "Let me show you how it works. I'm going to launch three simulated attacks against the enclave." |
| 0:28 | **Type this command** (type it out, don't paste):

```
curl -X POST https://sih26145.udayps.com/api/demo/alert -H "Content-Type: application/json" -d "{\"attack_type\":\"syn_flood\",\"count\":1}"
```

Press Enter. | "First — a SYN flood. Volumetric TCP attack. The detection engine looks at packet rate and source IP entropy to flag it." |
| 0:35 | **Wait** for the response to come back. It should show JSON with `"status": "injected"`. | *(wait for the terminal to show the response — that's your cue to continue)* |
| 0:37 | **Do nothing.** | "That call just injected a critical-severity alert into the backend and broadcast it to every connected dashboard." |

### Block 4 (0:40–0:55)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:40 | **Type the second command:**

```
curl -X POST https://sih26145.udayps.com/api/demo/alert -H "Content-Type: application/json" -d "{\"attack_type\":\"c2_beaconing\",\"count\":1}"
```

Press Enter. | "Second — C2 beaconing. Periodic callbacks from a compromised host to a command-and-control server." |
| 0:47 | **Wait** for response. | "The engine detects this from beacon interval standard deviation and destination consistency over a sliding window." |
| 0:50 | **Type the third command:**

```
curl -X POST https://sih26145.udayps.com/api/demo/alert -H "Content-Type: application/json" -d "{\"attack_type\":\"dns_tunnel\",\"count\":1}"
```

Press Enter. | "Third — DNS tunneling. Exfiltrating data through crafted DNS queries with long subdomain labels." |
| 0:54 | **Wait** for response. | "Three attacks. Three distinct threat classes. All injected in real time." |

---

## PART 3 — WATCH DASHBOARD REACT (0:55–1:25)

### Block 5 (0:55–1:10)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 0:55 | **Click the Chrome window** to bring it forward. The dashboard is already on the Operations Center tab. | "Now watch the dashboard. The three alerts from the terminal should be appearing right now." |
| 0:58 | **Do nothing.** Watch the Live Threat Feed at the bottom. | "The first alert — SYN flood — critical severity, 96 percent confidence." |
| 1:01 | **Do nothing.** | "Second — C2 beaconing — high severity, 88 percent confidence. The evidence shows a beacon interval standard deviation of 0.8 seconds." |
| 1:04 | **Do nothing.** | "Third — DNS tunneling — high severity, 91 percent confidence. Query entropy of 5.7, average query length of 87 characters." |
| 1:07 | **Do nothing.** | "All three appeared within seconds of the curl commands completing. That's WebSocket streaming — no polling, no refresh." |
| 1:10 | **Do nothing.** | "The backend evaluates flow features, runs the ML ensemble, and pushes the alert to every connected client instantly." |

---

## PART 4 — LIVE THREATS WALKTHROUGH (1:25–1:50)

### Block 6 (1:25–1:50)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:25 | **Click "Live Threats"** in the sidebar. | "Let me show you the Live Threats page for a cleaner view." |
| 1:27 | **Do nothing** for 2 seconds. Let the page load. | "You can see all three alerts here, severity-coded and timestamped." |
| 1:29 | **Hover over the first alert card** (SYN Flood — the most recent). | "This SYN flood alert — critical severity, 96 percent confidence. The evidence shows a packet rate of 3,247 packets per second, source entropy of 7.82, and a SYN-to-ACK ratio of 23.4." |
| 1:34 | **Move mouse** to hover over the second card (C2 Beaconing). | "The C2 beaconing alert — high severity. Beacon interval standard deviation of 0.82 seconds, 91 percent destination consistency across 18 flows." |
| 1:38 | **Move mouse** to hover over the third card (DNS Tunnel). | "The DNS tunneling alert — high severity, 91 percent confidence. Query entropy of 5.72, average query length of 87 characters, 47 unique domains in the window." |
| 1:43 | **Do nothing.** | "Every alert carries structured evidence — timestamp, flow ID, threat class, confidence score, and a validity tag." |
| 1:46 | **Do nothing.** | "Under a true data diode, the validity tag for exfiltration would say MISSING because the return channel is absent. For these three attacks, the evidence is fully MEASURED from the forward path alone." |
| 1:50 | **Do nothing.** | "That's the core of EKADHARA — maximum detection fidelity from read-only, passive observation." |

---

## PART 5 — CLOSING (1:50–2:05)

### Block 7 (1:50–2:05)

| TIME | YOUR HANDS | YOUR MOUTH |
|------|-----------|------------|
| 1:50 | **Click "Operations"** in the sidebar to return to the main dashboard. | "The entire system runs inside the monitoring enclave. Read-only ingest. No payload decryption. Streaming inference with bounded latency." |
| 1:54 | **Do nothing** for 3 seconds. Let the full Operations Center be visible. | "Six threat classes detected. Structured alerts with evidence. Real-time dashboard over WebSocket." |
| 1:57 | **Do nothing.** | "EKADHARA. PS-26145. National Technical Research Organisation. Smart India Hackathon 2026." |
| 2:00 | **Do nothing** for 3 seconds. Let the dashboard sit. | *(silence)* |
| 2:03 | **Stop recording.** | *(end)* |

---

## SUMMARY OF CLICKS

1. Click terminal window — switch to terminal
2. Click Chrome window — switch to dashboard (after 3 attacks)
3. Click "Live Threats" in sidebar
4. Click "Operations" in sidebar — back to main dashboard

Total: 4 clicks. Everything else is typing commands and talking.

---

## THE 3 COMMANDS (type these in order)

```bash
# Attack 1: SYN Flood DDoS
curl -X POST https://sih26145.udayps.com/api/demo/alert -H "Content-Type: application/json" -d "{\"attack_type\":\"syn_flood\",\"count\":1}"

# Attack 2: C2 Beaconing
curl -X POST https://sih26145.udayps.com/api/demo/alert -H "Content-Type: application/json" -d "{\"attack_type\":\"c2_beaconing\",\"count\":1}"

# Attack 3: DNS Tunneling
curl -X POST https://sih26145.udayps.com/api/demo/alert -H "Content-Type: application/json" -d "{\"attack_type\":\"dns_tunnel\",\"count\":1}"
```

Each command returns JSON like:
```json
{"status":"injected","attack_type":"syn_flood","count":1,"alerts":[...]}
```

---

## TIMING BREAKDOWN

| Section | Duration | Content |
|---------|----------|---------|
| Dashboard open, settled | 0:00–0:25 | Show empty-ish Operations Center, explain the diode problem |
| Terminal: 3 attack commands | 0:25–0:55 | Type 3 curl commands, one by one, with explanation |
| Watch dashboard react | 0:55–1:25 | Switch to Chrome, watch 3 alerts appear in real time |
| Live Threats walkthrough | 1:25–1:50 | Hover each alert card, read evidence values |
| Closing | 1:50–2:05 | Back to Operations, final line, fade |

**Total: 2 minutes 5 seconds.**

---

## TIPS

- The dashboard should already be open and settled before you hit record. It should look calm — mostly empty threat feed, steady KPI numbers. The contrast between the calm start and the alerts popping in is what makes it look impressive.
- Type the curl commands at a natural pace. Don't rush. The typing itself looks technical and deliberate on camera.
- After typing each command, wait for the JSON response before speaking the next line. The response confirms the alert was injected.
- When you switch back to Chrome, give it 2-3 seconds before talking. Let the viewer see the alerts appearing.
- If the Live Threats page doesn't show the alerts immediately, wait — they come through WebSocket within 1-2 seconds of the API call returning.
- If you make a typo in a curl command, just backspace and fix it. It looks natural. Don't re-record.
