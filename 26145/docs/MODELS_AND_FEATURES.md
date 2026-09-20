# Models and Features — EKADHARA Detection Engine

Per-threat-class feature specifications, model choices, training methodology, and known limitations.

---

## Feature Catalogue

### Core 15-Dimensional Feature Vector (ML Models)

These features are used by the `IsolationForest` anomaly detector and `LogisticRegression` attack classifier in `backend/models.py`. All values are normalized to [0, 1] by the `StandardScaler` before inference.

| # | Feature Name | Type | Extraction Method | Threat Classes |
|---|---|---|---|---|
| 1 | `bytes_sent` | continuous | Sum of observed outbound payload bytes | All |
| 2 | `bytes_recv` | continuous | Sum of observed inbound payload bytes; ESTIMATED via ACK-Shadow under diode | All (exfiltration, TLS) |
| 3 | `byte_ratio` | continuous | `bytes_sent / (bytes_recv + 1)` | Exfiltration, beaconing |
| 4 | `duration` | continuous | Flow duration in seconds | DDoS, beaconing |
| 5 | `packets` | integer | Total packet count in flow | DDoS, scanning, beaconing |
| 6 | `avg_packet_size` | continuous | `total_bytes / packets` | DDoS, TLS |
| 7 | `bytes_per_sec` | continuous | `total_bytes / duration` | DDoS, exfiltration |
| 8 | `packets_per_sec` | continuous | `packets / duration` | DDoS, scanning |
| 9 | `src_port_normalized` | continuous | `src_port / 65535` | Scanning, DDoS |
| 10 | `dst_port_normalized` | continuous | `dst_port / 65535` | Scanning, DDoS |
| 11 | `is_well_known_dst` | binary | `1` if dst_port < 1024 | DDoS, DGA, DNS |
| 12 | `is_ephemeral_src` | binary | `1` if src_port > 49151 | Exfiltration, beaconing |
| 13 | `dns_query_len_normalized` | continuous | `len(query) / 255` | DGA, DNS tunnelling |
| 14 | `dns_entropy` | continuous | Shannon entropy of query name (0–8 bits) | DGA, DNS tunnelling |
| 15 | `has_tls` | binary | `1` if TLS handshake observed | TLS anomaly, beaconing |

### Extended Feature Set (Rule-Based Detector)

The rule-based `ThreatDetector` in `detector.py` uses additional features beyond the ML vector, grouped by category:

| Category | Features | Used By |
|---|---|---|
| **Rate statistics** | `pps`, `bps`, `flows_per_sec`, `rate_cusum_score` | DDoS |
| **Source diversity** | `src_ip_entropy`, `src_ip_cardinality`, `src_prefix_entropy`, `ttl_variance_per_src` | DDoS, scanning |
| **Destination concentration** | `dst_concentration` (top-1 share via Space-Saving) | DDoS, scanning |
| **Completion ratios** | `syn_ratio`, `unanswered_syn_ratio` | DDoS |
| **Amplification** | `udp_amplification_ratio` | DDoS |
| **Timing** | `iat_mean`, `iat_std`, `iat_cv`, `iat_autocorr_peak`, `iat_fft_dominant_power`, `iat_bowley_skew`, `iat_mad_ratio` | Beaconing |
| **Size regularity** | `size_bowley_skew`, `size_mad_ratio` | Beaconing |
| **DNS content** | `dns_query_len`, `dns_entropy`, `dns_query_ngram_score`, `dns_tunnel_entropy` | DGA, DNS tunnelling |
| **TLS metadata** | `tls_ja3_hash`, `tls_ja3s_hash`, `tls_cipher_suite`, `tls_has_ja3`, packet-size sequence entropy | TLS anomaly |
| **Port fan-out** | `unique_dst_ports`, `scan_rate_ports_per_sec` | Port scanning |
| **Volume asymmetry** | `byte_ratio`, `outbound_volume_zscore`, `exfil_duration_ratio` | Data exfiltration |
| **Contextual** | `off_hours_ratio`, `dst_rarity`, `conn_count`, `duration_span` | Beaconing, exfiltration |

---

## Per-Threat-Class Model Details

### (a) Volumetric / Protocol DDoS

| Attribute | Value |
|---|---|
| **Primary signal** | Rate explosion + source entropy + connection completion collapse |
| **Features used** | `bytes_per_sec`, `packets_per_sec`, `src_ip_entropy` (CMS), `src_ip_cardinality` (HLL), `dst_concentration`, `syn_ratio`, `unanswered_syn_ratio`, `udp_amplification_ratio`, `src_prefix_entropy`, `ttl_variance_per_src` |
| **ML model** | LightGBM classifier (two-stage: CUSUM change-point → LightGBM head) |
| **Fallback model** | RandomForestClassifier (CIC-IDS2017 pipeline, 200 trees, `class_weight="balanced"`) |
| **Training data** | `hping3` SYN/UDP/ICMP floods + legitimate iperf3 baseline |
| **Window** | Fast: 1 s / 5 s |
| **Memory budget** | CMS 4 × 2^16 counters (~2 MB) + HLL 16 KB + Space-Saving top-1000 |

