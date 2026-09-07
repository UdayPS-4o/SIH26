# Risks and Rebuttals — every hostile question, pre-answered

Two sections: **judge Q&A** (what to say) and **project risks** (what could actually sink us).

---

# Part A — Judge Q&A

Rehearse these out loud. The goal is a confident 20-second answer, not a lecture.

---

### Q1. "How is this different from Suricata / Snort / any IDS?"

> Suricata is signature-based and needs rule updates from the internet — which an air-gapped enclave cannot receive. It also detects *known* patterns; beaconing, DGA campaigns and slow exfiltration have no signature. We're behaviour-based, fully offline, and we run Suricata as one of our comparison baselines. On our test corpus it catches scans and misses beaconing entirely — that comparison is in the deck.

---

### Q2. "Isn't this just CICFlowMeter plus XGBoost like everyone else?"

> We deliberately don't use CICFlowMeter. Its feature set is bidirectional to its bones — under the diode capture this PS describes, roughly half its features silently become zero and the model keeps emitting confident scores. We wrote our own directionality-aware extractor where every feature carries a validity flag: observed, inferred, or missing. That's the core architectural difference.

---

### Q3. "How can you possibly compute an inbound-to-outbound ratio if you can't see inbound?"

*(Pull up backup slide B1 — FIG-4.)*

> TCP is a delivery-confirmation protocol. Every client packet carries an acknowledgement number meaning "I've received everything up to byte N." If we watch that number climb from 1,000 to 5,001,000, we know the server sent about 5 megabytes — even though we never saw one of those packets. We call it ACK-Shadow. We validate it against the bidirectional twin and report the error distribution: accurate within a few percent on medium and large flows, coarse on very short ones, and not applicable to QUIC — which we state as a gap.

---

### Q4. "What's your accuracy?"

> Per-class F1 is on the slide, but accuracy is the wrong question at a one-in-ten-thousand base rate — a 99.9% accurate detector still generates a hundred false alerts a second at line rate. The number that matters is precision at the analyst's alert budget: of the top 50 alerts we surface per hour, X% are true. Here's the curve.

---

### Q5. "How do we know it's really read-only? Everyone says that."

*(Pull up B2 — FIG-9.)*

> Four layers, and we'll demonstrate it. The container runs with `--network none`. The kernel has a seccomp profile denying `connect`, `sendto` and `sendmsg`. The capture socket has no transmit ring bound. And there is no HTTP client library compiled into the binary at all. We ship a `--self-test-egress` flag that deliberately attempts a callback so you can watch the kernel kill the process. Others promise read-only; we let the kernel enforce it.

---

### Q6. "The theme is Blockchain & Cybersecurity. Where's the blockchain?"

*(Pull up B3 — FIG-7.)*

> We didn't bolt one on. The PS background says the diode "preserves a clean chain of custody for forensic use" — so we used the primitive that actually delivers that: a Merkle hash chain over the alert ledger. Every alert is a leaf, every root commits to all history, and any later edit or deletion is detectable. A distributed ledger would be the wrong tool in a single air-gapped enclave — there are no mutually distrusting parties to reach consensus among. We used the cryptography, not the buzzword.

---

### Q7. "Will this work at 10 Gbps? 40?"

> We publish a measured sustained rate on stated hardware with the packet drop rate alongside it, because a throughput claim without a drop rate is meaningless. Our memory is constant regardless of rate — we use Count-Min Sketch and HyperLogLog rather than hash maps, so a spoofed-source flood can't exhaust us. For higher rates we shard by 5-tuple hash across workers, and the same seam extends across nodes. We've designed for it and documented it; we haven't built multi-node, and we won't claim we have.

---

### Q8. "What if the attacker knows your detection method?"

*(Pull up B5 — evasion table.)*

> We assume they do. We ran an evasion suite against ourselves and published break-even points: at what jitter percentage our beacon detector fails, at what padding entropy the TLS rhythm signal dies, at what scan rate we stop detecting. DNS-over-HTTPS defeats our name-based DGA detection entirely — so we fall back to detecting the use of an unsanctioned DoH resolver, which in a critical-infrastructure enclave is itself a policy violation. We'd rather show you where we break than claim we don't.

---

### Q9. "Your dataset is synthetic. Doesn't that invalidate your results?"

> Two answers. First, NTRO's own dataset note in the problem statement directs us to lab-generated traffic — `hping3`, `Slowloris`, `iodine`, `dnscat2`, DGArchive. Second, synthetic generation is the *only* way to get the paired full-duplex and diode-capture variants this evaluation requires, with exact packet-level labels. Public corpora can't do that. We also validate on real malware traffic — CTU-13 and malware-traffic-analysis.net — and we report the performance drop on external data rather than hiding it. A model that generalises perfectly to unseen real traffic is a model with a leak.

---

### Q10. "Why six models instead of one? Isn't that more complex?"

> DDoS is a rate phenomenon over seconds. Beaconing is a periodicity phenomenon over hours. DGA is a string phenomenon on a single query. They live at different time scales in different feature spaces. One model cannot be right about all three, and a monolithic classifier can't tell you *why* it fired — which the PS requires as supporting evidence. Six specialists plus a fusion layer is more code and better engineering.

---

### Q11. "What happens when your model is wrong? The analyst can't verify anything."

> That's exactly why we calibrate. Raw model scores are miscalibrated — a "0.9" might be right 60% of the time. We fit isotonic regression on a held-out split and publish a reliability diagram and Expected Calibration Error. When we say 0.87, it's right about 87% of the time. In an enclave where the analyst has no independent way to check, the confidence number *is* their triage tool. If it lies, the system is worse than useless.

