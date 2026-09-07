# PPT — FINAL LOCKED DECK

**Constraint:** 5 content slides + title. ~5 minutes. Judges are NTRO practitioners, not academics.
**This is the locked deck script.** Exact text, exact visuals, exact speaker notes, exact timing.

---

## The narrative arc (why this order wins)

Most decks follow the template mechanically: *here's our idea → here's our tech → here's why it's feasible.* Forgettable.

Ours is **Setup → Twist → Proof → Payoff**, mapped onto the mandated headers:

| Slide | Mandated header | What it actually does |
|---|---|---|
| 1 | Proposed Solution | **The trap.** There's a contradiction in the PS — and here's proof that everyone falls into it. |
| 2 | Technical Approach | **The escape.** How we get out of the trap. |
| 3 | Feasibility & Viability | **The proof.** Numbers, including the ones that make us look bad. |
| 4 | Impact & Benefits | **The payoff.** What this means for India. |
| 5 | Research & References | **The reserve.** Depth held back. |

By the end of Slide 1 the judges should be thinking *"wait — is that true of the other decks we're about to see?"* Everything after that is heard differently.

---

## Design rules (apply to every slide)

| Rule | Why |
|---|---|
| **One idea per slide. One number per slide.** | Judges skim. Two ideas = zero ideas. |
| **Every slide title contains a claim, not a category.** | "Technical Approach" is a filing label. "One pipeline, six detectors, zero outbound packets" is an argument. |
| **Every slide carries something falsifiable.** | A command, a number with hardware attached, a re-runnable claim. Credibility compounds. |
| **Max ~40 words of body text per slide.** | The visual carries it. You are the narration. |
| **Named concepts, capitalised.** | EKADHARA · Diode-Twin · ACK-Shadow · Egress Lockdown. Named things get repeated in the deliberation room; unnamed things don't. |
| **One row of our own results in RED.** | Showing a measured weakness buys more credibility than any strength you claim. |
| **No stock imagery. No clip-art shields or padlocks.** | Instant amateur signal. Diagrams and charts only. |
| **Dark-on-light, one accent colour, one font family.** | Projectors wash out dark themes. Use `#1A5276` blue + `#C0392B` red for failure states. |
| **Footer on every slide:** `SIH26145 · EKADHARA · NTRO` + slide number | Looks finished. |

**Banned words** (each appears in ~200 other decks and costs credibility with a technical judge):
> *99% accuracy · state-of-the-art · revolutionary · cutting-edge · highly scalable · leveraging AI/ML · robust · seamless · game-changing*

---

# TITLE SLIDE

```
                        एकधारा
                     E K A D H A R A

              See everything. Touch nothing.

     Passive AI Threat Intelligence for Air-Gapped Monitoring Enclaves


   ─────────────────────────────────────────────────────────────────
     Half of every standard detection feature disappears on a real
     data diode. We measured exactly how much — and got it back.
   ─────────────────────────────────────────────────────────────────


     SIH26145 · National Technical Research Organisation
     Category: Software · Theme: Blockchain & Cybersecurity
     Team <name> · <institution>
```

**Visual:** FIG-1 (deployment context) at 12% opacity behind the text, or a single one-way arrow motif. Nothing else.

**Speaker (10 s):**
> *"EKADHARA — Sanskrit for 'single stream'. See everything, touch nothing. That's the constraint NTRO put on us, and it's the constraint that breaks every commercial product in this space."*

> **Why the name matters:** judges deliberate over dozens of decks. "Team 47's ML-based IDS" is forgettable. "EKADHARA — see everything, touch nothing" is not. The Sanskrit also reads well to a government panel.

---

# SLIDE 1 · PROPOSED SOLUTION

### Title
> ## The problem statement contains a contradiction — and it decides who wins

### Layout — four quadrants

```
┌────────────────────────────┬──────────────────────────────────┐
│  [FIG-1 deployment]        │  THE CONTRADICTION               │
│  diode → enclave           │  (3 lines, large type)           │
│  no return path            │                                  │
├────────────────────────────┼──────────────────────────────────┤
│  OUR SOLUTION              │  ★ THE KILL SHOT ★               │
│  (one sentence)            │  bar chart: standard approach     │
│                            │  collapsing on diode capture      │
└────────────────────────────┴──────────────────────────────────┘
```

