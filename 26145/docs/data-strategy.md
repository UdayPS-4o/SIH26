# Data Strategy — UniFlow-IN

**The single biggest risk in this PS is data.** Handle it first, or the last week becomes a scramble to justify numbers.

**The good news:** NTRO's own dataset note *tells us to generate it ourselves.* That is not a limitation — it is the enabler for our flagship innovation, because **only lab-generated traffic gives us packet-level ground truth and paired bidirectional/unidirectional variants.**

---

## 1. What NTRO told us to use

> *"Synthetic and lab-generated traffic: Benign load from `iperf3`, `Ostinato`, or `TRex`; attack traffic from `hping3` (SYN/UDP floods), `Slowloris` (slow HTTP exhaustion), `dnscat2`/`iodine` (DNS tunnelling), and DGA samples from published algorithms (e.g., via DGArchive) or a sandboxed C2 emulator for realistic beaconing timing."*

Read as a checklist, it covers threats (a), (b), (c). It does **not** name tools for (d) encrypted malware, (e) scanning, or (f) exfiltration — so we fill those gaps ourselves, and *saying that we noticed the gaps* is itself a credibility point.

| PS threat | NTRO named | We add |
|---|---|---|
| (a) DDoS | `hping3`, `Slowloris` | `t50`, `hyenae`, MHDDoS patterns; TRex for high-rate benign background |
| (b) Beaconing | "sandboxed C2 emulator" | Custom beacon emulator with configurable interval + jitter %; Merlin / Sliver in a lab if permitted |
| (c) DGA / DNS tunnel | `dnscat2`, `iodine`, DGArchive | `dns2tcp`, plus DGA generators from published family algorithms |
| (d) Encrypted malware | — | `curl`/browsers/Go/Python clients for benign JA4 diversity; scripted TLS clients with malware-like rhythms; `mitmproxy`-free (no decryption) |
| (e) Scanning | — | `nmap` (all timing templates T0–T5), `masscan`, `zmap`, custom slow-scanner |
| (f) Exfiltration | — | Scripted staged uploads over HTTPS/DNS/ICMP; chunked and slow-drip variants |
| Benign background | `iperf3`, `Ostinato`, `TRex` | Real browsing via headless Chrome, `apt`/`pip` mirror pulls, video streaming, SMB/DB chatter, NTP/DNS noise |

---

## 2. Testbed architecture

```
┌────────────── docker compose / Linux netns / GNS3 ──────────────┐
│                                                                  │
│  BENIGN ZONE               ATTACK ZONE          TARGET ZONE      │
│  ├ workstation sims        ├ hping3             ├ web server     │
│  ├ headless Chrome         ├ slowloris          ├ DNS resolver   │
│  ├ iperf3 / Ostinato       ├ nmap / masscan     ├ file server    │
│  ├ apt / pip mirrors       ├ iodine / dnscat2   ├ SCADA sim      │
│  └ NTP / DNS noise         ├ DGA generator      └ DB             │
│                            ├ beacon emulator                     │
│                            └ exfil scripts                       │
│                                                                  │
│            ▼ all traffic crosses a single bridge ▼               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  CAPTURE POINT — tcpdump on the bridge, full duplex         │  │
│  │  + ORCHESTRATOR writes ground-truth timeline (JSON)         │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**The orchestrator is the key component.** It starts and stops every generator on a scripted timeline and writes a ground-truth file:

```json
{
  "scenario": "s07_beacon_jitter30",
  "events": [
    {"t_start": 120.0, "t_end": 3720.0, "label": "beaconing",
     "src": "10.0.2.15", "dst": "203.0.113.9", "dport": 443,
     "params": {"interval_s": 60, "jitter_pct": 30, "payload_bytes": 512}},
    {"t_start": 0.0, "t_end": 3900.0, "label": "benign", "generator": "chrome_browse"}
  ]
}
```

Because labels come from the orchestrator rather than post-hoc guessing, **our ground truth is exact at packet granularity.** CIC-IDS2017 cannot say that — its labelling errors are documented in the literature, and we will cite that when we explain why we built our own.

---

## 3. Producing the diode twins

This is the mechanical step that unlocks Diode-Twin evaluation. Capture once, derive three.

```bash
# capture full duplex at the bridge
tcpdump -i br-lab -s 0 -w scenario_s07_BI.pcap

# TWIN-FWD : only traffic leaving the protected network
tcpdump -r scenario_s07_BI.pcap -w scenario_s07_FWD.pcap 'src net 10.0.0.0/8'