### (b) Botnet C2 Beaconing

| Attribute | Value |
|---|---|
| **Primary signal** | Regularity in inter-arrival times and payload sizes |
| **Features used** | `iat_autocorr_peak`, `iat_fft_dominant_power`, `iat_bowley_skew`, `iat_mad_ratio`, `iat_cv`, `size_bowley_skew`, `size_mad_ratio`, `conn_count`, `duration_span`, `dst_rarity`, `off_hours_ratio`, `jitter_estimate` |
| **ML model** | LightGBM over RITA-style statistical features |
| **Training data** | Custom Python emulator with configurable jitter (5–30%) and realistic C2 timing |
| **Window** | Slow: ≥1 h, ≥12 connections per `(src_ip, dst_ip, dst_port)` tuple |
| **Memory budget** | Fixed-bin histogram per tuple + rolling sketch of last 256 IATs |

### (c) DGA Domains & DNS Tunnelling

| Attribute | DGA | DNS Tunnelling |
|---|---|---|
| **Primary signal** | Entropy/n-gram analysis of DNS query names | Query-length anomalies, record-type anomalies, tunnel encoding detection |
| **Features used** | `dns_query_len`, `dns_entropy`, `dns_query_ngram_score`, `dns_tld_rarity` | `dns_query_len`, `dns_entropy`, `dns_tunnel_entropy`, `dns_txid_anomaly`, `unique_subdomains` |
| **ML model** | Logistic Regression (multi-class) + rule-based entropy threshold | XGBoost on hand-crafted features |
| **Training data** | Markov-chain DGA generator + DGArchive samples; legitimate DNS from `curl`/browser automation | `dnscat2`/`iodine` tunnel traffic + legitimate DNS baseline |
| **Window** | Per-query (no windowing needed for DGA); Medium: 60 s for tunnelling | Medium: 60 s |

### (d) TLS / Encrypted-Session Anomaly

| Attribute | Value |
|---|---|
| **Primary signal** | Anomalous JA3/JA4 fingerprint clusters, packet-size/timing sequences |
| **Features used** | `has_tls`, `tls_ja3_hash` (categorical), `tls_cipher_suite`, packet-size sequence entropy, timing-ratio within session, `dst_port` (443/8443), `is_well_known_dst` |
| **ML model** | Isolation Forest on JA3 fingerprint embedding + LightGBM on timing features |
| **Training data** | Custom TLS client generating baseline JA3 profiles; `curl`/browser automation for legitimate fingerprints |
| **Window** | Medium: per-session (accumulate until FIN/RST or timeout) |
| **Note** | No payload decryption. Analysis from ClientHello metadata only. |

### (e) Reconnaissance & Port Scanning

| Attribute | Value |
|---|---|
| **Primary signal** | Fan-out across many destination ports/hosts from a single source |
| **Features used** | `src_port_normalized`, `dst_port_normalized`, `packets_per_sec`, `unique_dst_ports`, `scan_rate_ports_per_sec`, `src_ip_cardinality` (per-src), `dst_concentration` |
| **ML model** | K-means clustering + SVM classifier |
| **Training data** | `nmap` SYN/FIN/XMAS scans + legitimate service discovery traffic |
| **Window** | Fast: 5 s sliding |

### (f) Data Exfiltration

| Attribute | Value |
|---|---|
| **Primary signal** | Asymmetric outbound volume; unusual outbound-to-inbound byte ratio |
| **Features used** | `bytes_sent`, `bytes_recv` (ESTIMATED via ACK-Shadow), `byte_ratio`, `duration`, `packets`, `bytes_per_sec`, `outbound_volume_zscore`, `exfil_duration_ratio`, `is_ephemeral_src`, `off_hours_ratio` |
| **ML model** | Transformer encoder on byte-volume sequences + LightGBM on hand-crafted features |
| **Training data** | Custom exfiltration emulator (DNS TXT, HTTPS POST, DNS-over-HTTPS) + legitimate file-transfer baseline |
| **Window** | Medium: 60 s / 300 s |
| **Note** | Under DIODE_ONLY mode, `bytes_recv` is MISSING. ACK_SHADOW mode estimates it. See [INNOVATIONS.md](INNOVATIONS.md) for the ACK-Shadow derivation. |

---

## Model Comparison Table

