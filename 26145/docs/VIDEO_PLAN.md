# VIDEO PLAN — EKADHARA Demo Video + Dashboard Specifications

**SIH26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic · NTRO**
**Document owner:** Story lead
**Status:** LOCKED — every frame must produce a real recording in Week 7

---

# PART 1 — VIDEO STORYBOARD (Shot-by-Shot)

**Total runtime: 2:00 (120 seconds) exactly.**
**Format:** 1080p, 60 fps, screen recording only (no webcam, no talking head).
**Fonts:** Terminal ≥ 18 pt, dashboard at 125% zoom.
**Captions:** Burned in, high contrast, bottom third of every frame.
**Audio:** VO recorded separately in a quiet room; at most one quiet music bed at −25 dB.

---

## SCENE 1 — COLD OPEN: The Kill Shot (0:00 – 0:10) [10 s]

| Element | Detail |
|---|---|
| **Visual** | Black card with white text, centered, held 5 seconds. Text: |
| **Text on screen** | `The standard approach scores 0.9 on bidirectional traffic.`<br>`On NTRO's real data diode — it scores 0.4. And never reports a problem.` |
| **Transition** | Text fades. A side-by-side bar chart slides in from left: left bar at 0.9 (green), right bar at 0.4 (red). |
| **Caption** | `The standard approach loses more than half its detection capability on a real data diode — and never tells you.` |
| **Narration (VO)** | Same as caption. |
| **On-screen elements** | None beyond the text/chart. No logo yet. |
| **Hero moment** | N/A (this is the teaser) |

**Director note:** No intro animation. No "Team X presents." No logo splash. The first 10 seconds decide whether they keep watching. Most teams waste this on self-introduction. We use it on the single most interesting fact in the entire submission.

---

## SCENE 2 — THE SETUP: What Is a Diode (0:10 – 0:25) [15 s]

| Element | Detail |
|---|---|
| **Visual** | Animated diagram: three boxes in a row — `PROTECTED NETWORK` → `DATA DIODE` → `MONITORING ENCLAVE`. A red dashed arrow tries to go backward and gets a ✗ stamped over it. |
| **On-screen labels** | `One-way copy. No return path. No lookups. No probes. No decryption. Ever.` |
| **Caption** | `NTRO monitors critical infrastructure through hardware data diodes. Traffic is copied one way. There is no path back.` |
| **Narration (VO)** | Same as caption. |
| **Transition** | Diagram fades to a terminal window. |

**Director note:** This is pure context-setting. If the judge already knows what a diode is, they won't mind — if they don't, this is the only explanation they need. Keep it under 15 seconds.

---

## SCENE 3 — PROOF OF CONSTRAINT: The Kernel Kills Us (0:25 – 0:38) [13 s]

