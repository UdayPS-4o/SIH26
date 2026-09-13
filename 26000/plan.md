# EKADHARA — Master Plan

**SIH26145 · AI-Based Detection of Cyber Threats in Unidirectional IP Traffic · NTRO**

> **एकधारा (Ekadhara)** — "single stream."
> **See everything. Touch nothing.**

**This is the single authoritative plan.** It absorbs the earlier v1 plan and the v2 self-critique. Where any other doc disagrees with this one, this one wins.

---

# PART 1 — WHAT THEY WANT (in plain English)

## The situation

A power grid — or a defence network, or a telecom core — has a wall around it. To watch for attacks, the operator makes a **photocopy of all network traffic** and pipes it into a sealed room next door.

The copier only works one way. There is **no door** from the sealed room back into the network.

```
   THE PROTECTED NETWORK                 THE SEALED ROOM
   ┌──────────────────────┐             ┌──────────────────┐
   │  power grid /        │ ──────────► │  our software    │
   │  defence network     │  photocopy  │  lives here      │
   │                      │      ✗      │                  │
   └──────────────────────┘  no way back└──────────────────┘
```

Why no door? Because if a hacker breaks into the sealed room, there's nowhere for them to go. The room is a dead end. That's the entire point of the design.

**Our job:** sit in that room, watch the photocopy, and work out who's attacking — using only what we can see.

## Why this breaks everything you could buy

Every commercial network-detection product (Darktrace, ExtraHop, Vectra, Corelight) cheats constantly. It sees a suspicious IP and *looks it up*. It sees an odd program and *asks an agent on that machine*. It sees an unknown domain and *queries a threat database*.

In this room, **none of that resolves**. No internet. No agents. No lookups. Ever.

Everything we know, we have to derive from the traffic itself. That is the real ask hiding behind the problem statement.

## Three things make it hard

**1. We can't ask questions.** No probes, no handshakes, no lookups, no mitigation commands. Read-only, absolutely.

**2. Everything is encrypted.** ~90% of traffic is scrambled, and the PS forbids decrypting it anyway. But we can still see message sizes, timing, frequency and destinations — like a postal inspector weighing envelopes without opening them. **Behaviour leaks even when content doesn't.**

**3. We may only see half of every conversation.** ← the one that decides this competition. More on this in Part 2.

## The six threats they want detected

| PS | Threat | What it looks like, plainly |
|---|---|---|
| **a** | **Volumetric / protocol DDoS** | Ten thousand people phoning your shop at once so real customers can't get through. *SYN flood* = starting a handshake and never finishing it. *Reflection* = forging your return address so a big server dumps a huge reply on the victim. **Tell:** rate explodes and the sender addresses look randomly generated. |
| **b** | **Botnet C2 beaconing** | An infected machine "phoning home" to the attacker on a schedule — like an employee stepping outside to check their phone every 60 seconds, exactly. **Tell:** regularity. Good malware adds random wobble ("jitter") to hide it. |
| **c** | **DGA domains + DNS tunnelling** | *DGA* = malware inventing thousands of throwaway domain names (`xkfjqwmz.com`) so you can't blocklist one. **Tell:** the names look like keyboard-mashing. *DNS tunnelling* = smuggling stolen data inside DNS queries, because firewalls always allow DNS out. |
| **d** | **Malware inside encryption** | We can't read the contents, so we fingerprint *how the conversation opens*. Chrome's TLS hello differs from Firefox's, from a Python script's, from a specific malware family's. That fingerprint is **JA3/JA4**. |
| **e** | **Recon / port scanning** | An attacker rattling every doorknob to find one unlocked. One machine touching hundreds of others or hundreds of ports. Called **fan-out**. Easiest to catch. |
| **f** | **Data exfiltration** | Stealing data out. Normally you download far more than you upload. A machine suddenly uploading gigabytes is the tell. |

## The five rules they impose

