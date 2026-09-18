# AttackPanel (`/attack`)

## What It Does
A control panel for simulating and monitoring network attacks — selecting attack vectors, configuring parameters, launching simulated attacks, and tracking their progress and impact.

## Data Flow
- **HTTP API** — `POST /api/attack/launch` sends attack configuration; `GET /api/attack/status` polls for progress. Attack results and history come from the API.
- **Local state** — `selectedVector` (attack type), `targetConfig` (IP, port, duration), `isLaunching`, `attackResult`, `attackHistory`.
- **WebSocketContext** — receives `attack_update` events for real-time progress on in-progress attacks (packets sent, success rate, detection status).
- **Attack history** — stored in component state; persists only for the session.

## What Is Real
- Attack vector catalog (DDoS, MITM, Phishing, SQL Injection, XSS, Port Scan) is a real data list.
- Launch button sends a real POST to the backend attack simulator.
- Real-time progress bar updates via WebSocket `attack_update` messages.
- Attack result summary (packets, success rate, duration, detection events) comes from API.
- Detection status (Detected/Undetected/Partially Detected) is rendered from real backend classification.
- Attack history list shows past simulated attacks from API.

## What Is Fake
| Aspect | How |
|---|---|
| Attack progress animation | CSS width transition on progress bar; actual updates come from WebSocket but the bar animation itself is cosmetic. |
| "Impact meter" gauge | SVG arc drawn with hardcoded `strokeDasharray` math; not a real gauge library. |
| Default target values | `"192.168.1.100"`, `"10.0.0.1"` hardcoded as placeholder target IPs. |
| Severity classification labels | Static strings mapping numeric scores to labels (`score > 80 ? "Critical" : …`). |
| Attack history in session | Client-side array; not persisted server-side in the current implementation. |

## Verdict
~70% real. The attack launch flow, real-time progress updates via WebSocket, and result rendering are all functional. However, the target defaults are placeholders, the visual gauges are hand-coded SVG, and the session-only history limits persistence.