### Quadrant text

**Top-right — THE CONTRADICTION**
```
The PS specifies a hardware DATA DIODE  →  one direction only.

Then it asks for:
   (f) "outbound-to-inbound byte ratios"      ← needs the reverse direction
   (d) "JA3/JA3S fingerprints"                ← JA3S is the SERVER hello

Both require exactly what a diode removes.
```

**Bottom-left — OUR SOLUTION**
```
EKADHARA reads a one-way traffic copy and emits calibrated,
evidence-carrying alerts across all six threat classes —
without transmitting a packet, resolving a hostname,
or decrypting a byte.
```

**Bottom-right — THE KILL SHOT** *(the most important visual in the deck)*

Grouped bar chart, two groups, F1 score on Y:

| | Full-duplex mirror | Real diode capture |
|---|---|---|
| **Standard approach** *(CICFlowMeter → CIC-IDS2017 → RandomForest)* | `0.9x` | **`0.4x`** ← red bar |
| **EKADHARA** | `0.9x` | `0.8x` |

Caption under the chart, in red:
> **It does not crash. It does not warn. It reports high confidence throughout.**

> ⚠️ **Fill these bars with numbers from your Week-1 Control Experiment. Never estimate them.** If the collapse is smaller than expected, print the real numbers and narrow the claim to exfiltration — where the collapse is total by construction. A modest honest number beats a large invented one, and a judge who catches one invented figure discards the entire deck.

### Speaker notes (90 s)

> *"NTRO's enclaves are fed by hardware data diodes — traffic copied one way, no path back. That's deliberate: if an attacker compromises the monitoring system, there's nowhere for them to go.*
>
> *Now read the requirements. Requirement (f) asks for the ratio of outbound to inbound bytes. Requirement (d) asks for JA3S — the server-side TLS fingerprint. Both need the direction a diode deletes.*
>
> *So we tested what happens. This chart is the standard approach — the toolchain most solutions to this problem statement will be built on. On full-duplex traffic it scores 0.9. On the diode capture NTRO actually described, it drops to 0.4.*
>
> *And here's the part that matters: it doesn't crash. It doesn't warn you. Half its features silently become zero, and it keeps reporting high confidence.*
>
> *We built the system that survives it — and can prove it."*

**Pause after "keeps reporting high confidence." Let it land.**

---

# SLIDE 2 · TECHNICAL APPROACH

### Title
> ## One pipeline. Six detectors. Zero outbound packets.

### Layout

```
┌───────────────────────────────────────────────────────────┐
│  FIG-2 — master architecture (hero, ~60% of slide)         │
│  with three coloured callout pins                          │
├──────────────────────────────┬────────────────────────────┤
│  ACK-SHADOW mini-diagram      │  STACK STRIP               │
│  (the technical core)         │  (one line)                │
└──────────────────────────────┴────────────────────────────┘
```

### Callout pins on the architecture

- 🔴 **EGRESS LOCKDOWN** — `--network none` + seccomp denies `connect`/`sendto`. Read-only enforced by the **kernel**, not by convention.
- 🟡 **ACK-SHADOW** — recovers the invisible reverse channel.
- 🟢 **CONSTANT MEMORY** — Count-Min Sketch + HyperLogLog. Flat memory at any traffic rate.

### ACK-Shadow mini-diagram

```
   VISIBLE  (client → server)          INVISIBLE  (server → client)
   ┌────────────────────────┐          ┌────────────────────────┐
   │  ack = 1,461           │  ◄────── │   1,460 bytes          │
   │  ack = 5,001,000       │  ◄────── │   ~5 MB                │
   └────────────────────────┘          └────────────────────────┘
              ▲
     TCP receipts travel in the direction we CAN see.
     Δack  =  volume of traffic we CANNOT see.
```

### Stack strip (one line, small type)
```
Zeek (capture · flow · DNS/TLS/JA4)  →  Python detectors  →  ONNX  →  OCSF alerts  →  React dashboard
Single OCI image · runs with  docker run --network none
```

### Body text (max 3 lines)
```
Six specialists, not one classifier: DDoS is a rate phenomenon over
seconds; beaconing is a periodicity phenomenon over hours; DGA is a
string phenomenon on one query. One model cannot be right about all three.
```

### Speaker notes (90 s)

