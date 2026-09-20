# EKADHARA — Architecture 2-Pager
**PS-26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic**
**National Technical Research Organisation (NTRO) · Smart India Hackathon 2026**

---

## SYSTEM OVERVIEW

EKADHARA is an AI-powered threat detection engine built to operate inside a **read-only monitoring enclave** — exactly the environment created by a physical data diode. The system ingests passively observed network metadata (flow records, DNS queries, TLS fingerprints), runs multi-model AI inference, and outputs structured, confidence-scored alerts.

```
 ┌─────────────────────────────────────────────────────────────────────┐
 │                    PRODUCTION NETWORK                               │
 │  (Router / Firewall / Switch — cannot be modified)                  │
 └─────────────────────────┬───────────────────────────────────────────┘
                           │  Mirror / SPAN port
                           ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │                    DATA DIODE (Unidirectional)                       │
 │  • Physical optical isolation                                        │
 │  • No return path possible                                           │
 │  • Traffic flows ONE WAY only                                        │
 └─────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │               MONITORING ENCLAVE (EKADHARA)                          │
 │                                                                       │
 │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
 │  │ Flow Exporter │  │  PCAP Copy   │  │  TLS Metadata Parser     │   │
 │  │ (NetFlow/sFlow)│ │  (mirrored   │  │  (JA3/JA4 extraction)   │   │
 │  └──────┬───────┘  │   packets)   │  └───────────┬─────────────┘   │
 │         │          └──────┬───────┘              │                   │
 │         └─────────────────┼──────────────────────┘                   │
 │                           ▼                                          │
 │  ┌─────────────────────────────────────────────────────────────┐    │
 │  │                    EKADHARA PIPELINE                        │    │
 │  │                                                              │    │
 │  │  1. INGEST         — WebSocket stream (flows, alerts, stats)│    │
 │  │  2. FEATURES       — 15-dim vector + 30+ rule features    │    │
 │  │  3. INFERENCE      — ML ensemble + rule-based detector     │    │
 │  │  4. OUTPUT         — Structured alerts with validity tags  │    │
 │  └──────────────────────────────┬──────────────────────────────┘    │
 │                                 │                                    │
 │  ┌──────────────────────────────▼──────────────────────────────┐    │
 │  │                   DASHBOARD (SOC Ops Center)                 │    │
 │  │  • Live Threat Feed     • Degradation Matrix                 │    │
 │  │  • Network Topology     • Throughput Timeline                 │    │
 │  │  • AI Analyzer          • Diode Lab                          │    │
 │  └──────────────────────────────────────────────────────────────┘    │
 └─────────────────────────────────────────────────────────────────────┘
```

---

## PIPELINE STAGES

### 1. Ingest (Passive, Read-Only)

| Component | Technology | Data |
|-----------|-----------|------|
| Flow export | NetFlow v5/v9/IPFIX | 5-tuple + byte/packet counts + timestamps |
| Packet mirror | Raw PCAP (read-only) | Full packet headers, no payload |
| TLS metadata | JA3/JA4 extraction | Cipher suites, extensions, ALPN |

- **Throughput target:** 10,000 flows/sec
- **Latency target:** <50ms P99 end-to-end
- **No outbound I/O:** Enclave cannot initiate connections (verified by egress self-test)

### 2. Feature Extraction

**15-dimensional ML feature vector per flow:**

| # | Feature | Range | Threat Types |
|---|---------|-------|-------------|
| 1 | bytes_sent | continuous | All |
| 2 | bytes_recv | continuous | All |
| 3 | byte_ratio | 0+ | Exfil, beaconing |
| 4 | duration | seconds | DDoS, beaconing |
| 5 | packets | integer | DDoS, scan, beacon |
| 6 | avg_packet_size | bytes | DDoS, TLS |
| 7 | bytes_per_sec | continuous | DDoS, exfil |
| 8 | packets_per_sec | continuous | DDoS, scan |
| 9 | src_port_normalized | 0-1 | Scan, DDoS |
| 10 | dst_port_normalized | 0-1 | Scan, DDoS |
| 11 | is_well_known_dst | binary | DDoS, DGA, DNS |
| 12 | is_ephemeral_src | binary | Exfil, beacon |
| 13 | dns_query_len_normalized | 0-1 | DGA, DNS |
| 14 | dns_entropy | 0-8 bits | DGA, DNS |
| 15 | has_tls | binary | TLS, beacon |

**30+ additional rule-based features** (entropy, IAT stats, JA3 hashes, port fan-out, etc.)

### 3. Inference (Dual-Model Ensemble)

```
            ┌──────────────────┐
   Flow ────│  Feature Extract  │─── 15-dim vector
            └────────┬─────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
    ┌──────────┐ ┌─────────┐ ┌──────────┐
    │ Isolation │ │ Logistic │ │ Rule-Based│
    │  Forest   │ │Regression│ │ Detector  │
    │ (200 trees│ │ (8-class │ │ (7 rules) │
    │  cont=0.15│ │  lbfgs)  │ │           │
    └─────┬─────┘ └────┬────┘ └────┬─────┘
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Alert Engine  │
              │  • Merge ML +  │
              │    rule scores │
              │  • Deduplicate │
              │  • Tag validity│
              │  • Timestamp   │
              └────────┬───────┘
                       │
                       ▼
              Structured Alert (JSON)
```

**ML Models:**
- **IsolationForest**: Unsupervised anomaly detection (200 trees, contamination=0.15)
- **LogisticRegression**: Multi-class attack classifier (8 classes: ddos, port_scan, data_exfiltration, dns_tunneling, dga, botnet, tls_beaconing, benign)
- **Rule-Based Detector**: 7 explicit detection strategies with confidence scoring

