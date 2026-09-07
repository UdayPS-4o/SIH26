# EKADHARA · SIH26145

**एकधारा — "single stream"**
### See everything. Touch nothing.

> Passive AI threat intelligence for air-gapped monitoring enclaves.
> **SIH26145** · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic · **NTRO** · Software · Blockchain & Cybersecurity

---

## The 30-second version

NTRO's critical-infrastructure monitoring enclaves are fed by **hardware data diodes** — traffic copied in one direction, no path back. Every commercial network-detection product breaks there, because they all enrich by reaching out: reverse-DNS, threat-intel APIs, active scans, endpoint agents. None of that resolves inside an air gap.

EKADHARA ingests that one-way stream and produces calibrated, evidence-carrying alerts across all six threat classes the PS names — **without transmitting a packet, resolving a hostname, or decrypting a byte.**

**And the insight nobody else will have:** the problem statement contradicts itself. It specifies a diode (one direction), then asks for outbound-to-inbound byte ratios and server-side TLS fingerprints — both of which need the direction a diode removes. The standard toolchain everyone will use (CICFlowMeter → CIC-IDS2017 → tree ensemble) silently zeroes half its features under real diode capture and keeps emitting confident scores. **It fails, and it never tells you.**

We build for both readings, measure the gap, and close it.

---

## Read in this order

| # | Doc | For |
|---|---|---|
| 1 | [`plan.md`](plan.md) | **The master plan.** What NTRO wants in plain English, how we tackle it, the innovations, and the vocabulary that wins. Start here. |
| 2 | [`docs/what-we-are-building.md`](docs/what-we-are-building.md) | The project explained with zero jargon — hand this to anyone joining |
| 3 | [`docs/domain-brief.md`](docs/domain-brief.md) | New to cybersecurity? The domain from scratch |
| 4 | [`docs/PROTOTYPE-SCOPE.md`](docs/PROTOTYPE-SCOPE.md) | **The build list.** 14 features, each traced to a video frame or a deck number |
| 5 | [`docs/innovations.md`](docs/innovations.md) | The differentiators in depth, with judge-facing framing |
| 6 | [`docs/risks-and-rebuttals.md`](docs/risks-and-rebuttals.md) | 15 hostile judge questions, pre-answered |

## Submission artifacts

| Artifact | File | Status |
|---|---|---|
| **Deck** — 6 slides, speaker notes, native charts | [`deck/EKADHARA_SIH26145.pptx`](deck/EKADHARA_SIH26145.pptx) | Built · **numbers are placeholders** |
| Deck script — exact text, layouts, timing, delivery | [`docs/PPT-FINAL.md`](docs/PPT-FINAL.md) | Done |
| **Demo video** — 2:00, shot by shot | [`docs/VIDEO-SCRIPT.md`](docs/VIDEO-SCRIPT.md) | Scripted · not shot |
| **Architecture doc** — 2 pages, camera-ready | [`docs/ARCHITECTURE-2PAGER.md`](docs/ARCHITECTURE-2PAGER.md) | Done |
| Live demo script — 4 min | [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md) | Done |
| Flowcharts — 10 Mermaid diagrams | [`docs/architecture-diagram.md`](docs/architecture-diagram.md) | Source only · not yet rendered into the deck |
| Source repository | — | **Not started** |

Regenerate the deck:
```bash
cd deck && npm install && node build.js
```

**Reference:** [`PS.md`](PS.md) · [`docs/detector-designs.md`](docs/detector-designs.md) · [`docs/data-strategy.md`](docs/data-strategy.md) · [`docs/evaluation-protocol.md`](docs/evaluation-protocol.md) · [`docs/implementation-flow.md`](docs/implementation-flow.md) · [`docs/tech-stack.md`](docs/tech-stack.md)

---

## The ten innovations