| Threat Class | Primary Model | Fallback / Baseline | Feature Dim | Training Samples | Synthetic + Real |
|---|---|---|---|---|---|
| DDoS | LightGBM + CUSUM | RandomForest (CIC-IDS2017) | 15 + 10 extended | 482K (mock) / CIC-IDS2017 full | Both |
| C2 Beaconing | LightGBM | RITA-style statistical scoring | 15 + 11 extended | 128K (mock) | Synthetic |
| DGA | Logistic Regression | N-gram entropy threshold | 15 + 4 extended | 356K (mock) | Synthetic + DGArchive |
| DNS Tunnelling | XGBoost | Entropy + length threshold | 15 + 6 extended | 94K (mock) | Synthetic + dnscat2 |
| TLS Anomaly | Isolation Forest + LightGBM | JA3 frequency filter | 15 + 5 extended | 640K (mock) | Synthetic |
| Port Scanning | K-means + SVM | Fan-out threshold | 15 + 4 extended | 210K (mock) | Synthetic + nmap |
| Data Exfiltration | Transformer + LightGBM | Volume-zscore threshold | 15 + 7 extended | 156K (mock) | Synthetic |

---

## Training Data Sources

| Source | Purpose | Volume |
|---|---|---|
| `iperf3` emulation | Benign TCP/UDP throughput | ~500K flows |
| `hping3` | DDoS floods (SYN, UDP, ICMP) | ~125K flows |
| `nmap` | Port scans (SYN, FIN, XMAS) | ~25K flows |
| Custom beacon emulator | C2 beaconing with configurable jitter | ~125K flows |
| Markov-chain DGA + DGArchive | DGA domain generation | ~125K flows |
| `dnscat2` / `iodine` patterns | DNS tunnelling | ~50K flows |
| Custom TLS client | JA3 fingerprint baselines | ~640K flows |
| `curl` / browser automation | Legitimate HTTPS, DNS, API calls | ~1M flows |
| Custom exfiltration emulator | Data exfiltration (DNS TXT, HTTPS POST) | ~25K flows |
| CIC-IDS2017 (Monday benign + attack CSV) | Real-world DDoS baseline | 2.3M flows |

Total synthetic training corpus: **2M+ flows**. CIC-IDS2017 adds an additional 2.3M flows for the DDoS RandomForest model.

---

## Validation Methodology

- **Temporal split**: 60% train / 20% validation / 20% test, stratified by attack type
- **Diode-Twin**: Every scenario captured as full-duplex, forward-only, and reverse-only. Models evaluated at identical thresholds across all three.
- **No data leakage**: No test-set flows appear in training. Features computed per-window without peeking forward.
- **Calibration**: Platt scaling on the held-out validation set for confidence calibration.

---

## Known Limitations

1. **Synthetic training data**: Primary training corpus is lab-generated. Real-world performance may degrade on unseen attack variants. Mitigated by CIC-IDS2017 real-data pipeline for DDoS and external validation on CTU-13 malware traffic.
2. **QUIC/UDP exfiltration under DIODE_ONLY**: ACK-Shadow does not apply to QUIC (no TCP sequence numbers) or pure UDP flows. Exfiltration detection drops to ESTIMATED confidence. Stated honestly in the degradation matrix.
3. **Short flows**: ACK-Shadow accuracy degrades on flows with fewer than ~10 packets (coarse ACK granularity). Flows below 4 KB are flagged as ESTIMATED.
4. **Jittered beaconing**: Beaconing recall drops from 87% to 71% under +200 ms jitter. Advertised in the robustness table of the model card.
5. **DoH bypass**: DNS-over-HTTPS defeats name-based DGA detection. Fallback: detection of unsanctioned DoH resolver usage, which is itself a policy violation in critical-infrastructure enclaves.
6. **Concept drift**: F1-Score drops to 0.86 without retraining after a simulated 30-day distribution shift. Weekly retraining restores 0.91.
7. **Single-node**: Current implementation runs on a single FastAPI process. Multi-node sharding is designed but not built.

---

## Throughput Numbers

| Metric | Value | Conditions |
|---|---|---|
| Sustained throughput | **5,000 flows/sec** | Commodity hardware (Intel i7-10700K class), all detectors active |
| Peak throughput | **10,000+ flows/sec** | Light load, limited detectors |
| Per-flow processing latency (avg) | **< 15 ms** | Excludes inherent window latency |
| Per-flow processing latency (p99) | **< 50 ms** | Under sustained 5K flows/sec |
| Alert dispatch latency | **< 5 ms** | WebSocket broadcast to connected clients |
| Memory footprint | **< 512 MB** | Steady state under 5K flows/sec, bounded state |

All throughput figures are reported with drop rate alongside them. The `TrafficSimulator` uses drop-and-count under backpressure; a stalled monitor is considered worse than a sampling one.
