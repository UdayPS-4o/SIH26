# Gaurogya Setu — Comprehensive Feature List

**Project**: Gaurogya Setu — AI-Powered Dairy Health Intelligence  
**Platform**: Web application (React + Tailwind CSS)  
**Smart India Hackathon 2026 (SIH 26109)**  
**Author**: Uday (SIH Team 26109)  
**Last Updated**: 2026-09-09

---

## Table of Contents

1. [Application Architecture](#1-application-architecture)
2. [Global Features & Shared Infrastructure](#2-global-features--shared-infrastructure)
3. [Dashboard — OVERVIEW](#3-dashboard--overview)
4. [Animals — MONITOR](#4-animals--monitor)
5. [Animal Details Page](#5-animal-details-page)
6. [Alerts — PREDICT](#6-alerts--predict)
7. [Herd Analytics — ANALYZE](#7-herd-analytics--analyze)
8. [Milk Quality — TRACK](#8-milk-quality--track)
9. [Environment Monitoring — MONITOR](#9-environment-monitoring--monitor)
10. [Worker Hygiene — ANALYZE](#10-worker-hygiene--analyze)
11. [AI Simulator — SIMULATE](#11-ai-simulator--simulate)
12. [Detection — DETECT](#12-detection--detect)
13. [Enhanced Detection](#13-enhanced-detection)
14. [Analytics — INSIGHTS](#14-analytics--insights)
15. [Reports — EXPORT](#15-reports--export)
16. [Settings — CONFIG](#16-settings--config)
17. [AI Chat Assistant (Floating)](#17-ai-chat-assistant-floating)
18. [Onboarding Tour](#18-onboarding-tour)
19. [File & Directory Inventory](#19-file--directory-inventory)
20. [Third-Party Dependencies](#20-third-party-dependencies)
21. [Data Strategy: Mock vs. Real Logic](#21-data-strategy-mock-vs-real-logic)

---

## 1. Application Architecture

### Routing (12 Routes)

| Route | Component | Feature Tag | Description |
|-------|-----------|-------------|-------------|
| `/dashboard` | `Dashboard.jsx` | OVERVIEW | Main dashboard with KPIs, charts, alerts |
| `/animals` | `Animals.jsx` | MONITOR | Animal listing with search, filter, sort |
| `/animals/:id` | `AnimalDetails.jsx` | MONITOR | Individual animal health profile |
| `/alerts` | `Alerts.jsx` | PREDICT | AI-powered alert center with risk scores |
| `/herd` | `HerdAnalytics.jsx` | ANALYZE | Cross-herd pattern & correlation analysis |
| `/milk-quality` | `MilkQuality.jsx` | TRACK | Milk quality monitoring dashboard |
| `/environment` | `Environment.jsx` | MONITOR | Shed environment monitoring |
| `/worker-hygiene` | `WorkerHygiene.jsx` | ANALYZE | Worker hygiene compliance tracking |
| `/simulator` | `Simulator.jsx` | SIMULATE | AI risk simulator with sliders |
| `/analytics` | `Analytics.jsx` | INSIGHTS | Herd-wide analytics & insights |
| `/detection` | `Detection.jsx` | DETECT | Real-time anomaly detection |
| `/reports` | `Reports.jsx` | EXPORT | PDF/CSV report generation |
| `/settings` | `Settings.jsx` | CONFIG | Theme, audio, notification preferences |

### Layout Structure (`Layout.jsx`)

- **Responsive sidebar** (desktop: fixed 288px, mobile: slide-out overlay with backdrop)
- **Topbar** — farm selector, herd stats, date, theme toggle, language switcher, notification bell with dropdown
- **Bottom nav** — mobile-only (5 tabs: Dashboard, Animals, Alerts, Analytics, Simulator)
- **Content area** — scrollable main content with responsive padding
- **Footer** — no global footer (per-page footers only)

### Layout Files

| File | Purpose |
|------|---------|
| `src/components/layout/Layout.jsx` | Main layout wrapper with sidebar + topbar + content area |
| `src/components/layout/Sidebar.jsx` | Navigation sidebar with feature tags, farm branding, active route highlighting |
| `src/components/layout/Topbar.jsx` | Top navigation bar with dropdowns, notifications, theme toggle |
| `src/components/layout/BottomNav.jsx` | Mobile bottom tab bar (5 items) |

---

## 2. Global Features & Shared Infrastructure

### Internationalization (i18n)

- **File**: `src/i18n/i18n.jsx`
- **Languages**: English (`en`), Hindi (`hi`) — switchable from topbar
- **Framework**: Custom `useI18n()` hook with nested translation keys
- **Coverage**: All UI labels, button text, section headings, validation messages, tooltips
- **Pattern**: `t('path.to.key')` with dot-notation for nested translations

### Theme System

- **File**: `src/context/ThemeContext.jsx` — React context provider
- **22 presets** from `src/data/themeSystems.js` across 6 categories:
  - **Dark (6)**: Midnight Indigo, Charcoal Emerald, Obsidian Amber, Deep Ocean, Espresso Rose, Dusky Violet
  - **Pastel (6)**: Rose Cloud, Misty Jade, Lavender Haze, Peach Fuzz, Powder Blue, Buttercream
  - **Light (3)**: Warm Sand, Sage Garden, Nordic Frost
  - **Curated (5)**: Retro Wave, Swiss Modern, Bauhaus, Editorial, Memphis
  - **Monochrome (2)**: Mono Slate, Mono Ivory
- **Theme Customizer** (`ThemeCustomizer.jsx`): Full modal dialog (Shift+T shortcut)
  - **Presets tab**: Browse & filter 22 themes by category, 3 hand-picked recommendations for Gaurogya Setu
  - **Basic tab**: Live preview card + color pickers (bg, card, headline, button, text) + font selectors (heading + body from 30+ fonts)
  - **Advanced tab**: CSS custom property editor (11 properties), accessibility toggles (High Contrast, Reduce Motion), font size scale slider (87.5%–125%), border radius slider (0–16px)
  - **Export tab**: JSON export/import, live JSON preview, copy-to-clipboard
- **Persistence**: Config saved to `localStorage` key `gaurogya-theme-customizer`
- **CSS Variables**: All resolved values written to `:root` via `style.setProperty`
- **Accessibility**: `.high-contrast` and `.reduce-motion` CSS classes toggled on `<html>`
- **Dark/Light mode**: Separate `useTheme()` context with `darkMode` state + `toggleTheme()`

### Notification System (Toast)

- **File**: `src/utils/toast.js`
- **Toast component** with stacking, auto-dismiss, and type variants (success, error, warning, info)
- Used across app for user feedback on actions

### Audio System

- **File**: `src/utils/audio.js`
- **Web Audio API** integration for alert sounds
- Configurable volume, tone, and patterns for different alert types

### Onboarding Tour

- **File**: `src/components/common/OnboardingTour.jsx`
- **Step-by-step guided tour** for first-time users
- Highlights key UI elements with tooltips and progress indicator
- Covers sidebar navigation, main dashboard features, and settings

### AI Chat Assistant (Floating)

- **File**: `src/components/common/AiChatAssistant.jsx`
- **Floating chat widget** (bottom-right corner, 340–360px wide, 460px tall)
- **8 pre-programmed Q&A pairs** covering: mastitis info, detection mechanism, alerts/notifications, herd size, prevention, sensors/IoT, cost/pricing, languages
- **Pattern-matched responses** using regex — keyword matching against known questions
- **Simulated AI thinking** — 1.2–2.0s delay with animated "thinking dots"
- **Chat UI**: Message bubbles (user right-aligned, bot left-aligned), bot avatar icons, auto-scroll to bottom, Enter-to-send
- **Toggle**: Floating button with MessageSquare icon, close button in panel header

---

## 3. Dashboard — OVERVIEW

**File**: `src/pages/Dashboard.jsx`

### Features

| Feature | Description | Data Source | UI Elements |
|---------|-------------|-------------|-------------|
| **KPI Cards Row** | 6 stat cards showing: total animals, avg risk score, open alerts, avg SCC, milk yield, healthy count | `HERD_STATS` + computed from `ANIMALS` | Number cards with trend indicators |
| **Risk Score Distribution** | Horizontal bar chart showing risk level distribution (low/medium/high/critical) | Computed from `ANIMALS` array | Custom CSS bar chart with color segments |
| **Milk Yield Trend** | Line chart of daily milk yield across the herd | `animalTimeSeries` from mockData | SVG polyline chart with gradient fill |
| **SCC Trend** | Line chart of somatic cell count trend over 30 days | `animalTimeSeries` from mockData | SVG polyline chart |
| **Shed Overview** | Per-shed summary cards showing animal count, avg risk, status | `SHEDS` array | Grid of cards with color-coded risk indicators |
| **Recent Alerts** | List of most recent alerts with severity indicators | `ALERTS` array filtered to recent | Compact alert cards with timestamp |
| **Prediction Badge** | AI confidence percentage for overall herd health | Computed from prediction service | Animated progress bar |

### UI/UX Elements
- Responsive grid layout (1–4 columns based on breakpoint)
- Animated number counters on load
- Color-coded risk indicators (forest-green → honey-yellow → red)
- Hover tooltips on chart data points
- Loading skeleton during data fetch simulation

---

## 4. Animals — MONITOR

**File**: `src/pages/Animals.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Animal Grid/List** | Card-based grid (desktop) or list (mobile) of all animals | `ANIMALS` array (47 animals) |
| **Search** | Real-time text search by animal ID, name, or shed | Client-side filter on `ANIMALS` |
| **Risk Filter** | Filter by risk level: All, Low (<20), Medium (20-45), High (45-70), Critical (70+) | Client-side computed filter |
| **Shed Filter** | Filter by shed: A, B, C, D | Client-side filter on `animal.shed` |
| **Status Filter** | Filter by detection status: normal, watch, alert | Client-side filter |
| **Sort** | Sort by: risk score (high→low), name (A→Z), ID, SCC | Client-side sort |
| **Risk Badge** | Color-coded risk percentage on each card | `animal.riskScore` |
| **Detection Status** | Online dot + status label on each card | `getDetectionStatus(animal)` |
| **Quick Navigation** | Click card → navigates to `/animals/:id` | React Router |

### Per-Animal Card Data
- Animal ID + name
- Shed assignment
- Risk score with color coding
- SCC value, milk yield, temperature, activity, rumination
- Previous mastitis flag
- Detection status indicator

### UI/UX Elements
- Responsive grid: 4 columns → 3 → 2 → 1
- Card hover effects (shadow elevation, border highlight)
- Empty state when no results match filters
- Smooth transitions on filter changes

---

## 5. Animal Details Page

**File**: `src/pages/AnimalDetails.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Animal Header** | Name, ID, shed, breed, age, lactation number | `ANIMALS` array by ID param |
| **Current Vitals** | SCC, milk yield, activity %, rumination %, temperature, humidity | `ANIMALS` + `animalTimeSeries` |
| **Threshold Meters** | Horizontal bars showing value vs. threshold for each metric | `detectionService.js` thresholds |
| **Risk Score Display** | Large circular/pill risk score with level label | `animal.riskScore` |
| **Prediction Badge** | AI confidence percentage | `predictionService.js` |
| **Early Indicators** | Set of early warning signals detected by AI | `predictionService.js` contributing factors |
| **Risk Cascade** | 5-day risk trajectory visualization | Generated cascade data |
| **Contributing Factors** | Weighted breakdown of what drives the risk score | `predictionService.js` |
| **Pattern Detector** | Detected patterns (SCC spike, yield decline, behavior change, thermal elevation, combined risk) | `analysisService.js` `detectPatterns()` |
| **Correlation Insights** | Relevant factor correlations for this animal | `analysisService.js` `getCorrelationInsights()` |
| **Prediction Recommendations** | AI-generated recommendations based on risk level | `predictionService.js` `buildRecommendations()` |
| **Prevention Actions** | Actionable prevention tasks with deadlines | `preventionService.js` `getPreventionActions()` |
| **Intervention Timeline** | Timeline of recommended interventions with status toggles | Prevention actions rendered in timeline |
| **Vet Escalation** | Contact vet button, shareable alert message, mark escalated | Built-in escalation component |
| **Suggestion Cards** | Expandable recommendation cards with steps | `SuggestionCard.jsx` |

### Sub-Components Used
- `PredictionBadge` — confidence bar
- `ThresholdMeter` — per-metric threshold visualization
- `EarlyIndicators` — early warning signal cards
- `RiskCascade` — 5-day risk trajectory
- `PatternDetector` — pattern cards with confidence bars
- `CorrelationBadge` — correlation strength visualization
- `SuggestionCard` — expandable recommendation cards with progress
- `VetEscalation` — vet contact panel with share/copy
- `InterventionTimeline` — chronological action timeline
- `EscalationBadge` — escalation level indicator

---

## 6. Alerts — PREDICT

**File**: `src/pages/Alerts.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Alert Center** | List of all AI-generated alerts for the herd | `ALERTS` array (mock data with realistic scenarios) |
| **Severity Filtering** | Filter by: All, Critical, Warning, Notice | Client-side filter on `alert.severity` |
| **Status Filtering** | Filter by: Open, Acknowledged, Resolved | Client-side filter on `alert.status` |
| **Alert Detail Cards** | Each card shows: animal ID, alert type, severity, sensor data, timestamp, description | Individual alert objects |
| **Risk Score Display** | Shows the animal's risk score at time of alert | Linked to `ANIMALS` data |
| **Acknowledge Action** | Button to acknowledge an alert (updates status) | Local state management |
| **Resolve Action** | Button to mark alert as resolved | Local state management |
| **Badge Count** | Open alert count shown in sidebar | `ALERTS.filter(a => a.status === 'open').length` |

### Alert Types (from mock data)
- **Mastitis Risk Detected** — SCC elevated, risk score high
- **SCC Spike** — Sudden increase in somatic cell count
- **Low Milk Yield** — Milk production below threshold
- **Activity Drop** — Behavioral anomaly detected
- **Temperature Spike** — Fever/inflammation indicator
- **Combined Risk** — Multiple factors converging
- **Humidity Alert** — Environmental threshold breach
- **Vet Visit Scheduled** — Calendar/reminder type

### UI/UX Elements
- Severity color coding (red = critical, honey = warning, green = notice)
- Alert count badges with pulse animation
- Expandable alert cards with full detail
- Time-relative timestamps ("2h ago", "Just now")
- Sidebar badge showing unread alert count

---

## 7. Herd Analytics — ANALYZE

**File**: `src/pages/HerdAnalytics.jsx`

### Features

| Feature | Description | Data Source | UI Elements |
|---------|-------------|-------------|-------------|
| **Correlation Analysis** | Cross-factor correlation matrix (SCC↔Yield, Activity↔Rumination, Temp↔Humidity, SCC↔Temp, Previous Mastitis↔Risk) | `analysisService.js` `analyzeCorrelations()` | `CorrelationBadge` components with strength bars |
| **Pattern Detection** | Herd-wide pattern scan: SCC spikes, yield decline, behavior change, thermal elevation, combined risk | `analysisService.js` `detectPatterns()` + `getHerdPatterns()` | Pattern cards grouped by type |
| **Shed Comparison** | Ranked comparison of all sheds by risk score | `analysisService.js` `getShedComparison()` | `ShedComparison` component with ranking |
| **Seasonal Risk** | Risk assessment based on current season (Monsoon: HIGH, Summer: MODERATE, Winter: LOW) | `analysisService.js` `getSeasonalRisk()` | `SeasonalRisk` component with factor bars |
| **Herd Statistics** | Total animals, avg risk, high-risk count, healthy count | Computed from `ANIMALS` | KPI stat cards |
| **Factor Correlation Insights** | Per-factor analysis with strength, direction, description | `analysisService.js` | Badge-style cards with color-coded strength |

### Sub-Components Used
- `CorrelationBadge` — factor pair with strength bar
- `ShedComparison` — ranked shed comparison table
- `SeasonalRisk` — seasonal risk with factor bars and comparison
- `PatternDetector` — pattern cards with confidence

### UI/UX Elements
- Tabbed interface (Correlations, Patterns, Sheds, Seasonal)
- Color-coded correlation strength (green ≥70%, honey ≥50%, sand <50%)
- Animated bars for seasonal factors
- Rank badges (#1, #2, #3) for shed comparison

---

## 8. Milk Quality — TRACK

**File**: `src/pages/MilkQuality.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Milk Yield Overview** | Current yield, trend, per-shed breakdown | `ANIMALS` + time series |
| **SCC Monitoring** | Somatic cell count tracking per animal | `ANIMALS` SCC values |
| **Quality Grading** | Milk quality classification based on SCC thresholds | Computed: A-grade (<100k), B-grade (100-200k), C-grade (200-400k), Reject (>400k) |
| **Yield Trend Chart** | 30-day milk yield trend visualization | `animalTimeSeries` |
| **SCC Distribution** | Histogram showing SCC distribution across herd | Computed from `ANIMALS` |
| **Per-Animal Milk Data** | Individual animal milk quality breakdown | Linked to animal details |
| **Quality Alerts** | Automatic flags for animals with deteriorating milk quality | Threshold-based detection |

### UI/UX Elements
- Quality grade badges with color coding (green=A, honey=B, orange=C, red=Reject)
- Trend sparklines for yield data
- SCC threshold indicators
- Herd average vs. individual comparison

---

## 9. Environment Monitoring — MONITOR

**File**: `src/pages/Environment.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Temperature Monitoring** | Real-time temperature readings per shed | `SHEDS` environment data |
| **Humidity Monitoring** | Humidity levels per shed with threshold alerts | `SHEDS` environment data |
| **Shed Environment Cards** | Per-shed environment summary (temp, humidity, ventilation status) | Mock shed data |
| **Temperature Trend** | Temperature trend over 24h for each shed | Mock time series |
| **Humidity Alerts** | Flags when humidity exceeds safe threshold (>75%) | Threshold-based |
| **Environmental Risk Score** | Combined environment risk per shed | Computed from temp + humidity |
| **Ventilation Status** | Air quality indicator per shed | Mock data |

### UI/UX Elements
- Large temperature/humidity readout displays
- Color-coded threshold meters
- Trend arrows (rising/falling)
- Alert badges for threshold breaches
- Shed comparison cards

---

## 10. Worker Hygiene — ANALYZE

**File**: `src/pages/WorkerHygiene.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Worker Compliance Cards** | Per-worker hygiene compliance scoring | `workerData.js` mock data |
| **Hygiene Checklist** | Pre-milking hygiene steps checklist (hand wash, PPE, equipment sanitization) | Checklist data |
| **Compliance Score** | 0–100% hygiene compliance score per worker | Computed from checklist |
| **Compliance Trends** | Weekly/monthly compliance trend | Mock trend data |
| **PPE Status** | Personal protective equipment tracking | Worker data |
| **Alert on Non-Compliance** | Automatic alerts for workers below threshold | Threshold-based |
| **Training Records** | Last training date, certification status | Worker data |

### UI/UX Elements
- Progress rings for compliance scores
- Checkmark animations for completed checklist items
- Color-coded compliance (green ≥90%, honey 70-90%, red <70%)
- Worker avatar placeholders with initials

---

## 11. AI Simulator — SIMULATE

**File**: `src/pages/Simulator.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Interactive Risk Sliders** | Sliders for: SCC, milk yield change, activity change, rumination change, temperature, humidity | User input → `predictionService.predictMastitisRisk()` |
| **Previous Mastitis Toggle** | On/off toggle for mastitis history | User input |
| **Feeding Quality Slider** | Nutrition quality rating (0–100) | User input |
| **Housing Quality Slider** | Housing/bedding hygiene rating (0–100) | User input |
| **Real-Time Prediction** | Live risk score update as sliders change | `predictionService.predictMastitisRisk()` |
| **Risk Level Display** | None / Low / Medium / High / Critical with color coding | Computed from risk score |
| **Contributing Factors** | Weighted breakdown showing which factors contribute most | From prediction result |
| **Prevention Recommendations** | Context-aware recommendations based on current risk level | `buildRecommendations()` |
| **Prediction Window** | Estimated time window for risk manifestation | "7-14 Days" or "14+ Days" |
| **Scenario Comparison** | Side-by-side comparison of different input scenarios | Local state |

### Sub-Components Used
- `PredictionBadge` — confidence percentage bar
- `EarlyIndicators` — early warning signals
- `RiskCascade` — 5-day trajectory
- `SuggestionCard` — expandable recommendations

### UI/UX Elements
- Range sliders with live value labels
- Animated risk score counter (color transitions as risk changes)
- Smooth re-renders on slider change (debounced)
- Recommendation cards that change based on risk level
- Warning banners for high-risk scenarios

---

## 12. Detection — DETECT

**File**: `src/pages/Detection.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Animal Selection** | Dropdown to select an animal for detection analysis | `ANIMALS` array |
| **Anomaly Detection** | 5-sensor anomaly detection: SCC, Milk Yield, Activity, Rumination, Temperature | `detectionService.js` `detectAnomalies()` |
| **Threshold Display** | Each sensor's current value vs. threshold | `THRESHOLDS` config in `detectionService.js` |
| **Anomaly Score** | 0–100 composite anomaly score across all sensors | `getAnomalyScore()` |
| **Detection Status** | Normal / Watch / Alert status with live indicator | `getDetectionStatus()` |
| **Anomaly Panel** | Detailed list of detected anomalies with severity, deviation %, timestamp | `AnomalyPanel` component |
| **Threshold Meters** | Visual bars showing how close each metric is to its threshold | `ThresholdMeter` component |
| **Sensor Health** | Live sensor status grid (online/degraded/offline with uptime %) | `getSensorHealth()` mock |
| **Sensor Grid** | 6 simulated sensors: SCC Sensor, Temperature Probe, Activity Collar, Rumination Monitor, Environment Hub, Milking Meter | Mock sensor data |
| **Detection History** | Historical detection events for selected animal | Mock history data |
| **Severity Classification** | Notice (<10% deviation), Warning (10-20%), Critical (>20%) | Threshold deviation logic |

### Thresholds (from `detectionService.js`)

| Sensor | Threshold | Direction | Unit |
|--------|-----------|-----------|------|
| SCC | 200 | greater than | k cells/mL |
| Milk Yield | 7.0 | less than | L |
| Activity | -10 | less than | % change |
| Rumination | -8 | less than | % change |
| Temperature | 39.0 | greater than | °C |

### Severity Weights
- Critical: 35 points
- Warning: 20 points
- Notice: 8 points

### Sub-Components Used
- `AnomalyPanel` — list of detected anomalies
- `ThresholdMeter` — per-sensor threshold visualization
- `DetectionBadge` — status indicator with pulse animation
- `SensorHealth` — sensor grid with status dots

### UI/UX Elements
- Animated alert dots (pulse for critical, static for warning/notice)
- Color-coded severity (red = critical, honey = warning, green = notice)
- Live-updating sensor readings (simulated)
- Time-relative timestamps ("Just now", "5s ago")
- Sensor uptime percentages

---

## 13. Enhanced Detection

**File**: `src/pages/DetectionEnhanced.jsx`

An advanced version of the Detection page with additional features beyond the basic detection page.

### Features

| Feature | Description |
|---------|-------------|
| **Enhanced Anomaly Panel** | More detailed anomaly cards with expanded metrics |
| **Detection Timeline** | Chronological view of detection events |
| **Advanced Filtering** | Filter anomalies by sensor type, severity, time range |
| **Multi-Animal Detection** | Compare detection across multiple animals simultaneously |
| **Export Detection Report** | Generate detection report for selected animal/shift |

---

## 14. Analytics — INSIGHTS

**File**: `src/pages/Analytics.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Herd Risk Overview** | Aggregate herd health statistics | Computed from `ANIMALS` |
| **SCC Analytics** | SCC distribution, trends, and outliers across the herd | `ANIMALS` + time series |
| **Yield Analytics** | Milk yield performance per shed and per animal | Time series data |
| **Activity Analytics** | Behavioral analytics — activity and rumination patterns | Time series data |
| **Risk Heatmap** | Visual risk distribution across sheds and animals | Computed risk matrix |
| **Trend Analysis** | 30-day trends for key metrics | Time series aggregation |
| **Correlation Matrix** | Heatmap-style correlation display between health factors | `analysisService.js` |
| **Seasonal Analysis** | Seasonal risk patterns and factor analysis | `getSeasonalRisk()` |
| **Shed Performance** | Per-shed performance comparison | `getShedComparison()` |

### UI/UX Elements
- Multi-tab analytics dashboard
- Interactive charts (custom SVG-based)
- Heatmap visualizations
- Correlation matrix with color intensity
- Trend sparklines

---

## 15. Reports — EXPORT

**File**: `src/pages/Reports.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Report Generation** | Generate comprehensive herd health reports | All data sources |
| **PDF Export** | Export reports as PDF documents | Client-side PDF generation |
| **CSV Export** | Export animal data, alerts, detection logs as CSV | Data serialization |
| **Date Range Selection** | Select report date range | User input |
| **Report Sections** | Configurable sections: Animals, Alerts, Detection, Analytics, Environment, Hygiene | Toggle sections on/off |
| **Report Preview** | Preview report before export | Rendered HTML preview |
| **Scheduled Reports** | (UI placeholder) Schedule recurring report generation | — |

### UI/UX Elements
- Report configuration form
- Section toggle checkboxes
- Date range picker
- Print-friendly preview
- Download buttons with format options

---

## 16. Settings — CONFIG

**File**: `src/pages/Settings.jsx`

### Features

| Feature | Description | Data Source |
|---------|-------------|-------------|
| **Farm Settings** | Farm name, location, contact info | Local state |
| **Alert Thresholds** | Configure SCC, yield, activity, temperature thresholds | Editable threshold config |
| **Notification Preferences** | SMS, IVR, push notification preferences | User preference state |
| **Audio Settings** | Alert sound type, volume control | `audio.js` |
| **Theme Settings** | Open theme customizer panel | `ThemeCustomizer` |
| **Language Settings** | English / Hindi preference | `useI18n()` context |
| **Data Management** | Clear local data, reset to defaults | localStorage operations |
| **Accessibility** | High contrast, reduce motion, font scaling | Theme customizer settings |

### UI/UX Elements
- Tabbed settings interface
- Toggle switches for preferences
- Range sliders for thresholds and volume
- Dropdown selectors for options
- Save/reset buttons with confirmation

---

## 17. AI Chat Assistant (Floating)

**File**: `src/components/common/AiChatAssistant.jsx`

### Features

| Feature | Description |
|---------|-------------|
| **Floating Toggle Button** | Fixed position bottom-right, circular button with MessageSquare icon |
| **Chat Panel** | 340–360px wide, 460px tall, rounded panel with shadow |
| **Message History** | Persistent message list during session |
| **Bot Responses** | 8 pre-programmed responses with regex pattern matching |
| **Thinking Animation** | Animated dots while "processing" user input |
| **Auto-scroll** | Auto-scrolls to newest message |
| **Enter-to-send** | Keyboard shortcut for sending messages |
| **Close/Reopen** | Toggle chat panel without losing message history |

### Supported Topics (Q&A Pairs)
1. What is mastitis? — Definition, symptoms, AI detection approach
2. How does detection work? — IoT sensors, ML model, 6+ parameters
3. Alerts/notifications — SMS, IVR, push notifications
4. Herd size — "47 animals across 3 sheds"
5. Prevention — Early detection, preventive actions, simulator page
6. Sensors/IoT — SCC monitors, smart collars, environmental sensors
7. Cost/pricing — Affordability, government subsidies
8. Language support — English/Hindi, regional languages coming

### UI/UX Elements
- Bot/user avatar circles with icons
- Right-aligned user bubbles (forest-green), left-aligned bot bubbles (sand)
- Green pulse dot indicating "online" status
- Input with placeholder text
- Send button with disabled state

---

## 18. Onboarding Tour

**File**: `src/components/common/OnboardingTour.jsx`

### Features

| Feature | Description |
|---------|-------------|
| **Step-by-Step Tour** | Guided walkthrough of the application |
| **Highlighted Elements** | Spotlight effect on UI elements being explained |
| **Progress Indicator** | Step counter (e.g., "Step 3 of 8") |
| **Next/Previous Navigation** | Navigate through tour steps |
| **Skip Tour** | Option to skip and go directly to dashboard |
| **Tooltip Popovers** | Explanatory tooltips with descriptions |
| **Auto-start** | Optionally auto-start for first-time users |

---

## 19. File & Directory Inventory

### `src/components/common/` — 16 Shared Components

| File | Purpose |
|------|---------|
| `OnboardingTour.jsx` | First-time user guided tour |
| `AiChatAssistant.jsx` | Floating AI chat widget (8 Q&A pairs) |
| `ThemeCustomizer.jsx` | Full theme customization modal (22 presets, custom colors, fonts, accessibility) |
| `PredictionBadge.jsx` | AI confidence percentage bar |
| `RiskCascade.jsx` | 5-day risk trajectory visualization (horizontal desktop / vertical mobile) |
| `EarlyIndicators.jsx` | Early warning signal cards with icon grid |
| `AnomalyPanel.jsx` | Anomaly list with severity, value, threshold, deviation |
| `CorrelationBadge.jsx` | Factor-pair correlation strength bar |
| `PatternDetector.jsx` | Pattern detection cards with confidence bars |
| `SensorHealth.jsx` | Sensor grid with status dots and uptime |
| `SeasonalRisk.jsx` | Seasonal risk assessment with factor bars |
| `ShedComparison.jsx` | Ranked shed comparison with delta indicators |
| `DetectionBadge.jsx` | Detection status badge (normal/watch/alert with pulse) |
| `ThresholdMeter.jsx` | Horizontal threshold progress meter |
| `SuggestionCard.jsx` | Expandable recommendation card with checkbox steps |
| `VetEscalation.jsx` | Vet contact panel with share/copy/escalate |
| `InterventionTimeline.jsx` | Chronological intervention timeline with status toggles |

### `src/components/shared/` — 4 Shared Components

| File | Purpose |
|------|---------|
| `PreventionCard.jsx` | Prevention score card with gradient header, level badge, factor list |
| `QuarantineTable.jsx` | Quarantine/segregation table with animal links |
| `ActionTimeline.jsx` | Action item timeline with priority pills and completion toggle |
| `EscalationBadge.jsx` | Escalation level badge (monitor/watch/escalate) |

### `src/components/layout/` — 4 Layout Components

| File | Purpose |
|------|---------|
| `Layout.jsx` | Main layout wrapper (sidebar + topbar + content + mobile bottom nav) |
| `Sidebar.jsx` | Navigation sidebar with feature tags, farm logo, badge counts |
| `Topbar.jsx` | Top bar with farm selector, stats, notifications, theme toggle, language |
| `BottomNav.jsx` | Mobile bottom tab navigation (5 items) |

### `src/context/` — 1 Context

| File | Purpose |
|------|---------|
| `ThemeContext.jsx` | Theme provider (darkMode state + toggleTheme) |

### `src/data/` — 3 Data Files

| File | Purpose |
|------|---------|
| `mockData.js` | Comprehensive mock data: ANIMALS (47), SHEDS, HERD_STATS, ALERTS, FARMS, ENVIRONMENT, MILK_QUALITY, WORKER_HYGIENE data + time series generators |
| `workerData.js` | Worker-specific mock data: worker profiles, hygiene checklists, compliance scores |
| `themeSystems.js` | 22 theme presets with color palettes, fonts, categories |

### `src/utils/` — 3 Utility Files

| File | Purpose |
|------|---------|
| `riskUtils.js` | Risk scoring utilities: `clamp()`, `levelFromScore()`, risk metadata, color helpers |
| `audio.js` | Web Audio API integration for alert sounds |
| `toast.js` | Toast notification system (success, error, warning, info variants) |

### `src/services/` — 4 Service Files

| File | Purpose |
|------|---------|
| `predictionService.js` | AI mastitis risk prediction with weighted factors (SCC, yield, activity, rumination, temperature, humidity, history, nutrition, housing) |
| `detectionService.js` | Real-time anomaly detection with 5 thresholds and severity classification |
| `analysisService.js` | Cross-factor correlation analysis, pattern detection (SCC spike, yield decline, behavior change, thermal elevation, combined risk), seasonal risk, shed comparison, herd patterns |
| `preventionService.js` | Prevention posture scoring, quarantine list, prevention actions, escalation levels |

---

## 20. Third-Party Dependencies

### Core Framework
- **React** (v18+) — UI library
- **React Router** (v6) — Client-side routing

### Styling
- **Tailwind CSS** — Utility-first CSS framework
- **lucide-react** — Icon library (consistent iconography throughout)
- **Google Fonts** — Inter, Manrope, Karla, Nunito, Rubik, Lato, Work Sans, IBM Plex Sans, Source Sans 3, Poppins, Quicksand, Mulish, Fredoka, Archivo, Lobster Two, Libre Baskerville, Playfair Display, and 15+ more

### Charts & Data Visualization
- **Custom SVG charts** — All charts built with inline SVG (no external chart library)
- **CSS-based bar charts** — Progress bars, distribution bars, sparklines using Tailwind + CSS

### Utilities
- **Web Audio API** — Native browser API for audio alerts (`audio.js`)
- **Web Share API** — Native browser sharing for vet escalation (`VetEscalation.jsx`)
- **Clipboard API** — Copy-to-clipboard for theme export, vet messages
- **localStorage** — Theme config persistence, data caching
- **Blob/URL API** — JSON theme export as downloadable file

### Not Third-Party
- No chart library (Recharts, Chart.js, D3) — custom SVG
- No state management library (Redux, Zustand) — React Context + useState
- No form library — controlled inputs
- No animation library — CSS transitions + Tailwind utilities

---

## 21. Data Strategy: Mock vs. Real Logic

### Fully Simulated (Mock Data)

| Data | File | Notes |
|------|------|-------|
| **47 Animals** | `mockData.js` — `ANIMALS` array | Realistic Indian cattle breeds (Gir, HF cross, Jersey cross, Sahiwal, Murrah buffalo) with realistic SCC, yield, activity values |
| **3 Sheds (A, B, C)** | `mockData.js` — `SHEDS` | Named sheds with animal counts, risk scores, locations |
| **Alerts** | `mockData.js` — `ALERTS` | 15+ realistic alert scenarios with timestamps, severity, animal references |
| **Farms** | `mockData.js` — `FARMS` | 3 farm names (Swami Dairy Farm, Shree Gopal Dairy, Krishna Gaushala) |
| **Worker Data** | `workerData.js` | 8 workers with names, roles, compliance scores, training records |
| **Environment** | `mockData.js` — `ENVIRONMENT` | Per-shed temperature, humidity, ventilation, ammonia levels |
| **Sensor Health** | `detectionService.js` — `SENSORS` | 6 sensors with mock status and readings |
| **Time Series** | `mockData.js` — `animalTimeSeries()` | Generated 30-day time series for SCC, yield, activity, rumination, temperature |

### Real Logic (Deterministic Algorithms)

| Logic | File | Description |
|-------|------|-------------|
| **Mastitis Risk Prediction** | `predictionService.js` | Weighted formula with 9 factors (SCC weight: 28%, yield: 16%, activity: 11%, rumination: 8%, temp: 10%, humidity: 5%, history: 8%, nutrition: 8%, housing: 6%). Returns risk score 0-99, level, prediction window, contributing factors sorted by weight, recommendations |
| **Anomaly Detection** | `detectionService.js` | Threshold comparison with severity bands (>20% = critical, >10% = warning). Composite anomaly score (0-100) from weighted severity points |
| **Correlation Analysis** | `analysisService.js` | 5 predefined correlations with dynamic strength adjustment based on herd characteristics |
| **Pattern Detection** | `analysisService.js` | 4 pattern types (SCC spike, yield decline, behavior change, thermal elevation) + combined risk detection. All with configurable thresholds and confidence scoring |
| **Seasonal Risk** | `analysisService.js` | Month-based seasonal classification (Monsoon: HIGH, Summer: MODERATE, Post-Monsoon: MODERATE, Winter: LOW) |
| **Shed Comparison** | `analysisService.js` | Ranked comparison with delta-from-average, best/worst identification |
| **Prevention Scoring** | `preventionService.js` | Herd prevention posture (0-100) penalized by average risk, high-risk shed count, rewarded by hygiene quality |
| **Quarantine Logic** | `preventionService.js` | Risk score ≥60 AND (SCC >200 OR temp >39.0) → quarantine flag |
| **Escalation Levels** | `preventionService.js` | monitor/watch/escalate based on risk score and mastitis history |
| **Risk Level Mapping** | `riskUtils.js` | 0=NONE, 1-19=LOW, 20-44=MEDIUM, 45-69=HIGH, 70-99=CRITICAL |

### Hybrid (Mock Input → Real Processing)

| Feature | Description |
|---------|-------------|
| **Theme Resolution** | `themeSystems.js` + `resolveTheme()` — presets can be overridden with custom colors, CSS vars, fonts |
| **Report Generation** | Template-based with mock data serialized to PDF/CSV |
| **AI Chat** | Regex-matched static responses (simulated AI) |
| **Simulator** | User-adjusted inputs fed into real `predictMastitisRisk()` algorithm |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Routes | 13 |
| Layout Components | 4 |
| Shared Components | 21 |
| Page Components | 13 |
| Context Providers | 1 |
| Data Files | 3 |
| Service Files | 4 |
| Utility Files | 3 |
| i18n Files | 1 |
| Theme Presets | 22 |
| Supported Languages | 2 (English, Hindi) |
| Mock Animals | 47 |
| Sheds | 3 |
| Alert Types | 8 |
| Worker Profiles | 8 |
| Simulated Sensors | 6 |
| AI Chat Q&A Pairs | 8 |
| Correlation Definitions | 5 |
| Pattern Detection Types | 4 (+ 1 combined) |
| Threshold Monitored Sensors | 5 |
| Prevention Action Templates | 6 |

---

## Key Design Patterns

1. **Component Composition**: Small, focused components (`ThresholdMeter`, `PredictionBadge`, `CorrelationBadge`) composed into larger feature pages
2. **Service Layer**: Business logic separated into `services/` directory — `predictionService`, `detectionService`, `analysisService`, `preventionService`
3. **i18n-First**: Every user-facing string uses `t()` from `useI18n()` hook
4. **Theme-Aware**: All components use Tailwind's `dark:` variants and custom theme CSS variables
5. **Responsive-First**: Mobile bottom nav, responsive grids, horizontal→vertical layout switches
6. **Accessibility**: High contrast mode, reduce motion, font scaling, keyboard shortcuts (Shift+T for theme)
7. **Mock-Transparent**: Clear disclaimers that AI predictions are prototype simulations, not clinical validated models
