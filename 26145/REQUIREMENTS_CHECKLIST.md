# PS 26145 — Complete Requirements Checklist & Build Plan

## Problem Statement Requirements (ALL items)

### A. Threat Detection Types (MUST detect all 6)

| # | Threat Type | What It Is | Detection Method | Status |
|---|------------|-----------|------------------|--------|
| 1 | **DDoS** (volumetric/protocol) | SYN floods, UDP reflection, spoofed-source floods | Flow rate + source IP entropy | `detector.py:_detect_ddos` ✓ |
| 2 | **C2 Beaconing** | Periodic callbacks to few destinations | Inter-arrival time analysis, IAT variance | `detector.py:_detect_beaconing` ✓ |
| 3 | **DGA Domains** | Algorithmically generated domain names | Entropy + n-gram analysis of DNS queries | `detector.py:_detect_dga` ✓ |
| 4 | **DNS Tunnelling** | Data exfil via DNS | Query-length anomalies, entropy | `detector.py:_detect_dns_tunnel` ✓ |
| 5 | **TLS/QUIC Anomaly** | Malware in encrypted sessions | JA3/JA3S fingerprints, packet-size/timing | `detector.py:_detect_tls_anomaly` ✓ |
| 6 | **Port Scanning** | Fan-out from single source across many ports | Fan-out ratio, unique port count | `detector.py:_detect_port_scan` ✓ |
| 7 | **Data Exfiltration** | Asymmetric flow volumes, unusual outbound ratios | Byte ratio anomalies | `detector.py:_detect_exfiltration` ✓ |

### B. AI/ML Pipeline Requirements

| # | Requirement | What They Want | Status |
|---|------------|---------------|--------|
| 1 | **Ingest** | Unidirectional flow stream | `simulator.py` ✓ (mock), real pcap ingest missing |
| 2 | **Feature Extraction** | Flow-level features | `features.py` ✓ (entropy, ngram, flow features, sliding windows) |
| 3 | **Model Inference** | ML scoring | `models.py` ✓ (IsolationForest + LogisticRegression) |
| 4 | **Alert Output** | Structured alerts | `detector.py` ✓ (Alert dataclass with confidence, evidence) |
| 5 | **Near Real-Time** | Bounded latency | WebSocket streaming ✓ |
| 6 | **Throughput Target** | State flows/sec or Mbps | Need to add this explicitly |

### C. Architectural Constraints (MUST adhere to all)

| # | Constraint | Status |
|---|-----------|--------|
| a | **Read-only ingest** — no return path, no live query to source | ✓ (passive mirroring only) |
| b | **No payload decryption** — TLS/QUIC from metadata only | ✓ (JA3 analysis, no decryption) |
| c | **Streaming, not batch** — incremental processing | ✓ (WebSocket streaming, per-flow processing) |
| d | **Throughput target stated** — flows/sec or Mbps | ⚠️ Need to display this |
| e | **Standardized alert schema** — timestamp, flow_id, threat_class, confidence, evidence | ✓ (Alert dataclass) |

### D. Deliverables Required

| # | Deliverable | Status |
|---|------------|--------|
| 1 | Working prototype (source repo) | ✓ (most of it) |
| 2 | Documentation of models, features, training/validation | ⚠️ Need README + docs |
| 3 | Dashboard with live/replayed detections | ✓ (mock backend) |
| 4 | Severity and confidence display | ✓ |
| 5 | Demo video | ❌ NOT STARTED |

## What's Missing / Needs Work

### Backend
- [ ] Real PCAP/NetFlow ingest capability (currently only simulated)
- [ ] Throughput metrics display
- [ ] Documentation (models, features, training)
- [ ] `requirements.txt` with all deps
- [ ] Docker/run instructions

### Frontend (REDESIGN NEEDED)
- [x] ~70% of features exist
- [ ] **COMPLETE VISUAL REDESIGN** — make it look NOTHING like an AI SaaS dashboard
- [ ] Terminal/hacker aesthetic
- [ ] Boot sequence animation
- [ ] Network topology view (improved)
- [ ] Packet capture viewer (visual)
- [ ] Feature extraction visualization

### Documentation
- [ ] README with architecture diagram
- [ ] Model documentation
- [ ] Feature engineering docs
- [ ] Training/validation approach

### Demo Video
- [ ] Script
- [ ] Recording plan
- [ ] Post-production effects
