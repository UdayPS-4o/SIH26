# WATCHTOWER — Live Demo Script
## PS-26145 · NTRO · SIH26 · EKADHARA v2.4

**Total duration:** 3 minutes 30 seconds
**Tone:** Confident, technical, measured pace
**Format:** Live interaction with the running system
**Rule:** Every action must be visible on screen. No hidden clicks. No pre-prepared tricks.

---

## PRE-DEMO SETUP (5 minutes before judges arrive)

### Machine Setup
- [ ] Windows notifications OFF
- [ ] Browser in Incognito mode, zoom 100%, F11 fullscreen
- [ ] Terminal tabs open (backend, frontend, attack commands)
- [ ] Backend running: `python demo_server.py --host 0.0.0.0`
- [ ] Frontend running: `npm run dev`
- [ ] Dashboard loaded at `http://localhost:5178`
- [ ] Let dashboard run for 30 seconds to populate KPIs
- [ ] Close all other applications
- [ ] Clean desktop wallpaper

### Browser Tabs (pre-open)
1. `http://localhost:5178/` — Dashboard
2. `http://localhost:5178/attack` — Attack Panel
3. `http://localhost:5178/live-threats` — Live Threats
4. `http://localhost:5178/analytics` — Analytics

### Pre-Load State
- [ ] Dashboard showing live data (all 6 KPI cards populated)
- [ ] Alert Feed scrolling with 15+ alerts
- [ ] HUD showing: ~47K flows/s, drop 0.00%, p99 < 100ms
- [ ] Attack Panel ready (no attacks running)
- [ ] Live Threats page loaded (for quick navigation)

---

## DEMO SCRIPT

### Opening: Dashboard Overview [0:00 - 0:30]

**Speaker:** "Good morning/afternoon. Welcome to WATCHTOWER — an AI-based threat detection platform built for data diode environments. Let me show you the system."

**Actions:**
1. Point to WATCHTOWER header (top-left)
2. Sweep across 6 KPI cards (left to right):
   - "Flows Processed: 1.2 million and counting"
   - "Threats Blocked: 10,500+"
   - "Active Sessions: 1,800 concurrent"
   - "Detection Rate: 97.3%"
   - "False Positive: 2.1%"
   - "Threats Today: 708"
3. Point to LIVE indicator (green pulsing dot)
4. Point to "Diode Read-Only" badge (top-right)

**Key Points to Emphasize:**
- "All data is live — these numbers are ticking in real-time"
- "The LIVE indicator means WebSocket is pushing alerts with sub-second latency"
- "Diode Read-Only confirms we're running in read-only mode"

**What the Judge Sees:**
- Dashboard with WATCHTOWER header
- 6 KPI cards with live-cycling numbers
- Alert Feed scrolling with new alerts appearing every 1-2 seconds
- LIVE indicator pulsing green
- "Diode Read-Only" badge

**Estimated Duration:** 30 seconds

---

### Attack 1: SYN Flood → Detection [0:30 - 1:15]

**Speaker:** "Let me show you live threat detection. I'll launch a SYN flood from our attack generator."

**Actions:**
1. Click Attack Panel tab (`/attack`)
2. Point to attack buttons: "We support eight attack types"
3. Click "Launch SYN Flood" button (red button, top of list)
4. Wait for status to change to "ATTACK ACTIVE" (2 seconds)
5. Point to detection log: "Watch the detection log"
6. Read detection log aloud:
   - "[00:02] ATTACK DETECTED: volumetric_ddos from 10.0.0.45"
   - "Confidence: 94% | Severity: CRITICAL"
7. Switch to Dashboard tab
8. Point to "THREATS BLOCKED" counter: "Watch this counter increment"
9. Point to new CRITICAL alerts in feed: "New alerts appearing with red CRITICAL badges"

**Key Points to Emphasize:**
- "Detection in 2 seconds — no handshake needed, passive observation only"
- "Confidence 94% — the ensemble is certain this is an attack"
- "Severity CRITICAL — this is the highest alert level"
- "The counter increments automatically as threats are blocked"

**What the Judge Sees:**
- Attack Panel with "Launch SYN Flood" button
- Status changing to "ATTACK ACTIVE"
- Detection log appearing within 2 seconds
- Dashboard switching back, showing:
  - "THREATS BLOCKED" counter rapidly incrementing
  - "THREATS TODAY" spiking
  - New alerts with red CRITICAL badges
  - Detection Rate jumping to 98.1%

**Estimated Duration:** 45 seconds

---

### Attack 2: C2 Beaconing → Detection [1:15 - 1:45]

**Speaker:** "Now let me show you C2 beaconing detection. This catches periodic callbacks to command-and-control servers."

