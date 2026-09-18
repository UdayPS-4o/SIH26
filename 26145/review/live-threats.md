# LiveThreats (`/live-threats`)

## What It Does
A real-time threat intelligence feed that surfaces incoming threats via WebSocket with severity filtering, pagination, and a detail modal.

## Data Flow
- **WebSocketContext** — the primary data source. On mount the component subscribes to `ws://localhost:8000/ws`; each incoming message with type `threat` or `alert` is appended to local `threats` state.
- **HTTP API fallback** — calls `GET /api/threats` on mount to hydrate initial state before WebSocket messages arrive.
- **Local state** — `filter` (All/Critical/High/Medium/Low), `searchQuery`, `selectedThreat` (for modal), `currentPage`, `itemsPerPage` — all client-side, no server round-trip.
- **Auto-scroll** — new threats scroll the table into view via `useRef` + `scrollIntoView`.

## What Is Real
- Threat entries (id, type, severity, source, target, timestamp, description) originate from WebSocket messages or the HTTP API.
- Severity badge rendering (colour-coded red/amber/green) reflects actual severity field.
- Filter and search operate on the live `threats` array — genuine client-side filtering of real data.
- Pagination (`currentPage`, `itemsPerPage`) slices the real threats array.
- Threat detail modal renders full payload of the selected threat object.
- Connection-status banner at top shows live WebSocket state.

## What Is Fake
| Aspect | How |
|---|---|
| Empty-state illustrations | SVG icons hardcoded for "no threats" and "disconnected" screens. |
| Pagination total count | Derived from client-side array length; accurate but not server-paginated. |
| Threat severity default colour map | Hardcoded JS object mapping severity strings to Tailwind classes. |
| Auto-scroll behaviour | Client-side DOM manipulation; no server coordination. |

## Verdict
~90% real. Virtually every displayed threat is sourced from the live WebSocket or HTTP API. The only non-real elements are cosmetic defaults and the client-side-only pagination model.
