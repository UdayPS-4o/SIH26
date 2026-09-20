# Deployment Guide — EKADHARA

Prerequisites, backend setup, frontend setup, production Docker Compose, configuration options, demo mode, and attack launcher usage.

---

## Prerequisites

| Component | Minimum | Recommended |
|---|---|---|
| CPU | Intel i5 or AMD Ryzen 5 (4+ cores) | Intel i7-10700K / AMD Ryzen 9 |
| RAM | 8 GB | 16 GB |
| Disk | 2 GB free | 10 GB (for PCAP captures + models) |
| OS | Linux (Ubuntu 20.04+), macOS 12+, Windows 10+ (WSL2) | Ubuntu 22.04 LTS |
| Python | 3.11+ | 3.12 |
| Node.js | 18+ | 20 LTS |
| Docker | 20.10+ | Latest stable (for production mode) |

---

## Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

The server will:
1. Generate synthetic training data (5,000 flows across 7 threat classes)
2. Train the Isolation Forest anomaly detector and Logistic Regression attack classifier
3. Start the TrafficSimulator producing synthetic flows at ~5 flows/sec
4. Begin WebSocket streaming on `ws://localhost:8000/ws`

### Optional: Train on CIC-IDS2017

```bash
# Download CIC-IDS2017 dataset from https://www.unb.ca/cic/datasets/ids-2017.html
# Place Monday-WorkingHours.pcap_ISCX.csv in data/CIC-IDS2017/

python -c "
from models import train_cic_ids2017
train_cic_ids2017('data/CIC-IDS2017/Monday-WorkingHours.pcap_ISCX.csv')
"
```

This trains a RandomForestClassifier on the real-world DDoS traffic and saves it to `backend/models/trained_rf.pkl`. The model is loaded automatically on server startup if present.

### Optional: Self-Test Egress

```bash
# Verify read-only enforcement
python -m self_test
# or via API:
curl http://localhost:8000/api/self-test-egress
```

This attempts to make an outbound connection. The seccomp profile and `--network none` Docker flag should block it, and the server will log the violation.

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:5173
```

The frontend connects to the backend at `ws://localhost:8000/ws`. If the backend is unreachable, it automatically falls back to `MockBackend` (in-browser simulation) so the dashboard is always functional.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

Create a `.env` file in `frontend/`:

```
VITE_API_URL=http://localhost:8000
```

---

## Production Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  ekadhara:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: ekadhara
    runtime: nvidia  # Optional: GPU acceleration for inference
    environment:
      - DIODE_MODE=diode-only
      - LOG_LEVEL=INFO
      - MAX_FLOWS=5000000
      - WINDOW_FAST=1s
      - WINDOW_MEDIUM=60s
      - WINDOW_SLOW=1h
    volumes:
      - ./captures:/data:ro           # Read-only PCAP directory
      - ./models:/app/models:ro        # Pre-trained model artifacts
      - ./logs:/app/logs               # Server logs
    ports:
      - "8000:8000"
    security_opt:
      - seccomp:seccomp-profile.json   # Deny connect/sendto/sendmsg
    cap_add:
      - NET_RAW                         # For AF_PACKET capture
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "4"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
```

### Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pre-train models at build time
RUN python -c "from models import build_models; build_models()"

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Seccomp Profile

```json
// seccomp-profile.json
{
  "defaultAction": "SCMP_ACT_ALLOW",
  "syscalls": [
    {
      "name": "connect",
      "action": "SCMP_ACT_KILL"
    },
    {
      "name": "sendto",
      "action": "SCMP_ACT_KILL"
    },
    {
      "name": "sendmsg",
      "action": "SCMP_ACT_KILL"
    },
    {
      "name": "sendmmsg",
      "action": "SCMP_ACT_KILL"
    }
  ]
}
```

### Build and Run

```bash
docker compose build
docker compose up -d

# Verify egress lockdown
curl http://localhost:8000/api/self-test-egress

# View logs
docker compose logs -f ekadhara

