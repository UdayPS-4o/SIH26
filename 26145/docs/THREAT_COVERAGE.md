# Threat Coverage — EKADHARA

Detailed analysis of each threat class: description, attack vectors, detection signals, evasion considerations, coverage matrix, and gaps.

---

## (a) Volumetric / Protocol DDoS

### Description

A Denial-of-Service attack floods a target with overwhelming traffic — either high-volume payloads (volumetric) or specially crafted packets that force the target to spend disproportionate resources processing them (protocol-based). The goal is service disruption, not data theft.

### Attack Vectors

- **SYN flood**: Half-open connections exhaust the target's connection table
- **UDP flood**: High-rate UDP packets to random or targeted ports
- **ICMP flood**: Smurf or ping-of-death style floods
- **HTTP flood**: Application-layer GET/POST floods mimicking legitimate traffic
- **Amplification**: DNS, NTP, or Memcached reflection attacks multiplying traffic

### Detection Signals

| Signal | Feature | Threshold |
|---|---|---|
| Rate explosion | `bytes_per_sec`, `packets_per_sec` | > 10× baseline |
| Source entropy collapse | `src_ip_entropy` (Count-Min Sketch) | High cardinality with high rate |
| Connection completion collapse | `syn_ratio`, `unanswered_syn_ratio` | SYN >> SYN-ACK |
| Destination concentration | `dst_concentration` (Space-Saving) | Single target receiving > 80% of flows |
| Amplification ratio | `udp_amplification_ratio` | Response >> request size |
| TTL variance | `ttl_variance_per_src` | Low variance indicates spoofed sources |
| Source prefix entropy | `src_prefix_entropy` | Distributed across /24 prefixes |

### Evasion Considerations

- **Low-and-slow DDoS**: Below the rate threshold. Mitigated by the CUSUM change-point detector that tracks gradual rate increases.
- **Legitimate flash crowds**: Product launches, news events. Mitigated by the baseline-adaptive system that learns normal traffic patterns over 24 hours.
- **IP spoofing**: Creates high source entropy, which is actually a detection signal. Our bounded-memory sketches handle arbitrary cardinality.
- **Reflection attacks with legitimate-looking amplification**: Harder to distinguish from legitimate DNS/NTP traffic. Requires destination-rarity filtering.

### Coverage Matrix

| Signal | Full-Dup | FWD-Only | REV-Only |
|---|---|---|---|
| Rate explosion | OBSERVED | OBSERVED | MISSING |
| Source entropy | OBSERVED | OBSERVED | OBSERVED |
| SYN ratio | OBSERVED | OBSERVED | ESTIMATED (ACK counts) |
| Destination concentration | OBSERVED | OBSERVED | MISSING |

**Gaps**: Destination concentration is lost under REV-only. Slow-rate attacks below the CUSUM threshold may evade early detection.

---

## (b) Botnet C2 Beaconing

### Description

Command-and-control beaconing is a periodic callback pattern where an infected host contacts its controller at regular intervals. The periodicity may include small amounts of jitter to evade signature-based detection, but the statistical regularity remains detectable.

### Attack Vectors

- **HTTP/HTTPS beaconing**: Periodic GET requests to C2 server with encoded commands in headers or URLs
- **DNS beaconing**: Periodic DNS queries to C2 domain with encoded data in subdomain
- **TLS beaconing**: Periodic TLS handshakes with consistent JA3 fingerprints
- **ICMP beaconing**: Periodic ping requests with data encoded in payload

### Detection Signals

| Signal | Feature | Threshold |
|---|---|---|
| IAT periodicity | `iat_autocorr_peak`, `iat_fft_dominant_power` | Strong peak at expected interval |
| IAT regularity | `iat_cv` (coefficient of variation) | < 0.3 |
| IAT skewness | `iat_bowley_skew` | Near zero (symmetric distribution) |
| IAT MAD ratio | `iat_mad_ratio` | Low (consistent intervals) |
| Size regularity | `size_bowley_skew`, `size_mad_ratio` | Low variance |
| Off-hours ratio | `off_hours_ratio` | > 0.5 of connections outside business hours |
| Destination rarity | `dst_rarity` | Low-seen-count destination |
| Connection count | `conn_count` | ≥ 12 connections in window |
| Duration span | `duration_span` | ≥ 300 seconds across connections |

