# WATCHTOWER — Demo Video Script
**Smart India Hackathon 2026 | PS-26145 | NTRO**
**Duration: 3:00 | Target: Judging Round**

---

## ACT 1: THE PROBLEM (0:00 – 0:45)

| TIME | VISUAL | NARRATION | ON-SCREEN TEXT |
|------|--------|-----------|----------------|
| 0:00 | **BLACK SCREEN.** A single white cursor blinks. Lines of hex stream upward like matrix rain — representing raw network packets, each one a numbered entry in an infinite column of integers. The scrolling slows, then stops on a single line of code: `socket.recv(BUFFER_SIZE)`. | *(Voiceover, calm, documentary tone — close to the mic, intimate)* | — |
| 0:08 | **PULL BACK** to reveal: a terminal window inside a dark room, monitor glow reflecting on nothing. The scrolling data continues at high speed — 10,000 lines per second, too fast to read. A counter ticks up in the corner: `PKT/s: 10,247`. | "Every second, ten thousand packets cross your network gateway. You can see them all. But you can never touch them." | `10,000 packets/second` |
| 0:18 | **SPLIT SCREEN.** Left half: a hand reaching toward the screen, fingers extended. Right half: a diagram of a **DATA DIODE** — a physical device with a one-way arrow. The reverse path is overlaid with a bold red X. Labels appear: "INGRESS — YES" / "EGRESS — BLOCKED". | "This is a data diode. One-way. Read-only. No probes. No handshakes. No decryption. No going back." | `DATA DIODE` · `ONE-WAY ONLY` |
| 0:28 | **DARKEN** the room. Only the data diode diagram glows. Text fades in one word at a time: "Critical infrastructure operators have used physical data diodes for decades." Then: "They copy traffic into a monitoring enclave." | "Critical infrastructure operators have used physical data diodes for decades. They copy traffic into a monitoring enclave." | — |
| 0:36 | The text changes. New words appear with a subtle **glitch flicker**: "But here's the problem." Pause. "The enclave can see everything — and do nothing." The RED X on the reverse path **pulses** once. | "But here's the problem: the enclave can see everything and do nothing. No active scanning. No active defense. Just passive observation." | `NO ACTIVE DEFENSE` |
| 0:42 | **BEAT.** One second of silence. Black screen. Then the problem statement ID slams in: **PS-26145** in stark white against black. | *(Beat — let it land)* "This is PS-26145." | `PS-26145` |

**Transition: Screen FLASHES white, then cuts to the dashboard.**

---

## ACT 2: THE REVEAL (0:45 – 1:30)

| TIME | VISUAL | NARRATION | ON-SCREEN TEXT |
|------|--------|-----------|----------------|
| 0:45 | **FLASH CUT.** The WATCHTOWER dashboard materializes with a **glitch-in** effect. Logo appears top-left: a stylized radar/tower icon with the word **WATCHTOWER** in a sharp geometric font. Cyan accent line sweeps across the header. | "Build AI that sees threats in read-only traffic." *(Pause)* "And we did." | `WATCHTOWER` |
| 0:52 | **ONE CONTINUOUS SWEEP** across the dashboard — camera pans right across the full UI: sidebar with 6 nav icons (Dashboard, Attack, Live Threats, Analytics, Network Map, About), then the KPI row animates in: **2.8M Flows Scanned**, **10.2K Threats Blocked**, **1,847 Active Sessions**, **98.3% Detection Rate**, **1.8% False Positive**. Each number counts up on screen. | "WATCHTOWER. National Threat Intelligence Platform. Built for NTRO. The only system that detects six classes of cyber threats using nothing but passive flow metadata." | `2.8M SCANNED` · `10.2K BLOCKED` · `98.3% DETECTION` |
| 1:02 | Camera focuses on the **Threat Pipeline** diagram in the center panel. Four boxes with arrows: **INGEST → FEATURES → INFERENCE → OUTPUT**. Each box pulses cyan in sequence — left to right — as data flows through. | "Six threat classes. Real-time detection. Streaming pipeline processing thousands of flows per second." | `INGEST → FEATURES → INFERENCE → OUTPUT` |
| 1:10 | **QUICK-CUT MONTAGE.** Six shots, ~1.8 seconds each, rapid-fire: | | |
| 1:10 | **Shot 1:** A SYN flood attack fires — thousands of connection requests surge on the analytics graph. A red spike erupts. Label: `CRITICAL: SYN Flood` | "SYN flood. Volumetric DDoS detection from flow rate and source IP entropy." | `SYN FLOOD` |
| 1:12 | **Shot 2:** A network graph shows beaconing nodes pulsing in a steady rhythm — dots flashing at regular intervals. | "Botnet command and control, detected through periodicity analysis." | `C2 BEACONING` |
| 1:14 | **Shot 3:** A DNS query entropy meter spikes — random-looking domain names scroll by. An alert fires: `DGA DOMAIN DETECTED`. | "DGA domains and DNS tunneling — entropy and n-gram analysis." | `DGA / DNS TUNNEL` |
| 1:16 | **Shot 4:** TLS handshake metadata renders as a colored hash bar — JA3 fingerprints displayed without a single byte of decrypted payload. | "Malware in encrypted sessions — JA3 fingerprinting. No decryption." | `JA3 FINGERPRINT` |
| 1:18 | **Shot 5:** A port-scan fan-out diagram — one IP connecting to hundreds of ports in a radial explosion pattern. | "Reconnaissance detection from fan-out patterns." | `PORT SCAN` |
| 1:20 | **Shot 6:** An asymmetric data spike — tiny outbound, massive outbound. Exfiltration arrow points off-screen. | "Exfiltration through asymmetric flow volume anomalies." | `DATA EXFILTRATION` |
| 1:22 | **RETURN** to the full dashboard. Six threat class icons arranged in a clean grid at the bottom, each with a green indicator: `ACTIVE`. | "Read-only architecture. Zero decryption. Standardized JSON alerts." | `6 THREAT CLASSES · ACTIVE` |

