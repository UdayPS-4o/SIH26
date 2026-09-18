# Analytics (`/analytics`)

## What It Does
Four analytics panels: severity distribution donut chart, alert timeline bar chart, protocol breakdown horizontal bars, risk radar chart (6 categories). Time range selector (24h/7d/30d). Summary stats row (total alerts, critical count, unique sources, avg confidence).

## Data Flow
- All data from `mockBackend.ts`:
  - `generateThreatTypeData()` — threat counts per type
  - `generateFlowTimeSeries()` — time-series data points
  - `generateProtocolDistribution()` — protocol counts
  - `getDetectionMetrics()` — severity distribution
  - `generateTopSourceIPs()` — top attacking IPs
  - `generateHistoricalAlerts()` — historical alert data
- Rendered with inline SVG (no charting library)
- No backend API calls

## What Is Real
- Nothing. All data functions are in `mockBackend.ts` which is the standalone mock generator.
- Even when backend is connected, Analytics.tsx imports from `mockBackend` directly, not `realBackend`.

## What Is Fake
| Data | How |
|------|-----|
| Severity distribution | `getDetectionMetrics()` returns hardcoded-ish counts with small random variance |
| Alert timeline | `generateFlowTimeSeries()` — random walk with noise |
| Protocol breakdown | `generateProtocolDistribution()` — weighted random from predefined protocols |
| Radar chart data | 6 categories with random values 20-95 |
| Top source IPs | `generateTopSourceIPs()` — random IPs with random counts |
| Unique sources count | Random between 50-500 |
| Avg confidence | Random between 65-92 |

## Verdict
**0% real data.** Completely disconnected from the backend. Uses `mockBackend.ts` exclusively. All charts show synthetic data regardless of backend state.
