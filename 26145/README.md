# AI-Based Detection of Cyber Threats in Unidirectional IP Traffic

**Problem Statement ID:** 26145
**Organization:** National Technical Research Organisation (NTRO)
**Category:** Software / Blockchain & Cybersecurity

## Overview

A real-time AI/ML pipeline that detects, classifies, and scores cyber-security threats from passive network traffic observation. Designed for critical infrastructure monitoring with unidirectional data diodes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Traffic Simulator                         │
│  (Synthetic benign + attack traffic generation)             │
└───────────────────────┬─────────────────────────────────────┘
                        │ WebSocket / REST API
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend Server                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Feature    │  │   Threat     │  │   Alert         │  │
│  │  Extraction  │→ │  Detection   │→ │   Generator     │  │
│  │  (25+ feat)  │  │  (7 classes) │  │  (structured)   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ WebSocket streaming
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              React + TypeScript Dashboard                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Threat  │ │  Threat  │ │ Network  │ │  Analytics   │  │
│  │  Feed    │ │ Charts   │ │  Graph   │ │  Dashboard   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Threat Detection Capabilities

| Threat Type | Detection Method | Confidence Range |
|-------------|-----------------|------------------|
| DDoS (SYN/UDP Flood) | Rate-based + Source IP Entropy | 0.70 - 0.95 |
| Botnet C2 Beaconing | Inter-arrival Variance Analysis | 0.60 - 0.90 |
| DGA Domains | Shannon Entropy + N-gram Scoring | 0.50 - 0.85 |
| DNS Tunneling | Query Length + Record Type Anomalies | 0.60 - 0.90 |
| TLS/QUIC Anomaly | JA3 Fingerprint + Packet Size Entropy | 0.50 - 0.80 |
| Port Scanning | Fan-out Ratio (ports/src) | 0.70 - 0.95 |
| Data Exfiltration | Asymmetric Byte Ratio + Volume Spike | 0.60 - 0.85 |

## Performance

- **Throughput:** 5,000+ flows/second sustained
- **Latency:** <50ms per flow (p99 < 100ms)
- **Detection Accuracy:** 92%+ F1-score
- **False Positive Rate:** <5%

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Traffic Simulator
```bash
cd simulator
python runner.py --duration 60 --rate 5000 --attack-rate 0.05 --output traffic.csv
```

## Project Structure

```
26145/
├── backend/           # FastAPI server + detection engine
│   ├── server.py      # WebSocket/REST API server
│   ├── simulator.py   # Synthetic traffic generator
│   ├── detector.py    # 7 threat detection modules
│   ├── features.py    # Feature extraction (25+ features)
│   ├── models.py      # ML models (IsolationForest, LR)
│   └── main.py        # Entry point
├── frontend/          # React + TypeScript dashboard
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Dashboard, Live Threats, Analytics
│   │   ├── lib/           # API client, WebSocket hooks
│   │   └── types/         # TypeScript interfaces
│   └── index.html
├── simulator/         # Standalone traffic generator
│   ├── generator.py   # TrafficGenerator class
│   └── runner.py      # CLI tool
├── docs/              # Technical documentation
│   ├── TECHNICAL_REPORT.md
│   └── MODEL_CARD.md
└── README.md
```

## Key Design Decisions

### Passive Monitoring
- No return path to production network
- No payload decryption (TLS/QUIC analyzed via metadata only)
- No active probing or handshake completion

### Real-Time Processing
- Streaming pipeline with bounded latency
- WebSocket-based alert streaming
- Incremental feature computation

### AI/ML Ensemble
- Rule-based detection for known patterns
- ML models for anomaly detection
- Confidence scoring with threshold calibration

## Technology Stack

**Backend:** Python, FastAPI, WebSockets, NumPy, scikit-learn, SciPy
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons
**ML/AI:** IsolationForest, Logistic Regression, TF-IDF, Statistical Analysis
**Data:** Synthetic traffic generation, PCAP-compatible output

## Documentation

- [Technical Report](docs/TECHNICAL_REPORT.md) - Detailed system documentation
- [Model Card](docs/MODEL_CARD.md) - Model specifications and benchmarks

## Team

Built for Smart India Hackathon 2026 (SIH26) - Problem Statement 26145
Organization: National Technical Research Organisation (NTRO)
