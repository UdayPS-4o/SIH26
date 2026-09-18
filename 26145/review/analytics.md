# Analytics (`/analytics`)

## What It Does
A multi-chart analytics dashboard showing threat trends, severity distributions, attack vectors, geographic breakdown, and hourly heat-map data with date-range filtering.

## Data Flow
- **HTTP API** — `GET /api/analytics?range=7d|30d|90d` returns time-series and categorical data for all charts.
- **Local state** — `dateRange` (7d/30d/90d) controls which API query is issued; `isLoading` toggles skeleton screens.
- **Chart rendering** — `react-chartjs-2` (Line, Bar, Pie, Radar, Doughnut) renders each chart from the API response. Datasets are normalised in-component before being passed to Chart.js.
- **Export button** — triggers a client-side CSV download by serialising the current chart datasets; no server round-trip.

## What Is Real
- Threat-over-time line chart — real API time-series data.
- Attacks-by-type bar chart — real categorical counts from API.
- Severity distribution pie chart — real severity breakdown from API.
- Top attack-vectors radar chart — real vector frequencies from API.
- Geographic distribution doughnut — real country/region data from API.
- Hourly heat-map table — real hourly aggregation from API.
- Date-range picker actually re-queries the API with the selected range parameter.
- CSV export serialises the real chart datasets into downloadable CSV.

## What Is Fake
| Aspect | How |
|---|---|
| Chart animation config | Chart.js `animation.duration` defaults; not a backend feature. |
| Heat-map colour gradient | Hardcoded threshold-to-colour map inside the component. |
| Loading skeletons | Purely cosmetic placeholder UI. |
| Export filename | Hardcoded `"analytics-export.csv"` string. |

## Verdict
~80% real. Every chart dataset comes from the backend API, and the date-range filter triggers real re-fetches. The only non-real elements are cosmetic (skeleton UI, colour maps, export filename).
