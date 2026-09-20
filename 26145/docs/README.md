# EKADHARA — Project Overview

**AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**

PS-26145 · Smart India Hackathon 2026 · National Technical Research Organisation (NTRO)

---

## One-Liner

EKADHARA is a streaming, passive, multi-class threat detection system that identifies six threat categories from unidirectional network traffic — including across hardware data diodes — using a hybrid ensemble of rule-based and ML detectors with no payload decryption.

---

## Problem Summary

Government and critical-infrastructure networks are monitored through hardware data diodes or passive mirrors that copy traffic in one direction only. The monitoring enclave can observe everything crossing the link but has no physical or protocol-level path back into the production network. This constraint removes an entire class of attack vectors but also makes standard detection techniques unreliable: bidirectional flow features become unavailable or biased, and conventional IDS toolchains silently degrade without warning. The system must detect and classify six threat types — volumetric DDoS, C2 beaconing, DGA/DNS tunnelling, TLS anomalies, port scanning, and data exfiltration — using only passively collected flow metadata, in real time, with bounded latency and a structured alert schema.

---

## Key Innovations

- **Diode-Twin Evaluation** — Every capture exists as a triplet (full-duplex, forward-only, reverse-only). Identical models at identical thresholds are scored across all three, producing a published degradation matrix. We are the only submission that quantifies what the system loses when the diode is real.
- **ACK-Shadow Reconstruction** — TCP acknowledgement numbers observed in the visible direction are used to estimate unseen reverse-path byte volume, restoring the inbound-to-outbound ratio required by the problem statement without violating the diode constraint. Works for TCP; QUIC/UDP gaps are stated openly.
- **Egress Lockdown** — Read-only ingest is enforced structurally: `docker run --network none`, a seccomp-bpf profile denying `connect`/`sendto`/`sendmsg`, and an `AF_PACKET` socket with no transmit ring. A `--self-test-egress` flag attempts a callback so the kernel killing it becomes a live demonstration.
- **Directionality-Aware Feature Fabric** — Every feature is emitted as `{value, validity}` where validity ∈ {OBSERVED, INFERRED, MISSING}. Models receive the validity mask as input so they know when they are reasoning about an inferred value. Silent degradation becomes measurable.
- **Six Streaming Specialists** — Rather than one monolithic classifier, EKADHARA runs six dedicated detectors (one per threat class) over bounded sliding windows. DDoS operates on 1-second windows; beaconing on 1-hour windows; exfiltration on 5-minute windows. Each uses memory-bounded sketches (Count-Min Sketch, HyperLogLog, Space-Saving) so state remains constant regardless of attack scale.

---

## Threat Classes Covered

| # | Threat Class | Primary Signal |
|---|---|---|
| 1 | **Volumetric / Protocol DDoS** | Rate explosion, source-IP entropy, SYN ratio, unanswered SYN ratio |
| 2 | **Botnet C2 Beaconing** | IAT periodicity, payload-size regularity, off-hours check-ins |
| 3 | **DGA Domains & DNS Tunnelling** | DNS query-name entropy, n-gram scores, query-length anomalies |
| 4 | **TLS / Encrypted-Session Anomaly** | JA3/JA4 fingerprint clustering, packet-size/timing sequences |
| 5 | **Reconnaissance & Port Scanning** | Fan-out across destination ports/hosts, sequential probing patterns |
| 6 | **Data Exfiltration** | Asymmetric volume, outbound-to-inbound byte ratio (ACK-Shadow estimated) |

---

## Architecture

The system has five logical layers with no back-channel dependency:

1. **Ingest** — PCAP replay, AF_PACKET capture, or NetFlow/IPFIX/sFlow parser. Stateless, horizontally scalable, drop-and-count under backpressure (never blocks).
2. **Flow Assembly** — Bounded LRU (1 M flows) with FIN/RST and idle eviction. A `direction_mask` (FWD | REV | BOTH) is attached to every flow.
3. **Feature Fabric** — 25+ per-flow features grouped into packet statistics, volume/rate, timing/entropy, behavioral, and content categories. Every feature carries a validity tag. ACK-Shadow runs here to estimate reverse-path bytes.
4. **Detection Ensemble** — Six streaming specialists fuse their calibrated outputs. Rule-based thresholds catch known signatures; Isolation Forest scores anomalies; Logistic Regression classifies attack type.
5. **Output** — Structured alerts (OCSF Detection Finding schema), WebSocket stream to the dashboard, and a rolling Merkle hash chain for evidence custody.