> *"One pipeline, six detectors, and — importantly — zero outbound packets.*
>
> *Zeek does capture, flow assembly, and DNS/TLS parsing. On top of that we run six specialist detectors, because these threats live at different time scales in different feature spaces — a flood is seconds, beaconing is hours, a DGA domain is a single string. One model that tries to catch all six is mediocre at all six, and worse, it can't tell you why it fired. The PS requires every alert to carry supporting evidence. Six specialists can.*
>
> *Two things here nobody else will have. First, Egress Lockdown — every team will put 'read-only' on a slide. We enforce it in the kernel: the container has no network, and seccomp kills the process if it even attempts a send. We demo that.*
>
> *Second — ACK-Shadow. TCP is a delivery-confirmation protocol. Every packet the client sends carries a receipt: 'I've received everything up to byte N.' Those receipts travel in the direction we CAN see. So we never see the server's packets — but we watch that number climb, and the climb tells us exactly how much came back. That's how we compute an inbound-to-outbound ratio on a link where inbound is invisible."*

---

# SLIDE 3 · FEASIBILITY AND VIABILITY

### Title
> ## We measured everything — including where we fail

### Layout

```
┌────────────────────────────┬──────────────────────────────────┐
│  DIODE-TWIN METHOD          │  DEGRADATION MATRIX              │
│  (FIG-8, compact)           │  ← one row in RED                │
├────────────────────────────┼──────────────────────────────────┤
│  PERFORMANCE (measured)     │  CHALLENGES → MITIGATIONS        │
└────────────────────────────┴──────────────────────────────────┘
```

### Top-left — Diode-Twin method
```
Capture once, full-duplex.  Post-filter into two twins.
One label file. Identical models. Identical thresholds.

   scenario_BI.pcap  ┐
   scenario_FWD.pcap ├─── scenario_truth.json
   scenario_REV.pcap ┘

40 scenarios · packet-level ground truth · generated with the exact
tools NTRO named: hping3 · Slowloris · iodine · dnscat2 · DGArchive
```

### Top-right — DEGRADATION MATRIX ★

| Threat class | Both directions | Diode (one-way) |
|---|---|---|
| Recon / port scan | `0.9x` | `0.9x` |
| Volumetric DDoS | `0.9x` | `0.9x` |
| C2 beaconing | `0.9x` | `0.8x` |
| DGA / DNS tunnel | `0.8x` | `0.8x` |
| **Data exfiltration** | `0.8x` | **`0.8x`** ← *with ACK-Shadow* |
| **Data exfiltration** | — | **`0.0x`** ← *without it* |
| <span style="color:#C0392B">**Malware in encrypted sessions**</span> | <span style="color:#C0392B">`0.8x`</span> | <span style="color:#C0392B">**`0.5x` ← we lose JA4S. No fix exists.**</span> |

Caption:
> **Zero silent failures.** Every degradation is measured, declared, and on this slide.

### Bottom-left — Performance (measured, not claimed)
```
   Sustained          XX,XXX flows/sec  ·  X.X Gbps
   Packet drop rate   0.00%          ← a throughput claim without this is void
   Alert latency      p99 < XXX ms   (processing; window latency reported separately)
   Memory             FLAT under 10× burst — sketches, not hash maps
   Hardware           8-core x86_64, 32 GB

   Re-runnable:  ./eval/run_matrix.py --all      (replay is deterministic)
```

### Bottom-right — Challenges → Mitigations
| Challenge | Mitigation |
|---|---|
| No labelled one-way data exists | We generate it; twin derivation is a post-filter |
| 1-in-10,000 class imbalance | Report precision at the analyst's 50-alerts/hour budget, never accuracy |
| Spoofed floods explode detector memory | Count-Min Sketch + HyperLogLog → flat memory |
| Models go stale in an air gap | Signed model packs by USB + distribution-drift monitor |

### Speaker notes (90 s)

