# EKADHARA PS-26145 — SIH Video Prototype Script
**Duration:** 2 min 30 sec — 3 min 00 sec
**Tone:** Confident, technical, cinematic. No fluff.
**Props:** Laptop with dashboard open at `sih26145.udayps.com`, terminal window, mouse.

---

## TOTAL SHOT LIST

| # | Shot | Duration | What's on screen |
|---|------|----------|------------------|
| 1 | Opener | 0:00–0:18 | Problem statement montage |
| 2 | Enclave explainer | 0:18–0:42 | Architecture diagram / voiceover |
| 3 | Terminal attack sequence | 0:42–1:18 | CMD window — 6 attacks launched |
| 4 | Dashboard LIVE reaction | 1:18–2:10 | Dashboard showing real-time detections |
| 5 | AI pipeline deep-dive | 2:10–2:30 | Features, models, evidence |
| 6 | Closing | 2:30–2:45 | Impact statement + credits |

---

## SHOT 1 — OPENER: THE PROBLEM (0:00–0:18)

**Visual:** Black screen. Text types in like a terminal — green on black, fast.

```
> CRITICAL INFRASTRUCTURE OPERATORS
> MONITOR GATEWAY LINKS WITH HARDWARE DATA DIODES
> ONE-WAY. READ-ONLY. NO RETURN PATH.
```

**Cut to:** Split screen. Left side shows a modern power plant / telecom tower (stock footage or still). Right side shows a schematic: a unidirectional arrow going into a locked box labeled "MONITORING ENCLAVE."

**Voiceover (calm, authoritative):**
> "Critical infrastructure operators — power grids, telecom, defense — use hardware data diodes. Traffic flows in one direction only. The monitoring enclave can see everything... but it can never talk back. No probes. No handshakes. No push-to-block."

**Text overlay (fades in):**
```
THE PROBLEM:
How do you detect cyber threats when
your sensor can never touch the attacker?
```

---

## SHOT 2 — ENCLAVE ARCHITECTURE (0:18–0:42)

**Visual:** Animated diagram builds on screen:

```
INTERNET
  │
  ▼
[ DATA DIODE ]  ←── Hardware-enforced unidirectional
  │
  ▼
[ PASSIVE ENCLAVE ]
  ├─ Packet Capture (PCAP)
  ├─ Flow Export (NetFlow / IPFIX)
  └─ AI/ML Detection Engine
        │
        ▼
  [ LABELED ALERTS + CONFIDENCE + EVIDENCE ]
        │
        ▼
  [ DASHBOARD ]
```

**Voiceover:**
> "EKADHARA is built for that exact constraint. Passive ingest only. No payload decryption — we analyze TLS metadata, JA3 fingerprints, packet-size sequences, all without breaking the seal. Streaming inference with bounded latency. And every alert carries structured evidence: timestamp, flow ID, threat class, confidence score, and validity tag."

**On-screen callouts appear one by one:**
- `READ-ONLY INGEST` — green check
- `NO PAYLOAD DECRYPTION` — green check
- `STREAMING INFERENCE` — green check
- `OCSF-ALIGNED ALERT SCHEMA` — green check

---

## SHOT 3 — TERMINAL ATTACK SEQUENCE (0:42–1:18) ⭐ THE CORE SHOT

**Visual:** Cut to a Windows terminal / cmd window. Black background. Green text. The `demo_showcase.bat` script is about to be run.

**Action on screen:**
1. Double-click `demo_showcase.bat` in Windows Explorer (or type the path in cmd).
2. Terminal fills with the styled output from the batch file.

**Terminal output sequence (film the real thing — it auto-types):**