**Transition: Quick zoom forward into the Attack page.**

---

## ACT 3: THE ATTACK (1:30 – 2:15)

| TIME | VISUAL | NARRATION | ON-SCREEN TEXT |
|------|--------|-----------|----------------|
| 1:30 | **CUT** to the **Attack Simulation** page. Split layout: left panel = attack controls (6 buttons stacked vertically: SYN Flood, UDP Flood, DNS Tunneling, DGA Attack, Beaconing, Port Scan). Right panel = Live Threats feed. The narrator's cursor hovers over the red **SYN FLOOD** button. | "Let me show you. Right now." | — |
| 1:35 | **CLICK.** The SYN Flood button illuminates. The left panel immediately begins counting: `Packets Sent: 0... 1,247... 5,891... 50,000`. A progress bar fills. | "SYN flood. Fifty thousand packets per second." | `SYN FLOOD` · `50,000 pps` |
| 1:40 | **2 seconds in** — the Live Threats panel on the right **ERUPTS**. Red `CRITICAL` alerts flood in, one after another. Each shows: timestamp, threat class, confidence score (e.g., `94.7%`), source IP, port count. The feed auto-scrolls at 2-second intervals. The KPI "Threats Blocked" counter on the dashboard ticker starts climbing: `10,201... 10,215... 10,234...`. | "Passive observation only. No firewalls touched. No packets dropped. Pure detection from flow metadata." | `CRITICAL — SYN Flood` · `94.7% confidence` |
| 1:48 | **CUT** to the **Network Map** page. Force-directed graph with nodes and edges. As the attack continues, nodes light up RED one by one. Red arcs draw themselves between compromised endpoints — attack paths materializing in real-time. A legend shows: `RED = Compromised` / `CYAN = Clean`. | "Every attack leaves a fingerprint. We read it. We classify it. We score it." | `NETWORK TOPOLOGY` · `47 NODES` |
| 1:55 | Close-up on a single node pulsing red. A tooltip pops up: `Source: 192.168.1.105 → Targets: 47 endpoints | Threat: Volumetric DDoS | Confidence: 96.2%`. | *(No new narration — let the visuals speak)* | `96.2% CONFIDENCE` |
| 2:00 | **SWITCH** to the **Analytics** page. A large **donut chart** renders — each slice a threat class, colored by severity. Red dominates. Below it, **sparkline charts** show detection rate over time — a steady flat line at 98%+ with tiny upward blips when attacks fire. | "Real-time analytics. Threat distribution. Detection confidence — all updating live." | `ANALYTICS` · `DETECTION RATE` |

**Transition: Camera pulls back to the dashboard.**

---

## ACT 4: THE CLOSE (2:15 – 3:00)