> *"Feasibility first: the data problem is solved. NTRO's own dataset note tells us to generate lab traffic — hping3, Slowloris, iodine, dnscat2, DGArchive. We containerised that into forty scenarios with packet-level ground truth. And because we capture full-duplex first and filter afterwards, every scenario gives us a matched pair: both-directions and one-direction, sharing one label file. That's the Diode-Twin method.*
>
> *That's what produces this matrix. Same models, same thresholds, both worlds.*
>
> *Look at the exfiltration rows. With ACK-Shadow, it survives. Without it — zero. That gap is the innovation, quantified.*
>
> *And look at the red row. Encrypted-malware detection degrades badly one-way, because we lose the server-side TLS fingerprint and there is no arithmetic trick that gets it back. We put that on the slide rather than hiding it — because a system that hides one failure can't credibly claim it has none of the others.*
>
> *Performance is measured on stated hardware, with the drop rate alongside it, because a throughput number without a drop rate is meaningless. And you can re-run it — replay is deterministic, same PCAP in, byte-identical output."*

> **This is the trust slide. Give it the most time. If judges believe Slide 3, they believe the whole deck.**

---

# SLIDE 4 · IMPACT AND BENEFITS

### Title
> ## Deployable inside an Indian air gap — tomorrow

### Layout

```
┌───────────────────────────────────────────────────────────┐
│  FIG-6 — kill-chain fusion: 403 alerts → 1 incident        │
├──────────────────────────┬────────────────────────────────┤
│  WHO BENEFITS            │  WHY IT DEPLOYS                │
└──────────────────────────┴────────────────────────────────┘
```

### Hero — the analyst's experience

```
   WITHOUT                          WITH EKADHARA
   ───────                          ─────────────
   403 alerts.                      INCIDENT #42 — CRITICAL
   Unranked.                        Host 10.2.4.9
   No context.                      RECON 09:14 → C2 11:02 → EGRESS 12:26
   Nothing to investigate with.     3 detectors concur · confidence 0.94
                                    ~4.1 GB egress (via ACK-Shadow)
                                    Evidence: 3 hashes, 12 features
```

### Bottom-left — Who benefits
| | |
|---|---|
| **NTRO / NCIIPC** | Intelligence layer for enclaves they already operate — no new hardware, no change to the security boundary |
| **Power · telecom · defence · rail** | Detection inside air gaps, where commercial NDR cannot function at all |
| **SOC analysts** | Incidents, not alert confetti |
| **Forensics / legal** | Merkle-sealed alert ledger → admissible evidence |
| **Indian security ecosystem** | **UniFlow-IN** released — first public corpus with paired full-duplex / diode-capture variants |

### Bottom-right — Why it deploys
```
✔  Single OCI image · runs with --network none · USB-portable
✔  Zero external dependencies · SBOM shipped in the image
✔  Alerts emit as OCSF → plugs into any SIEM, no adapter
✔  Licence-clean: BSD-3 JA4 by default (JA4+ is monetisation-restricted)
✔  Self-baselines to a new network in 7 days
✔  Signed model updates by sneakernet — no internet, ever
```

### The sovereignty line (say it, don't print it)
> *"Every capable NDR product on the market is foreign, cloud-dependent, and enrichment-hungry. None of them can run inside an Indian air-gapped enclave without phoning home. EKADHARA is designed for exactly the constraint that makes those products unusable — fully offline, fully auditable, fully indigenous."*

### Speaker notes (30 s)

> *"Impact, concretely. Without fusion, an analyst gets four hundred unranked alerts and no way to investigate — remember, in this enclave they can't query anything. With EKADHARA they get one incident with a story: reconnaissance at 9:14, command-and-control at 11:02, four gigabytes out at 12:26, three independent detectors agreeing.*
>
> *And it actually deploys. One container image, no network, no dependencies, standard alert format, licence-clean. You could carry it into a facility on a USB stick."*

---

# SLIDE 5 · RESEARCH AND REFERENCES

### Title
> ## Built on standards. Validated against real traffic.

### Three columns

**STANDARDS**
- **OCSF** — Open Cybersecurity Schema Framework (Linux Foundation); our alert schema, class 2004 Detection Finding
- **JA4 / JA4+** — FoxIO TLS fingerprinting. *Core JA4 is BSD-3-Clause and ships by default; JA4+ is FoxIO Licence 1.1 — government internal use permitted, monetisation restricted, patent-pending*
- **IPFIX** (RFC 7011) · NetFlow v9 · sFlow — ingest modes
- **MITRE ATT&CK** — kill-chain stage mapping
- **Zeek** · **Suricata** — parser oracle and comparison baselines