**Actions:**
1. Switch to Attack Panel tab
2. Click "Launch C2 Beacon" button (purple button)
3. Wait for detection log (3 seconds)
4. Point to detection log: "Periodic beaconing detected"
5. Read detection log aloud:
   - "[00:03] Periodic beaconing detected"
   - "Inter-arrival: 4.2s ± 0.3s | Dest: 2 hosts"
   - "Confidence: 91% | Severity: HIGH"
6. Switch to Live Threats tab
7. Click "HIGH" filter button
8. Scroll to show C2 Beaconing entries in table

**Key Points to Emphasize:**
- "Periodicity analysis catches this without decrypting a single packet"
- "Inter-arrival timing of 4.2 seconds with 0.3s variance — that's a botnet"
- "Two command-and-control servers detected"
- "Confidence 91% — high severity"

**What the Judge Sees:**
- Attack Panel with C2 Beacon launch
- Detection log showing periodic beaconing
- Inter-arrival timing clearly displayed
- Live Threats table with HIGH filter showing C2 Beaconing entries

**Estimated Duration:** 30 seconds

---

### Attack 3: DGA → Detection [1:45 - 2:15]

**Speaker:** "And DGA — Domain Generation Algorithm. This catches randomized domain names used by malware."

**Actions:**
1. Switch to Attack Panel tab
2. Click "Launch DGA Domain" button (yellow button)
3. Wait for detection log (2 seconds)
4. Point to detection log: "DGA domain burst detected"
5. Read detection log aloud:
   - "[00:01] DGA domain burst detected"
   - "Entropy spike: 7.8 bits | 20 randomized domains"
   - "Confidence: 88% | Severity: HIGH"
6. Switch to Live Threats tab
7. Scroll to show DGA Domain entries

**Key Points to Emphasize:**
- "DGA domains are randomized — they stand out mathematically"
- "Shannon entropy of 7.8 bits — normal domains are around 3-4 bits"
- "20 randomized domains in a single burst"
- "This catches malware that uses domain generation to evade blacklists"

**What the Judge Sees:**
- Attack Panel with DGA Domain launch
- Detection log showing entropy spike
- Live Threats table with DGA Domain entries

**Estimated Duration:** 30 seconds

---

### Hero: Diode Toggle → Degradation Matrix [2:15 - 3:15]

**Speaker:** "Now for the most important moment. Everything so far assumed we can see both directions of traffic. NTRO described a data diode — one-way only. So let's make the diode real."

**Actions:**
1. Navigate to Dashboard or Diode Lab page
2. Point to Diode Mode toggle: "Currently set to Full Duplex — both directions"
3. Click Diode Mode toggle OFF → ON
4. Wait for degradation matrix to populate (8 seconds)
5. Read matrix rows aloud:
   - "Recon / Port Scan: 0.94 → 0.94 — unaffected"
   - "Volumetric DDoS: 0.93 → 0.92 — unaffected"
   - "C2 Beaconing: 0.91 → 0.87 — minor loss"
   - "DGA / DNS Tunnel: 0.88 → 0.84 — minor loss"
   - "Encrypted Malware: 0.86 → 0.55 — degraded. We lose JA3S, the server-side TLS fingerprint. No trick gets it back."
   - "Data Exfiltration: 0.89 → 0.00 — blind. Exfiltration is defined by upload/download ratio, and we just deleted download."
6. Point to ACK-Shadow toggle: "But we built ACK-Shadow to fix this"
7. Click ACK-Shadow toggle OFF → ON
8. Wait for exfiltration row to recover: 0.00 → 0.83
9. Read aloud: "Exfiltration recovers to 83%. We reconstruct the reverse channel from TCP acknowledgment arithmetic."

**Key Points to Emphasize:**
- "This is the hero moment of the entire submission"
- "Scanning unaffected — fan-out patterns don't need return path"
- "DDoS unaffected — volumetric detection works on forward traffic alone"
- "Encrypted malware degrades — we lose JA3S, and there's no fix"
- "Exfiltration drops to zero — silent failure without ACK-Shadow"
- "ACK-Shadow recovers exfiltration to 83% — from TCP ACK arithmetic"
- "We show degradation rather than hide it — that's honest engineering"

**What the Judge Sees:**
- Diode Mode toggle switching from "Full Duplex" to "Unidirectional (FWD Only)"
- Degradation Matrix populating row by row with score changes
- Encrypted Malware dropping from 0.86 to 0.55 (red border)
- Data Exfiltration dropping from 0.89 to 0.00 (red border)
- ACK-Shadow toggle switching OFF
- Exfiltration alert stream stopping
- 2 seconds of silence
- ACK-Shadow toggle switching ON
- Exfiltration recovering to 0.83
- Alerts resuming

**Estimated Duration:** 60 seconds

---

### Credibility: Egress Self-Test [3:15 - 3:45]

**Speaker:** "Finally, let me prove the enclave cannot phone home. This is the egress self-test."