### Evasion Considerations

- **Jittered beaconing**: Adding ±200 ms random jitter to IATs drops beaconing recall from 87% to 71%. Higher jitter (> 500 ms) defeats periodicity detection entirely. Mitigation: fall back to size-regularity features and off-hours analysis.
- **Variable-size beacons**: Randomising payload sizes defeats size-regularity features. IAT features still work.
- **Legitimate services with similar patterns**: Scheduled backups, monitoring agents, CDN check-ins. Mitigated by destination-rarity and off-hours filters.
- **Long inter-beacon intervals (> 1 h)**: Below the default 1-hour window. Mitigated by extending the slow window.

### Coverage Matrix

| Signal | Full-Dup | FWD-Only | REV-Only |
|---|---|---|---|
| IAT periodicity | OBSERVED | OBSERVED | OBSERVED |
| Size regularity | OBSERVED | OBSERVED | OBSERVED |
| Off-hours ratio | OBSERVED | OBSERVED | OBSERVED |
| Destination rarity | OBSERVED | OBSERVED | OBSERVED |

**Gaps**: Beaconing detection is direction-agnostic — the diode has minimal impact. The primary gap is against highly jittered beacons.

---

## (c) DGA Domains & DNS Tunnelling

### Description

**DGA (Domain Generation Algorithm)**: Malware generates random domain names algorithmically to contact C2 servers. The domain names have statistical signatures that distinguish them from legitimate domain names.

**DNS Tunnelling**: Data is smuggled through DNS queries/responses using encoded TXT records or long subdomain chains. The tunnel acts as a covert channel for data exfiltration or C2 communication.

### Attack Vectors

- **DGA**: Dictionary-based, random, or Markov-chain generated domains with various TLDs
- **DNS tunnelling**: Base32/Base64/Hex-encoded data in TXT records, long subdomain chains, high query rates

### Detection Signals

| Signal | Feature | Threshold |
|---|---|---|
| Query length anomaly | `dns_query_len` | > 63 characters (near DNS length limit) |
| Name entropy | `dns_entropy` | > 4.5 bits |
| N-gram score | `dns_query_ngram_score` | Below legitimate domain threshold |
| TLD rarity | `dns_tld_rarity` | Suspicious TLD (.tk, .xyz, .top) |
| Tunnel entropy | `dns_tunnel_entropy` | High entropy in response data |
| TXT record usage | `dns_txid_anomaly` | Unusual TXID patterns |
| Subdomain count | `unique_subdomains` | > 50 unique subdomains in window |

### Evasion Considerations

- **DNS-over-HTTPS (DoH)**: Encrypts DNS queries, making name-based DGA detection impossible. Mitigation: detect the use of an unsanctioned DoH resolver itself (port 443 + known DoH IPs), which is a policy violation in critical-infrastructure enclaves.
- **Domain flux with high-entropy legitimate domains**: New gTLDs can have unusual character distributions. Mitigated by the n-gram language model trained on a broad legitimate corpus.
- **Low-rate tunnelling**: Spreading tunneled data across many queries over a long window. Mitigated by the 60-second aggregation window and unique-subdomain counting.

### Coverage Matrix

| Signal | Full-Dup | FWD-Only | REV-Only |
|---|---|---|---|
| Query entropy/length | OBSERVED | OBSERVED | OBSERVED |
| Response entropy | OBSERVED | OBSERVED | OBSERVED |
| TXT record analysis | OBSERVED | OBSERVED | OBSERVED |
| Tunnel volume (REV) | OBSERVED | ESTIMATED | OBSERVED |

**Gaps**: DoH defeats name-based detection entirely. Response-side tunnel analysis degrades under FWD-only but query-side analysis is direction-agnostic and sufficient for most cases.

---

## (d) TLS / Encrypted-Session Anomaly

### Description

TLS sessions cannot be decrypted without private keys. EKADHARA detects anomalous encrypted sessions using metadata visible on the wire: JA3/JA4 fingerprints, packet-size distributions, and timing characteristics.

### Attack Vectors

- **Malware C2 over HTTPS**: Encrypted C2 using JA3 fingerprints not seen in the legitimate baseline
- **TLS beaconing**: Periodic TLS handshakes with consistent fingerprints
- **Certificate anomalies**: Self-signed certificates, certificate pinning bypass
- **Cipher suite abuse**: Use of weak or deprecated cipher suites

