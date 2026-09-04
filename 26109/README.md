# Gaurogya Setu — UI Prototype

**AI-Powered Early Mastitis Prediction & Herd Health Intelligence**

A frontend-only React prototype for an AI-enabled bovine mastitis early-warning and
herd-health management platform, built for a Smart India Hackathon–style demo.

> Prototype AI simulation on deterministic mock data. Predictions are **not** clinically validated.

## Run

```bash
npm install
npm run dev
```

No backend required. All data lives in `src/data/mockData.js`; the "AI" layer is a
transparent demo formula in `src/services/predictionService.js`.

## Pages

| Route | Page |
|-------|------|
| `/dashboard` | Herd overview: KPIs, risk distribution, 14-day risk trend, priority alerts, AI insight |
| `/animals` | Searchable / filterable animal list with pagination |
| `/animals/:id` | Animal detail: risk gauge, explainability, health timeline, trend charts, recommendations |
| `/alerts` | Alert centre with High / Moderate / Resolved filters |
| `/herd` | Herd analytics, risk by shed, cluster map, hotspot detection |
| `/milk-quality` | Milk yield / SCC / conductivity analytics + abnormal-indicator table |
| `/environment` | Environmental conditions, hygiene, 7-day trend, recommendations |
| `/simulator` | Interactive risk simulator — sliders drive a live risk score |
| `/reports` | Weekly summary with CSV / JSON export and print |
| `/settings` | Farm profile, alert preferences, language, mock sensor status |

## Stack

React 18 · Vite · React Router · Tailwind CSS · Recharts · Lucide icons

Language selector: **English / हिन्दी** (top bar and Settings).

## Demo flow

Dashboard → open BUF-042 alert → 87% high risk → contributing factors + 7–14 day window
→ health timeline & trend charts → recommendations → Herd Intelligence (Shed C hotspot)
→ AI Simulator (move SCC / activity / humidity, watch the score change).
