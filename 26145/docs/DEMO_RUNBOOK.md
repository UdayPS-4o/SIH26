# Demo Runbook — EKADHARA Live Demo

Step-by-step instructions for presenting EKADHARA to judges, with timing, talking points, and fallback narration for every section.

**Total demo time: ~4 minutes. Rehearse at least 5 times before the presentation.**

---

## Pre-Demo Checklist (5 minutes before)

- [ ] Backend running on `localhost:8000`
- [ ] Frontend running on `localhost:5173`
- [ ] Browser at fullscreen (F11), dark theme visible
- [ ] Dashboard showing live data (not empty)
- [ ] Attack Lab page accessible
- [ ] Terminal window open with egress self-test command ready
- [ ] PCAP capture file ready if doing live replay demo

---

## Beat 0 — Egress Lockdown Proof (15 seconds)

**Action:** Switch to terminal. Run:

```bash
# Show the Docker container is running with --network none
docker ps | grep ekadhara

# Run the egress self-test
curl http://localhost:8000/api/self-test-egress
```

**Expected output:**

```
[egress-self-test] Attempting outbound connection to 8.8.8.8:53...
[egress-self-test] BLOCKED: seccomp denied sendto (errno 1)
[egress-self-test] Result: PASS — egress is structurally enforced
```

**Talking point:**

> "The problem statement says read-only ingest. Every team will put that on a slide. We let the kernel enforce it — that process just tried to phone home and the seccomp filter killed it."

**Fallback if backend is down:**

> "In offline mode, the same enforcement is visible in the Docker run command — `--network none`, seccomp profile denying connect and sendto, and no HTTP client in the binary. The self-test command demonstrates it when the backend is running."

---

## Beat 1 — Live Detection Dashboard (60 seconds)

**Action:** Switch to browser. Dashboard is already showing live data. Narrate the key metrics:

1. **Throughput strip**: "That's five thousand flows per second sustained, with zero drops."
2. **Detection rate**: "F1 of 0.92 across seven threat classes."
3. **Alert feed**: "Alerts arriving in real time via WebSocket — here's a port scan, here's a beaconing detection."
4. **Click an alert**: "Every alert carries structured evidence — source IP, destination, port, confidence, the three features that drove the decision, and a SHA-256 hash of the exact bytes that caused it."

**Talking points:**

- "The problem statement asks us to state our throughput. Here it is, live, with the drop rate beside it — because a throughput claim without a drop rate is meaningless."
- "This isn't a mockup. These are real detections from the simulator running in the backend right now."
- "The alert feed arrives via WebSocket. If the backend goes down, the frontend automatically switches to its built-in simulator — so the demo never breaks."

**Fallback if WebSocket is disconnected:**

> "The backend is running the TrafficSimulator which generates synthetic flows and passes them through the ThreatDetector. When we can't connect to a live backend, the frontend's MockBackend generates the same patterns in-browser — so the demo is always live."

---

## Beat 2 — Attack Lab (45 seconds)

**Action:** Navigate to Attack Lab. Launch a SYN flood:

1. Click "SYN Flood" attack card
2. Set intensity to 0.7
3. Click "Launch Attack"
4. Switch to Live Threats tab to show alerts arriving

**Talking points:**

- "Let me trigger an attack. SYN flood, 70% intensity."
- "The simulator generates the attack traffic, feeds it through the detectors, and the alerts appear here in the Live Threats feed."
- "Notice the confidence scores — 87 to 95 percent. These are calibrated probabilities, not arbitrary thresholds."
- "The DDoS detector uses a two-stage approach: a CUSUM change-point detector catches the rate increase first, then the LightGBM classifier confirms the attack type."

**Fallback if attack launch fails:**

> "The attack launcher sends a POST to the backend's `/api/attack/launch` endpoint. In demo mode, the MockBackend simulates the same attack patterns with realistic timing. You'd see the same alerts appear in the Live Threats feed."

---

## Beat 3 — Diode Toggle & Degradation Matrix (60 seconds)

**Action:** Navigate to Diode Lab (or the diode toggle on the dashboard).

1. Show the current state: Full-Duplex mode, all detectors active
2. Switch to DIODE_ONLY mode
3. Point at the degradation matrix as it populates
4. Switch back to ACK-Shadow mode
5. Show the recovery

**Talking points:**

- "Now — the most important moment in this demo. Everything so far assumed we can see both directions. But NTRO's problem statement describes a hardware data diode. So let's make it real."
- "Flip to diode-only mode. The same traffic, forward direction only."
- "Scanning: barely affected — we see the probes going out. DDoS: barely affected — rate is in the forward direction. DGA: actually improved, because DNS queries carry everything we need."
- "Data exfiltration drops — we lost the inbound bytes. But ACK-Shadow recovers most of it. The TCP acknowledgement numbers tell us how much the server sent back, even though we never saw those packets."
- "The degradation matrix is our proof of constraint. Every capability loss is measured and declared. No silent failures."

**Fallback if diode toggle is unavailable:**

> "The degradation matrix in our evaluation report shows the exact numbers. DDoS drops from 0.94 to 0.92 under forward-only. Exfiltration drops from 0.88 to 0.78 — but ACK-Shadow recovers it to 0.84. We'd rather show you where we break than claim we don't."

---

## Beat 4 — Closing Statement (20 seconds)

**Talking point:**

> "EKADHARA detects six threat classes from unidirectional traffic. Five thousand flows per second, thirty-five millisecond latency, F1 of 0.92. The kernel enforces our read-only constraint. Every feature knows when it's estimated or missing. And the degradation matrix tells you exactly what the diode costs. Thank you."

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Backend won't start | Check port 8000 is free; verify Python 3.11+; run `pip install -r requirements.txt` |
| Frontend blank | Check port 5173; run `npm install`; check browser console for errors |
| No alerts appearing | Verify WebSocket connection in browser dev tools; check backend logs |
| Attack launch fails | Check backend is running; verify `/api/attack/launch` endpoint exists |
| Diode toggle missing | Ensure `diode_sim.py` is importable; check server logs for import errors |
| Slow performance | Check CPU usage; reduce `--max-flows`; close other applications |