| TIME | VISUAL | NARRATION | ON-SCREEN TEXT |
|------|--------|-----------|----------------|
| 2:15 | **RETURN** to the full Dashboard view. Camera pulls back smoothly — all panels visible in one frame: sidebar, KPIs, pipeline, threat feed, network map thumbnail. The screen is dense with live data. Everything moves subtly — numbers tick, alerts scroll, graphs breathe. | "Six threat classes. Real-time detection. Streaming pipeline processing thousands of flows per second. Read-only architecture. Zero decryption. Standardized JSON alerts." | — |
| 2:25 | A **CARD HIGHLIGHT** effect: the **"Enclave Constraints"** card on the dashboard edges with a cyan glow. Inside: `✓ Read-Only Mode: ACTIVE` / `✓ No Outbound Traffic` / `✓ No Probes` / `✓ COMPLIANT`. The word **COMPLIANT** pulses green. | "Built for the data diode. Designed for the enclave. Engineered for NTRO." | `COMPLIANT ✓` |
| 2:32 | **SLOW ZOOM** toward the WATCHTOWER logo in the top-left corner. The rest of the dashboard fades slightly — bokeh effect. The logo holds sharp and centered. | *(Voice drops, slower, deliberate)* "WATCHTOWER. Because the best defense is seeing everything." *(Pause)* "And doing nothing." *(Pause)* "Until it matters." | — |
| 2:40 | The logo holds for two full seconds. Below it, the problem statement ID fades in: **PS-26145**. Below that, the event name: **Smart India Hackathon 2026**. Below that: **NTRO** with the Indian tricolor accent line. | — | `PS-26145` |
| 2:48 | Everything begins to fade. The dashboard dissolves into darkness over one full second. The logo persists the longest, then fades. | — | `Smart India Hackathon 2026` |
| 2:55 | **FULL BLACK** for two seconds. | — | — |
| 2:57 | One final frame: the WATCHTOWER logo on black. Tiny. Centered. | — | `WATCHTOWER` |
| 3:00 | **FADE OUT.** | — | — |

---

## TECHNICAL SPECIFICATIONS

| Parameter | Value |
|-----------|-------|
| **Resolution** | 1920 x 1080 (1080p) or 3840 x 2160 (4K recommended) |
| **Frame Rate** | 60fps for all UI capture; 24fps for cinematic cutaways |
| **Audio** | Voiceover recorded with cardioid condenser mic, 48kHz. Add subtle ambient hum (datacenter/rack fans) under Act 1. Add low electronic pulse (60 BPM) under Act 2 reveal. Attack section gets rising tension tone. Act 4 returns to ambient. |
| **Font** | Use the exact font from the WATCHTOWER UI — JetBrains Mono for data, Inter for headings |
| **Color Palette** | Background `#0a0e17` (near-black navy), Accent `#06b6d4` (cyan-500), Alert `#ef4444` (red-500), Success `#22c55e` (green-500), Text `#e2e8f0` (slate-200) |
| **Screen Capture** | Record at `localhost:5178` (dev server). All data is synthetic/mock — the dashboard runs on a seeded in-browser panel with no backend, and says so on screen. |
| **Recording Tool** | OBS Studio (free) at 60fps. Browser zoom at 110% for crisp UI capture. |

---

## RECOMMENDED SHOOTING NOTES

1. **Record in segments, not one take.** Capture each act separately (4 recordings, ~45s each). Stitch in post. This lets you re-record individual sections if a browser glitch or animation timing is off.

2. **Pre-warm the dashboard.** Before recording, open the dashboard and let all animations play through once. Numbers animate on first load — you want them already settled at their peak values when the camera arrives.

3. **Use a clean browser profile.** Incognito window, no extensions, no bookmarks bar, DevTools docked to the side (or hidden with F11). Full-screen the browser. Hide the OS taskbar if possible.

4. **The "launch attack" button is the hero moment.** Practice the timing. You want the alerts to start appearing at exactly the 2-second mark after click. If they fire too fast, the demo feels unreal. If too slow, judges get bored. Calibrate this shot specifically.

5. **Mouse cursor visibility.** Make the cursor large and visible. Use a custom cursor or zoom the browser to 110-125% so the pointer is easy to follow. In post, you can add a subtle glow/highlight to the cursor for emphasis.

6. **Glitch transitions are your brand.** The WATCHTOWER UI uses a cyberpunk aesthetic. Use a subtle RGB-split or scan-line glitch when transitioning between pages (Dashboard → Attack → Network Map). This reinforces the system's identity and makes the edit feel intentional, not just "a screen recording."

7. **Sound design matters more than you think.** Even a basic ambient drone under Act 1 and a rising synth under Act 3 will elevate this from "screen recording" to "cinematic demo." Use free tools: Audacity for voice cleanup, Freesound.org for ambient beds.

8. **Export for the hackathon stage.** If projecting on a hall screen, export at 1080p H.264 at 10-15 Mbps. If submitting a video file, export at 1080p H.265 (HEVC) at 8 Mbps for smaller file size with identical quality. Test playback on the actual presentation machine beforehand.

9. **Subtitles are mandatory.** Indian hackathon judging panels may have members who don't share your first language. Burn in SRT subtitles at the bottom. Use white text with a subtle black outline for legibility against any background.

10. **The opening hook.** The first 10 seconds (dark screen, cursor blink, packet data) are the most important. They set the tone. If judges are checking phones during other teams' demos, this opening will make them look up. Don't rush it. Let the darkness breathe.

---

*Script written for WATCHTOWER — PS-26145, Smart India Hackathon 2026*
*System runs on synthetic/mock data for demonstration purposes.*
