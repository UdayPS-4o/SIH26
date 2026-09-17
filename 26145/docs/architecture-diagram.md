# EKADHARA / WATCHTOWER — System Architecture
**PS-26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**
**NTRO · Smart India Hackathon 2026**

---

## 1. System Architecture Overview

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              THE PROTECTED NETWORK            THE MONITORING ENCLAVE        ║
║              (air-gapped, no return path)                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────┐    ┌──────────────────────────────────────────────────┐    ║
║  │ PRODUCTION  │    │          HARDWARE DATA DIODE / TAP               │    ║
║  │ NETWORK     │───►│          (one-way copy only)                     │    ║
║  │             │    │          NO RETURN PATH ◄── enforced by physics  │    ║
║  │ SCADA/ICS   │    └──────────────────────────────────────────────────┘    ║
║  │ Servers     │                         │                                   ║
║  │ Endpoints   │          ┌──────────────▼──────────────┐                 ║
║  │ GW Router   │          │  CAPTURE INGEST LAYER         │                 ║
║  └─────────────┘          │  PCAP · AF_PACKET · NetFlow   │                 ║
║                            └──────────────┬──────────────┘                 ║
║                                         │                                  ║
║  ┌──────────────────────────────────────▼─────────────────────────────┐    ║
║  │              EGRESS-LOCKDOWN BOUNDARY                               │    ║
║  │  docker run --network none  |  seccomp-bpf deny connect/sendto/     │    ║
║  │  sendmsg/sendmmsg  |  AF_PACKET PACKET_IGNORE_OUTGOING  |  CAP_NET_RAW │    ║
║  │  dropped after socket bind  |  zero HTTP client crates in binary    │    ║
║  └──────────────────────────┬───────────────────────────────────────────┘    ║
║                             │                                               ║
║  ┌──────────────────────────▼───────────────────────────────────────────┐  ║
║  │  STAGE 1 · INGEST  —  read-only, backpressure = drop-and-count       │  ║
║  │  PCAP replay (rate-controlled)  ·  AF_PACKET live  ·  IPFIX/sFlow    │  ║
║  └──────────────────────────┬───────────────────────────────────────────┘  ║
║                             │                                               ║
║  ┌──────────────────────────▼───────────────────────────────────────────┐  ║
║  │  STAGE 2 · FLOW ASSEMBLY  —  bounded LRU (default 1 M flows)          │  ║
║  │  5-tuple key  ·  FIN/RST + idle eviction  ·  DIRECTION MASK           │  ║
║  │  FWD | REV | BOTH  ·  TCP seq/ack/flag state machine                  │  ║
║  └──────────────────────────┬───────────────────────────────────────────┘  ║
║                             │                                               ║
║  ┌──────────────────────────▼───────────────────────────────────────────┐  ║
║  │  STAGE 3 · FEATURE FABRIC  —  three tiers + ACK-Shadow                │  ║
║  │  TIER A (direction-agnostic) · TIER B (single-dir safe) · TIER C (ACK-│  ║
║  │  Shadow fallback)  Every feature has a validity flag:                │  ║
║  │  OBSERVED | INFERRED | MISSING  → models receive validity mask        │  ║
║  └──────────────────────────┬───────────────────────────────────────────┘  ║
║                             │                                               ║
║  ┌──────────────────────────▼───────────────────────────────────────────┐  ║
║  │  STAGE 4 · DETECTOR ENSEMBLE  —  six streaming specialists            │  ║
║  │  (a)DDoS (b)Beaconing (c)DGA+DNS (d)Enc.Malware (e)Recon (f)Exfil    │  ║
║  │  Each: constant-memory sketch + lightweight ML head  →  ~75 MB total │  ║
║  └──────────────────────────┬───────────────────────────────────────────┘  ║
║                             │                                               ║
║  ┌──────────────────────────▼───────────────────────────────────────────┐  ║
║  │  STAGE 5 · FUSION  —  isotonic calibration + kill-chain correlation   │  ║
║  │  per-entity 6h window  →  INCIDENT if >=2 kill-chain stages on host  │  ║
║  └──────────────────────────┬───────────────────────────────────────────┘  ║
║                             │                                               ║
║  ┌──────────────────────────▼───────────────────────────────────────────┐  ║
║  │  STAGE 6 · EVIDENCE + CUSTODY  —  TreeSHAP + SHA-256 + OCSF + Merkle │  ║
║  │  Append-only custody ledger. Any tampering → root mismatch.           │  ║
║  └──────────────────────────┬───────────────────────────────────────────┘  ║
║                             │                                               ║
║  ┌──────────────────────────▼───────────────────────────────────────────┐  ║
║  │  STAGE 7 · OUTPUT  —  Live dashboard + HUD overlay + Parquet ledger   │  ║
║  │  + OCSF/ECS SIEM export                                               │  ║
║  └───────────────────────────────────────────────────────────────────────┘  ║
║                                                                              ║
║  ZERO-EGRESS ENRICHMENT (all data bundled at build time):                 ║
║  passive DNS trie · BGP/ASN map · JA4 fingerprint DB · DGArchive hashes  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Stage summary

