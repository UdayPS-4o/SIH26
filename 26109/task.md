# MastiGuard AI — React UI Prototype Task

## Objective

Build a polished, responsive React-based UI prototype for an AI-enabled bovine mastitis early-warning and herd-health management platform.

The product should feel like a realistic modern SaaS/health-tech dashboard that could be presented in a Smart India Hackathon-style demo.

The prototype is primarily a FRONTEND UI prototype. Use realistic mock data and simulated AI predictions. Do not claim that the ML predictions are clinically validated.

---

# 1. Product

Product name: **MastiGuard AI**

Tagline:
**AI-Powered Early Mastitis Prediction & Herd Health Intelligence**

Core promise:
Predict the risk of bovine mastitis 7–14 days before visible clinical signs by combining animal health, milk quality, behavioural, sensor, environmental, and historical data.

Target users:
- Dairy Farmers
- Veterinarians
- Dairy Cooperatives
- Animal Health Authorities

Primary UI language: English.
Add a visible language selector with at least:
- English
- हिन्दी

---

# 2. Tech Stack

Use:

- React
- Vite
- JavaScript or TypeScript
- Tailwind CSS
- React Router
- Lucide React icons
- Recharts for charts

Avoid unnecessary dependencies.

The application must run with:

```bash
npm install
npm run dev
```

Do not require a backend.

Use local mock data/services so the prototype works immediately.

---

# 3. Design Direction

Create a premium, clean, modern agricultural AI dashboard.

IMPORTANT:
- Prefer a LIGHT theme as the default.
- Do NOT make the interface predominantly dark.
- Use a professional healthcare/agri-tech visual language.
- Use soft neutral backgrounds, white cards, subtle borders, rounded corners, and restrained shadows.
- Use green as the primary positive/health color.
- Use amber/orange for moderate risk.
- Use red only for high-risk/urgent states.
- Avoid excessive gradients and excessive glassmorphism.
- Avoid a generic admin-template look.

Visual inspiration:
- Modern SaaS dashboard
- Precision agriculture
- Healthcare analytics
- IoT monitoring
- AI decision-support systems

The interface should look presentation-ready.

---

# 4. Global Layout

Desktop layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ Sidebar │ Top Header                                        │
│         ├───────────────────────────────────────────────────┤
│         │ Main Content                                      │
│         │                                                   │
│         │                                                   │
└─────────────────────────────────────────────────────────────┘
```

Sidebar:
- MastiGuard AI logo/mark
- Dashboard
- Animals
- Alerts
- Herd Intelligence
- Milk Quality
- Environment
- AI Simulator
- Reports
- Settings

Top header:
- Farm selector
- Search
- Notification icon
- Language selector
- User profile

Responsive behavior:
- Desktop sidebar
- Tablet collapsible sidebar
- Mobile bottom navigation or hamburger drawer
- All pages must remain usable on mobile

---

# 5. Pages / Routes

Implement these routes:

```text
/
 /dashboard
 /animals
 /animals/:id
 /alerts
 /herd
 /milk-quality
 /environment
 /simulator
 /reports
 /settings