**Training:**
- 5,000 synthetic samples with realistic distributions (lognormal bytes, uniform durations, beaconing IATs with jitter)
- Optional CIC-IDS2017 fine-tuning for DDoS (RandomForest, 200 trees)

### 4. Output (Structured Alerts)

```json
{
  "timestamp": "2026-01-15T14:30:00Z",
  "flow_id": "flow-001-a3f2",
  "threat_class": "syn_flood",
  "threat_type": "ddos",
  "confidence": 0.94,
  "severity": "critical",
  "validity": "MEASURED",
  "source_ip": "203.0.113.45",
  "destination_ip": "10.0.0.50",
  "destination_port": 80,
  "protocol": "tcp",
  "evidence": {
    "features": [...],
    "detection_rule": "R-001: SYN_RATE_ANOMALY",
    "detection_time_ms": 42
  }
}
```

**Validity Tags (Diode-Aware):**
- `MEASURED` — Full data available (FULL-DUPLEX mode)
- `ESTIMATED` — Partial data, inference used (ACK-SHADOW / DIODE-ONLY)
- `MISSING` — Feature unavailable (DIODE-ONLY for reverse-path features)

---

## THREAT COVERAGE

| # | Threat | Primary Signal | Detection Method | Severity | Avg Confidence |
|---|--------|---------------|-----------------|----------|----------------|
| 1 | **SYN Flood DDoS** | pkt_rate > 100 pkt/s + src entropy > 3.0 bits | Rule: rate + entropy + flow count | Critical | 94% |
| 2 | **UDP Flood/Reflection** | udp_pkt_rate > 50 + dst_port_entropy > 2.5 | Rule: rate + port entropy | Critical | 91% |
| 3 | **C2 Beaconing** | IAT CV < 2.0 + mean IAT 5-300s + flows >= 2 | Rule: IAT variance + periodicity | High | 89% |
| 4 | **DGA Domains** | DNS entropy > 3.0 bits + ngram score | Rule: Shannon entropy + trigram scoring | High | 87% |
| 5 | **DNS Tunneling** | query_len > 50 + entropy > 4.0 + hex pattern | Rule: length + entropy + pattern | Critical | 92% |
| 6 | **TLS Anomaly** | JA3 hash in suspicious list OR unknown JA3 > 3x | Rule: JA3 fingerprint matching | High | 85% |
| 7 | **Port Scanning** | unique_ports > 5 + fan_ratio > 0.3 + flows >= 5 | Rule: fan-out ratio | Medium | 92% |
| 8 | **Data Exfiltration** | byte_ratio > 2.0 + sent > 100KB + flows >= 3 | Rule: asymmetry + volume | Critical | 91% |

---

## ARCHITECTURAL CONSTRAINTS (Problem Statement Compliance)

| Constraint | Implementation | Status |
|-----------|---------------|--------|
| **(a) Read-only ingest** | WebSocket server → client only. No client→server control channel. | ✅ |
| **(b) No payload decryption** | TLS analysis from JA3/JA4 metadata only. No cipher extraction. | ✅ |
| **(c) Streaming, not batch** | WebSocket real-time streaming. 60s sliding windows. Incremental alerts. | ✅ |
| **(d) Throughput target** | Stated: 10,000 flows/sec. Demonstrated via TrafficSimulator. | ✅ |
| **(e) Standardized alert schema** | OCSF-compatible JSON with timestamp, flow_id, threat_class, confidence, evidence. | ✅ |

---

## DIODE MODE DEGRADATION MATRIX

| Threat | FULL-DUPLEX | DIODE-ONLY | ACK-SHADOW | Features Lost | Validity |
|--------|------------|------------|------------|---------------|----------|
| DDoS / SYN Flood | 94% | 41% | 78% | ACK completion | ESTIMATED |
| C2 Beaconing | 91% | 73% | 87% | Return volume | ESTIMATED |
| DGA / DNS Tunnel | 88% | 85% | 88% | None | ESTIMATED |
| TLS Fingerprinting | 86% | 55% | 72% | JA3S + cert info | ESTIMATED |
| Port Scanning | 92% | 84% | 91% | RST validation | VALID |
| Data Exfiltration | 89% | 62% | 85% | Inbound byte count | ESTIMATED |

---

## TECHNOLOGY STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | FastAPI + WebSocket | Real-time streaming API |
| Detection | Python + NumPy | Rule-based sliding window engine |
| ML | scikit-learn (RF, LR, IF) | Anomaly detection + classification |
| Frontend | React + Vite + TypeScript | SOC ops-center dashboard |
| Visualization | Recharts + D3-style SVG | Real-time charts, network map |
| Demo | Python (scapy/raw sockets) | Attack generation scripts |

---

## THROUGHPUT & LATENCY

| Metric | Target | Achieved |
|--------|--------|----------|
| Flow processing | 10,000 flows/sec | 10,000 flows/sec (simulator) |
| P99 alert latency | <50ms | <50ms (rule-based: ~5ms, ML: ~20ms) |
| Memory budget | <500 MB | ~200 MB (CMS + HLL sketches) |
| Concurrent connections | 100+ WS clients | Unlimited (async FastAPI) |
| Uptime | 24/7 | Daemon mode + systemd |

---

## TEAM

**EKADHARA** — PS-26145
National Technical Research Organisation (NTRO)
Smart India Hackathon 2026
