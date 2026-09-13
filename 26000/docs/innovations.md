# Innovations — Why We Win

> This document exists to answer one question a judge will ask: **"200 teams picked this PS. Why you?"**
>
> Every item below is (a) something almost no other team will do, (b) buildable inside our timeline, and (c) explainable to a judge in under 30 seconds.

---

## The core insight nobody else will have

Read the PS carefully and it **contradicts itself**.

- Constraint: the enclave is fed by a **data diode** — one direction only.
- Requirement (f): detect *"unusual outbound-to-inbound byte ratios."*
- Requirement (d): use *"JA3/JA3S"* fingerprints — `JA3S` is the **server** hello.

You cannot compute an inbound:outbound ratio or fingerprint a server hello if you never see the server's packets.

So "unidirectional" is being used in two different senses in the same document:

| | Sense | Consequence |
|---|---|---|
| **D1** | *No return path for the monitoring system.* Full-duplex traffic visible, but the enclave can't transmit. | Classic passive NDR. Moderate difficulty. |
| **D2** | *Single-direction capture.* Only one half of every conversation is copied across the diode. | Half of all standard flow features are gone or biased. Brutal. |

**Every other team will silently build for D1 and evaluate on D1, using tooling (CICFlowMeter → CIC-IDS2017 → XGBoost) that is bidirectional to its bones. Their solution will not survive D2, and they will not know.**

We build for **both**, we **measure the gap**, and we **close it**. That is the spine of the entire submission and the source of innovations 1 and 2.

---

## 1. Diode-Twin Evaluation ★ flagship

**What:** Every capture in our corpus exists as a *triplet* — the full-duplex original, and two derived half-duplex twins (forward-only, reverse-only). Every detector is scored on all three. We publish a **degradation matrix**.

|  | Bi-directional | FWD-only | REV-only |
|---|---|---|---|
| DDoS | F1 = *x* | F1 = *x'* | ... |
| Beaconing | ... | ... | ... |
| DGA / DNS | ... | ... | ... |
| Encrypted malware | ... | ... | ... |
| Scanning | ... | ... | ... |
| Exfiltration | ... | ... | ... |

**Why it wins:** Quantifying your own failure mode reads as scientific maturity, and here it *is the problem statement*. It also turns into the single best demo moment we have (the diode-mode toggle — see [`DEMO_GUIDE.md`](DEMO_GUIDE.md)).

**Judge one-liner:** *"We are the only team that can tell you what our system loses when the diode is real — because we measured it."*

**Cost to build:** Low. It's a capture post-filter (`tcpdump -r full.pcap 'src net 10.0.0.0/8' -w fwd.pcap`) plus a third axis on the eval harness. High payoff per rupee of effort.

---

## 2. ACK-Shadow Reconstruction ★ flagship

**The problem:** Under D2 we see only client→server packets. Threat (f) needs server→client volume. It appears impossible.

**The trick:** TCP is a delivery-confirmation protocol. Every client packet carries an **acknowledgement number** meaning *"I have now received everything up to byte N from you."*

So if we watch the client's ACK number climb from `1,000` to `5,001,000` across a conversation, we know **the server sent ≈ 5 MB** — despite never seeing a single one of those packets.

```
   observed direction (client → server)        UNSEEN direction (server → client)
   ┌──────────────────────────────┐            ┌────────────────────────────┐
   │ seq=1000  ack=1        len=80│            │                            │
   │ seq=1080  ack=1461     len=0 │   ◄────────│  1460 bytes we never saw   │
   │ seq=1080  ack=5001000  len=0 │   ◄────────│  ~5 MB we never saw        │
   └──────────────────────────────┘            └────────────────────────────┘
              ▲
              └── reverse-channel volume = Δ(ack) over the flow  (modulo wraparound)
```

**Implementation notes:**
- Track `max_ack_seen − initial_ack` per flow; handle 32-bit sequence wraparound with a wrap counter.
- Duplicate ACKs indicate loss/retransmission → correct the estimate.
- **Bonus:** ACK arrival *timing* relative to our observed data packets yields a coarse RTT proxy, which we thought we'd lost entirely.
- Also gives a **reverse-direction packet-count estimate** via ACK-advance granularity (Δack / observed MSS).

**Also resurrects:** asymmetric-volume anomalies in general, and partial encrypted-session behavioural modelling (we recover *how much* the server sent even if not *what*).

