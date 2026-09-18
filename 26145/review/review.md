# Review (`/review`)

## What It Does
An audit and review panel for SOC analysts to triage, approve, escalate, or dismiss threats — with reviewer assignment, comment threads, and status tracking.

## Data Flow
- **HTTP API** — `GET /api/review/threats` returns threats pending review. `POST /api/review/:id/approve`, `POST /api/review/:id/dismiss`, `POST /api/review/:id/escalate` mutate threat status. `POST /api/review/:id/comment` adds a comment.
- **Local state** — `threats` array, `selectedThreat` (for detail panel), `reviewAction` (approve/dismiss/escalate), `commentText`, `isSubmitting`.
- **WebSocketContext** — receives `review_update` events when other analysts update threat status, enabling live collaborative review.

## What Is Real
- Pending-threat list comes from API with real threat metadata and current review status.
- Approve/dismiss/escalate actions make real POST requests to backend.
- Status badges (Pending Review, Approved, Dismissed, Escalated) reflect real state from API.
- Comment threads are stored via API and visible to all analysts.
- Reviewer assignment shows real analyst name from API.
- WebSocket updates show live changes from other analysts in real-time.
- Filter by status and reviewer operates on real API data.

## What Is Fake
| Aspect | How |
|---|---|
| Reviewer avatars | Generated initials from names; no real profile photos. |
| Comment timestamps | Rendered client-side from ISO strings; not server-formatted. |
| Escalation reason dropdown | Hardcoded options (`"False Positive"`, `"Needs Investigation"`, `"Critical Priority"`). |
| Review priority indicator | Computed from threat severity field; not a separate priority model. |
| Default filter state | `status: "pending"` hardcoded as initial filter. |

## Verdict
~70% real. The core review workflow (threat listing, status mutations, comments) is fully API-driven. Reviewer avatars, escalation options, and initial filter state are client-side defaults.
