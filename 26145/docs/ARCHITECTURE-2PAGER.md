# EKADHARA — Architecture Document

**SIH26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic · NTRO**
*Camera-ready. Target: 2 pages. Keep it to 2 — the limit is the point.*

---

## 1 · Problem and constraint

NTRO monitoring enclaves are fed by hardware data diodes or passive mirrors: traffic is copied in one direction, with no physical or protocol path back. Any intelligence layer inside must work from passive observation alone — no probes, no handshakes, no mitigation, no enrichment lookups, no payload decryption.

**The constraint is stricter than it first appears.** The PS specifies a diode (one direction) yet requires *"outbound-to-inbound byte ratios"* (threat f) and *"JA3/JA3S fingerprints"* (threat d) — both of which need the reverse direction a diode removes. We therefore treat directionality as a first-class system property rather than an assumption, and we support both interpretations:

- **D1** — full-duplex traffic visible, no transmit path *(classic passive NDR)*
- **D2** — single-direction capture *(true diode; roughly half of all standard flow features are unavailable or biased)*

The standard toolchain (CICFlowMeter → CIC-IDS2017 → tree ensemble) fails under D2 **silently**: bidirectional features become zero, and the model continues emitting high-confidence scores. EKADHARA is designed so that no feature can be silently absent.

---

## 2 · System architecture

