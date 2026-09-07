# Evaluation Protocol — the seven report cards

**Thesis:** the winning submission is not the one with the highest number, it is the one whose numbers a hostile expert cannot dismantle.

We therefore publish seven report cards, including the ones that make us look worse.

---

## Report Card 1 — Per-class detection quality

Standard, for comparability. Reported at the operating threshold, on the held-out test split, **at the true operational base rate** (not rebalanced).

| Class | Precision | Recall | F1 | PR-AUC | Support |
|---|---|---|---|---|---|
| a · DDoS | | | | | |
| b · Beaconing | | | | | |
| c · DGA | | | | | |
| c · DNS tunnel | | | | | |
| d · Encrypted malware | | | | | |
| e · Recon / scan | | | | | |
| f · Exfiltration | | | | | |

**Use PR-AUC, not ROC-AUC.** Under 1-in-10,000 imbalance, ROC-AUC is flattering and misleading — it is dominated by the enormous true-negative count. Saying this out loud in the write-up is worth marks with any judge who knows ML.

---

## Report Card 2 — Alert-budget precision (P@k) ★

**The headline metric.** Accuracy is meaningless at this base rate; see [`innovations.md` §6](innovations.md).

| Alert budget | Precision | True positives found | Attacks missed |
|---|---|---|---|
| Top 10 / hour | | | |
| Top 50 / hour | | | |
| Top 200 / hour | | | |
| Unlimited (threshold 0.5) | | | |

Plus the full **precision@k curve** and **alerts-per-analyst-hour vs recall** trade-off curve.

**Framing:** *"A SOC analyst triages roughly 50 alerts an hour. That's the budget. Everything above it is noise you're paying a human to ignore."*

---

## Report Card 3 — Degradation matrix ★★ flagship

**The result nobody else can produce.** Identical models, identical thresholds, three capture configurations.

| Class | BI (both dirs) | FWD-only | REV-only | FWD-only, ACK-Shadow **off** |
|---|---|---|---|---|
| a · DDoS | F1 | F1 | F1 | — |
| b · Beaconing | F1 | F1 | F1 | — |
| c · DGA | F1 | F1 | F1 | — |
| c · DNS tunnel | F1 | F1 | F1 | — |
| d · Encrypted malware | F1 | F1 | F1 | — |
| e · Recon / scan | F1 | F1 | F1 | — |
| **f · Exfiltration** | **F1** | **F1** | **F1** | **F1 ≈ 0** |

That last column is the proof of ACK-Shadow. The gap between "FWD-only with ACK-Shadow" and "FWD-only without" **is** the innovation, quantified.

**Fourth axis:** repeat the whole matrix on **IPFIX flow records only** (no packets). Flow-only is inherently lossier — quantifying how much is directly useful to NTRO, since some of their links may only export flow.

---

## Report Card 4 — ACK-Shadow estimator accuracy

A standalone validation, because it is a novel component and it must be defended on its own terms.

| Metric | Definition |
|---|---|
| Median absolute % error | \|est − truth\| / truth, over all TCP flows in the twins |
| % of flows within 5 % / 10 % of truth | reliability distribution |
| Error vs flow size | does it degrade on short flows? (expected: yes, small flows have coarse ACK granularity) |
| Error vs loss rate | does retransmission break it? |
| Coverage | fraction of flows where ACK-Shadow is applicable (TCP with ≥N ACKs) |

Ground truth comes free: it is the actual reverse-direction byte count in the `BI` twin.

**Expected honest result:** high accuracy on medium/large flows, degrading on very short flows, inapplicable to UDP/QUIC. Report all three. *"Within 3% on flows above 100 KB, unusable below 4 KB, not applicable to QUIC"* is a far stronger claim than an unqualified one.

---

## Report Card 5 — Performance

The PS explicitly demands this (constraint d) and almost nobody will deliver it properly.

| Metric | Reported as |
|---|---|
| Sustained throughput | flows/sec **and** Mbps, both stated |
| Packet drop rate at sustained rate | must be ~0, or the throughput claim is void |
| Alert latency | p50 / p95 / **p99**, window-close → alert emitted |
| Window latency | reported *separately* — see below |
| Resident memory | steady-state, and **peak during a 10× burst** |
| CPU utilisation | cores used at sustained rate |
| Hardware | exact spec, stated |

**Two latencies, never conflated:**
- **Processing latency** — how long after a window closes do we emit the alert. Target p99 < 100 ms.
- **Window latency** — how long a window must be before the signal exists at all. A 60-second beacon needs multiple periods; the floor is physics, not engineering.

Teams that claim "sub-second detection of C2 beaconing" are conflating the two. Explicitly separating them is a credibility marker.