---

### Q12. "Can this actually be deployed, or is it a hackathon demo?"

*(Pull up B7 — licence register.)*

> Single OCI image, runs with `--network none`, no external dependencies, SBOM shipped in the image, reproducible build with a pinned toolchain. Alerts emit as OCSF, so it plugs into any modern SIEM without an adapter. We've also done the licence analysis: core JA4 is BSD-3-Clause and that's what ships by default; the JA4+ extensions are FoxIO Licence 1.1, which permits government internal use but restricts monetisation, so they sit behind a build flag. We'd rather tell you that now than have procurement find it later.

---

### Q13. "What's the one thing that would make you fail?"

*Answer honestly; a rehearsed non-answer here is worse than the truth.*

> Encrypted-malware detection under true one-way capture. We lose the server fingerprint — JA4S — and there's no arithmetic trick to recover it the way ACK-Shadow recovers byte volume. We fall back to client-side JA4 plus the packet-timing rhythm, and our recall drops measurably. It's the worst row in our degradation matrix and we put it on the slide rather than hiding it, because a system that hides one failure mode can't credibly claim it has none of the others.

---

### Q14. "Why Rust? Why not Python like everyone else?"

> Because we make a latency claim. In Python, a p99 latency graph measures the garbage collector and the GIL, not your design. Rust gives deterministic latency and memory safety, which matters when you're parsing bytes an attacker controls. We train models in Python — that's the right tool — then export to ONNX and run inference inside the Rust pipeline so there's no Python in the hot path.

---

### Q15. "This looks like a lot for one hackathon. What's actually built?"

*Be precise about the current state; never inflate. Adjust to reality on the day.*

> Built and measured: [X]. In progress: [Y]. Designed and documented but not implemented: [Z] — and it's marked as such in the repository. Everything on this deck that has a number attached was produced by our evaluation harness; you can re-run it and get the same numbers, because replay is deterministic.

---

# Part B — Project risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Data generation eats the whole timeline** | High | Critical | Build the testbed in week 1, before any modelling. Six pilot scenarios first, full 40-scenario sweep runs unattended overnight. Twin generation is a 40-line script — do it day one. |
| R2 | **Rust pipeline is too slow to write from scratch** | Medium | High | Fallback: Zeek for L7 parsing + Rust only for the hot flow path. Second fallback: Python pipeline for correctness, and report throughput honestly as a Python number with the Rust port as future work. **Never fake the throughput figure.** |
| R3 | **ACK-Shadow doesn't work as well as hoped** | Medium | High | It's arithmetic, not ML, so it either works or has a characterisable error. Even a mediocre result is publishable *because we measured it* — the degradation matrix stays valuable either way. Measure it in week 2, before it becomes a slide. |
| R4 | **Six detectors is too many to finish** | Medium | Medium | Priority order: (e) scan → (a) DDoS → (b) beaconing → (c) DGA/DNS → (f) exfil → (d) encrypted. Scan and DDoS are quick wins; beaconing and exfil carry the innovation story. Ship five well rather than six badly, and say which is unimplemented. |
| R5 | **Dashboard consumes disproportionate time** | High | Medium | The demo needs exactly four things: live alert feed, throughput/latency HUD, **diode-mode toggle**, evidence drill-down. Everything else is decoration. Timebox it. |
| R6 | **Calibration/SHAP/Merkle feel like scope creep** | Medium | Low | Each is genuinely small — isotonic is ~20 lines of sklearn, TreeSHAP is a library call, Merkle is a rolling hash. High talk-value per line of code. Keep them. |
| R7 | **Judges don't understand why unidirectionality matters** | Medium | Critical | FIG-3 exists solely to make it visual in 10 seconds. The diode-toggle demo makes it visceral. Lead with it on slide 1, don't bury it. |
| R8 | **Someone else has the same idea** | Low | Medium | Even if a team notices the ambiguity, they are unlikely to also build ACK-Shadow, the twin corpus, and the degradation matrix. Depth is the moat, not the observation. |
| R9 | **Live demo fails on stage** | Medium | High | Everything runs from a local PCAP replay in one container with no network. Pre-record a backup video. Rehearse the exact command sequence. Never demo from the internet. |
| R10 | **Overclaiming gets caught in Q&A** | Low | Critical | Adopt the anti-fabrication rules in [`evaluation-protocol.md`](evaluation-protocol.md). Every number traceable to a harness run. If a judge finds one invented figure, the whole deck loses credibility. |
| R11 | **JA4+ licence becomes a deployment blocker** | Low | Low | Ship BSD-licensed core JA4 by default; JA4+ behind a build flag. Documented in the licence register. Already handled. |
| R12 | **Team lacks networking depth** | Medium | High | [`domain-brief.md`](domain-brief.md) is the onboarding doc. Assign one person to own TCP internals (ACK-Shadow depends on it) and have them explain the handshake to the rest of the team before week 2 — teaching it is the test of understanding. |

---

## The three rules that keep us honest

1. **Every number in the deck comes from the harness.** No exceptions, no hand-typed figures.
2. **Every measured weakness goes on a slide.** Hiding one forfeits the "zero silent failures" claim that is our entire thesis.
3. **Never claim a capability we haven't run.** "Designed, not yet implemented" is a perfectly respectable thing to say to a judge. "It works" when it doesn't is not recoverable.
