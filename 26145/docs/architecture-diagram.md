# Architecture & Flowcharts (PPT-ready)

All diagrams are Mermaid. Render at [mermaid.live](https://mermaid.live) → export SVG/PNG → drop into slides.
Recommended export: **transparent background, 2× scale**, so they stay crisp on the SIH template.

---

## FIG-1 — Deployment context: where EKADHARA sits

> **Use on:** Slide 1 (Proposed Solution). This diagram alone explains the problem to a judge who has never heard of a data diode.

```mermaid
flowchart LR
    subgraph PROD["PRODUCTION NETWORK — protected zone"]
        direction TB
        GW["Gateway / Peering Router"]
        SCADA["SCADA / ICS Assets"]
        SRV["Servers and Endpoints"]
        SCADA --- GW
        SRV --- GW
    end

    subgraph BOUNDARY["SECURITY BOUNDARY"]
        DIODE["HARDWARE DATA DIODE<br/>or TAP / SPAN mirror<br/>ONE WAY ONLY"]
    end

    subgraph ENCLAVE["MONITORING ENCLAVE — air-gapped"]
        direction TB
        EK["EKADHARA<br/>passive threat intelligence engine"]
        DASH["Analyst Dashboard"]
        LEDGER["Merkle Custody Ledger"]
        EK --> DASH
        EK --> LEDGER
    end

    GW -->|"copy of all traffic"| DIODE
    DIODE -->|"packets · NetFlow · IPFIX · sFlow"| EK

    EK -.->|"NO RETURN PATH<br/>physically impossible"| GW

    linkStyle 6 stroke:#c0392b,stroke-width:3px,stroke-dasharray: 6 4
    style DIODE fill:#fdebd0,stroke:#e67e22,stroke-width:3px
    style ENCLAVE fill:#eaf2f8,stroke:#2874a6,stroke-width:2px
    style PROD fill:#eafaf1,stroke:#229954,stroke-width:2px
    style EK fill:#d4e6f1,stroke:#1a5276,stroke-width:3px
```

**Speak to it:** *"Everything left of the orange box is what we protect. Everything right of it is where we live. The red dotted line is the arrow that does not exist — and that constraint is the entire problem."*

---

## FIG-2 — End-to-end pipeline (the master architecture slide)

> **Use on:** Slide 2 (Technical Approach). This is the single most important diagram in the deck.

```mermaid
flowchart TB
    subgraph LOCK["EGRESS LOCKDOWN BOUNDARY — netns none + seccomp deny sendto/connect/sendmsg"]
        direction TB

        subgraph S1["1 · INGEST — read only"]
            I1["PCAP replay<br/>at controlled rate"]
            I2["AF_PACKET live capture<br/>PACKET_IGNORE_OUTGOING"]
            I3["NetFlow / IPFIX / sFlow<br/>collector"]
        end

        subgraph S2["2 · FLOW ASSEMBLY"]
            F1["5-tuple state table<br/>bounded, LRU eviction"]
            F2["DIRECTION MASK<br/>FWD | REV | BOTH"]
            F3["TCP state tracking<br/>seq / ack / flags"]
        end

        subgraph S3["3 · FEATURE FABRIC — 3 tiers"]
            T1["TIER A · direction agnostic<br/>rate, size dist, IAT stats"]
            T2["TIER B · single direction OK<br/>fan-out, entropy, DNS names, JA4"]
            T3["TIER C · needs both directions<br/>byte ratio, RTT, JA4S"]
            AS["ACK-SHADOW ESTIMATOR<br/>reverse volume from delta-ack"]
            T3 -->|"if REV missing"| AS
        end

        subgraph S4["4 · DETECTOR ENSEMBLE — streaming, bounded memory"]
            D1["a · DDoS"]
            D2["b · Beaconing"]
            D3["c · DGA + DNS tunnel"]
            D4["d · Encrypted malware"]
            D5["e · Recon / scan"]
            D6["f · Exfiltration"]
        end

        subgraph S5["5 · FUSION"]
            C1["Isotonic calibration"]
            C2["Kill-chain correlation"]
            C3["Severity scoring"]
        end

        subgraph S6["6 · EVIDENCE + CUSTODY"]
            E1["SHAP top-3 features"]
            E2["SHA-256 evidence hash"]
            E3["OCSF Detection Finding"]
            E4["Merkle chain append"]
        end

        subgraph S7["7 · OUTPUT"]
            O1["Live dashboard + HUD"]
            O2["Alert ledger (Parquet)"]
            O3["SIEM export — OCSF / ECS"]
        end

        S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
    end

    ENR["ZERO-EGRESS ENRICHMENT FABRIC<br/>self-built passive DNS · offline BGP-ASN<br/>bundled JA4 DB · asset manifest"]
    ENR -.->|"read only, no lookups"| S3
    ENR -.-> S5

    style LOCK fill:#fef9e7,stroke:#b7950b,stroke-width:3px
    style AS fill:#f9e79f,stroke:#b7950b,stroke-width:3px
    style ENR fill:#e8daef,stroke:#6c3483,stroke-width:2px
    style S4 fill:#eaf2f8,stroke:#2874a6
    style S6 fill:#fadbd8,stroke:#a93226
```

---

## FIG-3 — The core insight: what a diode takes away, and how we take it back

> **Use on:** Slide 1 or 2, next to the "Innovation & Uniqueness" bullet. **This is our winning diagram.**

```mermaid
flowchart TB
    subgraph BI["FULL-DUPLEX MIRROR — what everyone assumes"]
        direction LR
        CB["Client"] -->|"observed"| SB["Server"]
        SB -->|"observed"| CB
        BIF["All ~80 flow features available<br/>fwd + bwd counts, ratios, RTT, JA4 + JA4S"]
    end

    subgraph UNI["TRUE DIODE CAPTURE — what NTRO actually described"]
        direction LR
        CU["Client"] -->|"OBSERVED"| SU["Server"]
        SU -.->|"INVISIBLE"| CU
        UNIF["bwd_* features = 0<br/>down_up_ratio = undefined<br/>RTT = unmeasurable<br/>JA4S = unavailable"]
    end

    subgraph FIX["EKADHARA RESPONSE"]
        direction TB
        R1["ACK-SHADOW<br/>delta ack-number recovers<br/>reverse BYTE VOLUME"]
        R2["ACK TIMING<br/>recovers coarse RTT proxy"]
        R3["VALIDITY FLAGS<br/>every feature carries<br/>observed vs inferred vs missing"]
        R4["DIODE-TWIN EVAL<br/>degradation measured<br/>and published"]
    end

    BI ==>|"drop one direction"| UNI
    UNI ==> FIX

    style BI fill:#eafaf1,stroke:#229954,stroke-width:2px
    style UNI fill:#fdedec,stroke:#c0392b,stroke-width:3px
    style FIX fill:#fef9e7,stroke:#b7950b,stroke-width:3px
```

---

## FIG-4 — ACK-Shadow reconstruction, step by step

> **Use on:** the Innovation slide, or as a backup slide for Q&A. Draw it live if a judge challenges you.

```mermaid
sequenceDiagram
    autonumber
    participant C as Client (visible to us)
    participant D as ✦ DIODE ✦
    participant S as Server (invisible to us)

    Note over D: we only see packets moving downward
    C->>S: SYN  seq=1000  ack=0
    S-->>C: SYN-ACK seq=7000 ack=1001  ✗ NOT SEEN
    C->>S: ACK  seq=1001  ack=7001
    Note right of C: baseline reverse offset = 7001

    C->>S: GET /data  seq=1001 len=80
    S-->>C: 1460 bytes  ✗ NOT SEEN
    C->>S: ACK  seq=1081  ack=8461
    Note right of C: Δack = 1460 → server sent 1460 B

    S-->>C: ~5 MB payload  ✗ NOT SEEN
    C->>S: ACK  seq=1081  ack=5008461
    Note right of C: Δack total = 5 001 460 B<br/>REVERSE VOLUME RECOVERED

    Note over C,S: upload:download ratio = 80 : 5 001 460<br/>Threat (f) is computable after all
```

**Edge cases handled:** 32-bit sequence wraparound (wrap counter), duplicate ACKs (loss correction), SACK blocks (finer granularity), zero-window probes (excluded).

---

## FIG-5 — Detector ensemble internals

> **Use on:** Slide 2 appendix, or the technical write-up.

```mermaid
flowchart LR
    FEAT["Feature Fabric<br/>windowed feature vectors"]

    FEAT --> A["a · DDoS<br/>CUSUM rate change-point<br/>+ CMS/HLL src-IP entropy<br/>+ unanswered-SYN ratio"]
    FEAT --> B["b · Beaconing<br/>IAT autocorrelation<br/>+ Bowley skewness<br/>+ MAD dispersion<br/>+ payload-size consistency"]
    FEAT --> C["c · DGA / DNS tunnel<br/>char-CNN on query name<br/>+ n-gram entropy<br/>+ NXDOMAIN burst<br/>+ per-zone upstream volume"]
    FEAT --> D["d · Encrypted malware<br/>JA4 offline lookup<br/>+ 1-D CNN on first-20-packet<br/>size/direction/IAT sequence"]
    FEAT --> E["e · Recon / scan<br/>HLL distinct-dst cardinality<br/>+ HLL distinct-port<br/>+ SYN-only ratio"]
    FEAT --> F["f · Exfiltration<br/>ACK-Shadow reverse volume<br/>+ per-host EWMA baseline<br/>+ destination rarity"]

    A --> FUSE["FUSION LAYER"]
    B --> FUSE
    C --> FUSE
    D --> FUSE
    E --> FUSE
    F --> FUSE

    FUSE --> CAL["Isotonic calibration<br/>→ trustworthy confidence"]
    CAL --> KC["Kill-chain correlation<br/>→ incidents, not confetti"]
    KC --> SEV["Severity =<br/>f(confidence, asset,<br/>chain stage, blast radius)"]
    SEV --> OUT["OCSF alert + evidence"]

    style FUSE fill:#d4e6f1,stroke:#1a5276,stroke-width:2px
    style OUT fill:#fadbd8,stroke:#a93226,stroke-width:2px
```

---

## FIG-6 — Kill-chain fusion: three alerts become one incident

> **Use on:** Slide 4 (Impact & Benefits) — it shows the analyst's experience, not just the tech.

```mermaid
flowchart LR
    subgraph WITHOUT["WITHOUT FUSION — what other teams produce"]
        direction TB
        W1["ALERT 1 · port scan · 10.2.4.9 · 09:14"]
        W2["ALERT 2 · beaconing · 10.2.4.9 · 11:02"]
        W3["ALERT 3 · exfiltration · 10.2.4.9 · 12:26"]
        W4["...and 400 more unranked alerts"]
    end

    subgraph WITH["WITH KILL-CHAIN FUSION — EKADHARA"]
        direction TB
        INC["INCIDENT #42 — CRITICAL<br/>Host 10.2.4.9<br/><br/>RECON 09:14 → C2 11:02 → EGRESS 12:26<br/>3 independent detectors concur<br/>calibrated confidence 0.94<br/>~4.1 GB estimated egress via ACK-Shadow<br/><br/>Evidence: 3 hashes, 12 SHAP features"]
    end

    WITHOUT ==>|"entity + time-window correlation<br/>mapped to attack-chain stages"| WITH

    style WITHOUT fill:#fdedec,stroke:#c0392b
    style WITH fill:#eafaf1,stroke:#229954,stroke-width:3px
```

---

## FIG-7 — Alert lifecycle and custody chain

> **Use on:** the Merkle / forensics innovation slide.

```mermaid
sequenceDiagram
    autonumber
    participant DET as Detector
    participant CAL as Calibrator
    participant EVD as Evidence Builder
    participant LED as Merkle Ledger
    participant UI as Dashboard

    DET->>CAL: raw score + feature vector
    CAL->>CAL: isotonic → calibrated confidence
    CAL->>EVD: scored detection
    EVD->>EVD: SHAP top-3 contributing features
    EVD->>EVD: SHA-256 over source-capture byte range
    EVD->>EVD: serialise as OCSF Detection Finding
    EVD->>LED: leaf = SHA-256(canonical_json(alert))
    LED->>LED: root_n = SHA-256(root_n-1 || leaf_n)
    LED->>LED: checkpoint root → WORM store
    LED->>UI: append (immutable)
    UI->>UI: render with severity, confidence band, evidence drill-down

    Note over LED: any later edit, delete or reorder<br/>changes the root → detectable
```

---

## FIG-8 — Diode-Twin evaluation methodology

> **Use on:** Slide 3 (Feasibility & Viability) — it proves rigour.

```mermaid
flowchart TB
    LAB["CONTAINERISED TESTBED<br/>benign: iperf3 · Ostinato · TRex<br/>attack: hping3 · Slowloris · dnscat2 · iodine · DGArchive · C2 emulator"]
    LAB --> CAP["Full-duplex capture + orchestration ground truth"]

    CAP --> SPLIT{"post-filter by direction"}
    SPLIT --> V1["TWIN-BI<br/>both directions"]
    SPLIT --> V2["TWIN-FWD<br/>client→server only"]
    SPLIT --> V3["TWIN-REV<br/>server→client only"]

    V1 --> EV["EVALUATION HARNESS<br/>identical models, identical thresholds"]
    V2 --> EV
    V3 --> EV

    EV --> M1["Per-class P / R / F1"]
    EV --> M2["P@k at analyst budget"]
    EV --> M3["Detection latency p50/p95/p99"]
    EV --> M4["Throughput + resident memory"]
    EV --> M5["Calibration: reliability + ECE"]
    EV --> M6["DEGRADATION MATRIX<br/>bi vs fwd vs rev"]

    EXT["EXTERNAL VALIDATION<br/>CTU-13 · malware-traffic-analysis.net<br/>CIC-IDS2017 (with documented caveats)"] --> EV

    style M6 fill:#f9e79f,stroke:#b7950b,stroke-width:3px
    style LAB fill:#e8daef,stroke:#6c3483
```

---

## FIG-9 — Egress Lockdown: defence in depth

> **Use on:** the "provable read-only" innovation slide.

```mermaid
flowchart TB
    L1["LAYER 1 · CONTAINER<br/>docker run --network none<br/>no interface exists but loopback + capture device"]
    L2["LAYER 2 · KERNEL<br/>seccomp-bpf deny: connect, sendto,<br/>sendmsg, sendmmsg → SIGSYS"]
    L3["LAYER 3 · SOCKET<br/>AF_PACKET with PACKET_IGNORE_OUTGOING<br/>no TX_RING bound"]
    L4["LAYER 4 · BUILD<br/>cargo-deny audit · no HTTP client crate<br/>compiled into the binary at all"]
    L5["LAYER 5 · PROOF<br/>--self-test-egress attempts a callback<br/>kernel kills it · attempt is logged"]

    L1 --> L2 --> L3 --> L4 --> L5
    L5 --> PROOF["DEMONSTRABLE ON STAGE<br/>read-only becomes a proof, not a promise"]

    style PROOF fill:#eafaf1,stroke:#229954,stroke-width:3px
    style L5 fill:#f9e79f,stroke:#b7950b,stroke-width:2px
```

---

## FIG-10 — Constant memory under attack (chart to build, not Mermaid)

Build this as a **line chart** in the deck. Two series over a timeline where offered load ramps 1× → 10×:

| Series | Expected shape | Story |
|---|---|---|
| **Naive hashmap detector** (what others build) | memory climbs linearly, then OOM | *the DDoS kills the DDoS detector* |
| **EKADHARA sketch-based** | flat line throughout | *constant memory at any rate* |

Overlay a third axis: p99 alert latency staying under the stated SLA while load ramps.

**This single chart is worth an entire slide.** Nobody else will have it.

---

## Diagram → slide mapping (quick reference)

| Slide | Diagram(s) |
|---|---|
| 1 · Proposed Solution | FIG-1, FIG-3 |
| 2 · Technical Approach | FIG-2 (hero), FIG-5 |
| 3 · Feasibility & Viability | FIG-8, FIG-10 |
| 4 · Impact & Benefits | FIG-6 |
| 5 · Research & References | — |
| Backup / Q&A | FIG-4, FIG-7, FIG-9 |

Keep FIG-4, FIG-7 and FIG-9 as **hidden backup slides**. Pulling up a prepared diagram in answer to a hostile question is the strongest possible signal of depth.