**The flat-memory chart** (see FIG-10 in [`architecture-diagram.md`](architecture-diagram.md)) belongs here: our sketch-based memory stays flat while a naive hashmap baseline climbs to OOM under a spoofed-source flood. Build the naive baseline *specifically* to produce this chart — it takes an afternoon and it is worth a slide.

---

## Report Card 6 — Calibration

The PS requires a confidence score. We prove ours is meaningful.

| Artefact | What it shows |
|---|---|
| **Reliability diagram** | predicted confidence (x) vs observed accuracy (y); the diagonal is perfect |
| **Expected Calibration Error (ECE)** | single headline number, lower is better |
| **Before/after isotonic** | raw model scores vs calibrated — shows the fix was necessary |
| Per-class ECE | some classes calibrate better than others; say which |

**Framing:** *"When we say 0.87, it's right about 87% of the time. In an enclave where the analyst can't verify anything independently, that's the difference between a usable system and a random number generator with good UI."*

---

## Report Card 7 — Adversarial evasion break-even points ★

We attack ourselves and publish where we break. **No other team will do this.**

| Evasion | Detector | Sweep | We report |
|---|---|---|---|
| Beacon jitter | b | 0 → 70 % | F1 vs jitter curve; break-even jitter % |
| Long-sleep beacon | b | 60 s → 24 h interval | minimum observation window vs detection |
| DoH / DoT | c | on/off | name visibility lost; DoH-usage detection as fallback |
| DGA family held out | c | unseen families | generalisation gap |
| TLS record padding | d | 0 → 512 B random pad | F1 vs padding entropy |
| JA4 mimicry (uTLS) | d | malware impersonating Chrome | fingerprint channel defeated; rhythm channel residual |
| Scan rate | e | 1/s → 1/300 s | detection latency vs rate; where we stop detecting |
| Distributed scan | e | 1 → 50 source IPs | per-IP fails, /24-aggregate holds |
| Exfil chunking | f | 1 flow → 500 flows | per-host aggregation threshold |
| Exfil slow drip | f | 1 h → 7 days | baseline window sensitivity |
| Exfil over QUIC | f | — | **declared gap: ACK-Shadow is TCP-only** |

**The slide:** a single table of "attack → where we break." A judge reading it concludes we understand the domain. A team claiming no weaknesses reads as naive.

---

## Harness design

```
eval/
├── run_matrix.py          # cartesian: {scenario} × {BI,FWD,REV,FLOW} × {model version}
├── metrics.py             # P/R/F1, PR-AUC, P@k, ECE, latency percentiles
├── ack_shadow_validate.py # Report Card 4
├── perf_bench.py          # throughput ramp, burst test, memory tracking
├── evasion_sweep.py       # Report Card 7 parameter sweeps
├── naive_baseline/        # hashmap detector, built only to produce the memory chart
└── report/                # auto-generated markdown + charts → straight into the deck
```

**Rules:**
1. Every number in the PPT is produced by this harness. No hand-typed figures.
2. Reruns are deterministic — fixed seeds, fixed eviction order, byte-identical ledger.
3. The harness emits the markdown tables directly, so the deck cannot drift from reality.
4. Every result carries the hardware spec and the model SHA-256 that produced it.

---

## Comparison baselines

Nothing is meaningful without something to beat. Run these on the same data:

| Baseline | Why include it |
|---|---|
| **Suricata** (default ruleset) | The signature-based status quo. Expect it to catch scans and miss beaconing. |
| **Zeek + basic scripts** | Passive-monitoring status quo; also our parser validation oracle. |
| **CICFlowMeter + Random Forest on CIC-IDS2017** | **This is what the other 200 teams are building.** Run it on our unidirectional twins and show it collapse. |
| **Naive hashmap detector** | Produces the memory chart. |
| EKADHARA | Ours. |

> The single most devastating slide available to us: *"Here is the standard approach — CICFlowMeter + Random Forest on CIC-IDS2017, which is what most solutions to this PS will look like. On full-duplex data it scores F1 = 0.9x. On the diode capture NTRO actually described, it scores F1 = 0.4x, and it never tells you it has failed."*
>
> Run this. Get the real numbers. Do not overstate them — the true numbers will be persuasive enough, and if they are not, report them anyway.

---

## Anti-fabrication rules

Adopt these formally; they are what separate a defensible submission from an embarrassing one.

1. **No number appears anywhere without the harness run that produced it.**
2. **No metric is reported on data the model was trained or calibrated on.**
3. **Report the external-corpus drop.** A model that generalises perfectly to CTU-13 is a model with a leak.
4. **Report drop rates alongside every throughput claim.**
5. **Never conflate window latency with processing latency.**
6. **Never report accuracy as a headline.** Precision at a budget, or PR-AUC.
7. **If a detector fails under a configuration, the matrix shows the failure.** Zero silent failures is the claim; hiding one forfeits it.
