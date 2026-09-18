# Live Threats (`/live-threats`)

## What It Does
Real-time alert feed with severity badges, protocol tags, IP/port columns. Filter by severity (Critical/High/Medium/Low). Search by IP or threat type. Expandable evidence panels with anomaly scores. Auto-refreshes every 2 seconds.

## Data Flow
- Initial load: tries `realBackend.fetchAlerts()` → `/api/alerts`, falls back to `mockBackend.getAlerts()`
- Live updates: WebSocket via `useWebSocketContext` receives `alert` events
- When WebSocket fails: falls back to `startMockStream()` in `api.ts` (setInterval generating random alerts every 2s)

## What Is Real
- Backend `/api/alerts` endpoint returns real alerts from the `ThreatDetector` engine
- WebSocket alert stream comes from the `TrafficSimulator` generating attack traffic
- Alert fields (`threat_type`, `confidence`, `severity`, `src_ip`, `dst_ip`, `protocol`, `evidence`) — real when backend connected
- Alert counts and timestamps — real from backend

## What Is Fake
| Aspect | How |
|--------|-----|
| Alert generation (fallback mode) | `makeAlert()` in LiveThreats.tsx: random `randIP()`, random threat type from 9 categories, random confidence 35-99 |
| Evidence data | Procedurally generated: random `flag_count`, `anomaly_score` (0.5-0.9), random `flows` count |
| Severity distribution | Weighted random: 8% critical, 20% high, 32% medium, 40% low |
| Search filter | Client-side filter on whatever data is present — works on real and fake alike |
| Initial alert count | `total_alerts` from backend or random 100-600 |

## Verdict
**~80% real when backend is connected.** The alert stream comes from the actual detection engine. Only the fallback mode (no backend) generates synthetic data.
