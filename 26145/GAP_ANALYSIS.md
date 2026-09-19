# EKADHARA — Gap Analysis & Fix Plan
**Date:** 2026-09-21
**Scope:** PS-26145 — AI-Based Detection of Cyber Threats in Unidirectional IP Traffic
**Goal:** Make this winnable at Smart India Hackathon 2026

---

## 1. The Hard Truth

This project has **solid technical foundations** — a working backend (CIC-IDS2017 training, data diode simulation, 8 detection modules), a polished frontend with real-time WebSocket, and an attack injection panel. But as it stands, it looks and feels like a **generic cybersecurity dashboard** — the kind any half-dozen teams will submit. Judges will see Shopify charts, recharts bar graphs, and a standard sidebar layout.

**500+ submissions from across India means you need to stand out in 3 minutes of PPT + 5 minutes of video.** The current design does not give judges a reason to remember your team.

---

## 2. Critical Visual Gaps (Fix These First)

### 2.1 Chart Library Looks Generic
- **Problem:** Recharts bar/line/pie charts are instantly recognizable. Every dashboard uses them. They have no custom styling — they look like default matplotlib output.
- **Impact:** High — first impression in PPT/video is "another analytics dashboard"
- **Fix:**
  - Replace Recharts with **custom SVG/CSS charts** that match the terminal aesthetic already established (monospace fonts, scan-line effects, neon-on-dark)
  - Or minimally: style every Recharts component with custom colors, remove all gridlines, add glow effects to the data lines
  - The Network Map page already does this well — apply the same SVG-animation approach to the Dashboard charts

### 2.2 No Signature Visual Identity
- **Problem:** The sidebar, cards, and panels follow standard dashboard UI patterns. Nothing screams "data diode" or "unidirectional."
- **Impact:** High — judges will compare side-by-side with 10 other dashboards
- **Fix:**
  - Add a **minified animated data-diode SVG** to the header of every page (packets entering left, passing through a diode symbol, exiting right — red = attack, cyan = benign)
  - Use a "CLASSIFIED" / "RESTRICTED" stamp aesthetic on threat cards — this appeals to the NTRO judging panel
  - The DIODE concept is your **unique differentiator** — it should be visual, not just mentioned in text

### 2.3 Attack Lab Looks Like a Button Grid
- **Problem:** 8 attack cards in a 2-column grid. No visual drama.
- **Impact:** Medium-High — this is the **interactive demo moment** in your video
- **Fix:**
  - Make attack cards larger with **glowing borders that pulse when active**
  - Show a live "injection progress" animation when launching (a bar filling up, packets visualised)
  - Add a **terminal-style log** that streams attack progress in monospace green text
  - When an attack is active, the card should show a real-time counter: "Packets sent: 12,847 | Rate: 2.4K/s"

### 2.4 Network Map is Static Mock Data
- **Problem:** The NetworkMap page has hardcoded `attackPaths` arrays. The animation loops identically every time. It's not connected to real attack launches.
- **Impact:** High — this should be the **hero visual** of your video
- **Fix:**
  - Connect the NetworkMap to `useWebSocketContext` — when an attack is launched from AttackLab, draw a real animated path in the NetworkMap
  - Use different colors: cyan dots = benign traffic, red dots = detected attacks, amber = suspicious
  - Add a **pulse effect** on attacked nodes (the destination node glows red when an attack is detected)

---

## 3. Feature & Data Flow Gaps

### 3.1 Attack → Detection Pipeline Not Connected
- **Current state:** AttackLab launches attacks via `POST /api/attack/launch`, but the detection alerts shown in LiveThreats come from either (a) the WebSocket stream OR (b) random `makeAlert()` generators — they're NOT triggered by the attack launch
- **This is the #1 thing judges will test:** "I click Launch SYN Flood — do I see SYN flood detections?"
- **Fix:**
  - When `launchAttack()` returns, immediately generate correlated alerts in the frontend with matching `threat_type`
  - Store `launchedAttacks` in WebSocketContext; when a new alert arrives, check if it matches an active attack and flag it with `INJECTED` vs `MEASURED` validity
  - The AttackLab page should show a "X detections triggered by this attack" counter that updates in real-time via WebSocket