| Rule | Meaning |
|---|---|
| **(a) Read-only ingest** | Never transmit. No probes, no blocking, no return path. Any design assuming one is out of scope. |
| **(b) No payload decryption** | TLS/QUIC analysed from metadata only. |
| **(c) Streaming, not batch** | Decide *as traffic arrives*, with bounded latency — a live ticker, not an end-of-run report. |
| **(d) Stated throughput** | Say what rate you tested at, and demonstrate it. |
| **(e) Standard alert schema** | Structured records: timestamp, flow ID, threat class, confidence, **supporting evidence**. |

> Rule (e)'s "supporting evidence" is an **explainability requirement in disguise**. In this room the analyst can't investigate anything independently — the alert is all they get, so it must carry its own proof.

---

# PART 2 — THE TRAP (why most submissions will fail)

## The contradiction

Read the PS carefully and it contradicts itself.

- It specifies a **data diode** — one direction only.
- Requirement **(f)** asks for *"outbound-to-inbound byte ratios."*
- Requirement **(d)** asks for *"JA3/JA3S"* — and **JA3S is the *server* hello.**

You cannot compute an inbound:outbound ratio, or fingerprint a server's hello, if you never see the server's packets.

So "unidirectional" is being used in two senses in one document:

| | Meaning | Difficulty |
|---|---|---|
| **D1** | *No return path for the monitor.* Both directions visible; we just can't transmit. | Moderate |
| **D2** | *Single-direction capture.* Only one half of every conversation is copied. | Brutal |

## Why this kills the standard recipe

~200 teams will follow the same recipe: public dataset **CIC-IDS2017** → the tool **CICFlowMeter** (which produces ~80 numbers per conversation) → a tree-ensemble model → "99% accuracy" → a Streamlit dashboard.

A large fraction of those 80 numbers describe **the direction we can't see**: `bwd_packet_count`, `bwd_byte_rate`, `down_up_ratio`, RTT.

Under D2 they all become **zero**. The model doesn't crash. It doesn't warn. It uses zeros as if they were measurements and keeps printing confident answers.

> **It fails silently.** That's the worst way software can fail — and nobody in the competition will notice it happening to them.

**This is the spine of our entire submission.**

## Two housekeeping moves

1. **Ask the NTRO mentor which reading they meant.** SIH gives you mentor access. Every possible answer helps us:
   - *"Both directions"* → we present one-way handling as a **robustness property** (asymmetric routing and partial mirroring genuinely do drop direction in the field). Still unique.
   - *"One direction"* → the PS owner just confirmed our thesis. Devastating.
   - *"It depends on the deployment"* → best of all; we're the team that surfaced the ambiguity, and we quote them on the slide.

2. **The PS says "simulated IP data."** NTRO expects synthetic traffic and may hand us their own PCAP. So **"point it at any PCAP and it works" is a hard requirement.**

---

# PART 3 — WHAT WE'RE BUILDING (in plain English)

## The pipeline, end to end

```
 ①  A one-way copy of traffic arrives — from a file, a live feed, or flow summaries
            ↓
 ②  We group packets into "conversations" and tag each:
       "saw both directions"  /  "saw only one"
            ↓
 ③  We turn each conversation into numbers — rate, timing, sizes, rhythm, names.
       Where a number needs the missing direction, ACK-SHADOW fills it in.
       Every number is labelled  MEASURED / ESTIMATED / MISSING.
            ↓
 ④  Six specialist detectors, each hunting one threat
            ↓
 ⑤  We combine results, work out how confident we really are,
       and link related detections into one story
            ↓
 ⑥  Each alert gets its evidence attached — which numbers caused it,
       a fingerprint of the exact bytes, and a tamper-proof seal
            ↓
 ⑦  It appears on a dashboard for a human to act on
```

Everything above runs **inside a container with networking switched off**.

## Why six specialists instead of one big model

Because the threats are different shapes at different time scales:

| Threat | Shape | Time scale |
|---|---|---|
| Flood | volume explodes | seconds |
| Beaconing | too-regular timing | hours |
| DGA | keyboard-mashing text | one message |
| Encrypted malware | distinctive handshake + rhythm | one conversation |
| Scanning | one machine touching hundreds | minutes |
| Exfiltration | uploading more than usual | hours to days |