```

Redirect `/` to `/dashboard`.

---

# 6. Dashboard — Most Important Screen

Create a highly polished overview dashboard.

Header:

```text
Good Morning, Farmer
Here’s your herd health overview for today.
```

Farm selector:
`Shree Dairy Farm`

Show KPI cards:

1. Total Animals
   `128`

2. Healthy
   `87`

3. At Risk
   `19`

4. High Risk
   `7`

5. Estimated Animals Protected
   `12`

Each card should have:
- Icon
- Value
- Small trend indicator
- Supporting label

---

## Dashboard Risk Distribution

Create a visual risk distribution:

- No Risk — 87
- Low Risk — 15
- Moderate Risk — 12
- High Risk — 7

Use a donut/pie chart plus legend.

---

## Mastitis Risk Trend

Create a 14-day line chart.

Show:
- Herd Risk
- Average SCC
- Risk threshold

The chart should communicate that risk is gradually increasing.

Add a small insight:

> Herd risk increased 14% over the last 7 days.

---

## Priority Alerts

Show 3–4 alert cards.

Example:

### BUF-042
Risk: `87%`
Status: `HIGH`
Reason:
- SCC increasing
- Milk yield declining
- Activity decreasing

CTA:
`View Animal`

### COW-018
Risk: `68%`
Status: `MODERATE`

---

## AI Insight Card

Create a visually prominent card:

**AI Herd Insight**

> Shed B is showing an elevated mastitis risk pattern. The main contributing factors are rising SCC, increased humidity, and declining activity in 4 animals.

Buttons:
- `View Shed`
- `Review Recommendations`

---

# 7. Animals Page

Create a searchable/filterable animal management page.

Header:
**Animals**

Controls:
- Search animal ID
- Filter by risk
- Filter by breed
- Filter by lactation
- Sort by risk

Table/grid columns:

- Animal
- Breed
- Age
- Lactation
- Milk Yield
- SCC
- Activity
- Risk
- Last Updated
- Action

Risk should be represented by badges:

- No Risk
- Low
- Moderate
- High

Clicking an animal opens `/animals/:id`.

Include pagination-like UI even if data is local.

---

# 8. Individual Animal Details

This is one of the most important pages.

Example animal:

**BUF-042**
Murrah Buffalo
6 years
Lactation 3

Hero section:

```text
BUF-042
Murrah Buffalo

Mastitis Risk
87%
HIGH RISK

Predicted Risk Window
7–14 Days
```

Include buttons:
- `Mark as Reviewed`
- `Contact Veterinarian`

---

## Risk Explanation

Create a section:

**Why is this animal at risk?**

Show contributing factors:

- SCC: `+32%`
- Milk Yield: `-12%`
- Activity: `-18%`
- Rumination: `-15%`
- Udder Temperature: `+1.4°C`

Use horizontal bars or compact cards.

Add an explainability statement:

> The current risk score is primarily influenced by the rising SCC trend, reduced milk production, and behavioural changes compared with this animal’s historical baseline.

---

## Animal Health Timeline

Show:

```text
Aug 20   Normal
Aug 24   SCC trend increased
Aug 27   Milk production decreased
Aug 29   Activity decreased
Sep 02   Early warning generated
Sep 04   High risk — 87%
```

Use a clean timeline.

---

## Animal Charts

Add separate charts/cards for:

- Milk Yield Trend
- SCC Trend
- Activity
- Rumination
- Temperature

Use 7–14 day mock time-series data.

---

## AI Recommendations

Create an actionable recommendation panel:

1. Inspect udder
2. Perform milk quality/SCC test
3. Review milking hygiene
4. Monitor temperature and behaviour
5. Consult veterinarian if abnormal indicators persist

Each recommendation should show:
- Priority
- Reason
- Action button/status

Do not prescribe medicines or dosages.

---

# 9. Alerts Page

Create an alert center.

Filters:
- All
- High
- Moderate
- Resolved

Alert cards should contain:
- Animal ID
- Risk percentage
- Timestamp
- Trigger factors
- Recommended action
- Status

Example:

```text
HIGH RISK
BUF-042
87%

SCC rising rapidly
Milk yield down 12%
Activity down 18%

Prediction window: 7–14 days

