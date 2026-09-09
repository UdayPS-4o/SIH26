# EKADHARA — Demo Video Script V2
**SIH26145 · National Technical Research Organisation**
**Hard limit: 120 seconds · Screen recording only · No talking head**

---

## 1. PRE-PRODUCTION CHECKLIST

### Equipment & Environment

| Item | Specification |
|---|---|
| **Browser** | Google Chrome (latest stable) |
| **Window mode** | Incognito window (Ctrl+Shift+N) — avoids cached state, extension interference |
| **Window size** | 1920 x 1080 exactly. Resize browser BEFORE recording. Use F11 for fullscreen. |
| **Extensions** | Disable ALL extensions. Chrome menu → More Tools → Extensions → toggle off every one. |
| **Notifications** | Windows Settings → System → Notifications → turn OFF during recording. Also disable Slack, Teams, email clients. |
| **Desktop** | Clean desktop wallpaper (dark/neutral). No personal files, no taskbar icons visible in screen corners. |
| **Browser chrome** | Bookmark bar hidden (Ctrl+Shift+B to toggle). Tab strip minimal — one tab only: the EKADHARA URL. |
| **URL bar** | Hide with F11 fullscreen. If URL must be visible, use `localhost:5173` (local dev server). |
| **Cursor** | Enable cursor highlight in OBS (or use Windows Cursor FX / a large cursor scheme). Minimum cursor size: system default or larger. |
| **Click sound** | Optional: record keyboard click sounds separately, mix in post. |

### Dashboard State to Pre-Load

Open the app and set this EXACT state BEFORE hitting record:

```
1. Browser at http://localhost:5173 (or wherever the dev server runs)
2. Wait for full page load — all six metric cards populated, traffic visualizer animating
3. Dark mode is ON (default — the dark ops-center aesthetic)
4. Diode Mode toggle:      OFF   (full duplex — default state)
5. ACK-Shadow toggle:      ON    (default state)
6. Egress Lockdown:        ACTIVE (always on, non-interactive)
7. Alert Feed: scrolling live (new alerts appearing every ~1-2 seconds)
8. No alert detail modal open
9. Metrics panel showing:  Alerts: ~1,247 | Throughput: ~47.2 K flows/s | Detection Rate: ~96.8% | Memory: ~34% | CPU: ~42% | Network I/O: ~1.24 Gbps
```

### Dev Server

```bash
cd C:/Users/udayps/Documents/SIH26/26145
npm run dev
```

Confirm `localhost:5173` loads with dark theme, sidebar showing EKADHARA logo, all cards animating.

### Recording Settings (OBS)

| Setting | Value |
|---|---|
| **Resolution** | 1920 x 1080 |
| **FPS** | 60 |
| **Encoder** | NVIDIA NVENC H.264 (or Software x264 if no GPU) |
| **Bitrate** | 25,000 Kbps (CBR) |
| **Format** | MP4 |
| **Recording source** | Display Capture (full display) or Window Capture (Chrome) |
| **Audio** | Record microphone input for narration. No desktop audio needed. |
| **Hotkey** | Set a record start/stop hotkey so you never need to click OBS during recording |

### Rehearsal

- Rehearse the ENTIRE click path **5 times** before recording. Each cursor movement must be deliberate. No hunting for elements.
- Record a **full dry run** (no narration) to verify timing and that no loading spinners appear.
- Time each segment individually and make sure they add up to ≤ 120 seconds.

---

## 2. SHOT-BY-SHOT SCRIPT

### Scene A — COLD OPEN (0:00 – 0:10)

**What's on screen:**
- Black background, centered white text. Hold for 3 seconds.
- Text fades/scales in smoothly.

```
The standard approach to this problem
scores 0.9 on full-duplex traffic.

On the data diode NTRO described,
it scores 0.4 — and never reports a problem.
```

- At 0:07, a two-group bar chart animates in (drawn from PPT-FINAL.md Slide 1 kill shot):
  - Left group "Full-Duplex": bar at 0.9, label "Standard approach"
  - Right group "Diode Capture": bar drops to 0.4, label turns RED
  - EKADHARA bar stays at 0.8 across both

**Narration (VO):**
> *"The standard approach to this problem loses more than half its detection capability on a real data diode — and never tells you."*