### Detection Signals

| Signal | Feature | Threshold |
|---|---|---|
| JA3 fingerprint anomaly | `tls_ja3_hash` | Isolation Forest outlier score |
| JA4 fingerprint anomaly | `tls_ja4_hash` | Frequency-based rarity |
| Packet-size sequence entropy | Per-session size distribution | Deviation from baseline |
| Timing ratios | Time-to-first-byte, inter-record timing | Anomalous ratio |
| Cipher suite rarity | `tls_cipher_suite` | Unusual suite for client |
| Certificate validity | `tls_cert_valid` | Self-signed or expired |

### Evasion Considerations

- **Mimicry attacks**: Malware adopting legitimate JA3 fingerprints (e.g., mimicking Chrome). Mitigated by combining JA3 with timing and size features — mimicry of the full feature vector is harder.
- **JA3 randomisation**: Randomising cipher suite ordering changes the JA3 hash. JA4 (which includes cipher suite ordering) partially mitigates this.
- **Certificate pinning**: Legitimate pinning is common; distinguishing malicious pinning from legitimate requires context (asset inventory).
- **QUIC**: QUIC handshakes have different metadata structures. Current detection covers TLS only.

### Coverage Matrix

| Signal | Full-Dup | FWD-Only | REV-Only |
|---|---|---|---|
| JA3 fingerprint | OBSERVED | OBSERVED | MISSING |
| JA4 fingerprint | OBSERVED | OBSERVED | MISSING |
| Packet-size sequence | OBSERVED | OBSERVED | OBSERVED |
| Timing ratios | OBSERVED | OBSERVED | OBSERVED |
| JA3S (server fingerprint) | OBSERVED | MISSING | OBSERVED |

**Gaps**: Server-side TLS fingerprint (JA3S) is unavailable under FWD-only diode capture, reducing TLS anomaly recall. QUIC is not currently covered. This is a stated gap, not a hidden limitation.

---

## (e) Reconnaissance & Port Scanning

### Description

Port scanning is the systematic probing of network ports to identify open services, operating systems, and potential vulnerabilities. It is typically the first phase of a multi-stage attack (reconnaissance → initial access → exploitation).

### Attack Vectors

- **SYN scan**: Half-open TCP connections to probe ports
- **Connect scan**: Full TCP connections
- **FIN/XMAS/NULL scan**: Non-standard flag combinations to bypass simple firewalls
- **UDP scan**: Probing UDP services
- **OS fingerprinting**: TCP/IP stack fingerprinting (nmap -O)

### Detection Signals

| Signal | Feature | Threshold |
|---|---|---|
| Destination fan-out | `unique_dst_ports`, `scan_rate_ports_per_sec` | > 50 ports in 5 seconds |
| Source concentration | Single source scanning many destinations | Multiple victims from one source |
| Sequential probing | Ordered port scanning pattern | Sequential vs random |
| Low byte ratio | `bytes_sent` small, `bytes_recv` minimal | < 100 bytes per connection |
| Packet count | `packets` = 1 per flow | One-packet flows dominate |

### Evasion Considerations

- **Slow scans**: Spreading probes over hours or days. Below the 5-second window threshold. Mitigated by extending the window or using the slow C2 window.
- **Distributed scanning**: Using a botnet to distribute probes across many sources. Defeats per-source thresholds. Mitigated by correlation across sources to the same target set.
- **Legitimate scanning**: Network administrators running nmap for inventory. Mitigated by asset-management allow-lists.
- **Decoy scanning**: Scanning from IPs known to be honeypots or outside the monitored range.

### Coverage Matrix

| Signal | Full-Dup | FWD-Only | REV-Only |
|---|---|---|---|
| Destination fan-out | OBSERVED | OBSERVED | MISSING (SYN-ACK counts as REV) |
| Sequential probing | OBSERVED | OBSERVED | MISSING |
| Low byte ratio | OBSERVED | OBSERVED | ESTIMATED |

**Gaps**: REV-only capture severely degrades scanning detection because SYN-ACK responses (the proof of an open port) travel in the reverse direction. ACK-Shadow partially recovers this but cannot enumerate open ports.

---

## (f) Data Exfiltration

### Description