One model that tries to catch all six is mediocre at all six — and worse, **it can't tell you why it fired.** Rule (e) demands that it can. Six specialists can.

---

# PART 4 — THE INNOVATIONS

## ★ Innovation 1 — Diode-Twin Evaluation

**Plainly:** we record every lab attack **twice** — once with both directions, once with one direction deleted. Same traffic, same labels. Then we run our system on both and publish exactly how much worse we get.

**Why it wins:** nobody else can produce that table, because nobody else made the recording twice. Measuring your own weakness with real numbers reads as serious engineering. And it gives us the best moment in the demo: a **toggle switch** that deletes one direction live on screen.

**Judge one-liner:** *"We're the only team that can tell you what our system loses when the diode is real — because we measured it."*

**Cost:** low. It's a `tcpdump` post-filter plus one extra axis on the eval harness. Highest payoff per unit of effort in the project.

## ★ Innovation 2 — ACK-Shadow Reconstruction

**Plainly:** when computers talk over TCP, the receiver constantly sends receipts saying *"I've now received everything up to byte 5,000,000."* Those receipts travel in the direction **we can see**.

So even though we never see the server's messages, we watch the receipt number climb — and the climb tells us, by arithmetic, exactly how many bytes came back.

```
   VISIBLE  (client → server)              INVISIBLE  (server → client)
   ┌──────────────────────────┐            ┌──────────────────────────┐
   │  ack = 1,461             │  ◄──────── │   1,460 bytes            │
   │  ack = 5,001,000         │  ◄──────── │   ~5 MB                  │
   └──────────────────────────┘            └──────────────────────────┘
                     Δack = the volume we cannot see
```

Under forward-only capture: **upload volume is directly observed; download volume is recovered from ACK numbers.** So the ratio requirement (f) demands becomes computable after all.

**Limits we state openly:** TCP only — no QUIC/UDP equivalent. Coarse on very short flows. Recovers *volume* and approximate packet count, never individual packet sizes.

**Judge one-liner:** *"The PS asks for an inbound:outbound ratio on a link where inbound is invisible. We compute it anyway, from ACK arithmetic."*

## Innovation 3 — Egress Lockdown (provable read-only)

Every team will *claim* read-only. We make it **structurally impossible**: container with `--network none`, a kernel seccomp filter denying `connect`/`sendto`/`sendmsg`, a capture socket with no transmit ring, and no HTTP library compiled into the binary at all. Then a `--self-test-egress` flag that *deliberately tries* to phone home and gets killed on stage.

**Judge one-liner:** *"Others promise read-only. We let the kernel enforce it, and we'll prove it right now."*

## Innovation 4 — Constant-Memory Streaming

Most detectors keep a list of every source IP they've seen. Under a spoofed-source flood, millions of fake addresses fill that list and the process dies — **the DDoS attack kills the DDoS detector.**

We use fixed-size probabilistic structures (Count-Min Sketch, HyperLogLog, t-digest) so memory is **flat** whether we see a thousand flows a second or a million. We build a deliberately naive baseline purely to show the comparison chart.

**Judge one-liner:** *"Our memory is constant at any rate. Most detectors get DoS'd by the DDoS they're detecting."*

## Innovation 5 — Alert-Budget Precision (P@k)

"99% accuracy" is meaningless here. At a 1-in-10,000 base rate and 100k flows/sec, a 0.1% false-positive rate is **a hundred false alarms per second**.

We report **precision at the analyst's real budget** — *"of the top 50 alerts we surface per hour, how many are true?"* — plus the full precision@k curve.

**Judge one-liner:** *"Accuracy is the wrong metric for a 1-in-10,000 event. We report precision at the capacity a SOC lead actually has to live with."*

## Innovation 6 — Calibrated Confidence

Rule (e) demands a confidence score. Every team will pipe a raw model output into that field — and raw scores are badly miscalibrated; a "0.9" may be right 60% of the time.

