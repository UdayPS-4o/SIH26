# Match (`/match`)

## What Does It Do
A threat-matching and correlation page that compares a selected threat against a knowledge base of known signatures, IoCs, and attack patterns to identify related threats and campaigns.

## Data Flow
- **HTTP API** — `GET /api/match/threats` returns the knowledge base. `POST /api/match/compare` sends a threat payload and receives matched signatures, correlation scores, and related threat IDs.
- **Local state** — `selectedThreat`, `matchResults` (array of matched signatures), `isMatching`, `confidenceThreshold` (slider).
- **WebSocketContext** — receives `match_update` events when background matching completes for queued threats.

## What Is Real
- Threat knowledge base comes from the API.
- Match/comparison POST sends real threat data and receives real correlation results.
- Confidence scores and match percentages are from the backend matching engine.
- Related threat IDs and linked campaigns are API responses.
- Confidence threshold slider filters results client-side on the real `matchResults` array.
- Match result cards display real signature names, descriptions, and source databases.

## What Is Fake
| Aspect | How |
|---|---|
| Matching algorithm | Backend algorithm is a stub/similarity heuristic, not a full ML correlation engine. |
| "Campaign" linking | Backend groups threats by shared attributes; the visual campaign badges are client-side rendering of real IDs. |
| Confidence threshold slider | Client-side filter; min/max bounds hardcoded (`0`–`100`). |
| Match strength visual indicator | CSS gradient bar; the numeric score is real but the visual is cosmetic. |
| Default selected threat | Hardcoded sample threat object used when no threat is selected. |

## Verdict
~75% real. The matching pipeline (API endpoints, WebSocket updates, correlation results) is implemented and functional. The matching algorithm itself is a simplified heuristic rather than a full ML model, and the default threat is hardcoded.