# TWIN-REV : only traffic entering the protected network
tcpdump -r scenario_s07_BI.pcap -w scenario_s07_REV.pcap 'dst net 10.0.0.0/8'
```

Every scenario therefore yields a **triplet** sharing one ground-truth file:

```
scenario_s07_BI.pcap    ┐
scenario_s07_FWD.pcap   ├── scenario_s07_truth.json
scenario_s07_REV.pcap   ┘
```

The evaluation harness runs identical models with identical thresholds across all three and emits the degradation matrix. **This is a ~40-line script that produces our headline result.** Build it in week one.

> Also generate NetFlow/IPFIX exports (`softflowd`, `nfdump`, or `yaf`) from the same captures, since the PS explicitly lists flow records as an input modality. Flow-only mode is a fourth evaluation axis — and it is *inherently* lossier than packet capture, which we can also quantify.

---

## 4. Scenario matrix

Target **≥40 scenarios**, each 30–90 minutes of traffic, all with benign background running throughout.

| ID | Scenario | Threat | Key parameter sweep |
|---|---|---|---|
| s01–s04 | SYN flood | a | 1k / 10k / 100k pps; spoofed vs real sources |
| s05–s06 | UDP reflection | a | DNS + NTP amplifiers; ratio sweep |
| s07 | Slowloris | a | connection count sweep |
| s08–s12 | C2 beaconing | b | interval 10 s/60 s/300 s/1 h × jitter 0/10/30/50 % |
| s13–s14 | Beacon w/ size randomisation | b | payload variance sweep |
| s15–s18 | DGA campaign | c | 4 published family algorithms; query-rate sweep |
| s19–s21 | DNS tunnelling | c | `iodine` + `dnscat2`; full-rate and throttled |
| s22–s25 | Encrypted C2 | d | distinct JA4 fingerprints; browser-mimicry variant |
| s26–s29 | Port scan | e | nmap T0–T5; vertical / horizontal / distributed |
| s30–s31 | Slow scan | e | 1 probe per 30 s / 90 s |
| s32–s35 | Exfiltration | f | bulk HTTPS / chunked / slow-drip / DNS-carried |
| s36–s38 | Multi-stage kill chain | b+e+f | scan → beacon → exfil, same host |
| s39–s40 | Benign-only controls | none | **essential for false-positive measurement** |

> Scenarios s39–s40 matter more than they look. **Most teams never measure false positives on clean traffic at all**, because their dataset has no clean-only captures. Ours does, and that is where the P@k numbers come from.

---

## 5. External validation

Lab data alone invites the criticism *"you trained and tested on your own synthetic traffic."* Pre-empt it.

| Corpus | Use | Caveat we state |
|---|---|---|
| **CTU-13 / MalwareCaptureFacility** | Real botnet C2 traffic → validate beaconing | Older malware families |
| **malware-traffic-analysis.net** | Real TLS malware PCAPs → validate JA4 + rhythm | Small samples, no benign baseline |
| **CIC-IDS2017 / CSE-CIC-IDS2018** | Comparability with published literature | **We cite the documented label errors and flow-generator bugs** and use it for comparison only, never as our primary training set |
| **CIRA-CIC-DoHBrw-2020** | DoH detection fallback | Narrow scope |
| **DGArchive** | Real DGA family samples (NTRO named it) | Names only, no traffic context |
| **UNSW-NB15** | Secondary comparability | Synthetic, dated |

**Protocol:** train on UniFlow-IN, report on UniFlow-IN *and* on external corpora as a generalisation check. Reporting a *drop* on external data is fine and expected — reporting no drop is what looks fabricated.

---

## 6. Splits and leakage control

Naive random splitting leaks catastrophically in network data — packets from the same flow land on both sides.

| Rule | Why |
|---|---|
| Split by **scenario**, never by flow or packet | Prevents same-attack-instance leakage |
| Split by **time block** within long scenarios | Prevents temporal leakage |
| Hold out **entire attack parameter settings** (e.g. train on jitter 0/10/50, test on 30) | Tests generalisation, not memorisation |
| Hold out **entire DGA families** | The real test of a DGA classifier |
| Calibration set is **separate** from both train and test | Isotonic fitting on test data invalidates ECE |

Declare the split policy explicitly in the write-up. Judges who know ML will look for exactly this, and almost no team will have thought about it.

---

## 7. Class imbalance

Real ratios are ~1 attack flow per 10,000+ benign. Do **not** rebalance to 50/50 and report accuracy — that is precisely how the "99.7%" fiction is manufactured.

**Our approach:** train with class weighting or focal loss; **evaluate at the true operational base rate**; report P@k and precision-recall AUC (not ROC-AUC, which is misleading under heavy imbalance). Add a scenario where the base rate is swept to show how the operating point moves.

---

## 8. Deliverable: UniFlow-IN v1.0

Publish as an artefact alongside the prototype:

```
uniflow-in/
├── README.md                  # provenance, licence, ethics note
├── generate/                  # docker-compose + orchestrator — fully reproducible
│   ├── compose.yml
│   ├── orchestrator.py
│   └── scenarios/*.yml
├── captures/
│   ├── s07_BI.pcap  s07_FWD.pcap  s07_REV.pcap
│   └── ...
├── flows/                     # IPFIX exports of the same captures
├── truth/                     # per-scenario ground-truth JSON
└── splits/                    # frozen train / cal / test manifests
```

**Why this is a strong deliverable:** no public dataset has paired full-duplex / diode-capture variants with exact labels. Even if a future team disagrees with our models, the dataset remains useful. That is a research contribution, not a hackathon artefact — and it is the kind of thing an NTRO panel remembers.

**Ethics/safety note to include:** all traffic is lab-generated between machines we control; no real user data, no live malware C2 contacted, C2 emulators sandboxed with no external routing. State this explicitly — a government panel will want it.

---

## 9. Sequencing

Do this **first**, before any modelling. A week spent here makes every subsequent week honest.

| Order | Task | Blocks |
|---|---|---|
| 1 | Testbed compose + orchestrator + truth writer | everything |
| 2 | Twin-generation script (`BI → FWD/REV`) | Diode-Twin eval |
| 3 | 6 pilot scenarios (one per threat class) | detector development |
| 4 | Full 40-scenario sweep (can run unattended overnight) | final numbers |
| 5 | IPFIX export pass | flow-mode evaluation |
| 6 | External corpus ingestion + format normalisation | generalisation check |
| 7 | Package + document UniFlow-IN | deliverable |