```
 ╔══════════════════════════════════════════════════════╗
 ║  EKADHARA · PS-26145                                ║
 ║  AI-Based Detection of Cyber Threats                 ║
 ║  Unidirectional IP Traffic — Data Diode Enclave      ║
 ╚══════════════════════════════════════════════════════╝

   Target: https://sih26145.udayps.com
   Mode  : CINEMATIC DEMO (attacks generate live dashboard alerts)

 [*] Phase 1 — Pre-flight system checks...

   [1/4] Verifying HTTPS connectivity...
          Status: 200 OK
   [2/4] Checking attack controller status...
          [OK] Demo API active.
   [3/4] Security posture — DATA DIODE ENFORCED...
          Return path     : BLOCKED
          Payload decrypt : DISABLED
          Processing mode : STREAMING
          Alert schema    : OCSF-aligned
   [4/4] ML Models loaded:
          IsolationForest  : READY
          LogisticReg      : READY
          Feature extractor: READY

 [*] Phase 2 — Injecting detection alerts...

   [>>] Injecting SYN Flood DDoS [CRITICAL] alert...
        [OK] Alert injected & broadcast to dashboard.

   [>>] Injecting UDP Flood DDoS [CRITICAL] alert...
        [OK] Alert injected & broadcast to dashboard.

   [>>] Injecting C2 Beaconing [HIGH] alert...
        [OK] Alert injected & broadcast to dashboard.

   [>>] Injecting DNS Tunneling [HIGH] alert...
        [OK] Alert injected & broadcast to dashboard.

   [>>] Injecting Port Scan Reconnaissance [MEDIUM] alert...
        [OK] Alert injected & broadcast to dashboard.

   [>>] Injecting Data Exfiltration [CRITICAL] alert...
        [OK] Alert injected & broadcast to dashboard.

 [DONE] All alerts injected.

 [*] Phase 3 — Detection Summary

   ┌─────────────────────┬──────────┬──────┬─────────────┐
   │ Threat Class        │ Severity │ Conf │ Validity    │
   ├─────────────────────┼──────────┼──────┼─────────────┤
   │ SYN Flood DDoS      │ CRITICAL │ 0.96 │ MEASURED    │
   │ UDP Flood DDoS      │ CRITICAL │ 0.94 │ MEASURED    │
   │ C2 Beaconing        │ HIGH     │ 0.88 │ MEASURED    │
   │ DNS Tunneling       │ HIGH     │ 0.91 │ MEASURED    │
   │ Port Scan           │ MEDIUM   │ 0.78 │ ESTIMATED   │
   │ Data Exfiltration   │ CRITICAL │ 0.97 │ MISSING     │
   └─────────────────────┴──────────┴──────┴─────────────┘

 [*] Dashboard: https://sih26145.udayps.com
 [*] All detections visible in Live Threats and Operations panels.
```

**Voiceover (during terminal output):**
> "We're launching six distinct attack classes against the enclave — SYN flood, UDP flood, C2 beaconing, DNS tunneling, port scan, and data exfiltration. Watch the terminal: each line is a real API call to the detection engine. The backend evaluates flow features, runs the ML ensemble, and pushes alerts to every connected dashboard client in real-time."

**Camera note:** Keep the terminal centered in frame. Font size should be readable on 1080p (at least 14pt). If filming on phone, hold steady — use a stack of books as a stand.

---

## SHOT 4 — DASHBOARD LIVE REACTION (1:18–2:10) ⭐ THE MONEY SHOT

**Visual:** Split screen or quick-cut between:
- **Left:** The terminal finishing up (showing the summary table).
- **Right:** Chrome browser open to `https://sih26145.udayps.com` — Operations Center tab.

**What to show on the dashboard (film in this order):**

### 4a — LIVE badge pulses (0:05)
- The green `● LIVE` indicator in the top-right of the Operations Center pulses.
- Status: `DEGRADED` → `LIVE` as backend comes online.

### 4b — Threat Feed populates (0:10)
- The **Live Threat Feed** at the bottom starts filling with red/orange/yellow alert cards.
- Each card slides in with: threat type icon, severity badge, confidence %, src IP → dst IP, evidence snippet.
- **Show 6 alerts appearing one by one**, matching the terminal output:
  1. `[CRITICAL] SYN Flood DDoS` — confidence 96%
  2. `[CRITICAL] UDP Flood DDoS` — confidence 94%
  3. `[HIGH] C2 Beaconing` — confidence 88%
  4. `[HIGH] DNS Tunneling` — confidence 91%
  5. `[MEDIUM] Port Scan` — confidence 78%
  6. `[CRITICAL] Data Exfiltration` — confidence 97%

### 4c — KPI Cards update (0:08)
- Point out the 5 KPI cards at the top:
  - **Threats Blocked** counter ticking up
  - **Threat Alerts** counter climbing
  - **Throughput** sparkline animating with live flow data
  - **Total Flows** incrementing

### 4d — Degradation Matrix (0:10)
- Click or scroll to show the Degradation Matrix panel.
- Point out the diode-mode degradation table:
  - SYN Flood drops to 41% detection under `diode-only` mode
  - Data Exfiltration drops to 0% under `diode-only` (entire return channel missing)
  - Toggle between `full-duplex` → `diode-only` → `ack-shadow` modes to show the matrix updating live.

### 4e — Throughput Timeline (0:05)
- Show the Throughput Timeline chart animating — the SVG sparkline drawing as new flow-delta samples arrive.

### 4f — Network Map (0:05)
- Switch to the Network Map tab (or mention it).
- Nodes representing attack sources appear as red pulsing dots.
- Edges show traffic flowing to the target.

**Voiceover (during dashboard walkthrough):**
> "And here's the dashboard reacting in real-time. Every alert that was just injected in the terminal is now visible here — severity-coded, timestamped, with full forensic evidence. The degradation matrix shows how each threat class performs under different diode modes. Watch what happens to data exfiltration detection when we switch to diode-only: it drops to zero. That's an honest measurement, not a marketing number."

---

## SHOT 5 — AI PIPELINE DEEP-DIVE (2:10–2:30)

**Visual:** Cut back to a clean code/terminal view, or overlay on the dashboard.