**Judge one-liner:** *"The PS asks for an inbound:outbound ratio on a link where you can't see inbound. We compute it anyway, from ACK arithmetic."*

**Limitation we state openly:** works for TCP only. QUIC/UDP exfiltration under D2 remains partially observable — we report that honestly in the degradation matrix rather than hiding it. *(Stating a limitation you've measured beats claiming a capability you haven't.)*

---

## 3. Egress Lockdown — provable read-only

**What:** Constraint (a) says "read-only ingest." Every team will assert this in a slide. We make it **structurally impossible to violate**:

| Layer | Enforcement |
|---|---|
| Container | `docker run --network none` — no interface exists except loopback + the capture device |
| Kernel | **seccomp-bpf profile** denying `connect`, `sendto`, `sendmsg`, `sendmmsg` for the analysis process |
| Capture socket | `AF_PACKET` opened with `PACKET_IGNORE_OUTGOING`; no `TX_RING` bound |
| Build | Dependency audit + `cargo-deny`; no HTTP client crate compiled in at all |
| Runtime proof | A `--self-test-egress` flag that *attempts* a callback and shows the kernel killing it |

**Why it wins:** it converts a claim into a demonstration. On stage we run the self-test, the process gets `EPERM`/`SIGSYS`, and the audit log records the attempt. Judges from NTRO care about *assurance*, not features.

**Judge one-liner:** *"Others promise read-only. We let the kernel enforce it, and we'll prove it on stage right now."*

---

## 4. Zero-Egress Enrichment Fabric

**The gap:** Detection quality collapses without enrichment, and the enclave forbids lookups. Everyone will either ignore this or ship a stale `blocklist.csv`.

**Our answer — build the intelligence *inside* the enclave, from what we already see:**

| Enrichment | Normally | In EKADHARA |
|---|---|---|
| IP → domain | Reverse-DNS query | **Self-built passive DNS**: we observe DNS *responses* crossing the link and index them. Historical resolution, zero queries. |
| IP → ASN / org / prefix | WHOIS or API | **Offline BGP**: RouteViews / RIPE RIS MRT dumps loaded at build time into a prefix trie |
| TLS fingerprint → software | Vendor cloud lookup | **Bundled JA4/JA3 fingerprint DB** shipped in the image |
| Domain → reputation | Threat-intel API | **Passively-derived features**: first-seen age, NXDOMAIN ratio, resolution churn, TTL anomalies — all computable from observed DNS alone |
| Asset criticality | CMDB query | Operator-supplied static asset manifest mounted read-only at start |

**The concept name matters.** "Zero-Egress Enrichment Fabric" is a phrase a judge repeats in the deliberation room. That is worth marks.

**Bonus insight:** *first-seen age* from self-built passive DNS is a genuinely strong DGA signal — a domain no one in this network has ever resolved before, that resolves once and never again, is textbook DGA behaviour. And it costs zero lookups.

---

## 5. Constant-Memory Streaming (sketch-based)

**The gap:** Constraint (c) says streaming; constraint (d) demands a stated throughput. Teams will use Python dicts keyed by source IP, which grows without bound under a spoofed-source flood — **the very attack they're detecting will OOM their detector.** That is a delicious failure and we should say so.

**Our answer:** probabilistic sketches with fixed memory:

| Need | Structure | Memory |
|---|---|---|
| Source-IP entropy under flood | **Count-Min Sketch** | fixed (e.g. 4 × 2^16 counters) |
| Distinct-destination fan-out per source | **HyperLogLog** | ~1.5 KB/source, ~1% error |
| Distinct-port cardinality | **HyperLogLog** | same |
| Latency / size percentiles | **t-digest** | fixed |
| Top-talkers | **Space-Saving (heavy hitters)** | fixed |
| Beacon IAT distribution | fixed-bin **streaming histogram** | fixed |

**What we publish:** sustained flows/sec, sustained Mbps, **p50 / p95 / p99 alert latency**, and resident memory *flat* across a 10× traffic burst. A flat memory graph under attack is a slide by itself.

**Judge one-liner:** *"Our memory is constant whether we're seeing 1,000 flows a second or a million. Most detectors get DoS'd by the DDoS they're detecting."*

---

## 6. Alert-Budget Precision (P@k) — an evaluation reform

