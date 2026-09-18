# Dashboard (`/`)

## What It Does
Landing page. KPI grid (flows, threats blocked, active sessions, detection rate, false positive rate, threats today), pipeline flow diagram, enclave constraints checklist, threat type breakdown, data flow diagram, recent alerts panel.

## Data Flow
- **Hook:** `useDashboardData()` in `lib/useDashboardData.ts`
- Tries `realBackend.fetchStats()` → `/api/stats` and `realBackend.fetchAlerts(24)` → `/api/alerts`
- Falls back to `mockBackend.ts` when backend unreachable
- WebSocket via `useWebSocketContext` provides live flow/alert stream

## What Is Real
- Backend connection status (green DEMO dot when backend IS reachable, false status otherwise)
- `total_flows`, `flows_per_sec`, `uptime_sec`, `total_alerts`, `avg_confidence` — come from backend `/api/stats` when available
- Recent alerts list — comes from backend `/api/alerts` when available
- Scan progress animation — driven by `isLive` flag (real when backend connected)

## What Is Fake
| Field | How |
|-------|-----|
| `threatsBlocked` | Computed as `highSevCount * 137 + 8924` — pure formula, not from backend |
| `activeConnections` | `(total_flows % 3000) + 1800` — modular arithmetic, not real |
| `detectionRate` | `avg_confidence + 2` if backend available, else `97.3` hardcoded |
| `falsePositiveRate` | `5 - avg_confidence/20` — inverse formula |
| Pipeline nodes (Ingest, Features, Inference, Output) | Static hardcoded labels and icons |
| Enclave constraints list | Static — does not query backend for actual config |
| Threat type percentages | Derived from backend `threats_per_type` when available, otherwise static mock |

## Verdict
**~60% real when backend is connected.** Core stats come from the API, but derived KPIs (threats blocked, detection rate, connections) are computed locally. Falls back to full mock when backend is down.