| Element | Detail |
|---|---|
| **Visual** | Terminal, full frame, dark background, green or white text, font ≥ 18 pt. |
| **Command typed (or pre-typed with cursor at end)** | `$ docker run --rm --network none --cap-add NET_RAW ekadhara:demo \`<br>`      --self-test-egress` |
| **Output scrolls** | `[egress-test] attempting outbound connection to 8.8.8.8:53 ...`<br>`[seccomp]     SIGSYS — syscall 'connect' denied by policy`<br>`[audit]       egress attempt logged · pid 1 · terminated`<br>`[result]      READ-ONLY ENFORCED ✔` |
| **Cursor** | Stays on the last line for 2 seconds so the ✔ is visible. |
| **Caption** | `Every team will claim read-only. We let the kernel enforce it. That process tried to phone home — and was killed.` |
| **Narration (VO)** | Same as caption. |
| **Transition** | Terminal closes; dashboard fades in. |

**Director note:** Record this for real. It takes 10 minutes to set up a seccomp profile and it is the most credible 13 seconds in the video. Never mock this output.

---

## SCENE 4 — LIVE DASHBOARD: Alerts + Evidence (0:38 – 0:55) [17 s]

| Element | Detail |
|---|---|
| **Visual** | Dashboard loads. Browser chrome hidden (F11). |
| **HUD (top-right corner, always visible)** | `47,200 flows/s · drop 0.00% · p99 84 ms` |
| **Main area: Alert Feed** | Alerts scroll in from the top. Colors: red for critical, amber for warning. Each alert row: `[timestamp] [threat class] [src → dst] [confidence]`. |
| **Action** | Cursor clicks a beaconing alert row. |
| **Evidence Panel (slides in from right)** | Shows: |
| — Inter-arrival histogram | Bar chart, visibly regular pattern at ~60s intervals |
| — Metrics | `60 s interval · 30% jitter` |
| — SHAP top-3 | Three horizontal bars: `iat_bowley_skew: 0.41` `iat_mad_ratio: 0.33` `size_bowley_skew: 0.19` |
| — Evidence hash | `SHA-256: 9f2c3a7b...` |
| — Validity chips | `MEASURED` (green) · `ESTIMATED` (amber) · `MISSING` (red) — three colored badges |
| **Cursor lingers** | On the validity chips for 2 full seconds. |
| **Caption** | `Live replay: 47,200 flows/sec, zero drops, p99 84ms. Every alert carries its own evidence. Because in an air gap, the analyst cannot verify anything independently.` |
| **Narration (VO)** | Same as caption, with extra: `Including whether each number was measured, estimated, or simply missing.` |
| **Transition** | Evidence panel closes. Cursor moves to the DIODE MODE toggle. |

**Director note:** Pre-load both PCAP files (BI and FWD) before recording so no loading spinner appears. Rehearse the click path 5 times.

---

## SCENE 5 — ★ THE HERO MOMENT: Diode Toggle + ACK-Shadow (0:55 – 1:40) [45 s]

**This is 45 seconds of the 120. Everything else exists to set it up.**

### 5a — The Toggle (0:55 – 1:08) [13 s]

| Element | Detail |
|---|---|
| **Visual** | A physical-looking toggle switch in the dashboard header, labeled `DIODE MODE`. Currently shows `BOTH DIRECTIONS`. |
| **Action** | Cursor moves to toggle. **Slow-motion 1-second hold on the click.** This is the moment of the video. |
| **Label changes to** | `FWD ONLY` |
| **Degradation panel** | Populates row by row with a counting animation (subtle, ~0.5s per row): |
| | `Recon / port scan     0.94 → 0.94  ✔ unaffected` |
| | `Volumetric DDoS       0.93 → 0.92  ✔ unaffected` |
| | `C2 beaconing          0.91 → 0.87  ✔ minor` |
| | `DGA / DNS tunnel      0.88 → 0.84  ✔ minor` |
| | `Encrypted malware     0.86 → 0.55  ⚠ JA4S lost — no fix` |
| | `Data exfiltration     0.89 → ...   (pending)` |
| **Caption** | `Scanning: unaffected. DDoS: unaffected. Encrypted malware degrades — we lose the server-side TLS fingerprint. We show that rather than hide it.` |
| **Narration (VO)** | Same as caption. |

### 5b — ACK-Shadow Toggle OFF (1:08 – 1:16) [8 s]

| Element | Detail |
|---|---|
| **Visual** | Second toggle appears: `ACK-SHADOW` (currently ON). Cursor clicks it **OFF**. |
| **Effect** | The exfiltration row completes: `0.89 → 0.00`. The exfiltration alert stream **stops entirely**. The alert feed goes quiet. |
| **Action** | **Hold the silence for 2 full seconds.** No VO. Let the empty alert feed sit there. The HUD keeps ticking. |
| **Caption** | (appears during silence): `That is what every other solution looks like on a real diode.` |
| **Narration (VO, slower)** | `It doesn't error. It doesn't warn you. It just quietly stops finding anything — while reporting high confidence on everything else.` |

### 5c — ACK-Shadow Toggle ON (1:16 – 1:28) [12 s]

| Element | Detail |
|---|---|
| **Visual** | Cursor clicks `ACK-SHADOW` back **ON**. |
| **Effect** | Exfiltration alerts resume. Row fills: `0.89 → 0.83`. An alert appears: `~4.1 GB egress · 10.2.4.9 → 203.0.113.9`. |
| **Caption** | `TCP is a delivery-confirmation protocol. Every packet the client sends carries a receipt: "I've received everything up to byte N."` |
| **Narration (VO)** | `Those receipts travel in the direction we can see.` |

### 5d — ACK-Shadow Diagram Overlay (1:28 – 1:40) [12 s]

| Element | Detail |
|---|---|
| **Visual** | Split-screen overlay appears. Left side: `VISIBLE` direction, showing ACK numbers climbing. Right side: `INVISIBLE`, showing the bytes being recovered. |
| **Diagram** | `VISIBLE` side: `ack = 1,461` → `ack = 5,001,000`<br>`INVISIBLE` side (animated arrow): `1,460 bytes` → `~5 MB`<br>`Δack = what we cannot see` |
| **VO** | `We never see the server's packets. But we watch that number climb — and the climb tells us exactly how much came back. Four point one gigabytes, reconstructed from arithmetic on a channel we cannot observe.` |
| **Transition** | Diagram and dashboard fade. |

**Director note:** Rehearse the toggle sequence 20 times. It is the single most important interaction in the project. Every cursor movement must be deliberate. No hunting for UI elements.

---

## SCENE 6 — CONNECTED DEVICES: Device Connectivity Visualization (1:40 – 1:52) [12 s]

| Element | Detail |
|---|---|
| **Visual** | New dashboard panel slides in: `CONNECTED DEVICES`. Shows a network topology map. |
| **Devices displayed** | |
| — Industrial sensors | 4 nodes, green indicators, labels: `TempSensor-01`, `PressureSensor-03`, `FlowMeter-02`, `Vibration-04` |
| — Gateways | 2 nodes, amber indicators: `SCADA-GW-01`, `IoT-GW-02` |
| — Endpoints / workstations | 3 nodes: `HMI-Screen-01`, `Engineering-02`, `Historian-03` |
| — The monitored target | 1 node, pulsing red outline: `Transformer-01 (10.2.4.9)` |
| **Connections** | Animated lines between devices, with packet flow dots traveling along them. Color: green = normal, amber = elevated, red = alert. |
| **Alert routing** | One device (Transformer-01) gets a red highlight. A notification badge shows `2 active alerts routed to this device`. |
| **Fingerprint display** | Clicking a device shows its fingerprint: `JA4: 771,4865,0-` `OS: Windows Server 2019` `First seen: 14 days ago` `Packets: 2.4M · Bytes: 1.8GB` |
| **Caption** | `Six devices. Real-time status. Every device fingerprinted from traffic alone — no agent, no lookup.` |
| **Narration (VO)** | `Six devices on this network, all fingerprinted from the traffic alone. No agent installed, no lookup performed. The exfiltration alert routes directly to the source device — Transformer-01 — so the analyst knows exactly where to look.` |
| **Transition** | Devices panel collapses. |

**Director note:** This scene was added to make the video more impressive for judges who want to see operational breadth. It demonstrates that EKADHARA isn't just a packet counter — it maps to real infrastructure.

---

## SCENE 7 — MEMORY CHART: Constant Memory Under Burst (1:52 – 2:00) [8 s]

