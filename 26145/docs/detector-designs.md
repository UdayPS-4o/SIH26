# Detector Designs — one specialist per threat class

**Design principle:** *no monolithic classifier.* A single model trained across six wildly different threat classes is what every other team will build, and it is architecturally wrong — DDoS is a rate phenomenon over seconds, beaconing is a periodicity phenomenon over hours, DGA is a string phenomenon on a single query. Different time scales, different feature spaces, different failure modes.

We build **six streaming specialists** and fuse their calibrated outputs.

Every detector below is specified with: signal, features, algorithm, memory bound, one-way behaviour, evasion, and evidence emitted.

---

## Common substrate

**Windowing.** Every detector operates over sliding windows maintained as ring buffers. Three standard tiers:

| Window | Length | Used by |
|---|---|---|
| **Fast** | 1 s / 5 s | DDoS, scanning |
| **Medium** | 60 s / 300 s | Exfiltration, encrypted-session |
| **Slow** | 1 h / 24 h | Beaconing, DGA campaign, host baselines |

**Bounded state.** No unbounded map anywhere. Every per-entity structure lives in a fixed-capacity LRU with sketch-backed aggregates. State budget declared per detector below.

**Feature validity.** Every feature is emitted as `{value, validity}` where validity ∈ `OBSERVED | INFERRED | MISSING`. Models receive the validity mask as input, so a model *knows* when it is reasoning about an inferred value. This is what makes graceful degradation possible instead of silent failure.

---

## (a) Volumetric / Protocol DDoS

### Signal
A flood is three simultaneous things: **rate explodes**, **source diversity becomes abnormal**, and **connection completion collapses**.

### Features

| Feature | Window | Notes |
|---|---|---|
| `pps`, `bps`, `flows_per_sec` | 1 s | raw rate |
| `rate_cusum_score` | 1 s over 60 s baseline | change-point statistic, not a static threshold |
| `src_ip_entropy` | 5 s | Shannon entropy over Count-Min Sketch of source IPs |
| `src_ip_cardinality` | 5 s | HyperLogLog distinct sources |
| `dst_concentration` | 5 s | top-1 destination share (Space-Saving) |
| `syn_ratio` | 5 s | SYN packets / all TCP packets |
| `unanswered_syn_ratio` | 5 s | SYN with no observed completion — **one-way safe** |
| `udp_amplification_ratio` | 5 s | response-size / request-size per known amplifier port (53, 123, 161, 389, 11211, 1900) |
| `src_prefix_entropy` | 5 s | entropy at /24 and /16 — spoofed floods look uniform across the whole space, real ones cluster |
| `ttl_variance_per_src` | 5 s | spoofed sources often carry inconsistent TTLs |

### Algorithm
Two-stage. **Stage 1:** CUSUM change-point detector on rate — cheap, runs on every packet, fires a candidate. **Stage 2:** LightGBM head over the full feature vector classifies `{syn_flood, udp_reflection, spoofed_flood, benign_burst}` and scores confidence.

Why two stages: a legitimate traffic burst (backup window, patch Tuesday) also spikes rate. The entropy and completion features are what separate flood from burst, and we only pay for them when stage 1 fires.

**Key discriminator — spoofed vs real:** real high-volume traffic comes from a *heavy-tailed* source distribution (a few big talkers). Spoofed floods come from a *uniform* distribution across the address space. Entropy at /32 alone doesn't separate these well; **entropy measured jointly at /32, /24 and /16** does. This is a subtle point worth a Q&A answer.

### Memory
CMS 4 × 2^16 counters (~2 MB) + HLL 16 KB + Space-Saving top-1000. **Constant regardless of attack size** — which matters because the naive implementation gets OOM-killed by the very attack it detects.

### One-way behaviour
**Fully functional.** All features derivable from the attack direction. Under REV-only capture we see the victim's responses instead, which is a *different* but still detectable signature (`unanswered_syn` becomes `syn_ack_without_ack`). Both covered in the degradation matrix.