```
┌── EGRESS LOCKDOWN BOUNDARY ─ netns none + seccomp deny connect/sendto/sendmsg ──┐
│                                                                                 │
│  ① INGEST (read-only)          ② FLOW ASSEMBLY            ③ FEATURE FABRIC     │
│  ├ PCAP replay, rate-ctrl      ├ 5-tuple LRU (bounded)    ├ Tier A  dir-agnostic│
│  ├ AF_PACKET, no TX ring       ├ DIRECTION MASK           ├ Tier B  single-dir  │
│  └ NetFlow/IPFIX/sFlow         │   FWD | REV | BOTH       ├ Tier C  needs both  │
│                                └ TCP seq/ack tracking     └── ACK-SHADOW ───────│
│                                                                                 │
│  ④ DETECTOR ENSEMBLE — six streaming specialists, constant memory               │
│    a DDoS · b Beaconing · c DGA+DNS tunnel · d Enc. malware · e Recon · f Exfil  │
│                                                                                 │
│  ⑤ FUSION                         ⑥ EVIDENCE & CUSTODY                          │
│  ├ isotonic calibration           ├ TreeSHAP top-3 features                      │
│  ├ kill-chain correlation         ├ SHA-256 over evidence byte range             │
│  └ severity scoring               ├ OCSF Detection Finding (class 2004)          │
│                                   └ Merkle chain: root_n = H(root_n-1 ‖ leaf_n)  │
│                                                                                 │
│  ⑦ OUTPUT — live dashboard + HUD · Parquet ledger · OCSF/ECS SIEM export         │
│                                                                                 │
│  ◄── ZERO-EGRESS ENRICHMENT: self-built passive DNS · offline BGP/ASN trie ──    │
│      · bundled JA4 fingerprint DB · static asset manifest — no lookups, ever     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Stage responsibilities

**① Ingest.** Three modes, one internal representation. Backpressure is **drop-and-count, never block** — a stalled monitor is worse than a sampling one, and the drop counter is published alongside every throughput figure.

**② Flow assembly.** Bounded LRU (default 1 M flows) with FIN/RST and idle eviction. No unbounded map exists anywhere in the system: under a spoofed-source flood a naive `HashMap<5-tuple, State>` allocates per packet, so the DDoS attack exhausts the DDoS detector. The `direction_mask` set here propagates to the alert.

**③ Feature fabric.** Every feature is emitted as `{value, validity}` with `validity ∈ {OBSERVED, INFERRED, MISSING}`, and models receive the validity mask as an input channel. This converts silent failure into measurable degradation.

**ACK-Shadow.** Under FWD-only capture, upload volume is directly observed while download volume is invisible. TCP acknowledgement numbers, however, travel in the visible direction: `reverse_bytes ≈ (max_ack + 2³²·wraps) − initial_ack`, corrected for duplicate ACKs and refined by SACK blocks where present. ACK arrival timing additionally yields an RTT proxy. Threat (f) therefore remains computable. *Limits, stated: TCP only — no QUIC/UDP equivalent; coarse on very short flows; recovers volume and approximate packet count, never individual packet sizes.*

**④ Detectors.** Six specialists rather than one classifier, because the threats occupy different time scales and feature spaces (DDoS: seconds/rate; beaconing: hours/periodicity; DGA: one string). All streaming, all bounded-memory via Count-Min Sketch (source-IP entropy), HyperLogLog (fan-out cardinality), t-digest (percentiles) and Space-Saving (heavy hitters).

**⑤ Fusion.** Isotonic calibration per class fitted on a held-out split; correlation of detections by entity and time window onto attack-chain stages; severity as `f(confidence, asset criticality, chain stage, blast radius)`.

**⑥ Evidence & custody.** Each alert carries its SHAP attribution, a content hash of the exact source bytes, `direction_mask`, per-feature validity, and model SHA-256 — then is appended to a rolling Merkle chain, making any later edit, deletion or reordering detectable. This satisfies the PS background's chain-of-custody requirement and is the appropriate use of the theme's cryptographic primitive; a distributed ledger would be wrong here, as a single air-gapped enclave has no mutually distrusting parties.

---

## 3 · Constraint compliance

| PS constraint | Implementation | Verification |
|---|---|---|
| **(a) Read-only ingest** | `--network none`; seccomp-bpf denies `connect`/`sendto`/`sendmsg`/`sendmmsg`; `AF_PACKET` with `PACKET_IGNORE_OUTGOING`, no TX ring; no HTTP client crate in the dependency tree | `--self-test-egress` attempts a callback and is killed by the kernel; attempt is audit-logged |
| **(b) No decryption** | TLS/QUIC analysed from ClientHello fingerprint (JA4) and packet size/direction/timing sequences only | No TLS library linked for decryption; no key material accepted |
| **(c) Streaming** | Incremental windowed processing; sketch-backed state; alerts on window close | Published p50/p95/p99 processing latency, reported **separately** from inherent window latency |
| **(d) Throughput stated** | Rate-ramp harness to saturation plus 10× burst test | Sustained flows/sec **and** Mbps, with drop rate and resident memory, on stated hardware |
| **(e) Standard alert schema** | OCSF Detection Finding (class 2004) + ECS compatibility view | Schema-validated output; ingests into any OCSF-aware SIEM without an adapter |

---

## 4 · Validation methodology

**Diode-Twin.** Every lab scenario is captured once full-duplex and post-filtered into forward-only and reverse-only twins sharing a single ground-truth file. Identical models at identical thresholds are evaluated across all three (and against IPFIX-only exports as a fourth axis), producing a **degradation matrix** in which every capability loss is measured and declared. There are no silent failures.

**Corpus.** 40 lab scenarios generated with the tools NTRO names — `iperf3`/`Ostinato`/`TRex` (benign), `hping3`, `Slowloris`, `iodine`, `dnscat2`, DGArchive, plus `nmap`/`masscan` and scripted exfiltration — with packet-level labels emitted by the orchestrator. External validation on CTU-13, malware-traffic-analysis.net and CIRA-CIC-DoHBrw; CIC-IDS2017 used for comparability only, with its documented label errors stated. Splits are by scenario and by attack parameter setting, never random, to prevent flow-level leakage. Released as **UniFlow-IN**.

**Metrics.** Per-class P/R/F1 and PR-AUC at the true operational base rate; **precision at a fixed analyst alert budget (P@50/hr)** as the headline, because accuracy is uninformative at a 1-in-10⁴ base rate; calibration reported as a reliability diagram plus Expected Calibration Error; adversarial break-even points per detector (beacon jitter %, TLS padding entropy, scan rate). Replay is deterministic — identical input yields a byte-identical alert ledger.

---

## 5 · Deployment

Single OCI image, runs with `--network none`, no external dependencies, CycloneDX SBOM shipped in-image, reproducible build with pinned toolchain. Model updates arrive as signed packs by sneakernet with signature verification and one-command rollback; a distribution-drift monitor warns when models have gone stale. A 7-day self-baselining warm-up learns per-host and per-network normals before alerting. Feed loss, rate collapse and direction-mask changes raise **monitoring-integrity alerts**, so a silenced sensor is never mistaken for a quiet network.

**Licence position:** core JA4 (TLS client) is BSD-3-Clause and ships by default. JA4+ methods (JA4S/H/X/T/L/SSH) are FoxIO Licence 1.1 — permissive for government internal use, restricted for monetisation, patent-pending — and sit behind a build flag with the licence surfaced at compile time.

---

**Stack:** Zeek (capture · flow assembly · DNS/TLS/JA4 parsing) → Python detectors → ONNX inference → OCSF alerts → React dashboard · DuckDB/Parquet ledger · single OCI image.