[View Animal] [Mark Reviewed]
```

Include notification count in the sidebar/header.

---

# 10. Herd Intelligence Page

Focus on herd-level analytics.

Top cards:
- Herd Mastitis Risk
- Animals at Risk
- High Risk Animals
- Highest Risk Shed

Create:

### Risk by Shed

```text
Shed A  12%
Shed B  48%
Shed C  71%
Shed D  16%
```

Use horizontal risk bars.

---

## Herd Risk Trend

14-day chart.

---

## Risk Cluster Visualization

Create a simple visual farm/shed map using cards or CSS blocks.

Example:

```text
┌──────────────┬──────────────┐
│ SHED A       │ SHED B       │
│ 🟢 Low       │ 🟠 Moderate  │
│ 12%          │ 48%          │
├──────────────┼──────────────┤
│ SHED C       │ SHED D       │
│ 🔴 High      │ 🟢 Low       │
│ 71%          │ 16%          │
└──────────────┴──────────────┘
```

Add:

**AI hotspot detected in Shed C**

---

# 11. Milk Quality Page

Create a data-rich but clean analytics page.

KPIs:
- Average Milk Yield
- Average SCC
- Conductivity
- Milk Temperature
- pH

Charts:
- Milk Yield Trend
- SCC Trend
- Conductivity Trend
- Milk Temperature Trend

Create a small correlation/insight section:

> Rising SCC and declining milk yield are currently the strongest milk-quality signals associated with elevated risk.

Include a table of animals with abnormal milk indicators.

---

# 12. Environment Page

Show farm environmental conditions.

Cards:

- Temperature
- Humidity
- Bedding Hygiene
- Milking Hygiene
- Water Quality
- Housing Condition

Example:

```text
Temperature       31°C
Humidity          78%
Bedding Hygiene   Poor
Milking Hygiene   Moderate
Water Quality     Good
```

Add a 7-day environment trend chart.

AI insight:

> High humidity combined with poor bedding hygiene may increase herd-level mastitis risk.

Use recommendations focused on hygiene and monitoring.

---

# 13. AI Risk Simulator — KILLER DEMO FEATURE

This must be interactive.

Title:

**Mastitis Risk Simulator**

Subtitle:

`Adjust animal parameters and see how the simulated risk changes.`

Controls:

- SCC
- Milk Yield Change
- Activity Change
- Rumination Change
- Body Temperature
- Humidity
- Previous Mastitis

Use sliders/toggles.

Example:

```text
SCC
[────────●────] 420

Milk Yield Change
[──────●──────] -12%

Activity Change
[─────●───────] -18%

Rumination
[──────●──────] -15%

Humidity
[────────●────] 78%

Previous Mastitis
[ ON ]
```

Show a large dynamic result:

```text
87%
HIGH RISK