### Evasion
Slow-rate / low-volume floods (Slowloris) evade rate features entirely → handled by a dedicated `slow_http` sub-detector on concurrent-half-open-connection count and request-completion timeout. We include Slowloris explicitly because NTRO's dataset note names it.

### Evidence emitted
Rate before/after, entropy triplet, top talkers, sample flow IDs, CUSUM trace.

---

## (b) Botnet C2 Beaconing

### Signal
**Regularity that survives jitter.** This is the detector where the difference between naive and competent is largest, and the one most worth over-investing in.

### Features
Per `(src_ip, dst_ip, dst_port)` tuple over a slow window (≥1 h, ≥12 connections):

| Feature | Meaning |
|---|---|
| `iat_autocorr_peak` | max autocorrelation of the inter-arrival series, lag > 1 |
| `iat_fft_dominant_power` | power at the dominant frequency / total power |
| `iat_bowley_skew` | quartile skewness of IAT distribution — near 0 = machine-like |
| `iat_mad_ratio` | median absolute deviation / median — jitter tolerance measure |
| `iat_cv` | coefficient of variation |
| `size_bowley_skew`, `size_mad_ratio` | same statistics on **payload size** — C2 check-ins are near-constant size |
| `conn_count`, `duration_span` | evidence weight |
| `dst_rarity` | how unusual is this destination for this network (from passive DNS + observed history) |
| `off_hours_ratio` | fraction of check-ins outside business hours |
| `jitter_estimate` | inferred jitter % from IAT distribution shape |

### Algorithm
This is deliberately **not** deep learning. The RITA-style statistical approach is more interpretable, more evidence-friendly, and demonstrably effective:

```
score_timing = f(autocorr_peak, 1 - bowley_skew, 1 - mad_ratio)
score_size   = g(size_bowley_skew, size_mad_ratio)
score_hist   = h(conn_count, duration_span)          # evidence weight
beacon_score = LightGBM(all features)                # learned combination
```

Streaming implementation: a fixed-bin histogram of IATs per tuple plus a rolling sketch of the last N IATs (N = 256), so autocorrelation is computed incrementally without storing full history.

**Why we beat the naive version:** naive detectors threshold on IAT standard deviation, which any malware with ±20% jitter defeats. Bowley skewness and MAD are **robust statistics** — they measure *shape*, and a jittered beacon still has a symmetric, tightly-clustered, machine-generated IAT distribution that no human-driven traffic produces.

### Memory
LRU of 100k tuples × (256-entry ring + histogram) ≈ bounded at a declared ceiling; cold tuples evicted with their summary statistics preserved in a compact digest.

### One-way behaviour
**Fully functional** — beacons originate from the infected host, so client→server capture sees them. Under REV-only we see the C2's replies, which are also periodic. Slight recall loss; measured.

### Evasion
| Evasion | Our response |
|---|---|
| Jitter up to ±50% | Robust statistics hold; F1-vs-jitter curve published |
| Long sleep (24 h beacons) | Requires our slow window; we report minimum observation time needed |
| Domain fronting / CDN destination | `dst_rarity` degrades; we flag as reduced confidence rather than missing silently |
| Randomised payload padding | `size_*` features degrade; timing features carry it |

### Evidence emitted
IAT histogram sparkline, autocorrelation plot, connection count, estimated jitter %, destination, matched JA4 if any.

---

## (c) DGA Domains and DNS Tunnelling

Two related but distinct detectors sharing DNS parsing.

### (c1) DGA detection

**Per-query features:** length, entropy, vowel/consonant ratio, digit ratio, max consecutive consonants, character bigram/trigram log-likelihood against an English + Alexa-top-1M model, label depth, TLD rarity, dictionary-word coverage.

**Per-host aggregate features (the stronger signal):** NXDOMAIN rate, NXDOMAIN *burst* pattern, unique-domain rate, query volume to never-before-seen domains, resolution-success ratio, TTL distribution anomalies.

