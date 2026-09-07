# Demo Guide — the four minutes that win the room

**Everything runs offline from a local PCAP replay in one container.** No internet, no live network, no cloud. If it can fail, it will fail on stage.

---

## Setup (before the judges arrive)

```bash
docker load -i ekadhara.tar
docker run --rm -it \
  --network none \
  --cap-add NET_RAW \
  -v $PWD/captures:/data:ro \
  -p 8080:8080 \
  ekadhara:demo
```

Open the dashboard. Load `s36_killchain_BI.pcap` and pause at t=0. Have `s36_killchain_FWD.pcap` ready in the second slot.

**Rehearse the exact command sequence five times.** Muscle memory beats confidence.

---

## The script

### Beat 0 — the setup line (15 s)

> *"Everything you're about to see is running with the network interface disabled. Watch."*

Show the terminal: `--network none`. Then run the egress self-test:

```bash
ekadhara --self-test-egress
```

It attempts a callback. The kernel kills it. The audit line prints.

> *"The problem statement says read-only ingest. Every team will put that on a slide. We let the kernel enforce it — that process just tried to phone home and the seccomp filter killed it."*

**Why open here:** it is unexpected, it takes 15 seconds, and it establishes that we do things rather than claim them. Everything after this is heard more credulously.

---

### Beat 1 — live detection (60 s)

Start the replay at the stated rate. Point at the HUD.

> *"That's the sustained rate, that's the drop rate — zero — and that's p99 alert latency. The problem statement asks us to state and demonstrate our throughput. That's it, live."*

Alerts begin appearing. Let a scan alert land, then a beacon alert.

Click into the beacon alert.

> *"Every alert carries its own evidence, because in an air-gapped enclave the analyst has no way to check anything independently. Here's the inter-arrival histogram — 60 seconds, 30% jitter. Here are the three features that drove the decision, by SHAP contribution. Here's the SHA-256 of the exact bytes in the capture that caused it. And here's the calibrated confidence: 0.87, which historically means correct about 87% of the time — we published the reliability diagram."*

---

### Beat 2 — the kill chain (30 s)

Switch to the incident view.

> *"Three detectors fired on the same host over three hours: a port scan, then C2 beaconing, then data egress. Most systems would give the analyst three unrelated alerts buried in four hundred. We correlate them into one incident, escalate the severity, and lead with the story: reconnaissance, then command-and-control, then roughly four gigabytes out."*

Pause. Then:

> *"Remember that four gigabytes. It matters in about twenty seconds."*

---

### Beat 3 — THE DIODE TOGGLE (90 s) ★ the moment

> *"Now. Everything so far assumed we can see both directions of every conversation. But NTRO's problem statement describes a hardware data diode — traffic copied one way only. So let's make the diode real."*

**Flip the toggle.** The same replay, now forward-direction only.

The degradation panel populates live. Point at it:

> *"Scanning: unaffected. DDoS: unaffected. Beaconing: barely moves. Encrypted malware: drops — we lost the server-side TLS fingerprint, and there is no trick that gets that back. We put that on our slide rather than hiding it."*

Now point at the exfiltration row.

> *"And exfiltration should be dead. It's defined by the ratio of outbound to inbound bytes — and we just deleted inbound. Watch what happens when I turn off our reconstruction layer."*

**Toggle ACK-Shadow off.** The exfiltration detector flatlines. Alerts stop.

> *"That is what every other solution to this problem statement looks like on a real diode. It doesn't error. It doesn't warn you. It just quietly stops finding anything, and keeps reporting high confidence on everything else."*

**Toggle ACK-Shadow back on.** Exfiltration alerts resume. The four-gigabyte figure reappears.

> *"TCP is a delivery-confirmation protocol. Every packet the client sends carries an acknowledgement number saying 'I've received everything up to byte N.' We never see the server's packets — but we watch that number climb, and the climb tells us exactly how much came back. Four point one gigabytes, reconstructed from arithmetic on a channel we cannot see."*

**This is the whole submission in ninety seconds.** Rehearse it until it is automatic. If everything else fails, this beat alone should win the room.

---

### Beat 4 — the memory chart (30 s)

Switch to the burst view. Ramp offered load 10×.

> *"One last thing. Most detectors key a hash map on source IP. Under a spoofed-source flood every packet creates a new key — so the DDoS attack kills the DDoS detector. That red line is a naive implementation we built specifically to show you this. The flat line is ours: Count-Min Sketch and HyperLogLog, constant memory whether we're seeing a thousand flows a second or a million."*

---

### Beat 5 — close (15 s)

> *"Everything you just saw ran with no network, from a container you could carry into an air-gapped facility on a USB stick. Alerts come out as OCSF, so it plugs into any SIEM. And the alert ledger is a Merkle hash chain — no alert can be quietly altered after the fact, which is what the problem statement means by chain of custody."*

---

## Timing

| Beat | Content | Time |
|---|---|---|
| 0 | Egress self-test | 0:15 |
| 1 | Live detection + evidence drill-down | 1:15 |
| 2 | Kill-chain incident | 1:45 |
| 3 | **Diode toggle + ACK-Shadow** | **3:15** |
| 4 | Memory chart | 3:45 |
| 5 | Close | 4:00 |

If time is cut to two minutes: **Beat 0 + Beat 3 only.** Those two carry the entire argument.

---

## Contingencies

| Failure | Response |
|---|---|
| Container won't start | Pre-recorded video, cued to Beat 3. Say *"let me show you the recording"* without apology and keep moving. |
| Dashboard renders wrong on the projector | Test resolution beforehand; keep a screenshot deck as fallback. |
| Replay too slow on their hardware | Ship a lower-rate PCAP variant; the story is unchanged, only the HUD number differs. |
| Judge interrupts mid-demo | Answer, then explicitly return: *"— and this next part answers that directly."* Never abandon Beat 3. |
| Asked to run on *their* PCAP | **Say yes.** It works; that is the point of a general detector. If it produces nothing interesting, say so honestly: *"clean traffic, no detections — which is the correct answer."* |

---

## Rules

1. **Never demo from the internet.** Not for a font, not for a CDN, not for anything.
2. **Never demo an unrehearsed feature.** If it wasn't in the last three rehearsals, it doesn't exist today.
3. **The toggle is the hero.** Structure everything so it lands at the 3-minute mark with time to let it breathe.
4. **Pause after the ACK-Shadow reveal.** Let the silence do the work. Do not talk over your own best moment.
5. **If a number on screen disagrees with the deck, say so.** *"That's a live run, the deck shows our benchmark average."* Honesty about a discrepancy costs nothing; being caught costs everything.