**The gap:** 200 teams will report "99.x% accuracy." At a 99.9% benign base rate and 100k flows/sec, a 0.1% false-positive rate = **100 false alerts per second**. Unusable. Accuracy is not just uninformative here, it is *actively misleading*.

**Our answer:** report **precision at a fixed alert budget** — "of the top 50 alerts we surface per hour, how many are true?" — plus a full precision@k curve, plus alerts-per-analyst-hour at each threshold.

We still report P/R/F1 for comparability, but we lead with P@k and explain why.

**Judge one-liner:** *"Accuracy is the wrong metric for a 1-in-100,000 event. We report precision at the analyst's real capacity — 50 alerts an hour — because that's the number a SOC lead actually has to live with."*

This is a **posture** differentiator: it signals we think like operators, not students.

---

## 7. Calibrated Confidence (they asked for it; nobody validates it)

The PS explicitly requires a **confidence score** in every alert. Every team will pipe a raw model output into that field. Raw GBM/softmax scores are notoriously miscalibrated — a "0.9" may be right 60% of the time.

**Our answer:** isotonic regression (or Platt scaling) fitted on a held-out set, then *validated*:
- **Reliability diagram** — predicted confidence vs observed frequency
- **Expected Calibration Error (ECE)** reported as a headline number
- Alert UI shows a calibrated band ("0.87 → historically correct 86% of the time")

**Why it matters operationally:** in an enclave the analyst cannot verify anything independently. The confidence number *is* their triage tool. If it lies, the system is worse than useless.

**Judge one-liner:** *"They asked for a confidence score. We're the only team that can prove ours means what it says."*

---

## 8. Merkle Custody Chain — forensic admissibility

The PS background mentions the diode *"preserves a clean chain of custody for forensic use."* Every team will skip this sentence.

**Our answer:** the alert stream is an **append-only, tamper-evident ledger**:

```
alert_n = { ts, flow_id, class, confidence, evidence_hash, features, shap }
leaf_n  = SHA-256(canonical_json(alert_n))
root_n  = SHA-256(root_{n-1} || leaf_n)      ← rolling chain
```

- `evidence_hash` = SHA-256 over the exact packet/flow byte range in the source capture
- Periodic checkpoint roots written to WORM storage
- `verify` command re-walks the chain and reports the first divergence
- Any edit, deletion, or reordering of a past alert is detectable

**Why it wins twice:**
1. It satisfies a stated background requirement no one else read.
2. It is the **only legitimate use of the "Blockchain & Cybersecurity" theme** in this PS — a hash-linked ledger, not a pointless Ethereum contract. Judges notice teams that bolt on a blockchain for theme points; they notice more when you use the underlying primitive correctly and say *why you didn't use a blockchain*.

**Judge one-liner:** *"The theme is blockchain. We didn't bolt one on — we used the primitive that actually matters, a hash-linked custody chain, so no alert can be quietly altered after the fact."*

---

## 9. Kill-Chain Fusion — incidents, not alert confetti

**The gap:** Six detectors firing independently produce six unrelated alerts. An analyst with no ability to investigate cannot stitch them together.

**Our answer:** a correlation layer that groups alerts by shared entity (host, subnet, destination, JA4 fingerprint) and time window, then maps them onto attack-chain stages:

```
  RECON            →  DELIVERY/C2      →  ACTIONS ON OBJECTIVES
  port scan (e)       beaconing (b)       exfiltration (f)
  from 10.2.4.9       from 10.2.4.9       from 10.2.4.9
        └─────────────────┴──────────────────────┘
                          ▼
        INCIDENT #42 — severity ESCALATED to CRITICAL
        "Host 10.2.4.9: reconnaissance → C2 established → data egress
         over 3h12m. 3 detectors concur. Confidence 0.94."
```

Severity becomes `f(calibrated_confidence, asset_criticality, chain_stage, blast_radius)` — not a static per-class constant.

**Why it wins:** it is the difference between a *detector* and a *system*. It also makes the dashboard look genuinely operational rather than like a log viewer with colours.

---

## 10. UniFlow-IN — we release a dataset

Because NTRO's own dataset note tells us to generate lab traffic, we will have built a labelled corpus with **packet-level ground truth** and **paired bidirectional/unidirectional variants**.