See [ARCHITECTURE-2PAGER.md](ARCHITECTURE-2PAGER.md) for the full layer diagram and constraint-compliance table.

---

## How to Run

### Backend (Python 3.11+)

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

The server starts a `TrafficSimulator` that generates synthetic flows and a `ThreatDetector` that analyses them. Models are trained from synthetic data at startup (falls back gracefully if scikit-learn is unavailable, using rule-based detection).

### Frontend (Node.js 18+)

```bash
cd frontend
npm install
npm run dev
```

The React dashboard connects to the backend via WebSocket (`ws://localhost:8000/ws`). When the backend is unreachable, it falls back to an in-browser `MockBackend` so the UI is always functional.

### Docker (Production)

```bash
docker build -t ekadhara:demo backend/
docker run --rm -it --network none --cap-add NET_RAW -v $PWD/captures:/data:ro -p 8000:8000 ekadhara:demo
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full configuration options, environment variables, and the egress self-test.

---

## Dataset & Training Approach

EKADHARA trains on **synthetic lab-generated traffic** — the approach explicitly recommended in the NTRO problem statement. Benign flows are generated with `iperf3`-style profiles and custom Python emulators. Attack traffic is generated using `hping3` (SYN/UDP floods), `nmap` (port scans), a custom beaconing emulator with configurable jitter, a Markov-chain DGA generator, and DNS tunnelling via `dnscat2`-style patterns.

Additionally, the backend includes a **CIC-IDS2017 training pipeline** (`models.train_cic_ids2017`) that trains a RandomForest on the public CIC-IDS2017 dataset for DDoS detection, providing a real-world baseline alongside the synthetic models.

Training uses a **temporal train/validation/test split** (60/20/20) with stratification by attack type. The Isolation Forest trains on the full feature matrix (benign + attack); the Logistic Regression classifier trains on labeled attack types. SMOTE upsampling balances attack classes during ML training.

---

## Documentation Index

| Document | Contents |
|---|---|
| [TECHNICAL_REPORT.md](TECHNICAL_REPORT.md) | Full technical report: architecture, feature engineering, detection pipeline, performance |
| [ARCHITECTURE-2PAGER.md](ARCHITECTURE-2PAGER.md) | Camera-ready 2-page architecture summary for presentations |
| [MODEL_CARD.md](MODEL_CARD.md) | Model card: training data, per-class metrics, ethical considerations, maintenance |
| [MODELS_AND_FEATURES.md](MODELS_AND_FEATURES.md) | Feature catalogue, per-threat model details, comparison tables, limitations |
| [EVALUATION.md](EVALUATION.md) | Detection metrics, latency, throughput, degradation under diode constraints, baselines |
| [INNOVATIONS.md](INNOVATIONS.md) | Deep-dive on ACK-Shadow, diode-twin evaluation, egress lockdown, validity tagging |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Setup guide, Docker Compose, configuration, demo mode, attack launcher |
| [THREAT_COVERAGE.md](THREAT_COVERAGE.md) | Per-threat-class description, detection signals, evasion analysis, coverage gaps |
| [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md) | Step-by-step live demo script with timing and fallback narration |
| [VIDEO_SCRIPT_FINAL.md](VIDEO_SCRIPT_FINAL.md) | Tight 3-minute video script (4 scenes) for the submission video |
| [PPT-FINAL.md](PPT-FINAL.md) | Presentation slide outline and speaker notes |
| [evaluation-protocol.md](evaluation-protocol.md) | Seven report cards: per-class metrics, P@k, degradation matrix, ACK-Shadow validation |
| [risks-and-rebuttals.md](risks-and-rebuttals.md) | Pre-answered judge Q&A and project risk register |