| Element | Detail |
|---|---|
| **Visual** | Line chart, two lines. X-axis: offered load (1× → 10×). Y-axis: resident memory (MB). |
| **Red line** | Climbs steeply, ends with `OOM ✗` at ~5× load. Label: `Naive detector (HashMap per src IP)` |
| **Blue line** | Dead flat across the entire range. Label: `EKADHARA (CMS + HyperLogLog)` |
| **HUD overlay** | Shows current rate ramping: `12,000 → 120,000 flows/s` |
| **Caption** | `Our memory is flat at any rate. Most detectors get DoS'd by the DDoS they're detecting.` |
| **Narration (VO)** | Same as caption. |
| **Final frame** | Holds for 3 seconds on the flat blue line. |

**Director note:** If time is tight, this scene can be trimmed to 5 seconds. The diode toggle is non-negotiable. This scene is polish.

---

## TIMING TABLE (Master Reference)

| # | Scene | Start | Dur | Purpose | Can cut? |
|---|---|---|---|---|---|
| 1 | Cold open — kill shot | 0:00 | 0:10 | Hook | NO |
| 2 | Diode setup | 0:10 | 0:15 | Context | YES (−5s) |
| 3 | Egress lockdown proof | 0:25 | 0:13 | Credibility | NO |
| 4 | Live dashboard + evidence | 0:38 | 0:17 | It works | YES (−5s) |
| 5 | ★ Diode toggle + ACK-Shadow ★ | 0:55 | 0:45 | The whole submission | NEVER |
| 6 | Connected devices panel | 1:40 | 0:12 | Operational breadth | YES (−7s) |
| 7 | Memory chart | 1:52 | 0:08 | Engineering depth | YES (−3s) |

**Minimum viable video (60 seconds):** Scene 1 (10s) + Scene 3 (13s) + Scene 5 (37s) = 60s. Everything else is enhancement.

---

# PART 2 — CONNECTED DEVICES MODULE

## Purpose

The Connected Devices module demonstrates that EKADHARA operates at the level of **named infrastructure assets**, not just abstract network flows. This makes the demo operationally credible and visually impressive for judges who expect to see devices they recognize (sensors, SCADA gateways, HMIs).

## Dashboard Component

### Topology View (primary visualization)

```
┌─────────────────────────────────────────────────────────────────┐
│  CONNECTED DEVICES                                    [grid] [list] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           ● Sensor-01          ● GW-SCADA        ● HMI-01      │
│           (green)              (amber)           (green)        │
│             │                   │                  │            │
│             └─────────┬─────────┘                  │            │
│                       │                              │            │
│              ● Sensor-03    ★ Transformer-01          │          │
│              (green)        (RED PULSE)               │          │
│                               │                       │          │
│                               └───────────● Historian-03 (green) │
│                                                                 │
│  ┌─ Device Detail ───────────────────────────────────────────┐  │
│  │  Transformer-01  10.2.4.9   ● 2 alerts   ▲ Risk: HIGH    │  │
│  │  JA4: 771,4865,0-  OS: WinServer2019  First seen: 14d ago │  │
│  │  Traffic: 2.4M pkts · 1.8 GB · 47 connections            │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Device List View (secondary, toggle with grid icon)

| Device | IP | Status | Alerts | JA4 Fingerprint | Traffic Volume |
|---|---|---|---|---|---|
| TempSensor-01 | 10.2.4.11 | 🟢 Online | 0 | 772,4865,0- | 12 MB |
| PressureSensor-03 | 10.2.4.12 | 🟢 Online | 0 | 772,4865,0- | 8 MB |
| SCADA-GW-01 | 10.2.4.1 | 🟡 Degraded | 1 | 771,52243,1- | 340 MB |
| **Transformer-01** | **10.2.4.9** | 🔴 **Alert** | **2** | **771,4865,0-** | **1.8 GB** |
| HMI-Screen-01 | 10.2.4.21 | 🟢 Online | 0 | 771,4865,0- | 45 MB |
| Historian-03 | 10.2.4.31 | 🟢 Online | 0 | 771,4865,0- | 890 MB |

## Implementation Requirements

### Device Fingerprinting (passive, from traffic only)

```
Per observed flow, extract:
  1. JA4 TLS fingerprint → maps to known client software
  2. TCP window size + TTL distribution → OS fingerprint heuristic
  3. Protocol mix (ports used, services offered) → device type heuristic
  4. Traffic pattern (volume, regularity, destinations) → role classification
  5. First-seen timestamp → asset age on network
```

**No agent required. No lookup required.** All fingerprinting is derived from the same captured packets the detectors already process.

### Alert Routing to Devices

When a detector fires:
1. Extract the source IP from the alert.
2. Look up the device record (from a static operator-supplied manifest, mounted read-only at startup).
3. Annotate the alert with: `device_id`, `device_name`, `device_type`, `asset_criticality`.
4. The dashboard routes the alert to that device's card with a visual indicator (red border, badge count).

### Operator Asset Manifest Format

```json
{
  "assets": [
    {
      "ip": "10.2.4.9",
      "name": "Transformer-01",
      "type": "power_equipment",
      "criticality": "HIGH",
      "expected_peers": ["10.2.4.1", "10.2.4.31"],
      "expected_ports": [502, 443, 5353]
    },
    {
      "ip": "10.2.4.11",
      "name": "TempSensor-01",
      "type": "sensor",
      "criticality": "MEDIUM",
      "expected_peers": ["10.2.4.1"],
      "expected_ports": [502]
    }
  ]
}
```

### Build Priority

This module is **Priority 3** (see Part 5). It requires:
- A static asset manifest (JSON, operator-supplied) — trivial to create for the demo.
- Dashboard topology component — ~1 day of React work.
- Fingerprint extraction logic — piggybacks on existing JA4 parsing, ~half a day.

**Minimum for demo:** 6 devices, 1 with active alerts, topology view with click-to-detail.

---

# PART 3 — DASHBOARD UI SPECIFICATIONS

## 3.1 Main Operations Dashboard

### Layout: Three-Panel Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◉ EKADHARA          [dashboard] [devices] [reports] [settings]  [🌙] │
├──────────┬───────────────────────────────────────────┬───────────────┤
│          │                                           │               │
│ ALERT    │                                           │  METRICS      │
│ FEED     │    MAIN CANVAS                            │  HUD          │
│          │    (threat map / topology / chart)         │               │
│ (scroll  │                                           │  47.2K flows/s│
│  list,   │                                           │  0.00% drops  │
│  280px)  │                                           │  p99 84 ms    │
│          │                                           │               │
│ 🔴 Scan  │                                           │  ─────────── │
│ 🟡 Beacon│                                           │  DEGRADATION  │
│ 🔴 Exfil │                                           │  MATRIX       │
│          │                                           │               │
│ [+ alert]│                                           │  [toggle]     │
│          │                                           │               │
├──────────┴───────────────────────────────────────────┴───────────────┤
│ Status bar: Container running · Network disabled · 14 devices · v1.0  │
└──────────────────────────────────────────────────────────────────────┘
```