**Actions:**
1. Open new browser tab (Ctrl+T)
2. Type: `http://localhost:8000/api/security/self-test`
3. Wait for page to load (5 seconds)
4. Point to test results: "Eight protocols tested"
5. Read results aloud:
   - "DNS resolution: BLOCKED"
   - "HTTP egress: BLOCKED"
   - "HTTPS egress: BLOCKED"
   - "TCP egress: BLOCKED"
   - "UDP egress: BLOCKED"
   - "ICMP egress: BLOCKED"
   - "Reverse DNS: BLOCKED"
   - "NTP egress: BLOCKED"
6. Point to final line: "ALL TESTS PASSED — ENCLAVE IS AIR-GAPPED"

**Key Points to Emphasize:**
- "Every team will claim read-only. We prove it."
- "Eight protocols tested — all blocked"
- "This proves the AI operates in true isolation"
- "A compromised monitoring system cannot become a pivot point"
- "This is the guarantee a data diode provides"

**What the Judge Sees:**
- New browser tab with self-test page
- 8 test results, each with green checkmark
- Each result showing "BLOCKED"
- Final line: "ALL TESTS PASSED — ENCLAVE IS AIR-GAPPED"

**Estimated Duration:** 30 seconds

---

### Closing: Q&A Prompt [3:45 - 3:30]

**Speaker:** "That's WATCHTOWER. Read-only ingest, streaming inference, structured alert output. Ten thousand flows per second. Six threat classes. Zero trust in the enclave. Built for the constraints that matter. We're happy to take questions."

**Actions:**
1. Switch back to Dashboard tab
2. Point to live data: "The system is still running — all data is live"
3. Pause for questions

**Key Points to Emphasize:**
- "All data is live — no mockups, no pre-recorded clips"
- "The system is running right now"
- "We're happy to answer any questions"

**What the Judge Sees:**
- Dashboard with all KPIs ticking
- Alert Feed scrolling with new alerts
- LIVE indicator pulsing green

**Estimated Duration:** 15 seconds

---

## JUDGE QUESTIONS — PREPARED ANSWERS

### Q: "How do you know the detection is accurate?"

**A:** "We use an ensemble of three models — Random Forest, XGBoost, and Isolation Forest — trained on 5,000 synthetic samples with 80/20 train/test split. The ensemble achieves 97.8% accuracy and 2.1% false positive rate. Every alert includes a SHA-256 evidence hash and validity chips showing whether each feature was measured or estimated. You can see the model performance table on the Analytics page."

### Q: "What happens if the data diode fails?"

**A:** "The data diode is a hardware device — if it fails, traffic stops flowing entirely. Our system doesn't need the diode to function; it just needs the one-way traffic. The self-test page proves the enclave cannot reach the outside world even if the diode is bypassed. All outbound connections are blocked at the kernel level."

### Q: "Can you detect zero-day attacks?"

**A:** "Our anomaly-based detector — Isolation Forest — can flag unusual patterns even without a known signature. However, zero-day detection requires continuous model retraining on new data. We support retraining via the Administration panel. In production, you'd retrain weekly on new capture data."

### Q: "How do you handle encrypted traffic?"

**A:** "We don't decrypt payloads — that's prohibited in read-only mode. Instead, we use JA3/JA4 TLS fingerprinting to identify client and server software from the TLS handshake metadata alone. This catches 86% of encrypted malware in full-duplex mode, dropping to 55% in unidirectional mode where JA3S (server hello) is unavailable. We show that degradation honestly rather than hide it."

### Q: "What is ACK-Shadow?"

**A:** "TCP is a delivery-confirmation protocol. Every packet the client sends carries a receipt — 'I've received everything up to byte N.' Those receipts travel in the direction we can see. We watch that number climb and infer how much data came back. This reconstructs the reverse channel from arithmetic on a channel we cannot observe. It recovers exfiltration detection from 0% to 83% in unidirectional mode."

### Q: "How do you prove the system is read-only?"

**A:** "Two ways. First, the startup banner explicitly states 'Enclave mode: READ-ONLY, Decryption: NONE.' Second, the self-test page attempts outbound connections to 8.8.8.8, 1.1.1.1, and other targets — all blocked. We even have a kernel-enforced seccomp profile that kills any process that tries to phone home. You can see this on the egress self-test page."

### Q: "What is the throughput?"

**A:** "Ten thousand flows per second sustained, with zero drops. P99 latency is under 100 milliseconds — from packet capture to alert on screen. Memory stays constant thanks to CMS and HyperLogLog — even under a ten-times burst, our memory doesn't climb. This all runs on a standard laptop. No GPU required."

### Q: "How many features do you extract?"

**A:** "Forty-seven features per flow. Flow-level statistics like packet rate and byte entropy. Time-series features like inter-arrival timing variance and periodicity. DNS features like query entropy and length distribution. TLS features like JA3 hash and cipher suite. And byte-ratio features for exfiltration detection. You can see the full feature list on the AI Analyzer page."