**Algorithm:** character-level 1-D CNN on the domain string (small, ~50k params, fast) → per-query DGA probability; aggregated per host into a campaign score by LightGBM using the per-host features.

**Critical insight:** a *single* algorithmically generated domain is ambiguous — plenty of legitimate CDN and telemetry domains look random. **A host emitting 200 unique never-before-seen domains in 5 minutes with an 85% NXDOMAIN rate is unambiguous.** Lead with the aggregate, use the per-query model as a feature. Most teams do only the per-query string classifier and drown in false positives on `akamai`/`cloudfront`/`azureedge` names.

**Zero-egress advantage:** our self-built passive DNS gives `first_seen_age` for free — "this network has never resolved this domain in 30 days of history" is a powerful feature that normally requires a threat-intel subscription.

### (c2) DNS tunnelling

**Features:** query-name length distribution, subdomain-label entropy, label count, record-type mix (`TXT`/`NULL`/`CNAME` fraction), upstream bytes-per-zone, queries-per-second-per-zone, response-size distribution, unique-subdomain cardinality per registered domain (HLL), query/response size ratio.

**Algorithm:** per-registered-domain aggregation → LightGBM. The dominant signal is `unique_subdomains_per_zone` combined with `mean_query_length` — a tunnel encodes payload into subdomain labels, producing hundreds of long unique subdomains under one zone.