### Alert Feed Panel (left sidebar, 280px wide)

| UI Element | Spec |
|---|---|
| Header | `THREAT ALERTS` with live count badge |
| Alert rows | Scrollable list, newest first. Each row: `[severity icon] [time] [threat class] [src → dst] [confidence %]` |
| Severity colors | Critical: `#C0392B` red · Warning: `#E67E22` amber · Info: `#2980B9` blue |
| Click behavior | Opens evidence panel (see 3.2) |
| Empty state | `No active alerts — network is clean.` with a subtle green indicator |
| Animation | New alerts slide in from top with a subtle flash highlight that fades over 2s |

### Main Canvas (center, flexible width)

Displays one of four views, switched via tab bar:

| View | Content |
|---|---|
| **Threat Map** | Geographic or network-graph visualization of alert sources/destinations. Nodes = IPs. Edges = flows. Red = malicious, green = benign. Animated flow particles along edges. |
| **Device Topology** | Connected devices module (see Part 2). Graph layout showing devices and their connections. |
| **Traffic Timeline** | Real-time line chart: flows/sec over time, with alert events marked as vertical lines colored by threat class. |
| **Degradation Matrix** | Table showing per-detector F1 scores across BI / FWD / REV capture modes. The diode toggle live-switches the displayed mode. |

### Metrics HUD (right sidebar, 200px wide)

| Metric | Format | Update Rate |
|---|---|---|
| Throughput | `XX,XXX flows/s` | 1 Hz |
| Drop rate | `0.00%` | 1 Hz |
| p99 latency | `XX ms` | 1 Hz |
| Active alerts | `N` | On change |
| Capture mode | `BOTH / FWD / REV` | On toggle |
| ACK-Shadow | `ON / OFF` | On toggle |
| Uptime | `00:12:34` | 1 Hz |
| Memory | `XX MB` | 5 Hz |

### Diode Toggle + ACK-Shadow Toggle (top of main canvas)

```
┌─────────────────────────────────────────────────────┐
│  DIODE MODE    [BOTH DIRECTIONS ▼]    ACK-SHADOW [ON] │
│  ──────────     FWD ONLY  |  REV ONLY                │
└─────────────────────────────────────────────────────┘
```

**Interaction:** Clicking DIODE MODE opens a dropdown. Selecting FWD ONLY or REV ONLY immediately re-routes the active PCAP stream through the direction-mask filter and re-scoring begins within < 1 second. The degradation panel updates row by row with a counting animation.

**ACK-Shadow toggle:** Simple on/off switch. When toggled OFF, the ACK-Shadow estimator stops feeding the exfiltration detector. The exfiltration alert stream stops.

### Dark/Light Mode Toggle

| | Dark mode (default) | Light mode |
|---|---|---|
| Background | `#0D1117` (GitHub dark) | `#F6F8FA` |
| Card background | `#161B22` | `#FFFFFF` |
| Text | `#E6EDF3` | `#1F2328` |
| Accent | `#58A6FF` blue | `#0969DA` blue |
| Critical | `#F85149` red | `#CF222E` red |
| Border | `#30363D` | `#D0D7DE` |
| Transition | CSS `transition: background 0.3s, color 0.3s` on all elements | |

**Toggle location:** Top-right corner, sun/moon icon. Persisted in `localStorage`.

### Mobile Responsive Layout

**Breakpoints:**

| Screen width | Layout change |
|---|---|
| > 1200px | Full three-panel layout (alert feed + canvas + HUD) |
| 768px – 1200px | Alert feed collapses to a bottom drawer (swipe up). HUD moves to top bar. Canvas takes full width. |
| < 768px | Single column. Top: HUD (compact). Middle: canvas (full width). Bottom: alert feed (horizontal scroll, card-style). Device topology switches to list view. |

**Mobile-specific:**
- Toggle switches become full-width buttons.
- Alert rows truncate to `[severity] [class] [confidence]` — no source/dest shown.
- Evidence panel becomes a full-screen overlay.
- Topology view collapses to a scrollable card list.

## 3.2 Evidence Drill-Down Panel

Slides in from the right, 400px wide. Contains:

