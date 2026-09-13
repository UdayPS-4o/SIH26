# Implementation Flow — stage specs and data contracts

How a packet becomes an alert. Each stage below has: responsibility, input, output, constraints, and the failure mode it must avoid.

---

## Stage 1 — Ingest (read-only)

**Responsibility:** get bytes into the process with bounded latency and zero possibility of transmission.

**Three input modes, one internal representation:**

| Mode | Source | Use |
|---|---|---|
| `replay` | PCAP file at a controlled rate | Reproducible demo + evaluation |
| `live` | `AF_PACKET` with `PACKET_IGNORE_OUTGOING`, `TPACKET_V3` ring | Real diode/TAP feed |
| `flow` | UDP listener for NetFlow v5/v9, IPFIX, sFlow | When the enclave only gets flow records |

**Constraints:**
- No socket is ever opened for transmission. `AF_PACKET` bound receive-only, no `PACKET_TX_RING`.
- Ingest thread does *no* parsing beyond L2/L3/L4 header extraction — it stays cheap so it never becomes the bottleneck.
- Backpressure policy is **drop-and-count, never block**. A monitoring system that stalls is worse than one that samples. Dropped-packet count is exported as a first-class metric and shown on the dashboard HUD, because a throughput claim with hidden drops is a lie.

**Output contract:**
```rust
struct RawEvent {
    ts_ns: u64,
    l3: IpHeader,          // src, dst, proto, ttl, ip_id, len
    l4: TransportHeader,   // ports, tcp_flags, seq, ack, window, opts
    payload_len: u16,
    capture_offset: u64,   // byte offset in source capture → evidence hash
    direction_hint: Dir,   // FWD | REV | UNKNOWN, from configured prefix map
}
```

`capture_offset` exists solely so that an alert can later point at the exact bytes that caused it. Design it in from day one; retrofitting evidence provenance is painful.

---

## Stage 2 — Flow assembly

**Responsibility:** turn packets into flow state without unbounded memory.

**Key structure:**
```rust
struct FlowState {
    key: FiveTuple,
    direction_mask: DirMask,        // FWD_ONLY | REV_ONLY | BOTH  ← central to everything
    first_ts, last_ts: u64,
    fwd_pkts, fwd_bytes: u64,
    rev_pkts, rev_bytes: u64,       // zero under one-way capture
    tcp: Option<TcpTrack>,          // seq/ack tracking, ACK-Shadow state
    iat_ring: RingBuffer<u32, 256>, // inter-arrival times for beacon analysis
    size_ring: RingBuffer<u16, 256>,
    l7: Option<L7Meta>,             // DNS name, TLS JA4, QUIC info
    flags: FeatureValidity,
}

struct TcpTrack {
    initial_ack: u32,
    max_ack_seen: u32,
    ack_wrap_count: u32,        // 32-bit wraparound handling
    dup_ack_count: u32,
    syn_seen, synack_seen, fin_seen, rst_seen: bool,
    last_ack_ts: u64,           // → RTT proxy
}
```

**`direction_mask` is the most important field in the system.** It is set per flow from the configured protected-prefix map plus observation, and it propagates all the way to the alert. Every downstream consumer knows whether it is reasoning about a full or half conversation.

**Bounding:** fixed-capacity LRU (default 1M flows). Eviction on capacity, on TCP `FIN`/`RST`, and on idle timeout (default 120 s). Evicted flows emit a final record; nothing is silently lost.

**Failure mode to avoid:** unbounded `HashMap<FiveTuple, FlowState>`. Under a spoofed-source SYN flood every packet creates a new key. The naive implementation OOMs on exactly the attack it was built to catch. Ours evicts and counts.

---

## Stage 3 — Feature fabric

**Responsibility:** produce windowed feature vectors with explicit validity.

**Three tiers:**

```
TIER A — direction agnostic          always OBSERVED
  packet rate, byte rate, packet-size distribution, IAT statistics,
  protocol mix, TTL variance, flag ratios

TIER B — computable from one direction   OBSERVED under FWD-only
  fan-out cardinality, source-IP entropy, DNS query-name features,
  JA4 client fingerprint, SNI, unanswered-SYN ratio, payload-absence ratio

TIER C — normally requires both directions
  down_up_ratio, RTT, JA4S, connection-success ratio, response sizes
      ├─ if BOTH observed        → OBSERVED
      ├─ if ACK-Shadow applies   → INFERRED  (TCP only)
      └─ otherwise               → MISSING
```

**Every feature carries validity:**
```rust
struct Feature { value: f32, validity: Validity }  // OBSERVED | INFERRED | MISSING
```

Models receive the validity mask as an explicit input channel. This is what turns silent failure into graceful, *measurable* degradation — a model that knows a feature is inferred can weight it accordingly, and a model that knows it is missing does not treat 0.0 as a real observation.

**ACK-Shadow estimator (Tier C rescue):**
```
reverse_bytes = (max_ack_seen + 2^32 * wrap_count) - initial_ack
              - correction(dup_acks)
reverse_pkts  ≈ reverse_bytes / observed_mss
rtt_proxy     = ts(first ACK covering our seq) - ts(our data packet)
```
Emitted with `validity = INFERRED` and an estimator-confidence sub-score. Accuracy is measured against the bidirectional twin during evaluation.

---

## Stage 4 — Detector ensemble

**Responsibility:** six independent streaming detectors; see [`detector-designs.md`](detector-designs.md) for internals.

