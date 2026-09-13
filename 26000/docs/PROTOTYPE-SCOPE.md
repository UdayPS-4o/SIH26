# Prototype Scope — reverse-engineered from the demo

**Method:** the video and the deck are what get scored. So we list every frame of the video and every number on the deck, and derive the minimum system that makes them real. Anything not traceable to a frame or a number **does not get built**.

This is the definitive build list. Where it disagrees with any other doc, this wins.

---

## Traceability: frame → feature

| Video segment | Feature it requires | ID |
|---|---|---|
| 0:00 kill-shot bar chart | Control experiment: CICFlowMeter + RF on both twins | **F1** |
| 0:08 diode context | *(animation only — no code)* | — |
| 0:20 kernel kills egress attempt | seccomp profile + `--self-test-egress` flag | **F2** |
| 0:32 HUD: flows/s, drop %, p99 | Metrics counters + HUD widget | **F3** |
| 0:32 alerts scrolling | PCAP replay → pipeline → alert stream → WebSocket → UI | **F4** |
| 0:40 evidence panel opens | SHAP top-3, IAT sparkline, evidence hash, validity chips | **F5** |
| 0:54 DIODE MODE toggle | Dual-twin replay + live model re-scoring | **F6** |
| 0:56 degradation panel fills | Per-detector F1 comparison, precomputed + live | **F7** |
| 1:08 ACK-SHADOW toggle | ACK-Shadow estimator with a runtime on/off switch | **F8** |
| 1:20 `~4.1 GB egress` alert | Exfiltration detector consuming ACK-Shadow output | **F9** |
| 1:35 memory chart | Naive hashmap baseline + memory instrumentation | **F10** |
| 1:50 close card | OCSF output + Merkle ledger + `--network none` packaging | **F11** |

| Deck claim | Feature it requires | ID |
|---|---|---|
| Degradation matrix (7 rows) | 4 detectors deep + 2 baseline, run across BI/FWD/REV | **F12** |
| "40 scenarios, packet-level truth" | Testbed + orchestrator + twin script | **F13** |
| "p99 < XXX ms, 0.00% drops" | Performance harness | **F14** |
| "re-runnable, deterministic" | Fixed seeds, deterministic eviction, `run_matrix.py` | **F15** |

**Fourteen features. That is the entire prototype.** Everything else in the docs is a slide, not a sprint.

---

## The build list

### F13 · Testbed + twin corpus — **WEEK 1, BLOCKS EVERYTHING**

```
generate/
├── compose.yml          benign zone · attack zone · target zone · one bridge
├── orchestrator.py      scripted timeline → writes truth JSON
├── make_twins.sh        BI → FWD/REV via tcpdump filters      ← 40 lines, do it day 1
└── scenarios/*.yml
```

**Acceptance:** one command produces `sXX_BI.pcap`, `sXX_FWD.pcap`, `sXX_REV.pcap` + `sXX_truth.json`.
**Minimum for demo:** 8 scenarios. **For the deck:** 40 (runs unattended overnight).

---

### F1 · Control experiment — **WEEK 1, DECIDES THE HEADLINE**

```bash
cicflowmeter -f sXX_BI.pcap  -c bi.csv
cicflowmeter -f sXX_FWD.pcap -c fwd.csv
python control_experiment.py    # RandomForest, same model, both CSVs
```

**Acceptance:** two F1 numbers, printed, with the gap.
**This is the first slide of the deck and the first frame of the video.** If the gap is small, narrow the claim to exfiltration and re-cut the opening — do not inflate the number.

---

### F4 · Pipeline — replay → alerts

**Stack (per [`../plan.md`](../plan.md)): Zeek front end, Python detectors.**

```
PCAP ──► Zeek ──► conn.log / dns.log / ssl.log / ack_shadow.log
                        │
                        ▼
              Python detector processes
                        │
                        ▼
              alert stream ──► WebSocket ──► React UI
```

Zeek gives you flow assembly, DNS parsing, TLS parsing and JA4 (plugin) for free. **Do not write your own parsers.**

**Acceptance:** `ekadhara replay --pcap sXX_FWD.pcap --rate 50000` produces alerts on the dashboard within 1 s of window close.

---

### F8 · ACK-Shadow — **the flagship. One owner. Week 2.**

A Zeek script on the `tcp_packet` event (which exposes `seq` and `ack` directly):

```zeek
event tcp_packet(c: connection, is_orig: bool, flags: string,
                 seq: count, ack: count, len: count, payload: string)
    {
    if ( is_orig )
        {
        # client ACKs acknowledge server→client bytes we cannot see
        if ( ack > state$max_ack ) { state$max_ack = ack; }
        # (+ 32-bit wraparound counter, dup-ACK correction)
        }
    }
```

Emit per flow: `reverse_bytes_est`, `reverse_pkts_est`, `rtt_proxy`, `estimator_confidence`, `validity = INFERRED`.

Runtime flag `--ack-shadow=off` must exist — **the video depends on toggling it live.**

**Acceptance (F8a):** on `sXX_FWD.pcap`, `reverse_bytes_est` is within **±10% median error** of the true `resp_bytes` from `sXX_BI.pcap`, on flows > 100 KB.

> **Gate:** if F8a fails by end of week 2, the exfiltration story collapses. Fall back to the Diode-Twin narrative alone — it stands on its own — and re-cut the video around the degradation panel. Decide this in week 2, not week 7.

---

### F9, F12 · Detectors — four deep, two baseline