```
┌──────────────────────────────────┐
│  BEACONING ALERT           [×]   │
│  Confidence: 0.87               │
├──────────────────────────────────┤
│  INTER-ARRIVAL HISTOGRAM         │
│  ▓▓░░▓▓▓░▓▓░░▓▓▓░▓▓░░▓▓▓░      │
│  60 s interval · 30% jitter      │
├──────────────────────────────────┤
│  TOP FEATURES (TreeSHAP)         │
│  ▓▓▓▓▓▓▓▓▓ iat_bowley_skew  0.41│
│  ▓▓▓▓▓▓▓   iat_mad_ratio    0.33│
│  ▓▓▓▓▓     size_bowley_skew 0.19│
├──────────────────────────────────┤
│  EVIDENCE                        │
│  SHA-256: 9f2c3a7b...            │
│  Capture: offset 88,214,592      │
│  Flow ID: f8a91c2e               │
├──────────────────────────────────┤
│  FEATURE VALIDITY                │
│  [MEASURED] [ESTIMATED] [MISSING]│
│  iat_* → MEASURED                │
│  down_up_ratio → ESTIMATED       │
│  rtt → MISSING                   │
├──────────────────────────────────┤
│  DIRECTION MASK: FWD_ONLY        │
│  Detector: beaconing/v1.2.0      │
│  Model SHA-256: 3ab7...          │
└──────────────────────────────────┘
```

## 3.3 Degradation Matrix Panel

Displays as a table inside the main canvas (or as a separate view):

```
┌─────────────────────────────┬──────────┬──────────┬──────────┬──────────────┐
│ Detector                    │  Both    │  FWD     │  REV     │  ACK-Shadow  │
├─────────────────────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Recon / port scan           │  0.94    │  0.94    │  0.94    │   —          │
│ Volumetric DDoS             │  0.93    │  0.92    │  0.91    │   —          │
│ C2 beaconing                │  0.91    │  0.87    │  0.84    │   —          │
│ DGA / DNS tunnel            │  0.88    │  0.84    │  0.79    │   —          │
│ Encrypted malware           │  0.86    │  0.55 ⚠  │  0.12 ✗  │   —          │
│ Data exfiltration           │  0.89    │  0.00 ✗  │  0.91    │   0.83 ✔     │
└─────────────────────────────┴──────────┴──────────┴──────────┴──────────────┘
  ✔ unaffected  ⚠ degraded  ✗ failed (with ACK-Shadow rescue)
```

---

# PART 4 — DEMO SCRIPT FOR VIDEO

## Complete 2-Minute Script

### Segment 1: Opening Hook (0:00 – 0:10) [10 s]

**Screen recording:** Black card → bar chart animation.

**Narration:**
> "The standard approach to this problem scores 0.9 on bidirectional traffic. On NTRO's real data diode — it scores 0.4. And never reports a problem."

**Caption (burned in):**
```
The standard approach scores 0.9 on bidirectional traffic.
On NTRO's real data diode — it scores 0.4. And never reports a problem.
```

**Director note:** This is the teaser. It creates curiosity. Every frame after this is watched more carefully because the judge wants to see how we get from 0.4 to a working system.

---

### Segment 2: Problem Explanation (0:10 – 0:25) [15 s]

**Screen recording:** Animated diagram (deployment context) → terminal window.

**Narration:**
> "NTRO monitors critical infrastructure through hardware data diodes. Traffic is copied one way. There is no path back — so no lookups, no probes, no decryption. Ever. Every team will claim read-only. We let the kernel enforce it."

**Caption:**
```
One-way copy. No return path. No lookups. No probes. No decryption. Ever.
```

**Screen recording — Terminal (0:22 – 0:35):**
```
$ docker run --rm --network none --cap-add NET_RAW ekadhara:demo \
      --self-test-egress

[egress-test] attempting outbound connection to 8.8.8.8:53 ...
[seccomp]     SIGSYS — syscall 'connect' denied by policy
[audit]       egress attempt logged · pid 1 · terminated
[result]      READ-ONLY ENFORCED ✔
```

**Caption:**
```
That process tried to phone home — and was killed.
```

**Director note:** The kernel kill is the credibility moment. It takes 13 seconds and costs nothing to build. Record it for real.

---

### Segment 3: Live Demo of the Dashboard (0:35 – 1:35) [60 s]

#### 3a — Dashboard Overview (0:35 – 0:42) [7 s]

**Screen recording:** Dashboard loads. HUD visible.

**Narration:**
> "Forty-seven thousand flows a second. Zero drops. P99 latency, 84 milliseconds. That's the sustained rate, live."

**Caption:**
```
47,200 flows/s · drop 0.00% · p99 84 ms
```

#### 3b — Alert Feed + Evidence (0:42 – 0:55) [13 s]

**Screen recording:** Alerts scroll in. Click a beaconing alert. Evidence panel opens.

**Narration:**
> "Live alerts. Click any alert — here's the inter-arrival histogram showing a 60-second interval with 30% jitter. The three features that drove the decision, by SHAP contribution. The SHA-256 of the exact bytes. And the validity chips — measured, estimated, or missing. Because in an air gap, the analyst cannot verify anything independently."

**Caption:**
```
60 s interval · 30% jitter
Top features: iat_bowley_skew (0.41) · iat_mad_ratio (0.33)
SHA-256: 9f2c3a7b...
Validity: [MEASURED] [ESTIMATED] [MISSING]
```

**Director note:** Lingering on the validity chips for 2 seconds signals to the judge that this is a deliberate design choice, not a coincidence.

#### 3c — Device Connectivity Panel (0:55 – 1:05) [10 s]

**Screen recording:** Switch to Devices tab. Topology view shows 6 devices. Transformer-01 has a red pulse.

**Narration:**
> "Six devices on this network. All fingerprinted from traffic alone — no agent, no lookup. The exfiltration alert routes directly to Transformer-01. The analyst knows exactly where to look."

**Caption:**
```
6 devices · real-time status · fingerprint from traffic
Transformer-01: 2 alerts · risk: HIGH
```

#### 3d — Diode Toggle — The Hero Moment (1:05 – 1:35) [30 s]

**Screen recording:** Click DIODE MODE toggle → FWD ONLY. Degradation panel populates.