Estimated Risk Window
7–14 Days
```

The score should actually change based on slider inputs.

Implement a simple transparent demo formula, for example:

- Higher SCC → higher risk
- Larger milk-yield decline → higher risk
- Lower activity → higher risk
- Lower rumination → higher risk
- Higher temperature → higher risk
- Higher humidity → higher environmental risk
- Previous mastitis → higher risk

Clamp the final result between 0 and 99.

Clearly label this as:

**Prototype simulation — not a clinically validated prediction.**

---

# 14. Reports Page

Create a polished reporting page.

Show:
- Weekly herd health summary
- High-risk animals
- Risk trend
- Milk quality summary
- Environmental risk summary
- Intervention summary

Buttons:
- `Export Report`
- `Print Summary`

For the prototype, export can generate a simple CSV or JSON download using browser APIs.

---

# 15. Settings Page

Sections:

### Farm Profile
- Farm name
- Location
- Herd size

### Alert Preferences
- High risk alerts
- Moderate risk alerts
- SMS
- Push notifications

### Language
- English
- हिन्दी

### Sensor Integration
Show mock statuses:
- Milk sensor — Connected
- Smart collar gateway — Connected
- Environment sensor — Connected

Do not require actual hardware.

---

# 16. Mock Data

Create realistic local mock data for at least 15 animals.

Use Indian dairy context.

Include breeds such as:
- Murrah
- Gir
- Sahiwal
- Holstein Friesian
- Jersey
- Crossbred

Each animal should have:
- id
- name/label
- species
- breed
- age
- lactation
- milkYield
- scc
- activity
- rumination
- temperature
- previousMastitis
- riskScore
- riskLevel
- shed
- lastUpdated

Create time-series data for:
- milk yield
- SCC
- activity
- rumination
- temperature
- environmental conditions

Use deterministic mock data rather than random values generated on every render.

---

# 17. Components

Build reusable components:

```text
Layout
Sidebar
Topbar
KpiCard
RiskBadge
RiskGauge
RiskDistribution
TrendChart
AlertCard
AnimalTable
AnimalCard
AnimalHeader
RiskFactors
HealthTimeline
RecommendationCard
InsightCard
ShedRiskCard
EnvironmentCard
SimulatorControl
RiskScoreCard
EmptyState
LoadingState
```

Do not duplicate large UI blocks unnecessarily.

---

# 18. UX Details

Add:
- Hover states
- Active navigation states
- Smooth but subtle transitions
- Tooltips where useful
- Clear focus states
- Empty states
- Responsive tables
- Mobile-friendly cards
- Accessible buttons
- Good typography hierarchy

Use icons consistently.

Avoid:
- giant text everywhere
- excessive animations
- excessive gradients
- cluttered dashboards
- tiny unreadable text
- random decorative charts with no meaning

---

# 19. AI/ML Presentation

Since this is a frontend prototype, simulate the AI layer.

Create a service/module such as:

```text
src/services/predictionService.js
```

It should expose something conceptually like:

```js
predictMastitisRisk(animalData)
```

Return:

```js
{
  riskScore: 87,
  riskLevel: "HIGH",
  predictionWindow: "7–14 Days",
  contributingFactors: [...],
  recommendations: [...]
}
```

The UI must behave as if this is an AI service, but add a small disclaimer:

`Prototype AI simulation — field validation required.`

Do not claim:
- medical diagnosis
- guaranteed prediction
- clinically validated accuracy
- actual 7–14 day accuracy

---

# 20. Suggested Project Structure

Use a clean structure:

```text
src/
├── components/
│   ├── layout/
│   ├── dashboard/
│   ├── animals/
│   ├── alerts/
│   ├── herd/
│   ├── milk/
│   ├── environment/
│   └── common/
├── pages/
│   ├── Dashboard.jsx
│   ├── Animals.jsx
│   ├── AnimalDetails.jsx
│   ├── Alerts.jsx
│   ├── HerdIntelligence.jsx
│   ├── MilkQuality.jsx
│   ├── Environment.jsx
│   ├── Simulator.jsx
│   ├── Reports.jsx
│   └── Settings.jsx
├── data/
│   └── mockData.js
├── services/
│   └── predictionService.js
├── utils/
│   └── riskUtils.js
├── App.jsx
├── main.jsx
└── index.css
```

---

# 21. Final Quality Bar

Before finishing, verify:

1. `npm run dev` works.
2. No broken routes.
3. All sidebar links work.
4. Animal rows/cards open the correct detail page.
5. Simulator sliders change the risk score.
6. Charts render correctly.
7. Responsive layout works.
8. No console errors.
9. No placeholder "Lorem ipsum".
10. No broken images.
11. No unnecessary backend requirement.
12. UI looks like a finished product, not a wireframe.

---

# 22. Demo Story

The prototype should support this exact demo flow:

1. Open Dashboard.
2. Show herd overview: 128 animals.
3. Show 7 high-risk animals.
4. Open alert for BUF-042.
5. Show 87% high risk.
6. Explain contributing factors.
7. Show 7–14 day prediction window.
8. Show health timeline and SCC/milk/activity trends.
9. Show AI recommendations.
10. Open Herd Intelligence.
11. Show Shed C as a risk hotspot.
12. Open AI Simulator.
13. Change SCC/activity/humidity.
14. Show risk score dynamically change.
15. Explain that the production version would connect this UI to real IoT sensors, farm records, laboratory SCC data, and a validated ML model.

---

# 23. Important Product Positioning

The application is NOT simply an animal-management CRUD system.

The UI should strongly communicate these four capabilities:

### 1. PREDICT
Predict mastitis risk before clinical signs.

### 2. EXPLAIN
Show why an animal/herd is considered at risk.

### 3. ACT
Provide practical preventive/corrective recommendations.

### 4. MONITOR
Continuously track animals, milk quality, behaviour, environment, and herd trends.

The dashboard should make these capabilities obvious within the first 10 seconds.

---

# 24. Deliverable

Deliver a complete runnable React frontend prototype.

The result should be visually impressive enough for:
- SIH presentation
- college/project demonstration
- investor-style product demo
- future integration with a real backend and ML model

Do not stop at creating a static landing page.

Build the actual multi-page interactive dashboard prototype described above.
