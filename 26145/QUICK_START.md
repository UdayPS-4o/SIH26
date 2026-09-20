# Quick Start

AI-based cyber threat detection system — real-time flow analysis, 7 threat classes, ML ensemble + rule-based detection.

## Prerequisites

- Python 3.10+ with pip
- Node.js 18+ and npm

## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`. WebSocket streaming at `ws://localhost:8000/ws`.
Health check: `GET http://localhost:8000/api/health`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard opens at `http://localhost:3000`.

## Launch an Attack (Lab/Demo)

Start the traffic simulator with an attack mix, then trigger individual attacks:

```bash
# 1. Start the simulator with attack traffic
curl -X POST http://localhost:8000/api/demo/start \
  -H "Content-Type: application/json" \
  -d '{"attack_mix": {"syn_flood": 0.03, "dga_domain": 0.02}}'

# 2. Launch a specific attack tool
curl -X POST http://localhost:8000/api/attack/launch \
  -H "Content-Type: application/json" \
  -d '{"attack_type": "syn_flood", "target": "127.0.0.1", "duration": 10}'

# 3. Stop everything
curl -X POST http://localhost:8000/api/demo/stop
```

See [docs/DEMO_RUNBOOK.md](./docs/DEMO_RUNBOOK.md) for full demo scenarios.

## Documentation

| Document | Description |
|---|---|
| [docs/INDEX.md](./docs/INDEX.md) | Master index of all documentation files. |
| [docs/README.md](./docs/README.md) | Project overview and features. |
| [docs/problem-statement.md](./docs/problem-statement.md) | Problem statement and motivation. |
| [docs/ARCHITECTURE-2PAGER.md](./docs/ARCHITECTURE-2PAGER.md) | System architecture and data flow. |
| [docs/MODELS_AND_FEATURES.md](./docs/MODELS_AND_FEATURES.md) | Detection models and feature engineering. |
| [docs/EVALUATION.md](./docs/EVALUATION.md) | Evaluation methodology and results. |
| [docs/INNOVATIONS.md](./docs/INNOVATIONS.md) | Key innovations and novel contributions. |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deployment and configuration guide. |
| [docs/THREAT_COVERAGE.md](./docs/THREAT_COVERAGE.md) | Threat class coverage details. |
| [docs/VIDEO_SCRIPT_FINAL.md](./docs/VIDEO_SCRIPT_FINAL.md) | Video script for demo presentation. |
| [docs/DEMO_RUNBOOK.md](./docs/DEMO_RUNBOOK.md) | Live demo runbook with step-by-step instructions. |
| [docs/PPT-FINAL.md](./docs/PPT-FINAL.md) | Final slide deck content and speaker notes. |