**Uniform interface:**
```rust
trait Detector {
    fn name(&self) -> ThreatClass;
    fn on_window(&mut self, fv: &FeatureVector) -> Option<Detection>;
    fn state_bytes(&self) -> usize;      // for the memory-bound assertion
    fn required_features(&self) -> &[FeatureId];
    fn degradation_profile(&self) -> DegradationProfile;  // declared, then measured
}
```

`state_bytes()` is not decorative — CI asserts total detector state stays under the declared ceiling during a 10× burst test. That assertion is what lets us claim constant memory honestly.

**Inference:** models trained in Python, exported to **ONNX**, executed via `ort` inside the Rust pipeline. No Python in the hot path — otherwise our latency numbers would be measuring the GIL, not our design.

---

## Stage 5 — Fusion, calibration, severity

```
raw_score ──► isotonic calibrator (per class) ──► calibrated_confidence
                                                         │
entity + 6h window grouping ──► kill-chain stage map ─────┤
                                                         ▼
severity = w1·calibrated_confidence
         + w2·asset_criticality        (from static manifest)
         + w3·chain_stage_weight       (EXFIL > C2 > RECON)
         + w4·blast_radius             (hosts/subnets involved)
```

Calibration is fitted on a **held-out calibration split**, never on test data. ECE is reported as a headline metric.

Kill-chain fusion emits an `Incident` when ≥2 distinct stages appear for the same entity; otherwise a standalone `Alert`.

---

## Stage 6 — Evidence and custody

**Alert record (OCSF Detection Finding, abridged):**
```json
{
  "class_uid": 2004,
  "time": "2026-09-07T11:02:14.318Z",
  "severity_id": 5,
  "confidence": 0.87,
  "confidence_band": "historically correct 86% of the time",
  "finding_info": {
    "title": "C2 beaconing to 203.0.113.9:443",
    "types": ["botnet_c2_beaconing"]
  },
  "evidences": [{
    "flow_id": "f8a91c2e",
    "src_endpoint": {"ip": "10.2.4.9"},
    "dst_endpoint": {"ip": "203.0.113.9", "port": 443},
    "capture_range": {"offset": 88214592, "len": 41280},
    "evidence_sha256": "9f2c…"
  }],
  "unmapped": {
    "direction_mask": "FWD_ONLY",
    "feature_validity": {"down_up_ratio": "INFERRED"},
    "top_features": [
      {"name": "iat_bowley_skew",  "value": 0.03, "shap": 0.41},
      {"name": "iat_mad_ratio",    "value": 0.07, "shap": 0.33},
      {"name": "size_bowley_skew", "value": 0.01, "shap": 0.19}
    ],
    "detector": "beaconing/v1.2.0",
    "model_sha256": "3ab7…",
    "merkle_leaf": "c41d…",
    "merkle_root": "7e09…"
  }
}
```

Note what is carried that no other team will carry: `direction_mask`, `feature_validity`, `confidence_band`, `model_sha256`, and the Merkle pair. Each is a talking point.

**Custody chain:**
```
leaf_n = SHA256(canonical_json(alert_n))
root_n = SHA256(root_{n-1} || leaf_n)
```
Roots checkpointed periodically to append-only storage. `ekadhara verify --ledger` re-walks the chain and reports the first divergence index.

---

## Stage 7 — Output

| Sink | Format | Purpose |
|---|---|---|
| Dashboard | WebSocket JSON | Live analyst view |
| Ledger | Parquet + Merkle sidecar | Forensic record, queryable via DuckDB |
| SIEM export | OCSF JSON lines / ECS | Downstream integration |
| Metrics | Prometheus text on loopback only | Throughput, latency, drops, memory |

Metrics bind to `127.0.0.1` only — inside `--network none` that is still reachable from the dashboard process in the same namespace, and unreachable from anywhere else. Consistent with Egress Lockdown.

---

## Threading model

```
[capture thread]  → lock-free SPSC ring →  [flow assembly thread]
                                                    │
                                        sharded by hash(5-tuple)
                                                    ▼
                          [N feature/detector worker threads]
                                                    │
                                          MPSC channel
                                                    ▼
                              [fusion + evidence + ledger thread]
                                                    ▼
                                    [dashboard broadcast thread]
```

Sharding by 5-tuple hash keeps each flow's state on a single worker — no cross-thread locking on flow state. Only fusion is single-threaded, and it operates on detections (thousands/sec), not packets (millions/sec).

---

## Latency budget (the number we publish)

| Stage | Target |
|---|---|
| Capture → flow update | < 50 µs |
| Feature window close → detector output | < 5 ms |
| Detector → calibration → fusion | < 2 ms |
| Fusion → ledger → dashboard | < 20 ms |
| **End-to-end p99 (window-close to alert on screen)** | **< 100 ms** |

Plus the inherent window latency: a 60 s beacon window means the *earliest* possible beacon alert is one window after onset. **We report window latency and processing latency separately** — conflating them is how teams accidentally claim sub-second detection of an hour-scale phenomenon.

---

## What we deliberately do NOT build

Stating scope exclusions is a maturity signal; volunteer these before a judge asks.

| Excluded | Why |
|---|---|
| Inline blocking / mitigation | Constraint (a) forbids it. Out of scope by design. |
| Payload decryption / TLS interception | Constraint (b) forbids it. |
| Active scanning or probing | Constraint (a) forbids it. |
| Distributed multi-node clustering | Single-node throughput target is achievable; clustering is a scaling story, not a research one. Architecture leaves the seam (sharded workers → Redpanda) but we do not build it. |
| Full PCAP retention | We retain evidence byte-ranges and hashes, not the whole capture. Storage discipline. |