**Narration (1:05 – 1:12):**
> "Everything so far assumed both directions. NTRO described a diode. So let's make it real."

**Narration (1:12 – 1:20):**
> "Scanning: unaffected. DDoS: unaffected. Encrypted malware drops — we lost the server-side TLS fingerprint, and there is no trick that gets it back. We show that rather than hide it."

**Narration (1:20 – 1:28):**
> "Exfiltration should be dead — it's defined by the ratio of upload to download, and we just deleted download. Watch what happens when I turn off our reconstruction layer."

**Screen recording:** Click ACK-SHADOW toggle OFF. Alert feed goes quiet. Hold 2 seconds of silence.

**Narration (1:30 – 1:35, slower):**
> "That is what every other solution looks like on a real diode. It doesn't error. It doesn't warn you. It just quietly stops finding anything — while reporting high confidence on everything else."

**Director note:** The 2-second silence after the alerts stop is the most persuasive moment in the video. Do not fill it with narration or music. Let the empty alert feed speak.

---

### Segment 4: Diode Toggle Demonstration — ACK-Shadow Rescue (1:35 – 1:55) [20 s]

#### 4a — Toggle ACK-Shadow Back ON (1:35 – 1:42) [7 s]

**Screen recording:** Click ACK-SHADOW ON. Exfiltration alerts resume. Alert appears: `~4.1 GB egress · 10.2.4.9 → 203.0.113.9`.

**Narration:**
> "TCP is a delivery-confirmation protocol. Every client packet carries an acknowledgement — a receipt — saying 'I've received everything up to byte N.' Those receipts travel in the direction we can see."

#### 4b — ACK-Shadow Diagram (1:42 – 1:55) [13 s]

**Screen recording:** Split-screen overlay — ACK arithmetic diagram alongside the live dashboard.

**Narration:**
> "We never see the server's packets. But we watch that number climb — and the climb tells us exactly how much came back. Four point one gigabytes, reconstructed from arithmetic on a channel we cannot observe."

**Caption:**
```
VISIBLE: ack = 1,461 → ack = 5,001,000
INVISIBLE: 1,460 bytes → ~5 MB
Δack = what we cannot see
```

---

### Segment 5: Closing Impact Statement (1:55 – 2:00) [5 s]

**Screen recording:** Close card, static, held for 5 seconds.

```
                  E K A D H A R A
             See everything. Touch nothing.

  ✔  Runs with --network none.  No internet. Ever.
  ✔  Alerts emit as OCSF — plugs into any SIEM.
  ✔  Merkle-sealed ledger — tamper-evident.
  ✔  Deterministic replay — re-run, get our numbers.
  ✔  Six detectors, constant memory, zero silent failures.

      SIH26145 · NTRO
```

**Narration:**
> "Everything you saw ran with no network, from a container you could carry into a facility on a USB stick."

**Director note:** No call to action, no URL, no social media. Just the project name and the four checkmarks. Judges write down the project name; they don't click links.

---

## Complete Timing Table

| Segment | Time | Duration | Screen Content | Narration |
|---|---|---|---|---|
| Cold open — kill shot | 0:00 | 0:10 | Black card → bar chart | Standard approach: 0.9 → 0.4 on diode |
| Problem explanation | 0:10 | 0:15 | Diagram → terminal | Diode = no return path |
| Egress proof | 0:25 | 0:13 | Terminal output | Kernel kills the process |
| Dashboard overview | 0:38 | 0:07 | Dashboard + HUD | 47K flows/s, 0 drops |
| Alert + evidence | 0:42 | 0:13 | Alert feed → evidence panel | Validity chips, SHAP, hash |
| Device panel | 0:55 | 0:10 | Device topology | 6 devices, fingerprinting |
| Diode toggle ON | 1:05 | 0:25 | Toggle → degradation matrix | Scanning ok, encrypted degrades, exfil dies |
| ACK-Shadow OFF silence | 1:30 | 0:02 | Empty alert feed | *(silence)* |
| ACK-Shadow ON rescue | 1:32 | 0:08 | Alerts resume → diagram | 4.1 GB from ACK arithmetic |
| Close card | 1:40 | 0:20 | Static close card | Container, no network, USB-stick deployable |

**Total: 2:00**

---

## Screen Recording Checklist

### Before Recording

- [ ] Rehearse the full click path 5 times. Every cursor movement deliberate. No hunting for UI elements.
- [ ] Disable all notifications (Slack, email, OS updates, Teams).
- [ ] Clean desktop, neutral wallpaper. No personal files in any visible path.
- [ ] Terminal font ≥ 18 pt, high-contrast theme (prefer dark background).
- [ ] Dashboard at 125% zoom, browser in F11 mode (no chrome).
- [ ] Pre-load both PCAP files so no loading spinner appears on camera.
- [ ] Confirm HUD numbers are **real** — never mock a metric.
- [ ] Close all other applications. Record the entire screen, not a window.
- [ ] Set screen resolution to 1920×1080 minimum.

### During Recording

- [ ] Record at 1080p60 using OBS Studio or equivalent.
- [ ] Record one continuous take per scene.
- [ ] Record VO separately in a quiet room with a decent microphone (not laptop built-in).
- [ ] Do not narrate live over typing — the mic will pick up keyboard clicks.
- [ ] Capture 3 takes of the diode toggle sequence (Scene 5), pick the cleanest.
- [ ] If a mistake happens, pause for 5 seconds and restart from the last clean frame — it's easier to cut than to re-record everything.

### After Recording

