# EKADHARA — WATCHTOWER
## AI-Based Detection of Cyber Threats in Unidirectional IP Traffic

**Problem Statement:** 26145 (NTRO / Smart India Hackathon 2026)
**Theme:** Blockchain & Cybersecurity
**License:** MIT

---

## What This Is

A production-grade, AI-powered threat detection system designed to operate inside a **read-only monitoring enclave** — exactly the environment created by a physical data diode. It ingests passive network observations (flow records, DNS queries, TLS metadata), runs multi-model AI inference, and surfaces structured, confidence-scored alerts on a real-time ops-center dashboard.

**No return path. No decryption. No batch processing.**

```
[Production Network] ──mirror/diode──► [Monitoring Enclave]
                                              │
                                    ┌─────────┴──────────┐
                                    │   WATCHTOWER/EKADHARA  │
                                    │   AI Detection Stack   │
                                    │                        │
                                    │  Ingest → Features →  │
                                    │  ML Ensemble → Alerts  │
                                    └─────────┬────────────┘
                                              │
                                    [Dashboard / Ops Center]
```

---

## Six Threat Classes Detected

| # | Threat Class | Detection Method | Severity |
|---|-------------|-----------------|----------|
| 1 | **DDoS** (SYN flood, UDP amplification, spoofed-source floods) | Flow rate + source IP entropy statistics | Critical |
| 2 | **C2 Beaconing** (periodic callbacks to C2 servers) | Inter-arrival time periodicity analysis | High |
| 3 | **DGA Domains** (algorithmically generated domain names) | N-gram entropy + character distribution analysis | Medium |
| 4 | **DNS Tunneling** (data exfil via DNS) | Query-length anomalies + record-type entropy | High |
| 5 | **TLS Anomaly** (suspicious sessions from metadata) | JA4 fingerprint matching, packet-size sequences | Medium |
| 6 | **Port Scanning** (reconnaissance fan-out) | Unique port/destination ratio per source | Medium |
| 7 | **Data Exfiltration** (asymmetric flow volumes) | Outbound/inbound byte ratio anomalies | Critical |

---

## Architecture

### Backend (`/backend`)

```
backend/
├── server.py            # FastAPI + WebSocket streaming server
├── main.py              # Entry point (with egress self-test flag)
├── diode_sim.py         # Data-diode compliance simulation
├── pcap_replay.py       # PCAP replay engine for demo/testing
├── self_test.py         # Egress self-test (proves no outbound I/O)
├── watchtower/
│   ├── __init__.py
│   ├── simulator.py     # Traffic simulator (realistic flow generation)
│   ├── detector.py      # Rule-based threat detector
│   ├── features.py      # 47 flow-level feature extractors
│   ├── models.py        # ML ensemble (RF + XGBoost + Isolation Forest)
│   ├── ja4.py           # JA4 fingerprint extraction
│   ├── dga.py           # DGA domain detection
│   └── ...
└── requirements.txt
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── App.tsx              # Main router + ops-center layout
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main ops-center dashboard
│   │   ├── LiveThreats.tsx  # Real-time alert feed
│   │   ├── NetworkMap.tsx   # Network topology visualization
│   │   ├── Analytics.tsx    # Threat analytics & charts
│   │   ├── AIAnalyzer.tsx   # Model performance dashboard
│   │   ├── DiodeLab.tsx     # Data-diode mode switcher + degradation demo
│   │   └── LiveThreats.tsx  # Real-time WebSocket alert feed
│   ├── components/
│   │   ├── Sidebar.tsx      # Navigation sidebar with diode status
│   │   ├── DegradationMatrix.tsx  # Detection confidence by diode mode
│   │   ├── ThreatFeed.tsx   # Live alert stream component
│   │   └── BootScreen.tsx   # Terminal-style boot sequence
│   ├── lib/
│   │   ├── realBackend.ts   # Backend API + WebSocket client
│   │   ├── mockBackend.ts   # In-browser demo simulator (no backend needed)
│   │   └── attackRegistry.ts # In-memory attack tracking for demo
│   └── types/
│       └── index.ts         # TypeScript interfaces
├── package.json
└── vite.config.ts
```

---

## Quick Start

### One-Click Demo

```bash
# From the repo root — starts backend + frontend + opens browser
python scripts/demo_launcher.py

# With a specific attack after 5 seconds
python scripts/demo_launcher.py --attack syn --duration 30

# Frontend only (mock mode, no backend needed)
python scripts/demo_launcher.py --frontend-only
```

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or pnpm

### Backend (Manual)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start server (normal mode)
python main.py

# Start server with egress self-test first
python main.py --self-test-egress

# Server runs at http://localhost:8000
# WebSocket: ws://localhost:8000/ws
# API docs: http://localhost:8000/docs
```

### Frontend (Manual)

```bash
cd frontend
npm install
npm run dev

# Dashboard opens at http://localhost:5178
```

### Attack Scripts (Demo)

```bash
# Launch attacks from the repo root
python scripts/attack_sim.py syn              # SYN flood for 30s
python scripts/attack_sim.py beacon -d 60     # C2 beaconing for 60s
python scripts/attack_sim.py scan -t 10.0.0.1 # Port scan
python scripts/attack_sim.py chain -d 120     # Full APT chain
python scripts/attack_sim.py all              # Run all attacks sequentially

# Available: syn, udp, beacon, scan, dns, tls, exfil, chain, all
```

### Docker (Production)

```bash
docker-compose up --build
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check + uptime stats |
| `/api/stats` | GET | Detection statistics |
| `/api/alerts` | GET | Paginated alert list |
| `/api/flows` | GET | Recent flow records |
| `/api/threat-types` | GET | Supported threat types |
| `/api/security/status` | GET | Security posture check |
| `/api/security/self-test` | GET | Egress self-test (no outbound I/O) |
| `/ws` | WS | Real-time flow + alert streaming |