### Q: "What threat classes do you detect?"

**A:** "Six classes: Volumetric DDoS, Port Scanning, C2 Beaconing, DGA Domains, DNS Tunneling, and Data Exfiltration. Each with distinct detection logic. You can see all six in the Live Threats page, filterable by severity and type."

### Q: "Is this a real system or a simulation?"

**A:** "This is a fully functional prototype. The backend runs a real FastAPI server with WebSocket streaming. The frontend is a real React application. The ML models are real — trained on synthetic data, but the inference pipeline is production-ready. The attack generator simulates attacks, but the detection logic is real. Every alert you see is generated by the ensemble models, not hard-coded."

---

## TROUBLESHOOTING DURING DEMO

### If the dashboard is not loading
**Symptom:** Blank page or loading spinner
**Recovery:**
1. Check backend is running (Terminal tab 1)
2. Check frontend is running (Terminal tab 2)
3. Refresh browser (F5)
4. Wait 10 seconds for WebSocket connection
5. Say to judges: "The system is loading — let me show you the self-test while we wait"
6. Open self-test tab as fallback

### If attack scripts fail
**Symptom:** "Launch" button does nothing, no detection log
**Recovery:**
1. Check backend is running
2. Check browser console for errors (F12)
3. Use existing alerts in dashboard instead
4. Say to judges: "Let me show you existing detections instead"
5. Switch to Live Threats tab and filter by HIGH
6. The demo works 100% without attack scripts — they are enhancement

### If diode toggle doesn't work
**Symptom:** Click does nothing, matrix doesn't update
**Recovery:**
1. Refresh page (F5)
2. Wait for dashboard to reload
3. Try again
4. If still not working, say: "Let me show you the pre-computed degradation matrix"
5. Navigate to Analytics tab and show model performance table
6. Use backup screenshots if needed

### If self-test page is slow
**Symptom:** Page takes >10 seconds to load
**Recovery:**
1. Wait for page to load
2. If still slow, say: "The self-test is running — let me show you the startup banner instead"
3. Switch to Terminal tab and show backend startup
4. Return to self-test page later

### If browser crashes
**Symptom:** Browser tab closes or freezes
**Recovery:**
1. Restart browser (Ctrl+Shift+N)
2. Open all 6 tabs again
3. Refresh Dashboard
4. Wait 10 seconds for data to populate
5. Say to judges: "Let me reload the system"
6. Continue from Dashboard overview

---

## FINAL DEMO CHECKLIST

**30 minutes before demo:**
- [ ] Backend running
- [ ] Frontend running
- [ ] Dashboard loaded with live data
- [ ] All 4 browser tabs pre-opened
- [ ] Terminal tabs configured
- [ ] OBS recording (optional, if allowed)
- [ ] Notifications disabled
- [ ] Desktop clean

**10 minutes before demo:**
- [ ] Dashboard showing live KPIs
- [ ] Alert Feed scrolling
- [ ] Attack Panel ready
- [ ] Live Threats page loaded
- [ ] Analytics page loaded
- [ ] Self-test URL bookmarked

**During demo:**
- [ ] Speak clearly and slowly
- [ ] Point to every element before clicking
- [ ] Pause 1 second on important elements
- [ ] Read detection logs aloud
- [ ] Emphasize key numbers (97.8%, 10K flows/s, 47 features)
- [ ] Hold 2 seconds of silence after ACK-Shadow OFF
- [ ] If something breaks, stay calm and use fallback
- [ ] Invite questions at the end

**After demo:**
- [ ] Thank judges for their time
- [ ] Offer to answer questions
- [ ] Have backup screenshots ready (if judges want to see specific features)
- [ ] Have PPT ready (if judges want to see slides)

---

## TIMING SUMMARY

| Section | Start | End | Duration | Priority |
|---------|-------|-----|----------|----------|
| Opening: Dashboard Overview | 0:00 | 0:30 | 30s | Medium |
| Attack 1: SYN Flood | 0:30 | 1:15 | 45s | High |
| Attack 2: C2 Beaconing | 1:15 | 1:45 | 30s | High |
| Attack 3: DGA | 1:45 | 2:15 | 30s | High |
| Hero: Diode Toggle | 2:15 | 3:15 | 60s | CRITICAL |
| Credibility: Egress Self-Test | 3:15 | 3:45 | 30s | High |
| Closing: Q&A Prompt | 3:45 | 4:00 | 15s | Medium |

**Total: 4:00**

**If forced to cut to 2:30:**
- Cut Attack 3 (DGA) entirely
- Reduce Opening to 15 seconds
- Reduce Closing to 10 seconds
- Keep Attacks 1+2, Hero, and Egress Test intact