**TECHNIQUES**
- Count-Min Sketch (Cormode & Muthukrishnan) — bounded-memory frequency
- HyperLogLog (Flajolet et al.) — bounded-memory fan-out cardinality
- CUSUM change-point detection — rate anomaly without static thresholds
- Bowley skewness + MAD — jitter-tolerant beacon periodicity
- Isotonic calibration · Expected Calibration Error
- TreeSHAP (Lundberg & Lee) — per-alert evidence
- Merkle hash chains — tamper-evident custody

**DATA**
- **UniFlow-IN** *(our contribution)* — 40 scenarios, paired BI/FWD/REV twins, packet-level labels
- CTU-13 / MalwareCaptureFacility · malware-traffic-analysis.net
- DGArchive · CIRA-CIC-DoHBrw
- CIC-IDS2017 — *comparability only; documented label errors stated*

### Footer strip
```
Repo: <github link>          Demo video: <link>          UniFlow-IN dataset: <link>
8 backup slides available:  ACK-Shadow proof · Egress Lockdown layers · Merkle custody ·
full degradation matrix · evasion break-even points · per-detector features · licence
register · scale-out design
```

### Speaker notes (20 s)

> *"We build on open standards rather than inventing our own — OCSF for alerts, so this plugs into any SIEM. We've done the licence analysis: core JA4 is BSD, JA4+ has monetisation restrictions, and we default to the BSD one. And we have eight backup slides — happy to go deeper on any of it."*

---

# BACKUP SLIDES (hidden — pull up during Q&A)

Having these prepared, and pulling one up mid-answer, is the single strongest depth signal available to you.

| # | Content | Triggered by |
|---|---|---|
| **B1** | FIG-4 — ACK-Shadow sequence diagram, with wraparound/dup-ACK handling | *"How can you measure a direction you can't see?"* |
| **B2** | FIG-9 — Egress Lockdown, four layers | *"How do we know it's really read-only?"* |
| **B3** | FIG-7 — Merkle custody chain | *"Where's the blockchain?"* |
| **B4** | Full 7×4 degradation matrix incl. flow-only mode | *"Where else does it fail?"* |
| **B5** | Evasion break-even table | *"What if the attacker knows your method?"* |
| **B6** | Per-detector feature lists | *"What features exactly?"* |
| **B7** | Licence register + SBOM | *"Can NTRO actually deploy this?"* |
| **B8** | Scale-out seam + hardware targets | *"Does this work at 40 Gbps?"* |

---

# DELIVERY

### Time budget (5 minutes)
| Slide | Time | Cumulative |
|---|---|---|
| Title | 0:10 | 0:10 |
| 1 · The contradiction | 1:30 | 1:40 |
| 2 · Technical approach | 1:30 | 3:10 |
| **3 · Feasibility** | **1:30** | **4:40** |
| 4 · Impact | 0:30 | 5:10 |
| 5 · References | 0:20 | 5:30 |

If cut to 3 minutes: **Slide 1 + Slide 3 only.** Those two carry the entire argument.

### The four sentences that must be said verbatim

1. *"The problem statement contains a contradiction, and it decides who wins."*
2. *"It doesn't crash. It doesn't warn you. It keeps reporting high confidence."*
3. *"We're the only team that can tell you what our system loses when the diode is real — because we measured it."*
4. *"We put our worst result on the slide, because a system that hides one failure can't credibly claim it has none of the others."*

### Presenter discipline
- **One presenter for slides 1–3.** Switching speakers mid-argument breaks the arc. A second presenter may take 4–5.
- **Never read the slide.** The slide is the evidence; you are the argument.
- **Pause after the kill shot on Slide 1** and after the red row on Slide 3. Silence does work that words can't.
- **Point at the specific number** you're discussing. Judges follow your hand.
- If a judge interrupts: answer, then *"— and that connects to the next slide,"* and continue. Never abandon the arc.

### If asked "what's your accuracy?"
Do not dodge, and do not just give a number:
> *"Per-class F1 is on Slide 3, but accuracy is the wrong question at a one-in-ten-thousand base rate — a 99.9%-accurate detector still generates a hundred false alerts a second at line rate. The number that matters is precision at the analyst's alert budget: of the top 50 alerts we surface per hour, X% are true. That curve is in backup."*

That answer alone separates you from the field.