# Stop
docker compose down
```

---

## Configuration Options

### Server Configuration (environment variables or CLI args)

| Option | Default | Description |
|---|---|---|
| `--host` | `0.0.0.0` | Bind address |
| `--port` | `8000` | Port number |
| `--log-level` | `INFO` | Logging verbosity |
| `--max-flows` | `5000000` | Maximum flow table entries |
| `--window-fast` | `1s` | DDoS/scanning window |
| `--window-medium` | `60s` | DNS/tunnelling/exfil window |
| `--window-slow` | `1h` | Beaconing window |

### Diode Mode

Set via the `DIODE_MODE` environment variable or the `/api/diode/mode` endpoint:

| Mode | Value | Description |
|---|---|---|
| Full-Duplex | `full-duplex` | All features OBSERVED |
| Diode-Only | `diode-only` | Reverse-path features MISSING |
| ACK-Shadow | `ack-shadow` | Reverse-path features ESTIMATED |

### Detector Thresholds

Configured in `backend/detector.py` via `SEVERITY_THRESHOLDS`:

| Severity | Confidence Threshold |
|---|---|
| Critical | > 0.85 |
| High | > 0.70 |
| Medium | > 0.50 |
| Low | > 0.00 |

---

## Demo Mode

The frontend includes a built-in demo mode that activates automatically when the backend is unreachable:

```bash
# Frontend-only demo (no backend required)
cd frontend
npm run dev
# Open http://localhost:5173 — MockBackend activates automatically
```

The `MockBackend` (`frontend/src/lib/mockBackend.ts`) generates realistic flows, alerts, and network topology with realistic timing. It supports all dashboard features including the live threat feed, network map, AI analyzer, and attack lab.

### Pre-loaded Demo State

The demo starts with:
- 40 pre-seeded flows (85% benign, 15% attack)
- 7 attack pattern generators (DDoS, Port Scan, Data Exfiltration, DGA, Beaconing, DNS Tunneling, TLS Anomaly, Brute Force)
- Animated network topology with 23 nodes (12 internal, 6 servers, 5 attackers)
- Real-time alert generation at ~0.5–1 alerts/second

---

## Attack Launcher Usage

The Attack Lab page (`frontend/src/pages/AttackLab.tsx`) sends POST requests to the backend's `/api/attack/launch` endpoint. Available attack types:

| Attack ID | Backend Type | Description | Intensity Range |
|---|---|---|---|
| `syn_flood` | `syn_flood` | TCP SYN flood | 0.0 – 1.0 |
| `udp_flood` | `udp_flood` | UDP flood | 0.0 – 1.0 |
| `c2_beacon` | `c2_beaconing` | C2 beaconing with configurable jitter | 0.0 – 1.0 |
| `dga_domain` | `dga_domain` | DGA domain generation | 0.0 – 1.0 |
| `dns_tunnel` | `dns_tunneling` | DNS tunnelling | 0.0 – 1.0 |
| `port_scan` | `port_scan` | Port scanning | 0.0 – 1.0 |
| `data_exfil` | `data_exfiltration` | Data exfiltration | 0.0 – 1.0 |
| `tls_beacon` | `c2_beaconing` | TLS beaconing (mapped to beaconing) | 0.0 – 1.0 |

### API Call

```bash
curl -X POST http://localhost:8000/api/attack/launch \
  -H "Content-Type: application/json" \
  -d '{"attack_type": "syn_flood", "intensity": 0.7}'
```

### Response

```json
{
  "status": "launched",
  "attack_id": "atk_abc123",
  "attack_type": "syn_flood",
  "intensity": 0.7,
  "src_ip": "203.0.113.45",
  "message": "SYN flood attack launched",
  "alerts_generated": 12,
  "latency_ms": 3.2
}
```

### Check Active Attacks

```bash
curl http://localhost:8000/api/attack/status
```

```json
{
  "active": [
    {
      "attack_id": "atk_abc123",
      "attack_type": "syn_flood",
      "intensity": 0.7,
      "started_at": "2025-09-15T10:30:00Z",
      "flows_generated": 1247,
      "alerts_generated": 12
    }
  ],
  "total": 1
}
```