We fit isotonic regression on a held-out split and *validate* it with a reliability diagram and Expected Calibration Error. In a room where the analyst can't verify anything, the confidence number **is** their triage tool.

**Judge one-liner:** *"They asked for a confidence score. We're the only team that can prove ours means what it says."*

## Innovation 7 — Merkle Custody Chain

The PS background says the diode *"preserves a clean chain of custody for forensic use."* Everyone will skip that sentence.

Our alert ledger is append-only and hash-linked: `root_n = SHA256(root_{n-1} ‖ leaf_n)`. Edit, delete or reorder any past alert and the seal visibly breaks.

**This is also the only honest use of the "Blockchain & Cybersecurity" theme** — the cryptographic primitive that matters, not a pointless distributed ledger.

**Judge one-liner:** *"The theme says blockchain. We didn't bolt one on — we used the primitive that actually delivers chain of custody, and a distributed ledger would be wrong here because a single air-gapped enclave has no mutually distrusting parties."*

## Innovation 8 — Adversarial Evasion Suite

We attack ourselves and publish the **break-even point** for each detector: at what jitter % the beacon detector fails, at what padding entropy the TLS rhythm signal dies, at what scan rate we stop detecting.

Sounds like a bad idea. It's the opposite — every other team will claim no weaknesses, which no expert believes. Measured limits are what make the rest of your numbers credible.

## Innovation 9 — Kill-Chain Fusion

Six detectors firing independently produce six unrelated alerts. We correlate by host and time window onto attack-chain stages, so *scan → beacon → exfil from the same machine* becomes **one escalating incident with a story**, not three orphans buried in four hundred.

## Innovation 10 — UniFlow-IN dataset release

Because we generate our own traffic, we end up with something that doesn't exist publicly: attack recordings in **matched pairs** — both-directions and one-direction — with exact packet-level labels. We publish it with the generation scripts.

A dataset is a durable research contribution, not a hackathon artefact.

## Three deployment innovations (small effort, big credibility)

| | Problem nobody else addresses | Our answer |
|---|---|---|
| **Sneakernet Model Lifecycle** | No internet means models go stale and can't be updated | Signed model packs by USB + a **drift monitor** that warns *"distribution shifted N%, your models are stale"* |
| **Self-Baselining Warm-Up** | Every network is different; we can't ship labels for theirs | A declared 7-day learning period building per-host normals, with alerting suppressed and a progress indicator |
| **Monitoring Integrity Alerts** | If an attacker cuts the mirror feed, our dashboard goes quiet — indistinguishable from "no attacks" | Treat the feed as a monitored asset: alert on feed loss, rate collapse, direction-mask flip, timestamp discontinuity |

---

# PART 5 — THE VOCABULARY THAT WINS

Judges are NTRO practitioners. The words you choose signal whether you're an operator or a student.

## Say these — named concepts get repeated in the deliberation room

| Term | Use it when |
|---|---|
| **EKADHARA** · "See everything, touch nothing" | Always. Give the project a name judges can recall. |
| **Diode-Twin evaluation** | Describing how we validate |
| **ACK-Shadow reconstruction** | The reverse-channel recovery |
| **Egress Lockdown** | Kernel-enforced read-only |
| **Zero-egress enrichment** | Intelligence built inside the enclave, no lookups |
| **Silent failure** | What happens to the standard approach on a diode |
| **Feature validity** — `MEASURED / ESTIMATED / MISSING` | Why we degrade gracefully instead of lying |
| **Degradation matrix** | The headline result |
| **Precision at alert budget (P@k)** | Instead of accuracy |
| **Calibration · reliability diagram · ECE** | Proving the confidence score means something |
| **Base rate** | Why accuracy is misleading here |
| **Bounded / constant memory · sketches** | CMS, HyperLogLog, t-digest |
| **p99 alert latency** (vs **window latency**) | Never conflate the two |
| **Drop rate** | Always quote alongside throughput |
| **Chain of custody · tamper-evident · Merkle** | Forensics |
| **OCSF Detection Finding** | Our alert schema — an open standard, not a bespoke blob |
| **Air-gapped · enclave · passive · read-only** | The deployment context |
| **Fan-out · beaconing · jitter · DGA · exfiltration · JA4** | Correct domain terms for the six threats |
| **Zeek · IPFIX · NetFlow · sFlow · SHAP · ONNX** | Concrete tooling, never vague "AI/ML" |
| **Break-even point** | Where each detector fails under evasion |
| **Deterministic replay** | Same input, byte-identical output — re-run our numbers |
| **SBOM · licence-clean · air-gap installable** | Deployability |