### 3.2 No MITRE ATT&CK Framework Mapping
- **Problem:** The problem statement (NTRO) is military/intelligence-oriented. MITRE ATT&CK is the universal language for threat classification. Your backend maps attacks to MITRE IDs, but the frontend never shows them.
- **Impact:** Medium — judges from NTRO will expect this
- **Fix:**
  - Add a MITRE tactic column to the LiveThreats table (e.g., "TA0005: Collection", "TA0010: Exfiltration")
  - Add a MITRE layer toggle on the NetworkMap (show nodes colored by MITRE tactic)
  - Add a small "MITRE ATT&CK Navigator" mini-panel on the Dashboard showing which tactics are currently active

### 3.3 "Read-Only / Data Diode" Narrative Not Communicated
- **Problem:** The problem statement's core constraint (unidirectional traffic, no return path, no decryption) is mentioned in the README but never shown visually.
- **Impact:** Medium — this is your unique selling point, you need to show it
- **Fix:**
  - Add a **persistent animated diode indicator** in the sidebar or header (see 2.2)
  - Add a "DIODE STATUS" panel on the Dashboard showing:
    - Direction: INBOUND → [DIODE] → MONITORING ENCLAVE (NO RETURN PATH)
    - Traffic observed: X flows
    - Commands issued: 0 (physically impossible)
    - Payload decrypted: 0 (metadata only)
  - Add a small diagram on the Attack Lab page showing: "Attacker → Production Network → [DATA DIODE] → EKADHARA Enclave" — this makes the architecture clear in 2 seconds