- [ ] Edit scenes together in DaVinci Resolve or Premiere Pro.
- [ ] Burn in captions for every spoken line — high contrast, bottom third, sans-serif font.
- [ ] Color-grade for projector: raise contrast, avoid pure-black backgrounds.
- [ ] Export at 1080p, H.264, ≤ 100 MB where possible.
- [ ] Upload unlisted to YouTube AND keep an MP4 on a USB stick.
- [ ] **Watch it once muted at 1.5× speed.** If the story still lands, ship it. If not, re-cut.
- [ ] Verify the link works from a phone on mobile data before submitting.

---

# PART 5 — TECHNICAL IMPLEMENTATION PRIORITIES

Ranked by **demo impact per unit of build effort**. The ranking assumes a 6-week build window before video recording in Week 7.

---

## Priority 1: Dashboard with Live Alerts (Week 5, Days 1–3)

**What:** The full operations dashboard — alert feed, HUD, evidence panel, degradation matrix, diode toggle, ACK-Shadow toggle, device connectivity panel.

**Why #1:** The video is watched once. If the dashboard looks unpolished, nothing else matters. A working dashboard is the stage on which every other feature performs.

**Components to build (in order):**

| Day | Component | Effort |
|---|---|---|
| 1 | Dashboard shell: layout, sidebar, HUD, tab navigation, dark/light mode | 1 day |
| 2 | Alert feed: WebSocket connection, scrollable list, severity colors, click-to-detail | 1 day |
| 3 | Evidence panel: SHAP chart, IAT sparkline, validity chips, SHA-256 display | 1 day |
| 4 | Degradation matrix: table view, per-detector F1, ACK-Shadow toggle integration | 1 day |
| 5 | Device connectivity panel: topology view, device list, fingerprint display, alert routing | 1 day |

**Acceptance criteria:**
- Dashboard loads within 2 seconds of container start.
- Alerts appear in the feed within 1 second of detection.
- Clicking any alert opens the evidence panel with real data (not mock data).
- Toggling diode mode takes < 1 second and visibly updates the degradation matrix.
- Dark/light mode toggle works and persists.
- Layout is usable on a 1366×768 screen (minimum laptop resolution).

**Risk:** Low. React + a charting library is straightforward. The risk is in the WebSocket integration with the backend — make sure the alert stream contract is defined before starting the UI.

---

## Priority 2: Diode Toggle with Degradation Matrix (Week 5, Days 4–5, Week 6 Day 1)

**What:** The live diode toggle that switches between BI / FWD / REV capture modes, and the degradation matrix that shows per-detector F1 scores for each mode.

**Why #2:** This is the **hero moment** of the video. If it doesn't work flawlessly on camera, nothing else saves the submission. It must be rehearsed 20+ times before recording.

**Implementation:**

| Component | Detail |
|---|---|
| Twin loading | Both BI and FWD PCAPs loaded simultaneously into two replay engines |
| Direction mask | A switch in the ingest layer that filters packets by configured prefix map |
| Model re-scoring | Same model weights, different input stream. Results appear in < 1s. |
| Degradation panel | Pre-computed F1 numbers for each detector × each mode, stored in a lookup table. Animated row-by-row population on toggle. |
| ACK-Shadow toggle | Runtime flag `--ack-shadow=on|off` that enables/disables the ACK estimator. The exfiltration detector consumes ACK-Shadow output; when disabled, it produces no alerts. |

**Pre-computed degradation data (for the panel):**

| Detector | BI F1 | FWD F1 | REV F1 | FWD + ACK F1 |
|---|---|---|---|---|
| Recon / scan | 0.94 | 0.94 | 0.94 | — |
| Volumetric DDoS | 0.93 | 0.92 | 0.91 | — |
| C2 beaconing | 0.91 | 0.87 | 0.84 | — |
| DGA / DNS tunnel | 0.88 | 0.84 | 0.79 | — |
| Encrypted malware | 0.86 | 0.55 | 0.12 | — |
| Data exfiltration | 0.89 | 0.00 | 0.91 | 0.83 |

**Acceptance criteria:**
- Toggling from BOTH → FWD completes in < 1 second.
- The degradation panel visibly re-populates row by row.
- Toggling ACK-Shadow OFF causes the exfiltration alert stream to stop within 1 detection window.
- Toggling ACK-Shadow back ON causes alerts to resume.

**Risk:** Medium. The twin-replay + live re-scoring pipeline is the most complex integration point. Build it early, test it daily.

---

## Priority 3: Device Connectivity Visualization (Week 5, Days 5, Week 6 Day 2)

**What:** The device topology view, device list, fingerprinting display, and alert routing to specific devices.

**Why #3:** Adds operational breadth to the demo. Shows judges that EKADHARA maps to real infrastructure, not just abstract packet counts.

**Implementation:**

| Component | Detail |
|---|---|
| Asset manifest | JSON file with device IPs, names, types, criticality. Mounted read-only at startup. |
| Topology view | React component using a force-directed graph library (e.g., react-force-graph). Nodes = devices, edges = observed connections. |
| Device list | Table view with sortable columns, filterable by status/type. |
| Fingerprint display | Clicking a node shows: JA4 fingerprint, OS heuristic, traffic stats, first-seen date. |
| Alert routing | When an alert fires, look up the source IP in the manifest and annotate. |

**Demo data (pre-built for the video):**

```json
[
  {"ip": "10.2.4.1",  "name": "SCADA-GW-01",     "type": "gateway",      "criticality": "HIGH"},
  {"ip": "10.2.4.9",  "name": "Transformer-01",  "type": "power_equip",  "criticality": "HIGH", "alerts": 2},
  {"ip": "10.2.4.11", "name": "TempSensor-01",   "type": "sensor",       "criticality": "MEDIUM"},
  {"ip": "10.2.4.12", "name": "PressureSensor-03","type": "sensor",      "criticality": "MEDIUM"},
  {"ip": "10.2.4.21", "name": "HMI-Screen-01",   "type": "endpoint",     "criticality": "MEDIUM"},
  {"ip": "10.2.4.31", "name": "Historian-03",    "type": "endpoint",     "criticality": "LOW"}
]
```