Nothing like that exists publicly. CIC-IDS2017 is bidirectional-only and has documented label errors and flow-generator bugs; CTU-13 is real but unpaired.

**We publish it** (with generation scripts, so it's reproducible and extensible) as an explicit deliverable.

**Judge one-liner:** *"Beyond the prototype, we're leaving behind the first labelled dataset with paired full-duplex and diode-capture variants — so the next team to work on this doesn't start from zero."*

A dataset is a durable artefact. It signals research contribution, not just a hackathon build.

---

## Bonus differentiators (cheap, high signal)

### 11. Adversarial Evasion Suite — we attack ourselves
Publish the **break-even point** for each detector:

| Evasion | Detector attacked | We report |
|---|---|---|
| Beacon jitter 0 → 60% | Beaconing | F1 vs jitter % curve; where we break |
| DoH / DoT tunnelling | DGA/DNS | We lose name visibility → fall back to TLS-metadata detection of DoH itself |
| TLS record padding | Encrypted malware | Size-sequence F1 vs padding entropy |
| Slow scan (1 port / 90 s) | Scanning | Detection latency vs scan rate; window-size tradeoff |
| Exfil via many small flows | Exfiltration | Aggregation window sensitivity |
| Domain fronting | Encrypted malware | Acknowledged gap; SNI-vs-cert mismatch heuristic |

Showing where you break, with numbers, is the single fastest way to look like professionals rather than undergraduates. Every other team will claim no weaknesses.

### 12. Zeek as a validation oracle
We write our own fast Rust parsers for throughput — but we cross-check their output against **Zeek** on the same PCAP and report field-level agreement. That is how you claim correctness without hand-waving.

### 13. Replay determinism
Same PCAP in → byte-identical alert ledger out, every time. Fixed random seeds, deterministic flow eviction order. Essential for forensics and for judges who want to re-run our results.

### 14. Licence hygiene (an NTRO-specific signal)
Core **JA4** (TLS client) is BSD-3-Clause. **JA4S / JA4H / JA4X / JA4T / JA4L / JA4SSH** are FoxIO Licence 1.1 — permissive for internal/government use, **not** for monetisation, and patent-pending. We document this in the architecture doc and default to BSD-licensed JA4 in the shipped build.

Volunteering a licence analysis nobody asked for is a strong maturity signal to a government agency that will actually have to deploy this.

---

## The "why others won't do this" summary table

*(This table belongs on a PPT slide almost verbatim.)*

| What we do | What everyone else does | Why they won't do ours |
|---|---|---|
| Evaluate on true half-duplex twins | Evaluate on bidirectional CIC-IDS2017 | They never noticed the ambiguity |
| Recover reverse volume from ACK arithmetic | Report zeros for reverse-direction features | Requires understanding TCP internals, not just sklearn |
| Kernel-enforced egress lockdown | A bullet point saying "read-only" | Requires seccomp/netns work with no visible "feature" payoff |
| Passive DNS + offline BGP enrichment | A stale CSV blocklist, or nothing | Requires accepting that the enclave has no internet and designing around it |
| Constant-memory sketches | Python dicts | Sketches are unfamiliar; dicts "work" on a 200 MB PCAP |
| P@50/hr + calibration + ECE | "99.7% accuracy" | Their metric looks better |
| Merkle custody chain | Nothing | They skipped the background paragraph |
| Kill-chain incident fusion | Six independent alert streams | Harder, and only obvious to someone who's thought about the analyst |
| Published evasion break-even points | "Our system is robust" | Admitting weakness feels risky — it isn't, it's the opposite |
| Released paired dataset | Consumed a public one | They didn't need to build a testbed |

---

## Ranking for the 5-slide PPT

If we can only fit six, use these — they are the most explainable and the most visual:

1. **Diode-Twin Evaluation** (the degradation matrix is a slide-ready visual)
2. **ACK-Shadow Reconstruction** (the diagram sells itself)
3. **Egress Lockdown** (the live proof is memorable)
4. **Constant-Memory Streaming** (flat-memory-under-burst graph)
5. **Merkle Custody Chain** (legitimises the theme)
6. **P@k + Calibration** (posture: "we think like operators")

Keep Zero-Egress Enrichment, Kill-Chain Fusion, the Evasion Suite and the dataset in the appendix and in the **spoken answer to the first Q&A question**. Judges reward depth held in reserve.