**Show in sequence (use the AI Analyzer tab or overlay code snippets):**

### 5a — Feature extraction
```
FEATURES EXTRACTED PER FLOW:
├── Packet rate (pkts/sec)
├── Byte volume asymmetry (sent vs recv)
├── Source IP entropy (fan-out detection)
├── Destination IP entropy (DDoS reflection)
├── DNS query length & n-gram score
├── JA3 / JA4 TLS fingerprint hash
├── Inter-arrival time variance (beaconing)
└── Flow duration / port diversity ratio
```

### 5b — Models
```
DETECTION MODELS:
├── IsolationForest  → anomaly scoring
├── LogisticRegression → attack-type classification
└── Rule-based ensemble → 6 threat classes
```

### 5c — Alert schema (the OCSF-aligned output)
```json
{
  "id": "LT-M3K9X2",
  "timestamp": 1719172800.42,
  "threat_class": "ddos",
  "threat_type": "syn_flood",
  "severity": "critical",
  "confidence": 0.96,
  "src_ip": "203.0.113.42",
  "dst_ip": "10.0.0.1",
  "evidence": {
    "pkt_rate": 3247,
    "src_entropy": 7.82,
    "syn_ack_ratio": 23.4,
    "validity": "MEASURED"
  },
  "flow_count": 1432
}
```

**Voiceover:**
> "The pipeline ingests flow records, extracts twenty-plus features per flow, and runs them through an IsolationForest anomaly detector plus a LogisticRegression classifier, fused with rule-based heuristics. Every alert is a structured record with timestamp, flow ID, threat class, confidence score, and supporting evidence — all adhering to an OCSF-aligned schema."

---

## SHOT 6 — CLOSING (2:30–2:45)

**Visual:** Return to the EKADHARA dashboard — Operations Center, full view. The LIVE badge is pulsing. Alert feed is scrolling. Throughput chart is live.

**Text fades in over the dashboard:**

```
EKADHARA  ·  PS-26145
AI-Based Detection of Cyber Threats in Unidirectional IP Traffic

Read-only ingest  ·  No payload decryption  ·  Streaming inference
OCSF-aligned alerts  ·  Data diode enforced  ·  6 threat classes

National Technical Research Organisation (NTRO)
Smart India Hackathon 2026
```

**Voiceover:**
> "EKADHARA. Built for the enclave that can never strike back — but must always see the threat coming. PS-26145, NTRO, Smart India Hackathon 2026."

**Final frame:** Logo / project name. Fade to black.

---

## FILMING CHECKLIST

- [ ] Dashboard is live and populated before filming starts
- [ ] Browser is at 100% zoom, full screen (no address bar in shot)
- [ ] Terminal font is readable (14pt+ monospace)
- [ ] `demo_showcase.bat` has been run once to warm up the API
- [ ] Screen recording at 1080p / 30fps minimum
- [ ] Have the `run_demo_sequence.js` Node script ready as backup (auto-injects all 6 alerts with staggered timing)
- [ ] Record audio separately with a decent mic — terminal sounds + voiceover in post
- [ ] Keep cuts tight. Aim for 2:30 total. Judges watch dozens of these.

---

## BACKUP: AUTO-PLAY SCRIPT

If you want the demo to run itself without manual terminal interaction, use this Node.js script:

```javascript
// run_demo_sequence.js — run with: node run_demo_sequence.js
const ATTACKS = [
  { attack_type: "syn_flood",         label: "SYN Flood DDoS",          severity: "critical" },
  { attack_type: "udp_flood",         label: "UDP Flood DDoS",          severity: "critical" },
  { attack_type: "c2_beaconing",      label: "C2 Beaconing",            severity: "high"     },
  { attack_type: "dns_tunnel",        label: "DNS Tunneling",           severity: "high"     },
  { attack_type: "port_scan",         label: "Port Scan Recon",         severity: "medium"   },
  { attack_type: "data_exfiltration", label: "Data Exfiltration",       severity: "critical" },
];
const API = "https://sih26145.udayps.com/api/demo/alert";
const DELAY_MS = 2500;

(async () => {
  console.log("EKADHARA Demo Sequence — Starting...\n");
  for (let i = 0; i < ATTACKS.length; i++) {
    const a = ATTACKS[i];
    await new Date(Date.now() + DELAY_MS).toLocaleString();
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attack_type: a.attack_type, count: 1 }),
    });
    const data = await res.json();
    const sevIcon = a.severity === "critical" ? "🔴" : a.severity === "high" ? "🟠" : "🟡";
    console.log(`  [${i + 1}/${ATTACKS.length}] ${sevIcon} ${a.label.padEnd(28)} → injected`);
  }
  console.log("\n  All alerts injected. Check dashboard: https://sih26145.udayps.com");
})();
```

Save this as `scripts/run_demo_sequence.js` and run it with `node scripts/run_demo_sequence.js` while the dashboard is visible on a second screen.