## Never say these — each appears in ~200 other decks

> ~~99% accuracy~~ · ~~state-of-the-art~~ · ~~cutting-edge~~ · ~~revolutionary~~ · ~~game-changing~~ · ~~highly scalable~~ · ~~robust~~ · ~~seamless~~ · ~~leveraging AI/ML~~ · ~~next-generation~~ · ~~synergy~~ · ~~holistic~~

**Replace every one with a number, with the hardware and dataset it came from.**

## The four sentences to say verbatim

1. *"The problem statement contains a contradiction, and it decides who wins."*
2. *"It doesn't crash. It doesn't warn you. It keeps reporting high confidence."*
3. *"We're the only team that can tell you what our system loses when the diode is real — because we measured it."*
4. *"We put our worst result on the slide, because a system that hides one failure can't credibly claim it has none of the others."*

---

# PART 6 — SCOPE

**Discipline rule:** the deck and the video are what get scored. Every feature must trace to a frame of the video or a number on a slide. No trace, no build. Full traceability table in [`docs/PROTOTYPE-SCOPE.md`](docs/PROTOTYPE-SCOPE.md).

### MUST — without all of these there is no submission

| # | Item |
|---|---|
| M1 | Lab testbed + twin-generation script |
| M2 | **Week-1 control experiment** (validates or kills the thesis) |
| M3 | Zeek-based pipeline with direction mask |
| M4 | **ACK-Shadow + accuracy validation** |
| M5 | Four detectors deep: scan · DDoS · beaconing · exfiltration |
| M6 | **Degradation matrix** across BI / FWD / REV |
| M7 | Dashboard: alert feed + throughput HUD + **diode toggle** + evidence drill-down |
| M8 | OCSF alerts with evidence + validity flags |
| M9 | Throughput + p99 latency + drop rate, measured |

### SHOULD — once every MUST has a measured number
DGA/DNS-tunnel detector · confidence calibration + ECE · egress lockdown + self-test · Merkle custody chain · monitoring-integrity alerts · flow-only (IPFIX) ingest mode

### COULD — design, document, present as *"designed, not implemented"*
Encrypted-malware detector · evasion suite · kill-chain fusion · zero-egress enrichment · self-baselining · model lifecycle · UniFlow-IN packaged release

> **Nothing in COULD gets a line of code until every MUST item has a measured number attached.**
> *"Designed, not yet implemented"* is a perfectly respectable thing to say to a judge. *"It works"* when it doesn't is not recoverable.

---

# PART 7 — TIMELINE

| Week | Focus | Gate |
|---|---|---|
| **1** | Testbed + twins + **CONTROL EXPERIMENT**. Email the NTRO mentor about the ambiguity. | **Do we have our headline number?** If not, pivot now — it's still free. |
| **2** | Zeek pipeline, direction mask, **ACK-Shadow + validation** | **Does ACK-Shadow track ground truth?** If not, fall back to the Diode-Twin narrative, which stands alone. |
| **3** | Scan + DDoS detectors; throughput harness | Real performance numbers exist |
| **4** | Beaconing + exfiltration detectors | The three-row exfil result exists |
| **5** | Dashboard + diode toggle + evidence panel | Demo runs end to end |
| **6** | DGA + encrypted baselines · memory chart · lockdown · packaging | Every deck number exists |
| **7** | **Record video** · finalise deck · determinism check · rehearse | Video locked |
| **8** | Rehearse ×5 · backup slides · Q&A drills · buffer | **Nothing new is written** |