**Calibrated against:** `iodine` and `dnscat2` (both named in NTRO's dataset note), at multiple throughput settings including deliberately throttled "low and slow" mode.

### One-way behaviour
**Queries are client→server, so FWD-only capture retains the primary signal.** We lose response codes (NXDOMAIN) under strict FWD-only — significant recall loss for DGA aggregate features. **Mitigation:** infer NXDOMAIN-like behaviour from *retry patterns* — a client that queries a name and then immediately queries a different name, repeatedly, without any subsequent connection to a resolved IP, is exhibiting DGA search behaviour. This inference is itself a differentiator; it appears in the degradation matrix with its own accuracy figure.

### Evasion
DoH/DoT hides query names entirely. **Honest answer:** we lose name visibility, and we say so. Fallback: detect *the use of DoH itself* to a non-sanctioned resolver via TLS metadata (JA4 + SNI + destination), which for a critical-infrastructure enclave is itself a policy alert.

---

## (d) Malware Inside Encrypted Sessions

### Signal
Two independent channels: **who is speaking** (fingerprint) and **how they speak** (rhythm).

### Features

**Fingerprint channel:**
- `JA4` client fingerprint (TLS ClientHello: version, cipher list, extension list, ALPN, SNI presence)
- `JA4S` server fingerprint — *only under bidirectional capture*
- Match against bundled offline fingerprint DB → `{known_browser, known_library, known_malware_family, unknown}`
- `ja4_rarity` — how often has this fingerprint appeared in this network

**Rhythm channel** (first 20 packets of the session):
- Sequence of `(size, direction, inter-arrival)` triples
- Total handshake duration, record-count, mean/variance of record sizes
- Session duration, byte totals, idle-gap distribution

**Contextual:**
- SNI present/absent, SNI entropy (DGA-like SNI)
- Certificate-free session (raw TLS to an IP with no SNI) — strongly suspicious in an enterprise
- Destination port non-443 TLS
- QUIC: initial packet length, version, connection-ID behaviour

### Algorithm
Fingerprint lookup (deterministic, high precision) + a small **1-D CNN or GRU over the packet-size/direction/timing sequence** (learned, higher recall) → LightGBM fusion.

**Why the sequence model works:** a browser fetching a web page has a characteristic burst pattern (small request, large multi-packet response, idle, more requests). A C2 session has a distinctly different one (small request, small response, long idle, repeat). The *shape* of the first 20 packets is discriminative even though every byte is encrypted.

### One-way behaviour
**Degrades meaningfully — the honest weak point of our system, and we say so.**

| Under FWD-only we lose | Mitigation |
|---|---|
| `JA4S` server fingerprint | Rely on client JA4 only; measured recall drop reported |
| Response packet sizes | **ACK-Shadow** recovers *volume* and coarse *packet count*, not individual sizes |
| Server certificate metadata | None — declared as a gap |

We report this class's degradation prominently. **Declaring a measured weakness is more credible than claiming uniform excellence** — and it directly demonstrates why Diode-Twin evaluation matters.

### Evasion
TLS record padding, uTLS-style fingerprint mimicry (malware impersonating Chrome's JA4), domain fronting. All included in the evasion suite with break-even points.

### Licence note
Core **JA4** (TLS client) is BSD-3-Clause. **JA4S / JA4H / JA4X / JA4T / JA4L / JA4SSH** are FoxIO Licence 1.1 — permissive for internal and government use, *not* for monetisation, patent-pending. Our shipped build defaults to BSD-licensed JA4; JA4+ methods sit behind a build flag with the licence surfaced at compile time.

---

## (e) Reconnaissance and Port Scanning

### Signal
**Fan-out** — abnormal cardinality of destinations or ports from one source.

### Features
Per source IP, per window:

| Feature | Structure |
|---|---|
| `distinct_dst_ips` | HyperLogLog |
| `distinct_dst_ports` | HyperLogLog |
| `dst_port_entropy` | CMS-backed |
| `syn_only_ratio` | connections initiated with no observed data — **one-way safe** |
| `connection_success_ratio` | requires bidirectional; degrades gracefully |
| `scan_shape` | vertical (one host, many ports) vs horizontal (one port, many hosts) vs block |
| `sequential_port_score` | are ports ascending/patterned — nmap default is not random |
| `inter_probe_iat_regularity` | scanners are machine-timed |
| `payload_absence_ratio` | scan probes carry no payload |

### Algorithm
HLL cardinality thresholding for the obvious cases + LightGBM for the subtle ones. Multi-window (1 s / 60 s / 1 h) to catch both fast and slow-and-low scans.

**Slow-scan handling is the differentiator.** A 1-probe-per-90-seconds scan is invisible at 1 s and 60 s windows. We run a **long-window HLL with exponential decay** per source, so a slow scan accumulates cardinality over hours without unbounded memory. We publish detection latency vs scan rate.

### Memory
HLL is ~1.5 KB/source at 1% error. LRU capacity 50k sources ≈ 75 MB, declared and fixed.

### One-way behaviour
**Fully functional.** Scan probes are outbound from the scanner; `syn_only_ratio` and `payload_absence_ratio` are computable from one direction. Loss of `connection_success_ratio` reduces our ability to say *which* ports were open — but detecting the scan is unaffected.

### Distributed-scan bonus
Aggregate at the /24 source-prefix level in parallel with per-IP, so a scan spread across 50 source addresses is still caught. Few teams will do this.

---

## (f) Data Exfiltration — the ACK-Shadow detector

### Signal
Abnormal outbound volume relative to a **learned per-host baseline**, to an **unusual destination**.

### The core problem
`down_up_ratio` requires both directions. Under diode capture we have one. See [`innovations.md` §2](innovations.md).

### ACK-Shadow estimator
```
reverse_bytes_est = (max_ack_seen - initial_ack) adjusted for:
    - 32-bit sequence wraparound  (wrap counter)
    - duplicate ACKs              (do not double-count)
    - SACK blocks                 (finer granularity where present)
    - zero-window probes          (excluded)

reverse_pkts_est  ≈ reverse_bytes_est / observed_MSS      (coarse)
rtt_proxy         ≈ time(ACK covering our data) - time(our data sent)
```

Validity flag = `INFERRED`. Accuracy of the estimator is itself measured against the bidirectional twin and reported — *"our ACK-Shadow reverse-volume estimate is within X% of ground truth on N flows"* is a genuinely novel result to put on a slide.

### Features

| Feature | Source |
|---|---|
| `upload_bytes` | observed |
| `download_bytes` | observed, or **ACK-Shadow inferred** |
| `up_down_ratio` | derived |
| `host_baseline_deviation` | EWMA of this host's historical ratio and volume |
| `dst_rarity` | passive-DNS first-seen age + observed-history frequency |
| `dst_asn_rarity` | offline BGP map — egress to a never-before-contacted ASN |
| `off_hours_volume` | volume outside business-hours profile |
| `flow_duration`, `sustained_rate` | long slow transfers |
| `protocol_mismatch` | large upload over DNS/ICMP/NTP — protocol abuse |
| `aggregate_per_host_upload` | sum across many small flows — defeats chunking evasion |

### Algorithm
**Baseline-relative, not absolute.** A static "upload > 1 GB = alert" threshold is useless — a backup server legitimately uploads terabytes. We learn per-host EWMA baselines during a warm-up period and score deviation. IsolationForest for the unsupervised anomaly component + LightGBM for the supervised component, fused.

### One-way behaviour
**This is the detector that would fail entirely without ACK-Shadow.** In the degradation matrix we show three rows for this class:

| Configuration | Expected outcome |
|---|---|
| Bidirectional | full performance |
| FWD-only **without** ACK-Shadow | detector effectively dead |
| FWD-only **with** ACK-Shadow | most of the performance recovered |

**That three-row comparison is the single most persuasive result in our entire submission.** It proves the innovation, quantifies it, and demonstrates the evaluation methodology all at once.

### Evasion
Chunking into many small flows (→ per-host aggregate feature), slow drip over days (→ long-window baseline), exfil to a popular destination like a cloud storage provider (→ `dst_rarity` degrades; acknowledged, mitigated by volume-vs-baseline), UDP/QUIC exfil (→ **ACK-Shadow does not apply; declared gap**).

---

## Fusion layer

```
for each detection:
    calibrated_conf = isotonic_model[class](raw_score)

group detections by (entity, sliding 6h window)
map each class onto a kill-chain stage:
    RECON        ← (e) scanning
    C2           ← (b) beaconing, (d) encrypted malware
    IMPACT       ← (a) DDoS
    EXFIL        ← (f) exfiltration
    ENABLEMENT   ← (c) DGA / DNS tunnel

if ≥2 stages present for the same entity:
    emit INCIDENT with escalated severity
    severity = f(max_conf, asset_criticality, n_stages, blast_radius)
else:
    emit standalone ALERT
```

Corroboration across independent detectors is genuine Bayesian evidence — two weak signals from different feature spaces on the same host are far stronger than either alone. Say this out loud in Q&A; it is a real statistical argument, not a UI nicety.

---

## Cross-detector summary

| Class | Primary structure | Memory | One-way | Hardest evasion |
|---|---|---|---|---|
| (a) DDoS | CMS + HLL + CUSUM | ~2 MB fixed | ✅ full | Slow-rate (Slowloris) |
| (b) Beaconing | IAT ring + histogram, LRU | bounded LRU | ✅ full | Long-sleep beacons |
| (c) DGA/DNS | char-CNN + per-zone HLL | bounded LRU | ⚠️ loses NXDOMAIN → inferred | DoH/DoT |
| (d) Enc. malware | FP table + seq model | small | ⚠️ loses JA4S — **declared gap** | uTLS fingerprint mimicry |
| (e) Scanning | HLL per source, LRU | ~75 MB fixed | ✅ full | Slow-and-low, distributed |
| (f) Exfiltration | ACK-Shadow + EWMA baselines | bounded LRU | ⚠️ **rescued by ACK-Shadow** | UDP/QUIC exfil |

Two ✅-full, three ⚠️-degraded-but-quantified, zero silent failures. **Zero silent failures is the claim that matters** — and it is only possible because of Diode-Twin evaluation.
