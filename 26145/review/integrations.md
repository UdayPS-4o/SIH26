# Integrations (`/integrations`)

## What It Does
Manages third-party security tool integrations — lists connected services, shows health/status, and allows connecting/disconnecting integrations.

## Data Flow
- **HTTP API** — `GET /api/integrations` returns all integration records (name, type, status, lastSync, config). `POST /api/integrations/connect` and `DELETE /api/integrations/:id/disconnect` mutate state.
- **Local state** — `integrations` array, `isConnecting` (loading on connect action), `selectedIntegration` (for config modal), `toast` (success/error feedback).
- **No WebSocket** — integrations are configuration objects; no live data stream expected.
- **Connect wizard** — multi-step form that collects API keys and endpoints; submitted to the backend.

## What Is Real
- Integration catalogue (name, type, status, lastSync timestamp) from API.
- Status indicators (Connected/Disconnected/Error) reflect real backend status.
- Connect/disconnect actions make real POST/DELETE API calls.
- Last-sync timestamps are from the API.
- Config modal renders real integration settings from API response.
- Success/error toasts reflect actual API response status.

## What Is Fake
| Aspect | How |
|---|---|
| Integration logos | SVG placeholders or first-letter avatars; no real vendor logos. |
| Health-check animation | CSS pulse on the status dot; the underlying status value is real but the animation is cosmetic. |
| Connect form fields | Generic labels (`"API Key"`, `"Endpoint URL"`) not tailored per integration type. |
| "Popular" badge | Hardcoded `isPopular` flag on a few integrations. |
| Category groupings | Static groups (`"SIEM"`, "EDR", "Threat Intel"`) hardcoded in component. |

## Verdict
~75% real. The integration data, connect/disconnect flows, and status reporting are all functional. Logos, form field tailoring, and cosmetic grouping are placeholders.
