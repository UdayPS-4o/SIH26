# Tech Stack — choices and rejected alternatives

Every row below has a *why*, because a judge will ask "why not X?" for at least three of them.

---

## Core pipeline

| Layer | Choice | Why | Rejected |
|---|---|---|---|
| Capture + flow core | **Rust** (`pcap`, `etherparse`, `pnet`, `crossbeam`) | Deterministic latency, no GC pauses → our throughput and p99 numbers mean something. Memory safety matters for code parsing hostile input. | **Python/Scapy** — 100× too slow, and the GIL means our latency graph would measure Python, not our design. **C/C++** — faster to get wrong; parsing attacker-controlled bytes in C is how you get CVEs. |
| L7 metadata (DNS, TLS, QUIC) | Own Rust parsers, **Zeek as validation oracle** | Zeek's parsers are the reference implementation; we cross-check field-level agreement and report it. Best of both: our speed, their correctness. | **Zeek alone in the hot path** — scripting layer costs too much at target rate; also makes our latency numbers Zeek's, not ours. |
| Sketches | Count-Min Sketch, HyperLogLog, t-digest, Space-Saving | Constant memory at any traffic rate. See [`innovations.md` §5](innovations.md). | `HashMap` — OOMs under the exact attack we detect. |
| Model training | **Python** · LightGBM · PyTorch | Fast iteration, SHAP support, everyone knows it. | Training in Rust — no ecosystem benefit, big time cost. |
| Model serving | **ONNX Runtime (`ort`) inside Rust** | No Python in the hot path. Honest latency measurement. Single-binary deployment. | Python inference server — adds IPC latency and a second runtime to the air-gapped image. |
| Explainability | **SHAP** (TreeSHAP for LightGBM) | Constraint (e) requires "supporting evidence feature." TreeSHAP is exact and fast enough to run per-alert. | LIME — slower, approximate, less defensible. |
| Storage | **DuckDB + Parquet** | Embedded, zero services, air-gap trivial, analytical queries over the ledger are instant. | PostgreSQL / ClickHouse / Elasticsearch — extra services to install in an enclave for no benefit at our scale. |
| Message bus | **None by default**; Redpanda seam left open | Single-binary is simpler to demo and to deploy air-gapped. The sharded-worker seam means clustering is a later change, not a rewrite. | Kafka — JVM + ZooKeeper era baggage in an air-gapped image. |
| Dashboard | **React + Vite + Tailwind + WebSocket** | We need a custom diode-mode toggle and degradation panel; Grafana can't express those. | Grafana — great for metrics, wrong for our narrative UI. **Streamlit** — what every other team will use; slow, and it looks like every other team. |
| Packaging | Single **OCI image**, `docker run --network none` | Air-gap proof and one-command demo. | Multi-container compose — more moving parts on stage. |
| Alert schema | **OCSF Detection Finding** (class 2004) + ECS view | Open standard, Linux Foundation project, ~200 participating orgs, native format of AWS Security Lake. Interop instead of a bespoke JSON blob. | Inventing our own schema — objectively worse than a standard maintained by hundreds of contributors, and NTRO would have to write an adapter. |

---

## Security posture of the build itself

| Control | Implementation |
|---|---|
| Egress lockdown | `--network none`, seccomp-bpf deny `connect`/`sendto`/`sendmsg`/`sendmmsg` |
| Capture socket | `AF_PACKET` + `PACKET_IGNORE_OUTGOING`, no `TX_RING` |
| Dependency audit | `cargo-deny` in CI; **no HTTP client crate compiled into the binary at all** |
| Privilege | `CAP_NET_RAW` only, dropped after socket bind; runs as non-root thereafter |
| Reproducible build | Pinned toolchain, `Cargo.lock` committed, image digest published |
| SBOM | Generated at build (CycloneDX) and shipped in the image |

The SBOM is a small addition that reads extremely well to a government panel — supply-chain provenance is a live concern in Indian public-sector procurement.

---

## Licence register (a slide of its own, if asked)

| Component | Licence | Note |
|---|---|---|
| **JA4** (TLS client) | BSD-3-Clause | Safe for any use. **Default in shipped build.** |
| **JA4+** (JA4S/H/X/T/L/SSH) | FoxIO Licence 1.1 | Permissive for internal + government use; **not for monetisation**; patent-pending. Behind a build flag, licence surfaced at compile time. |
| Zeek | BSD-3-Clause | Optional sidecar |
| Suricata (baseline only) | GPL-2.0 | Comparison baseline; not linked into our binary |
| OCSF schema | Apache-2.0 | Schema only |
| LightGBM | MIT | |
| PyTorch | BSD-3-Clause | |
| ONNX Runtime | MIT | |
| DuckDB | MIT | |
| React / Vite / Tailwind | MIT | |
| RouteViews / RIPE RIS MRT data | Open, attribution | Offline BGP enrichment |
| DGArchive | Research use, registration required | Named by NTRO in the PS |

**Why bother:** volunteering a licence analysis nobody asked for signals that we thought about deployment, not just demo. For a government agency that would actually have to field this, GPL contamination or a monetisation-restricted dependency is a real procurement blocker. Almost no student team will have considered it.

---

## Hardware target

State it explicitly; a throughput number without hardware is meaningless.

| Tier | Spec | Purpose |
|---|---|---|
| Dev / demo | Laptop, 8 cores, 16 GB | What we present on |
| Stated target | 8-core x86_64, 32 GB, 10 GbE NIC | The figure we publish |
| Scale-out seam | Shard by 5-tuple hash across nodes | Documented, not built |

---

## What we are NOT using, and why it matters that we say so

| Not used | Why |
|---|---|
| **CICFlowMeter** | Bidirectional to its bones, known bugs, and using it would import the exact flaw we are differentiating against. We build our own directionality-aware extractor. **This rejection is itself a talking point.** |
| **CIC-IDS2017 as primary training data** | Documented label errors; bidirectional-only; over-fitted-to by the literature. Used for comparability only, with caveats stated. |
| **A monolithic multi-class classifier** | Wrong architecture for six phenomena at six time scales. |
| **Any blockchain / smart contract** | The theme says "Blockchain & Cybersecurity." We use the *primitive that matters* — a hash-linked Merkle custody chain — and we explain why a distributed ledger would be the wrong tool in an air-gapped single-enclave deployment. Saying this confidently beats bolting on a pointless chain for theme points. |
| **Deep learning everywhere** | Used where it earns its place (char-CNN for DGA strings, sequence model for TLS rhythm). Statistical methods elsewhere because they are interpretable, and constraint (e) demands evidence. |
| **Cloud anything** | Air-gapped enclave. Obviously. |