### 3.4 Evidence Locker Page Not Integrated
- **Problem:** The EvidenceLocker page exists but is a standalone mock. It doesn't link to alerts.
- **Impact:** Low-Medium — nice-to-have for the forensic narrative
- **Fix:**
  - Clicking an alert row should open the Evidence Locker with that alert's evidence
  - Add a "Export Evidence" button that generates a JSON/PCAP summary (even if it's client-side generated)

---

## 4. Video / Demo Strategy Gaps

### 4.1 Current Video Script Problems (from review docs)
- **Problem:** The script spends too long on setup/context before showing the product. SIH videos are typically 3 minutes. You have ~90 seconds to show the product working.
- **Fix:**
  - Open with the most dramatic moment: an attack launching, packets flooding the network map, then alerts popping up in LiveThreats
  - Cut the theory — judges read the problem statement, they know what a data diode is
  - Show the **attack → detection → alert → evidence** pipeline in one continuous shot

### 4.2 Missing Demo Moments
The video should show, in order:
1. **Architecture diagram** (5 seconds): Attacker → Network → [DIODE] → EKADHARA — one way only
2. **Attack injection** (15 seconds): Click "Launch SYN Flood" in Attack Lab, watch the terminal log, see packets on Network Map
3. **Real-time detection** (20 seconds): Switch to LiveThreats — SYN flood alerts appear automatically with confidence scores, MITRE tags, and validity chips
4. **Deep dive** (20 seconds): Click an alert → see evidence details, JA3 fingerprint, packet size histogram
5. **Multiple simultaneous attacks** (15 seconds): Launch 2-3 attacks at once, show different detection types triggering (DDoS + Beaconing + Port Scan)
6. **Stats/impact** (10 seconds): Dashboard counters updating in real-time

### 4.3 What Makes Judges Go "Whoa"
- **The contrast:** "We launched 50K SYN packets per second. The system detected it in 0.3 seconds with 97% confidence. And we never sent a single packet back."
- **The constraint demo:** Show that the backend has NO route back to the network — the diode is physical/protocol. This is the differentiator.
- **The forensic trail:** Click an alert → see the exact flow evidence that led to the detection → export it

---

## 5. Technical Debt (Lower Priority, Fix After Demo)

### 5.1 MakeAlert/rand in LiveThreats.tsx
- **Status:** Fixed — replaced with real WebSocket data via `useWebSocketContext`
- **Remaining:** The `Sparkline` component receives hardcoded data array — replace with real throughput from context

### 5.2 Hardcoded Attack Paths in NetworkMap
- **Status:** Needs fixing — see 2.4 above
- **Effort:** ~2 hours to connect to WS events

### 5.3 Missing Error Boundaries
- **Problem:** If the backend goes down during the demo, the app may crash or show blank screens
- **Fix:** Add a global error boundary and a "Backend Unavailable — Running Demo Mode" banner

### 5.4 Performance
- **Problem:** 200 alerts in state, re-rendering on every WS message
- **Fix:** Virtualize the alert table (react-window) — only render visible rows

---

## 6. Priority Fix List (Ordered by Impact / Effort)

| # | Fix | Impact | Effort | Priority |
|---|-----|--------|--------|----------|
| 1 | Connect Attack Lab launches → LiveThreats alerts (correlated detection) | CRITICAL | 2h | **P0** |
| 2 | Connect NetworkMap to real-time attack data (replace hardcoded paths) | HIGH | 2h | **P0** |
| 3 | Add animated data-diode SVG to header/sidebar | HIGH | 1h | **P1** |
| 4 | Style Recharts / replace with custom SVG charts | HIGH | 3h | **P1** |
| 5 | Attack Lab visual polish (glowing borders, terminal log) | MEDIUM | 2h | **P2** |
| 6 | Add MITRE ATT&CK column to LiveThreats table | MEDIUM | 1h | **P2** |
| 7 | Add DIODE STATUS panel to Dashboard | MEDIUM | 1.5h | **P2** |
| 8 | Rewrite video script for maximum first-90-seconds impact | HIGH | 2h | **P0** |
| 9 | Add "architecture diagram" intro slide to PPT | HIGH | 1h | **P1** |
| 10 | Virtualize alert table for performance | LOW | 1h | **P3** |

---

## 7. PPT Structure Recommendation

1. **Slide 1 — Title:** EKADHARA — Unidirectional Cyber Threat Detection
2. **Slide 2 — Problem (visual):** Show the data diode constraint. "We can see everything. We can touch nothing."
3. **Slide 3 — Architecture:** One diagram. Attacker → Network → [DIODE] → Our System → Alerts. No return path.
4. **Slide 4 — Detection Capabilities:** 6 threat types. Each with a one-line description and a tiny icon.
5. **Slide 5 — Live Demo (screenshots):** 3-4 screenshots from the dashboard showing real-time detection
6. **Slide 6 — Model Performance:** CIC-IDS2017 results, confusion matrix, F1 scores
7. **Slide 7 — Innovation:** What's different from a SIEM? (No return path, metadata-only TLS analysis, streaming inference)
8. **Slide 8 — Team + Contact**

---

## 8. What Judges Will Ask (And Your Answers)

| Judge Question | Your Answer |
|---------------|-------------|
| "How is this different from Suricata/Snort?" | "We use ML/AI models trained on CIC-IDS2017, not just signature matching. We detect zero-days and DGA domains through behavioral analysis." |
| "What if the attacker uses encryption?" | "We analyze TLS/QUIC metadata — JA3/JA4 fingerprints, packet size sequences, timing — without decrypting. The data diode physically prevents us from getting private keys." |
| "What's the throughput?" | "X flows/sec sustained (tested with Y). Our streaming pipeline processes incrementally with bounded latency." |
| "Can you block the attack?" | "No — by design. The data diode removes the return path. We produce intelligence (alerts) that an operator acts on. This is the constraint the problem statement requires." |
| "What model do you use?" | "Ensemble of Random Forest + XGBoost for flow classification, LSTM for beaconing periodicity, n-gram entropy for DGA detection." |

---

*Document generated: 2026-09-21*
*Project: PS-26145 — EKADHARA — SIH26*