## Owners

| Owner | Responsibility |
|---|---|
| Data / Infra | Testbed, twins, control experiment, performance harness |
| **ACK-Shadow** | **Named individual. Highest variance in the project. Cannot be reassigned mid-project.** |
| Detection | Scan, DDoS, beaconing detectors; naive baseline |
| Platform | Pipeline, lockdown, packaging, determinism |
| Frontend | HUD, evidence panel, diode toggle, degradation panel |
| Story | Deck, video, rehearsals, Q&A drills — **starts week 1, not week 7** |

> Assign the ACK-Shadow owner **today**. Deciding question: *can they explain a TCP handshake from memory?*

---

# PART 8 — SUBMISSION ARTIFACTS

| Artifact | Where | Status |
|---|---|---|
| **Deck** — 6 slides, speaker notes, native charts | [`deck/EKADHARA_SIH26145.pptx`](deck/EKADHARA_SIH26145.pptx) | Built; **numbers are placeholders** |
| Deck script — exact text, layouts, timing, delivery | [`docs/PPT-FINAL.md`](docs/PPT-FINAL.md) | Done |
| **Demo video** — 2:00, shot by shot | [`docs/VIDEO-SCRIPT.md`](docs/VIDEO-SCRIPT.md) | Scripted; not shot |
| **Architecture doc** — 2 pages, camera-ready | [`docs/ARCHITECTURE-2PAGER.md`](docs/ARCHITECTURE-2PAGER.md) | Done |
| Live demo script — 4 min | [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md) | Done |
| Judge Q&A — 15 hostile questions | [`docs/risks-and-rebuttals.md`](docs/risks-and-rebuttals.md) | Done |
| Source repository | — | **Not started** |

## Three rules we hold ourselves to

1. **Every number in the deck comes from the evaluation harness.** No hand-typed figures. A judge who catches one invented number discards the whole deck.
2. **Every measured weakness goes on a slide.** Hiding one forfeits the "zero silent failures" claim that is our entire thesis.
3. **Never claim a capability we haven't run.**

---

# DOCUMENT INDEX

| File | Purpose |
|---|---|
| [`PS.md`](PS.md) | Problem statement, verbatim |
| [`docs/what-we-are-building.md`](docs/what-we-are-building.md) | **Everyone reads this first** — the project in plain English |
| [`docs/domain-brief.md`](docs/domain-brief.md) | New to cybersecurity? The domain from scratch |
| [`docs/innovations.md`](docs/innovations.md) | The differentiators in depth, with judge framing |
| [`docs/PROTOTYPE-SCOPE.md`](docs/PROTOTYPE-SCOPE.md) | **The build list** — 14 features, each traced to a frame or a number |
| [`docs/PPT-FINAL.md`](docs/PPT-FINAL.md) | Locked deck script |
| [`docs/VIDEO-SCRIPT.md`](docs/VIDEO-SCRIPT.md) | 2-minute video, shot by shot |
| [`docs/ARCHITECTURE-2PAGER.md`](docs/ARCHITECTURE-2PAGER.md) | 2-page architecture document |
| [`docs/DEMO_GUIDE.md`](docs/DEMO_GUIDE.md) | 4-minute live demo |
| [`docs/risks-and-rebuttals.md`](docs/risks-and-rebuttals.md) | Judge Q&A + project risks |
| [`docs/architecture-diagram.md`](docs/architecture-diagram.md) | 10 Mermaid flowcharts, PPT-ready |
| [`docs/detector-designs.md`](docs/detector-designs.md) | Per-threat detector design |
| [`docs/data-strategy.md`](docs/data-strategy.md) | Testbed, scenarios, labelling, splits |
| [`docs/evaluation-protocol.md`](docs/evaluation-protocol.md) | Seven report cards + anti-fabrication rules |
| [`docs/implementation-flow.md`](docs/implementation-flow.md) | Stage specs and data contracts |
| [`docs/tech-stack.md`](docs/tech-stack.md) | Choices, rejected alternatives, licence register |