| # | Name | One line |
|---|---|---|
| 1 | **Diode-Twin Evaluation** ★ | Every detector scored on paired full-duplex / true-one-way captures; degradation matrix published |
| 2 | **ACK-Shadow Reconstruction** ★ | Recover unseen reverse-channel byte volume from TCP ACK-number progression |
| 3 | **Egress Lockdown** | seccomp + netns make transmission *impossible*, not merely unimplemented — demonstrated live |
| 4 | **Constant-Memory Streaming** | Sketches, not hash maps. *Most detectors get DoS'd by the DDoS they detect.* |
| 5 | **Alert-Budget Precision (P@k)** | Evaluate at the analyst's real capacity — 50 alerts/hour — not at threshold 0.5 |
| 6 | **Calibrated Confidence** | The PS demanded a confidence score. We prove ours means what it says. |
| 7 | **Merkle Custody Chain** | Tamper-evident alert ledger → forensic admissibility. The *legitimate* use of the blockchain theme. |
| 8 | **Adversarial Evasion Suite** | We attack ourselves and publish where each detector breaks |
| 9 | **Kill-Chain Fusion** | scan → beacon → exfil becomes ONE escalating incident, not three orphan alerts |
| 10 | **UniFlow-IN dataset** | First public corpus with paired bidirectional / diode-capture variants and packet-level labels |

Plus three deployment innovations nobody else addresses: **Sneakernet Model Lifecycle** (models go stale in an air gap), **Self-Baselining Warm-Up** (every network is different), **Monitoring Integrity Alerts** (nobody watches the watchman).

---

## Architecture at a glance

```
┌─ EGRESS LOCKDOWN (netns none + seccomp deny sendto/connect/sendmsg) ─────────┐
│                                                                              │
│  ① INGEST ──► ② FLOW ASSEMBLY ──► ③ FEATURE FABRIC ──► ④ DETECTORS ──►      │
│   read-only     + DIRECTION MASK    Tier A/B/C          6 specialists         │
│   pcap/live/    FWD | REV | BOTH    + ACK-SHADOW        streaming,            │
│   IPFIX                             validity flags      bounded memory        │
│                                                                              │
│  ──► ⑤ FUSION ──► ⑥ EVIDENCE + CUSTODY ──► ⑦ DASHBOARD                      │
│      calibration    SHAP · SHA-256 · OCSF     live HUD · DIODE TOGGLE        │
│      kill-chain     Merkle chain              degradation panel               │
└──────────────────────────────────────────────────────────────────────────────┘

Zeek (capture · flow · DNS/TLS/JA4) → Python detectors → ONNX → OCSF → React
Single OCI image ·  docker run --network none
```

---

## Status

Docs and deck complete. **Prototype not started.**

**Start here → the Week-1 Control Experiment.** Three days, before any other code:
generate one scenario per threat class → derive the one-way twin → run the standard approach (CICFlowMeter + RandomForest) on both → read the two F1 numbers.

That single experiment either hands us our headline slide or tells us the thesis is wrong while changing course is still free.

| Scope tier | Items | State |
|---|---|---|
| **MUST** (M1–M9) | Testbed + twins · control experiment · Zeek pipeline · **ACK-Shadow** · 4 detectors · **degradation matrix** · dashboard + diode toggle · OCSF evidence · perf numbers | ☐ |
| **SHOULD** (S1–S6) | DGA/DNS · calibration · egress lockdown · Merkle chain · monitoring-integrity alerts · flow-only mode | ☐ |
| **COULD** (C1–C7) | Encrypted-malware detector · evasion suite · kill-chain fusion · zero-egress enrichment · self-baselining · model lifecycle · dataset release | ☐ |

*Nothing in COULD gets a line of code until every MUST item has a measured number attached.*

---

## Three rules we hold ourselves to

1. **Every number in the deck comes from the evaluation harness.** No hand-typed figures. A judge who catches one invented number discards the whole deck.
2. **Every measured weakness goes on a slide.** Hiding one forfeits the "zero silent failures" claim that is our entire thesis.
3. **Never claim a capability we haven't run.** *"Designed, not yet implemented"* is respectable. *"It works"* when it doesn't is not recoverable.