**Captions:** Burn in the exact narration text, bottom third, white text, dark semi-transparent background bar.

**Transition:** Hard cut at 0:10.

**Cursor:** None needed. This is a title card.

---

### Scene B — SYSTEM BOOT (0:10 – 0:22)

**What's on screen:**
- Switch to Chrome showing `http://localhost:5173`.
- If possible, record the page ACTUALLY LOADING (refresh the page just before this shot).
- The EKADHARA dashboard materializes: dark background (#0a0e17), sidebar slides in from left, cards fade in.

**Camera movement:**
- Start zoomed slightly out to show the full page loading.
- At 0:14, zoom to 100% (1:1 pixels).

**What to point out (cursor moves to each element, pausing 1 second on each):**

1. **0:12** — Cursor to the EKADHARA logo in sidebar (top-left, cyan-to-blue gradient square with "E").
2. **0:14** — Cursor sweeps across the six metric cards in the MetricsPanel. Briefly pause on each:
   - "Active Alerts: 1,247"
   - "Throughput: 47.2 K flows/s"
   - "Detection Rate: 96.8%"
   - "Memory Usage: 34%"
   - "CPU Load: 42%"
   - "Network I/O: 1.24 Gbps"
3. **0:18** — Cursor to the Sidebar system status section (bottom of sidebar):
   - Capture: **ACTIVE** (green pulsing dot)
   - Analysis: **STREAMING** (green pulsing dot)
   - Egress: **LOCKED** (lock icon, cyan text)

**Narration (VO):**
> *"EKADHARA running on a standard laptop. Forty-seven thousand flows a second, zero drops. The system status at the bottom tells the story: capture active, analysis streaming, and egress — locked."*

**Captions:** Burn in narration. At 0:18, overlay a text badge: `EGRESS LOCKED · KERNEL-ENFORCED` for 2 seconds.

**Transition:** Smooth cut at 0:22.

---

### Scene C — LIVE FEED DEMO (0:22 – 0:50)

**What's on screen:**
- Full dashboard in default view. Alert Feed on the right side is actively scrolling.
- Traffic Visualizer (canvas with animated packets flowing left to right) is visible in the middle.
- MetricsPanel at the top with live-updating sparklines.

**Sequence of actions:**

1. **0:22 – 0:28** — Let the alert feed scroll. The viewer should see 3-4 new alerts appear:
   - Each alert row shows: threat icon, threat name (e.g., "C2 Beaconing"), severity badge (HIGH), timestamp, src IP → dst IP, confidence %, validity chip.
   - New alerts animate in from the top with a slide-down effect (the `.new` CSS class).

2. **0:28 – 0:35** — Click on a **CRITICAL severity** alert in the feed (one with 📤 Data Exfiltration icon is ideal).
   - The AlertDetail modal opens: dark overlay backdrop, centered card.
   - Show the header: threat icon, threat name, severity badge, src IP → dst IP.
   - Pause here for 1 second.

3. **0:35 – 0:42** — Scroll down within the modal to reveal:
   - Confidence bar (cyan-to-purple gradient)
   - Key Detected Features section — shows 3-4 features like `packet_rate`, `byte_ratio`, `interval_variance` with importance bars
   - Evidence Hash (SHA-256): `a3f2c8...`
   - **Data Validity chip: MEASURED** (green) — linger here 2 seconds

4. **0:42 – 0:47** — Click the **"Evidence" tab** in the modal (top tab bar: Overview / Timeline / Evidence / Related).
   - Shows Feature Importance section again + Evidence Hash + Data Validity.

5. **0:47 – 0:50** — Click **"Close"** button (top right X or bottom Close button). Modal dismisses. Back to dashboard.

**Narration (VO):**
> *"Live replay, forty-seven thousand flows a second, zero drops. Every alert carries its own evidence — because in an air gap the analyst cannot verify anything independently. Including whether each number was measured or estimated."*

**Captions:** Burn in narration. At 0:40, overlay: `VALIDITY: MEASURED ✓` badge near the validity chip.

**Transition:** Smooth cut at 0:50.

**Cursor:** Use a circular highlight or a bright-colored cursor trail so every click is visible. When clicking an alert, slow down for 0.3s on the click.

---

### Scene D — THREAT MAP (0:50 – 1:05)

**What's on screen:**
- Scroll down to reveal the ThreatMap component (network topology visualization on canvas).
- Shows 8 nodes: Firewall, Core Switch, App Server, DB Server, IoT Gateway, Workstation, Sensor Net, Internet.
- Connections drawn as dashed lines between nodes.
- Animated flow dots traveling along connections.
- Node statuses: most GREEN (safe), IoT Gateway YELLOW (warning), Workstation RED (critical).

**Sequence of actions:**

1. **0:50 – 0:53** — Cursor moves to ThreatMap card title: "Network Topology". Pause.
2. **0:53 – 0:57** — Cursor hovers over the **Workstation** node (WS-Engineering-12, bottom center, RED status). Tooltip appears:
   - Shows device name, IP (10.0.3.5), status: "critical"
3. **0:57 – 1:00** — Cursor moves to hover over the **IoT Gateway** node (top-left area, YELLOW). Tooltip: "IoT-Gateway-North, 10.0.2.1, status: warning"
4. **1:00 – 1:03** — Cursor pans to the **Sensor Net** node and hovers. Tooltip: "Sensor-Hub-01, 10.0.4.0/24, status: safe"
5. **1:03 – 1:05** — Cursor moves away. All tooltips dismiss.

**Narration (VO):**
> *"The topology map shows every device in the monitoring enclave. Green for safe, amber for anomalous, red for compromised. An analyst can see the blast radius of an attack in one glance — without querying a single external database."*

**Captions:** None needed here — the visual speaks for itself. If adding captions, keep them minimal: `BLAST RADIUS VISIBLE` at 0:55.

**Transition:** Smooth cut / scroll at 1:05 to bring the Degradation Matrix into full view.

---

### Scene E — DIODE TOGGLE ★ (1:05 – 1:40) — THE HERO MOMENT

**This is 35 seconds. Everything else exists to set this up.**

**What's on screen:**
- The Degradation Matrix card is fully visible.
- Above it (or in the same card), the Diode Configuration panel with three toggle switches:
  - **Diode Mode** (currently OFF — grey toggle, label "Full duplex (both directions)")
  - **ACK-Shadow** (currently ON — cyan toggle, label "Reconstructing reverse channel")
  - **Egress Lockdown** (ACTIVE — green indicator, non-interactive)

The Degradation Matrix shows six rows, each with two horizontal bars:
- BOTH (full duplex): all bars at ~94%, ~93%, ~91%, ~88%, ~86%, ~89%
- FWD (forward only): same scores initially

**Sequence of actions:**

1. **1:05 – 1:08** — Cursor moves deliberately to the **Diode Mode** toggle. Pause on the label "Full duplex (both directions)" for 1 second. This tells the viewer what's about to change.

   **VO (1:06):** *"Everything so far assumed we see both directions. NTRO described a diode. So let's make the diode real."*

2. **1:08 — THE CLICK** — Click the **Diode Mode** toggle from OFF to ON.
   - The toggle slides right, glows cyan, label changes to "Unidirectional (one-way)".
   - **Slow the footage by 50% for 0.5 seconds** on the click. This is the moment.
   - The Degradation Matrix bars animate:
     - Recon / Port Scan: 94% → 94% (unchanged, green)
     - Volumetric DDoS: 93% → 92% (slight dip, green)
     - C2 Beaconing: 91% → 87% (minor loss, amber border appears)
     - DGA / DNS Tunnel: 88% → 84% (minor loss, amber)
     - **Encrypted Malware: 86% → 55%** (major drop, RED border, "⚠ Degraded" badge appears)
     - Data Exfiltration: 89% → **0%** (bar goes to zero, RED border, CRITICAL badge)

   **VO (1:10):** *"Scanning: unaffected. DDoS: unaffected. Encrypted malware degrades — we lose the server-side TLS fingerprint, and there's no arithmetic trick that gets it back. We show that rather than hide it."*

   **Captions at 1:12:** Overlay text: `ENCRYPTED MALWARE: 86% → 55% · JA4S UNAVAILABLE`

3. **1:15 – 1:18** — Cursor moves to the **ACK-Shadow** toggle. It is currently ON (cyan, glowing). Hover for 1 second.
   - Label reads: "Reconstructing reverse channel".

   **VO (1:16):** *"Now watch what happens when we turn off the one thing nobody else has."*

4. **1:18 — SECOND CLICK** — Click **ACK-Shadow** toggle from ON to OFF.
   - Toggle slides left, turns grey, label changes to "Disabled — exfiltration blind".
   - The Data Exfiltration row in the Degradation Matrix: the FWD bar stays at **0%**.
   - If the Alert Feed is visible, the exfiltration alerts stop appearing.
   - **Hold this state for 2 full seconds. No narration. Let silence do the work.**

5. **1:22 – 1:25** — **VO (slow, deliberate):** *"That is what every other solution looks like on a real diode. It doesn't error. It doesn't warn. It just quietly stops finding anything — while reporting high confidence on everything else."*

   **Captions at 1:23:** `EXFILTRATION: 0% · SILENT FAILURE`

6. **1:25 – 1:28** — Click **ACK-Shadow** back **ON**.
   - Toggle slides right, glows cyan again.
   - Data Exfiltration bar in Degradation Matrix animates back up: 0% → **83%**.
   - The row border changes from red to amber, badge changes from "⚠ Degraded" to nothing (clean state).

7. **1:28 – 1:35** — Cursor scrolls up slightly to show the full Degradation Matrix with the final state:
   - All rows visible with their diode scores.
   - Note row "Encrypted Malware" stays at 55% (red) — this is the honest degradation.

   **VO (1:30):** *"TCP is a delivery-confirmation protocol. Every packet the client sends carries a receipt — 'I've received everything up to byte N.' Those receipts travel in the direction we CAN see. We never see the server's packets, but we watch that number climb — and the climb tells us exactly how much came back."*

   **Captions at 1:32:** `ACK-SHADOW: RECONSTRUCTS REVERSE CHANNEL FROM TCP ACKS`

8. **1:35 – 1:40** — Hold on the final matrix state. Let the bars and scores be visible.

   **VO (1:37):** *"Four point one gigabytes of exfiltration, reconstructed from a channel we cannot observe. That is the innovation."*

**Transition:** Cut at 1:40.

---

### Scene F — DEGRADATION MATRIX CLOSE-UP (1:40 – 1:50)

**What's on screen:**
- Zoom in on the Degradation Matrix card so it fills the frame.
- The matrix should show the FINAL state (Diode Mode ON, ACK-Shadow ON):
  - Recon / Port Scan:     BOTH 94% → FWD 94% ✓
  - Volumetric DDoS:      BOTH 93% → FWD 92% ✓
  - C2 Beaconing:         BOTH 91% → FWD 87% Minor loss
  - DGA / DNS Tunnel:     BOTH 88% → FWD 84% Minor loss
  - Encrypted Malware:    BOTH 86% → FWD 55% ⚠ Degraded (RED)
  - Data Exfiltration:    BOTH 89% → FWD 83% (ACK-Shadow recovered)

- The note at the bottom of the card reads:
  > *"Encrypted malware detection degrades under diode capture because JA3S (server hello) becomes unavailable. ACK-Shadow recovers exfiltration volume from TCP acknowledgment arithmetic. All scores measured on paired captures."*

**Actions:**
1. **1:40 – 1:43** — Cursor moves to the "Encrypted Malware" row. The red bar at 55% is the focus.
2. **1:43 – 1:46** — Cursor moves down to the "Data Exfiltration" row. The amber bar at 83% with ACK-Shadow active.
3. **1:46 – 1:50** — Cursor moves to the note text at the bottom. Brief pause.

**Narration (VO):**
> *"This is the degradation matrix. Every number measured on paired captures — full duplex and one-way, same traffic, same models. The red row is honest: we lose JA3S and there is no fix. The exfiltration row has a fix — and we built it."*

**Captions at 1:47:** `ALL SCORES: MEASURED · ZERO SILENT FAILURES`

**Transition:** Cut at 1:50.

---

### Scene G — CLOSE (1:50 – 2:00)

**What's on screen:**
- Cut to a static summary card. Dark background, centered text.
- Or: return to full dashboard view, dimmed, with a final overlay card.

```
                  E K A D H A R A
             See everything. Touch nothing.

    ✔  Runs with --network none.  No internet. Ever.
    ✔  Alerts emit as OCSF — plugs into any SIEM.
    ✔  Merkle-sealed ledger — no alert can be altered.
    ✔  Replay is deterministic — re-run, get our numbers.

        SIH26145 · NTRO · See everything. Touch nothing.
```

- The EKADHARA logo (cyan-to-blue gradient "E" square) appears top-left of the card.
- The tagline "See everything. Touch nothing." appears below the name.

**Narration (VO):**
> *"Everything you saw ran with no network, from a container you could carry into a facility on a USB stick. EKADHARA — see everything, touch nothing."*

**Captions:** Burn in the full narration text. At 1:58, overlay: `SIH26145 · EKADHARA · NTRO` in the bottom center.

**Transition:** Fade to black at 2:00.

---

## 3. FULL NARRATION SCRIPT (Line by Line, Timed)

| Timecode | Line |
|---|---|
| 0:00 | *(silence — text card on screen)* |
| 0:04 | The standard approach to this problem loses more than half its detection capability on a real data diode — and never tells you. |
| 0:10 | *(cut)* |
| 0:12 | EKADHARA running on a standard laptop. |
| 0:14 | Forty-seven thousand flows a second, zero drops. |
| 0:17 | The system status at the bottom tells the story: capture active, analysis streaming, and egress — locked. |
| 0:22 | *(cut)* |
| 0:23 | Live replay, forty-seven thousand flows a second, zero drops. |
| 0:27 | Every alert carries its own evidence — because in an air gap the analyst cannot verify anything independently. |
| 0:34 | Including whether each number was measured or estimated. |
| 0:42 | *(click into alert detail)* |
| 0:47 | *(click close)* |
| 0:50 | *(cut)* |
| 0:52 | The topology map shows every device in the monitoring enclave. |
| 0:55 | Green for safe, amber for anomalous, red for compromised. |
| 0:58 | An analyst can see the blast radius of an attack in one glance — without querying a single external database. |
| 1:05 | *(cut)* |
| 1:06 | Everything so far assumed we see both directions. |
| 1:08 | NTRO described a diode. So let's make the diode real. |
| 1:10 | *(CLICK — Diode Mode ON)* |
| 1:11 | Scanning: unaffected. DDoS: unaffected. |
| 1:13 | Encrypted malware degrades — we lose the server-side TLS fingerprint, and there's no arithmetic trick that gets it back. |
| 1:16 | We show that rather than hide it. |
| 1:18 | *(CLICK — ACK-Shadow OFF)* |
| 1:22 | *(2 seconds of silence)* |
| 1:23 | That is what every other solution looks like on a real diode. |
| 1:26 | It doesn't error. It doesn't warn. |
| 1:28 | It just quietly stops finding anything — while reporting high confidence on everything else. |
| 1:32 | *(CLICK — ACK-Shadow ON)* |
| 1:34 | TCP is a delivery-confirmation protocol. |
| 1:36 | Every packet the client sends carries a receipt — "I've received everything up to byte N." |
| 1:39 | Those receipts travel in the direction we CAN see. |
| 1:41 | We never see the server's packets, but we watch that number climb — and the climb tells us exactly how much came back. |
| 1:46 | Four point one gigabytes of exfiltration, reconstructed from a channel we cannot observe. |
| 1:50 | *(cut)* |
| 1:51 | This is the degradation matrix. |
| 1:53 | Every number measured on paired captures — full duplex and one-way, same traffic, same models. |
| 1:57 | The red row is honest: we lose JA3S and there is no fix. |
| 1:59 | The exfiltration row has a fix — and we built it. |
| 2:00 | *(cut)* |
| 2:02 | Everything you saw ran with no network, from a container you could carry into a facility on a USB stick. |
| 2:07 | EKADHARA. See everything. Touch nothing. |

---

## 4. POST-PRODUCTION NOTES

### Captions

| Property | Value |
|---|---|
| **Font** | Inter or Space Grotesk (same as dashboard), 22–24 pt, semi-bold |
| **Position** | Bottom third, centered. Above any safe-area margin. |
| **Background** | Semi-transparent dark bar (`rgba(10, 14, 23, 0.75)`) behind text for readability |
| **Text color** | White (`#f1f5f9`) |
| **Outline** | None, or subtle 1px dark outline for contrast |
| **Special captions** | Key stats (scores, toggle names) in cyan (`#00d4ff`) when they appear on screen |
| **Timing** | Captions appear 0.3s after the corresponding VO starts. Remove 0.5s before VO ends. |
| **Tool** | Use OBS text source, DaVinci Resolve captions, or Premiere Pro Essential Graphics |

### Sound Design

| Element | Recommendation |
|---|---|
| **VO recording** | Record in a quiet room with a USB condenser mic. Normalize to -16 LUFS. |
| **Click sounds** | Record 3–4 clean mechanical keyboard/mouse clicks. Layer at -30 dB under toggle clicks only. Not on every click. |
| **Alert beep** | Optional: a subtle, short (0.1s) tonal beep when a new alert appears in the feed. Keep it at -40 dB. |
| **Background music** | None, or a single quiet ambient bed at -25 dB. A low drone or subtle electronic pulse. Do NOT use music that draws attention. The dashboard audio IS the content. |
| **Silence** | The 2-second hold at 1:18–1:20 (ACK-Shadow off, exfiltration at 0%) must have NO audio. This is the most important creative decision in the video. |

### Color Grading

| Property | Recommendation |
|---|---|
| **Contrast** | Raise slightly (+5–10) for projector visibility. NTRO judges may view on projectors. |
| **Blacks** | Keep at current levels. The dark ops-center aesthetic (#0a0e17 background) is already optimized for projectors. |
| **Accent color** | Preserve the cyan (#00d4ff) pop on toggles and active states. Do not shift toward blue. |
| **No color cast** | Keep neutral white balance. No warm/cool grade. |
| **Text legibility** | Ensure all dashboard text remains ≥ 18pt equivalent after YouTube re-encoding. |

### Zoom / Pan Effects

| Shot | Effect | Purpose |
|---|---|---|
| 0:10–0:14 | Slow zoom from 80% → 100% | Page loading reveal |
| 1:05–1:08 | Slow zoom into Diode Mode toggle (110%) | Build tension before click |
| 1:40–1:50 | Zoom to 125% on Degradation Matrix | Make scores readable at any screen size |
| All other shots | Static, no zoom | Avoid motion sickness / distraction |

### Export Settings

| Property | Value |
|---|---|
| **Resolution** | 1920 x 1080 |
| **FPS** | 60 (match recording) |
| **Codec** | H.264, CRF 18 (high quality) |
| **Audio** | AAC, 192 kbps, stereo |
| **File size target** | ≤ 100 MB if possible |
| **Upload** | YouTube unlisted + MP4 on USB stick |

### Final QC Checklist

- [ ] Watch once **muted** at 1.5× speed. Does the story still land?
- [ ] Watch once **with sound** at 1×. Does narration sync with actions?
- [ ] Verify all numbers on screen match the PPT-FINAL.md Slide 3 degradation matrix
- [ ] Verify the kill shot bar chart matches the PPT-FINAL.md Slide 1 exactly
- [ ] Confirm no personal information, file paths, or usernames visible in any frame
- [ ] Confirm no loading spinners visible in any frame (pre-load everything)
- [ ] Confirm the ACK-Shadow toggle sequence is clean (3 takes, pick best)
- [ ] Confirm captions are readable on a phone screen (test at 360px width)

---

## 5. BACKUP PLAN

### If Something Crashes Mid-Recording

| Failure | Recovery |
|---|---|
| **Browser crash during Scene C (live feed)** | Have the Degradation Matrix pre-loaded in a separate tab. Cut to Scene E early. The diode toggle is the hero moment — it carries the video. |
| **Browser crash during Scene E (the toggle)** | This is the worst-case scenario. Have 3 pre-recorded takes of the toggle sequence saved as separate video clips. Edit the best one into the final cut. |
| **Dev server crashes** | Restart with `npm run dev`. Have the `dist/` build ready as fallback (`npm run build` then serve the `dist` folder with `npx serve dist`). |
| **Alert feed not scrolling** | Use the pause button in the AlertFeed to freeze a rich set of alerts. Click into any alert for the evidence panel. The evidence panel is static and always works. |
| **Diode toggle animation laggy** | Pre-render the Degradation Matrix transition. Take a screenshot at each state (both-duplex, diode-only, diode+ack, diode-no-ack) and use image swaps with crossfade transitions instead of live interaction. |
| **VO recording has errors** | Re-record individual lines. The script is broken into discrete timecodes, so you can punch in and re-record any single line without redoing the whole thing. |

### Screenshots to Pre-Capture (Have These Ready)

1. `kill-shot.png` — The two-group bar chart from PPT Slide 1 (for Scene A)
2. `degradation-final.png` — Degradation Matrix at final state: Diode ON, ACK-Shadow ON (for Scene F backup)
3. `evidence-panel.png` — Alert detail modal showing MEASURED validity chip (for Scene C backup)
4. `topology-critical.png` — ThreatMap with Workstation node in critical state (for Scene D backup)

### 3 Backup Takes of the Diode Toggle Sequence

Record the entire Scene E (1:05–1:40) THREE times. Label them:
- `take1-toggle.mp4` — First attempt
- `take2-toggle.mp4` — Second attempt (usually cleaner)
- `take3-toggle.mp4` — Third attempt (fallback)

Pick the cleanest take where:
- The click is clearly visible
- The bars animate smoothly
- The ACK-Shadow toggle click is sharp
- No cursor wobble or unintended scroll

### If You Must Cut to 60 Seconds

**Run this version. It preserves only the essential moments:**

| Segment | Start | End | Duration |
|---|---|---|---|
| A. Cold open (kill shot) | 0:00 | 0:10 | 10s |
| E. Diode toggle ★ (condensed) | 0:10 | 0:52 | 42s |
| G. Close | 0:52 | 1:00 | 8s |

**Condensed narration for 60s version:**

> *"The standard approach loses half its detection on a real diode and never reports it. EKADHARA runs with no network, forty-seven thousand flows a second. Watch. Diode mode ON — scanning unaffected, DDoS unaffected, encrypted malware degrades to 55%, exfiltration drops to zero. ACK-Shadow OFF — exfiltration is completely blind. This is what every other solution looks like: silent failure. ACK-Shadow ON — exfiltration recovers to 83%. We reconstruct the reverse channel from TCP acknowledgment arithmetic. Every number measured, every degradation declared. EKADHARA — see everything, touch nothing."*

---

## APPENDIX: Dashboard URL Structure

```
http://localhost:5173
└── Dashboard (default page)
    ├── MetricsPanel (6 stat cards with sparklines)
    ├── TrafficVisualizer (animated packet flow canvas)
    ├── ThreatMap (network topology canvas)
    ├── AlertFeed (live scrolling alerts)
    ├── DegradationMatrix (interactive, responds to toggles)
    ├── EvidencePanel (alert detail modal, triggered by clicking an alert)
    └── DiodeConfiguration (three toggles: Diode Mode, ACK-Shadow, Egress Lockdown)
```

### Key CSS Classes for Reference (when highlighting elements)

| Element | CSS Class | Visual Cue |
|---|---|---|
| Sidebar | `.ek-sidebar` | Fixed left, 260px wide, dark card background |
| Active nav item | `.ek-sidebar-item.active` | Cyan highlight, border glow |
| Metric card | `.ek-card` | Dark card, border, rounded corners, hover glow |
| Alert row (new) | `.ek-alert-row.new` | Slides in from top with animation |
| Critical badge | `.ek-badge-critical` | Red background, red text, red border |
| Validity chip (MEASURED) | `.ek-chip-measured` | Green background, green text |
| Diode toggle (active) | `.ek-toggle-button.active` | Cyan gradient, white slider, glow |
| ACK toggle (active) | `.ek-toggle-button.active` (purple variant) | Purple gradient |
| Egress lock indicator | `.ek-pulse` (green dot) | Animated pulsing green circle |
| Degraded row (critical) | Red border, red-500/5 background | Visually distinct amber/red |
| Scan line animation | `.ek-scan-line` | Moving cyan line across card top edge |