| Stage | Purpose | Memory |
|---|---|---|
| 1 · Ingest | Three capture modes → one internal rep | Drop-and-count backpressure |
| 2 · Flow Assembly | 5-tuple LRU with direction mask | Bounded LRU; FIN/RST + idle eviction |
| 3 · Feature Fabric | Three-tier features + validity flags + ACK-Shadow | Windowed ring buffers |
| 4 · Detectors | Six streaming specialists | CMS/HLL/t-digest/Space-Saving — O(1) per detector |
| 5 · Fusion | Isotonic calibration + kill-chain correlation | Per-entity sliding window |
| 6 · Evidence + Custody | SHAP, SHA-256, OCSF, Merkle chain | Append-only ledger |
| 7 · Output | Dashboard, Parquet, SIEM export | Streaming writes |

---

## 2. Data Flow Diagram

```
                    copy via data diode
                         │
                         ▼
           ┌─────────────────────────┐
           │  CAPTURE SOURCE         │
           │  PCAP · AF_PACKET ·     │
           │  IPFIX / sFlow /        │
           │  NetFlow                │
           └──────────┬──────────────┘
                      │ unified packet rep
                      ▼
           ┌─────────────────────────┐
           │  FLOW ASSEMBLY          │
           │  LRU(1M) · 5-tuple ·    │
           │  direction_mask · TCP   │
           │  state machine          │
           └──────────┬──────────────┘
                      │ flow records
                      ▼
           ┌─────────────────────────┐
           │  FEATURE FABRIC         │
           │  Tier A (always) ·      │
           │  Tier B (single-dir) ·  │
           │  Tier C (ACK-Shadow) ·  │
           │  validity mask          │
           └──────────┬──────────────┘
                      │ feature vector
                      ▼
           ┌─────────────────────────┐
           │  DETECTOR ENSEMBLE      │
           │  (a)DDoS (b)Beacon      │
           │  (c)DGA+DNS (d)EncMal   │
           │  (e)Recon (f)Exfil      │
           └──────────┬──────────────┘
                      │ 6 raw scores
                      ▼
           ┌─────────────────────────┐
           │  FUSION LAYER           │
           │  Isotonic calib ·       │
           │  kill-chain · severity  │
           └──────────┬──────────────┘
                      │ alert
                      ▼
           ┌─────────────────────────┐
           │  EVIDENCE + CUSTODY     │
           │  TreeSHAP · SHA-256 ·   │
           │  OCSF · Merkle chain    │
           └──────────┬──────────────┘
                      │ signed alert
                      ▼
           ┌─────────────────────────┐
           │  OUTPUT                 │
           │  Dashboard · Parquet ·  │
           │  SIEM export            │
           └─────────────────────────┘
```

---

## 3. ML Pipeline

```
FEATURE INPUT  +  VALIDITY MASK  +  WINDOW STATE
        │              │                  │
        └──────────────┼──────────────────┘
                       ▼
           ┌───────────────────────┐
           │  DETECTOR-SPECIFIC    │
           │  MODEL PATH           │
           │                       │
           │  (a) DDoS: CUSUM +    │
           │      LightGBM (~2 MB) │
           │  (b) Beaconing: IAT   │
           │      ring + LightGBM  │
           │  (c) DGA+DNS: char-  │
           │      CNN + LightGBM   │
           │  (d) Enc.Malware: JA4 │
           │      lookup + 1-D CNN │
           │      + LightGBM       │
           │  (e) Recon: HLL +     │
           │      LightGBM (~75MB) │
           │  (f) Exfil: ACK-     │
           │      Shadow + ISOFor  │
           │      + LightGBM       │
           └───────────┬───────────┘
                       │ 6 scores + attributions
                       ▼
           ┌───────────────────────┐
           │  ISOTONIC CALIBRATION │
           │  per-class            │
           └───────────┬───────────┘
                       │ calibrated conf
                       ▼
           ┌───────────────────────┐
           │  DECISION GATE        │
           │  conf >= theta_class  │
           └───────────┬───────────┘
                       │ alert
                       ▼
           ┌───────────────────────┐
           │  FUSION + SEVERITY    │
           │  kill-chain correlate │
           │  severity scoring     │
           └───────────────────────┘

  MODEL SERVING STACK
  ───────────────────
  Training:   Python · LightGBM · PyTorch (char-CNN / 1-D CNN / GRU)
  Export:     LightGBM → ONNX  |  PyTorch → ONNX
  Runtime:    ONNX Runtime (ort) — Rust crate, linked into main binary
  Hardware:   CPU (AVX2).  No GPU dependency — air-gapped enclave.
  Latency:    p50 < 5 ms / flow  ·  p95 < 15 ms / flow
```

