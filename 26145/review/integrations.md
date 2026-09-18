# Integrations (`/integrations`)

## What It Does
External system connections panel. 5 integrations: SOC Platform (SIEM), SIEM Emulator, REST API Endpoint, Fluent Bit Forwarder, Windows Agent. Each shows status, events sent, latency, last heartbeat. Event feed showing outgoing events with format (OCSF/JSON/CEF/Syslog), target, threat class, confidence, status.

## Data Flow
- Integration list (`INTEGRATION_DATA`): hardcoded array of 5 objects
- Event generation: `generateEvents(count, integrations)` — random events with random format, target, threat class, confidence
- No backend API calls
- The "SIEM Emulator" entry points to `localhost:8080` but nothing is running there

## What Is Real
- Nothing. Zero API calls to the backend.
- The integration names and formats (OCSF, CEF, Syslog) are real standards, but the data is fake

## What Is Fake
| Data | How |
|------|-----|
| Integration endpoints | Hardcoded IPs: `192.168.50.10:514`, `localhost:8080`, etc. |
| Connection statuses | Static: connected, connected, disconnected, connected, error |
| Events sent count | Static numbers: 15,234, 8,921, 2,341, 56,789, 1,234 |
| Latency | Static: 12ms, 3ms, 0ms, 1ms, 0ms |
| Last heartbeat | Computed as `Date.now() - offset` |
| Event format | Random from 4 formats |
| Threat class | Random from 10 predefined classes |
| Confidence | Random 60-99% |
| Event status | 92% sent, 4% queued, 4% failed |

## Verdict
**0% real data.** Entirely hardcoded integration list with procedurally generated events. No backend connection. This is a UI concept for what integration output would look like.
