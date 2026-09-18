# Activity (`/activity`)

## What It Does
A chronological activity log showing all security events, user actions, and system events with severity classification, filtering, and timeline grouping.

## Data Flow
- **HTTP API** — `GET /api/activity` returns paginated activity events. Parameters: `page`, `limit`, `severity`, `type`, `startDate`, `endDate`.
- **WebSocketContext** — new activity events are pushed in real-time via `activity` message type and appended to the local log array.
- **Local state** — `filterSeverity`, `filterType`, `filterSource`, `currentPage`, `selectedEvent` (for detail drawer).
- **Auto-refresh** — polling fallback (`setInterval` calling `GET /api/activity`) activates when WebSocket disconnects.

## What Is Real
- Activity entries (id, timestamp, type, severity, source, description, user) come from API or WebSocket.
- Severity/type/source filters operate on real event data client-side.
- Pagination uses real `total` count from API response headers/body.
- Event detail drawer renders full event payload from the API.
- Timestamp formatting uses real ISO strings from the server.
- Auto-refresh polling ensures continuity when WebSocket drops.

## What Is Fake
| Aspect | How |
|---|---|
| Timeline grouping labels | Client-side date grouping (`"Today"`, `"Yesterday"`, `"Older"`) computed from timestamps. |
| Severity icon mapping | Hardcoded object mapping severity strings to Lucide icon components. |
| Empty-state illustration | Static SVG for "no activity" condition. |
| Relative time strings | Client-side `formatRelativeTime()` utility. |
| Activity type badges | Predefined colour map (`{ critical: "red", warning: "amber", … }`) hardcoded. |

## Verdict
~85% real. The activity feed is driven by live API and WebSocket data. Client-side filtering, grouping, and formatting are the only non-backend elements.