---

## 4. Diode Enforcement Architecture

```
HARDWARE LEVEL
══════════════

  PRODUCTION NETWORK          DIODE           MONITORING ENCLAVE
  ┌──────────────┐   fiber   ┌────────┐   fiber  ┌───────────────┐
  │  full-duplex │─────────►│ optical│────────►│  read-only    │
  │  traffic     │  send    │ one-way│ receive │  sensor       │
  │              │  ✗ NO    │ valve  │  ✗ NO   │  ✗ NO transmit│
  └──────────────┘  return  └────────┘  return │  path ever    │
                                                └───────────────┘

SOFTWARE ENFORCEMENT — five independent layers
═══════════════════════════════════════════════

  Layer 1: Container networking
  ─────────────────────────────────────────────────────
  docker run --network none
  → no eth0/veth/netns to transmit on
  → only loopback + AF_PACKET capture socket exist

  Layer 2: seccomp-bpf syscall filter
  ─────────────────────────────────────────────────────
  Denied: connect(2), sendto(2), sendmsg(2), sendmmsg(2),
          socket(AF_INET) for outbound

  Layer 3: AF_PACKET socket flags
  ─────────────────────────────────────────────────────
  PACKET_IGNORE_OUTGOING — kernel drops locally-gen packets
  No PACKET_TX_RING — no transmit ring allocated
  Only PACKET_RX_RING — receive-only

  Layer 4: Build-time dependency audit
  ─────────────────────────────────────────────────────
  cargo-deny: no HTTP client crate in dependency graph
  Static link analysis: no connect/sendto in binary

  Layer 5: Runtime self-test (demo on stage)
  ─────────────────────────────────────────────────────
  --self-test-egress:
    attempts TCP connect to localhost:1
    → SIGSYS kills process
    → attempt audit-logged
    → demo: show the log entry
```

---

## 5. Direction Modes and Feature Impact

| Mode | What we see | Feature validity |
|---|---|---|
| BOTH (mirror) | Full duplex all packets | All A+B: OBSERVED. C + JA4S + RTT: OBSERVED |
| FWD-only (diode) | Client → server only | A+B: OBSERVED. down_up_ratio: INFERRED via ACK-Shadow. RTT: INFERRED. JA4S: MISSING. Beacons/Scans: OBSERVED (originate FWD) |

---

## 6. Alert Schema (OCSF-aligned)

```json
{
  "alert_id": "uuid-v4",
  "timestamp": "2026-09-16T15:24:28.123Z",
  "flow_id": "10-tuple hash",
  "threat_class": "ddos|beaconing|dga|dns_tunnel|encrypted_malware|reconnaissance|exfiltration",
  "confidence": 0.87,
  "severity": "critical|high|medium|low",
  "kill_chain_stage": "recon|c2|deliver|impact|exfil|enable",
  "entity": "src_ip|src_asn",
  "blast_radius": "affected_dst_ips",
  "shap_top3": [
    {"feature": "src_ip_entropy_24", "contribution": 0.34},
    {"feature": "pkt_rate", "contribution": 0.21},
    {"feature": "dst_concentration", "contribution": 0.15}
  ],
  "evidence_hash": "sha-256-of-capture-byte-range",
  "direction_mask": "FWD|REV|BOTH",
  "feature_validity": ["OBSERVED", "INFERRED", "OBSERVED", ...],
  "merkle_root": "sha-256-of-prior-root-and-this-leaf",
  "model_id": "sha-256-of-onnx-model-bytes",
  "detector_scores": {
    "ddos": 0.91,
    "beaconing": 0.0,
    "dga_dns": 0.0,
    "encrypted_malware": 0.0,
    "reconnaissance": 0.0,
    "exfiltration": 0.0
  },
  "calibration_note": "isotonic-regression-calibrated confidence"
}
```

---

## 7. Throughput Target

| Metric | Target | Measurement |
|---|---|---|
| Flows/sec sustained | 100,000 flows/s | Per-flow latency budget |
| p50 per-flow latency | < 5 ms | OnnxRuntime CPU inference |
| p95 per-flow latency | < 15 ms | Includes feature extraction |
| Memory (detector state) | ~75 MB constant | HLL/LRU bounded, no unbounded growth |
| End-to-end latency | < 100 ms | Ingest → alert on dashboard |
