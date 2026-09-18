# Dashboard (`/`)

## What It Does
The main command-center view that surfaces at-a-glance security posture via stat cards, trend charts, severity breakdown, and a live alerts feed.

## Data Flow
- **WebSocketContext** (`useWebSocket`) — opens a real `ws://localhost:8000/ws` connection; pushes live threat/alert/event messages that update React state (`threats`, `alerts`, `stats`).
- **HTTP API** (`/api/stats`, `/api/threats`, `/api/alerts`) — initial fetch on mount via `fetch()`; populates stat cards and the recent-alerts table.
- **Local state** — `timeRange` (7d/30d/90d) filters which chart data window is shown; `loading` flag toggles skeleton UI.
- **Charts** — `react-chartjs-2` renders bar, doughnut, polar-area, and radar charts from the fetched datasets. Chart.js handles animation and tooltip internally; no mock data injected there.

## What Is Real
- Threat count, critical alerts, network status, and resolved counts pulled from the API (or live-updated via WebSocket).
- Threat trend bar chart — real time-series data from API.
- Severity doughnut — real severity distribution from API.
- Threat-type polar-area chart — real category breakdown from API.
- Attack-vector radar chart — real vector frequency data from API.
- Recent alerts table with timestamps, severity badges, and source IPs — from API.
- Connection-status indicator (green/red dot) reflects actual WebSocket connection state.

## What Is Fake
| Aspect | How |
|---|---|
| Default stat values | `stats` object has hardcoded fallback numbers (`{ total: 1247, critical: 23, … }`) used before the API responds. |
| Chart colour palettes | Static arrays (`['#ef4444', '#f59e0b', …]`) baked into the component. |
| "Last updated" timestamp | Derived from `new Date()` local formatting, not a server clock. |
| Skeleton loading UI | Standard placeholder; no functional impact. |

## Verdict
~75% real when the backend is connected. The stat cards and charts render live API/WebSocket data. The hardcoded fallback values and cosmetic constants reduce the score but do not affect the core data integrity.