| Detector | Depth | Core method | Week |
|---|---|---|---|
| **(e) Recon / scan** | deep | HyperLogLog fan-out per source, multi-window | 3 |
| **(a) DDoS** | deep | CUSUM change-point + CMS source entropy at /32,/24,/16 | 3 |
| **(b) Beaconing** | deep | IAT autocorrelation + Bowley skew + MAD + size consistency | 4 |
| **(f) Exfiltration** | deep | **ACK-Shadow ratio** + per-host EWMA baseline + dst rarity | 4 |
| (c) DGA / DNS tunnel | baseline | char n-gram + entropy + per-zone unique-subdomain count | 5 |
| (d) Encrypted malware | baseline | JA4 lookup + packet-size sequence | 5 |

**Why (d) is baseline:** it is the most degraded one-way, so it earns the red row on Slide 3 either way. A baseline implementation is enough to *measure* the degradation, which is what the slide needs.

**Acceptance:** each detector produces a measurable F1 on its scenarios across BI / FWD / REV.

---

### F6, F7 · Diode toggle + degradation panel — **the demo's heart**

Two twins loaded simultaneously. The toggle switches which stream feeds the detectors, live, without restart. The panel shows rolling per-detector F1 for both configurations side by side.

**Acceptance:** toggling takes < 1 s and the panel visibly re-populates. **Rehearse this 20 times** — it is the single most important interaction in the project.

---

### F5 · Evidence panel

Per alert: SHAP top-3 (TreeSHAP, one library call), IAT sparkline, evidence SHA-256, and **validity chips** (`MEASURED` / `ESTIMATED` / `MISSING`) colour-coded.

The validity chips are the visual nobody else has. Cheap, distinctive, and they prove the whole thesis in one glance.

---

### F3, F14 · Metrics + performance harness

Counters: flows/sec, Mbps, packets dropped, per-stage latency (p50/p95/p99), RSS.
Harness: rate ramp to saturation, 10× burst test, memory tracked throughout.

**Acceptance:** a sustained rate with **0.00% drops** and a p99 figure, on stated hardware.

---

### F10 · Naive baseline (built only for the chart)

A deliberately naive detector keying `dict[src_ip]`, run under a spoofed-source flood until it OOMs. One afternoon of work; produces a whole slide and 15 seconds of video.

---

### F2 · Egress lockdown

seccomp-bpf JSON denying `connect`/`sendto`/`sendmsg`/`sendmmsg`; `--self-test-egress` deliberately attempts a connection and is killed; the attempt is logged.

**Acceptance:** the exact terminal output in the video, reproducible on any machine.

---

### F11 · Output + packaging

OCSF Detection Finding JSON (carrying `direction_mask`, `feature_validity`, calibrated confidence, SHAP, evidence hash, Merkle leaf/root) · Parquet ledger · rolling Merkle chain + `verify` command · single OCI image running with `--network none`.

---

### F15 · Determinism

Fixed seeds, deterministic flow eviction order. **Acceptance:** same PCAP twice → byte-identical alert ledger. Lets you say *"re-run our harness, get our numbers"* on a slide.

---

## Schedule

| Week | Deliverable | Gate |
|---|---|---|
| **1** | F13 testbed + twins · **F1 control experiment** · email NTRO mentor re: the ambiguity | **Do we have the headline number?** |
| **2** | F4 Zeek pipeline · **F8 ACK-Shadow + F8a validation** | **Does ACK-Shadow track ground truth?** |
| **3** | Scan + DDoS detectors · F3/F14 perf harness | Real performance numbers exist |
| **4** | Beaconing + **exfiltration (F9)** · F12 matrix v1 | The three-row exfil result exists |
| **5** | F6/F7 dashboard + toggle · F5 evidence panel | Demo runs end to end |
| **6** | DGA + encrypted baselines · F10 memory chart · F2 lockdown · F11 packaging | All deck numbers exist |
| **7** | **Record video** · build deck · F15 determinism · rehearse | Video locked |
| **8** | Rehearse ×5 · backup slides · Q&A drills · buffer | Nothing new is written |

**Week 8 writes no features.** Anything unfinished ships as *"designed, not implemented"* and is said out loud.

---

## Owners

| Owner | Features | Note |
|---|---|---|
| Data / Infra | F13, F1, F14 | Week-1 critical path |
| **ACK-Shadow** | **F8, F8a, F9** | **Named individual. Highest variance in the project. Cannot be reassigned mid-project.** |
| Detection | F12 (scan, DDoS, beaconing), F10 | |
| Platform | F4, F2, F11, F15 | |
| Frontend | F3, F5, F6, F7 | |
| Story | Deck, video, rehearsals, Q&A drills | Starts week 1, not week 7 |

> Assign the ACK-Shadow owner **today**. It is the highest-reward, highest-risk component, and it must be de-risked by end of week 2 — not discovered broken in week 7.

---

## Explicitly NOT building

State these out loud before a judge asks — volunteering scope boundaries reads as discipline, not as gaps.

| Not building | Why |
|---|---|
| Inline blocking / mitigation | Constraint (a) forbids it |
| Payload decryption | Constraint (b) forbids it |
| Multi-node clustering | Single-node target is achievable; the seam is documented |
| Kill-chain fusion | Great narrative; a mocked incident card in the UI is enough for Slide 4 |
| Zero-egress enrichment (passive DNS, offline BGP) | Designed and documented; build only if week 6 finishes early |
| Evasion suite | Present the *planned* sweep table; run it only if ahead |
| Self-baselining, model lifecycle | Architecture-doc items; earn their marks without code |

---

## The one-sentence test

Before adding **any** feature, ask:

> **"Which frame of the video, or which number on the deck, does this make real?"**

No answer means no build.