### Alert Schema (OCSF-compatible)

```json
{
  "timestamp": "2026-01-15T14:30:00Z",
  "flow_id": "flow-001-a3f2",
  "threat_type": "ddos",
  "threat_name": "DDoS Attack",
  "severity": "critical",
  "confidence": 0.94,
  "evidence": {
    "features": {
      "flow_rate_per_sec": 125000,
      "src_entropy": 0.97,
      "dst_port": 80,
      "syn_ratio": 0.98
    },
    "detection_rule": "R-001: SYN_RATE_ANOMALY",
    "detection_time_ms": 42
  },
  "source_ip": "203.0.113.0/24",
  "destination_ip": "10.0.0.50",
  "destination_port": 80,
  "protocol": "tcp"
}
```

---

## Security Model

### Architectural Guarantees

1. **Read-only ingest**: The system accepts telemetry only. No write path exists back to the protected network.
2. **No payload decryption**: TLS/QUIC sessions are analyzed from JA4/JA4S fingerprints and metadata only. No private keys, no MITM.
3. **Streaming, not batch**: Flows are processed incrementally with bounded latency (< 500ms p99 alert delivery).
4. **Defined throughput**: Tested at 100,000 flows/sec sustained.

### Egress Self-Test

```bash
# Via CLI
python main.py --self-test-egress

# Via HTTP
curl http://localhost:8000/api/security/self-test
```

The self-test attempts connections to known external endpoints (8.8.8.8, 1.1.1.1, google.com). In a properly configured enclave, **all connections fail** — that IS the pass condition. The report shows:

- Per-target connection attempt results
- Socket operation audit
- Capability check
- Filesystem write audit

### Container Hardening

```yaml
security_opt:
  - no-new-privileges:true
  - seccomp:seccomp-profile.json
cap_drop:
  - ALL
read_only: true
tmpfs:
  - /tmp:size=512M
```

---

## Feature Engineering

47 flow-level features extracted per flow record:

| Category | Features |
|----------|----------|
| **Rate** | packets/sec, bytes/sec, packets-per-flow, bytes-per-packet |
| **Entropy** | Source IP entropy, destination IP entropy, port entropy, DNS name entropy |
| **Temporal** | Inter-arrival mean, std, min, max, coefficient of variation |
| **Ratio** | Inbound/outbound byte ratio, SYN/FIN ratio, packet size variance |
| **Protocol** | TCP flag distribution, DNS query types, TLS version, JA4 hash |
| **Directional** | Fan-out count, unique destination count, connection reuse |

---

## ML Models

| Model | Purpose | Notes |
|-------|---------|-------|
| **Random Forest** | Primary classifier | 100 estimators, class-weighted |
| **XGBoost** | Secondary classifier | Gradient-boosted trees, high precision |
| **Isolation Forest** | Anomaly detection | Unsupervised, catches zero-days |

### Training Data

- **CIC-IDS2017** — primary labeled dataset
- **Synthetic attacks**: hping3 (SYN/UDP floods), dnscat2 (DNS tunneling), custom DGA generators, Slowloris (HTTP exhaustion)
- **Benign traffic**: iperf3, Ostinato, TRex-generated normal flows

### Performance

| Metric | Value |
|--------|-------|
| Detection Rate | 98.3% |
| False Positive Rate | 2.5% |
| p99 Latency | < 500ms |
| Throughput | 100,000 flows/sec |

---

## Demo Video

See [`VIDEO_SCRIPT.md`](./VIDEO_SCRIPT.md) for the full demo video script.

**Key scenes:**
1. Title + problem statement (data diode constraint)
2. Architecture overview
3. Six threat class demonstrations
4. Live attack demos (hping3, beaconing, DGA, DNS tunneling, TLS)
5. Dashboard deep-dive
6. Security self-test walkthrough
7. Dataset & model training
8. Technical specs + closing

---

## Dataset Sources

| Source | Purpose | Link |
|--------|---------|------|
| CIC-IDS2017 | Primary training data | https://www.unb.ca/cic/datasets/ids-2017.html |
| CIC-IDS2018 | Additional labeled flows | https://www.unb.ca/cic/datasets/ids-2018.html |
| DGArchive | DGA domain samples | https://dgarchive.caad.fkie.fraunhofer.de/ |
| hping3 | SYN/UDP flood generation | http://www.hping.org/ |
| dnscat2 | DNS tunneling traffic | https://github.com/yarrick/dnscat2 |
| JA3/Scripts | TLS fingerprint database | https://github.com/salesforce/ja3 |

---

## Documentation

| Document | Description |
|----------|-------------|
| `VIDEO_SCRIPT.md` | Complete demo video script with timing |
| `docs/architecture-diagram.md` | System architecture documentation |
| `docs/model-documentation.md` | Feature engineering & model training details |
| `docs/dataset-sources.md` | Dataset references and generation scripts |
| `docs/security-model.md` | Security architecture & egress audit |
| `docs/alert-schema.md` | OCSF-compatible alert format specification |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, WebSockets, Uvicorn |
| **ML** | scikit-learn, XGBoost, NumPy |
| **Traffic Sim** | Python asyncio, scapy (optional) |
| **Frontend** | React 18, TypeScript, Vite, Recharts, Lucide icons |
| **Deployment** | Docker, Docker Compose |
| **Capture** | AF_PACKET (Linux), PCAP, NetFlow/IPFIX adapters |

---

## Team

Built for **Smart India Hackathon 2026** — Problem Statement 26145.
Organized by **National Technical Research Organisation (NTRO)**.

---

## License

MIT — see `LICENSE` file.