**Acceptance criteria:**
- Topology view renders 6 devices with connections.
- Clicking a device shows its fingerprint details.
- When Transformer-01 generates an exfiltration alert, its node turns red and shows a badge.
- Switching between grid and list view works.

**Risk:** Low. This is a UI component that reads from a pre-built manifest. The topology graph is visual polish; the underlying data is trivial.

---

## Priority 4: Throughput Metrics (Week 3, Days 4–5)

**What:** The performance harness that measures sustained flows/sec, drop rate, p99 latency, and memory usage. The HUD widget that displays these numbers live.

**Why #4:** The problem statement requires a "stated throughput" (constraint d). This is the number that proves the system runs at production speed. It's also the first thing a technical judge will ask about.

**Implementation:**

| Metric | How measured | Display format |
|---|---|---|
| Flows/sec | Counter in ingest thread, sampled at 1 Hz | `47,200 flows/s` |
| Throughput (Mbps) | Sum of packet lengths / time window | `1,240 Mbps` |
| Drop rate | Counter of dropped packets / total offered | `0.00%` |
| p99 latency | t-digest over stage-to-stage timestamps | `p99: 84 ms` |
| Memory (RSS) | `/proc/self/status` sampled at 5 Hz | `412 MB` |

**Performance harness:**

```bash
# Rate ramp to saturation
ekadhara replay --pcap sXX_FWD.pcap --rate 1000    # 1K flows/s
ekadhara replay --pcap sXX_FWD.pcap --rate 10000   # 10K
ekadhara replay --pcap sXX_FWD.pcap --rate 50000   # 50K (target)
ekadhara replay --pcap sXX_FWD.pcap --rate 100000  # 100K (saturation)
ekadhara replay --pcap sXX_FWD.pcap --rate 500000  # burst (10× target)

# Memory test
ekadhara replay --pcap spoofed_flood.pcap --rate 100000 --duration 60
# → measure RSS at t=0, t=30, t=60
# → must be flat (CMS + HyperLogLog)
```

**Acceptance criteria:**
- Sustained 50,000 flows/sec with 0.00% drops on stated hardware.
- p99 alert latency < 100 ms (window-close to alert on screen).
- Memory stays flat (±5%) during a 10× burst test.
- All numbers are printed by the harness, not hand-typed.

**Risk:** Low. The metrics are counters. The only risk is the backend being too slow — if the Rust pipeline doesn't hit 50K flows/s, lower the target and re-cut the HUD number. The story doesn't change.

---

## Priority 5: Evidence Drill-Down (Week 5, Day 3, integrated with Priority 1)

**What:** The per-alert evidence panel showing SHAP features, IAT histogram, SHA-256 evidence hash, feature validity chips, and direction mask.

**Why #5:** This is the visual nobody else has. The validity chips (`MEASURED` / `ESTIMATED` / `MISSING`) prove the entire thesis in one glance. It's cheap to build and high-impact on camera.

**Implementation:**

| Element | Detail |
|---|---|
| SHAP top-3 | TreeSHAP via `shap` library, one call per alert. Render as horizontal bar chart. |
| IAT sparkline | Ring buffer of inter-arrival times, rendered as a tiny line chart. |
| Evidence hash | `SHA-256` over the packet byte range identified by `capture_offset` in the RawEvent. |
| Validity chips | Color-coded badges: green = MEASURED, amber = ESTIMATED, red = MISSING. |
| Direction mask | Displayed as `BOTH` / `FWD_ONLY` / `REV_ONLY`. |
| Model SHA-256 | Hash of the ONNX model file, displayed for reproducibility. |

**Acceptance criteria:**
- Every alert in the feed is clickable.
- The evidence panel opens within 200ms of click.
- Validity chips are color-coded and immediately readable.
- The SHA-256 hash matches the actual bytes in the PCAP (verified by a test script).

**Risk:** Very low. TreeSHAP is a single library call. The IAT sparkline is a ring buffer + SVG. The hash is a standard crypto call.

---

## Priority Summary

| Priority | Feature | Week | Demo Impact | Build Effort | Risk |
|---|---|---|---|---|---|
| **1** | Dashboard with live alerts | 5 | ★★★★★ | Medium | Low |
| **2** | Diode toggle + degradation matrix | 5–6 | ★★★★★ (hero moment) | High | Medium |
| **3** | Device connectivity visualization | 5–6 | ★★★☆☆ | Low | Low |
| **4** | Throughput metrics + HUD | 3 | ★★★★☆ | Low | Low |
| **5** | Evidence drill-down panel | 5 | ★★★★☆ (validity chips) | Low | Very Low |

---

## What to Build After Priorities 1–5

Once all five priorities are complete and measured:

| Feature | Week | Purpose |
|---|---|---|
| Four deep detectors (scan, DDoS, beaconing, exfil) | 3–4 | The thing the dashboard is showing |
| ACK-Shadow implementation + validation | 2 | The trick that rescues exfiltration |
| Egress lockdown + self-test | 6 | The credibility moment |
| Merkle custody chain | 6 | The forensic requirement |
| Memory chart (naive baseline vs. EKADHARA) | 6 | The engineering depth moment |
| Evasion suite (break-even points) | 6 | The honesty signal |
| Video recording + editing | 7 | The deliverable |

**Nothing in this table gets started until Priorities 1–5 are complete and every number is real.**

---

## The One-Sentence Test

Before building **any** feature, ask:

> **"Which frame of the video, or which number on the deck, does this make real?"**

No answer means no build. This rule has prevented more scope creep than any deadline.