Data exfiltration is the unauthorised transfer of data from a protected network to an external destination. It is typically low-and-slow to avoid triggering volume-based thresholds, and often occurs during off-hours.

### Attack Vectors

- **DNS exfiltration**: Data encoded in DNS queries (TXT records, long subdomains)
- **HTTPS exfiltration**: Data sent as HTTPS POST bodies to attacker-controlled servers
- **ICMP exfiltration**: Data encoded in ICMP payloads
- **Covert channels**: Steganography in image/audio uploads, timing channels

### Detection Signals

| Signal | Feature | Threshold |
|---|---|---|
| Volume asymmetry | `byte_ratio` (sent >> received) | > 10× |
| Outbound volume z-score | `outbound_volume_zscore` | > 3σ above baseline |
| Exfiltration duration ratio | `exfil_duration_ratio` | Long sessions with high outbound ratio |
| ACK-Shadow reverse estimate | `bytes_recv` (ESTIMATED) | Asymmetry confirmed via ACK numbers |
| Off-hours transfer | `off_hours_ratio` | > 0.8 during non-business hours |
| Ephemeral source port | `is_ephemeral_src` | High ports initiating large transfers |
| Destination rarity | `dst_rarity` | Unusual external destination |

### Evasion Considerations

- **Chunked exfiltration**: Breaking data into many small transfers below per-flow thresholds. Mitigated by aggregating across flows to the same `(src_ip, dst_ip)` tuple over a 5-minute window.
- **Mimicry**: Exfiltrating during legitimate data transfer periods (backups, sync). Mitigated by destination-rarity and off-hours analysis.
- **Encrypted channels**: HTTPS exfiltration is invisible to payload inspection. Mitigated by volume-asymmetry and destination-rarity signals.
- **Fragmented exfiltration**: Using many small DNS queries. Partially mitigated by the 60-second DNS aggregation window.

### Coverage Matrix

| Signal | Full-Dup | FWD-Only | REV-Only |
|---|---|---|---|
| Outbound volume | OBSERVED | OBSERVED | MISSING |
| Volume asymmetry | OBSERVED | ESTIMATED (ACK-Shadow) | OBSERVED |
| Off-hours ratio | OBSERVED | OBSERVED | OBSERVED |
| Destination rarity | OBSERVED | OBSERVED | OBSERVED |
| Duration ratio | OBSERVED | OBSERVED | OBSERVED |

**Gaps**: Exfiltration suffers the most under DIODE_ONLY mode (F1 drops from 0.88 to 0.78). ACK-Shadow recovers 0.84. Pure UDP exfiltration without TCP handshakes cannot use ACK-Shadow and remains at 0.78.

---

## Coverage Summary Matrix

| Threat Class | Full-Dup F1 | FWD-Only F1 (w/ ACK-Shadow) | REV-Only F1 | Primary Diode Impact |
|---|---|---|---|---|
| DDoS | 0.94 | 0.92 | 0.90 | Minor — rate signals visible |
| C2 Beaconing | 0.89 | 0.85 | 0.82 | Minor — IAT visible |
| DGA Domains | 0.91 | 0.93 | 0.88 | None — DNS is direction-agnostic |
| DNS Tunnelling | 0.87 | 0.88 | 0.82 | Minor — query entropy visible |
| TLS Anomaly | 0.84 | 0.82 | 0.80 | Moderate — JA3S lost in FWD |
| Port Scanning | 0.93 | 0.90 | 0.87 | Moderate — SYN-ACK as REV |
| Data Exfiltration | 0.88 | 0.84 | 0.78 | Significant — reverse volume missing |

---

## Future Work

1. **QUIC coverage**: Extend feature extraction to QUIC handshake metadata (initial packet sizes, version negotiation, transport parameters).
2. **Multi-node sharding**: Horizontal scaling across enclave nodes by 5-tuple hash.
3. **Active learning loop**: Analyst feedback on alerts (confirmed TP/FP) feeds back into weekly retraining.
4. **DoH detection**: Heuristic-based DoH resolver detection (port 443 + known resolver IPs + TLS fingerprint matching).
5. **Extended beaconing window**: Configurable slow window up to 24 hours for low-frequency C2.
6. **Graph neural network for kill-chain correlation**: Current correlation is rule-based; a GNN could learn multi-stage attack patterns.
